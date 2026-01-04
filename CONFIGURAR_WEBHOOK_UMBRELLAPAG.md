# 🔔 Como Configurar Webhook da UmbrellaPag

O webhook é essencial para receber notificações automáticas quando um pagamento é confirmado.

## 🎯 Por que Configurar?

- ✅ **Notificação instantânea** quando pagamento é confirmado
- ✅ **Não depende de polling** (mais eficiente)
- ✅ **Atualização automática** do banco de dados
- ✅ **Melhor experiência** para o usuário

## 📋 Passo a Passo

### 1. Obter URL do Webhook

A URL do seu webhook é:
```
https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag
```

### 2. Configurar na UmbrellaPag

1. Acesse o painel da UmbrellaPag
2. Vá em **Configurações** → **Webhooks** ou **Postback**
3. Adicione a URL:
   ```
   https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag
   ```
4. Selecione os eventos:
   - ✅ `PAID` (Pagamento confirmado)
   - ✅ `EXPIRED` (PIX expirado)
   - ✅ `REFUNDED` (Reembolsado)
   - ✅ `CANCELLED` (Cancelado)

5. Salve as configurações

### 3. Testar o Webhook

Após configurar, faça um teste:

1. Crie um novo PIX de teste
2. Pague o PIX
3. Verifique os logs da Vercel:
   - Dashboard → Functions → `/api/webhook-umbrellapag`
   - Deve aparecer: `📥 Webhook recebido`

### 4. Verificar se Está Funcionando

Use o endpoint de debug:
```
https://tiktokshop-orpin.vercel.app/api/debug-payment?transactionId=SEU_TRANSACTION_ID
```

Na resposta, verifique:
```json
{
  "checks": {
    "webhook": {
      "configured": true,  // ← Deve ser true
      "url": "https://..."
    }
  }
}
```

## 🔍 Verificar Logs

### Na Vercel:

1. Dashboard → **Functions** → `/api/webhook-umbrellapag`
2. Veja os logs em tempo real
3. Procure por:
   - `📥 Webhook recebido` - Webhook foi chamado
   - `✅ Pedido atualizado no banco` - Atualização funcionou
   - `❌ Erro` - Se houver problemas

### No Console do Navegador:

Quando o webhook atualizar o banco, o polling detectará na próxima verificação (máximo 5 segundos).

## ⚠️ Importante

### URL Correta

Certifique-se de usar a URL completa:
```
https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag
```

**NÃO use:**
- ❌ `http://` (deve ser HTTPS)
- ❌ URL sem `/api/webhook-umbrellapag`
- ❌ URL de localhost

### Eventos Necessários

Configure pelo menos:
- ✅ `PAID` - Essencial para confirmar pagamentos

### Teste Após Configurar

Sempre teste após configurar:
1. Faça um pagamento de teste
2. Verifique se o webhook foi chamado
3. Verifique se o banco foi atualizado

## 🐛 Problemas Comuns

### Webhook não é chamado

**Causas:**
- URL incorreta
- Webhook não configurado na UmbrellaPag
- Firewall bloqueando

**Solução:**
- Verifique a URL no painel da UmbrellaPag
- Teste a URL manualmente (deve retornar 200)
- Verifique logs da Vercel

### Webhook retorna erro

**Causas:**
- Erro no código do webhook
- Problema com Supabase
- Dados inválidos

**Solução:**
- Verifique logs da Vercel
- Verifique configuração do Supabase
- Use o endpoint de debug para verificar

## ✅ Checklist

- [ ] URL do webhook configurada na UmbrellaPag
- [ ] Eventos selecionados (PAID, EXPIRED, etc.)
- [ ] Webhook salvo e ativo
- [ ] Teste realizado com pagamento real
- [ ] Logs da Vercel mostram webhook recebido
- [ ] Banco de dados atualizado automaticamente

## 🎉 Resultado

Após configurar:
- ✅ Pagamentos serão confirmados automaticamente
- ✅ Não precisa esperar polling
- ✅ Experiência melhor para o usuário
- ✅ Sistema mais confiável

## 📝 Nota

Mesmo sem webhook configurado, o sistema ainda funciona através do polling melhorado que verifica o gateway automaticamente. Mas o webhook é mais rápido e eficiente!


