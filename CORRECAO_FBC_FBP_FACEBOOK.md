# 🔧 Correção de fbc e fbp para Facebook Conversions API

## 📋 Problema Identificado

O Facebook estava reportando que **`fbc` (Identificação de clique)** não estava sendo enviado pela API de Conversões, o que afeta significativamente a atribuição de conversões às campanhas.

### Impacto do Problema:
- ❌ Conversões não eram atribuídas às campanhas
- ❌ Qualidade da correspondência reduzida
- ❌ Perda de até **100%+ de conversões adicionais relatadas** (segundo Facebook)

## ✅ Correções Implementadas

### 1. Melhoria na Captura de `fbc` (Facebook Click ID)

**Antes:**
- Tentava obter do cookie `_fbc`
- Se não existisse, ficava vazio

**Agora:**
- Obtém do cookie `_fbc` (criado pelo Facebook Pixel)
- Se não existir, cria a partir de `fbclid` na URL
- Salva no cookie para reutilizar (90 dias)
- Formato correto: `fb.1.timestamp.fbclid`

```typescript
// Se não tiver fbc no cookie, criar a partir de fbclid na URL
if (!fbc) {
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
    // Salva no cookie
  }
}
```

### 2. Melhoria na Captura de `fbp` (Facebook Browser ID)

**Antes:**
- Tentava obter do cookie `_fbp`
- Se não existisse, criava manualmente (incorreto)

**Agora:**
- Obtém do cookie `_fbp` (criado pelo Facebook Pixel)
- Não cria manualmente (deve ser criado pelo Pixel)
- Adiciona logs para debug

### 3. Logs Detalhados

Agora o sistema loga:
- ✅ Quando `fbc` é capturado/enviado
- ✅ Quando `fbp` é capturado/enviado
- ⚠️ Quando estão ausentes (com avisos)
- 📊 Preview dos valores (primeiros 30 caracteres)

### 4. Verificação no Backend

O backend agora:
- Valida se `fbc` e `fbp` foram recebidos
- Loga quando estão ausentes
- Sempre envia quando disponíveis

## 📊 Parâmetros Enviados

### ✅ Parâmetros com 100% de Cobertura:
- Email (hash SHA256)
- IP (não hash)
- User Agent (não hash)
- External ID (CPF)
- CEP (hash SHA256)
- País (hash SHA256)
- Nome (hash SHA256)
- Sobrenome (hash SHA256)
- Cidade (hash SHA256)
- Estado (hash SHA256)

### ⚠️ Parâmetros que Precisam Melhorar:
- **fbc** (Identificação de clique) - **CRÍTICO**
  - Impacto: +100% conversões adicionais
  - Status: Agora sendo capturado corretamente
  
- **fbp** (Identificação do navegador)
  - Impacto: +13.04% conversões adicionais
  - Status: Agora sendo capturado corretamente

- **Telefone** (hash SHA256)
  - Impacto: +14.78% conversões adicionais
  - Status: Já estava sendo enviado, melhorado logs

## 🔍 Como Verificar se Está Funcionando

### 1. No Console do Navegador (F12)

Quando um evento Purchase é enviado, você deve ver:

```
✅ fbc será enviado: fb.1.1234567890.abc...
✅ fbp será enviado: fb.1.1234567890.xyz...
📊 Facebook IDs capturados: { hasFbc: true, hasFbp: true, ... }
```

### 2. No Facebook Events Manager

Após algumas horas, verifique:
1. Acesse **Events Manager** → Seu Pixel
2. Vá em **Test Events** ou **Diagnostics**
3. Verifique se os eventos têm:
   - ✅ `fbc` presente
   - ✅ `fbp` presente
   - ✅ Qualidade da correspondência melhorada

### 3. No Facebook Ads Manager

Após 24-48 horas:
1. Acesse sua campanha
2. Verifique se as conversões estão sendo atribuídas
3. Compare com períodos anteriores

## ⚠️ Importante

### Quando `fbc` NÃO será capturado:

1. **Usuário não clicou em anúncio do Facebook**
   - Se o usuário acessou diretamente (sem `fbclid` na URL)
   - Se o usuário veio de outra fonte (Google, direto, etc.)
   - **Isso é normal e esperado!**

2. **Cookie expirado ou limpo**
   - Cookies têm validade de 90 dias
   - Se o usuário limpou cookies, será recriado no próximo clique

### Quando `fbc` SERÁ capturado:

1. ✅ Usuário clicou em anúncio do Facebook
2. ✅ URL contém `fbclid=...`
3. ✅ Cookie `_fbc` foi criado pelo Facebook Pixel
4. ✅ Cookie ainda está válido (90 dias)

## 🎯 Resultados Esperados

Após essas correções, você deve ver:

1. **Qualidade da correspondência melhorada**
   - Aumento de ~0.7 pontos na pontuação
   - Mais eventos com correspondência de alta qualidade

2. **Mais conversões atribuídas**
   - Conversões que antes não eram atribuídas agora serão
   - Aumento de até 100%+ em conversões adicionais relatadas

3. **Melhor atribuição de campanha**
   - Conversões serão corretamente vinculadas às campanhas
   - ROI mais preciso

## 📝 Próximos Passos

1. **Aguardar 24-48 horas** para o Facebook processar
2. **Verificar no Events Manager** se `fbc` está sendo enviado
3. **Comparar métricas** antes e depois
4. **Monitorar logs** no console para garantir que está funcionando

## 🔧 Troubleshooting

### Se `fbc` ainda não aparecer:

1. **Verifique se o usuário clicou em anúncio**
   - A URL deve conter `?fbclid=...`
   - Sem `fbclid`, não há como criar `fbc`

2. **Verifique se o Facebook Pixel está inicializado**
   - Deve aparecer no console: "✅ Facebook Pixel inicializado"
   - Cookies `_fbp` e `_fbc` devem existir

3. **Verifique os logs do backend**
   - Procure por "fbc recebido e será enviado"
   - Se não aparecer, o problema está na captura

4. **Teste com Test Events Code**
   - Configure `FACEBOOK_TEST_EVENT_CODE` no Vercel
   - Use a ferramenta de teste do Facebook

## 📚 Referências

- [Facebook Conversions API - fbc](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc)
- [Facebook Pixel - Configurador de Parâmetro](https://developers.facebook.com/docs/meta-pixel/implementation/parameter-helper)

