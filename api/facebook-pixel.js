// Vercel Serverless Function para enviar eventos para Facebook Conversions API
// Rota: /api/facebook-pixel
// ESM PURO - package.json tem "type": "module"

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
      console.error('❌ Facebook Pixel não configurado:', {
        hasPixelId: !!PIXEL_ID,
        hasAccessToken: !!ACCESS_TOKEN
      });
      return res.status(500).json({
        success: false,
        error: 'Facebook Pixel não configurado. Configure FACEBOOK_PIXEL_ID e FACEBOOK_ACCESS_TOKEN.'
      });
    }

    // Receber dados do evento
    const {
      eventType = 'Purchase',
      eventName = 'Purchase',
      orderId,
      value,
      currency = 'BRL',
      numItems,
      contents = [],
      userData = {},
      fbc,
      fbp
    } = req.body;

    console.log('📤 Enviando evento para Facebook Conversions API:', {
      eventName,
      orderId,
      value,
      hasUserData: !!userData,
      hasFbc: !!fbc,
      hasFbp: !!fbp
    });

    // Preparar payload para Facebook Conversions API
    const eventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: orderId ? `${orderId}-${Date.now()}` : undefined,
      action_source: 'website',
      user_data: {},
      custom_data: {}
    };

    // Adicionar fbc e fbp se disponíveis
    if (fbc) {
      eventData.event_source_url = req.headers.referer || req.headers.origin;
      // fbc será adicionado via user_data se necessário
    }
    if (fbp) {
      // fbp será adicionado via user_data
    }

    // Adicionar user_data
    if (userData.email) {
      eventData.user_data.em = userData.email.toLowerCase().trim();
    }
    if (userData.phone) {
      const phone = userData.phone.replace(/\D/g, '');
      if (phone.length >= 10) {
        eventData.user_data.ph = phone;
      }
    }
    if (userData.firstName) {
      eventData.user_data.fn = userData.firstName.trim();
    }
    if (userData.lastName) {
      eventData.user_data.ln = userData.lastName.trim();
    }
    if (userData.externalId) {
      eventData.user_data.external_id = userData.externalId;
    }
    if (userData.address) {
      if (userData.address.cidade) eventData.user_data.ct = userData.address.cidade;
      if (userData.address.estado) eventData.user_data.st = userData.address.estado;
      if (userData.address.cep) {
        eventData.user_data.zp = userData.address.cep.replace(/\D/g, '');
      }
      if (userData.address.country) eventData.user_data.country = userData.address.country;
    }

    // Adicionar custom_data
    if (value !== undefined) {
      eventData.custom_data.value = value;
    }
    if (currency) {
      eventData.custom_data.currency = currency;
    }
    if (numItems !== undefined) {
      eventData.custom_data.num_items = numItems;
    }
    if (contents && contents.length > 0) {
      eventData.custom_data.contents = contents;
      eventData.custom_data.content_ids = contents.map(c => c.id);
    }
    if (orderId) {
      eventData.custom_data.order_id = orderId;
    }

    // Adicionar fbc e fbp diretamente no payload (formato correto para Conversions API)
    if (fbc) {
      eventData.fbc = fbc;
    }
    if (fbp) {
      eventData.fbp = fbp;
    }

    // Enviar para Facebook Conversions API
    const conversionsApiUrl = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;
    
    const payload = {
      data: [eventData],
      access_token: ACCESS_TOKEN
    };

    console.log('📤 Payload para Facebook:', {
      pixelId: PIXEL_ID,
      eventName: eventData.event_name,
      hasUserData: Object.keys(eventData.user_data).length > 0,
      hasCustomData: Object.keys(eventData.custom_data).length > 0,
      hasFbc: !!fbc,
      hasFbp: !!fbp
    });

    const response = await fetch(conversionsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao enviar para Facebook Conversions API:', result);
      return res.status(response.status).json({
        success: false,
        error: result.error?.message || 'Erro ao enviar evento para Facebook',
        details: result
      });
    }

    console.log('✅ Evento enviado com sucesso para Facebook Conversions API:', {
      eventId: result.events_received?.[0]?.event_id,
      orderId
    });

    return res.status(200).json({
      success: true,
      eventId: result.events_received?.[0]?.event_id,
      orderId,
      message: `Evento ${eventName} enviado com sucesso`
    });

  } catch (err) {
    console.error('❌ Erro no endpoint Facebook Pixel:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido ao enviar evento para Facebook'
    });
  }
}
