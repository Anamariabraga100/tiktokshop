# 🔍 Como Verificar Logs da Função Serverless na Vercel

## 📊 Para ver os logs e descobrir o erro:

1. **No dashboard da Vercel:**
   - Clique no seu projeto **tiktokshop**
   - Vá em **Deployments**
   - Clique no último deploy (o mais recente)

2. **Abrir os logs da função:**
   - No deploy, você verá uma seção **Functions**
   - Clique em **Functions**
   - Procure por `/api/create-pix-transaction`
   - Clique nela para ver os logs

3. **O que procurar nos logs:**
   - ❌ **"API Key não configurada"** → Variável de ambiente não foi adicionada
   - ❌ **"Dados incompletos"** → Dados do cliente não estão chegando
   - ❌ **"fetch failed"** → Problema na requisição para UmbrellaPag
   - ✅ Se aparecer "🚀 Chamando API UmbrellaPag" → A função está funcionando!

## 🔧 Verificar Variáveis de Ambiente:

1. Vá em **Settings → Environment Variables**
2. Confirme que `UMBRELLAPAG_API_KEY` está lá
3. Confirme que está marcada para **Production** (e Preview/Development se quiser)

## 🔄 Após Corrigir:

1. Faça um novo commit (ou redeploy)
2. Aguarde o deploy terminar
3. Teste novamente

## 📝 Dica:

Os logs aparecem em tempo real quando você faz uma requisição. Então:
1. Deixe os logs abertos
2. Tente fazer um pedido PIX no site
3. Veja os logs aparecerem em tempo real!

