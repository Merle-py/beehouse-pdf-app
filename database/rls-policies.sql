-- ============================================
-- SCRIPT DE ROW LEVEL SECURITY SIMPLIFICADO
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- 
-- NOTA: Estas políticas permitem acesso a usuários autenticados.
-- Em uma versão futura, implementaremos controle granular
-- baseado em user_id do Bitrix24.

-- ============================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE autorizacoes_vendas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. REMOVER POLÍTICAS ANTIGAS (se existirem)
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own empresas" ON empresas;
DROP POLICY IF EXISTS "Admins can view all empresas" ON empresas;
DROP POLICY IF EXISTS "Authenticated users can create empresas" ON empresas;
DROP POLICY IF EXISTS "Users can update own empresas" ON empresas;
DROP POLICY IF EXISTS "Users can delete own empresas" ON empresas;
DROP POLICY IF EXISTS "Users can view own imoveis" ON imoveis;
DROP POLICY IF EXISTS "Admins can view all imoveis" ON imoveis;
DROP POLICY IF EXISTS "Authenticated users can create imoveis" ON imoveis;
DROP POLICY IF EXISTS "Users can update own imoveis" ON imoveis;
DROP POLICY IF EXISTS "Users can delete own imoveis" ON imoveis;
DROP POLICY IF EXISTS "Users can view own autorizacoes" ON autorizacoes_vendas;
DROP POLICY IF EXISTS "Admins can view all autorizacoes" ON autorizacoes_vendas;
DROP POLICY IF EXISTS "Authenticated users can create autorizacoes" ON autorizacoes_vendas;
DROP POLICY IF EXISTS "Users can update own autorizacoes" ON autorizacoes_vendas;
DROP POLICY IF EXISTS "Users can delete own autorizacoes" ON autorizacoes_vendas;

-- ============================================
-- 3. POLÍTICAS SIMPLIFICADAS (Baseadas em Autenticação)
-- ============================================

-- USERS: Qualquer usuário autenticado pode ver todos os usuários
CREATE POLICY "authenticated_users_can_view_all_users"
ON users FOR SELECT
TO authenticated
USING (true);

-- EMPRESAS: Usuários autenticados têm acesso total
CREATE POLICY "authenticated_users_full_access_empresas"
ON empresas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- IMÓVEIS: Usuários autenticados têm acesso total
CREATE POLICY "authenticated_users_full_access_imoveis"
ON imoveis FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- AUTORIZAÇÕES: Usuários autenticados têm acesso total
CREATE POLICY "authenticated_users_full_access_autorizacoes"
ON autorizacoes_vendas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. VERIFICAR POLÍTICAS CRIADAS
-- ============================================

SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- PRÓXIMOS PASSOS (FUTURO)
-- ============================================

-- Para implementar controle de acesso granular baseado em
-- Bitrix24 user ID, será necessário:
--
-- 1. Criar tabela de mapeamento auth_user_id -> bitrix24_user_id
-- 2. Criar função helper: get_current_bitrix24_user_id()
-- 3. Atualizar políticas para usar essa função
-- 4. Implementar verificação de admin baseado em B24_ADMIN_IDS
