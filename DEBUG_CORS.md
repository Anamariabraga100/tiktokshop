# Debug de Problemas CORS com UmbrellaPag

Se você está recebendo erros ao tentar gerar QR Code PIX em desenvolvimento local, pode ser um problema de CORS.

## 🔍 Como Identificar Problema de CORS

1. **Abra o Console do navegador** (F12 → Console)
2. **Abra a aba Network** (F12 → Network)
3. **Tente criar uma transação PIX**
4. **Procure por erros como:**
   - `CORS policy: No 'Access-Control-Allow-Origin' header`
   - `Failed to fetch`
   - Status 403 ou 405 na requisição

## ✅ Soluções

### Opção 1: Usar Proxy no Vite (Recomendado para desenvolvimento)

1. Descomente o proxy no `vite.config.ts`:

```typescript
proxy: {
  '/api/umbrellapag': {
    target: 'https://api.umbrellapag.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/umbrellapag/, '/api'),
  },
},
```

2. Atualize a URL no `umbrellapag.ts` para usar o proxy:

```typescript
const UMBRELLAPAG_API_URL = import.meta.env.DEV 
  ? '/api/umbrellapag'  // Usa proxy em desenvolvimento
  : 'https://api.umbrellapag.com';  // URL direta em produção
```

### Opção 2: Criar Backend/API Route

Para produção, é recomendado fazer requisições através de um backend:

- Criar endpoint no seu backend (Node.js, Python, etc.)
- Backend faz requisição para UmbrellaPag
- Frontend faz requisição para seu backend
- Isso evita expor a API Key no frontend

### Opção 3: Configurar CORS no UmbrellaPag (se disponível)

Algumas APIs permitem configurar domínios permitidos. Verifique no painel do UmbrellaPag se há configurações de CORS ou domínios permitidos.

### Opção 4: Usar Extensão do Navegador (Apenas para testes)

⚠️ **NÃO RECOMENDADO PARA PRODUÇÃO**

Para testes rápidos, você pode usar extensões como:
- "CORS Unblock" (Chrome)
- "Disable CORS" (Chrome)

**Nunca use em produção!**

## 🔧 Verificar se é CORS

Execute no console do navegador:

```javascript
fetch('https://api.umbrellapag.com/api/user/transactions', {
  method: 'OPTIONS',
  headers: {
    'x-api-key': 'sua-api-key',
  }
})
.then(r => console.log('CORS OK:', r))
.catch(e => console.error('CORS ERROR:', e));
```

## 📝 Notas

- APIs de pagamento geralmente não permitem requisições diretas do navegador por segurança
- A solução ideal é usar um backend intermediário
- Para desenvolvimento, o proxy do Vite funciona bem
- Em produção, sempre use backend para manter a API Key segura

