# 📊 Configuração do Facebook Pixel

Este documento explica como configurar o Facebook Pixel com token de acesso via servidor para não perder nenhuma venda.

## 🎯 O que foi implementado

✅ **Endpoint Serverless** (`/api/facebook-pixel`) - Envia eventos para Facebook Conversions API  
✅ **Biblioteca de Tracking** (`src/lib/facebookPixel.ts`) - Funções para rastrear eventos  
✅ **Integração Completa** - Tracking em todos os pontos críticos do e-commerce

## 📋 Eventos Rastreados

1. **PageView** - Visualização de página (inicialização)
2. **ViewContent** - Visualização de produto
3. **AddToCart** - Adicionar produto ao carrinho
4. **InitiateCheckout** - Iniciar checkout
5. **Purchase** - Compra concluída

## 🔧 Configuração

### 1. Obter Credenciais do Facebook

1. Acesse o [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Crie um Pixel ou use um existente
3. Anote o **Pixel ID** (ex: `123456789012345`)
4. Gere um **Access Token**:
   - Vá em **Settings** → **Conversions API**
   - Clique em **Generate Access Token**
   - Copie o token gerado

### 2. Configurar Variáveis de Ambiente

#### Local (`.env` ou `.env.local`)

```env
# Facebook Pixel ID
VITE_FACEBOOK_PIXEL_ID=123456789012345

# Facebook Access Token (para Conversions API via servidor)
FACEBOOK_ACCESS_TOKEN=seu_token_aqui
```

#### Vercel (Produção)

1. Acesse o dashboard da Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as variáveis:

```
FACEBOOK_PIXEL_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=seu_token_aqui
```

⚠️ **IMPORTANTE**: 
- `VITE_FACEBOOK_PIXEL_ID` é usado no frontend (pode ser público)
- `FACEBOOK_ACCESS_TOKEN` é usado apenas no servidor (NUNCA exponha no frontend)

### 3. Deploy

Após configurar as variáveis de ambiente:

```bash
# Fazer commit e push
git add .
git commit -m "feat: adicionar Facebook Pixel"
git push

# O Vercel fará o deploy automaticamente
```

## 📊 Como Funciona

### Fluxo de Eventos

```
Frontend → /api/facebook-pixel → Facebook Conversions API
```

1. **Frontend** chama função de tracking (ex: `trackPurchase()`)
2. **Função** envia dados para `/api/facebook-pixel`
3. **Servidor** valida e envia para Facebook Conversions API
4. **Facebook** processa o evento

### Vantagens do Servidor

✅ **Não perde eventos** - Funciona mesmo com bloqueadores de anúncios  
✅ **Token seguro** - Access Token nunca exposto no frontend  
✅ **Dados completos** - Pode enviar dados do servidor (IP, User-Agent, etc.)  
✅ **Confiabilidade** - Eventos são enviados mesmo se o JavaScript falhar

## 🧪 Testar

### 1. Verificar se o Pixel está carregando

1. Abra o DevTools (F12)
2. Vá em **Network** → Filtre por `facebook`
3. Recarregue a página
4. Deve ver requisições para `connect.facebook.net`

### 2. Verificar eventos no servidor

1. Abra o DevTools (F12)
2. Vá em **Network** → Filtre por `facebook-pixel`
3. Adicione um produto ao carrinho
4. Deve ver uma requisição POST para `/api/facebook-pixel`

### 3. Verificar no Facebook Events Manager

1. Acesse o [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Selecione seu Pixel
3. Vá em **Test Events**
4. Realize ações no site (adicionar ao carrinho, comprar, etc.)
5. Os eventos devem aparecer em tempo real

## 🔍 Debug

### Logs no Console

O código já inclui logs para debug:

```javascript
console.log('✅ Evento enviado para Facebook Pixel:', eventName, eventId);
console.error('❌ Erro ao enviar evento para Facebook Pixel:', error);
```

### Verificar Logs da Vercel

1. Acesse o dashboard da Vercel
2. Vá em **Functions** → `/api/facebook-pixel`
3. Veja os logs em tempo real

### Erros Comuns

#### "Facebook Pixel não configurado"

- Verifique se `FACEBOOK_PIXEL_ID` e `FACEBOOK_ACCESS_TOKEN` estão configurados
- Certifique-se de que as variáveis estão disponíveis para Production, Preview e Development

#### "Erro ao enviar evento para Facebook"

- Verifique se o Access Token está válido
- Verifique se o Pixel ID está correto
- Veja os logs da Vercel para mais detalhes

#### Eventos não aparecem no Facebook

- Aguarde alguns minutos (pode haver delay)
- Verifique se está usando o modo de teste correto
- Certifique-se de que o Pixel está ativo

## 📝 Estrutura dos Eventos

### AddToCart

```javascript
trackAddToCart(
  productId: string,
  productName: string,
  price: number,
  quantity: number,
  category?: string
);
```

### InitiateCheckout

```javascript
trackInitiateCheckout(
  value: number,
  numItems: number,
  contents: Array<{ id: string; quantity: number; item_price: number }>,
  userData?: UserData
);
```

### Purchase

```javascript
trackPurchase(
  orderId: string,
  value: number,
  numItems: number,
  contents: Array<{ id: string; quantity: number; item_price: number }>,
  userData?: UserData
);
```

## 🎉 Pronto!

Após seguir esses passos, seu Facebook Pixel estará configurado e rastreando todas as conversões, garantindo que nenhuma venda seja perdida!

## 📚 Referências

- [Facebook Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Facebook Pixel Documentation](https://developers.facebook.com/docs/facebook-pixel)
- [Events Manager](https://business.facebook.com/events_manager2)







