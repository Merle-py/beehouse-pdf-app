# 🧪 Guia de Verificação e Teste

## ✅ Status da Implementação

O sistema foi totalmente implementado e o servidor de desenvolvimento está rodando!

## 🔍 Checklist de Verificação Rápida

### 1. Verificar se o servidor está rodando
- ✅ Servidor iniciado: `npm run dev`
- 🌐 URL: [http://localhost:3000](http://localhost:3000)

### 2. Configurar Variáveis de Ambiente

Antes de testar o fluxo completo, você precisa:

1. **Criar arquivo `.env.local`** na raiz do projeto:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Editar `.env.local`** com suas credenciais:
   ```env
   # OBRIGATÓRIO: Webhook de Administrador do Bitrix24
   B24_ADMIN_WEBHOOK_URL=https://SEU-DOMINIO.bitrix24.com.br/rest/1/CODIGO_WEBHOOK/
   
   # OBRIGATÓRIO: ID do SPA "Imóveis"
   B24_PROPERTY_ENTITY_TYPE_ID=1234
   
   # Opcional (já configurado na Vercel automaticamente)
   KV_REST_API_URL=
   KV_REST_API_TOKEN=
   ```

3. **Reiniciar o servidor** após configurar (Ctrl+C e `npm run dev` novamente)

### 3. Testar Interface (Modo Standalone)

Mesmo sem configurar o Bitrix24, você pode testar a interface:

1. Abra [http://localhost:3000](http://localhost:3000)
2. Você verá o badge: **"Modo standalone (sem Bitrix24)"**
3. Teste o formulário:
   - ✅ Seleção de tipo de contratante funciona
   - ✅ Campos dinâmicos aparecem
   - ✅ Formulário aceita dados

⚠️ **Sem `.env.local` configurado**, ao clicar em "Cadastrar e Gerar Autorização", você receberá erro de configuração.

### 4. Testar Geração de PDF (Standalone)

Para testar **apenas** a geração de PDF sem Bitrix24:

**Usando cURL/PowerShell:**

```powershell
# Teste standalone de geração de PDF
$body = @{
    authType = "pf-solteiro"
    contratanteNome = "João da Silva"
    contratanteCpf = "123.456.789-00"
    contratanteEmail = "joao@email.com"
    contratanteProfissao = "Engenheiro"
    contratanteEndereco = "Rua Teste, 123"
    imovelDescricao = "Apartamento 3 quartos"
    imovelEndereco = "Rua do Imóvel, 456"
    imovelValor = 350000
    contratoPrazo = 90
    contratoComissaoPct = 6
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/pdf/generate" -Method POST -Body $body -ContentType "application/json" -OutFile "teste.pdf"
```

Isso deve gerar um arquivo `teste.pdf` sem erros.

### 5. Testar Fluxo Completo (COM Bitrix24)

Após configurar `.env.local`:

**Via Interface:**
1. Acesse [http://localhost:3000](http://localhost:3000)
2. Selecione tipo de contratante (ex: PF Solteiro)
3. Preencha os dados:
   - Nome Completo
   - CPF
   - Email
   - Descrição do Imóvel
   - Endereço do Imóvel
   - Valor do Imóvel
   - Prazo de Exclusividade (padrão: 90 dias)
   - Comissão (padrão: 6%)
4. Clique em **"Cadastrar e Gerar Autorização"**
5. Verifique:
   - ✅ Toast de sucesso aparece
   - ✅ PDF é baixado automaticamente
   - ✅ No console: `companyId` e `propertyItemId` são exibidos

**Via API (cURL/PowerShell):**

```powershell
$body = @{
    authType = "pf-solteiro"
    contratante = @{
        nome = "Maria Silva"
        cpf = "987.654.321-00"
        email = "maria@email.com"
        profissao = "Advogada"
        endereco = "Rua Principal, 789"
    }
    imovelUnico = @{
        descricao = "Casa 4 quartos com piscina"
        endereco = "Av. Central, 1000"
        valor = 750000
        matricula = "12345"
    }
    contrato = @{
        prazo = 90
        comissaoPct = 6
    }
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/bitrix/cadastro-autorizacao" -Method POST -Body $body -ContentType "application/json"
$response
```

### 6. Verificar no Bitrix24

Após executar o fluxo completo com sucesso:

1. **Acesse o Bitrix24 como Administrador**
2. Vá em **CRM** > **Empresas**
3. Verifique se a Company foi criada (ex: "Maria Silva")
4. Vá em **CRM** > **Smart Process (SPA)** > **Imóveis**
5. Verifique se o Item foi criado e está vinculado à Company

**Teste importante:**
- Tente acessar como **corretor** (sem permissão de Companies)
- Você **NÃO** deve conseguir ver a Company diretamente
- Mas **DEVE** conseguir ver o Item de Imóvel no SPA

## 🐛 Troubleshooting

### Erro: "Cannot find module 'next'"
**Solução:** Execute `npm install` novamente

### Erro: "B24_ADMIN_WEBHOOK_URL não configurado"
**Solução:** Configure o `.env.local` e reinicie o servidor

### Erro: "EADDRINUSE: address already in use"
**Solução:** Porta 3000 ocupada. Mate o processo ou use `npm run dev -- -p 3001`

### PDF não é gerado
**Solução:** Verifique os logs do console no navegador (F12) e no terminal do servidor

### Company não é criada no Bitrix24
**Solução:** 
1. Verifique se o webhook tem permissões `crm.company.add`
2. Teste o webhook diretamente: `https://SEU-DOMINIO.bitrix24.com.br/rest/1/CODIGO/crm.company.list`

## 📊 Exemplos de Dados para Teste

### Exemplo 1: PF Solteiro
```json
{
  "authType": "pf-solteiro",
  "contratante": {
    "nome": "Carlos Alberto Santos",
    "cpf": "111.222.333-44",
    "email": "carlos@email.com",
    "profissao": "Médico",
    "endereco": "Rua das Flores, 100"
  },
  "imovelUnico": {
    "descricao": "Apartamento 2 quartos",
    "endereco": "Av. Brasil, 500",
    "valor": 280000
  },
  "contrato": {
    "prazo": 60,
    "comissaoPct": 5
  }
}
```

### Exemplo 2: Pessoa Jurídica
```json
{
  "authType": "pj",
  "empresa": {
    "razaoSocial": "Construtora ABC LTDA",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@abc.com",
    "telefone": "(47) 3333-4444"
  },
  "repLegal": {
    "nome": "Roberto Lima",
    "cpf": "555.666.777-88",
    "cargo": "Diretor"
  },
  "imovelUnico": {
    "descricao": "Sala comercial 50m²",
    "endereco": "Centro Empresarial, Sala 801",
    "valor": 450000
  },
  "contrato": {
    "prazo": 120,
    "comissaoPct": 4
  }
}
```

## 🚀 Próximos Passos

1. ✅ Testar interface localmente
2. ⚙️ Configurar `.env.local`
3. 🧪 Testar geração de PDF standalone
4. 🔗 Testar fluxo completo com Bitrix24
5. 📦 Deploy na Vercel
6. 🔧 Configurar aplicação no Bitrix24
7. 👥 Testar com corretor real

## 📝 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Executar produção localmente
npm run build && npm start

# Limpar cache do Next.js
rm -rf .next

# Ver logs detalhados
npm run dev -- --debug
```

## 🎯 Critérios de Sucesso

- [ ] Interface carrega sem erros
- [ ] Formulário aceita todos os tipos de contratante
- [ ] PDF é gerado corretamente (teste standalone)
- [ ] Company é criada no Bitrix24 via webhook
- [ ] SPA Item é criado e vinculado à Company
- [ ] Corretor NÃO consegue ver Company diretamente
- [ ] Corretor CONSEGUE ver o Item de Imóvel
- [ ] PDF contém todos os dados preenchidos
- [ ] Sistema funciona dentro do iframe do Bitrix24
