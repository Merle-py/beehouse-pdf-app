import { NextRequest, NextResponse } from 'next/server';
import { createCompany, createPropertyItem, validateUserToken } from '@/lib/bitrix/server-client';
import { generateAuthorizationPdf } from '@/lib/pdf/authorization-generator';
import { convertFormDataToPDFData } from '@/lib/pdf/helpers';
import { saveUserTokens, callAsUser } from '@/lib/bitrix/oauth-manager';
import type { AuthorizationFormData, AuthorizationApiResponse, BitrixCompanyCreateData, BitrixPropertyItemData } from '@/types/authorization';
import {
    COMPANY_FIELDS,
    PROPERTY_FIELDS,
    formatPhoneForBitrix,
    formatAddressForBitrix,
    formatEmailForBitrix,
    joinWithComma
} from '@/lib/bitrix/field-mapping';


// Força a rota a ser dinâmica (recebe dados do corretor em tempo real)
export const dynamic = 'force-dynamic';

/**
 * API Route: Cadastro de Autorização de Venda (com rastreamento de corretor)
 * 
 * Fluxo híbrido:
 * 1. Recebe dados + AUTH_ID do corretor (frontend)
 * 2. Identifica o corretor via OAuth
 * 3. Cria Company via Webhook Admin (bypass)
 * 4. Salva member_id do corretor no campo COMMENTS para rastreamento
 * 5. Cria SPA Item vinculado + rastreamento
 * 6. Gera PDF
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthorizationApiResponse>> {
    try {
        console.log('[API] Iniciando cadastro de autorização...');

        // 1. Parse dos dados
        const body = await request.json();
        const formData: AuthorizationFormData = body.formData || body;
        const brokerDomain = body.Domain; // domain do Bitrix24
        const brokerAccessToken = body.AccessToken; // access_token do corretor

        if (!formData || !formData.authType || !formData.contrato) {
            return NextResponse.json({
                success: false,
                error: 'Dados inválidos: authType e contrato são obrigatórios'
            }, { status: 400 });
        }

        // 🔒 VALIDAÇÃO SEGURA: Valida token ANTES de usar
        if (!brokerAccessToken || !brokerDomain) {
            return NextResponse.json({
                success: false,
                error: 'Token de autenticação não fornecido'
            }, { status: 401 });
        }

        console.log('[API] Validando token do corretor...');

        // Valida token e obtém userId REAL (impossível falsificar)
        const userInfo = await validateUserToken(brokerAccessToken, brokerDomain);
        const validatedBrokerId = userInfo.userId;

        console.log('[API] Token validado - Broker ID:', validatedBrokerId, 'Nome:', userInfo.name);

        // 2. Obter dados do corretor para rastreamento
        let brokerInfo: any = null;
        if (validatedBrokerId && brokerAccessToken) {
            try {
                // Salvar tokens temporariamente
                if (brokerDomain && brokerAccessToken) {
                    await saveUserTokens({
                        member_id: validatedBrokerId,
                        access_token: brokerAccessToken,
                        refresh_token: '', // Será atualizado no fluxo OAuth completo
                        expires_in: Math.floor(Date.now() / 1000) + 3600,
                        domain: brokerDomain
                    });
                }

                // Obter informações do corretor
                brokerInfo = await callAsUser('user.current', {}, validatedBrokerId);
                console.log('[API] Corretor identificado:', brokerInfo.NAME, brokerInfo.LAST_NAME);
            } catch (error: any) {
                console.warn('[API] Não foi possível obter dados do corretor:', error.message);
                // Continua mesmo sem dados do corretor
            }
        }

        // 3. Criar Company no Bitrix24 (via webhook admin)
        const companyTitle = getCompanyTitle(formData);
        const companyPhone = getCompanyPhone(formData);
        const companyEmail = getCompanyEmail(formData);

        const companyData: BitrixCompanyCreateData = {
            TITLE: companyTitle,
            PHONE: formatPhoneForBitrix(companyPhone),
            EMAIL: formatEmailForBitrix(companyEmail),
            COMMENTS: `Autorização criada por: ${brokerInfo?.NAME || 'Sistema'} ${brokerInfo?.LAST_NAME || ''} (ID: ${validatedBrokerId || 'N/A'})\nTipo: ${formData.authType}\nData: ${new Date().toLocaleString('pt-BR')}`,

            // Campos customizados: PF Solteiro/Casado
            ...(formData.authType === 'pf-solteiro' || formData.authType === 'pf-casado' ? {
                [COMPANY_FIELDS.CPF]: formData.contratante?.cpf,
                [COMPANY_FIELDS.ESTADO_CIVIL]: formData.authType === 'pf-casado' ? 'Casado(a)' : 'Solteiro(a)',
                [COMPANY_FIELDS.PROFISSAO]: formData.contratante?.profissao,
                [COMPANY_FIELDS.ADDRESS]: formatAddressForBitrix(formData.contratante?.endereco),
            } : {}),

            // Dados do cônjuge (PF Casado)
            ...(formData.authType === 'pf-casado' && formData.conjuge ? {
                [COMPANY_FIELDS.CONJUGE_NOME]: formData.conjuge.nome,  // Nome do Cônjuge
                [COMPANY_FIELDS.CONJUGE_CPF]: formData.conjuge.cpf,   // CPF do Cônjuge
            } : {}),

            // Dados dos sócios (Sociedade)
            ...(formData.authType === 'socios' && formData.socios ? {
                [COMPANY_FIELDS.SOCIOS_NOMES]: formData.socios.map(s => s.nome).filter(Boolean).join(', '),
                [COMPANY_FIELDS.SOCIOS_EMAILS]: formData.socios.map(s => s.email).filter(Boolean).join(', '),
                [COMPANY_FIELDS.SOCIOS_PROFISSOES]: formData.socios.map(s => s.profissao).filter(Boolean).join(', '),
                [COMPANY_FIELDS.SOCIOS_ENDERECOS]: formData.socios.map(s => s.endereco).filter(Boolean).join(', '),
                [COMPANY_FIELDS.SOCIOS_TELEFONES]: formData.socios.map(s => s.telefone).filter(Boolean).join(', '),
                [COMPANY_FIELDS.SOCIOS_CPFS]: formData.socios.map(s => s.cpf).filter(Boolean).join(', '),
                [COMPANY_FIELDS.SOCIOS_ESTADOS_CIVIS]: formData.socios.map(s => s.estadoCivil || 'N/A').join(', '),
            } : {}),
        };

        console.log('[API] Criando Company:', companyTitle);
        let companyId: number;

        try {
            companyId = await createCompany(companyData);
            console.log('[API] Company criada com sucesso:', companyId);
        } catch (error: any) {
            console.error('[API] Erro ao criar Company:', error.message);
            return NextResponse.json({
                success: false,
                error: 'Erro ao criar empresa no Bitrix24',
                details: error.message
            }, { status: 500 });
        }

        // 4. Criar SPA Item "Imóveis" vinculado à Company
        const propertyTitle = getPropertyTitle(formData);
        const propertyValue = getPropertyValue(formData);

        const propertyData: BitrixPropertyItemData = {
            entityTypeId: 0, // Será preenchido pela função
            companyId: companyId,
            title: propertyTitle,

            // Dados do empreendimento/imóvel
            [PROPERTY_FIELDS.NOME_EMPREENDIMENTO]: formData.imovel.descricao,
            [PROPERTY_FIELDS.ENDERECO_EMPREENDIMENTO]: formData.imovel.endereco,
            [PROPERTY_FIELDS.VALOR_VENDA]: propertyValue,
            [PROPERTY_FIELDS.INSCRICAO_MATRICULA]: formData.imovel.matricula,

            // Dados do contrato
            [PROPERTY_FIELDS.PRAZO_EXCLUSIVIDADE]: formData.contrato.prazo,                          // Prazo (dias)
            [PROPERTY_FIELDS.DATA_ASSINATURA]: new Date().toISOString().split('T')[0],           // Data assinatura
            [PROPERTY_FIELDS.COMISSAO]: formData.contrato.comissaoPct,                    // Comissão (%)
        };

        console.log('[API] Criando Property Item:', propertyTitle);
        let propertyItemId: number;

        try {
            propertyItemId = await createPropertyItem(propertyData);
            console.log('[API] Property Item criado com sucesso:', propertyItemId);
        } catch (error: any) {
            console.error('[API] Erro ao criar Property Item:', error.message);

            return NextResponse.json({
                success: false,
                companyId,
                error: 'Erro ao criar imóvel no Bitrix24',
                details: error.message
            }, { status: 500 });
        }

        // 5. Gerar PDF de Autorização
        console.log('[API] Gerando PDF de autorização...');
        let pdfBuffer: Buffer;
        let pdfFileName: string;

        try {
            const pdfData = convertFormDataToPDFData(formData);
            pdfBuffer = await generateAuthorizationPdf(pdfData);
            pdfFileName = `Autorizacao_Venda_${companyId}_${Date.now()}.pdf`;
            console.log('[API] PDF gerado com sucesso:', pdfFileName);
        } catch (error: any) {
            console.error('[API] Erro ao gerar PDF:', error.message);
            return NextResponse.json({
                success: false,
                companyId,
                propertyItemId,
                error: 'Erro ao gerar PDF de autorização',
                details: error.message
            }, { status: 500 });
        }

        // 6. Retornar PDF como Base64
        const pdfBase64 = pdfBuffer.toString('base64');

        console.log('[API] Cadastro concluído com sucesso!');
        console.log(`[API] Rastreamento: Company ${companyId} criada por broker ${validatedBrokerId}`);

        return NextResponse.json({
            success: true,
            companyId,
            propertyItemId,
            pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
            pdfFileName,
            createdBy: validatedBrokerId || 'system'
        }, { status: 200 });

    } catch (error: any) {
        console.error('[API] Erro inesperado:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Helpers para extrair dados do formulário
 */

function getCompanyTitle(formData: AuthorizationFormData): string {
    if (formData.authType === 'pj' && formData.empresa?.razaoSocial) {
        return formData.empresa.razaoSocial;
    }

    if (formData.authType === 'socios' && formData.socios && formData.socios.length > 0) {
        return formData.socios.map(s => s.nome).filter(Boolean).join(', ');
    }

    if (formData.contratante?.nome) {
        return formData.contratante.nome;
    }

    return 'Contratante não informado';
}

function getCompanyPhone(formData: AuthorizationFormData): string | undefined {
    if (formData.authType === 'pj' && formData.empresa?.telefone) {
        return formData.empresa.telefone;
    }
    return undefined;
}

function getCompanyEmail(formData: AuthorizationFormData): string | undefined {
    if (formData.authType === 'pj' && formData.empresa?.email) {
        return formData.empresa.email;
    }

    if (formData.contratante?.email) {
        return formData.contratante.email;
    }

    if (formData.socios && formData.socios.length > 0 && formData.socios[0].email) {
        return formData.socios[0].email;
    }

    return undefined;
}

function getPropertyTitle(formData: AuthorizationFormData): string {
    return formData.imovel?.descricao || 'Imóvel não informado';
}

function getPropertyValue(formData: AuthorizationFormData): number {
    return formData.imovel?.valor || 0;
}
