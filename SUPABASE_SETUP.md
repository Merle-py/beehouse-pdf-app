# Supabase Cloud Migration - Setup Guide

## 🚀 Quick Start

### 1. Apply Database Schema

Acesse o [Supabase SQL Editor](https://supabase.com/dashboard/project/rkgypggegjhkdidvvnya/sql/new) e execute o script:

```bash
# Copie todo o conteúdo de database/schema.sql e execute no SQL Editor
```

Ou via linha de comando:

```bash
# Certifique-se de ter o Supabase CLI instalado
npx supabase db push
```

### 2. Configurar Bitrix24 OAuth

No seu Bitrix24, vá em **Aplicativos** > **Aplicativo Local** > **OAuth 2.0**:

1. **URL de Redirecionamento**: `http://localhost:3000/api/auth/bitrix/callback` (dev) ou `https://seu-dominio.vercel.app/api/auth/bitrix/callback` (prod)
2. Anote o `Client ID` e `Client Secret`
3. Configure as permissões necessárias: `user`, `crm` (company, deal)

### 3. Ambiente Está Configurado

Já adicionei as credenciais do Supabase no `.env.local`. Confirme que estão corretas:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rkgypggegjhkdidvvnya.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh... (NUNCA exponha publicamente!)
```

### 4. Testar Autenticação

```bash
npm run dev

# Acesse: http://localhost:3000/api/auth/bitrix/login?domain=seu-dominio.bitrix24.com.br
```

## 📋 Arquitetura Implementada

### Autenticação: Bitrix24 OAuth → Supabase Auth

**Fluxo:**
1. Usuário clica "Entrar com Bitrix24"
2. Redireciona para `/api/auth/bitrix/login?domain=...`
3. Bitrix24 autentica e retorna código OAuth
4. `/api/auth/bitrix/callback` recebe o código
5. Cria/atualiza usuário no Supabase Auth
6. Cria/atualiza perfil em `user_profiles`
7. Gera sessão Supabase e redireciona para app

**Benefícios:**
- ✅ Sem necessidade de senhas
- ✅ SSO nativo com Bitrix24
- ✅ Sincronização automática de usuários
- ✅ Controle de admin/broker baseado no Bitrix24

### Database: Supabase PostgreSQL com RLS

**Tabelas:**
- `auth.users` - Gerenciada pelo Supabase (email, senha hash, etc.)
- `user_profiles` - Estende auth.users (bitrix_user_id, role, name)
- `empresas` - Empresas PF/PJ
- `imoveis` - Imóveis vinculados a empresas
- `autorizacoes_vendas` - Autorizações de venda

**Row-Level Security (RLS):**
- Todos os endpoints usam `auth.uid()` automaticamente
- Usuários só veem seus próprios dados
- Admins (role='admin') veem todos os dados
- 100% gerenciado pelo Supabase (não precisa de código extra)

### API Endpoints (Todos com RLS)

#### Auth
- `GET /api/auth/me` - Retorna usuário Supabase atual
- `GET /api/auth/bitrix/login?domain=...` - Inicia OAuth Bitrix24
- `GET /api/auth/bitrix/callback` - Callback OAuth

#### Empresas
- `GET /api/empresas` - Lista (filtros: `tipo`, `search`)
- `GET /api/empresas/:id` - Detalhes + imóveis vinculados
- `POST /api/empresas` - Cria (PF ou PJ)
- `PUT /api/empresas/:id` - Atualiza
- `DELETE /api/empresas/:id` - Deleta (cascata)

#### Imóveis
- `GET /api/imoveis` - Lista (filtro: `empresa_id`)
- `GET /api/imoveis/:id` - Detalhes
- `POST /api/imoveis` - Cria
- `PUT /api/imoveis/:id` - Atualiza
- `DELETE /api/imoveis/:id` - Deleta (cascata)

#### Autorizações
- `GET /api/autorizacoes` - Lista (filtros: `status`, `imovel_id`)
- `GET /api/autorizacoes/:id` - Detalhes completos (view com joins)
- `POST /api/autorizacoes` - Cria
- `PUT /api/autorizacoes/:id` - Atualiza (bloqueia se assinado)
- `DELETE /api/autorizacoes/:id` - Deleta (bloqueia se assinado)

## 🧪 Testando a API

### 1. Autenticar via Bitrix24

```bash
# 1. Abra o navegador em:
http://localhost:3000/api/auth/bitrix/login?domain=seu-dominio.bitrix24.com.br

# 2. Faça login no Bitrix24
# 3. O sistema vai criar automaticamente sua conta no Supabase
# 4. Copie o cookie de sessão (inspecionar navegador > Application > Cookies)
```

### 2. Testar Endpoints com cURL

```bash
# As requisições usam cookies de sessão automaticamente se feitas pelo navegador
# Para testes com cURL/Postman, você precisa do access_token do Supabase

# Obter todos as empresas
curl http://localhost:3000/api/empresas \
  -H "Cookie: sb-access-token=..." \
  -H "Cookie: sb-refresh-token=..."

# Criar empresa PF
curl -X POST http://localhost:3000/api/empresas \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "tipo": "PF",
    "nome": "João da Silva",
    "cpf": "12345678900",
    "email": "joao@example.com",
    "telefone": "11999999999"
  }'

# Criar empresa PJ
curl -X POST http://localhost:3000/api/empresas \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "tipo": "PJ",
    "razao_social": "Empresa LTDA",
    "cnpj": "12345678000199",
    "email": "contato@empresa.com"
  }'
```

## 🔐 Segurança

### Row-Level Security (RLS)

Todas as tabelas têm policies configuradas:

```sql
-- Exemplo: empresas
CREATE POLICY empresas_user_isolation ON empresas
    FOR ALL
    USING (
        created_by_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
```

**Isso significa:**
- Usuários normais só veem registros onde `created_by_user_id` = seu UUID
- Admins veem todos os registros
- Implementado 100% no banco de dados (não depende de código)

### Service Role Key

⚠️ **NUNCA exponha a `SUPABASE_SERVICE_ROLE_KEY` no frontend!**

Use apenas em:
- Server-side (Next.js API routes)
- Operações administrativas
- Sync com Bitrix24

## 🎯 Próximos Passos

### Fase 3: PDF & ClickSign

Agora que o backend está pronto:

1. **Adaptar geração de PDF** para buscar dados do Supabase
   - Endpoint: `POST /api/autorizacoes/:id/generate-pdf`
   - Buscar dados completos da view `vw_autorizacoes_completas`

2. **Integrar ClickSign API v3**
   - Upload de documento
   - Adicionar signatários
   - Criar lista de assinaturas
   - Webhook para status

3. **Frontend UI** (Next.js + React)
   - Login com Bitrix24
   - Dashboard de autorizações
   - Formulários para Empresas/Imóveis/Autorizações

## 📚 Recursos Úteis

- [Supabase Dashboard](https://supabase.com/dashboard/project/rkgypggegjhkdidvvnya)
- [Supabase Docs - RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Bitrix24 OAuth Docs](https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=99&LESSON_ID=2280)
