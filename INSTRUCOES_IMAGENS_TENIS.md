# Instruções para Adicionar Imagens do Tênis

## 1. Adicionar logo.png
Coloque o arquivo `logo.png` na pasta `src/assets/products/`

Depois, edite `src/components/shop/Header.tsx` e descomente a linha:
```typescript
import logoImage from '@/assets/products/logo.png';
```
E comente ou remova a linha do fallback.

## 2. Adicionar Imagens do Tênis
Coloque todas as imagens dos tênis na pasta `src/assets/products/tenis/`

Depois, edite `src/data/products.ts` e adicione os imports no topo do arquivo:
```typescript
import tenis1 from '@/assets/products/tenis/nome-da-imagem-1.jpg';
import tenis2 from '@/assets/products/tenis/nome-da-imagem-2.jpg';
import tenis3 from '@/assets/products/tenis/nome-da-imagem-3.jpg';
// ... adicione todas as imagens
```

E atualize o array `images` do produto tênis (id: '9'):
```typescript
images: [
  tenisCasual, // imagem principal
  tenis1,
  tenis2,
  tenis3,
  // ... todas as outras imagens
],
```

As imagens já terão suporte a swipe/arrastar para o lado na página do produto!

