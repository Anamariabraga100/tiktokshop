# 🧪 Guia de Teste - Fluxo Completo PIX

## ✅ Como Testar Corretamente (SEM DINHEIRO)

### 📋 Pré-requisitos

1. ✅ Supabase configurado com variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. ✅ Banco de dados com tabela `orders` criada
3. ✅ Endpoint `/api/order-status` consultando banco primeiro

---

## 🎯 Fluxo de Teste Completo

### 1️⃣ Gerar PIX

1. Abrir modal de pagamento PIX
2. Preencher dados do cliente
3. Confirmar criação da transação
4. QR Code será gerado

**O que acontece:**
- Transação criada na UmbrellaPag
- Pedido salvo no banco com `umbrella_status = 'WAITING_PAYMENT'`
- `transactionId` salvo no campo `umbrella_transaction_id`

**Verificar no banco:**
```sql
SELECT 
  order_number,
  umbrella_transaction_id,
  umbrella_status,
  status
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
```
umbrella_status: 'WAITING_PAYMENT'
status: 'aguardando_pagamento'
```

---

### 2️⃣ Simular Webhook (Pagamento)

**Copiar `transactionId` do console ou banco de dados**

```bash
# Usar o transactionId do pedido criado
node test-webhook.js <transactionId> PAID
```

**Exemplo:**
```bash
node test-webhook.js 13eb6cd8-5ea6-4e30-bc14-b716cc66ae53 PAID
```

**O que acontece:**
- Webhook recebe status `PAID`
- Busca pedido no banco por `transactionId`
- Atualiza `umbrella_status = 'PAID'`
- Atualiza `status = 'pago'`
- Atualiza `umbrella_paid_at = timestamp atual`

**Verificar no banco:**
```sql
SELECT 
  order_number,
  umbrella_transaction_id,
  umbrella_status,
  status,
  umbrella_paid_at
FROM orders
WHERE umbrella_transaction_id = '<transactionId>';
```

**Resultado esperado:**
```
umbrella_status: 'PAID'
status: 'pago'
umbrella_paid_at: '2024-01-15T10:30:00Z'
```

---

### 3️⃣ Polling Detecta Mudança

**O que acontece automaticamente:**
- Frontend está fazendo polling a cada 5 segundos
- Consulta `/api/order-status?transactionId=<id>`
- Endpoint consulta **banco primeiro** (fonte da verdade)
- Retorna `status: 'PAID'`
- Frontend detecta mudança
- Redireciona para `/thank-you`

**Logs esperados no console:**
```
📊 Status verificado: { transactionId: '...', status: 'PAID', ... }
✅ Pagamento confirmado pelo backend! Redirecionando...
```

---

### 4️⃣ Página ThankYou Verifica Status

**O que acontece:**
- Página `/thank-you` carrega
- Consulta `/api/order-status?transactionId=<id>`
- Endpoint retorna `status: 'PAID'` (do banco)
- Página mostra confirmação de pagamento

**Se status não for PAID:**
- Página redireciona para home
- Mostra mensagem de erro

---

## 🔍 Verificações Manuais

### Verificar no Supabase Dashboard

1. Acessar Supabase Dashboard
2. Ir em **Table Editor** → **orders**
3. Filtrar por `umbrella_transaction_id`
4. Verificar campos:
   - `umbrella_status` deve ser `PAID`
   - `status` deve ser `pago`
   - `umbrella_paid_at` deve ter timestamp

### Verificar Logs do Backend

**Vercel Logs:**
1. Acessar Vercel Dashboard
2. Ir em **Deployments** → Último deploy
3. Clicar em **Functions** → `/api/order-status`
4. Verificar logs:
   ```
   🔍 Consultando banco de dados para transactionId: ...
   ✅ Pedido encontrado no banco: { ... }
   ```

**Webhook Logs:**
1. Functions → `/api/webhook-umbrellapag`
2. Verificar logs:
   ```
   📥 Webhook recebido: { transactionId: ..., status: 'PAID' }
   ✅ Pedido atualizado no banco: { oldStatus: 'WAITING_PAYMENT', newStatus: 'PAID' }
   ```

---

## ✅ Checklist de Teste

- [ ] PIX gerado com sucesso
- [ ] Pedido salvo no banco com `WAITING_PAYMENT`
- [ ] Webhook simulado com sucesso
- [ ] Banco atualizado para `PAID`
- [ ] Polling detecta mudança
- [ ] Redirecionamento automático funciona
- [ ] Página `/thank-you` mostra confirmação
- [ ] Refresh da página mantém status correto

---

## 🐛 Troubleshooting

### Problema: Polling não detecta mudança

**Causa:** Endpoint não está consultando banco primeiro

**Solução:**
1. Verificar se `/api/order-status` importa `getOrderByTransactionId`
2. Verificar se variáveis de ambiente do Supabase estão configuradas
3. Verificar logs do endpoint

### Problema: Webhook não atualiza banco

**Causa:** Função `updateOrderByTransactionId` não está funcionando

**Solução:**
1. Verificar se `api/lib/supabase.js` existe
2. Verificar se variáveis de ambiente estão configuradas
3. Verificar logs do webhook

### Problema: Pedido não encontrado no banco

**Causa:** Pedido não foi salvo ao criar transação

**Solução:**
1. Verificar se `saveOrderToSupabase` está sendo chamado
2. Verificar se `umbrella_transaction_id` está sendo salvo
3. Verificar logs do frontend

---

## 🎯 Resultado Esperado

Se todos os passos funcionarem:

✅ **Pagamento real também vai funcionar 100%**

O fluxo é idêntico:
1. Usuário paga PIX real
2. UmbrellaPag envia webhook (não simulado)
3. Webhook atualiza banco
4. Polling detecta
5. Redireciona automaticamente

---

## 📝 Notas Importantes

- ⚠️ **Banco é a fonte da verdade**: Endpoint sempre consulta banco primeiro
- ⚠️ **Webhook atualiza banco**: Status vem do webhook, não do polling
- ⚠️ **Polling apenas detecta**: Frontend não decide, apenas detecta mudanças
- ⚠️ **Idempotência garantida**: Webhook não processa duas vezes o mesmo status




