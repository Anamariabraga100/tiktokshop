// Vercel Serverless Function para enviar eventos ao Facebook Conversions API
// Rota: /api/facebook-pixel
// ESM PURO - package.json tem "type": "module"
//
// ⚠️ IMPORTANTE: Usa token de acesso do servidor para não perder nenhuma venda

const FACEBOOK_API_VERSION = 'v21.0';
const FACEBOOK_API_BASE = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

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
    const PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;
    const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error('Facebook Pixel não configurado:', {
        hasPixelId: !!PIXEL_ID,
        hasAccessToken: !!ACCESS_TOKEN
      });
      return res.status(500).json({
        success: false,
        error: 'Facebook Pixel não configurado. Verifique as variáveis de ambiente.'
      });
    }

    // Receber dados do frontend
    const { eventName, eventData, userData, customData } = req.body;

    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'eventName é obrigatório'
      });
    }

    // Preparar dados do evento para Facebook Conversions API
    const eventDataForFacebook = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000), // Unix timestamp
          event_id: eventData?.eventId || `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          event_source_url: eventData?.sourceUrl || req.headers.referer || '',
          action_source: 'website',
          user_data: {
            ...(userData?.email && { 
              em: userData.email.toLowerCase().trim() // Hash será feito pelo Facebook
            }),
            ...(userData?.phone && { 
              ph: userData.phone.replace(/\D/g, '') // Apenas números
            }),
            ...(userData?.firstName && { 
              fn: userData.firstName.toLowerCase().trim()
            }),
            ...(userData?.lastName && { 
              ln: userData.lastName.toLowerCase().trim()
            }),
            ...(userData?.externalId && { 
              external_id: userData.externalId
            }),
            ...(userData?.clientIpAddress && { 
              client_ip_address: userData.clientIpAddress
            }),
            ...(userData?.clientUserAgent && { 
              client_user_agent: userData.clientUserAgent
            }),
            fbc: userData?.fbc || '', // Facebook Click ID
            fbp: userData?.fbp || '', // Facebook Browser ID
          },
          custom_data: {
            ...(customData?.currency && { currency: customData.currency }),
            ...(customData?.value && { value: customData.value }),
            ...(customData?.content_name && { content_name: customData.content_name }),
            ...(customData?.content_category && { content_category: customData.content_category }),
            ...(customData?.content_ids && { content_ids: customData.content_ids }),
            ...(customData?.contents && { contents: customData.contents }),
            ...(customData?.num_items && { num_items: customData.num_items }),
            ...(customData?.order_id && { order_id: customData.order_id }),
            ...(customData?.content_type && { content_type: customData.content_type }),
          },
        }
      ],
      access_token: ACCESS_TOKEN
    };

    // Enviar evento para Facebook Conversions API
    const response = await fetch(
      `${FACEBOOK_API_BASE}/${PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventDataForFacebook),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Erro ao enviar evento para Facebook:', {
        status: response.status,
        statusText: response.statusText,
        result
      });
      return res.status(response.status).json({
        success: false,
        error: result.error?.message || 'Erro ao enviar evento para Facebook',
        details: result
      });
    }

    console.log('✅ Evento enviado para Facebook Pixel:', {
      eventName,
      eventId: eventDataForFacebook.data[0].event_id,
      pixelId: PIXEL_ID
    });

    return res.status(200).json({
      success: true,
      eventId: eventDataForFacebook.data[0].event_id,
      events_received: result.events_received || 1
    });

  } catch (error) {
    console.error('❌ Erro ao processar evento do Facebook Pixel:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao processar evento'
    });
  }
}

