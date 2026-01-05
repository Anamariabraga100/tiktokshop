# 🧪 PLANO DE TESTE PIX - PARTE POR PARTE

## ✅ CAMADA 1 - Endpoint está vivo? (TESTANDO AGORA)

**Status:** 🟡 Em teste

**O que foi feito:**
- Endpoint retorna JSON simples: `{ ok: true, step: 'backend-alive' }`
- Todo o código complexo foi comentado temporariamente

**Como testar:**
```bash
# Aguardar 2-3 minutos para deploy
# Depois executar:
$env:TEST_URL="https://tiktokshop-orpin.vercel.app/api/create-pix-transaction"; node test-endpoint.js
```

**Resultado esperado:**
```json
{
  "ok": true,
  "step": "backend-alive",
  "message": "Endpoint está funcionando!"
}
```

**Se funcionar:**
- ✅ Endpoint está vivo
- ✅ Vercel está executando a função
- ✅ Estrutura do arquivo está correta
- ➡️ **PRÓXIMO:** CAMADA 2 (testar ENV)

**Se falhar:**
- ❌ Problema na estrutura do arquivo
- ❌ Problema no runtime da Vercel
- ❌ Problema na rota/URL

---

## 🔜 CAMADA 2 - ENV está sendo lida?

**O que fazer:**
Trocar o return da CAMADA 1 por:
```javascript
return res.status(200).json({
  ok: true,
  env: !!process.env.UMBRELLAPAG_API_KEY,
  envLength: process.env.UMBRELLAPAG_API_KEY?.length || 0
});
```

**Resultado esperado:**
```json
{
  "ok": true,
  "env": true,
  "envLength": 36
}
```

**Se `env: false`:**
- ❌ Variável não está configurada na Vercel
- ❌ Deploy não incluiu as variáveis
- ➡️ **AÇÃO:** Configurar ENV na Vercel e fazer redeploy

---

## 🔜 CAMADA 3 - A função consegue acessar ENV sem crash?

**O que fazer:**
```javascript
return res.status(200).json({
  ok: true,
  usingKey: process.env.UMBRELLAPAG_API_KEY?.slice(0, 5) + '***'
});
```

**Se crashar:**
- ❌ ENV inválida
- ❌ Erro de build

---

## 🔜 CAMADA 4 - Chamar Umbrella isolado (sem front)

**O que fazer:**
```javascript
const response = await fetch('https://api.umbrellapag.com/api/user/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.UMBRELLAPAG_API_KEY,
    'User-Agent': 'UMBRELLAB2B/1.0',
  },
  body: JSON.stringify({ test: true })
});

const text = await response.text();

return res.status(200).json({
  status: response.status,
  raw: text.substring(0, 500)
});
```

**Resultado esperado:**
- JSON do Umbrella
- ou erro claro (401, 403, etc.)

**Se vier HTML:**
- ❌ Chave errada
- ❌ Endpoint errado

---

## 🔜 CAMADA 5 - Normalizar payload do PIX

**O que fazer:**
Garantir que `totalPrice` seja normalizado:
```javascript
const normalizedPrice = Number(Number(totalPrice).toFixed(2));
const amountInCents = Math.round(normalizedPrice * 100);
```

**Nunca mandar float cru como `85.23`**

---

## 🔜 CAMADA 6 - Frontend testando JSON cru

**No front, logar:**
```javascript
console.log('PIX RESPONSE RAW:', responseText);
```

**Antes do parse.**

---

## 📋 Checklist de Progresso

- [ ] CAMADA 1: Endpoint está vivo? ⏳ TESTANDO
- [ ] CAMADA 2: ENV está sendo lida?
- [ ] CAMADA 3: A função consegue acessar ENV?
- [ ] CAMADA 4: Chamar Umbrella isolado
- [ ] CAMADA 5: Normalizar payload
- [ ] CAMADA 6: Frontend testando





