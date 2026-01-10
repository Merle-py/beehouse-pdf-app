// Tipos para respostas da API do Bitrix24

export interface BitrixField {
    VALUE: string;
    VALUE_TYPE?: string;
}

export interface BitrixCompany {
    ID: string;
    TITLE: string;
    COMPANY_TYPE: 'CUSTOMER' | 'PARTNER' | 'SUPPLIER' | 'COMPETITOR';
    UF_CRM_CPF_CNPJ?: string;
    EMAIL?: BitrixField[] | string;
    PHONE?: BitrixField[] | string;
    DATE_CREATE?: string;
    CREATED_TIME?: string;
    ASSIGNED_BY_ID?: string;
    COMMENTS?: string;
    [key: string]: any; // Campos customizados UF_CRM_*
}

export interface BitrixPropertyItem {
    id: string;
    title: string;
    companyId: string;
    assignedById?: string;
    createdTime?: string;
    updatedTime?: string;
    ufCrmPropertyAddress?: string;
    ufCrmPropertyValue?: string;
    ufCrmPropertyMatricula?: string;
    ufCrmPropertyDescription?: string;
    ufCrmPropertyAdminCondominio?: string;
    ufCrmPropertyValorCondominio?: string;
    ufCrmPropertyChamadaCapital?: string;
    ufCrmPropertyNumParcelas?: string;
    [key: string]: any; // Campos customizados dinâmicos
}

export interface BitrixUser {
    ID: string;
    NAME: string;
    LAST_NAME: string;
    EMAIL: string;
    IS_ADMIN?: boolean;
}

export interface BitrixApiResponse<T = any> {
    result?: T;
    total?: number;
    error?: string;
    error_description?: string;
}
