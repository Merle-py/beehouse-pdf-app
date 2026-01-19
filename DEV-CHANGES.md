MudanÃ§as TemporÃ¡rias para Desenvolvimento
Este documento lista TODAS as alteraÃ§Ãµes temporÃ¡rias feitas para permitir testes locais sem autenticaÃ§Ã£o do Supabase. ESTAS MUDANÃ‡AS DEVEM SER REVERTIDAS ANTES DE DEPLOYMENT EM PRODUÃ‡ÃƒO.

ðŸ“‹ Resumo Executivo
Status Atual: Modo de desenvolvimento com bypass de autenticaÃ§Ã£o habilitado Objetivo: Permitir testes locais sem configurar autenticaÃ§Ã£o Supabase âš ï¸� ATENÃ‡ÃƒO: Este modo NÃƒO Ã‰ SEGURO para produÃ§Ã£o!

ðŸ”§ MudanÃ§as Implementadas
1. Arquivo de AutenticaÃ§Ã£o Helper
Arquivo: 
lib/auth/helpers.ts

O que foi criado:

FunÃ§Ã£o 
getAuthenticatedUser()
 com bypass de desenvolvimento
Quando DEV_BYPASS_AUTH=true, retorna um usuÃ¡rio mock sem validar token
CÃ³digo adicionado:

// Development bypass
if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
    console.log('[AUTH] Development bypass enabled - using mock user');
    return {
        user: {
            // Use Bitrix24 user ID (INTEGER, not UUID)
            // This mirrors Bitrix24's user.id for permission checking
            id: 38931, // Bitrix24 user ID
            email: 'dev@localhost',
            role: 'authenticated',
        }
    };
}
Para ProduÃ§Ã£o:

âœ… Manter o arquivo
â�Œ Remover a variÃ¡vel DEV_BYPASS_AUTH do .env de produÃ§Ã£o
âœ… O cÃ³digo automaticamente usarÃ¡ autenticaÃ§Ã£o real quando a variÃ¡vel nÃ£o existir
2. VariÃ¡vel de Ambiente
Arquivo: 
.env.local

Linha adicionada:

# Development auth bypass (set to true for local testing without Supabase auth)
DEV_BYPASS_AUTH=true
Para ProduÃ§Ã£o:

â�Œ NUNCA adicionar esta variÃ¡vel ao .env de produÃ§Ã£o
â�Œ NUNCA commitÃ¡-la no Git
âœ… Adicionar ao 
.gitignore
 se necessÃ¡rio
3. APIs Modificadas
Todas as seguintes APIs foram atualizadas para usar 
getAuthenticatedUser()
:

Arquivos Modificados:
app/api/autorizacoes/[id]/generate-pdf/route.ts

âœ… POST endpoint
MudanÃ§a aplicada em todos:

// ANTES (ProduÃ§Ã£o):
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
    return NextResponse.json({ error: 'NÃ£o autenticado' }, { status: 401 });
}
// DEPOIS (Desenvolvimento):
const { user, response } = await getAuthenticatedUser();
if (!user) return response!;
Para ProduÃ§Ã£o:

âœ… NENHUMA mudanÃ§a necessÃ¡ria
âœ… O helper automaticamente usa autenticaÃ§Ã£o real quando DEV_BYPASS_AUTH nÃ£o estÃ¡ definido
### 4. ~~RemoÃ§Ã£o~~ RestauraÃ§Ã£o do `created_by_user_id`

**Arquivo**: `app/api/empresas/route.ts` (linha ~73-83)

**Status**: âœ… **RESTAURADO** (nÃ£o precisa mais reverter para produÃ§Ã£o)

**CÃ³digo atual**:
```typescript
const { data: empresa, error } = await supabase
    .from('empresas')
    .insert({
        ...data,
        created_by_user_id: user.id,  // âœ… Usa UUID mock em dev, UUID real em produÃ§Ã£o
    })
    .select()
    .single();
```

**Para ProduÃ§Ã£o**:
- âœ… **NENHUMA mudanÃ§a necessÃ¡ria**
- âœ… O campo jÃ¡ estÃ¡ sendo preenchido corretamente

---

### 5. Client Supabase com Bypass de RLS

**Arquivo**: `lib/supabase/dev-client.ts` (NOVO ARQUIVO)

**O que foi criado**:
- FunÃ§Ã£o `getSupabaseClient()` que retorna client apropriado
- Em **desenvolvimento**: Usa **Service Role Key** â†’ Bypassa RLS completamente
- Em **produÃ§Ã£o**: Usa **Anon Key** â†’ Respeita RLS

**CÃ³digo**:
```typescript
export function getSupabaseClient() {
    // Development bypass - use service role client to bypass RLS
    if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
        console.log('[SUPABASE] Development bypass - using service role client (bypasses RLS)');
        
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,  // â†� Service Role = Bypassa RLS
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                }
            }
        );
    }

    // Production - use regular client with RLS
    return createBrowserClient(
**Para ProduÃ§Ã£o**:
- âœ… **MANTER o arquivo** `lib/supabase/dev-client.ts`
- â�Œ Garantir que `DEV_BYPASS_AUTH` NÃƒO esteja definido
- âœ… O cÃ³digo automaticamente usarÃ¡ Anon Key (com RLS) em produÃ§Ã£o
- âš ï¸� **NUNCA** expor Service Role Key no frontend
- âœ… Verificar que todas as APIs usam este helper ao invÃ©s de `createClient()` direto

---

## ðŸš€ Checklist para ProduÃ§Ã£o
Passo 1: Configurar AutenticaÃ§Ã£o Supabase
 Configurar Supabase Auth (Email, OAuth, etc.)
 Testar fluxo de login/logout
 Configurar redirecionamentos pÃ³s-login
Passo 2: Remover Bypass de Desenvolvimento
No .env de produÃ§Ã£o:
# â�Œ NÃƒO INCLUIR ESTAS LINHAS:
# DEV_BYPASS_AUTH=true
Verificar variÃ¡veis de produÃ§Ã£o:
# âœ… INCLUIR ESTAS (com valores reais):
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key
Passo 3: Restaurar created_by_user_id
Arquivo: 
app/api/empresas/route.ts

Reverter para:

const { data: empresa, error } = await supabase
    .from('empresas')
    .insert({
        ...data,
        created_by_user_id: user.id,
    })
    .select()
    .single();
Passo 4: Configurar Row Level Security (RLS)
Ativar RLS em todas as tabelas:

-- Empresas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own empresas"
    ON empresas FOR SELECT
    USING (auth.uid() = created_by_user_id);
CREATE POLICY "Users can create empresas"
    ON empresas FOR INSERT
    WITH CHECK (true);
CREATE POLICY "Users can update their own empresas"
    ON empresas FOR UPDATE
    USING (auth.uid() = created_by_user_id);
CREATE POLICY "Users can delete their own empresas"
    ON empresas FOR DELETE
    USING (auth.uid() = created_by_user_id);
-- Repetir para imoveis e autorizacoes_vendas
Passo 5: Configurar Bitrix24 (Opcional)
Se quiser sincronizaÃ§Ã£o com Bitrix24:

No .env de produÃ§Ã£o:

B24_ADMIN_WEBHOOK_URL=https://seu-portal.bitrix24.com.br/rest/1/seu-webhook/
B24_PROPERTY_ENTITY_TYPE_ID=seu-entity-type-id
B24_ADMIN_IDS=1,38
Passo 6: Testar em Staging
 Deploy para ambiente de staging
 Testar login completo
 Criar empresa autenticado
 Criar imÃ³vel autenticado
 Criar autorizaÃ§Ã£o autenticada
 Verificar que usuÃ¡rios nÃ£o veem dados de outras contas
 Testar logout
Passo 7: Security Checklist
 DEV_BYPASS_AUTH NÃƒO estÃ¡ em .env de produÃ§Ã£o
 RLS habilitado em todas as tabelas
 Service Role Key nÃ£o exposta no frontend
 CORS configurado corretamente
 Rate limiting implementado (se necessÃ¡rio)
 Logs de seguranÃ§a habilitados
ðŸ“� Arquivos para Revisar Antes de Deploy
### Arquivos CrÃ­ticos:

1. **`.env` (produÃ§Ã£o)** â†� Verificar que `DEV_BYPASS_AUTH` NÃƒO existe
2. **`lib/auth/helpers.ts`** â†� Manter como estÃ¡ (bypass sÃ³ funciona se var estiver definida)
3. **`lib/supabase/dev-client.ts`** â†� Manter como estÃ¡ (usa Service Role apenas em dev)
4. **`app/api/empresas/route.ts`** â†� Restaurar `created_by_user_id`
5. **Todas as APIs listadas na seÃ§Ã£o 3** â†� JÃ¡ estÃ£o prontas (usam helper)

### Script de VerificaÃ§Ã£o:
# Execute antes de fazer deploy
grep -r "DEV_BYPASS_AUTH" .env*
# Retorno esperado: apenas em .env.local ou .env.example
# Retorno proibido: em .env ou .env.production
ðŸ”„ Como Reverter TUDO (EmergÃªncia)
Se precisar voltar ao estado anterior (sem bypass):

Remover DEV_BYPASS_AUTH do 
.env.local
Deletar 
lib/auth/helpers.ts
Executar:
git diff app/api
Reverter todas as mudanÃ§as em app/api/ que trocaram supabase.auth.getUser() por getAuthenticatedUser()
ðŸ“� Notas Adicionais
Por que esta abordagem?
âœ… Permite desenvolvimento local sem configurar auth
âœ… NÃ£o expÃµe dados sensÃ­veis
âœ… FÃ¡cil de habilitar/desabilitar (variÃ¡vel de ambiente)
âœ… CÃ³digo de produÃ§Ã£o fica seguro automaticamente
Riscos se esquecer de remover:
âš ï¸� CRÃ�TICO: Qualquer pessoa pode acessar a API sem autenticaÃ§Ã£o
âš ï¸� ALTO: Dados de todos os usuÃ¡rios ficam expostos
âš ï¸� ALTO: ViolaÃ§Ã£o de LGPD/GDPR
RecomendaÃ§Ã£o Final:
Antes de cada deploy para produÃ§Ã£o, executar:

# 1. Verificar variÃ¡veis
cat .env | grep -i bypass
# 2. Se retornar algo, ABORTAR o deploy
# 3. Se nÃ£o retornar nada, prosseguir
# 4. Verificar commit
git diff --staged | grep -i "DEV_BYPASS"
# 5. Se retornar algo, REMOVER do commit
âœ… Checklist RÃ¡pido de Deploy
Antes de fazer push/deploy:

 DEV_BYPASS_AUTH removido do .env de produÃ§Ã£o
 created_by_user_id restaurado em /api/empresas/route.ts
 RLS configurado no Supabase
 AutenticaÃ§Ã£o testada em staging
 Politicas de acesso verificadas
 Logs de produÃ§Ã£o habilitados
Data de criaÃ§Ã£o: 2026-01-19
Ãšltima atualizaÃ§Ã£o: 2026-01-19
ResponsÃ¡vel: Desenvolvimento
Status: âš ï¸� Modo de Desenvolvimento Ativo

## ?? Importante: Sistema de Permissões

**created_by_user_id**: Campo INTEGER (não UUID) que espelha o ID do usuário no Bitrix24.

**Controle de Acesso**:
- ? Usuário que criou o registro: Vê todos os detalhes
- ? Administradores (IDs em B24_ADMIN_IDS): Veem todos os registros
- ? Outros usuários: Veem apenas nome/título limitado

**Em Desenvolvimento**: Usa ID fixo 38931 (seu ID no Bitrix24)
**Em Produção**: Usa ID real do usuário autenticado no Bitrix24
