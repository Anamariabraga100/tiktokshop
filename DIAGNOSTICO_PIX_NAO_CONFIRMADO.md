# 🔍 Diagnóstico: PIX Pago mas Não Confirmado no Gateway

## Problema
O PIX foi pago (código sumiu), mas **não consta como pago no gateway UmbrellaPag**.

## Possíveis Causas

### 1️⃣ Webhook Não Configurado no Painel UmbrellaPag
**Sintoma:** Pagamento não aparece no gateway mesmo após ser pago.

**Solução:**
1. Acesse o painel da UmbrellaPag
2. Vá em **Configurações** → **Webhooks**
3. Configure a URL: `https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag`
4. Salve as configurações

**Verificar:**
- Dashboard Vercel → Functions → `/api/webhook-umbrellapag` → Logs
- Se não aparecer nenhum log quando o PIX é pago, o webhook não está configurado

### 2️⃣ PIX Gerado mas Não Foi Realmente Pago
**Sintoma:** Código PIX sumiu, mas pode ter sido apenas expirado ou cancelado.

**Verificar:**
- No painel UmbrellaPag, verifique se a transação existe
- Verifique o status da transação (WAITING_PAYMENT, EXPIRED, etc.)
- O código PIX pode ter expirado (10 minutos)

### 3️⃣ Problema na Detecção Automática do UmbrellaPag
**Sintoma:** PIX foi pago, mas o UmbrellaPag não detectou automaticamente.

**Solução:**
- O UmbrellaPag deveria detectar automaticamente via QR Code
- Se não detectar, o webhook não será chamado
- Verifique se o QR Code foi gerado corretamente

### 4️⃣ PostbackUrl Não Está Sendo Enviado Corretamente
**Sintoma:** Webhook configurado, mas não recebe notificações.

**Verificar:**
- Dashboard Vercel → Functions → `/api/create-pix-transaction` → Logs
- Procure por `postbackUrl` nos logs
- Deve aparecer: `https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag`

## Como Verificar

### Passo 1: Verificar Logs da Criação do PIX
1. Dashboard Vercel → Functions → `/api/create-pix-transaction`
2. Procure por logs recentes
3. Verifique se `postbackUrl` está sendo enviado

### Passo 2: Verificar Logs do Webhook
1. Dashboard Vercel → Functions → `/api/webhook-umbrellapag`
2. Se não aparecer nenhum log quando o PIX é pago, o webhook não está sendo chamado

### Passo 3: Verificar no Painel UmbrellaPag
1. Acesse o painel da UmbrellaPag
2. Vá em **Transações**
3. Procure pela transação pelo `transactionId`
4. Verifique o status:
   - `WAITING_PAYMENT` = Aguardando pagamento
   - `PAID` = Pago (deveria ter disparado webhook)
   - `EXPIRED` = Expirado
   - `CANCELLED` = Cancelado

### Passo 4: Testar Webhook Manualmente
Use o arquivo `public/test-webhook-purchase.html` para simular um webhook:
1. Abra `https://tiktokshop-orpin.vercel.app/test-webhook-purchase.html`
2. Preencha o `transactionId` da transação
3. Clique em "Simular Webhook"
4. Verifique se aparece nos logs do `/api/webhook-umbrellapag`

## Solução Imediata

### Opção 1: Verificar Status Manualmente
O polling já está implementado e deve verificar automaticamente. Mas se não estiver funcionando:

1. Abra o console do navegador (F12)
2. Procure por logs: `🔍 Verificando status do pagamento`
3. Se não aparecer, o polling não está iniciando

### Opção 2: Atualizar Status Manualmente
Se o pagamento foi confirmado mas não atualizou:
1. Use o endpoint `/api/check-payment-status?transactionId=XXX`
2. Ou use o arquivo de teste para simular o webhook

## Checklist

- [ ] Webhook configurado no painel UmbrellaPag
- [ ] URL do webhook está correta: `https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag`
- [ ] `postbackUrl` está sendo enviado na criação do PIX (verificar logs)
- [ ] Transação existe no painel UmbrellaPag
- [ ] Status da transação no UmbrellaPag (WAITING_PAYMENT, PAID, etc.)
- [ ] Logs do webhook aparecem quando PIX é pago
- [ ] Polling está funcionando (verificar console do navegador)

## Próximos Passos

1. **Verificar configuração do webhook no painel UmbrellaPag**
2. **Verificar logs da criação do PIX** (se `postbackUrl` está sendo enviado)
3. **Verificar logs do webhook** (se está recebendo notificações)
4. **Verificar status da transação no painel UmbrellaPag**
5. **Testar webhook manualmente** usando o arquivo de teste

## Contato UmbrellaPag

Se o problema persistir, entre em contato com o suporte da UmbrellaPag:
- Verificar se há algum problema na detecção automática de pagamentos
- Verificar se o webhook está sendo chamado corretamente
- Verificar se há alguma configuração adicional necessária





