-- ==================================
-- BeeHouse PDF App - Supabase Schema
-- PostgreSQL 14+ with Supabase Auth
-- ==================================

-- ==================================
-- USERS PROFILE TABLE
-- (Extends Supabase auth.users)
-- ==================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    bitrix_user_id INTEGER UNIQUE,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'broker' CHECK (role IN ('admin', 'broker')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_bitrix ON public.user_profiles(bitrix_user_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY user_profiles_select_own ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY user_profiles_update_own ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- ==================================
-- EMPRESAS TABLE
-- ==================================

CREATE TABLE IF NOT EXISTS public.empresas (
    id SERIAL PRIMARY KEY,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bitrix_company_id INTEGER UNIQUE,
    
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('PF', 'PJ')),
    
    -- PF fields
    nome VARCHAR(255),
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(20),
    profissao VARCHAR(100),
    estado_civil VARCHAR(50),
    regime_casamento VARCHAR(100),
    endereco TEXT,
    email VARCHAR(255),
    telefone VARCHAR(20),
    
    -- Cônjuge (if applicable)
    conjuge_nome VARCHAR(255),
    conjuge_cpf VARCHAR(14),
    conjuge_rg VARCHAR(20),
    conjuge_profissao VARCHAR(100),
    conjuge_email VARCHAR(255),
    
    -- PJ fields
    razao_social VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    inscricao_estadual VARCHAR(50),
    inscricao_municipal VARCHAR(50),
    endereco_sede TEXT,
    
    -- Representante Legal (for PJ)
    rep_legal_nome VARCHAR(255),
    rep_legal_cpf VARCHAR(14),
    rep_legal_cargo VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_to_bitrix TIMESTAMP,
    
    CHECK (
        (tipo = 'PF' AND cpf IS NOT NULL) OR
        (tipo = 'PJ' AND cnpj IS NOT NULL)
    )
);

CREATE INDEX idx_empresas_created_by ON public.empresas(created_by_user_id);
CREATE INDEX idx_empresas_bitrix ON public.empresas(bitrix_company_id);
CREATE INDEX idx_empresas_cpf ON public.empresas(cpf);
CREATE INDEX idx_empresas_cnpj ON public.empresas(cnpj);
CREATE INDEX idx_empresas_tipo ON public.empresas(tipo);

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-level security
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY empresas_user_isolation ON public.empresas
    FOR ALL
    USING (
        created_by_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ==================================
-- IMÓVEIS TABLE
-- Sync: Bitrix24 SPA (Smart Process Automation)
-- ==================================

CREATE TABLE IF NOT EXISTS public.imoveis (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bitrix_spa_item_id INTEGER UNIQUE,  -- ID do Item na SPA "Imóveis" do Bitrix24
    
    descricao TEXT NOT NULL,
    endereco TEXT NOT NULL,
    matricula VARCHAR(100),
    valor DECIMAL(15, 2) NOT NULL,
    
    admin_condominio VARCHAR(255),
    valor_condominio DECIMAL(15, 2),
    chamada_capital VARCHAR(50),
    num_parcelas INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_to_bitrix TIMESTAMP
);

CREATE INDEX idx_imoveis_empresa ON public.imoveis(empresa_id);
CREATE INDEX idx_imoveis_created_by ON public.imoveis(created_by_user_id);
CREATE INDEX idx_imoveis_bitrix ON public.imoveis(bitrix_spa_item_id);

CREATE TRIGGER update_imoveis_updated_at BEFORE UPDATE ON public.imoveis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-level security
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY imoveis_user_isolation ON public.imoveis
    FOR ALL
    USING (
        created_by_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ==================================
-- AUTORIZAÇÕES DE VENDA TABLE
-- ==================================

CREATE TABLE IF NOT EXISTS public.autorizacoes_vendas (
    id SERIAL PRIMARY KEY,
    imovel_id INTEGER NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contract terms
    prazo_exclusividade INTEGER DEFAULT 0,
    comissao_percentual DECIMAL(5, 2) DEFAULT 6.00,
    
    -- Status workflow
    status VARCHAR(50) DEFAULT 'rascunho' CHECK (status IN (
        'rascunho', 
        'aguardando_assinatura',
        'assinado',
        'cancelado',
        'encerrado'
    )),
    
    -- ClickSign integration
    clicksign_document_key VARCHAR(255) UNIQUE,
    clicksign_status VARCHAR(50),
    clicksign_request_signature_key VARCHAR(255),
    
    -- PDF storage
    pdf_url TEXT,
    pdf_filename VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signed_at TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_autorizacoes_imovel ON public.autorizacoes_vendas(imovel_id);
CREATE INDEX idx_autorizacoes_created_by ON public.autorizacoes_vendas(created_by_user_id);
CREATE INDEX idx_autorizacoes_status ON public.autorizacoes_vendas(status);
CREATE INDEX idx_autorizacoes_clicksign ON public.autorizacoes_vendas(clicksign_document_key);

CREATE TRIGGER update_autorizacoes_updated_at BEFORE UPDATE ON public.autorizacoes_vendas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-level security
ALTER TABLE public.autorizacoes_vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY autorizacoes_user_isolation ON public.autorizacoes_vendas
    FOR ALL
    USING (
        created_by_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ==================================
-- HELPER VIEWS
-- ==================================

-- View for complete authorization details (joins all related tables)
CREATE OR REPLACE VIEW public.vw_autorizacoes_completas AS
SELECT 
    av.id,
    av.status,
    av.prazo_exclusividade,
    av.comissao_percentual,
    av.clicksign_document_key,
    av.clicksign_status,
    av.pdf_url,
    av.pdf_filename,
    av.created_at,
    av.updated_at,
    av.signed_at,
    av.expires_at,
    
    -- Imóvel data
    i.id as imovel_id,
    i.descricao as imovel_descricao,
    i.endereco as imovel_endereco,
    i.matricula as imovel_matricula,
    i.valor as imovel_valor,
    i.admin_condominio,
    i.valor_condominio,
    i.chamada_capital,
    i.num_parcelas,
    
    -- Empresa data
    e.id as empresa_id,
    e.tipo as empresa_tipo,
    e.nome as empresa_nome,
    e.cpf as empresa_cpf,
    e.rg as empresa_rg,
    e.profissao as empresa_profissao,
    e.estado_civil,
    e.regime_casamento,
    e.endereco as empresa_endereco,
    e.email as empresa_email,
    e.telefone as empresa_telefone,
    e.conjuge_nome,
    e.conjuge_cpf,
    e.conjuge_rg,
    e.conjuge_profissao,
    e.conjuge_email,
    e.razao_social,
    e.cnpj,
    e.inscricao_estadual,
    e.inscricao_municipal,
    e.endereco_sede,
    e.rep_legal_nome,
    e.rep_legal_cpf,
    e.rep_legal_cargo,
    
    -- User data
    up.id as user_id,
    up.name as user_name,
    au.email as user_email
FROM public.autorizacoes_vendas av
JOIN public.imoveis i ON av.imovel_id = i.id
JOIN public.empresas e ON i.empresa_id = e.id
JOIN public.user_profiles up ON av.created_by_user_id = up.id
JOIN auth.users au ON up.id = au.id;
