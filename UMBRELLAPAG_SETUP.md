# Integração com UmbrellaPag

Este documento explica como o sistema está integrado com o gateway de pagamento UmbrellaPag.

## 📋 Configuração

### 1. Variáveis de Ambiente

O arquivo `.env` deve conter:

```env
VITE_UMBRELLAPAG_API_KEY=sua_api_key_aqui
VITE_POSTBACK_URL=https://seusite.com/api/webhook
```

**API Key**: Obtenha no painel do UmbrellaPag  
**Postback URL**: URL do seu servidor para receber notificações de pagamento

### 2. Base URL da API

A API do UmbrellaPag está configurada para:
- **URL Base**: `https://api.umbrellapag.com`
- **Endpoint de Transações**: `/api/user/transactions`

## 🔄 Fluxo de Pagamento PIX

### 1. Criação da Transação

Quando o usuário seleciona pagamento via PIX:

1. O modal `PixPaymentModal` é aberto
2. Uma transação é criada automaticamente no UmbrellaPag via `createPixTransaction()`
3. O QR Code PIX é exibido para o cliente
4. O cliente copia o código e paga pelo app do banco

### 2. Estrutura da Requisição

A requisição enviada para a API contém:

```json
{
  "amount": 15000,  // Valor em centavos (R$ 150,00)
  "currency": "BRL",
  "paymentMethod": "PIX",
  "installments": 1,
  "postbackUrl": "https://seusite.com/api/webhook",
  "metadata": "{\"orderId\":\"ABC123\"}",
  "traceable": true,
  "ip": "192.168.1.1",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": {
      "number": "12345678900",
      "type": "CPF"
    },
    "phone": "11999999999",
    "address": { ... }
  },
  "items": [
    {
      "title": "Produto XYZ",
      "unitPrice": 10000,
      "quantity": 1,
      "tangible": true
    }
  ],
  "pix": {
    "expiresInDays": 1
  }
}
```

### 3. Resposta da API

A API retorna uma transação com:

- `id`: ID único da transação
- `qrCode`: Código PIX para pagamento
- `status`: Status da transação (ex: `WAITING_PAYMENT`)
- `externalRef`: Referência externa
- `pix`: Objeto com dados do PIX (QR Code, data de expiração, etc.)

## 💾 Armazenamento

### Supabase

Os dados da transação são salvos na tabela `orders` com os seguintes campos:

- `umbrella_transaction_id`: ID da transação no UmbrellaPag
- `umbrella_status`: Status da transação
- `umbrella_qr_code`: QR Code PIX
- `umbrella_external_ref`: Referência externa
- `umbrella_end_to_end_id`: ID end-to-end (quando pago)
- `umbrella_paid_at`: Data/hora do pagamento

### LocalStorage

Também é salvo no localStorage para:
- Persistência local
- Fallback caso o Supabase esteja offline
- Compatibilidade com código existente

## 🔔 Webhook/Postback

### Configuração

1. Configure a URL do webhook no painel do UmbrellaPag
2. Ou defina `VITE_POSTBACK_URL` no `.env`
3. O webhook receberá notificações quando:
   - O pagamento for confirmado
   - O status da transação mudar

### Estrutura do Webhook

O UmbrellaPag enviará uma requisição POST para sua URL com:

```json
{
  "transactionId": "uuid-da-transacao",
  "status": "PAID",
  "paidAt": "2025-01-20T10:30:00Z",
  "endToEndId": "E12345678202501201030123456789012",
  ...
}
```

### Implementação do Webhook

**Nota**: Você precisará criar um endpoint no seu backend para receber essas notificações. Exemplo:

```typescript
// Exemplo de endpoint webhook (Node.js/Express)
app.post('/api/webhook', async (req, res) => {
  const { transactionId, status, paidAt } = req.body;
  
  // Atualizar pedido no Supabase
  await updateOrderInSupabase(orderNumber, {
    umbrella_status: status,
    umbrella_paid_at: paidAt,
    status: 'pago',
  });
  
  res.status(200).json({ received: true });
});
```

## 🔍 Verificação de Status

Para verificar o status de uma transação manualmente:

```typescript
import { getTransactionStatus } from '@/lib/umbrellapag';

const transaction = await getTransactionStatus('transaction-id');
console.log(transaction.status); // WAITING_PAYMENT, PAID, etc.
```

## ⚠️ Tratamento de Erros

O sistema trata os seguintes erros:

- **API Key não configurada**: Mostra erro e não cria transação
- **Dados do cliente incompletos**: Valida antes de criar transação
- **Erro na API**: Exibe mensagem amigável ao usuário
- **Falha ao salvar no Supabase**: Usa localStorage como fallback

## 📊 Status da Transação

Os possíveis status retornados pela API:

- `WAITING_PAYMENT`: Aguardando pagamento
- `PAID`: Pagamento confirmado
- `REFUNDED`: Reembolsado
- `REFUSED`: Pagamento recusado
- `EXPIRED`: Expirado

## 🔐 Segurança

- A API Key está configurada apenas no frontend (não use a secret key)
- Use Row Level Security (RLS) no Supabase
- Valide dados do cliente antes de criar transação
- Use HTTPS para o webhook
- Valide assinatura do webhook (se disponível pela API)

## 📝 Notas Importantes

1. **Valor em Centavos**: Todos os valores devem ser enviados em centavos (ex: R$ 10,00 = 1000)

2. **Expiração do PIX**: O PIX expira em 1 dia por padrão. Você pode ajustar em `pix.expiresInDays`

3. **IP do Cliente**: O sistema tenta obter o IP real via `api.ipify.org`. Em caso de falha, usa `127.0.0.1`

4. **Metadata**: Use o campo `metadata` para armazenar informações extras como `orderId`, `userId`, etc.

5. **Primeira Compra**: O sistema identifica primeira compra e aplica descontos automaticamente

## 🚀 Próximos Passos

- [ ] Implementar endpoint webhook no backend
- [ ] Criar página para acompanhar status do pagamento
- [ ] Implementar polling para verificar status automaticamente
- [ ] Adicionar notificações quando pagamento for confirmado
- [ ] Implementar reembolso via API

## 📚 Documentação Oficial

Consulte a documentação completa da API:
https://docs.umbrellapag.com/create-20025744e0

