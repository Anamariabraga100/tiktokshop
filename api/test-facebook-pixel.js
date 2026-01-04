// Endpoint de teste para Facebook Pixel
// Rota: /api/test-facebook-pixel
// Permite testar eventos sem fazer compra real

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Apenas POST
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Apenas requisições POST são permitidas'
      });
    }

    // Verificar configurações
    const PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || process.env.VITE_FACEBOOK_PIXEL_ID;
    const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'Facebook Pixel não configurado'
      });
    }

    // Receber tipo de evento de teste
    const { eventType = 'Purchase' } = req.body;

    // Dados de teste simulados
    const testData = {
      Purchase: {
        eventName: 'Purchase',
        customData: {
          currency: 'BRL',
          value: 99.90,
          order_id: `TEST-${Date.now()}`,
          num_items: 2,
          contents: [
            { id: 'test-product-1', quantity: 1, item_price: 49.90 },
            { id: 'test-product-2', quantity: 1, item_price: 50.00 }
          ],
          content_type: 'product'
        },
        userData: {
          email: 'test@example.com',
          phone: '11999999999',
          firstName: 'Teste',
          lastName: 'Usuario',
          externalId: '12345678900'
        }
      },
      AddToCart: {
        eventName: 'AddToCart',
        customData: {
          currency: 'BRL',
          value: 49.90,
          content_ids: ['test-product-1'],
          content_name: 'Produto de Teste',
          num_items: 1,
          contents: [
            { id: 'test-product-1', quantity: 1, item_price: 49.90 }
          ],
          content_type: 'product'
        }
      },
      InitiateCheckout: {
        eventName: 'InitiateCheckout',
        customData: {
          currency: 'BRL',
          value: 99.90,
          num_items: 2,
          contents: [
            { id: 'test-product-1', quantity: 1, item_price: 49.90 },
            { id: 'test-product-2', quantity: 1, item_price: 50.00 }
          ],
          content_type: 'product'
        }
      }
    };

    const eventData = testData[eventType] || testData.Purchase;

    // Enviar para o endpoint real do Facebook Pixel
    const response = await fetch(`${req.headers.origin || 'https://' + req.headers.host}/api/facebook-pixel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();

    return res.status(response.status).json({
      success: result.success,
      message: `Evento de teste ${eventType} enviado`,
      eventId: result.eventId,
      details: result
    });

  } catch (error) {
    console.error('❌ Erro ao testar Facebook Pixel:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar teste'
    });
  }
}


