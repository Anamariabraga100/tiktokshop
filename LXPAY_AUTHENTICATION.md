# 🔐 Autenticação LxPay - Guia Completo

## 📋 Resumo

O LxPay utiliza **duas chaves distintas** para autenticação (NÃO uma única API Key):

- **Public Key** (`comprarbms_1767919324079`) - Identificação
- **Private Key / Secret Key** (`174bbcd3-2157-42cd-925f-9447a8a642d3`) - Autenticação segura

## 🔑 Chaves Configuradas

### Public Key
```
comprarbms_1767919324079
```

### Private Key (Secret Key)
```
174bbcd3-2157-42cd-925f-9447a8a642d3
```

## 🔐 Autenticação – LxPay (OBRIGATÓRIO)

A API da LxPay utiliza autenticação via headers:

- x-public-key
- x-secret-key

⚠️ NÃO utilizar Authorization Bearer
⚠️ NÃO utilizar API Key única

Todas as requisições DEVEM conter ambos os headers.

## ⚙️ Configuração Atual

### Variáveis de Ambiente (OBRIGATÓRIAS)

Configure na Vercel:

```env
NEW_GATEWAY_PUBLIC_KEY=comprarbms_1767919324079
NEW_GATEWAY_PRIVATE_KEY=174bbcd3-2157-42cd-925f-9447a8a642d3
NEW_GATEWAY_BASE_URL=https://api.lxpay.com.br  # Opcional (padrão)
```

### Formato de Autenticação Implementado (CORRETO)

**✅ Formato correto já implementado no código:**

```javascript
headers: {
  'Content-Type': 'application/json',
  'x-public-key': lxPayPublicKey,      // Public Key (identificação)
  'x-secret-key': lxPaySecretKey,      // Secret Key (autenticação)
}
```

**⚠️ NÃO usar:**
- ❌ Authorization Bearer
- ❌ API Key única
- ❌ Headers com maiúsculas (X-Public-Key, X-Private-Key)

**✅ Usar:**
- ✅ Headers minúsculas com hífen: `x-public-key` e `x-secret-key`
- ✅ Ambos os headers sempre juntos

## ✅ Implementação Correta

O código em `api/pix.js` já está implementado corretamente:

```javascript
const response = await fetch(`${lxPayBaseURL}/api/v1/gateway/pix/receive`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-public-key': lxPayPublicKey,    // ✅ Correto: minúsculas, com hífen
    'x-secret-key': lxPaySecretKey     // ✅ Correto: minúsculas, com hífen
    // ⚠️ NÃO usar Authorization header aqui
  },
  body: JSON.stringify(payload),
  signal: controller.signal  // Timeout de 8 segundos
});
```

**Não é necessário ajustar - o código está correto conforme a documentação oficial do LxPay.**

## 🔍 Debug

### Verificar se as chaves estão sendo usadas

Os logs mostram (parcialmente por segurança):
```
🚀 Criando PIX no LxPay: {
  publicKey: "comprarbms_..." // Primeiros caracteres apenas
  ...
}
```

### Erro de Autenticação

Se receber erro 401/403, verifique nos logs:
```
❌ Erro na API do LxPay: {
  status: 401,
  message: "..."
}
⚠️ ERRO DE AUTENTICAÇÃO: Verifique se o formato dos headers está correto
```

### Testar Formato Correto

1. Verifique a documentação oficial do LxPay
2. Teste manualmente com curl/Postman usando o formato correto
3. Ajuste o código conforme necessário
4. Teste novamente

## 📚 Referência

- Chaves configuradas conforme fornecido
- Formato atual: Headers separados (`X-Public-Key` e `X-Private-Key`)
- **Pode precisar ajustar conforme documentação oficial do LxPay**

## ✅ Checklist

- [x] Public Key configurada: `comprarbms_1767919324079`
- [x] Secret Key configurada: `174bbcd3-2157-42cd-925f-9447a8a642d3`
- [x] Variáveis de ambiente na Vercel (`NEW_GATEWAY_PUBLIC_KEY` e `NEW_GATEWAY_PRIVATE_KEY`)
- [x] Base URL configurada: `https://api.lxpay.com.br`
- [x] Headers corretos: `x-public-key` e `x-secret-key` (minúsculas, com hífen)
- [x] **Formato de autenticação implementado corretamente**
- [ ] Redeploy feito
- [ ] Teste de criação de PIX funcionando

