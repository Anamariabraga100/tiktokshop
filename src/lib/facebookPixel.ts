/**
 * Facebook Pixel Tracking Utility
 * 
 * Envia eventos para o Facebook Conversions API via servidor
 * para garantir que nenhuma venda seja perdida.
 */

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook Click ID
  fbp?: string; // Facebook Browser ID
}

interface CustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  num_items?: number;
  order_id?: string;
  content_type?: string;
}

interface EventData {
  eventId?: string;
  sourceUrl?: string;
}

/**
 * Envia evento para o Facebook Conversions API via servidor
 */
export async function trackFacebookEvent(
  eventName: string,
  customData?: CustomData,
  userData?: UserData,
  eventData?: EventData
): Promise<boolean> {
  try {
    // Obter dados do navegador
    const clientUserAgent = navigator.userAgent;
    const sourceUrl = window.location.href;
    
    // Tentar obter fbp (Facebook Browser ID) do cookie
    const fbp = getCookie('_fbp') || '';
    
    // Tentar obter fbc (Facebook Click ID) do cookie ou URL
    const fbc = getCookie('_fbc') || getFbcFromUrl() || '';

    // Preparar dados do usuário
    const userDataWithDefaults: UserData = {
      ...userData,
      clientUserAgent,
      fbp,
      fbc,
    };

    // Enviar para o servidor
    const response = await fetch('/api/facebook-pixel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        eventData: {
          ...eventData,
          sourceUrl,
        },
        userData: userDataWithDefaults,
        customData: {
          currency: 'BRL',
          ...customData,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Erro ao enviar evento para Facebook Pixel:', result);
      return false;
    }

    console.log('✅ Evento enviado para Facebook Pixel:', eventName, result.eventId);
    return true;

  } catch (error) {
    console.error('❌ Erro ao rastrear evento do Facebook Pixel:', error);
    return false;
  }
}

/**
 * Eventos principais do e-commerce
 */

// PageView - Visualização de página
export function trackPageView(pageName?: string): void {
  trackFacebookEvent('PageView', {
    content_name: pageName || window.location.pathname,
    content_type: 'page',
  });
}

// ViewContent - Visualização de produto
export function trackViewContent(
  productId: string,
  productName: string,
  price: number,
  category?: string
): void {
  trackFacebookEvent('ViewContent', {
    content_name: productName,
    content_ids: [productId],
    content_category: category,
    value: price,
    currency: 'BRL',
    content_type: 'product',
  });
}

// AddToCart - Adicionar ao carrinho
export function trackAddToCart(
  productId: string,
  productName: string,
  price: number,
  quantity: number = 1,
  category?: string
): void {
  trackFacebookEvent('AddToCart', {
    content_name: productName,
    content_ids: [productId],
    content_category: category,
    value: price * quantity,
    currency: 'BRL',
    num_items: quantity,
    contents: [
      {
        id: productId,
        quantity,
        item_price: price,
      },
    ],
    content_type: 'product',
  });
}

// InitiateCheckout - Iniciar checkout
export function trackInitiateCheckout(
  value: number,
  numItems: number,
  contents: Array<{ id: string; quantity: number; item_price: number }>,
  userData?: UserData
): void {
  trackFacebookEvent('InitiateCheckout', {
    value,
    currency: 'BRL',
    num_items: numItems,
    contents,
    content_type: 'product',
  }, userData);
}

// Purchase - Compra concluída
export function trackPurchase(
  orderId: string,
  value: number,
  numItems: number,
  contents: Array<{ id: string; quantity: number; item_price: number }>,
  userData?: UserData
): void {
  trackFacebookEvent('Purchase', {
    order_id: orderId,
    value,
    currency: 'BRL',
    num_items: numItems,
    contents,
    content_type: 'product',
  }, userData);
}

// Search - Busca de produtos
export function trackSearch(searchTerm: string): void {
  trackFacebookEvent('Search', {
    content_name: searchTerm,
    content_type: 'search',
  });
}

// AddPaymentInfo - Adicionar informações de pagamento
export function trackAddPaymentInfo(
  value: number,
  currency: string = 'BRL',
  contents?: Array<{ id: string; quantity: number; item_price: number }>
): void {
  trackFacebookEvent('AddPaymentInfo', {
    value,
    currency,
    contents,
    content_type: 'product',
  });
}

/**
 * Funções auxiliares
 */

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function getFbcFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('fbclid') ? `fb.1.${Date.now()}.${urlParams.get('fbclid')}` : null;
}

/**
 * Inicializar Facebook Pixel (script básico para rastreamento no navegador também)
 */
export function initFacebookPixel(pixelId: string): void {
  if (typeof window === 'undefined' || (window as any).fbq) {
    return; // Já inicializado ou não está no navegador
  }

  // Criar script do Facebook Pixel
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // Também criar noscript para casos sem JavaScript
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);
}

