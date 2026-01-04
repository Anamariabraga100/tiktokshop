# 💰 Como Recuperar Pagamentos que Foram Feitos mas Não Foram Contabilizados

## 📋 Problema

Se você teve pagamentos PIX que foram feitos pelos clientes mas não foram contabilizados no sistema antes da correção, este guia explica como recuperá-los.

## 🔍 Opções para Recuperar Pagamentos

### Opção 1: Sincronização Automática (Recomendado)

Use o endpoint `/api/sync-payments` para sincronizar automaticamente todos os pagamentos pagos no gateway que não estão no banco.

#### Via GET (simulação):
```
GET /api/sync-payments?days=30&status=PAID&dryRun=true
```

#### Via POST (atualização real):
```json
POST /api/sync-payments
{
  "days": 30,
  "status": "PAID",
  "dryRun": false,
  "limit": 100
}
```

**Parâmetros:**
- `days`: Últimos N dias para buscar (padrão: 30)
- `status`: Status para buscar (padrão: "PAID")
- `dryRun`: Se `true`, apenas lista sem atualizar (padrão: `false`)
- `limit`: Limite de transações (padrão: 100)

**Exemplo de resposta:**
```json
{
  "success": true,
  "message": "Sincronização concluída",
  "summary": {
    "totalTransactions": 10,
    "checked": 8,
    "updated": 5,
    "alreadyUpdated": 2,
    "notInDatabase": 1,
    "errors": 0
  },
  "details": [...]
}
```

### Opção 2: Atualização Manual por TransactionId

Se você souber o `transactionId` de um pagamento específico, use o endpoint `/api/manual-update-payment`:

```json
POST /api/manual-update-payment
{
  "transactionId": "id-da-transacao-aqui"
}
```

### Opção 3: Verificar no Painel do UmbrellaPag

1. Acesse o painel do UmbrellaPag
2. Vá em **Transações** ou **Pagamentos**
3. Filtre por status **PAID** (Pago)
4. Para cada transação paga:
   - Copie o `transactionId`
   - Use o endpoint `/api/manual-update-payment` com esse ID
   - Ou use o endpoint `/api/debug-payment?transactionId=ID` para verificar

### Opção 4: Usar o Endpoint de Debug

Para verificar um pagamento específico:

```
GET /api/debug-payment?transactionId=ID_DA_TRANSACAO
```

Isso mostra:
- Se está no banco de dados
- Status no banco vs gateway
- Se precisa atualizar
- Recomendações

## 📝 Passo a Passo Completo

### 1. Primeiro, faça uma simulação (dry run):

```bash
# Via curl
curl "https://seu-site.com/api/sync-payments?dryRun=true&days=30"

# Ou via navegador
https://seu-site.com/api/sync-payments?dryRun=true&days=30
```

Isso vai mostrar quantos pagamentos precisam ser atualizados **sem fazer alterações**.

### 2. Se encontrar pagamentos para atualizar, execute a sincronização real:

```bash
# Via curl
curl -X POST "https://seu-site.com/api/sync-payments" \
  -H "Content-Type: application/json" \
  -d '{"days": 30, "dryRun": false}'

# Ou via navegador (POST precisa de ferramenta como Postman)
```

### 3. Verifique os resultados:

O endpoint retorna um resumo mostrando:
- Quantos foram atualizados
- Quantos já estavam atualizados
- Quantos não estão no banco (precisam ser criados manualmente)

## ⚠️ Importante

### Transações que não estão no banco

Se o endpoint encontrar transações pagas no gateway que **não estão no banco de dados**, isso significa que:

1. A transação foi criada no gateway mas não foi salva no banco (erro na criação)
2. A transação foi criada antes do sistema estar configurado

**Para essas transações:**
- Você precisará criar o pedido manualmente no banco
- Ou entrar em contato com o cliente para confirmar os dados do pedido
- Use o `transactionId` do gateway para referência

### Verificar no Painel do UmbrellaPag

Se a API não suportar listagem de todas as transações, você precisará:

1. Acessar o painel do UmbrellaPag
2. Exportar a lista de transações pagas
3. Para cada uma, usar `/api/manual-update-payment` com o `transactionId`

## 🔧 Script de Exemplo

Se você tiver uma lista de `transactionId`s, pode criar um script:

```javascript
const transactionIds = [
  'id-1',
  'id-2',
  'id-3'
];

for (const transactionId of transactionIds) {
  const response = await fetch('/api/manual-update-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId })
  });
  
  const result = await response.json();
  console.log(`${transactionId}: ${result.message}`);
}
```

## 📞 Contato com o Gateway

Se você precisar entrar em contato com o UmbrellaPag:

1. **Painel do UmbrellaPag**: Acesse o painel para ver todas as transações
2. **Suporte**: Entre em contato com o suporte do UmbrellaPag se precisar de ajuda
3. **API**: Use a documentação da API para consultas específicas

## ✅ Verificação Final

Após sincronizar, verifique:

1. Acesse o banco de dados (Supabase)
2. Verifique a tabela `orders`
3. Filtre por `umbrella_status = 'PAID'`
4. Confirme que todos os pagamentos estão lá

## 🎯 Resumo

- **Use `/api/sync-payments`** para sincronização automática em lote
- **Use `/api/manual-update-payment`** para atualizar transações específicas
- **Use `/api/debug-payment`** para verificar o status de uma transação
- **Acesse o painel do UmbrellaPag** para ver todas as transações pagas

