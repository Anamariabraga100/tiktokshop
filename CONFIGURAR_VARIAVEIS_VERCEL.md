# 🔧 Configurar Variáveis de Ambiente na Vercel

## 📍 Localização

1. No dashboard da Vercel, clique no seu projeto **tiktokshop**
2. Vá em **Settings** (Configurações) no menu superior
3. Clique em **Environment Variables** (Variáveis de Ambiente) no menu lateral

## ✅ Variáveis Obrigatórias

### 1. LxPay (PRINCIPAL) 🎯

**O sistema tenta primeiro o LxPay, e se falhar, usa o UmbrellaPay como fallback.**

**⚠️ IMPORTANTE:** O LxPay utiliza **duas chaves distintas** para autenticação via headers `x-public-key` e `x-secret-key`.

#### Public Key do LxPay (OBRIGATÓRIA)

```
Key: NEW_GATEWAY_PUBLIC_KEY
Value: comprarbms_1767919324079
```

#### Private Key (Secret Key) do LxPay (OBRIGATÓRIA)

```
Key: NEW_GATEWAY_PRIVATE_KEY
Value: 174bbcd3-2157-42cd-925f-9447a8a642d3
```

#### Base URL do LxPay (OPCIONAL)

Se não configurada, usa `https://api.lxpay.com.br` como padrão:

```
Key: NEW_GATEWAY_BASE_URL
Value: https://api.lxpay.com.br
```

**Importante:** 
- ✅ Marque todas as opções: **Production**, **Preview**, **Development**
- ✅ Clique em **Save**

### 2. UmbrellaPay (FALLBACK) 🔄

**Usado automaticamente se o novo gateway falhar**

```
Key: UMBRELLAPAG_API_KEY
Value: 044d7262-218b-4a1b-a8ca-e9c8685ee0b7
```

**Importante:** 
- ✅ Marque todas as opções: **Production**, **Preview**, **Development**
- ✅ Clique em **Save**

### 3. (Opcional) Supabase - Se quiser usar

```
Key: VITE_SUPABASE_URL
Value: https://kgeseoccvpzwqqhcbups.supabase.co
```

```
Key: VITE_SUPABASE_ANON_KEY
Value: sb_publishable_I5P7uC0u8eZEP_2vWSUtVQ_8fne35AP
```

## 🔄 Aplicar as Variáveis

**IMPORTANTE:** Após adicionar as variáveis, você precisa fazer um **novo deploy**:

### Opção 1: Redeploy (Rápido)

1. Vá em **Deployments** no menu
2. Clique nos **três pontos (...)** do último deploy
3. Clique em **Redeploy**
4. Selecione **Use existing Build Cache** (opcional, mais rápido)
5. Clique em **Redeploy**

### Opção 2: Novo Commit (Automático)

1. Faça qualquer mudança pequena (ou apenas toque em um arquivo)
2. Faça commit e push:
   ```bash
   git commit --allow-empty -m "Trigger redeploy with env vars"
   git push
   ```
3. A Vercel fará deploy automático

## ✅ Verificar se Funcionou

Após o redeploy:

1. Vá em **Deployments**
2. Clique no novo deploy
3. Vá em **Functions** → `/api/create-pix-transaction`
4. Se aparecer a função, está funcionando!
5. Teste criando um pedido PIX no site

## 🔍 Troubleshooting

### Variável não está sendo usada?

- Verifique se marcou **Production**, **Preview** e **Development**
- Faça um redeploy após adicionar as variáveis
- Verifique os logs da função serverless

### Erro "API Key não configurada"?

- **Novo Gateway**: Verifique se adicionou `NEW_GATEWAY_API_KEY`
- **UmbrellaPay**: Verifique se adicionou `UMBRELLAPAG_API_KEY` (sem VITE_)
- Verifique se fez redeploy após adicionar
- Verifique os logs em Functions → `/api/pix`

### Qual gateway está sendo usado?

- Os logs da função `/api/pix` mostram qual gateway foi usado
- Busque por "Gateway: lxpay" ou "Gateway: umbrellapag" nos logs
- Se o LxPay falhar, o sistema automaticamente tenta o UmbrellaPay

### Erro de Autenticação (401/403)?

- Verifique se ambas as chaves estão configuradas: `NEW_GATEWAY_PUBLIC_KEY` e `NEW_GATEWAY_PRIVATE_KEY`
- **Formato correto:** Headers `x-public-key` e `x-secret-key` (minúsculas, com hífen)
- **NÃO usar:** Authorization Bearer ou API Key única
- O código já está configurado corretamente em `api/pix.js`
- Se ainda receber erro, verifique se os valores das chaves estão corretos

## 📝 Resumo Rápido

1. ✅ Settings → Environment Variables
2. ✅ Adicionar `NEW_GATEWAY_PUBLIC_KEY` = `comprarbms_1767919324079` (principal - identificação)
3. ✅ Adicionar `NEW_GATEWAY_PRIVATE_KEY` = `174bbcd3-2157-42cd-925f-9447a8a642d3` (principal - autenticação)
4. ✅ (Opcional) Adicionar `NEW_GATEWAY_BASE_URL` = `https://api.lxpay.com.br`
5. ✅ Adicionar `UMBRELLAPAG_API_KEY` (fallback)
6. ✅ Marcar todas as environments (Production, Preview, Development)
7. ✅ Save
8. ✅ Redeploy obrigatório
9. ✅ Testar!

## 🎯 Como Funciona

1. **Tentativa 1**: Sistema tenta criar PIX no **LxPay** (principal) usando Public Key + Private Key
2. **Tentativa 2**: Se falhar, tenta automaticamente no **UmbrellaPay** (fallback)
3. **Webhook**: Suporta ambos os formatos de webhook automaticamente
4. **Logs**: Mostram qual gateway foi usado em cada transação

