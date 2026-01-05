# 🔧 Como Atualizar Pagamento Manualmente

Quando o webhook não funciona ou não é chamado, você pode atualizar o status do pagamento manualmente.

## 🎯 Quando Usar

- ✅ Pagamento foi realizado mas status não mudou
- ✅ Webhook não foi chamado
- ✅ Status no gateway é PAID mas no banco é WAITING_PAYMENT
- ✅ Testes e correções urgentes

## 📋 Métodos

### Método 1: Endpoint Automático (Recomendado)

O endpoint `/api/order-status` agora verifica automaticamente o gateway quando o banco mostra WAITING_PAYMENT. Se o gateway mostrar PAID, atualiza o banco automaticamente.

**Não precisa fazer nada!** O polling já faz isso automaticamente.

### Método 2: Endpoint Manual

Para forçar uma atualização manual:

```bash
curl -X POST https://tiktokshop-orpin.vercel.app/api/manual-update-payment \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "d76e42b7-5bd3-46d7-8660-586bd2baaefc"}'
```

Ou use Postman/Insomnia:
- **URL:** `https://tiktokshop-orpin.vercel.app/api/manual-update-payment`
- **Method:** POST
- **Body:**
```json
{
  "transactionId": "d76e42b7-5bd3-46d7-8660-586bd2baaefc",
  "force": false
}
```

**Parâmetros:**
- `transactionId` (obrigatório): ID da transação
- `force` (opcional): Forçar atualização mesmo se já estiver PAID

### Método 3: Atualizar Diretamente no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor** → `orders`
3. Encontre o pedido pelo `umbrella_transaction_id`
4. Atualize:
   - `umbrella_status` → `PAID`
   - `status` → `pago`
   - `umbrella_paid_at` → Data/hora atual
   - `umbrella_end_to_end_id` → (se disponível)

### Método 4: SQL Direto

```sql
UPDATE orders 
SET 
  umbrella_status = 'PAID',
  status = 'pago',
  umbrella_paid_at = NOW(),
  updated_at = NOW()
WHERE umbrella_transaction_id = 'd76e42b7-5bd3-46d7-8660-586bd2baaefc';
```

## 🔍 Verificar Antes de Atualizar

Use o endpoint de debug primeiro:

```
https://tiktokshop-orpin.vercel.app/api/debug-payment?transactionId=SEU_TRANSACTION_ID
```

Isso mostra:
- Status no banco
- Status no gateway
- Se precisa atualizar

## ✅ Resposta do Endpoint Manual

### Sucesso (Atualizado)

```json
{
  "success": true,
  "message": "Status atualizado com sucesso",
  "oldStatus": "WAITING_PAYMENT",
  "newStatus": "PAID",
  "updated": true,
  "order": {
    "order_number": "ABC123",
    "umbrella_status": "PAID",
    "status": "pago",
    "umbrella_paid_at": "2026-01-03T17:52:00.000Z"
  }
}
```

### Já Atualizado

```json
{
  "success": true,
  "message": "Status já está atualizado",
  "currentStatus": "PAID",
  "gatewayStatus": "PAID",
  "updated": false
}
```

### Ainda Aguardando

```json
{
  "success": true,
  "message": "Pagamento ainda não foi confirmado no gateway",
  "currentStatus": "WAITING_PAYMENT",
  "gatewayStatus": "WAITING_PAYMENT",
  "updated": false,
  "recommendation": "Aguarde alguns minutos ou verifique se o pagamento foi realizado corretamente"
}
```

## 🚀 Melhoria Implementada

O endpoint `/api/order-status` agora:

1. **Consulta o banco primeiro** (fonte da verdade)
2. **Se status é WAITING_PAYMENT**, verifica o gateway também
3. **Se gateway mostra PAID**, atualiza o banco automaticamente
4. **Retorna o status atualizado**

Isso significa que o **polling agora detecta pagamentos mesmo se o webhook falhar!**

## 📊 Fluxo Melhorado

```
Polling → /api/order-status
  ↓
Consulta banco (WAITING_PAYMENT)
  ↓
Consulta gateway (PAID) ← Detecta pagamento!
  ↓
Atualiza banco automaticamente
  ↓
Retorna PAID para o frontend
  ↓
Frontend redireciona para /thank-you
```

## ⚠️ Importante

- O endpoint manual é para casos especiais
- O polling automático já faz isso agora
- Sempre verifique com `/api/debug-payment` primeiro
- Use `force: true` apenas se realmente necessário

## 🎉 Resultado

Agora o sistema detecta pagamentos mesmo se o webhook não funcionar! O polling verifica o gateway automaticamente e atualiza o banco quando necessário.



