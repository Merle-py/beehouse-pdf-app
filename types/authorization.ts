// Tipos de contratante
export type ContractorType = 'pf-solteiro' | 'pf-casado' | 'socios' | 'pj';

// Dados de Pessoa Física
export interface PersonData {
    nome?: string;
    cpf?: string;
    rg?: string;
    profissao?: string;
    estadoCivil?: string;
    regimeCasamento?: string;
    endereco?: string;
    email?: string;
    telefone?: string; // Para sócios
}

// Dados de Cônjuge
export interface SpouseData {
    nome?: string;
    cpf?: string;
    rg?: string;
    profissao?: string;
    email?: string;
}

// Dados de Empresa (PJ)
export interface CompanyData {
    razaoSocial?: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    ie?: string;
    endereco?: string;
}

// Dados de Representante Legal
export interface LegalRepData {
    nome?: string;
    cpf?: string;
    cargo?: string;
}

// Dados de Imóvel
export interface PropertyData {
    descricao: string;
    endereco: string;
    valor: number;
    matricula?: string;
    adminCondominio?: string;
    valorCondominio?: number;
    chamadaCapital?: string;
    numParcelas?: string;
}

// Dados de múltiplos imóveis
export interface MultiplePropertyData {
    qtdImoveis: number;
    nomeEmpreendimento?: string; // Nome do empreendimento
    unidades: Array<{
        descricao: string;
        valor: number;
    }>;
    enderecoEmpreendimento: string;
    matricula?: string;
    adminCondominio?: string;
    valorCondominio?: number;
    chamadaCapital?: string;
    numParcelas?: string;
}

// Dados do Contrato
export interface ContractData {
    prazo: number; // dias de exclusividade
    comissaoPct: number; // percentual de comissão
}

// Formulário completo de Autorização
export interface AuthorizationFormData {
    authType: ContractorType;

    // PJ
    empresa?: CompanyData;
    repLegal?: LegalRepData;

    // PF
    contratante?: PersonData;
    conjuge?: SpouseData;

    // Sócios (múltiplos)
    numSocios?: number;
    socios?: PersonData[];

    // Imóvel (único ou múltiplo)
    imovelUnico?: PropertyData;
    imoveisMultiplos?: MultiplePropertyData;

    // Contrato
    contrato: ContractData;
}

// Resposta da API de cadastro
export interface AuthorizationApiResponse {
    success: boolean;
    companyId?: number;
    propertyItemId?: number;
    pdfUrl?: string;
    pdfFileName?: string;
    error?: string;
    details?: string;
}

// Dados para geração de PDF (formato legado compatível)
export interface PDFGenerationData {
    authType: string;

    // Empresa
    empresaRazaoSocial?: string;
    empresaCnpj?: string;
    empresaEmail?: string;
    empresaTelefone?: string;
    empresaIe?: string;
    empresaEndereco?: string;

    // Rep Legal
    repNome?: string;
    repCpf?: string;
    repCargo?: string;

    // Contratante(s)
    numSocios?: number;
    contratanteNome?: string;
    contratanteCpf?: string;
    contratanteRg?: string;
    contratanteProfissao?: string;
    contratanteEstadoCivil?: string;
    contratanteRegimeCasamento?: string;
    contratanteEndereco?: string;
    contratanteEmail?: string;

    // Sócios (dinâmico)
    [key: `socio${number}Nome`]: string;
    [key: `socio${number}Cpf`]: string;
    [key: `socio${number}Rg`]: string;
    [key: `socio${number}Profissao`]: string;
    [key: `socio${number}EstadoCivil`]: string;
    [key: `socio${number}RegimeCasamento`]: string;
    [key: `socio${number}Endereco`]: string;
    [key: `socio${number}Email`]: string;

    // Cônjuge
    conjugeNome?: string;
    conjugeCpf?: string;
    conjugeRg?: string;
    conjugeProfissao?: string;
    conjugeEmail?: string;

    // Imóvel(is)
    qtdImoveis?: number;
    imovelDescricao?: string;
    imovelValor?: number;
    imovelEndereco?: string;
    imovelMatricula?: string;
    imovelAdminCondominio?: string;
    imovelValorCondominio?: number;
    imovelChamadaCapital?: string;
    imovelNumParcelas?: string;

    // Múltiplas unidades
    [key: `imovelDescricao_${number}`]: string;
    [key: `imovelValor_${number}`]: number;

    // Contrato
    contratoPrazo: number;
    contratoComissaoPct: number;
}

// Tipos do Bitrix24

export interface BitrixCompanyCreateData {
    TITLE: string;
    PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
    EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
    ADDRESS?: { ADDRESS_1: string };
    COMMENTS?: string;
    [key: string]: any; // Campos customizados UF_CRM_*
}

export interface BitrixPropertyItemData {
    entityTypeId: number;
    companyId: number;
    title: string;
    [key: string]: any; // Campos customizados UF_CRM_*
}

export interface BitrixFileUploadData {
    fileData: string; // base64
}

export interface BitrixApiResponse<T = any> {
    result?: T;
    error?: string;
    error_description?: string;
}
