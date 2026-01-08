// Interface para imóvel (SPA Item do Bitrix24)
export interface Property {
    id: string;
    title: string;
    description?: string; // Alias para ufCrmPropertyDescription
    address?: string; // Alias para ufCrmPropertyAddress
    value?: number; // Valor parseado de ufCrmPropertyValue
    companyId: string;
    companyName: string;
    companyType: string;
    ufCrmPropertyAddress?: string;
    ufCrmPropertyValue?: string;
    ufCrmPropertyMatricula?: string;
    ufCrmPropertyAdminCondominio?: string;
    ufCrmPropertyValorCondominio?: string;
    ufCrmPropertyChamadaCapital?: string;
    ufCrmPropertyNumParcelas?: string;
    ufCrmPropertyDescription?: string;
    hasAuthorization?: boolean;
    hasSigned?: boolean;
    authorizationFile?: string;
    createdTime?: string;
    updatedTime?: string;
    ufCrmPropertyHasAuthorization?: string | boolean; // Campo de autorização manual
}

// Dados de formulário para imóvel
export interface PropertyFormData {
    endereco: string;
    valor: string;
    matricula: string;
    administradora: string;
    valorCondominio: string;
    chamadaCapital: string;
    numeroParcelas: string;
    descricao: string;
}
