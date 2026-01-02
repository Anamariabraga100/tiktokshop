# 🔧 Solução para Erro de CORS com UmbrellaPag

O erro de CORS ocorre porque a API do UmbrellaPag **não permite requisições diretas do navegador** por questões de segurança.

## ⚠️ Por que isso acontece?

APIs de pagamento geralmente bloqueiam requisições diretas do frontend para:
- Proteger a API Key
- Prevenir ataques
- Garantir que validações sejam feitas no servidor

## ✅ Solução: Criar um Backend/API Route

A melhor solução é criar um endpoint no seu backend que faça a requisição para o UmbrellaPag.

### Exemplo com Node.js/Express

```javascript
// backend/routes/payment.js
const express = require('express');
const router = express.Router();

router.post('/create-pix-transaction', async (req, res) => {
  try {
    const { customerData, items, totalPrice, metadata } = req.body;
    
    const response = await fetch('https://api.umbrellapag.com/api/user/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.UMBRELLAPAG_API_KEY, // API Key no backend
        'User-Agent': 'UMBRELLAB2B/1.0',
      },
      body: JSON.stringify({
        // ... dados da transação
      }),
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Exemplo com Vercel Serverless Functions

Crie `api/create-pix.js`:

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.umbrellapag.com/api/user/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.UMBRELLAPAG_API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Atualizar o Frontend

Depois de criar o backend, atualize `src/lib/umbrellapag.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || '/api'; // URL do seu backend

export const createPixTransaction = async (...) => {
  // Em vez de chamar diretamente o UmbrellaPag:
  const response = await fetch(`${API_URL}/create-pix-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customerData, items, totalPrice, metadata }),
  });
  
  // ...
};
```

## 🚀 Solução Temporária para Desenvolvimento

Se você precisa testar rapidamente em desenvolvimento, pode usar um proxy CORS público:

⚠️ **NÃO USE EM PRODUÇÃO! Apenas para testes!**

```typescript
// Apenas para desenvolvimento
const API_URL = import.meta.env.DEV
  ? 'https://cors-anywhere.herokuapp.com/https://api.umbrellapag.com'
  : 'https://api.umbrellapag.com';
```

**Mas a solução correta é sempre usar um backend!**

## 📝 Próximos Passos

1. **Crie um backend** (Node.js, Python, etc.)
2. **Crie um endpoint** que faça a requisição para UmbrellaPag
3. **Mova a API Key** para variáveis de ambiente do backend
4. **Atualize o frontend** para chamar seu backend

## 🔐 Segurança

- ✅ **Backend**: API Key segura no servidor
- ❌ **Frontend direto**: API Key exposta no código (INSEGURO!)

Sempre use backend para APIs de pagamento!

