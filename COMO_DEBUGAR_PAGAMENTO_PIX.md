# 🔍 Como Debugar Pagamento PIX Não Confirmado

Este guia explica como verificar por que um pagamento PIX não está sendo confirmado mesmo após o pagamento real.

## 🎯 Problema: Paguei o PIX mas não confirmou

### Passo 1: Verificar Status no Console

1. Abra o DevTools (F12) → **Console**
2. Procure por logs:
   ```
   📊 Status verificado: { transactionId: '...', status: 'WAITING_PAYMENT' }
   ```
3. Se o status continua `WAITING_PAYMENT`, o problema pode ser:
   - Webhook não recebeu a notificação
   - Banco de dados não foi atualizado
   - Polling não está detectando a mudança

### Passo 2: Usar Endpoint de Debug

Acesse no navegador ou faça uma requisição:

```
https://tiktokshop-orpin.vercel.app/api/debug-payment?transactionId=SEU_TRANSACTION_ID
```

Substitua `SEU_TRANSACTION_ID` pelo ID da transação que você vê no console.

**Exemplo:**
```
https://tiktokshop-orpin.vercel.app/api/debug-payment?transactionId=d76e42b7-5bd3-46d7-8660-586bd2baaefc
```

### Passo 3: Analisar a Resposta do Debug

O endpoint retorna informações detalhadas:

```json
{
  "success": true,
  "transactionId": "...",
  "checks": {
    "database": {
      "found": true,
      "order": {
        "umbrella_status": "WAITING_PAYMENT",
        "status": "aguardando_pagamento"
      }
    },
    "gateway": {
      "found": true,
      "status": "PAID",
      "paidAt": "2026-01-03T17:52:00.000Z"
    },
    "webhook": {
      "configured": true,
      "url": "https://..."
    }
  },
  "analysis": {
    "statusMatch": false,
    "needsUpdate": true,
    "recommendations": [
      "Status no gateway é PAID mas no banco não. O webhook pode não ter sido chamado."
    ]
  }
}
```

### Passo 4: Interpretar os Resultados

#### Cenário 1: Gateway mostra PAID, Banco mostra WAITING_PAYMENT

**Problema:** O webhook não foi chamado ou falhou.

**Soluções:**
1. **Verificar configuração do webhook na UmbrellaPag:**
   - Acesse o painel da UmbrellaPag
   - Verifique se a URL do webhook está configurada
   - URL esperada: `https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag`

2. **Verificar logs da Vercel:**
   - Dashboard Vercel → Functions → `/api/webhook-umbrellapag`
   - Veja se há requisições recebidas
   - Veja se há erros

3. **Atualizar manualmente (temporário):**
   ```bash
   # Usar o endpoint de atualização manual (se criado)
   # Ou atualizar diretamente no Supabase
   ```

#### Cenário 2: Gateway mostra WAITING_PAYMENT

**Problema:** O pagamento ainda não foi processado pela UmbrellaPag.

**Soluções:**
1. **Aguardar alguns minutos** - Pode haver delay no processamento
2. **Verificar se o PIX foi pago corretamente:**
   - Confirme no app do banco
   - Verifique se o valor está correto
   - Verifique se o QR Code foi copiado corretamente

#### Cenário 3: Pedido não encontrado no banco

**Problema:** O pedido não foi salvo no banco de dados.

**Soluções:**
1. **Verificar logs da criação da transação:**
   - Console do navegador quando criou o PIX
   - Ver se há erros ao salvar no Supabase

2. **Verificar configuração do Supabase:**
   - Verificar se as variáveis estão configuradas
   - Verificar se a tabela `orders` existe

### Passo 5: Verificar Logs da Vercel

1. Acesse o dashboard da Vercel
2. Vá em **Functions** → `/api/webhook-umbrellapag`
3. Veja os logs recentes:
   - Procure por `📥 Webhook recebido`
   - Procure por `✅ Pedido atualizado no banco`
   - Procure por erros

### Passo 6: Verificar Configuração do Webhook

#### Na UmbrellaPag:

1. Acesse o painel da UmbrellaPag
2. Vá em **Configurações** → **Webhooks**
3. Verifique se está configurado:
   - URL: `https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag`
   - Eventos: `PAID`, `EXPIRED`, etc.

#### Na Vercel:

1. Verifique se a função `/api/webhook-umbrellapag` está deployada
2. Verifique os logs para ver se está recebendo requisições

## 🔧 Soluções Rápidas

### Solução 1: Forçar Atualização Manual

Se o gateway mostra PAID mas o banco não:

1. Use o endpoint de debug para confirmar
2. Atualize manualmente no Supabase:
   ```sql
   UPDATE orders 
   SET umbrella_status = 'PAID', 
       status = 'pago',
       umbrella_paid_at = NOW()
   WHERE umbrella_transaction_id = 'SEU_TRANSACTION_ID';
   ```

### Solução 2: Reenviar Webhook (se possível)

Algumas APIs permitem reenviar webhooks. Verifique na documentação da UmbrellaPag.

### Solução 3: Melhorar Polling

O polling atual verifica a cada 5 segundos. Se o webhook falhar, o polling deve detectar quando consultar o gateway diretamente.

## 📊 Checklist de Debug

- [ ] Verificar status no console do navegador
- [ ] Usar endpoint de debug (`/api/debug-payment`)
- [ ] Verificar logs da Vercel (webhook)
- [ ] Verificar configuração do webhook na UmbrellaPag
- [ ] Verificar se o pedido existe no banco
- [ ] Verificar se o gateway mostra PAID
- [ ] Comparar status do banco vs gateway
- [ ] Verificar se há erros nos logs

## 🐛 Problemas Comuns

### Webhook não recebe notificações

**Causas:**
- URL do webhook incorreta
- Webhook não configurado na UmbrellaPag
- Firewall bloqueando requisições
- Vercel não está respondendo corretamente

**Solução:**
- Verificar URL no painel da UmbrellaPag
- Testar webhook manualmente (usar Postman/curl)
- Verificar logs da Vercel

### Banco não atualiza

**Causas:**
- Erro ao atualizar no Supabase
- Permissões do Supabase incorretas
- Tabela não existe ou campos incorretos

**Solução:**
- Verificar logs do webhook
- Verificar configuração do Supabase
- Testar atualização manual

### Polling não detecta mudança

**Causas:**
- Polling parou (modal fechado)
- Status não está sendo retornado corretamente
- Cache do navegador

**Solução:**
- Manter modal aberto
- Verificar resposta do `/api/order-status`
- Limpar cache do navegador

## 📝 Logs Importantes

Procure por estes logs no console:

- ✅ `✅ Pedido atualizado no banco` - Webhook funcionou
- ✅ `✅✅✅ PAGAMENTO CONFIRMADO` - Polling detectou
- ⚠️ `⚠️ Pedido não encontrado no banco` - Problema no banco
- ❌ `❌ Erro ao processar webhook` - Erro no webhook

## 🎯 Próximos Passos

Após identificar o problema:

1. **Se webhook não está sendo chamado:**
   - Configure corretamente na UmbrellaPag
   - Teste o webhook manualmente

2. **Se webhook está falhando:**
   - Verifique os logs da Vercel
   - Corrija o erro específico

3. **Se banco não atualiza:**
   - Verifique configuração do Supabase
   - Teste atualização manual

4. **Se polling não detecta:**
   - Verifique se o endpoint `/api/order-status` está funcionando
   - Verifique se está consultando o banco corretamente

## 🆘 Ainda Não Funciona?

Se após seguir todos os passos ainda não funcionar:

1. **Colete informações:**
   - Transaction ID
   - Resposta do endpoint de debug
   - Logs da Vercel
   - Screenshot do console

2. **Verifique documentação:**
   - Documentação da UmbrellaPag sobre webhooks
   - Documentação do Supabase sobre atualizações

3. **Contate suporte:**
   - UmbrellaPag (se problema no gateway)
   - Vercel (se problema no deploy)
   - Supabase (se problema no banco)






