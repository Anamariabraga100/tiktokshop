// Vercel Serverless Function para enviar eventos ao Facebook Conversions API
// Rota: /api/facebook-pixel
// ESM PURO - package.json tem "type": "module"
//
// ⚠️ IMPORTANTE: Usa token de acesso do servidor para não perder nenhuma venda

const FACEBOOK_API_VERSION = 'v21.0';
const FACEBOOK_API_BASE = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

// Função para gerar hash SHA256 (requerido pelo Facebook para dados sensíveis)
import { createHash } from 'crypto';

function sha256Hash(text) {
  return createHash('sha256').update(text).digest('hex');
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

    // Verificar configurações (aceitar ambos os nomes para compatibilidade)
    const PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || process.env.VITE_FACEBOOK_PIXEL_ID;
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
    const testEventCode = process.env.FACEBOOK_TEST_EVENT_CODE;
    
    // Construir user_data com TODOS os dados disponíveis (com hash SHA256 quando aplicável)
    const userDataForFacebook = {};
    
    // Email (em) - hash SHA256 obrigatório
    if (userData?.email) {
      const email = userData.email.toLowerCase().trim();
      if (email) {
        userDataForFacebook.em = sha256Hash(email);
      }
    }
    
    // Telefone (ph) - hash SHA256 obrigatório, apenas números com código do país
    if (userData?.phone) {
      let phone = userData.phone.replace(/\D/g, ''); // Remove tudo que não é número
      // Adicionar código do país (55 para Brasil) se não tiver
      if (phone.length >= 10 && phone.length <= 11 && !phone.startsWith('55')) {
        phone = '55' + phone;
      }
      if (phone && phone.length >= 12) { // Mínimo: código país (2) + DDD (2) + número (8+)
        userDataForFacebook.ph = sha256Hash(phone);
      }
    }
    
    // Nome (fn) - hash SHA256 obrigatório
    if (userData?.firstName) {
      const firstName = userData.firstName.toLowerCase().trim();
      if (firstName) {
        userDataForFacebook.fn = sha256Hash(firstName);
      }
    }
    
    // Sobrenome (ln) - hash SHA256 obrigatório
    if (userData?.lastName) {
      const lastName = userData.lastName.toLowerCase().trim();
      if (lastName) {
        userDataForFacebook.ln = sha256Hash(lastName);
      }
    }
    
    // Se tiver nome completo mas não firstName/lastName, tentar dividir
    if (!userDataForFacebook.fn && !userDataForFacebook.ln && userData?.name) {
      const nameParts = userData.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        const firstName = nameParts[0].toLowerCase().trim();
        const lastName = nameParts.slice(1).join(' ').toLowerCase().trim();
        if (firstName) userDataForFacebook.fn = sha256Hash(firstName);
        if (lastName) userDataForFacebook.ln = sha256Hash(lastName);
      } else if (nameParts.length === 1) {
        // Apenas um nome, usar como firstName
        const firstName = nameParts[0].toLowerCase().trim();
        if (firstName) userDataForFacebook.fn = sha256Hash(firstName);
      }
    }
    
    // Endereço - hash SHA256 obrigatório
    if (userData?.address) {
      const addr = userData.address;
      
      // Cidade (ct)
      if (addr.city || addr.cidade) {
        const city = (addr.city || addr.cidade).toLowerCase().trim();
        if (city) {
          userDataForFacebook.ct = sha256Hash(city);
        }
      }
      
      // Estado (st)
      if (addr.state || addr.estado) {
        const state = (addr.state || addr.estado).toLowerCase().trim();
        if (state) {
          userDataForFacebook.st = sha256Hash(state);
        }
      }
      
      // CEP (zp) - apenas números
      if (addr.zipCode || addr.cep || addr.zip) {
        const zip = (addr.zipCode || addr.cep || addr.zip).replace(/\D/g, '');
        if (zip && zip.length >= 5) {
          userDataForFacebook.zp = sha256Hash(zip);
        }
      }
      
      // País (country) - hash SHA256
      const country = (addr.country || 'br').toLowerCase().trim();
      if (country) {
        userDataForFacebook.country = sha256Hash(country);
      }
    }
    
    // ID Externo (external_id) - sem hash, é um identificador do sistema
    if (userData?.externalId) {
      userDataForFacebook.external_id = String(userData.externalId);
    }
    
    // CPF como external_id se disponível
    if (userData?.cpf && !userDataForFacebook.external_id) {
      const cpf = userData.cpf.replace(/\D/g, '');
      if (cpf && cpf.length === 11) {
        userDataForFacebook.external_id = cpf;
      }
    }
    
    // IP e User Agent são OBRIGATÓRIOS para matching do Facebook
    // Prioridade: dados do frontend > headers do servidor
    let clientIp = userData?.clientIpAddress;
    if (!clientIp) {
      // Tentar obter IP dos headers do Vercel
      if (req.headers['x-forwarded-for']) {
        clientIp = req.headers['x-forwarded-for'].split(',')[0].trim();
      } else if (req.headers['x-real-ip']) {
        clientIp = req.headers['x-real-ip'];
      } else if (req.headers['cf-connecting-ip']) {
        // Cloudflare
        clientIp = req.headers['cf-connecting-ip'];
      } else if (req.socket?.remoteAddress) {
        clientIp = req.socket.remoteAddress;
      }
    }
    if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1') {
      userDataForFacebook.client_ip_address = clientIp;
    }
    
    let clientUserAgent = userData?.clientUserAgent;
    if (!clientUserAgent) {
      // Tentar obter User Agent dos headers
      clientUserAgent = req.headers['user-agent'];
    }
    if (clientUserAgent) {
      userDataForFacebook.client_user_agent = clientUserAgent;
    }
    
    // FBC e FBP apenas se não estiverem vazios
    if (userData?.fbc && userData.fbc.trim()) {
      userDataForFacebook.fbc = userData.fbc.trim();
    }
    
    if (userData?.fbp && userData.fbp.trim()) {
      userDataForFacebook.fbp = userData.fbp.trim();
    }
    
    // Construir custom_data apenas com campos válidos
    const customDataForFacebook = {};
    
    if (customData?.currency) {
      customDataForFacebook.currency = customData.currency;
    }
    
    if (customData?.value !== undefined && customData.value !== null) {
      customDataForFacebook.value = Number(customData.value);
    }
    
    if (customData?.content_name) {
      customDataForFacebook.content_name = customData.content_name;
    }
    
    if (customData?.content_category) {
      customDataForFacebook.content_category = customData.content_category;
    }
    
    if (customData?.content_ids && Array.isArray(customData.content_ids) && customData.content_ids.length > 0) {
      customDataForFacebook.content_ids = customData.content_ids;
    }
    
    if (customData?.contents && Array.isArray(customData.contents) && customData.contents.length > 0) {
      customDataForFacebook.contents = customData.contents;
    }
    
    if (customData?.num_items !== undefined && customData.num_items !== null) {
      customDataForFacebook.num_items = Number(customData.num_items);
    }
    
    if (customData?.order_id) {
      customDataForFacebook.order_id = customData.order_id;
    }
    
    if (customData?.content_type) {
      customDataForFacebook.content_type = customData.content_type;
    }
    
    // Construir evento
    const eventPayload = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000), // Unix timestamp
      event_id: eventData?.eventId || `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      action_source: 'website',
    };
    
    // ⚠️ CRÍTICO: event_source_url é OBRIGATÓRIO para atribuição de campanha
    // Sem isso, o Facebook não consegue atribuir a conversão à campanha
    const sourceUrl = eventData?.sourceUrl || req.headers.referer || req.headers.origin || 'https://' + (req.headers.host || '');
    if (sourceUrl) {
      eventPayload.event_source_url = sourceUrl;
      console.log('📎 event_source_url definido:', sourceUrl);
    } else {
      console.warn('⚠️ event_source_url não disponível - pode afetar atribuição de campanha');
    }
    
    // Adicionar test_event_code se configurado
    if (testEventCode) {
      eventPayload.test_event_code = testEventCode;
    }
    
    // Adicionar user_data - OBRIGATÓRIO para o Facebook
    // O Facebook exige pelo menos client_ip_address E client_user_agent
    // Se não tivermos pelo menos esses dois, não podemos enviar o evento
    if (Object.keys(userDataForFacebook).length === 0) {
      // Última tentativa: obter dos headers do servidor
      let fallbackIp = null;
      if (req.headers['x-forwarded-for']) {
        fallbackIp = req.headers['x-forwarded-for'].split(',')[0].trim();
      } else if (req.headers['x-real-ip']) {
        fallbackIp = req.headers['x-real-ip'];
      } else if (req.headers['cf-connecting-ip']) {
        fallbackIp = req.headers['cf-connecting-ip'];
      }
      
      const fallbackUserAgent = req.headers['user-agent'];
      
      if (fallbackIp && fallbackIp !== '::1' && fallbackIp !== '127.0.0.1') {
        userDataForFacebook.client_ip_address = fallbackIp;
      }
      
      if (fallbackUserAgent) {
        userDataForFacebook.client_user_agent = fallbackUserAgent;
      }
    }
    
    // Validar que temos pelo menos IP e User Agent antes de enviar
    if (!userDataForFacebook.client_ip_address || !userDataForFacebook.client_user_agent) {
      console.error('❌ Dados insuficientes para Facebook Pixel:', {
        hasIp: !!userDataForFacebook.client_ip_address,
        hasUserAgent: !!userDataForFacebook.client_user_agent,
        headers: {
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip'],
          'user-agent': req.headers['user-agent'] ? 'presente' : 'ausente'
        }
      });
      return res.status(400).json({
        success: false,
        error: 'Dados insuficientes do cliente. IP e User Agent são obrigatórios.',
        details: {
          hasIp: !!userDataForFacebook.client_ip_address,
          hasUserAgent: !!userDataForFacebook.client_user_agent
        }
      });
    }
    
    // Sempre incluir user_data se tiver pelo menos IP e User Agent
    eventPayload.user_data = userDataForFacebook;
    
    // Adicionar custom_data apenas se tiver pelo menos um campo
    if (Object.keys(customDataForFacebook).length > 0) {
      eventPayload.custom_data = customDataForFacebook;
    }
    
    const eventDataForFacebook = {
      data: [eventPayload],
      access_token: ACCESS_TOKEN
    };
    
    // Log para debug (sem dados sensíveis, apenas indicadores)
    console.log('📤 Enviando evento para Facebook com dados completos:', {
      eventName,
      eventId: eventPayload.event_id,
      hasUserData: !!eventPayload.user_data,
      userDataFields: eventPayload.user_data ? Object.keys(eventPayload.user_data) : [],
      hasEmail: !!eventPayload.user_data?.em,
      hasPhone: !!eventPayload.user_data?.ph,
      hasFirstName: !!eventPayload.user_data?.fn,
      hasLastName: !!eventPayload.user_data?.ln,
      hasAddress: !!(eventPayload.user_data?.ct || eventPayload.user_data?.st || eventPayload.user_data?.zp),
      hasExternalId: !!eventPayload.user_data?.external_id,
      hasFbc: !!eventPayload.user_data?.fbc,
      hasFbp: !!eventPayload.user_data?.fbp,
      hasIp: !!eventPayload.user_data?.client_ip_address,
      hasUserAgent: !!eventPayload.user_data?.client_user_agent,
      hasCustomData: !!eventPayload.custom_data,
      customDataKeys: eventPayload.custom_data ? Object.keys(eventPayload.custom_data) : [],
    });

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
      eventId: eventPayload.event_id,
      pixelId: PIXEL_ID,
      events_received: result.events_received || 1
    });

    return res.status(200).json({
      success: true,
      eventId: eventPayload.event_id,
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

