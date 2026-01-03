# 🧪 Como Testar o Webhook PIX

## ✅ OPÇÃO 1 — Simular Webhook Manualmente (RECOMENDADO)

### 📦 Payload Mínimo para Simular PIX PAGO

```json
{
  "transactionId": "13eb6cd8-5ea6-4e30-bc14-b716cc66ae53",
  "status": "PAID"
}
```

### 🧪 Teste via cURL

```bash
curl -X POST https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "13eb6cd8-5ea6-4e30-bc14-b716cc66ae53",
    "status": "PAID"
  }'
```

### 🧪 Teste via PowerShell (Windows)

```powershell
$body = @{
    transactionId = "13eb6cd8-5ea6-4e30-bc14-b716cc66ae53"
    status = "PAID"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### ✅ Resultado Esperado

```json
{
  "success": true,
  "received": true,
  "transactionId": "13eb6cd8-5ea6-4e30-bc14-b716cc66ae53",
  "status": "PAID"
}
```

---

## ✅ OPÇÃO 2 — Endpoint de Simulação (Desenvolvimento)

### 📍 Endpoint

```
POST /api/dev/simulate-payment
```

### 🧪 Teste via cURL

```bash
curl -X POST https://tiktokshop-orpin.vercel.app/api/dev/simulate-payment \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "13eb6cd8-5ea6-4e30-bc14-b716cc66ae53",
    "status": "PAID"
  }'
```

### ⚠️ Segurança

Em produção, este endpoint deve:
- Exigir token de autenticação
- Ou ser completamente desabilitado
- Ou restrito a IPs específicos

---

## 📋 Checklist de Teste Completo

### 1. Gerar PIX Normalmente
- ✅ Abrir modal de pagamento PIX
- ✅ Preencher dados do cliente
- ✅ Confirmar criação da transação
- ✅ QR Code deve aparecer

### 2. Simular Pagamento
- ✅ Copiar `transactionId` do console/logs
- ✅ Executar curl do webhook com status `PAID`
- ✅ Verificar resposta 200

### 3. Verificar Redirecionamento (se implementado)
- ✅ Ficar na tela do QR Code
- ✅ Executar webhook
- ✅ Em até 5-10s, frontend deve detectar PAID
- ✅ Redirecionar para `/thank-you` ou `/obrigado`

### 4. Testar Idempotência
- ✅ Executar webhook novamente com mesmo `transactionId`
- ✅ Verificar que não processa duas vezes
- ✅ Status continua PAID

---

## 🔍 Status Possíveis

- `WAITING_PAYMENT` - Aguardando pagamento
- `PAID` - Pago
- `EXPIRED` - Expirado
- `REFUNDED` - Reembolsado
- `CANCELLED` - Cancelado

---

## 📝 Exemplos de Payloads

### PIX Pago
```json
{
  "transactionId": "13eb6cd8-5ea6-4e30-bc14-b716cc66ae53",
  "status": "PAID",
  "paidAt": "2024-01-15T10:30:00Z"
}
```

### PIX Expirado
```json
{
  "transactionId": "13eb6cd8-5ea6-4e30-bc14-b716cc66ae53",
  "status": "EXPIRED"
}
```

### PIX Reembolsado
```json
{
  "transactionId": "13eb6cd8-5ea6-4e30-bc14-b716cc66ae53",
  "status": "REFUNDED"
}
```

---

## 🎯 Próximos Passos

Após testar o webhook:

1. ✅ Implementar lógica de atualização no banco
2. ✅ Implementar polling no frontend
3. ✅ Testar redirecionamento automático
4. ✅ Configurar webhook na UmbrellaPag (produção)

