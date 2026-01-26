// Script de teste para verificar conexão com API UmbrellaPag
// Execute: node test-umbrellapag.js

const API_KEY = process.env.UMBRELLAPAG_API_KEY || process.env.VITE_UMBRELLAPAG_API_KEY || '044d7262-218b-4a1b-a8ca-e9c8685ee0b7';
const API_URL = 'https://api.umbrellapag.com/api/user/transactions';

console.log('🧪 Testando conexão com API UmbrellaPag...\n');
console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NÃO CONFIGURADA');
console.log('🌐 URL:', API_URL);
console.log('');

// Dados de teste (transação mínima)
const testPayload = {
  amount: 100, // R$ 1,00 em centavos
  currency: 'BRL',
  paymentMethod: 'PIX',
  installments: 1,
  postbackUrl: 'https://tiktokshop-orpin.vercel.app/api/webhook-umbrellapag',
  metadata: JSON.stringify({ test: true }),
  traceable: true,
  ip: '127.0.0.1',
  customer: {
    name: 'Teste API',
    email: 'teste@exemplo.com',
    document: {
      number: '12345678900',
      type: 'CPF'
    },
    phone: '11999999999',
    address: {
      street: 'Rua Teste',
      streetNumber: '123',
      complement: '',
      zipCode: '01234567',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      country: 'BR'
    }
  },
  items: [
    {
      title: 'Produto Teste',
      unitPrice: 100,
      quantity: 1,
      tangible: true
    }
  ],
  pix: {
    expiresInDays: 1
  }
};

async function testUmbrellaPagAPI() {
  try {
    console.log('📤 Enviando requisição de teste...\n');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('📥 Status da resposta:', response.status, response.statusText);
    console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    // Obter resposta como texto primeiro
    const responseText = await response.text();
    console.log('📥 Resposta raw (primeiros 500 chars):');
    console.log(responseText.substring(0, 500));
    console.log('');

    // Tentar parsear como JSON
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('✅ Resposta é JSON válido!');
      console.log('📋 Estrutura da resposta:');
      console.log(JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('❌ Resposta NÃO é JSON válido!');
      console.log('Erro de parse:', parseError.message);
      console.log('Resposta completa:', responseText);
      return;
    }

    // Verificar se foi sucesso
    if (response.ok && result.status === 200) {
      console.log('\n✅✅✅ SUCESSO! API UmbrellaPag está funcionando! ✅✅✅\n');
      console.log('📊 Detalhes da transação:');
      console.log('- ID:', result.data?.id || 'N/A');
      console.log('- Status:', result.data?.status || 'N/A');
      console.log('- Tem QR Code:', !!(result.data?.pix?.qrCode || result.data?.qrCode));
      if (result.data?.pix?.qrCode) {
        console.log('- QR Code (primeiros 50 chars):', result.data.pix.qrCode.substring(0, 50) + '...');
      }
    } else {
      console.log('\n⚠️ Resposta recebida, mas com status de erro:');
      console.log('- Status HTTP:', response.status);
      console.log('- Status API:', result.status);
      console.log('- Mensagem:', result.message || result.error || 'N/A');
    }

  } catch (error) {
    console.error('\n❌❌❌ ERRO ao testar API UmbrellaPag ❌❌❌\n');
    console.error('Tipo de erro:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('fetch')) {
      console.error('\n💡 Possíveis causas:');
      console.error('- Problema de conexão com a internet');
      console.error('- API Key inválida');
      console.error('- URL da API incorreta');
    }
  }
}

// Executar teste
testUmbrellaPagAPI();








