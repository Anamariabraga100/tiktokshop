# 🔍 Como Verificar se o Evento Purchase foi Enviado para o Facebook

## 🎯 Verificação Rápida

### 1. Console do Navegador

Abra o DevTools (F12) → **Console** e procure por:

**✅ Se foi enviado:**
```
📊 Enviando evento Purchase para Facebook Pixel: {...}
✅✅✅ Evento Purchase enviado para Facebook Pixel com sucesso!
```

**❌ Se não foi enviado:**
```
⏳ Aguardando paymentStatus = paid. Status atual: checking
⏳ Aguardando purchasedItems. Count atual: 0
⏳ Aguardando orderNumber. Valor atual: 
```

### 2. Network Tab

1. Abra o DevTools (F12) → **Network**
2. Filtre por `facebook-pixel`
3. Procure por uma requisição POST para `/api/facebook-pixel`
4. Clique na requisição → **Response**
5. Deve mostrar: `{"success": true, "eventId": "..."}`

### 3. Logs da Vercel

1. Dashboard Vercel → **Functions** → `/api/facebook-pixel`
2. Veja os logs recentes
3. Procure por:
   - `✅ Evento enviado para Facebook Pixel: Purchase`
   - `events_received: 1`

### 4. Facebook Events Manager

1. Acesse [Events Manager](https://business.facebook.com/events_manager2)
2. Selecione seu Pixel
3. Vá em **Test Events** (para ver em tempo real)
4. Ou **Overview** (para ver histórico)
5. Procure pelo evento **Purchase**

## 🐛 Problemas Comuns

### Problema: Purchase não foi enviado

**Causas possíveis:**

1. **paymentStatus não é 'paid'**
   - Verifique no console: `📊 ThankYou - paymentStatus mudou:`
   - Deve mostrar `paymentStatus: 'paid'`

2. **purchasedItems está vazio**
   - Verifique no console: `purchasedItemsCount: 0`
   - Os itens podem não ter sido recuperados do sessionStorage/localStorage

3. **orderNumber não está definido**
   - Verifique no console: `orderNumber: ''`
   - O orderNumber é gerado automaticamente

**Solução:**
- Verifique os logs no console
- Veja qual condição não está sendo atendida
- Os logs agora mostram exatamente o que está faltando

### Problema: Evento enviado mas não aparece no Facebook

**Causas:**
- Delay no processamento (pode levar alguns minutos)
- Test Event Code não configurado
- Evento foi bloqueado por algum motivo

**Solução:**
- Aguarde alguns minutos
- Configure Test Event Code para ver em tempo real
- Verifique logs da Vercel para ver se houve erro

## ✅ Checklist

- [ ] Console mostra `✅✅✅ Evento Purchase enviado`
- [ ] Network tab mostra requisição para `/api/facebook-pixel`
- [ ] Response mostra `success: true`
- [ ] Logs da Vercel mostram evento recebido
- [ ] Facebook Events Manager mostra o evento (pode levar alguns minutos)

## 📊 Logs Esperados

### Quando Purchase é enviado:

```
📊 Enviando evento Purchase para Facebook Pixel: {
  orderId: "H62AG5SM",
  value: 8.97,
  numItems: 1,
  contentsCount: 1
}
✅✅✅ Evento Purchase enviado para Facebook Pixel com sucesso! {
  eventName: "Purchase",
  eventId: "...",
  events_received: 1
}
```

### Quando não é enviado:

```
🔍 Verificando condições para Purchase: {
  paymentStatus: "checking",
  purchasedItemsCount: 0,
  orderNumber: "",
  hasCustomerData: true
}
⏳ Aguardando paymentStatus = paid. Status atual: checking
⏳ Aguardando purchasedItems. Count atual: 0
⏳ Aguardando orderNumber. Valor atual: 
```

## 🎯 Para o Pagamento Atual

Baseado no console que você mostrou:
- `paymentStatus: 'checking'` ← Ainda verificando
- `purchasedItemsCount: 0` ← Itens não foram recuperados ainda
- `orderNumber: ''` ← Ainda não foi gerado

**O evento Purchase será enviado quando:**
1. ✅ `paymentStatus` mudar para `'paid'`
2. ✅ `purchasedItems` tiver itens
3. ✅ `orderNumber` for gerado

**Aguarde alguns segundos** e verifique novamente o console. Os logs agora mostram exatamente o que está acontecendo!



