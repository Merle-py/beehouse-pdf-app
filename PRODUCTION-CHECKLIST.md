# ⚠️ LEIA ANTES DE FAZER DEPLOY ⚠️

Este projeto contém **mudanças temporárias para desenvolvimento** que devem ser **REMOVIDAS** antes de ir para produção.

## 🔧 Setup para Desenvolvimento Local

**IMPORTANTE**: Execute este SQL no Supabase SQL Editor para criar o usuário de desenvolvimento:

```sql
INSERT INTO public.users (id, email, password_hash, name, role, bitrix_user_id)
VALUES (38931, 'dev@localhost', 'dev-hash', 'Dev User', 'admin', 38931)
ON CONFLICT (id) DO NOTHING;
```

Arquivo completo: `database/dev-user-setup.sql`

---

## 📚 Documentação Completa

Leia o arquivo `DEV-CHANGES.md` (na pasta brain/artifacts) para detalhes completos sobre:

- Todas as mudanças feitas para desenvolvimento
- Checklist detalhado para produção
- Como reverter as mudanças
- Security checklist

## ⚡ Checklist Rápido

Antes de fazer deploy para produção:

- [ ] ❌ Remover `DEV_BYPASS_AUTH=true` do `.env`
- [ ] ✅ Verificar que `lib/supabase/dev-client.ts` existe (usa Anon Key em produção)
- [ ] ✅ Configurar Supabase Auth (login/signup)
- [ ] ✅ Habilitar Row Level Security (RLS) no Supabase
- [ ] ✅ Testar autenticação completa em staging
- [ ] ✅ Verificar que Service Role Key **NÃO** está exposta no frontend

## 🚨 CRÍTICO

**NÃO FAZER DEPLOY SEM**:
1. Remover bypass de autenticação
2. Configurar RLS no banco
3. Testar login em staging

**Consequências de deploy com bypass**:
- 🔓 API totalmente sem proteção
- 📊 Dados de todos os usuários expostos
- ⚖️ Violação de LGPD

---

Veja `DEV-CHANGES.md` para instruções completas.
