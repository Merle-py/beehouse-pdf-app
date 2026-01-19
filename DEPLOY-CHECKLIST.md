# Checklist Final de Deploy para Produção

## ✅ Arquivos Criados

- [x] `app/login/page.tsx` - Página de login com Bitrix24
- [x] `app/auth/callback/route.ts` - Handler de callback OAuth
- [x] `database/rls-policies.sql` - Políticas de segurança RLS
- [x] `middleware.ts` - Atualizado com verificação de autenticação

## 📋 Passos para Deploy

### 1. Configurar Supab ase (MANUAL)

#### 1.1 Executar SQL de RLS

No Supabase SQL Editor, execute o arquivo:
```
database/rls-policies.sql
```

#### 1.2 Configurar Provider OAuth

**Supabase Dashboard** → Authentication → Providers

1. Click em "Add Provider"
2. Selecione "OAuth" → Custom
3. Configure:
   - **Provider Name**: `bitrix24`
   - **Client ID**: (do app Bitrix24)
   - **Client Secret**: (do app Bitrix24)  
   - **Authorize URL**: `https://viver.bitrix24.com.br/oauth/authorize/`
   - **Access Token URL**: `https://viver.bitrix24.com.br/oauth/token/`
   - **Redirect URL**: Copie e configure no Bitrix24 app

### 2. Configurar Variáveis Vercel

**Vercel Dashboard** → Settings → Environment Variables

#### REMOV ER (se existir):
```
DEV_BYPASS_AUTH
```

#### MANTER/ADICIONAR:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app

# Bitrix24 (opcional - para futuras integrações)
B24_ADMIN_WEBHOOK_URL=https://viver.bitrix24.com.br/rest/1/webhook
B24_ADMIN_IDS=1,38
```

### 3. Deploy

```bash
git add .
git commit -m "feat: add production authentication with Supabase + Bitrix24 OAuth"
git push origin main
```

Vercel fará deploy automaticamente.

### 4. Testar em Produção

1. Acesse `https://seu-app.vercel.app`
2. Deve redirecionar para `/login`
3. Click em "Entrar com Bitrix24"
4. Authorize no Bitrix24
5. Deve redirecionar de volta e fazer login
6. Teste criar empresa/imóvel/autorização

## 🚨 IMPORTANTE

- ✅ `lib/auth/helpers.ts` - NÃO MODIFICAR (já funciona em prod)
- ✅ `lib/supabase/dev-client.ts` - NÃO MODIFICAR (já funciona em prod)
- ❌ **NUNCA** adicionar `DEV_BYPASS_AUTH=true` no Vercel
- ✅ RLS deve estar habilitado ANTES do deploy

## 📝 Troubleshooting

**Se der erro 401 após login**:
- Verifique se RLS foi executado
- Verifique se variáveis Supabase estão corretas
- Verifique logs do Supabase Authentication

**Se não conseguir fazer login**:
- Verifique OAuth provider no Supabase
- Verifique Redirect URL no app Bitrix24
- Verifique logs do Supabase

**Se der erro no middleware**:
- Instale: `npm install @supabase/auth-helpers-nextjs`
