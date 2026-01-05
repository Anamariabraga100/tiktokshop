// Vercel Serverless Function para enviar eventos para Facebook Conversions API
// Rota: /api/facebook-pixel
// ESM PURO - package.json tem "type": "module"

import { createHash } from 'crypto';

/**
 * Faz hash SHA256 de dados PII (obrigatório pelo Facebook)
 */
function hashSHA256(value) {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase().trim();
  if (!normalized) return undefined;
  return createHash('sha256').update(normalized).digest('hex');
}

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

    console.log('📤 [SERVER-SIDE] Enviando evento para Facebook Conversions API:', {
      eventName,
      orderId,
      eventId: orderId, // ✅ event_id = orderId (deduplicação)
      value,
      currency,
      hasUserData: !!userData,
      fbc: fbc || 'não fornecido',
      fbp: fbp || 'não fornecido',
      contentsCount: contents?.length || 0,
      endpoint: `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`
    });

    // Preparar payload para Facebook Conversions API
    // ✅ Usar orderId como event_id (deduplicação automática do Facebook)
    const eventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: orderId, // ✅ Usar apenas orderId (sem timestamp) para deduplicação correta
      action_source: 'website',
      user_data: {},
      custom_data: {}
    };

    // ✅ fbc e fbp serão adicionados DENTRO de user_data (não no root do evento)
    // event_source_url pode ser útil para rastreamento, mas não é obrigatório
    if (fbc) {
      eventData.event_source_url = req.headers.referer || req.headers.origin;
    }

    // Adicionar user_data (OBRIGATÓRIO: fazer hash SHA256 de todos os dados PII)
    if (userData.email) {
      const emailHash = hashSHA256(userData.email);
      if (emailHash) eventData.user_data.em = emailHash;
    }
    if (userData.phone) {
      const phone = userData.phone.replace(/\D/g, '');
      if (phone.length >= 10) {
        const phoneHash = hashSHA256(phone);
        if (phoneHash) eventData.user_data.ph = phoneHash;
      }
    }
    if (userData.firstName) {
      const fnHash = hashSHA256(userData.firstName);
      if (fnHash) eventData.user_data.fn = fnHash;
    }
    if (userData.lastName) {
      const lnHash = hashSHA256(userData.lastName);
      if (lnHash) eventData.user_data.ln = lnHash;
    }
    if (userData.externalId) {
      const externalIdHash = hashSHA256(userData.externalId);
      if (externalIdHash) eventData.user_data.external_id = externalIdHash;
    }
    if (userData.address) {
      if (userData.address.cidade) {
        const ctHash = hashSHA256(userData.address.cidade);
        if (ctHash) eventData.user_data.ct = ctHash;
      }
      if (userData.address.estado) {
        const stHash = hashSHA256(userData.address.estado);
        if (stHash) eventData.user_data.st = stHash;
      }
      if (userData.address.cep) {
        const cep = userData.address.cep.replace(/\D/g, '');
        const zpHash = hashSHA256(cep);
        if (zpHash) eventData.user_data.zp = zpHash;
      }
      // country não precisa de hash (não é PII)
      if (userData.address.country) eventData.user_data.country = userData.address.country;
    }

    // ✅ Adicionar fbc e fbp DENTRO de user_data (OBRIGATÓRIO pelo Facebook)
    // ❌ NUNCA fora de user_data, NUNCA no root do evento, NUNCA em custom_data
    if (fbc && fbc.trim() !== '') {
      eventData.user_data.fbc = fbc;
      console.log('✅ fbc adicionado em user_data:', fbc);
    } else {
      console.warn('⚠️ fbc não fornecido ou vazio');
    }
    
    if (fbp && fbp.trim() !== '') {
      eventData.user_data.fbp = fbp;
      console.log('✅ fbp adicionado em user_data:', fbp);
    } else {
      console.warn('⚠️ fbp não fornecido ou vazio');
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
    // ✅ Validar e formatar contents corretamente (Facebook exige formato específico)
    if (contents && Array.isArray(contents) && contents.length > 0) {
      // Filtrar e validar cada item (deve ter id, quantity e item_price)
      const validContents = contents
        .filter(c => c && c.id && typeof c.quantity !== 'undefined' && typeof c.item_price !== 'undefined')
        .map(c => ({
          id: String(c.id), // Garantir que é string
          quantity: Number(c.quantity) || 1, // Garantir que é número
          item_price: Number(c.item_price) || 0 // Garantir que é número
        }));
      
      if (validContents.length > 0) {
        eventData.custom_data.contents = validContents;
        eventData.custom_data.content_ids = validContents.map(c => c.id);
      } else {
        console.warn('⚠️ Contents inválido ou vazio após validação');
      }
    } else {
      console.warn('⚠️ Contents não fornecido ou vazio');
    }
    if (orderId) {
      eventData.custom_data.order_id = orderId;
    }

    // ✅ fbc e fbp já foram adicionados DENTRO de user_data (não aqui)

    // Enviar para Facebook Conversions API
    const conversionsApiUrl = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;
    
    const payload = {
      data: [eventData],
      access_token: ACCESS_TOKEN
    };

    // ✅ Log de validação do user_data antes do POST
    console.log('📦 [SERVER-SIDE] user_data enviado ao Facebook:', {
      hasEmail: !!eventData.user_data.em,
      hasPhone: !!eventData.user_data.ph,
      hasFirstName: !!eventData.user_data.fn,
      hasLastName: !!eventData.user_data.ln,
      hasExternalId: !!eventData.user_data.external_id,
      fbc: eventData.user_data.fbc || 'não fornecido',
      fbp: eventData.user_data.fbp || 'não fornecido',
      totalFields: Object.keys(eventData.user_data).length
    });

    console.log('📤 [SERVER-SIDE] Payload para Facebook CAPI:', {
      pixelId: PIXEL_ID,
      eventName: eventData.event_name,
      eventId: eventData.event_id, // ✅ orderId como event_id
      eventTime: eventData.event_time,
      currency: eventData.custom_data.currency,
      value: eventData.custom_data.value,
      hasUserData: Object.keys(eventData.user_data).length > 0,
      hasCustomData: Object.keys(eventData.custom_data).length > 0,
      contentsCount: eventData.custom_data.contents?.length || 0,
      contents: eventData.custom_data.contents || [],
      // ✅ fbc/fbp estão DENTRO de user_data (não no root)
      fbcInUserData: eventData.user_data.fbc || 'não fornecido',
      fbpInUserData: eventData.user_data.fbp || 'não fornecido',
      endpoint: conversionsApiUrl
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

    console.log('✅✅✅ [SERVER-SIDE] Evento Purchase enviado com sucesso para Facebook CAPI:', {
      orderId,
      eventId: result.events_received?.[0]?.event_id,
      eventsReceived: result.events_received?.length || 0,
      messages: result.messages || [],
      endpoint: conversionsApiUrl
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
