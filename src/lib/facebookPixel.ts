// Facebook Pixel Tracking Functions

declare global {
  interface Window {
    fbq?: (command: string, eventName: string, params?: any) => void;
    _fbp?: string;
  }
}

/**
 * Obtém o Facebook Browser ID (fbp) - cookie do navegador
 */
const getFbp = (): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  
  // Tentar obter do cookie _fbp
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbp') {
      return value;
    }
  }
  
  // Tentar obter do window._fbp (se disponível)
  if (window._fbp) {
    return window._fbp;
  }
  
  return undefined;
};

/**
 * Obtém o Facebook Click ID (fbc) - parâmetro de URL do anúncio
 */
const getFbc = (): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  
  // Verificar se está na URL atual
  const urlParams = new URLSearchParams(window.location.search);
  const fbc = urlParams.get('fbclid');
  if (fbc) {
    // Formato: fb.1.{timestamp}.{click_id}
    const timestamp = Date.now();
    return `fb.1.${timestamp}.${fbc}`;
  }
  
  // Verificar no localStorage (salvo quando usuário clica no anúncio)
  try {
    const savedFbc = localStorage.getItem('_fbc');
    if (savedFbc) {
      return savedFbc;
    }
  } catch (e) {
    // Ignorar erro
  }
  
  return undefined;
};

/**
 * Salva fbc quando detectado na URL (quando usuário clica no anúncio)
 */
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    try {
      const timestamp = Date.now();
      const fbc = `fb.1.${timestamp}.${fbclid}`;
      localStorage.setItem('_fbc', fbc);
    } catch (e) {
      // Ignorar erro se localStorage não estiver disponível
    }
  }
}

/**
 * Inicializa o Facebook Pixel
 */
export const initFacebookPixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;

  // Verificar se já foi inicializado
  if (window.fbq) {
    console.log('Facebook Pixel já inicializado');
    return;
  }

  // Carregar script do Facebook Pixel
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  // Inicializar pixel
  window.fbq?.('init', pixelId);
  window.fbq?.('track', 'PageView');
};

/**
 * Rastreia visualização de página
 */
export const trackPageView = () => {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
};

/**
 * Rastreia visualização de conteúdo (produto)
 */
export const trackViewContent = (
  productId: string,
  productName: string,
  price: number,
  category?: string
) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  const params: any = {
    content_name: productName,
    content_ids: [productId],
    content_type: 'product',
    value: price,
    currency: 'BRL',
    content_category: category,
  };
  
  // Adicionar fbc e fbp
  const fbc = getFbc();
  const fbp = getFbp();
  if (fbc) params.fbc = fbc;
  if (fbp) params.fbp = fbp;
  
  window.fbq('track', 'ViewContent', params);
};

/**
 * Rastreia adicionar ao carrinho
 */
export const trackAddToCart = (
  productId: string,
  productName: string,
  price: number,
  quantity: number,
  category?: string
) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  const params: any = {
    content_name: productName,
    content_ids: [productId],
    content_type: 'product',
    value: price * quantity,
    currency: 'BRL',
    content_category: category,
    num_items: quantity,
  };
  
  // Adicionar fbc e fbp
  const fbc = getFbc();
  const fbp = getFbp();
  if (fbc) params.fbc = fbc;
  if (fbp) params.fbp = fbp;
  
  window.fbq('track', 'AddToCart', params);
};

/**
 * Rastreia início de checkout
 */
export const trackInitiateCheckout = (
  value: number,
  numItems: number,
  contents: Array<{ id: string; quantity: number; item_price: number }>,
  userData?: {
    email?: string;
    phone?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    cpf?: string;
    externalId?: string;
    address?: {
      cidade?: string;
      estado?: string;
      cep?: string;
      country?: string;
    };
  }
) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  const params: any = {
    value: value,
    currency: 'BRL',
    num_items: numItems,
    contents: contents,
  };

  // Adicionar fbc e fbp para melhor correspondência
  const fbc = getFbc();
  const fbp = getFbp();
  if (fbc) params.fbc = fbc;
  if (fbp) params.fbp = fbp;

  if (userData) {
    params.user_data = {};
    if (userData.email) params.user_data.em = userData.email;
    if (userData.phone) params.user_data.ph = userData.phone.replace(/\D/g, '');
    if (userData.firstName) params.user_data.fn = userData.firstName;
    if (userData.lastName) params.user_data.ln = userData.lastName;
    if (userData.externalId) params.user_data.external_id = userData.externalId;
    
    // Adicionar endereço completo
    if (userData.address) {
      if (userData.address.cep) params.user_data.ct = userData.address.cidade;
      if (userData.address.estado) params.user_data.st = userData.address.estado;
      if (userData.address.cep) params.user_data.zp = userData.address.cep.replace(/\D/g, '');
      if (userData.address.country) params.user_data.country = userData.address.country;
    }
  }

  window.fbq('track', 'InitiateCheckout', params);
};

/**
 * Rastreia compra concluída
 */
export const trackPurchase = (
  orderId: string,
  value: number,
  numItems: number,
  contents: Array<{ id: string; quantity: number; item_price: number }>,
  userData?: {
    email?: string;
    phone?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    cpf?: string;
    externalId?: string;
    address?: {
      cidade?: string;
      estado?: string;
      cep?: string;
      country?: string;
    };
  }
) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  const params: any = {
    value: value,
    currency: 'BRL',
    num_items: numItems,
    contents: contents,
    order_id: orderId,
  };

  // Adicionar fbc e fbp para melhor correspondência (CRÍTICO para atribuição correta)
  const fbc = getFbc();
  const fbp = getFbp();
  if (fbc) {
    params.fbc = fbc;
    console.log('✅ fbc incluído no Purchase:', fbc);
  } else {
    console.warn('⚠️ fbc não encontrado - pode afetar atribuição de campanha');
  }
  if (fbp) {
    params.fbp = fbp;
    console.log('✅ fbp incluído no Purchase:', fbp);
  } else {
    console.warn('⚠️ fbp não encontrado - pode afetar atribuição de campanha');
  }

  if (userData) {
    params.user_data = {};
    if (userData.email) params.user_data.em = userData.email;
    if (userData.phone) {
      const phone = userData.phone.replace(/\D/g, '');
      params.user_data.ph = phone;
      console.log('✅ Telefone incluído no Purchase');
    }
    if (userData.firstName) params.user_data.fn = userData.firstName;
    if (userData.lastName) params.user_data.ln = userData.lastName;
    if (userData.externalId) params.user_data.external_id = userData.externalId;
    
    // Adicionar endereço completo (importante para correspondência)
    if (userData.address) {
      if (userData.address.cidade) params.user_data.ct = userData.address.cidade;
      if (userData.address.estado) params.user_data.st = userData.address.estado;
      if (userData.address.cep) {
        params.user_data.zp = userData.address.cep.replace(/\D/g, '');
        console.log('✅ CEP incluído no Purchase');
      }
      if (userData.address.country) params.user_data.country = userData.address.country;
    }
  }

  console.log('📊 Enviando Purchase com parâmetros completos:', {
    orderId,
    value,
    numItems,
    hasFbc: !!fbc,
    hasFbp: !!fbp,
    hasPhone: !!(userData?.phone),
    hasAddress: !!(userData?.address),
  });

  window.fbq('track', 'Purchase', params);
  
  console.log('✅✅✅ Purchase enviado com fbc/fbp para melhor atribuição de campanha');
};

/**
 * Rastreia evento personalizado PIX gerado
 */
export const trackPixGerado = (value: number, transactionId?: string) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  const params: any = {
    value: value,
    currency: 'BRL',
    transaction_id: transactionId,
  };
  
  // Adicionar fbc e fbp
  const fbc = getFbc();
  const fbp = getFbp();
  if (fbc) params.fbc = fbc;
  if (fbp) params.fbp = fbp;
  
  window.fbq('trackCustom', 'pix_gerado', params);
};

/**
 * Rastreia evento personalizado PIX copiado
 */
export const trackPixCopiado = (value: number, transactionId?: string) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  const params: any = {
    value: value,
    currency: 'BRL',
    transaction_id: transactionId,
  };
  
  // Adicionar fbc e fbp
  const fbc = getFbc();
  const fbp = getFbp();
  if (fbc) params.fbc = fbc;
  if (fbp) params.fbp = fbp;
  
  window.fbq('trackCustom', 'pix_copiado', params);
};

/**
 * Rastreia evento personalizado PIX pago
 */
export const trackPixPago = (
  value: number, 
  transactionId?: string, 
  orderId?: string,
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    externalId?: string;
    address?: {
      cidade?: string;
      estado?: string;
      cep?: string;
      country?: string;
    };
  }
) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  const params: any = {
    value: value,
    currency: 'BRL',
    transaction_id: transactionId,
    order_id: orderId,
  };
  
  // Adicionar fbc e fbp (CRÍTICO para atribuição)
  const fbc = getFbc();
  const fbp = getFbp();
  if (fbc) {
    params.fbc = fbc;
    console.log('✅ fbc incluído no pix_pago:', fbc);
  }
  if (fbp) {
    params.fbp = fbp;
    console.log('✅ fbp incluído no pix_pago:', fbp);
  }
  
  // Adicionar user_data se disponível
  if (userData) {
    params.user_data = {};
    if (userData.email) params.user_data.em = userData.email;
    if (userData.phone) {
      params.user_data.ph = userData.phone.replace(/\D/g, '');
      console.log('✅ Telefone incluído no pix_pago');
    }
    if (userData.firstName) params.user_data.fn = userData.firstName;
    if (userData.lastName) params.user_data.ln = userData.lastName;
    if (userData.externalId) params.user_data.external_id = userData.externalId;
    
    if (userData.address) {
      if (userData.address.cidade) params.user_data.ct = userData.address.cidade;
      if (userData.address.estado) params.user_data.st = userData.address.estado;
      if (userData.address.cep) {
        params.user_data.zp = userData.address.cep.replace(/\D/g, '');
        console.log('✅ CEP incluído no pix_pago');
      }
      if (userData.address.country) params.user_data.country = userData.address.country;
    }
  }
  
  window.fbq('trackCustom', 'pix_pago', params);
  console.log('✅ pix_pago enviado com fbc/fbp para melhor atribuição');
};
