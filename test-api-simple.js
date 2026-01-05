// Script de teste para /api/test
// Execute: node test-api-simple.js

const ENDPOINT_URL = process.env.TEST_URL || 'https://tiktokshop-orpin.vercel.app/api/test';

console.log('🧪 Testando endpoint /api/test...\n');
console.log('🌐 URL:', ENDPOINT_URL);
console.log('');

async function testEndpoint() {
  try {
    console.log('📤 Enviando requisição GET...\n');
    
    const response = await fetch(ENDPOINT_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📥 Status da resposta:', response.status, response.statusText);
    console.log('📥 Content-Type:', response.headers.get('content-type'));
    console.log('');

    const responseText = await response.text();
    console.log('📥 Resposta raw:');
    console.log(responseText);
    console.log('');

    if (!responseText.trim()) {
      console.log('❌ Resposta vazia!');
      return;
    }

    try {
      const result = JSON.parse(responseText);
      console.log('✅ Resposta é JSON válido!');
      console.log('📋 Resultado:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.ok) {
        console.log('\n✅✅✅ SUCESSO! Endpoint /api/test está funcionando! ✅✅✅\n');
        console.log('💡 Isso significa:');
        console.log('  - Runtime OK');
        console.log('  - Node.js OK');
        console.log('  - Vercel OK');
        console.log('  - Estrutura de pastas OK');
        console.log('\n➡️ Próximo passo: Verificar por que /api/create-pix-transaction não funciona\n');
      }
    } catch (parseError) {
      console.log('❌ Resposta NÃO é JSON válido!');
      console.log('Erro de parse:', parseError.message);
      console.log('Resposta completa:', responseText);
    }

  } catch (error) {
    console.error('\n❌❌❌ ERRO ao testar endpoint ❌❌❌\n');
    console.error('Tipo de erro:', error.name);
    console.error('Mensagem:', error.message);
  }
}

testEndpoint();




