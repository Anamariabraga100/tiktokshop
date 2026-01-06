import { CustomerData } from '@/context/CustomerContext';
import { CartItem } from '@/types/product';

// Configuração da API UmbrellaPag
// Em desenvolvimento, pode usar proxy para evitar CORS
// Configure o proxy no vite.config.ts se necessário
const UMBRELLAPAG_API_URL = import.meta.env.VITE_UMBRELLAPAG_API_URL || 'https://api.umbrellapag.com';
const API_KEY = import.meta.env.VITE_UMBRELLAPAG_API_KEY || '';

// Tipos da API UmbrellaPag
export interface UmbrellaPagCustomer {
  id?: string;
  name: string;
  email: string;
  document: {
    number: string;
    type: 'CPF' | 'CNPJ';
  };
  phone?: string;
  externalRef?: string;
  address: {
    street: string;
    streetNumber: string;
    complement?: string;
    zipCode: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
  };
}

export interface UmbrellaPagItem {
  title: string;
  unitPrice: number; // em centavos
  quantity: number;
  tangible: boolean;
  externalRef?: string;
}

export interface UmbrellaPagShipping {
  fee?: number; // em centavos
  address?: {
    street: string;
    streetNumber: string;
    complement?: string;
    zipCode: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
  };
}

export interface CreateTransactionRequest {
  amount: number; // em centavos
  currency: string; // "BRL"
  paymentMethod: 'PIX' | 'credit_card' | 'boleto';
  installments: number;
  postbackUrl?: string;
  metadata?: string; // JSON string
  traceable: boolean;
  ip: string;
  customer: UmbrellaPagCustomer;
  shipping?: UmbrellaPagShipping;
  items: UmbrellaPagItem[];
  pix?: {
    expiresInDays?: number;
  };
  boleto?: {
    expiresInDays?: number;
  };
}

export interface UmbrellaPagTransaction {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  secureId?: string;
  secureUrl?: string;
  paidAt?: string;
  externalRef?: string;
  endToEndId?: string;
  qrCode?: string;
  pix?: {
    qrCode?: string;
    qrCodeImage?: string;
    expirationDate?: string;
  };
  boleto?: {
    url?: string;
    barcode?: string;
    digitableLine?: string;
    expirationDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UmbrellaPagResponse {
  status: number;
  message: string;
  data: UmbrellaPagTransaction | null;
  error: any;
}

/**
 * Converte dados do cliente para formato UmbrellaPag
 */
export const convertCustomerToUmbrellaPag = (customerData: CustomerData): UmbrellaPagCustomer | null => {
  if (!customerData.cpf || !customerData.address) {
    console.error('❌ Dados do cliente incompletos:', {
      hasCPF: !!customerData.cpf,
      hasAddress: !!customerData.address,
      customerData,
    });
    return null;
  }

  const normalizedCPF = customerData.cpf.replace(/\D/g, '');
  
  // Validar campos obrigatórios
  if (!customerData.address.rua || !customerData.address.numero || 
      !customerData.address.bairro || !customerData.address.cidade || 
      !customerData.address.estado || !customerData.address.cep) {
    console.error('❌ Endereço incompleto:', customerData.address);
    return null;
  }
  
  // Email pode ser obrigatório - usar um placeholder se não tiver
  const email = customerData.email || `cliente${normalizedCPF.substring(0, 6)}@exemplo.com`;
  
  return {
    name: customerData.name || 'Cliente',
    email: email,
    document: {
      number: normalizedCPF,
      type: 'CPF',
    },
    phone: customerData.phone?.replace(/\D/g, '') || '',
    address: {
      street: customerData.address.rua,
      streetNumber: customerData.address.numero,
      complement: customerData.address.complemento || '',
      zipCode: customerData.address.cep.replace(/\D/g, ''),
      neighborhood: customerData.address.bairro,
      city: customerData.address.cidade,
      state: customerData.address.estado,
      country: 'BR',
    },
  };
};

/**
 * Converte itens do carrinho para formato UmbrellaPag
 */
export const convertItemsToUmbrellaPag = (items: CartItem[]): UmbrellaPagItem[] => {
  // Filtrar brindes (preço = 0)
  const regularItems = items.filter(item => item.price > 0);
  
  return regularItems.map(item => ({
    title: item.name,
    unitPrice: Math.round(item.price * 100), // Converter para centavos
    quantity: item.quantity,
    tangible: true,
    externalRef: item.id,
  }));
};

/**
 * Obtém o IP do cliente (aproximado)
 */
export const getClientIP = async (): Promise<string> => {
  try {
    // Tentar obter IP via serviço externo
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || '127.0.0.1';
  } catch (error) {
    console.warn('Erro ao obter IP, usando fallback:', error);
    return '127.0.0.1';
  }
};

/**
 * Cria uma transação PIX no UmbrellaPag
 * Usa a função serverless da Vercel para evitar problemas de CORS
 */
export const createPixTransaction = async (
  customerData: CustomerData,
  items: CartItem[],
  totalPrice: number,
  metadata?: Record<string, any>
): Promise<UmbrellaPagTransaction> => {
  // Validar dados antes de enviar
  if (!customerData || !customerData.cpf || !customerData.name) {
    throw new Error('Dados do cliente incompletos. CPF e nome são obrigatórios.');
  }

  if (!items || items.length === 0) {
    throw new Error('Carrinho vazio');
  }

  if (!totalPrice || totalPrice <= 0) {
    throw new Error('Valor inválido');
  }

  // Usar a função serverless da Vercel (/api/pix)
  // Isso evita problemas de CORS e mantém a API Key segura no backend
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const endpoint = `${apiUrl}/pix`;

  // ✅ Obter fbc/fbp do localStorage (para atribuição de campanha)
  let fbc: string | undefined;
  let fbp: string | undefined;
  
  if (typeof window !== 'undefined') {
    try {
      // Buscar fbc do localStorage
      const savedFbc = localStorage.getItem('_fbc');
      if (savedFbc) {
        fbc = savedFbc;
      }
      
      // Buscar fbp do cookie ou window._fbp
      if (window._fbp) {
        fbp = window._fbp;
      }
    } catch (e) {
      // Ignorar erro
    }
  }

  // Preparar payload no formato correto que o backend espera
  const payload = {
    customer: {
      name: customerData.name || 'Cliente',
      email: customerData.email || '',
      phone: customerData.phone || '',
      cpf: customerData.cpf?.replace(/\D/g, '') || '',
      address: customerData.address,
    },
    items: items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    totalPrice: totalPrice,
    metadata,
    // ✅ Incluir fbc/fbp para atribuição de campanha
    fbc: fbc || undefined,
    fbp: fbp || undefined,
  };

  // Log explícito do payload ANTES do fetch (conforme tutorial)
  console.log('PAYLOAD PIX FRONTEND:', {
    customer: {
      name: payload.customer.name,
      email: payload.customer.email,
      phone: payload.customer.phone,
      cpf: payload.customer.cpf ? payload.customer.cpf.substring(0, 3) + '***' : 'não informado',
    },
    items: payload.items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    totalPrice: payload.totalPrice,
  });

  console.log('🚀 Criando transação PIX via backend:', {
    endpoint,
    customer: payload.customer.name,
    cpf: payload.customer.cpf ? payload.customer.cpf.substring(0, 3) + '***' : 'não informado',
    itemsCount: payload.items.length,
    totalPrice: payload.totalPrice,
  });

  let response: Response;
  let result: UmbrellaPagResponse;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (fetchError: any) {
    // Erro de rede (conexão, etc.)
    console.error('❌ Erro de rede ao chamar backend:', fetchError);
    throw new Error(`Erro de conexão: ${fetchError.message || 'Não foi possível conectar ao servidor'}`);
  }

  // Obter resposta como texto primeiro
  const responseText = await response.text();
  console.log('📥 Resposta raw do backend:', responseText);
  
  if (!responseText) {
    throw new Error(`Erro HTTP ${response.status}: Resposta vazia do servidor`);
  }

  // Tentar parsear como JSON
  try {
    result = JSON.parse(responseText);
  } catch (parseError: any) {
    // Se não for JSON e a resposta não é OK, usar o texto como mensagem de erro
    if (!response.ok) {
      const errorMessage = responseText.trim() || `Erro HTTP ${response.status}: ${response.statusText}`;
      console.error('❌ Erro do servidor (resposta não-JSON):', errorMessage);
      throw new Error(errorMessage);
    }
    // Se for OK mas não é JSON, isso é um problema
    console.error('❌ Erro ao parsear resposta JSON:', parseError);
    throw new Error(`Erro ao processar resposta do servidor: ${parseError.message}`);
  }

  console.log('📥 Resposta do backend:', {
    status: response.status,
    ok: response.ok,
    resultStatus: result.status,
    success: result.success,
    hasData: !!result.data,
    hasPixCode: !!result.pixCode,
    message: result.message,
    error: result.error,
  });

  // Verificar se a resposta HTTP é OK
  if (!response.ok) {
    const errorMessage = result?.message || result?.error || `Erro HTTP ${response.status}: ${response.statusText}`;
    console.error('❌ Erro na resposta do backend:', errorMessage, result);
    throw new Error(errorMessage);
  }

  // Verificar se a resposta da API indica sucesso
  if (!result.success) {
    const errorMessage = result?.message || result?.error || 'Erro desconhecido ao criar transação';
    console.error('❌ Erro na resposta do backend:', errorMessage, result);
    throw new Error(errorMessage);
  }

  if (!result || result.status !== 200 || !result.data) {
    const errorMessage = result?.message || 'Resposta inválida do servidor';
    console.error('❌ Resposta inválida do backend:', errorMessage, result);
    throw new Error(errorMessage);
  }

  // ✅ CORREÇÃO CRÍTICA: Obter QR Code APENAS da resposta do backend
  // O QR Code DEVE vir de response.pixCode ou result.data.pix.qrcode
  // NUNCA reutilizar QR Code antigo
  const qrCode = result.pixCode || 
                 result.data?.pix?.qrcode || 
                 result.data?.pix?.qrCode || 
                 result.data?.qrCode || 
                 '';
  
  if (!qrCode || qrCode.trim() === '') {
    console.error('❌❌❌ ERRO CRÍTICO: QR Code não recebido do backend!', {
      result,
      hasPixCode: !!result.pixCode,
      hasData: !!result.data,
      hasPix: !!result.data?.pix,
      availableFields: result.data ? Object.keys(result.data) : [],
    });
    throw new Error('QR Code não foi gerado pelo gateway. Tente novamente.');
  }
  
  // ✅ Garantir que o QR Code está em todos os lugares esperados no objeto de retorno
  if (!result.data.qrCode) {
    result.data.qrCode = qrCode;
  }
  if (!result.data.pix) {
    result.data.pix = {};
  }
  if (!result.data.pix.qrCode) {
    result.data.pix.qrCode = qrCode;
  }
  if (!result.data.pix.qrcode) {
    result.data.pix.qrcode = qrCode;
  }
  
  // ✅ Log para confirmar que o QR Code foi obtido corretamente
  console.log('✅✅✅ QR Code obtido do backend (NOVO):', {
    timestamp: new Date().toISOString(),
    orderId: result.data?.orderId,
    qrCodeLength: qrCode.length,
    qrCodePreview: qrCode.substring(0, 50) + '...',
  });

  return result.data;
};

/**
 * Verifica o status de uma transação
 */
export const getTransactionStatus = async (transactionId: string): Promise<UmbrellaPagTransaction> => {
  if (!API_KEY) {
    throw new Error('API Key do UmbrellaPag não configurada');
  }

  const response = await fetch(`${UMBRELLAPAG_API_URL}/api/user/transactions/${transactionId}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
      'User-Agent': 'UMBRELLAB2B/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar transação: ${response.statusText}`);
  }

  const result: UmbrellaPagResponse = await response.json();
  
  if (result.status !== 200 || !result.data) {
    throw new Error(result.message || 'Transação não encontrada');
  }

  return result.data;
};

