# 🚀 LxPay - Gateway de Pagamentos PIX - Configuração

## 📋 Resumo

O sistema agora suporta **dois gateways de pagamento**:

1. **LxPay** (PRINCIPAL) 🎯 - Tenta primeiro (usa Public Key + Private Key)
2. **UmbrellaPay** (FALLBACK) 🔄 - Usado automaticamente se o LxPay falhar

## 🔧 Configuração Necessária

### Variáveis de Ambiente

Configure na Vercel (Settings → Environment Variables):

#### 1. LxPay - Public Key (OBRIGATÓRIA) 🔑

**Public Key** é usada para identificação:

```
Key: LXPAY_PUBLIC_KEY
Value: comprarbms_1767919324079
```

#### 2. LxPay - Private Key (OBRIGATÓRIA) 🔐

**Private Key / Secret Key** é usada para autenticação segura (backend only):

```
Key: LXPAY_PRIVATE_KEY
Value: 174bbcd3-2157-42cd-925f-9447a8a642d3
```

**⚠️ IMPORTANTE:** 
- O LxPay utiliza **duas chaves distintas** (NÃO uma única API Key)
- Public Key = identificação
- Private Key = autenticação segura (sempre no backend)

#### 3. LxPay - Base URL (OPCIONAL - Padrão: https://api.com)

Se o LxPay usar uma URL diferente:

```
Key: LXPAY_BASE_URL
Value: https://sua-api-lxpay.com
```

#### 4. UmbrellaPay (OBRIGATÓRIO - Para fallback)

```
Key: UMBRELLAPAG_API_KEY
Value: 044d7262-218b-4a1b-a8ca-e9c8685ee0b7
```

**Importante:** Marque todas as opções (Production, Preview, Development) e faça **redeploy** após configurar!

## 🎯 Como Funciona

### Fluxo de Criação de PIX

1. Sistema recebe requisição para criar PIX
2. **Tentativa 1**: Cria PIX no **LxPay** (principal) usando Public Key + Private Key
3. **Se falhar**: Tenta automaticamente no **UmbrellaPay** (fallback)
4. Salva no banco indicando qual gateway foi usado
5. Retorna QR Code para o cliente

### Fluxo de Webhook

1. Webhook é recebido (pode ser de qualquer gateway)
2. Sistema detecta automaticamente qual gateway enviou
3. Processa e atualiza o pedido no banco
4. Dispara evento Purchase para Facebook Pixel (se pago)

## 📝 Formato do Payload do LxPay

O sistema envia automaticamente:

```json
{
  "identifier": "ORDER-1234567890-ABC123",
  "amount": 60.00,
  "client": {
    "name": "João da Silva",
    "email": "joao@gmail.com",
    "phone": "11999999999",
    "document": "12345678901"
  },
  "products": [
    {
      "id": "prod_001",
      "name": "Produto 1",
      "quantity": 2,
      "price": 10.00
    }
  ],
  "dueDate": "2024-12-31T23:59:59Z",
  "callbackUrl": "https://seusite.com/api/webhook",
  "metadata": {
    "orderId": "ORDER-1234567890-ABC123",
    "fbc": "...",
    "fbp": "..."
  }
}
```

## ✅ Formato de Resposta Esperado

O sistema espera receber do LxPay:

```json
{
  "transactionId": "txn_abc123",
  "status": "OK",
  "order": {
    "id": "txn_abc123",
    "url": "https://api.com/order/txn_abc123"
  },
  "pix": {
    "code": "00020101021126530014BRX..."
  }
}
```

## 🔐 Autenticação LxPay

**O LxPay utiliza duas chaves distintas para autenticação:**

### Configuração Atual

Atualmente configurado para usar **headers separados**:

```javascript
headers: {
  'X-Public-Key': lxPayPublicKey,    // Public Key (identificação)
  'X-Private-Key': lxPayPrivateKey,  // Private Key / Secret Key (autenticação)
  'Content-Type': 'application/json'
}
```

### ⚠️ IMPORTANTE: Formato de Autenticação

**Se o LxPay usar outro formato de autenticação**, você precisa ajustar no arquivo `api/pix.js` na função `createTransactionWithNewGateway()`.

**Formas comuns de autenticação:**

1. **Headers separados** (atual):
   ```javascript
   'X-Public-Key': publicKey,
   'X-Private-Key': privateKey
   ```

2. **Authorization Bearer**:
   ```javascript
   'Authorization': `Bearer ${privateKey}`,
   'X-Public-Key': publicKey
   ```

3. **Assinatura HMAC**:
   ```javascript
   // Pode precisar gerar assinatura usando ambas as chaves
   // Exemplo: const signature = generateHMAC(payload, privateKey);
   'X-Public-Key': publicKey,
   'X-Signature': signature
   ```

**Para ajustar**, procure por este trecho no `api/pix.js`:
```javascript
headers: {
  'X-Public-Key': lxPayPublicKey,
  'X-Private-Key': lxPayPrivateKey,
  // ⚠️ AJUSTE AQUI SE NECESSÁRIO
  'Content-Type': 'application/json'
}
```

## 🔍 Debug e Logs

### Verificar qual gateway foi usado

Os logs mostram claramente:

```
🚀 Tentando criar PIX no LxPay (principal)...
✅✅✅ Sucesso no LxPay!
Gateway: lxpay
```

Ou:

```
⚠️ Falha no LxPay, tentando UmbrellaPay (fallback): ...
✅✅✅ Sucesso no UmbrellaPay (fallback)!
Gateway: umbrellapag
```

### Logs do Webhook

O webhook detecta automaticamente qual gateway enviou:

```
📥 Webhook recebido (Gateway: lxpay): ...
```

ou

```
📥 Webhook recebido (Gateway: umbrellapag): ...
```

## 🐛 Troubleshooting

### Erro: "LXPAY_PUBLIC_KEY não configurada" ou "LXPAY_PRIVATE_KEY não configurada"

- Verifique se adicionou **ambas as variáveis** na Vercel:
  - `LXPAY_PUBLIC_KEY`
  - `LXPAY_PRIVATE_KEY`
- Verifique se marcou todas as environments
- Faça um redeploy após adicionar

### Erro: "Erro HTTP 401: Unauthorized" ou "Erro HTTP 403: Forbidden"

- Verifique se **ambas as chaves** estão corretas:
  - Public Key: `comprarbms_1767919324079`
  - Private Key: `174bbcd3-2157-42cd-925f-9447a8a642d3`
- **⚠️ CRÍTICO:** Verifique se o formato de autenticação está correto
  - Atualmente usando headers `X-Public-Key` e `X-Private-Key`
  - Se o LxPay usar outro formato (Bearer, HMAC, etc.), precisa ajustar no código
  - Verifique a documentação oficial do LxPay sobre autenticação
- Verifique se a Base URL está correta

### Erro: "QR Code não foi retornado pelo LxPay"

- Verifique o formato da resposta do gateway
- O QR Code deve estar em `data.pix.code` ou `data.pix.qrCode`
- Verifique os logs para ver a resposta completa do gateway

### LxPay falha mas UmbrellaPay funciona

- Verifique os logs para ver o erro específico do LxPay
- Verifique se o payload está no formato correto
- **Verifique especialmente se o formato de autenticação está correto**
- O sistema automaticamente usa o UmbrellaPay como fallback, então o pagamento ainda funciona

## 📚 Arquivos Modificados

- `api/pix.js` - Suporte a ambos os gateways com fallback automático
- `api/webhook.js` - Detecção automática do formato do webhook
- `CONFIGURAR_VARIAVEIS_VERCEL.md` - Documentação atualizada

## 🎉 Pronto!

Após configurar as variáveis de ambiente e fazer o redeploy, o sistema estará funcionando com o **LxPay como principal** (usando Public Key + Private Key) e o **UmbrellaPay como fallback automático**!

**⚠️ LEMBRETE:** Se receber erro de autenticação (401/403), verifique se o formato de autenticação no código está correto conforme a documentação oficial do LxPay.

