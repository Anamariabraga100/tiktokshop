# 🔍 Diagnóstico da API UmbrellaPag

## ✅ Teste Realizado

Testamos o endpoint `/api/create-pix-transaction` na Vercel e identificamos o problema:

### ❌ Problema Atual

```
Status: 500 Internal Server Error
Content-Type: text/plain (deveria ser application/json)
Resposta: "A server error has occurred"
```

**Erro:** `FUNCTION_INVOCATION_FAILED` - A função serverless está falhando antes de retornar JSON.

## 🔧 Possíveis Causas

### 1. Deploy não atualizado
- ✅ Commit foi feito: `c517132 fix: corrigir erro JSON no endpoint PIX`
- ⚠️ Vercel pode ainda estar usando versão antiga
- **Solução:** Aguardar deploy automático ou fazer redeploy manual

### 2. Variável de ambiente não configurada
- ⚠️ `UMBRELLAPAG_API_KEY` pode não estar configurada na Vercel
- **Solução:** Verificar em Settings → Environment Variables

### 3. Erro de sintaxe no código
- ⚠️ Pode haver erro que impede a função de executar
- **Solução:** Verificar logs da função na Vercel

## 📋 Checklist de Verificação

### Na Vercel Dashboard:

1. **Verificar Deploy**
   - Acesse: https://vercel.com/dashboard
   - Vá em **Deployments**
   - Verifique se o último deploy tem o commit `c517132`
   - Se não, clique em **Redeploy**

2. **Verificar Variáveis de Ambiente**
   - Vá em **Settings** → **Environment Variables**
   - Verifique se existe:
     - `UMBRELLAPAG_API_KEY` = `044d7262-218b-4a1b-a8ca-e9c8685ee0b7`
   - Marque todas as opções: Production, Preview, Development
   - Clique em **Save**

3. **Verificar Logs da Função**
   - Vá em **Deployments** → Último deploy
   - Clique em **Functions** → `/api/create-pix-transaction`
   - Veja os logs para identificar o erro

## 🧪 Como Testar Novamente

### Opção 1: Via Script (Recomendado)
```bash
# Testar na Vercel
$env:TEST_URL="https://tiktokshop-orpin.vercel.app/api/create-pix-transaction"; node test-endpoint.js

# Testar localmente (precisa rodar npm run dev primeiro)
node test-endpoint.js
```

### Opção 2: Via Navegador
1. Abra o DevTools (F12)
2. Vá na aba Console
3. Execute:
```javascript
fetch('https://tiktokshop-orpin.vercel.app/api/create-pix-transaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer: { name: 'Teste', cpf: '12345678900', email: 'teste@teste.com' },
    items: [{ name: 'Produto', price: 1, quantity: 1 }],
    totalPrice: 1
  })
})
.then(r => r.text())
.then(console.log)
```

### Opção 3: Via cURL
```bash
curl -X POST https://tiktokshop-orpin.vercel.app/api/create-pix-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Teste",
      "cpf": "12345678900",
      "email": "teste@teste.com"
    },
    "items": [{"name": "Produto", "price": 1, "quantity": 1}],
    "totalPrice": 1
  }'
```

## ✅ Resultado Esperado Após Correção

```json
{
  "status": 200,
  "success": true,
  "message": "Transação criada com sucesso",
  "data": { ... },
  "pixCode": "00020126...",
  "error": null
}
```

OU (se houver erro):

```json
{
  "status": 500,
  "success": false,
  "message": "Erro ao criar transação PIX",
  "error": "Mensagem de erro clara aqui",
  "data": null
}
```

**Importante:** Sempre JSON válido, nunca texto puro!

## 🚨 Se Ainda Não Funcionar

1. Verifique os logs completos na Vercel
2. Procure por erros de sintaxe JavaScript
3. Verifique se a API Key está correta
4. Teste a API Key diretamente com a UmbrellaPag





