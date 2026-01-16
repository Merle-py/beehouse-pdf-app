// Database table types (Supabase)
export interface UserProfile {
    id: string; // UUID from Supabase Auth
    bitrix_user_id: number | null;
    name: string | null;
    role: 'admin' | 'broker';
    created_at: string;
    updated_at: string;
}

export interface Empresa {
    id: number;
    created_by_user_id: string; // UUID
    bitrix_company_id: number | null;
    tipo: 'PF' | 'PJ';

    // PF fields
    nome: string | null;
    cpf: string | null;
    rg: string | null;
    profissao: string | null;
    estado_civil: string | null;
    regime_casamento: string | null;
    endereco: string | null;
    email: string | null;
    telefone: string | null;

    // Cônjuge
    conjuge_nome: string | null;
    conjuge_cpf: string | null;
    conjuge_rg: string | null;
    conjuge_profissao: string | null;
    conjuge_email: string | null;

    // PJ fields
    razao_social: string | null;
    cnpj: string | null;
    inscricao_estadual: string | null;
    inscricao_municipal: string | null;
    endereco_sede: string | null;

    // Representante Legal
    rep_legal_nome: string | null;
    rep_legal_cpf: string | null;
    rep_legal_cargo: string | null;

    created_at: string;
    updated_at: string;
    last_synced_to_bitrix: string | null;
}

export interface Imovel {
    id: number;
    empresa_id: number;
    created_by_user_id: string; // UUID
    bitrix_deal_id: number | null;

    descricao: string;
    endereco: string;
    matricula: string | null;
    valor: number;

    admin_condominio: string | null;
    valor_condominio: number | null;
    chamada_capital: string | null;
    num_parcelas: number | null;

    created_at: string;
    updated_at: string;
    last_synced_to_bitrix: string | null;
}

export interface AutorizacaoVenda {
    id: number;
    imovel_id: number;
    created_by_user_id: string; // UUID

    prazo_exclusividade: number;
    comissao_percentual: number;

    status: 'rascunho' | 'aguardando_assinatura' | 'assinado' | 'cancelado' | 'encerrado';

    clicksign_document_key: string | null;
    clicksign_status: string | null;
    clicksign_request_signature_key: string | null;

    pdf_url: string | null;
    pdf_filename: string | null;

    created_at: string;
    updated_at: string;
    signed_at: string | null;
    expires_at: string | null;
}

// Complete view type (for joined queries)
export interface AutorizacaoCompleta extends AutorizacaoVenda {
    // Imóvel fields
    imovel_descricao: string;
    imovel_endereco: string;
    imovel_matricula: string | null;
    imovel_valor: number;
    admin_condominio: string | null;
    valor_condominio: number | null;
    chamada_capital: string | null;
    num_parcelas: number | null;

    // Empresa fields
    empresa_id: number;
    empresa_tipo: 'PF' | 'PJ';
    empresa_nome: string | null;
    empresa_cpf: string | null;
    empresa_rg: string | null;
    empresa_profissao: string | null;
    estado_civil: string | null;
    regime_casamento: string | null;
    empresa_endereco: string | null;
    empresa_email: string | null;
    empresa_telefone: string | null;
    conjuge_nome: string | null;
    conjuge_cpf: string | null;
    conjuge_rg: string | null;
    conjuge_profissao: string | null;
    conjuge_email: string | null;
    razao_social: string | null;
    cnpj: string | null;
    inscricao_estadual: string | null;
    inscricao_municipal: string | null;
    endereco_sede: string | null;
    rep_legal_nome: string | null;
    rep_legal_cpf: string | null;
    rep_legal_cargo: string | null;

    // User fields
    user_id: string; // UUID
    user_name: string | null;
    user_email: string;
}

// Input types (for create/update operations)
export type EmpresaInsert = Omit<Empresa, 'id' | 'created_at' | 'updated_at' | 'last_synced_to_bitrix' | 'created_by_user_id'>;
export type ImovelInsert = Omit<Imovel, 'id' | 'created_at' | 'updated_at' | 'last_synced_to_bitrix' | 'created_by_user_id'>;
export type AutorizacaoVendaInsert = Omit<AutorizacaoVenda, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id' | 'status' | 'clicksign_document_key' | 'clicksign_status' | 'clicksign_request_signature_key' | 'pdf_url' | 'pdf_filename' | 'signed_at' | 'expires_at'>;

// Update types (partial for updates)
export type EmpresaUpdate = Partial<EmpresaInsert>;
export type ImovelUpdate = Partial<Omit<ImovelInsert, 'empresa_id'>>;
export type AutorizacaoVendaUpdate = Partial<Omit<AutorizacaoVenda, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id' | 'imovel_id'>>;
