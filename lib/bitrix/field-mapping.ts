/**
 * Mapeamento de campos customizados do Bitrix24
 * 
 * Este arquivo contém todos os IDs dos campos customizados (UF_CRM_*)
 * usados nas Companies e Property Items (Imóveis) no Bitrix24
 */

// ===== COMPANY (Empresas) =====

export const COMPANY_FIELDS = {
    // Campos padrão
    TITLE: 'TITLE',                    // Nome da empresa/contratante
    PHONE: 'PHONE',                    // Telefone
    EMAIL: 'EMAIL',                    // Email
    ADDRESS: 'ADDRESS',                // Endereço residencial
    COMMENTS: 'COMMENTS',              // Comentários (usado para rastreamento)

    // Campos customizados
    CPF: 'UF_CRM_66C37392C9F3D',              // CPF
    ESTADO_CIVIL: 'UF_CRM_1767733274524',    // Estado Civil
    PROFISSAO: 'UF_CRM_1767733327414',        // Profissão

    // Cônjuge
    CONJUGE_NOME: 'UF_CRM_1767732707274',    // Nome do Cônjuge
    CONJUGE_CPF: 'UF_CRM_1767732721741',     // CPF do Cônjuge

    // Sócios (separados por vírgula)
    SOCIOS_NOMES: 'UF_CRM_1767734702349',           // Nomes dos sócios
    SOCIOS_EMAILS: 'UF_CRM_1767734857407',          // Emails dos sócios
    SOCIOS_PROFISSOES: 'UF_CRM_1767734905452',      // Profissões dos sócios
    SOCIOS_ENDERECOS: 'UF_CRM_1767734979557',       // Endereços dos sócios
    SOCIOS_TELEFONES: 'UF_CRM_1767734887170',       // Telefones dos sócios
    SOCIOS_CPFS: 'UF_CRM_1767734720984',            // CPFs dos sócios
    SOCIOS_ESTADOS_CIVIS: 'UF_CRM_1767734966917',   // Estados civis dos sócios
} as const;

// ===== PROPERTY ITEM (Imóveis) =====

export const PROPERTY_FIELDS = {
    // Campos padrão
    TITLE: 'TITLE',                    // Título do item
    COMPANY_ID: 'COMPANY_ID',          // ID da Company vinculada

    // Informações do empreendimento
    NOME_EMPREENDIMENTO: 'UF_CRM_15_1726084071715',     // Nome do empreendimento
    ENDERECO_EMPREENDIMENTO: 'UF_CRM_15_1729882118353', // Endereço do empreendimento
    BAIRRO: 'UF_CRM_15_1724788395402',                  // Bairro
    CIDADE: 'UF_CRM_15_1725044307258',                  // Cidade

    // Informações do imóvel
    DESCRICAO_IMOVEL: 'TITLE',                          // Descrição (Apto 101, Bloco A) - usa TITLE
    VALOR_VENDA: 'UF_CRM_15_1724788270820_f9yj0_number', // Valor de venda

    // Documentação
    INSCRICAO_MATRICULA: 'UF_CRM_15_1729012190730',     // Inscrição Imobiliária/Matrícula

    // Condomínio
    ADMIN_CONDOMINIO: 'UF_CRM_15_1729012205669',        // Administradora de Condomínio
    VALOR_CONDOMINIO: 'UF_CRM_15_1729012219742_yh3z5_number', // Valor do Condomínio

    // Contrato
    PRAZO_EXCLUSIVIDADE: 'UF_CRM_15_1730318106976',     // Prazo de exclusividade
    DATA_ASSINATURA: 'UF_CRM_15_1767734105854',         // Data de assinatura
    COMISSAO: 'UF_CRM_15_1730318790436',                // Comissão (%)

    // Autorização
    POSSUI_AUTORIZACAO: 'UF_CRM_15_1767879091919',      // Possui autorização? (Sim/Não)
    ARQUIVO_AUTORIZACAO: 'UF_CRM_15_1767882267145',     // Enviar autorização de venda (Arquivo)
} as const;

// ===== HELPERS =====

/**
 * Formata array de valores separados por vírgula para envio ao Bitrix24
 */
export function joinWithComma(values: (string | undefined)[]): string {
    return values.filter(Boolean).join(', ');
}

/**
 * Formata telefone no padrão do Bitrix24
 */
export function formatPhoneForBitrix(phone?: string): { VALUE: string; VALUE_TYPE: string }[] | undefined {
    if (!phone) return undefined;
    return [{ VALUE: phone, VALUE_TYPE: 'WORK' }];
}

/**
 * Formata email no padrão do Bitrix24
 */
export function formatEmailForBitrix(email?: string): { VALUE: string; VALUE_TYPE: string }[] | undefined {
    if (!email) return undefined;
    return [{ VALUE: email, VALUE_TYPE: 'WORK' }];
}

/**
 * Formata endereço no padrão do Bitrix24
 */
export function formatAddressForBitrix(address?: string): { ADDRESS_1: string } | undefined {
    if (!address) return undefined;
    return { ADDRESS_1: address };
}
