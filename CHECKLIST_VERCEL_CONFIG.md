# 🔍 CHECKLIST - Configuração Vercel para Resolver FUNCTION_INVOCATION_FAILED

## 📋 Diagnóstico Atual

✅ **Correções já aplicadas:**
- `vercel.json` corrigido (removido rewrite de `/api/*`)
- Vercel agora reconhece a rota (não retorna mais HTML)
- Código mínimo testado (ainda falha)

❌ **Problema persistente:**
- `FUNCTION_INVOCATION_FAILED` mesmo com código mínimo
- Indica problema de **configuração**, não de código

---

## ✅ AÇÕES OBRIGATÓRIAS (em ordem)

### 1️⃣ Confirmar Framework Preset

**Localização:**
```
Vercel Dashboard → Projeto → Settings → General → Framework Preset
```

**Verificar:**
- ✅ Deve estar como **Vite**
- ❌ Se estiver como **Next.js** → isso causa `FUNCTION_INVOCATION_FAILED`

**Ação:**
1. Se estiver errado, alterar para **Vite**
2. Salvar
3. Fazer **Redeploy**

---

### 2️⃣ Confirmar Node.js Version

**Localização:**
```
Vercel Dashboard → Projeto → Settings → General → Node.js Version
```

**Verificar:**
- ✅ Deve ser **18.x** ou **20.x**
- ❌ NÃO usar versões antigas (16 ou abaixo)

**Ação:**
1. Se estiver errado, alterar para **18.x** ou **20.x**
2. Salvar
3. Fazer **Redeploy**

---

### 3️⃣ Confirmar Runtime das Functions

**Localização:**
```
Vercel Dashboard → Projeto → Settings → Functions → Runtime
```

**Verificar:**
- ✅ Deve estar como **Node.js**
- ❌ NÃO **Edge**
- ❌ NÃO **Experimental**

**Ação:**
1. Se estiver errado, alterar para **Node.js**
2. Salvar
3. Fazer **Redeploy**

---

### 4️⃣ Verificar Estrutura do Projeto

**Estrutura correta para Vite + Serverless Functions:**

```
/
├── api/
│   ├── test.js              ← Serverless Function
│   └── create-pix-transaction.js
├── src/
│   └── ...                  ← Código React/Vite
├── vite.config.ts
├── vercel.json
└── package.json
```

**✅ CORRETO:**
- `/api/test.js` (serverless function standalone)
- `vite.config.ts` (configuração Vite)
- `src/` (código frontend)

**❌ INCORRETO:**
- `/pages/api/` (isso é Next.js, não Vite)
- `/app/api/` (isso é Next.js App Router)

---

### 5️⃣ Ver Logs Exatos da Falha

**Localização:**
```
Vercel Dashboard → Projeto → Deployments → [Último Deploy]
→ Functions → /api/test → Logs
```

**O que procurar:**
- Stack trace completo
- Erro de module resolution
- Erro de sintaxe
- Erro de runtime
- Mensagem de erro específica (não só "FUNCTION_INVOCATION_FAILED")

**Ação:**
1. Copiar o erro completo dos logs
2. Compartilhar para análise

---

## 🚨 HIPÓTESE MAIS PROVÁVEL

Com base no diagnóstico:

**O projeto é Vite, mas a Vercel pode estar tentando tratar como Next.js API**

Isso gera exatamente:
- `FUNCTION_INVOCATION_FAILED`
- Mesmo com código mínimo
- Sem logs detalhados

---

## 🔧 CONFIGURAÇÕES ADICIONAIS POSSÍVEIS

### Opção 1: Adicionar `functions` no `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Opção 2: Verificar se precisa de `package.json` com engines

```json
{
  "engines": {
    "node": "18.x"
  }
}
```

---

## 📝 CHECKLIST DE VERIFICAÇÃO

- [ ] Framework Preset = **Vite**
- [ ] Node.js Version = **18.x** ou **20.x**
- [ ] Functions Runtime = **Node.js**
- [ ] Estrutura de pastas correta (`/api/*.js`)
- [ ] Logs da função verificados
- [ ] Redeploy feito após mudanças

---

## 🎯 PRÓXIMOS PASSOS

1. **Verificar todas as configurações acima na Vercel**
2. **Copiar os logs exatos da função `/api/test`**
3. **Compartilhar os logs para análise final**

---

## 💡 NOTA IMPORTANTE

Se após todas essas verificações o problema persistir, pode ser necessário:

1. **Recriar o projeto na Vercel** (importar novamente do GitHub)
2. **Verificar se há conflitos de configuração** entre diferentes presets
3. **Considerar usar Vercel CLI localmente** para testar as funções

