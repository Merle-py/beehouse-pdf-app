import type { PDFGenerationData } from '@/types/authorization';

/**
 * Database record from vw_autorizacoes_completas view
 */
export interface DbAutorizacaoCompleta {
    // Autorização fields
    id: number;
    status: string;
    prazo_exclusividade: number;
    comissao_percentual: number;

    // Imóvel fields
    imovel_id: number;
    imovel_descricao: string;
    imovel_endereco: string;
    imovel_matricula?: string;
    imovel_valor: number;
    admin_condominio?: string;
    valor_condominio?: number;
    chamada_capital?: string;
    num_parcelas?: number;

    // Empresa fields
    empresa_id: number;
    empresa_tipo: 'PF' | 'PJ';
    empresa_nome?: string;
    empresa_cpf?: string;
    empresa_rg?: string;
    empresa_profissao?: string;
    estado_civil?: string;
    regime_casamento?: string;
    empresa_endereco?: string;
    empresa_email?: string;
    empresa_telefone?: string;

    // Cônjuge fields
    conjuge_nome?: string;
    conjuge_cpf?: string;
    conjuge_rg?: string;
    conjuge_profissao?: string;
    conjuge_email?: string;

    // PJ fields
    razao_social?: string;
    cnpj?: string;
    inscricao_estadual?: string;
    inscricao_municipal?: string;
    endereco_sede?: string;

    // Representante Legal fields
    rep_legal_nome?: string;
    rep_legal_cpf?: string;
    rep_legal_cargo?: string;
}

/**
 * Determines the authType based on empresa_tipo and estado_civil
 */
function determineAuthType(dbData: DbAutorizacaoCompleta): string {
    if (dbData.empresa_tipo === 'PJ') {
        return 'pj';
    }

    // PF cases
    if (dbData.estado_civil &&
        (dbData.estado_civil.toLowerCase().includes('casad') ||
            dbData.estado_civil.toLowerCase().includes('união'))) {
        return 'pf-casado';
    }

    return 'pf-solteiro';
}

/**
 * Converts database record from vw_autorizacoes_completas to PDFGenerationData format
 * 
 * This function bridges the gap between our database schema and the existing
 * PDF generator which expects a specific flat structure.
 * 
 * @param dbData - Complete autorização data from database view
 * @returns PDFGenerationData formatted for PDF generator
 */
export function convertDbDataToPDFData(dbData: DbAutorizacaoCompleta): PDFGenerationData {
    const authType = determineAuthType(dbData);

    // Base data structure
    const pdfData: PDFGenerationData = {
        authType,
        contratoPrazo: dbData.prazo_exclusividade || 0,
        contratoComissaoPct: Number(dbData.comissao_percentual) || 6,

        // Imóvel data
        imovelDescricao: dbData.imovel_descricao,
        imovelValor: Number(dbData.imovel_valor),
        imovelEndereco: dbData.imovel_endereco,
        imovelMatricula: dbData.imovel_matricula,
        imovelAdminCondominio: dbData.admin_condominio,
        imovelValorCondominio: dbData.valor_condominio ? Number(dbData.valor_condominio) : undefined,
        imovelChamadaCapital: dbData.chamada_capital,
        imovelNumParcelas: dbData.num_parcelas?.toString(),
    };

    // PJ specific fields
    if (authType === 'pj') {
        pdfData.empresaRazaoSocial = dbData.razao_social;
        pdfData.empresaCnpj = dbData.cnpj;
        pdfData.empresaEmail = dbData.empresa_email;
        pdfData.empresaTelefone = dbData.empresa_telefone;
        pdfData.empresaIe = dbData.inscricao_estadual;
        pdfData.empresaEndereco = dbData.endereco_sede;

        // Representante Legal
        pdfData.repNome = dbData.rep_legal_nome;
        pdfData.repCpf = dbData.rep_legal_cpf;
        pdfData.repCargo = dbData.rep_legal_cargo;
    }

    // PF fields (both solteiro and casado)
    if (authType === 'pf-solteiro' || authType === 'pf-casado') {
        pdfData.contratanteNome = dbData.empresa_nome;
        pdfData.contratanteCpf = dbData.empresa_cpf;
        pdfData.contratanteProfissao = dbData.empresa_profissao;
        pdfData.contratanteEstadoCivil = dbData.estado_civil;
        pdfData.contratanteRegimeCasamento = dbData.regime_casamento;
        pdfData.contratanteEndereco = dbData.empresa_endereco;
        pdfData.contratanteEmail = dbData.empresa_email;

        // Cônjuge fields (only for casado)
        if (authType === 'pf-casado') {
            pdfData.conjugeNome = dbData.conjuge_nome;
            pdfData.conjugeCpf = dbData.conjuge_cpf;
            pdfData.conjugeProfissao = dbData.conjuge_profissao;
            pdfData.conjugeEmail = dbData.conjuge_email;
        }
    }

    return pdfData;
}

/**
 * Generates a sanitized filename for the PDF
 * 
 * @param dbData - Complete autorização data
 * @returns Sanitized filename without extension
 */
export function generatePdfFilename(dbData: DbAutorizacaoCompleta): string {
    const name = dbData.empresa_tipo === 'PJ'
        ? dbData.razao_social
        : dbData.empresa_nome;

    const sanitized = name?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'Autorizacao';
    return `Autorizacao_${sanitized}_${dbData.id}`;
}
