// Script de teste para verificar o endpoint /api/create-pix-transaction
// Execute: node test-endpoint.js

// URL do endpoint (ajuste conforme necessário)
const ENDPOINT_URL = process.env.TEST_URL || 'http://localhost:8080/api/create-pix-transaction';
// Para testar na Vercel, use: https://tiktokshop-orpin.vercel.app/api/create-pix-transaction

console.log('🧪 Testando endpoint PIX...\n');
console.log('🌐 URL:', ENDPOINT_URL);
console.log('');

// Dados de teste
const testPayload = {
  customer: {
    name: 'Teste API',
    email: 'teste@exemplo.com',
    phone: '11999999999',
    cpf: '12345678900',
    address: {
      rua: 'Rua Teste',
      numero: '123',
      complemento: '',
      cep: '01234567',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP'
    }
  },
  items: [
    {
      name: 'Produto Teste',
      price: 1.00,
      quantity: 1
    }
  ],
  totalPrice: 1.00,
  metadata: {
    test: true,
    orderId: 'TEST-' + Date.now()
  }
};

async function testEndpoint() {
  try {
    console.log('📤 Enviando requisição de teste...\n');
    console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));
    console.log('');
    
    const response = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('📥 Status da resposta:', response.status, response.statusText);
    console.log('📥 Content-Type:', response.headers.get('content-type'));
    console.log('');

    // Obter resposta como texto primeiro
    const responseText = await response.text();
    console.log('📥 Resposta raw (primeiros 500 chars):');
    console.log(responseText.substring(0, 500));
    console.log('');

    // Verificar se é JSON
    if (!responseText.trim()) {
      console.log('❌ Resposta vazia!');
      return;
    }

    // Tentar parsear como JSON
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('✅ Resposta é JSON válido!');
      console.log('');
      console.log('📋 Estrutura da resposta:');
      console.log(JSON.stringify(result, null, 2));
      console.log('');
    } catch (parseError) {
      console.log('❌ Resposta NÃO é JSON válido!');
      console.log('Erro de parse:', parseError.message);
      console.log('');
      console.log('⚠️ PROBLEMA: O backend está retornando texto/HTML em vez de JSON!');
      console.log('Resposta completa:', responseText);
      return;
    }

    // Verificar se foi sucesso
    if (response.ok && result.success) {
      console.log('\n✅✅✅ SUCESSO! Endpoint está funcionando! ✅✅✅\n');
      console.log('📊 Detalhes:');
      console.log('- Status:', result.status);
      console.log('- Mensagem:', result.message);
      console.log('- Tem dados:', !!result.data);
      console.log('- Tem QR Code:', !!result.pixCode);
      if (result.pixCode) {
        console.log('- QR Code (primeiros 50 chars):', result.pixCode.substring(0, 50) + '...');
      }
    } else {
      console.log('\n⚠️ Resposta recebida, mas com erro:');
      console.log('- Status HTTP:', response.status);
      console.log('- Status API:', result.status);
      console.log('- Success:', result.success);
      console.log('- Mensagem:', result.message || 'N/A');
      console.log('- Erro:', result.error || 'N/A');
      
      if (result.error?.includes('API Key')) {
        console.log('\n💡 SOLUÇÃO: Configure a variável UMBRELLAPAG_API_KEY na Vercel!');
      }
    }

  } catch (error) {
    console.error('\n❌❌❌ ERRO ao testar endpoint ❌❌❌\n');
    console.error('Tipo de erro:', error.name);
    console.error('Mensagem:', error.message);
    
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Possíveis causas:');
      console.error('- Servidor local não está rodando (execute: npm run dev)');
      console.error('- URL incorreta');
      console.error('- Problema de conexão');
      console.error('\n💡 Para testar na Vercel, use:');
      console.error('TEST_URL=https://tiktokshop-orpin.vercel.app/api/create-pix-transaction node test-endpoint.js');
    }
  }
}

// Executar teste
testEndpoint();







