import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

// --- HELPERS ---
function formatCurrency(value) {
    if (!value || isNaN(value)) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- CONSTANTES ---
const MARGIN_LEFT = 30; 
const MARGIN = 50; 
const PAGE_WIDTH = 612; 
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN; 
const PAGE_END = PAGE_WIDTH - MARGIN; 

// --- HEADER ---
function drawHeader(doc) {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Nota: Na Vercel, caminhos de arquivos podem ser complexos. 
        // Se a imagem falhar, o catch vai desenhar o texto 'Beehouse'.
        const logoPath = path.join(__dirname, '..', 'images', 'logo.jpeg');
        doc.image(logoPath, MARGIN_LEFT, MARGIN - 20, { width: 180 });
    } catch (imageError) {
         doc.font('Helvetica-Bold').fontSize(10).text('Beehouse', MARGIN_LEFT, MARGIN + 10);
    }

    const rightAlignX = PAGE_WIDTH - MARGIN - 250; 
    const blockWidth = 250; 
    const initialY = MARGIN - 20; 

    doc.font('Helvetica-Bold').fontSize(10).text('Autorização de Venda', rightAlignX, initialY, { width: blockWidth, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(10).text('Beehouse Investimentos Imobiliários', rightAlignX, initialY + 12, { width: blockWidth, align: 'right' });
    doc.font('Helvetica').fontSize(8).text('R. Jacob Eisenhut, 223 - SL 801 - Atiradores - Joinville/SC', rightAlignX, initialY + 24, { width: blockWidth, align: 'right' });
    doc.text('www.beehouse.imb.br | Fone: (47) 99287-9066', rightAlignX, initialY + 36, { width: blockWidth, align: 'right' }); 
    doc.y = initialY + 60; 
}

// --- FUNÇÃO PRINCIPAL ---
async function generatePdfPromise(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ 
            margins: { top: MARGIN - 20, right: MARGIN, bottom: MARGIN - 35, left: MARGIN_LEFT }, 
            size: 'A4' 
        });
        
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('error', (err) => reject(err));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        try {
            drawHeader(doc);

            let y = doc.y;
            const textPad = 5;
            const textYPad = 7;
            const labelBoxWidth = 22;
            const fieldBoxX = MARGIN_LEFT + labelBoxWidth;
            const endX = MARGIN_LEFT + CONTENT_WIDTH;
            let labelWidth = 0;
            const rowHeight = 20;
            const authType = data.authType;

            // ==================================================
            // 1. BLOCOS DE CONTRATANTES
            // ==================================================
            if (authType === 'pj') {
                // --- PJ Logic ---
                const yC = y;
                const hC = rowHeight * 4; 
                doc.rect(MARGIN_LEFT, yC, CONTENT_WIDTH, hC).stroke();
                doc.rect(MARGIN_LEFT, yC, labelBoxWidth, hC).stroke();
                doc.save().translate(MARGIN_LEFT + labelBoxWidth/2, yC + hC/2).rotate(-90).font('Helvetica-Bold').fontSize(9).text('CONTRATANTE', -hC / 2, -4, { width: hC, align: 'center' }).restore();

                const xC_1 = fieldBoxX;
                const xC_2 = fieldBoxX + (CONTENT_WIDTH - labelBoxWidth) / 2 - 10;
                let yRow = yC;

                // Linhas PJ
                doc.moveTo(fieldBoxX, yRow + rowHeight).lineTo(endX, yRow + rowHeight).stroke();
                doc.font('Helvetica-Bold').fontSize(8).text('Razão Social:', xC_1 + textPad, yRow + textYPad);
                labelWidth = doc.widthOfString('Razão Social:');
                doc.font('Helvetica').fontSize(8).text(data.empresaRazaoSocial || '', xC_1 + textPad + labelWidth + textPad, yRow + textYPad);
                yRow += rowHeight;

                doc.moveTo(fieldBoxX, yRow + rowHeight).lineTo(endX, yRow + rowHeight).stroke();
                doc.moveTo(xC_2, yRow).lineTo(xC_2, yRow + rowHeight).stroke();
                doc.font('Helvetica-Bold').fontSize(8).text('CNPJ:', xC_1 + textPad, yRow + textYPad);
                doc.font('Helvetica').fontSize(8).text(data.empresaCnpj || '', xC_1 + textPad + doc.widthOfString('CNPJ:') + textPad, yRow + textYPad);
                doc.font('Helvetica-Bold').fontSize(8).text('Email:', xC_2 + textPad, yRow + textYPad);
                doc.font('Helvetica').fontSize(8).text(data.empresaEmail || '', xC_2 + textPad + doc.widthOfString('Email:') + textPad, yRow + textYPad);
                yRow += rowHeight;

                doc.moveTo(fieldBoxX, yRow + rowHeight).lineTo(endX, yRow + rowHeight).stroke();
                doc.moveTo(xC_2, yRow).lineTo(xC_2, yRow + rowHeight).stroke();
                doc.font('Helvetica-Bold').fontSize(8).text('Telefone:', xC_1 + textPad, yRow + textYPad);
                doc.font('Helvetica').fontSize(8).text(data.empresaTelefone || '', xC_1 + textPad + doc.widthOfString('Telefone:') + textPad, yRow + textYPad);
                doc.font('Helvetica-Bold').fontSize(8).text('Inscrição Est./Mun.:', xC_2 + textPad, yRow + textYPad);
                doc.font('Helvetica').fontSize(8).text(data.empresaIe || '', xC_2 + textPad + doc.widthOfString('Inscrição Est./Mun.:') + textPad, yRow + textYPad);
                yRow += rowHeight;

                doc.font('Helvetica-Bold').fontSize(8).text('Endereço da Sede:', xC_1 + textPad, yRow + textYPad);
                doc.font('Helvetica').fontSize(8).text(data.empresaEndereco || '', xC_1 + textPad + doc.widthOfString('Endereço da Sede:') + textPad, yRow + textYPad);
                y = yRow + rowHeight + 15;

                // Rep Legal
                const yR = y;
                const hR = rowHeight * 3;
                doc.rect(MARGIN_LEFT, yR, CONTENT_WIDTH, hR).stroke();
                doc.rect(MARGIN_LEFT, yR, labelBoxWidth, hR).stroke();
                doc.save().translate(MARGIN_LEFT + labelBoxWidth/2, yR + hR/2).rotate(-90).font('Helvetica-Bold').fontSize(9).text('REP. LEGAL', -hR / 2, -4, { width: hR, align: 'center' }).restore();
                
                let yRowR = yR;
                doc.moveTo(fieldBoxX, yRowR + rowHeight).lineTo(endX, yRowR + rowHeight).stroke();
                doc.font('Helvetica-Bold').fontSize(8).text('Nome:', fieldBoxX + textPad, yRowR + textYPad);
                doc.font('Helvetica').fontSize(8).text(data.repNome || '', fieldBoxX + textPad + doc.widthOfString('Nome:') + textPad, yRowR + textYPad);
                yRowR += rowHeight;

                doc.moveTo(fieldBoxX, yRowR + rowHeight).lineTo(endX, yRowR + rowHeight).stroke();
                doc.font('Helvetica-Bold').fontSize(8).text('CPF:', fieldBoxX + textPad, yRowR + textYPad);
                doc.font('Helvetica').fontSize(8).text(data.repCpf || '', fieldBoxX + textPad + doc.widthOfString('CPF:') + textPad, yRowR + textYPad);
                yRowR += rowHeight;

                doc.font('Helvetica-Bold').fontSize(8).text('Cargo:', fieldBoxX + textPad, yRowR + textYPad);
                doc.font('Helvetica').fontSize(8).text(data.repCargo || '', fieldBoxX + textPad + doc.widthOfString('Cargo:') + textPad, yRowR + textYPad);
                y = yRowR + rowHeight + 15;

            } else {
                // --- PF / Sócios Logic ---
                const numSocios = parseInt(data.numSocios, 10) || 1;
                for (let i = 0; i < numSocios; i++) {
                    const prefix = numSocios > 1 ? `socio${i+1}` : 'contratante';
                    const titulo = numSocios > 1 ? `CONTRATANTE ${i+1}` : 'CONTRATANTE';
                    if (i > 0) y += 20;

                    const yC = y;
                    const hC = rowHeight * 5; 
                    doc.rect(MARGIN_LEFT, yC, CONTENT_WIDTH, hC).stroke();
                    doc.rect(MARGIN_LEFT, yC, labelBoxWidth, hC).stroke();
                    doc.save().translate(MARGIN_LEFT + labelBoxWidth/2, yC + hC/2).rotate(-90).font('Helvetica-Bold').fontSize(9).text(titulo, -hC / 2, -4, { width: hC, align: 'center' }).restore();

                    const xC_1 = fieldBoxX;
                    const xC_2 = fieldBoxX + (CONTENT_WIDTH - labelBoxWidth) / 2 - 10; 
                    let yRow = yC;

                    // Linha 1
                    doc.moveTo(fieldBoxX, yRow + rowHeight).lineTo(endX, yRow + rowHeight).stroke();
                    doc.moveTo(xC_2, yRow).lineTo(xC_2, yRow + rowHeight).stroke();
                    doc.font('Helvetica-Bold').fontSize(8).text('Nome:', xC_1 + textPad, yRow + textYPad);
                    doc.font('Helvetica').fontSize(8).text(data[`${prefix}Nome`] || '', xC_1 + textPad + doc.widthOfString('Nome:') + textPad, yRow + textYPad);
                    doc.font('Helvetica-Bold').fontSize(8).text('Profissão:', xC_2 + textPad, yRow + textYPad);
                    doc.font('Helvetica').fontSize(8).text(data[`${prefix}Profissao`] || '', xC_2 + textPad + doc.widthOfString('Profissão:') + textPad, yRow + textYPad);
                    yRow += rowHeight;

                    // Linha 2
                    doc.moveTo(fieldBoxX, yRow + rowHeight).lineTo(endX, yRow + rowHeight).stroke();
                    doc.font('Helvetica-Bold').fontSize(8).text('CPF:', xC_1 + textPad, yRow + textYPad);
                    doc.font('Helvetica').fontSize(8).text(data[`${prefix}Cpf`] || '', xC_1 + textPad + doc.widthOfString('CPF:') + textPad, yRow + textYPad);
                    yRow += rowHeight;

                    // Linha 3
                    doc.moveTo(fieldBoxX, yRow + rowHeight).lineTo(endX, yRow + rowHeight).stroke();
                    doc.moveTo(xC_2, yRow).lineTo(xC_2, yRow + rowHeight).stroke();
                    doc.font('Helvetica-Bold').fontSize(8).text('Estado Civil:', xC_1 + textPad, yRow + textYPad);
                    doc.font('Helvetica').fontSize(8).text(data[`${prefix}EstadoCivil`] || '', xC_1 + textPad + doc.widthOfString('Estado Civil:') + textPad, yRow + textYPad);
                    doc.font('Helvetica-Bold').fontSize(8).text('Regime Casamento:', xC_2 + textPad, yRow + textYPad);
                    doc.font('Helvetica').fontSize(8).text(data[`${prefix}RegimeCasamento`] || '', xC_2 + textPad + doc.widthOfString('Regime Casamento:') + textPad, yRow + textYPad);
                    yRow += rowHeight;

                    // Linha 4
                    doc.moveTo(fieldBoxX, yRow + rowHeight).lineTo(endX, yRow + rowHeight).stroke();
                    doc.font('Helvetica-Bold').fontSize(8).text('Endereço:', xC_1 + textPad, yRow + textYPad);
                    doc.font('Helvetica').fontSize(8).text(data[`${prefix}Endereco`] || '', xC_1 + textPad + doc.widthOfString('Endereço:') + textPad, yRow + textYPad);
                    yRow += rowHeight;

                    // Linha 5
                    doc.font('Helvetica-Bold').fontSize(8).text('Email:', xC_1 + textPad, yRow + textYPad);
                    doc.font('Helvetica').fontSize(8).text(data[`${prefix}Email`] || '', xC_1 + textPad + doc.widthOfString('Email:') + textPad, yRow + textYPad);
                    y = yRow + rowHeight;
                }

                if (authType === 'casado') {
                     y += 15;
                     const yConj = y;
                     const hConj = rowHeight * 3;
                     doc.rect(MARGIN_LEFT, yConj, CONTENT_WIDTH, hConj).stroke();
                     doc.rect(MARGIN_LEFT, yConj, labelBoxWidth, hConj).stroke();
                     doc.save().translate(MARGIN_LEFT + labelBoxWidth/2, yConj + hConj/2).rotate(-90).font('Helvetica-Bold').fontSize(9).text('CÔNJUGE', -hConj / 2, -4, { width: hConj, align: 'center' }).restore();
                     
                     let yRowConj = yConj;
                     const xConj_1 = fieldBoxX;
                     const xConj_2 = fieldBoxX + (CONTENT_WIDTH - labelBoxWidth) / 2; 

                     doc.moveTo(fieldBoxX, yRowConj + rowHeight).lineTo(endX, yRowConj + rowHeight).stroke();
                     doc.moveTo(xConj_2, yRowConj).lineTo(xConj_2, yRowConj + rowHeight).stroke();
                     doc.font('Helvetica-Bold').fontSize(8).text('Nome:', xConj_1 + textPad, yRowConj + textYPad);
                     doc.font('Helvetica').fontSize(8).text(data.conjugeNome || '', xConj_1 + textPad + doc.widthOfString('Nome:') + textPad, yRowConj + textYPad);
                     doc.font('Helvetica-Bold').fontSize(8).text('CPF:', xConj_2 + textPad, yRowConj + textYPad);
                     doc.font('Helvetica').fontSize(8).text(data.conjugeCpf || '', xConj_2 + textPad + doc.widthOfString('CPF:') + textPad, yRowConj + textYPad);
                     yRowConj += rowHeight;

                     doc.moveTo(fieldBoxX, yRowConj + rowHeight).lineTo(endX, yRowConj + rowHeight).stroke();
                     doc.font('Helvetica-Bold').fontSize(8).text('Profissão:', xConj_1 + textPad, yRowConj + textYPad);
                     doc.font('Helvetica').fontSize(8).text(data.conjugeProfissao || '', xConj_1 + textPad + doc.widthOfString('Profissão:') + textPad, yRowConj + textYPad);
                     yRowConj += rowHeight;

                     doc.font('Helvetica-Bold').fontSize(8).text('Email:', xConj_1 + textPad, yRowConj + textYPad);
                     doc.font('Helvetica').fontSize(8).text(data.conjugeEmail || '', xConj_1 + textPad + doc.widthOfString('Email:') + textPad, yRowConj + textYPad);
                     y = yConj + hConj;
                }
                y += 15;
            }

            // ==================================================================
            // 2. BLOCO IMÓVEL (DINÂMICO - MÚLTIPLAS UNIDADES)
            // ==================================================================
            
            const qtdImoveis = parseInt(data.qtdImoveis || 1, 10);
            
            // Altura total: N linhas de unidades + 5 linhas fixas
            const yI = y;
            const rHI = 20; 
            const fixedRows = 5;
            const totalRows = qtdImoveis + fixedRows;
            const hI = rHI * totalRows;

            doc.rect(MARGIN_LEFT, yI, CONTENT_WIDTH, hI).stroke();
            doc.rect(MARGIN_LEFT, yI, labelBoxWidth, hI).stroke();
            doc.save().translate(MARGIN_LEFT + labelBoxWidth/2, yI + hI/2).rotate(-90).font('Helvetica-Bold').fontSize(9).text('IMÓVEIS', -hI / 2, -4, { width: hI, align: 'center' }).restore();

            const xI_1 = fieldBoxX;
            const xI_2 = fieldBoxX + 318;
            let yIRow = yI;

            // --- LOOP DAS UNIDADES ---
            for (let i = 0; i < qtdImoveis; i++) {
                const descVal = data[`imovelDescricao_${i}`] || '';
                const valorVal = data[`imovelValor_${i}`];

                // Linha Horizontal da Unidade
                doc.moveTo(fieldBoxX, yIRow + rHI).lineTo(endX, yIRow + rHI).stroke(); 
                // Linha Vertical (separando valor)
                doc.moveTo(xI_2, yIRow).lineTo(xI_2, yIRow + rHI).stroke(); 

                // Unidade
                doc.font('Helvetica-Bold').fontSize(8).text(`Imóvel ${i+1}:`, xI_1 + textPad, yIRow + textYPad);
                labelWidth = doc.widthOfString(`Imóvel ${i+1}:`);
                doc.font('Helvetica').fontSize(8).text(descVal, xI_1 + textPad + labelWidth + textPad, yIRow + textYPad);

                // Valor
                doc.font('Helvetica-Bold').fontSize(8).text('Valor:', xI_2 + textPad, yIRow + textYPad);
                labelWidth = doc.widthOfString('Valor:');
                doc.font('Helvetica').fontSize(8).text(formatCurrency(valorVal), xI_2 + textPad + labelWidth + textPad, yIRow + textYPad);

                yIRow += rHI;
            }

            // --- CAMPOS COMUNS ---
            
            // Endereço
            doc.moveTo(fieldBoxX, yIRow + rHI).lineTo(endX, yIRow + rHI).stroke();
            doc.font('Helvetica-Bold').fontSize(8).text('Endereço do Empreendimento:', xI_1 + textPad + 10, yIRow + textYPad);
            doc.font('Helvetica').fontSize(8).text(data.imovelEndereco || '', xI_1 + textPad + doc.widthOfString('Endereço do Empreendimento:') + textPad, yIRow + textYPad);
            yIRow += rHI;

            // Matrícula
            doc.moveTo(fieldBoxX, yIRow + rHI).lineTo(endX, yIRow + rHI).stroke();
            doc.font('Helvetica-Bold').fontSize(8).text('Inscrição Imobiliária / Matrícula:', xI_1 + textPad + 10, yIRow + textYPad);
            doc.font('Helvetica').fontSize(8).text(data.imovelMatricula || '', xI_1 + textPad + doc.widthOfString('Inscrição Imobiliária / Matrícula:') + textPad, yIRow + textYPad);
            yIRow += rHI;

            // Admin
            doc.moveTo(fieldBoxX, yIRow + rHI).lineTo(endX, yIRow + rHI).stroke();
            doc.font('Helvetica-Bold').fontSize(8).text('Administradora de Condomínio:', xI_1 + textPad, yIRow + textYPad);
            doc.font('Helvetica').fontSize(8).text(data.imovelAdminCondominio || '', xI_1 + textPad + doc.widthOfString('Administradora de Condomínio:') + textPad, yIRow + textYPad);
            yIRow += rHI;

            // Condomínio e Parcelas
            const xI_L5_2 = fieldBoxX + 160;
            const xI_L5_3 = fieldBoxX + 360;
            doc.moveTo(fieldBoxX, yIRow + rHI).lineTo(endX, yIRow + rHI).stroke();
            doc.moveTo(xI_L5_2, yIRow).lineTo(xI_L5_2, yIRow + rHI).stroke();
            doc.moveTo(xI_L5_3, yIRow).lineTo(xI_L5_3, yIRow + rHI).stroke();
            
            doc.font('Helvetica-Bold').fontSize(8).text('Valor Condomínio:', xI_1 + textPad, yIRow + textYPad);
            doc.font('Helvetica').fontSize(8).text(formatCurrency(data.imovelValorCondominio) || '', xI_1 + textPad + doc.widthOfString('Valor Condomínio:') + textPad, yIRow + textYPad);
            
            doc.font('Helvetica-Bold').fontSize(8).text('Chamada Capital:', xI_L5_2 + textPad, yIRow + textYPad);
            doc.font('Helvetica').fontSize(8).text(data.imovelChamadaCapital || '', xI_L5_2 + textPad + doc.widthOfString('Chamada Capital:') + textPad, yIRow + textYPad);
            
            doc.font('Helvetica-Bold').fontSize(8).text('Parcelas:', xI_L5_3 + textPad, yIRow + textYPad);
            doc.font('Helvetica').fontSize(8).text(data.imovelNumParcelas || '', xI_L5_3 + textPad + doc.widthOfString('Parcelas:') + textPad, yIRow + textYPad);
            yIRow += rHI;

            // Exclusividade
            const xI_L6_2 = fieldBoxX + 220;
            doc.moveTo(xI_L6_2, yIRow).lineTo(xI_L6_2, yIRow + rHI).stroke(); 
            doc.font('Helvetica-Bold').fontSize(8).text('Exclusividade(*):', xI_1 + textPad, yIRow + textYPad);

            const prazoNum = parseInt(data.contratoPrazo, 10);
            const temExclusividade = !isNaN(prazoNum) && prazoNum > 0;
            const xSim = xI_1 + 90;
            const xNao = xI_1 + 130;
            const yCheck = yIRow + textYPad - 2;
            const checkSize = 8;
            
            doc.rect(xSim, yCheck, checkSize, checkSize).stroke();
            doc.font('Helvetica').fontSize(8).text('SIM', xSim + checkSize + 2, yIRow + textYPad);
            doc.rect(xNao, yCheck, checkSize, checkSize).stroke();
            doc.font('Helvetica').fontSize(8).text('NÃO', xNao + checkSize + 2, yIRow + textYPad);

            doc.font('Helvetica-Bold').fontSize(10);
            if (temExclusividade) {
                doc.path(`M ${xSim} ${yCheck} L ${xSim + checkSize} ${yCheck + checkSize} M ${xSim + checkSize} ${yCheck} L ${xSim} ${yCheck + checkSize}`).lineWidth(1.5).stroke();
            } else {
                doc.path(`M ${xNao} ${yCheck} L ${xNao + checkSize} ${yCheck + checkSize} M ${xNao + checkSize} ${yCheck} L ${xNao} ${yCheck + checkSize}`).lineWidth(1.5).stroke();
            }
            doc.fontSize(8);

            doc.font('Helvetica-Bold').text('Prazo de exclusividade:', xI_L6_2 + textPad, yIRow + textYPad);
            doc.font('Helvetica').text((temExclusividade ? data.contratoPrazo : '0') + ' dias', xI_L6_2 + textPad + doc.widthOfString('Prazo de exclusividade:') + textPad, yIRow + textYPad);

            y = yIRow + rHI + 10;

            // ==================================================
            // 3. TEXTO JURÍDICO E ASSINATURAS
            // ==================================================
            doc.y = y;
            doc.x = MARGIN_LEFT;
            doc.font('Helvetica').fontSize(8);
            
            const preambuloTexto = (authType === 'pj')
                ? 'A Contratante autoriza a Beehouse Investimentos Imobiliários, inscrita no '
                : 'O(s) Contratante(s) autoriza(m) a Beehouse Investimentos Imobiliários, inscrita no ';
                
            doc.text(preambuloTexto, { continued: true, align: 'justify', width: CONTENT_WIDTH });
            doc.font('Helvetica-Bold').text('CNPJ sob nº 14.477.349/0001-23', { continued: true });
            doc.font('Helvetica').text(', com inscrição no ', { continued: true });
            doc.font('Helvetica-Bold').text('CRECI/SC sob o nº 7.965-J', { continued: true });
            doc.font('Helvetica').text(', situada nesta cidade, na Rua Jacob Eisenhut, 223 - SL 801 Bairro Atiradores, Cep: 89.203-070 - Joinville-SC, a promover a venda dos imóveis com as descrições acima, mediante as seguintes condições:');
            
            doc.moveDown(1);

            // CLÁUSULAS
            const clausulaIndent = 10;
            const clausulaNumWidth = 20; 
            const clausulaTextWidth = CONTENT_WIDTH - clausulaNumWidth;
            const clausulaNumX = MARGIN_LEFT;
            const clausulaTextX = MARGIN_LEFT + clausulaNumWidth;

            const comissaoTexto = (authType === 'pj') ? 'A Contratante pagará a Contratada...' : 'O(s) Contratante(s) pagará(ão) a Contratada...';
            const declaracaoTexto = (authType === 'pj') 
                ? 'A Contratante declara que os imóveis encontram-se livres e desembaraçados...'
                : 'O(s) Contratante(s) declara(m) que os imóveis encontram-se livres e desembaraçados...';

            const addClause = (num, text) => {
                doc.font('Helvetica-Bold').text(num, clausulaNumX, doc.y, { width: clausulaNumWidth });
                doc.font('Helvetica').text(text, clausulaTextX, doc.y - doc.heightOfString(num), { align: 'justify', width: clausulaTextWidth });
                doc.moveDown(0.5);
            };

            addClause('1º', 'A venda é concebida a contar desta data pelo prazo e forma acima definidos. Após esse período o contrato se encerra.');
            addClause('2º', `${comissaoTexto} ${data.contratoComissaoPct || '6'}% (seis por cento) sobre o valor da venda, no ato do recebimento do sinal. Esta comissão é devida também mesmo fora do prazo desta autorização desde que a venda do imóvel seja efetuado por cliente apresentado pela Contratada ou nos caso em que, comprovadamente, a negociação tiver sido por esta iniciada, observando também o artigo 727 do Código Civil Brasileiro.`);
            addClause('3º', 'A Contratada compromete-se a fazer publicidade dos imóveis, podendo colocar placas, anunciar em jornais e meios de divulgação do imóvel ao público.');
            addClause('4º', declaracaoTexto);
            addClause('5º', 'Em caso de qualquer controversia decorrente deste contrato, as partes elegem o Foro da Comarca de Joinville/SC para dirimir quaisquer dúvidas deste contrato, renunciando qualquer outro, por mais privilégio que seja.');

            doc.moveDown(0.5);
            doc.text('Assim por estarem juntos e contratados, obrigam-se a si e seus herdeiros a cumprir e fazer cumprir o disposto neste contrato, assinando-os em duas vias de igual teor e forma a tudo presentes.', MARGIN_LEFT, doc.y, { align: 'justify', width: CONTENT_WIDTH });
            doc.moveDown(1.5);

            // DATA
            const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.font('Helvetica-Bold').fontSize(8).text('Local e data:', MARGIN_LEFT, doc.y, { continued: true});
            doc.font('Helvetica').fontSize(8).text(` Joinville, ${dataHoje}`, MARGIN_LEFT + 10, doc.y);

            // ASSINATURAS
            const sigWidth = 240;
            const sigBlockHeight = 55; 
            const pageBottom = doc.page.height - doc.page.margins.bottom; 
            const col1_X = MARGIN_LEFT;
            const col2_X = MARGIN_LEFT + sigWidth + 20;

            const checkAndSetY = (proposedY) => {
                if (proposedY + sigBlockHeight > pageBottom) {
                    doc.addPage();
                    drawHeader(doc); 
                    return doc.y + 60; 
                }
                return proposedY; 
            };

            // *** ALTERAÇÃO AQUI: + 55 PIXELS (era + 40) ***
            let currentY = checkAndSetY(doc.y + 70);

            // 1. Beehouse
            const drawSig = (title, label, subLabel, x, yPos) => {
                doc.moveTo(x, yPos).lineTo(x + sigWidth, yPos).stroke();
                doc.font('Helvetica-Bold').fontSize(8).text(title || '', x, yPos + 5, { width: sigWidth, align: 'center' });
                doc.font('Helvetica-Bold').fontSize(8).text(label || '', x, yPos + 15, { width: sigWidth, align: 'center' });
                if (subLabel) doc.font('Helvetica').fontSize(8).text(subLabel, x, yPos + 25, { width: sigWidth, align: 'center' });
            };

            drawSig('CONTRATADA', 'Beehouse Investimentos Imobiliários', 'CNPJ 14.477.349/0001-23', col1_X, currentY);

            // 2. Contratante(s)
            if (authType === 'pj') {
                drawSig('CONTRATANTE', data.empresaRazaoSocial, `p.p. ${data.repNome} - CPF: ${data.repCpf}`, col2_X, currentY);
            } 
            else if (authType === 'casado') {
                drawSig('CONTRATANTE', data.contratanteNome, `CPF: ${data.contratanteCpf}`, col2_X, currentY);
                let nextY = currentY + sigBlockHeight + 30;
                currentY = checkAndSetY(nextY);
                drawSig('CÔNJUGE', data.conjugeNome, `CPF: ${data.conjugeCpf}`, col2_X, currentY);
            }
            else if (authType === 'socios') {
                const ns = parseInt(data.numSocios, 10) || 1;
                drawSig('CONTRATANTE 1', data.socio1Nome, `CPF: ${data.socio1Cpf}`, col2_X, currentY);
                
                for(let k=1; k<ns; k++) {
                    let nextY = currentY + sigBlockHeight + 30;
                    currentY = checkAndSetY(nextY);
                    const p = `socio${k+1}`;
                    drawSig(`CONTRATANTE ${k+1}`, data[`${p}Nome`], `CPF: ${data[`${p}Cpf`]}`, col2_X, currentY);
                }
            } else {
                // Solteiro
                drawSig('CONTRATANTE', data.contratanteNome, `CPF: ${data.contratanteCpf}`, col2_X, currentY);
            }

            doc.end();

        } catch (error) {
            console.error('Erro síncrono PDF:', error);
            reject(error);
        }
    });
}

// --- HANDLER ---
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Metodo nao permitido');
    try {
        const pdfBuffer = await generatePdfPromise(req.body);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Autorizacao_Venda.pdf"`);
        res.end(pdfBuffer);
    } catch (error) {
        console.error('Erro Handler:', error);
        res.status(500).send('Erro ao gerar PDF:: ' + error.message);
    }
}