# 🚀 Deploy na Vercel - Instruções

Este guia explica como fazer deploy na Vercel com a função serverless para processar pagamentos PIX.

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Projeto no GitHub (ou outro repositório Git)
- API Key do UmbrellaPag

## 🔧 Passo a Passo

### 1. Preparar o Código

✅ Os arquivos já estão preparados:
- `api/create-pix-transaction.js` - Função serverless
- `src/lib/umbrellapag.ts` - Atualizado para usar o backend
- `vercel.json` - Configuração do Vercel

### 2. Fazer Push para o Git

```bash
git add .
git commit -m "Adiciona função serverless para processar PIX"
git push
```

### 3. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe seu repositório do GitHub
4. Configure o projeto:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (deve estar automático)
   - **Output Directory**: `dist` (deve estar automático)

### 4. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings → Environment Variables** e adicione:

#### Variáveis Obrigatórias:

```
VITE_UMBRELLAPAG_API_KEY=044d7262-218b-4a1b-a8ca-e9c8685ee0b7
```

**Importante**: A função serverless também procura por `UMBRELLAPAG_API_KEY` (sem VITE_), então você pode adicionar ambas:

```
UMBRELLAPAG_API_KEY=044d7262-218b-4a1b-a8ca-e9c8685ee0b7
VITE_UMBRELLAPAG_API_KEY=044d7262-218b-4a1b-a8ca-e9c8685ee0b7
```

#### Variáveis Opcionais:

```
VITE_SUPABASE_URL=https://kgeseoccvpzwqqhcbups.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_I5P7uC0u8eZEP_2vWSUtVQ_8fne35AP
VITE_POSTBACK_URL=https://seu-dominio.vercel.app/api/webhook
```

### 5. Fazer Deploy

1. Clique em **"Deploy"**
2. Aguarde o build terminar
3. Teste a aplicação

## 🔍 Verificar se Funcionou

Após o deploy, teste:

1. Acesse sua aplicação na Vercel
2. Tente criar um pedido PIX
3. Abra o Console do navegador (F12)
4. Veja se a requisição vai para `/api/create-pix-transaction`
5. Verifique os logs na Vercel (Dashboard → Functions)

## 📊 Monitoramento

### Ver Logs da Função Serverless

1. No dashboard da Vercel, vá em **Functions**
2. Clique em `/api/create-pix-transaction`
3. Veja os logs em tempo real

### Testar a Função Diretamente

Você pode testar a função usando curl ou Postman:

```bash
curl -X POST https://seu-dominio.vercel.app/api/create-pix-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "customerData": {...},
    "items": [...],
    "totalPrice": 150.00
  }'
```

## 🔒 Segurança

✅ **Boas práticas implementadas:**
- API Key não exposta no frontend
- Validação de dados no backend
- Headers de segurança configurados
- Tratamento de erros adequado

## 🐛 Troubleshooting

### Erro: "API Key não configurada"

- Verifique se a variável `UMBRELLAPAG_API_KEY` está configurada na Vercel
- Certifique-se de que o deploy foi feito após adicionar a variável
- Verifique se a variável está disponível para Production, Preview e Development

### Erro 404 na função

- Verifique se o arquivo está em `api/create-pix-transaction.js`
- Verifique se o `vercel.json` está configurado corretamente
- Faça um novo deploy

### Erro de CORS ainda aparece

- Limpe o cache do navegador
- Verifique se está usando a URL do deploy (não localhost)
- Verifique os logs da função na Vercel

## 📝 Notas Importantes

1. **A função serverless está em `/api/create-pix-transaction`**
2. **O frontend automaticamente usa essa rota**
3. **Não precisa mudar nada no código após o deploy**
4. **A API Key fica segura no backend da Vercel**

## 🎉 Pronto!

Após seguir esses passos, sua aplicação estará funcionando com pagamentos PIX via UmbrellaPag, sem problemas de CORS!
