# 🧪 Como Testar Conversões do Facebook Pixel

Este guia explica como testar se as conversões estão sendo enviadas corretamente para o Facebook quando há um pagamento real aprovado.

## 🎯 Métodos de Teste

### Método 1: Test Events do Facebook (Recomendado)

O Facebook oferece um modo de teste que permite ver eventos em tempo real sem afetar suas campanhas.

#### Passo 1: Ativar Test Events

1. Acesse o [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Selecione seu Pixel
3. Vá em **Test Events** (no menu lateral)
4. Clique em **Test Events** no topo
5. Copie o **Test Event Code** (ex: `TEST12345`)

#### Passo 2: Adicionar Test Event Code

Adicione o código de teste na URL do seu site:

```
https://tiktokshop-orpin.vercel.app/?test_event_code=TEST12345
```

Ou configure como variável de ambiente na Vercel:
- Nome: `FACEBOOK_TEST_EVENT_CODE`
- Valor: Seu código de teste

#### Passo 3: Fazer uma Compra de Teste

1. Acesse seu site com o código de teste na URL
2. Adicione produtos ao carrinho
3. Complete o checkout
4. **Pague o PIX** (ou simule o pagamento)

#### Passo 4: Verificar no Test Events

1. Volte ao **Test Events** no Events Manager
2. Você verá os eventos aparecendo em tempo real:
   - ✅ PageView
   - ✅ ViewContent
   - ✅ AddToCart
   - ✅ InitiateCheckout
   - ✅ Purchase (quando pagamento confirmado)

### Método 2: Endpoint de Teste (Sem Compra Real)

Criamos um endpoint especial para testar sem fazer compra real.

#### Testar Purchase

```bash
curl -X POST https://tiktokshop-orpin.vercel.app/api/test-facebook-pixel \
  -H "Content-Type: application/json" \
  -d '{"eventType": "Purchase"}'
```

Ou use o navegador/Postman:
- URL: `https://tiktokshop-orpin.vercel.app/api/test-facebook-pixel`
- Method: POST
- Body:
```json
{
  "eventType": "Purchase"
}
```

#### Testar Outros Eventos

```json
{"eventType": "AddToCart"}
{"eventType": "InitiateCheckout"}
```

### Método 3: Verificar Logs da Vercel

#### Passo 1: Acessar Logs

1. Acesse o dashboard da Vercel
2. Vá em **Functions** → `/api/facebook-pixel`
3. Clique em **View Function Logs**

#### Passo 2: Fazer uma Compra

1. Complete uma compra real no site
2. Quando o pagamento for confirmado, o evento Purchase será enviado

#### Passo 3: Verificar Logs

Procure por:
```
✅ Evento enviado para Facebook Pixel: Purchase [eventId]
```

Se houver erro:
```
❌ Erro ao enviar evento para Facebook Pixel: [detalhes]
```

### Método 4: Console do Navegador

#### Durante uma Compra Real

1. Abra o DevTools (F12) → **Console**
2. Complete o checkout
3. Quando o pagamento for confirmado, você verá:
   ```
   ✅ Evento enviado para Facebook Pixel: Purchase [eventId]
   ```

#### Na Aba Network

1. Abra o DevTools (F12) → **Network**
2. Filtre por `facebook-pixel`
3. Complete o checkout
4. Você verá uma requisição POST para `/api/facebook-pixel`
5. Clique na requisição → **Response** → Veja se retorna `success: true`

## 🔍 Verificar se Purchase Foi Enviado

### No Facebook Events Manager

1. Acesse [Events Manager](https://business.facebook.com/events_manager2)
2. Selecione seu Pixel
3. Vá em **Overview** ou **Events**
4. Procure pelo evento **Purchase**
5. Verifique:
   - Quantidade de eventos
   - Valor total
   - Última ocorrência

### No Test Events (Tempo Real)

1. Vá em **Test Events**
2. Faça uma compra
3. O evento Purchase deve aparecer em alguns segundos

### Verificar Dados do Evento

No Test Events, clique em um evento Purchase para ver:
- ✅ Event ID
- ✅ Valor (value)
- ✅ Moeda (currency)
- ✅ Order ID
- ✅ Dados do usuário (email, phone, etc.)
- ✅ Itens (contents)

## 🐛 Troubleshooting

### Problema: Purchase não aparece

**Possíveis causas:**

1. **Pagamento não foi confirmado**
   - Verifique se o status do pagamento mudou para `paid`
   - Verifique os logs do webhook

2. **Evento não foi disparado**
   - Verifique o console do navegador
   - Verifique se `paymentStatus === 'paid'` na página ThankYou

3. **Erro ao enviar para Facebook**
   - Verifique os logs da Vercel
   - Verifique se `FACEBOOK_ACCESS_TOKEN` está correto

### Problema: Evento aparece mas sem dados

**Solução:**
- Verifique se os dados do cliente estão sendo enviados
- Verifique se `purchasedItems` não está vazio
- Verifique se `orderNumber` está definido

### Problema: Evento duplicado

**Causa:** O useEffect pode estar sendo executado múltiplas vezes

**Solução:** Já implementamos proteção, mas se acontecer:
- Verifique se há múltiplas renderizações
- Adicione um flag para garantir que só envia uma vez

## ✅ Checklist de Teste

Antes de testar com compra real:

- [ ] Pixel ID configurado na Vercel (`VITE_FACEBOOK_PIXEL_ID`)
- [ ] Access Token configurado na Vercel (`FACEBOOK_ACCESS_TOKEN`)
- [ ] Test Events ativado no Facebook
- [ ] Console do navegador aberto (para ver logs)
- [ ] Network tab aberto (para ver requisições)

Durante o teste:

- [ ] Adicionar produto ao carrinho → Ver AddToCart no Test Events
- [ ] Iniciar checkout → Ver InitiateCheckout no Test Events
- [ ] Completar pagamento → Ver Purchase no Test Events
- [ ] Verificar dados do evento (valor, itens, etc.)

Após o teste:

- [ ] Verificar no Events Manager (Overview)
- [ ] Verificar logs da Vercel
- [ ] Verificar se não há erros no console

## 📊 Onde Ver os Eventos

### 1. Test Events (Tempo Real)
- **URL:** Events Manager → Test Events
- **Quando usar:** Durante testes
- **Vantagem:** Ver eventos em tempo real

### 2. Overview (Histórico)
- **URL:** Events Manager → Overview
- **Quando usar:** Ver histórico de eventos
- **Vantagem:** Ver estatísticas e tendências

### 3. Events (Detalhado)
- **URL:** Events Manager → Events
- **Quando usar:** Ver detalhes de cada evento
- **Vantagem:** Ver dados completos de cada evento

## 🎉 Pronto!

Após seguir esses passos, você conseguirá verificar se as conversões estão sendo enviadas corretamente para o Facebook quando há um pagamento real aprovado.

**Dica:** Use o Test Events para testes iniciais, depois verifique no Overview para confirmar que está funcionando em produção.


