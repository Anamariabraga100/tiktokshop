// Script para testar o webhook manualmente
// Uso: node test-webhook.js <transactionId> [status]
// Exemplo: node test-webhook.js 13eb6cd8-5ea6-4e30-bc14-b716cc66ae53 PAID

const transactionId = process.argv[2] || '13eb6cd8-5ea6-4e30-bc14-b716cc66ae53';
const status = process.argv[3] || 'PAID';
const baseUrl = process.env.VERCEL_URL || 'https://tiktokshop-orpin.vercel.app';

const payload = {
  transactionId,
  status
};

async function testWebhook() {
  console.log('🧪 Testando webhook...');
  console.log('📍 URL:', `${baseUrl}/api/webhook-umbrellapag`);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await fetch(`${baseUrl}/api/webhook-umbrellapag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    console.log('📥 Status:', response.status);
    console.log('📥 Resposta:', JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok && data.success) {
      console.log('✅ Webhook processado com sucesso!');
      process.exit(0);
    } else {
      console.log('❌ Erro ao processar webhook');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Erro na requisição:', err.message);
    process.exit(1);
  }
}

testWebhook();

