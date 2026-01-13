// /api/install.js
import axios from 'axios';
import { saveTokens, call, getFreshTokens } from '../utils/b24.js';

// Configuração de ambiente
const CLIENT_ID = process.env.B24_CLIENT_ID || process.env.B_CLIENT_ID;
const CLIENT_SECRET = process.env.B24_CLIENT_SECRET || process.env.B_CLIENT_SECRET;

export default async function handler(req, res) {
    const params = { ...req.query, ...req.body };
    console.log('[Install/Router] Requisição recebida:', params);

    const domain = params.domain || params.DOMAIN;
    const memberId = params.member_id || params.MEMBER_ID || req?.body?.auth?.member_id || req?.query?.member_id;
    const placement = params.PLACEMENT;
    const authId = params.AUTH_ID;
    const code = params.code;
    const appSid = req.query.APP_SID;
    const authType = req.query.type;
    
    // --- ROTEAMENTO PRINCIPAL ---

    // 1. Clique no Botão dentro do CRM (Empresa)
    if (placement && placement === 'CRM_COMPANY_DETAIL_TOOLBAR') {
        if (!memberId) return res.status(400).send('Erro: Identificação do membro ausente.');
        await handlePlacementClick(req, res);
    }
    // 2. Instalação/Atualização via App Local (Token Existente)
    else if (authId && memberId && domain) {
        if (!placement || placement === 'DEFAULT') {
             await handleLocalInstall(req, res, params);
        } else {
             res.status(200).send('Recebido (AUTH_ID com placement não padrão)');
        }
    }
    // 3. Instalação via OAuth (Código de Autorização)
    else if (code && domain && memberId && !authId && placement !== 'CRM_COMPANY_DETAIL_TOOLBAR') {
        await handleOAuthInstall(req, res, params);
    }
    // 4. Fluxo de Seleção e Formulário (Lógica Principal de UI)
    else if (authType && memberId) {
         await handlePostSelection(req, res);
    }
    // 5. Verificação de Disponibilidade (Ping)
    else if (appSid) {
        res.status(200).send('Endpoint de instalação acessível.');
    }
    else {
        res.status(200).send('Tipo de requisição não processada.');
    }
}

// ==================================================================
// FUNÇÕES DE INSTALAÇÃO
// ==================================================================

async function handleLocalInstall(req, res, params) {
    const domain = params.domain || params.DOMAIN;
    const memberId = params.member_id || params.MEMBER_ID || req?.body?.auth?.member_id;

    try {
        const tokens = {
            access_token: params.AUTH_ID,
            refresh_token: params.REFRESH_ID,
            expires_in: params.AUTH_EXPIRES ? Math.floor(Date.now() / 1000) + parseInt(params.AUTH_EXPIRES, 10) : Math.floor(Date.now() / 1000) + 3600,
            domain: domain,
            member_id: memberId
        };
        
        await saveTokens(tokens);
        await registerPlacement(req.headers.host, tokens);

        res.setHeader('Content-Type', 'text/html');
        if (params.PLACEMENT === 'DEFAULT') {
             res.send('<head><script src="//api.bitrix24.com/api/v1/"></script><script>window.BX=window.parent.BX;if(BX){BX.ready(function(){BX.SidePanel.Instance.close();})}</script></head><body>Instalado/Atualizado! Fechando...</body>');
        } else {
             res.send('Atualização Local Processada.');
        }
    } catch (error) {
        console.error('[Install Local] Erro:', error);
        res.status(500).send(`Erro (App Local): ${error.message}`);
    }
}

async function handleOAuthInstall(req, res, params) {
     const domain = params.domain;
     const memberId = params.member_id;
     const code = params.code;

     try {
         const tokenUrl = `https://${domain}/oauth/token/`;
         const tokenParams = { grant_type: 'authorization_code', client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code: code };
         const response = await axios.post(tokenUrl, null, { params: tokenParams });
         const tokenData = response.data;
         const tokens = {
             access_token: tokenData.access_token, refresh_token: tokenData.refresh_token,
             expires_in: Math.floor(Date.now() / 1000) + tokenData.expires_in,
             domain: tokenData.domain, member_id: tokenData.member_id
         };
         
         await saveTokens(tokens);
         await registerPlacement(req.headers.host, tokens);

         res.setHeader('Content-Type', 'text/html');
         res.send('<head><script src="//api.bitrix24.com/api/v1/"></script><script>window.BX=window.parent.BX;if(BX){BX.ready(function(){BX.SidePanel.Instance.close();})}</script></head><body>Instalado! Fechando...</body>');
     } catch (error) {
         console.error('[Install OAuth] Erro:', error);
         res.status(500).send(`Erro (OAuth): ${error.message}`);
     }
}

async function handlePlacementClick(req, res) {
    const memberId = req?.body?.member_id || req?.body?.auth?.member_id || req?.query?.member_id;
    const simulatedReqForTokens = { body: req.body, query: { ...req.query, member_id: memberId } };

    try {
        const authTokens = await getFreshTokens(simulatedReqForTokens);
        if (!authTokens) return res.status(401).send('Erro: Falha na autenticação.');

        let companyId;
        if (req.body.PLACEMENT_OPTIONS) {
            try { companyId = JSON.parse(req.body.PLACEMENT_OPTIONS).ID; } catch (e) {}
        }
        if (!companyId) return res.status(400).send('ID da Empresa não encontrado.');

        res.setHeader('Content-Type', 'text/html');
        // Passo 1: Mostra a seleção de tipo (PF/PJ/Sócios)
        res.send(getSelectionHtml(companyId, authTokens.member_id));
    } catch (error) {
        res.status(500).send(`Erro: ${error.message}`);
    }
}

// ==================================================================
// LOGICA DE NAVEGAÇÃO (Seleção -> Quantidade -> Formulário)
// ==================================================================
async function handlePostSelection(req, res) {
    const authType = req.query.type;
    const step = req.query.step; // Parâmetro para controlar em qual tela estamos
    const companyId = req.query.companyId;
    const memberId = req.query.member_id;

    if (!memberId) return res.status(400).send('Erro: Identificação do membro ausente.');

    // PASSO 2: Se não tiver 'step', mostra a tela de PERGUNTAR QUANTIDADES
    if (!step) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(getQuantitySelectionHtml(authType, companyId, memberId));
    }

    // PASSO 3: Se step for 'form', gera o formulário final dinâmico
    const simulatedReqForTokens = { body: {}, query: { ...req.query } };

    try {
        const authTokens = await getFreshTokens(simulatedReqForTokens);
        if (!authTokens) return res.status(401).send('Erro: Falha na autenticação.');

        // Busca dados da empresa para pré-preenchimento
        let contratanteData = { nome: '', cpf: '', telefone: '', email: '' };
        let pjData = { razaoSocial: '', cnpj: '', telefone: '', email: '', endereco: '' };

        if (companyId) {
            try {
                 const company = await call('crm.company.get', { id: companyId }, authTokens);
                 if (company) {
                      // Dados para PF
                      contratanteData = {
                          nome: company.TITLE || '',
                          telefone: (company.PHONE?.[0]?.VALUE) || '',
                          email: (company.EMAIL?.[0]?.VALUE) || '',
                          cpf: company.UF_CRM_66C37392C9F3D || ''
                      };
                      // Dados para PJ
                      pjData = {
                          razaoSocial: company.TITLE || '',
                          telefone: (company.PHONE?.[0]?.VALUE) || '',
                          email: (company.EMAIL?.[0]?.VALUE) || '',
                          cnpj: company.UF_CRM_66C37392C9F3D || '',
                          endereco: '' 
                      };
                 }
            } catch(e){ console.error("Erro ao buscar dados da empresa:", e.message); }
        }

        // Recebe as quantidades da tela anterior
        const qtdImoveis = parseInt(req.query.qtdImoveis || 1, 10);
        const qtdSocios = parseInt(req.query.qtdSocios || 1, 10);

        res.setHeader('Content-Type', 'text/html');
        
        // Renderiza o HTML correto
        if (authType === 'pj') {
            res.send(getFormHtmlPJ(pjData, qtdImoveis));
        } else {
            // Solteiro/Casado (qtdSocios = 1) ou Sócios (qtdSocios > 1) usam a mesma função
            res.send(getFormHtml(authType, contratanteData, qtdSocios, qtdImoveis));
        }

    } catch (error) {
        console.error('Erro no PostSelection:', error);
        res.status(500).send(`Erro: ${error.message}`);
    }
}

// ==================================================================
// GERADORES DE HTML (TEMPLATES)
// ==================================================================

// CSS Global limpo e responsivo
const commonCss = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; color: #333; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    h2 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-top: 0; }
    h3 { color: #007bff; margin-top: 25px; margin-bottom: 15px; font-size: 1.1em; border-left: 4px solid #007bff; padding-left: 10px; }
    
    /* GRID SYSTEM */
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; align-items: end; }
    .span-2 { grid-column: span 2; }
    .span-all { grid-column: 1 / -1; }
    
    label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 5px; }
    input, select { width: 100%; padding: 10px; border: 1px solid #dfe3e9; border-radius: 4px; box-sizing: border-box; font-size: 14px; height: 40px; }
    input:focus, select:focus { border-color: #007bff; outline: none; box-shadow: 0 0 0 2px rgba(0,123,255,0.1); }
    
    /* BLOCO DE UNIDADE */
    .imovel-row { background: #f8f9fa; padding: 15px; border: 1px solid #e9ecef; border-radius: 6px; margin-bottom: 15px; }
    .imovel-row h4 { margin: 0 0 10px 0; font-size: 14px; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; }
    
    /* BOTÕES */
    .btn-group { text-align: center; margin-top: 30px; }
    button { background: #007bff; color: #fff; padding: 12px 25px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background 0.2s; }
    button:hover { background: #0056b3; }
    a.back-link { display: inline-block; margin-top: 15px; color: #6c757d; text-decoration: none; font-size: 14px; }
    a.back-link:hover { text-decoration: underline; }
    
    /* LINKS TELA INICIAL */
    a.menu-btn { display: block; background: #fff; border: 1px solid #007bff; color: #007bff; padding: 15px; margin-bottom: 10px; text-align: center; border-radius: 5px; text-decoration: none; font-weight: bold; transition: all 0.2s; }
    a.menu-btn:hover { background: #007bff; color: #fff; }
    
    @media (max-width: 600px) {
        .span-2, .span-all { grid-column: span 1; }
        .form-grid { grid-template-columns: 1fr; }
    }
`;

// 1. Tela de Seleção de Tipo
function getSelectionHtml(companyId, memberId) {
    const buildUrl = (type) => `/api/install?type=${type}${companyId ? '&companyId=' + companyId : ''}${memberId ? '&member_id=' + memberId : ''}`;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Selecionar Tipo</title><style>${commonCss}</style></head><body>
    <div class="container" style="max-width: 450px;">
        <h2>Nova Autorização de Venda</h2>
        <p style="text-align:center; color:#666; margin-bottom:20px;">Selecione o perfil do proprietário:</p>
        <a href="${buildUrl('solteiro')}" class="menu-btn">Pessoa Física (Individual)</a>
        <a href="${buildUrl('casado')}" class="menu-btn">Pessoa Física (Casado/União)</a>
        <a href="${buildUrl('socios')}" class="menu-btn">Pessoa Física (Vários Sócios)</a>
        <a href="${buildUrl('pj')}" class="menu-btn" style="border-color:#28a745; color:#28a745;">Pessoa Jurídica (Empresa)</a>
    </div>
    <script src="//api.bitrix24.com/api/v1/"></script><script>window.BX&&BX.ready(function(){BX.resizeWindow(500,550)})</script></body></html>`;
}

// 2. Tela de Quantidades (Middle Step)
function getQuantitySelectionHtml(type, companyId, memberId) {
     const formAction = `/api/install`;
     const showSociosInput = (type === 'socios');

     return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Configuração</title><style>${commonCss}</style></head><body>
     <div class="container" style="max-width: 450px;">
        <h2>Configuração Inicial</h2>
        <form action="${formAction}" method="GET">
            <input type="hidden" name="type" value="${type}">
            <input type="hidden" name="step" value="form">
            ${companyId ? `<input type="hidden" name="companyId" value="${companyId}">` : ''}
            ${memberId ? `<input type="hidden" name="member_id" value="${memberId}">` : ''}
            
            <div class="form-grid" style="grid-template-columns: 1fr;">
                ${showSociosInput ? `
                <div>
                    <label>Quantos sócios são proprietários?</label>
                    <input type="number" name="qtdSocios" min="2" value="2" required style="text-align:center;">
                </div>
                ` : `<input type="hidden" name="qtdSocios" value="1">`}

                <div>
                    <label>Quantos imóveis/unidades nesta autorização?</label>
                    <input type="number" name="qtdImoveis" min="1" value="1" required style="text-align:center;">
                </div>
            </div>

            <div class="btn-group">
                <button type="submit">Continuar</button><br>
                <a href="javascript:history.back()" class="back-link">Voltar</a>
            </div>
        </form>
     </div>
     <script src="//api.bitrix24.com/api/v1/"></script><script>window.BX&&BX.ready(function(){BX.resizeWindow(500,450)})</script></body></html>`;
}

// Helper: Gera HTML dos campos de Imóveis (Loop)
function getImovelFieldsHtml(qtdImoveis) {
    let html = `<div class="form-section"><h3>IMÓVEIS (${qtdImoveis})</h3>`;
    
    // Loop para gerar campos individuais (Unidades)
    for (let i = 0; i < qtdImoveis; i++) {
        const num = i + 1;
        html += `
        <div class="imovel-row">
            <h4>Unidade ${num}</h4>
            <div class="form-grid">
                <div class="span-2">
                    <label>Descrição do Imóvel:</label>
                    <input type="text" name="imovelDescricao_${i}" placeholder="Ex: Apartamento 10${num}, Bloco A">
                </div>
                <div>
                    <label>Valor de Venda (R$):</label>
                    <input type="number" name="imovelValor_${i}" step="0.01" placeholder="0.00">
                </div>
            </div>
        </div>`;
    }

    // Campos comuns ao empreendimento
    html += `
        <div style="background:#fdfdfd; padding:15px; border:1px dashed #ccc; border-radius:6px;">
            <h4 style="margin-top:0; color:#666;">Dados Gerais do Empreendimento</h4>
            <div class="form-grid">
                <div class="span-all"><label>Endereço do Empreendimento:</label><input type="text" name="imovelEndereco" placeholder="Rua, Nº, Bairro, Cidade - SC"></div>
                <div class="span-2"><label>Inscrição Imobiliária / Matrícula (Geral):</label><input type="text" name="imovelMatricula"></div>
                <div class="span-all"><label>Administradora de Condomínio:</label><input type="text" name="imovelAdminCondominio"></div>
                <div><label>Valor Condomínio (R$):</label><input type="number" name="imovelValorCondominio" step="0.01"></div>
                <div><label>Chamada de Capital:</label><input type="text" name="imovelChamadaCapital"></div>
                <div><label>Nº de parcelas:</label><input type="number" name="imovelNumParcelas"></div>
            </div>
        </div>
    </div>`;

    // Seção Contrato (Fixo)
    html += `<div class="form-section"><h3>CONTRATO</h3><div class="form-grid"><div><label>Prazo de exclusividade (dias):</label><input type="number" name="contratoPrazo" value="90"></div><div><label>Comissão (%):</label><input type="number" name="contratoComissaoPct" value="6" step="0.1"></div></div></div>`;
    
    return html;
}

// 3. Formulário Pessoa Física / Sócios
function getFormHtml(type, contratanteData, numSocios, qtdImoveis) {
    let contratanteHtml = '';
    const optionsEstCivil = `<option value="Solteiro(a)">Solteiro(a)</option><option value="Casado(a)">Casado(a)</option><option value="Divorciado(a)">Divorciado(a)</option><option value="Viúvo(a)">Viúvo(a)</option><option value="União Estável">União Estável</option>`;
    
    // Loop de Sócios
    for (let i = 0; i < numSocios; i++) {
        const prefix = numSocios > 1 ? `socio${i+1}` : 'contratante';
        const titulo = numSocios > 1 ? `SÓCIO ${i+1}` : 'CONTRATANTE';
        const nome = (i === 0) ? contratanteData.nome : '';
        const cpf = (i === 0) ? contratanteData.cpf : '';
        
        contratanteHtml += `
        <div class="form-section"><h3>${titulo}</h3><div class="form-grid">
            <div class="span-2"><label>Nome Completo:</label><input type="text" name="${prefix}Nome" value="${nome}"></div>
            <div><label>CPF:</label><input type="text" name="${prefix}Cpf" value="${cpf}"></div>
            <div><label>Profissão:</label><input type="text" name="${prefix}Profissao"></div>
            <div><label>Estado Civil:</label><select name="${prefix}EstadoCivil">${optionsEstCivil}</select></div>
            <div><label>Telefone:</label><input type="text" name="${prefix}Telefone" value="${i === 0 ? contratanteData.telefone : ''}"></div>
            <div class="span-all"><label>Endereço Residencial:</label><input type="text" name="${prefix}Endereco"></div>
            <div class="span-all"><label>Email:</label><input type="email" name="${prefix}Email" value="${i === 0 ? contratanteData.email : ''}"></div>
        </div></div>`;
    }

    const conjugeHtml = (type === 'casado') ? `<div class="form-section"><h3>CÔNJUGE</h3><div class="form-grid"><div class="span-2"><label>Nome:</label><input type="text" name="conjugeNome"></div><div><label>CPF:</label><input type="text" name="conjugeCpf"></div></div></div>` : '';

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Preencher Dados</title><style>${commonCss}</style></head><body>
    <div class="container">
        <form action="/api/generate-pdf" method="POST" target="_blank">
            <h2>Dados da Autorização (PF)</h2>
            <input type="hidden" name="authType" value="${type}">
            <input type="hidden" name="numSocios" value="${numSocios}">
            <input type="hidden" name="qtdImoveis" value="${qtdImoveis}">
            
            ${contratanteHtml} 
            ${conjugeHtml} 
            ${getImovelFieldsHtml(qtdImoveis)}
            
            <div class="btn-group">
                <button type="submit">Gerar PDF</button><br>
                <a href="javascript:history.back()" class="back-link">Voltar</a>
            </div>
        </form>
    </div>
    <script src="//api.bitrix24.com/api/v1/"></script><script>window.BX&&BX.ready(function(){BX.resizeWindow(850,700)})</script></body></html>`;
}

// 4. Formulário Pessoa Jurídica
function getFormHtmlPJ(pjData, qtdImoveis) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Preencher Dados</title><style>${commonCss}</style></head><body>
    <div class="container">
        <form action="/api/generate-pdf" method="POST" target="_blank">
            <h2>Dados da Autorização (PJ)</h2>
            <input type="hidden" name="authType" value="pj">
            <input type="hidden" name="qtdImoveis" value="${qtdImoveis}">
            
            <div class="form-section"><h3>EMPRESA</h3><div class="form-grid">
                <div class="span-all"><label>Razão Social:</label><input type="text" name="empresaRazaoSocial" value="${pjData.razaoSocial}"></div>
                <div><label>CNPJ:</label><input type="text" name="empresaCnpj" value="${pjData.cnpj}"></div>
                <div class="span-2"><label>Inscrição Est./Mun.:</label><input type="text" name="empresaIe"></div>
                <div class="span-all"><label>Endereço da Sede:</label><input type="text" name="empresaEndereco" value="${pjData.endereco}"></div>
                <div class="span-2"><label>Email:</label><input type="text" name="empresaEmail" value="${pjData.email}"></div>
                <div><label>Telefone:</label><input type="text" name="empresaTelefone" value="${pjData.telefone}"></div>
            </div></div>
            
            <div class="form-section"><h3>REPRESENTANTE LEGAL</h3><div class="form-grid">
                <div class="span-2"><label>Nome Completo:</label><input type="text" name="repNome"></div>
                <div><label>CPF:</label><input type="text" name="repCpf"></div>
                <div class="span-all"><label>Cargo:</label><input type="text" name="repCargo" placeholder="Ex: Sócio Administrador"></div>
            </div></div>
            
            ${getImovelFieldsHtml(qtdImoveis)}
            
            <div class="btn-group">
                <button type="submit">Gerar PDF</button><br>
                <a href="javascript:history.back()" class="back-link">Voltar</a>
            </div>
        </form>
    </div>
    <script src="//api.bitrix24.com/api/v1/"></script><script>window.BX&&BX.ready(function(){BX.resizeWindow(850,700)})</script></body></html>`;
}

// Registro do Placement
async function registerPlacement(appHost, tokens) {
    if (!tokens || !tokens.access_token) throw new Error('Tokens inválidos.');
    console.log(`[Install Register] Registrando placement em ${appHost}...`);
    
    const appBaseUrl = `https://${appHost}`;
    const pdfButtonCode = 'CRM_COMPANY_DETAIL_TOOLBAR';
    const pdfButtonHandler = `${appBaseUrl}/api/install`; // Handler aponta para install.js

    // Unbind para garantir atualização
    try { await call('placement.unbind', { PLACEMENT: pdfButtonCode, HANDLER: pdfButtonHandler }, tokens); } catch (e) {}
    
    // Bind
    await call('placement.bind', {
        PLACEMENT: pdfButtonCode,
        HANDLER: pdfButtonHandler,
        TITLE: 'Gerar Autorização PDF.',
        DESCRIPTION: 'Gera PDF de autorização de vendas'
    }, tokens);
}