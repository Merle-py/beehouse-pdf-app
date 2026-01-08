// Interface para campos do Bitrix24 que podem ser array ou string
export interface BitrixField {
    VALUE: string;
    VALUE_TYPE?: string;
}

// Tipos de empresa no Bitrix24
export type BitrixCompanyType = 'CUSTOMER' | 'PARTNER' | 'SUPPLIER' | 'COMPETITOR';

// Tipos de autorização no sistema
export type AuthorizationType = 'pf' | 'pf-casado' | 'pj';

// Interface para empresa do Bitrix24
export interface Company {
    ID: string;
    TITLE: string;
    COMPANY_TYPE: BitrixCompanyType;
    UF_CRM_CPF_CNPJ?: string;
    EMAIL?: BitrixField[] | string;
    PHONE?: BitrixField[] | string;
    DATE_CREATE?: string;
    CREATED_TIME?: string;
    ASSIGNED_BY_ID?: string;
}

// Dados de formulário para empresa
export interface CompanyFormData {
    nome: string;
    tipo: AuthorizationType | BitrixCompanyType;
    cpfCnpj: string;
    email: string;
    telefone: string;
}
