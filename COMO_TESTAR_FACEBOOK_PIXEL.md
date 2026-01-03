# 🧪 Como Testar o Facebook Pixel

Este guia explica como testar o Facebook Pixel sem precisar fazer um pagamento real.

## 📋 Opções de Teste

### 1. Página de Teste HTML (Recomendado)

Acesse a página de teste em:
```
https://seu-dominio.com/test-facebook-pixel.html
```

Ou localmente:
```
http://localhost:8080/test-facebook-pixel.html
```

**Como usar:**
1. Abra a página de teste no navegador
2. Preencha os dados do formulário (ou clique em "Preencher Dados de Exemplo")
3. Selecione o tipo de evento que deseja testar
4. Clique em "Enviar Evento"
5. Verifique o resultado na tela

**Eventos disponíveis para teste:**
- `PageView` - Visualização de página
- `ViewContent` - Visualização de produto
- `AddToCart` - Adicionar ao carrinho
- `InitiateCheckout` - Iniciar checkout
- `Purchase` - Compra concluída (recomendado para testar)
- `Lead` - Lead gerado

### 2. Test Events Code do Facebook

Se você configurou o `FACEBOOK_TEST_EVENT_CODE` nas variáveis de ambiente, todos os eventos enviados aparecerão no **Facebook Events Manager** na seção "Test Events".

**Como verificar:**
1. Acesse o [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Selecione seu Pixel
3. Vá em "Test Events" no menu lateral
4. Os eventos de teste aparecerão em tempo real

### 3. Console do Navegador

Abra o console do navegador (F12) e verifique:
- ✅ Mensagens de sucesso: `✅ Evento enviado para Facebook Pixel com sucesso!`
- ❌ Mensagens de erro: `❌ Erro ao enviar evento para Facebook Pixel:`

### 4. Logs do Vercel

Verifique os logs do servidor no Vercel:
1. Acesse o dashboard do Vercel
2. Vá em "Functions" > "facebook-pixel"
3. Veja os logs em tempo real

**Logs esperados:**
- `📤 Enviando evento para Facebook com dados completos:` - Mostra quais campos estão sendo enviados
- `✅ Evento enviado para Facebook Pixel:` - Confirmação de sucesso
- `❌ Erro ao enviar evento para Facebook:` - Erro (se houver)

## 🔍 O que Verificar

### Dados Enviados Corretamente

O sistema deve enviar:
- ✅ **Email** (com hash SHA256)
- ✅ **Telefone** (com hash SHA256 e código do país)
- ✅ **Nome e Sobrenome** (com hash SHA256)
- ✅ **Endereço** (cidade, estado, CEP, país - com hash SHA256)
- ✅ **IP do Cliente** (obrigatório)
- ✅ **User Agent** (obrigatório)
- ✅ **FBC e FBP** (cookies do Facebook, se disponíveis)
- ✅ **External ID** (CPF, se disponível)
- ✅ **Valor da Compra**
- ✅ **ID do Pedido** (para eventos Purchase)
- ✅ **IDs dos Produtos**

### Validações Importantes

1. **IP e User Agent são obrigatórios** - Sem esses dados, o evento não será enviado
2. **Dados sensíveis devem ter hash SHA256** - Email, telefone, nome, endereço
3. **Telefone deve incluir código do país** - Ex: 5511999999999 (55 = Brasil)
4. **Event ID único** - Cada evento deve ter um ID único para desduplicação

## 🐛 Troubleshooting

### Erro: "Dados insuficientes do cliente"

**Causa:** IP ou User Agent não foram coletados.

**Solução:**
- Verifique se está acessando via navegador (não via API direta)
- O servidor deve conseguir obter o IP dos headers (`x-forwarded-for`, `x-real-ip`)
- O User Agent deve estar presente nos headers da requisição

### Erro: "Invalid parameter"

**Causa:** Algum campo está vazio ou em formato incorreto.

**Solução:**
- Verifique os logs do servidor para ver quais campos estão sendo enviados
- Certifique-se de que os dados estão no formato correto
- Campos vazios não devem ser enviados

### Eventos não aparecem no Test Events

**Causa:** Test Events Code não configurado ou incorreto.

**Solução:**
1. Verifique se `FACEBOOK_TEST_EVENT_CODE` está configurado no Vercel
2. Obtenha o código em: Facebook Events Manager > Test Events > Test Events Code
3. Adicione nas variáveis de ambiente do Vercel

## 📝 Exemplo de Uso

### Teste Rápido de Purchase

1. Acesse `/test-facebook-pixel.html`
2. Selecione "Purchase" no tipo de evento
3. Preencha:
   - Email: `teste@exemplo.com`
   - Telefone: `11999999999`
   - Nome: `João`
   - Sobrenome: `Silva`
   - Valor: `99.90`
   - ID do Pedido: `TEST-12345`
4. Clique em "Enviar Evento"
5. Verifique o resultado e os logs

## ✅ Checklist de Teste

Antes de considerar o teste bem-sucedido, verifique:

- [ ] Evento foi enviado sem erros (status 200)
- [ ] Logs mostram todos os campos esperados
- [ ] Evento aparece no Test Events (se configurado)
- [ ] Dados sensíveis estão com hash SHA256
- [ ] IP e User Agent estão presentes
- [ ] Event ID é único para cada evento
- [ ] Valor e moeda estão corretos
- [ ] ID do pedido está presente (para Purchase)

## 🔗 Links Úteis

- [Facebook Events Manager](https://business.facebook.com/events_manager2)
- [Facebook Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Test Events Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api#testEvents)

