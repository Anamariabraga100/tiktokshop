# 🔧 Troubleshooting - Facebook Pixel

## ❌ Problema: Pixel não aparece no Meta Pixel Helper

### ✅ Solução 1: Verificar Variáveis de Ambiente na Vercel

**IMPORTANTE:** No Vercel, você precisa configurar **DUAS variáveis diferentes**:

1. **Para o Frontend (acessível no navegador):**
   - Nome: `VITE_FACEBOOK_PIXEL_ID`
   - Valor: Seu Pixel ID (ex: `123456789012345`)
   - Ambiente: Production, Preview, Development

2. **Para o Backend (servidor):**
   - Nome: `FACEBOOK_PIXEL_ID` (ou pode usar o mesmo `VITE_FACEBOOK_PIXEL_ID`)
   - Valor: Seu Pixel ID
   - Ambiente: Production, Preview, Development

3. **Para o Backend (Conversions API):**
   - Nome: `FACEBOOK_ACCESS_TOKEN`
   - Valor: Seu Access Token
   - Ambiente: Production, Preview, Development

### ✅ Solução 2: Verificar no Console do Navegador

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Recarregue a página
4. Procure por mensagens:
   - ✅ `Inicializando Facebook Pixel: [seu-id]` - Pixel está sendo inicializado
   - ✅ `Script do Facebook Pixel carregado` - Script carregou com sucesso
   - ⚠️ `Facebook Pixel ID não configurado` - Variável não está definida

### ✅ Solução 3: Verificar Network Tab

1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Filtre por `facebook` ou `fbevents`
4. Recarregue a página
5. Deve aparecer requisições para:
   - `connect.facebook.net/en_US/fbevents.js`
   - `facebook.com/tr?id=...`

### ✅ Solução 4: Desabilitar Ad Blockers

Alguns ad blockers bloqueiam o Facebook Pixel. Para testar:

1. Desabilite temporariamente o ad blocker
2. Ou adicione o site à lista de exceções
3. Recarregue a página

### ✅ Solução 5: Verificar se o Deploy foi Concluído

1. Acesse o dashboard da Vercel
2. Vá em **Deployments**
3. Verifique se o último deploy está **Ready** (verde)
4. Se estiver em **Building** ou **Error**, aguarde ou verifique os logs

### ✅ Solução 6: Limpar Cache

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Ou faça um hard refresh (Ctrl+Shift+R)
3. Ou abra em aba anônima/privada

## 🔍 Verificar se Está Funcionando

### Teste 1: Console do Navegador

Abra o console e digite:
```javascript
window.fbq
```

Se retornar uma função, o pixel está carregado! ✅

### Teste 2: Verificar Cookies

O Facebook Pixel cria cookies. Verifique se existem:
- `_fbp` - Facebook Browser ID
- `_fbc` - Facebook Click ID (se houver fbclid na URL)

### Teste 3: Meta Pixel Helper

1. Instale a extensão [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Acesse seu site
3. Clique no ícone da extensão
4. Deve mostrar o Pixel ID e eventos rastreados

## 🐛 Erros Comuns

### Erro: "No pixel found"

**Causa:** Variável de ambiente não configurada ou pixel não inicializado

**Solução:**
1. Verifique se `VITE_FACEBOOK_PIXEL_ID` está configurada na Vercel
2. Verifique os logs do console do navegador
3. Faça um novo deploy após adicionar a variável

### Erro: "Script não carrega"

**Causa:** Ad blocker ou problema de rede

**Solução:**
1. Desabilite ad blockers temporariamente
2. Verifique a conexão de internet
3. Verifique se `connect.facebook.net` não está bloqueado

### Erro: "Pixel ID inválido"

**Causa:** Pixel ID incorreto ou formato errado

**Solução:**
1. Verifique se o Pixel ID está correto (apenas números)
2. Não inclua espaços ou caracteres especiais
3. Verifique no Facebook Events Manager

## 📝 Checklist de Configuração

- [ ] Variável `VITE_FACEBOOK_PIXEL_ID` configurada na Vercel
- [ ] Variável `FACEBOOK_ACCESS_TOKEN` configurada na Vercel
- [ ] Deploy concluído com sucesso
- [ ] Console do navegador mostra "Inicializando Facebook Pixel"
- [ ] Network tab mostra requisições para Facebook
- [ ] Meta Pixel Helper detecta o pixel
- [ ] Cookies `_fbp` e `_fbc` são criados

## 🆘 Ainda Não Funciona?

1. **Verifique os logs da Vercel:**
   - Dashboard → Functions → `/api/facebook-pixel`
   - Veja se há erros

2. **Verifique o código no GitHub:**
   - Certifique-se de que o código foi commitado
   - Verifique se o arquivo `src/App.tsx` tem o `FacebookPixelInit`

3. **Teste localmente:**
   - Crie um arquivo `.env.local` com `VITE_FACEBOOK_PIXEL_ID=seu_id`
   - Execute `npm run dev`
   - Verifique se funciona localmente

4. **Contate o suporte:**
   - Se nada funcionar, pode haver um problema específico do ambiente
   - Compartilhe os logs do console e da Vercel






