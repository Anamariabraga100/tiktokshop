import { CustomerData } from '@/context/CustomerContext';

export interface PixData {
  name: string;
  cpf: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  email?: string;
  phone?: string;
}

/**
 * Gera os dados necessários para o PIX a partir dos dados do cliente
 */
export const generatePixData = (customerData: CustomerData | null): PixData | null => {
  if (!customerData || !customerData.address || !customerData.cpf) {
    return null;
  }

  return {
    name: customerData.name || 'Cliente',
    cpf: customerData.cpf.replace(/\D/g, ''), // Remove formatação
    address: {
      street: customerData.address.rua,
      number: customerData.address.numero,
      complement: customerData.address.complemento,
      neighborhood: customerData.address.bairro,
      city: customerData.address.cidade,
      state: customerData.address.estado,
      zipCode: customerData.address.cep.replace(/\D/g, ''), // Remove formatação
    },
    email: customerData.email,
    phone: customerData.phone,
  };
};

/**
 * Valida se os dados do cliente estão completos para gerar PIX
 */
export const validatePixData = (customerData: CustomerData | null): boolean => {
  if (!customerData) return false;
  if (!customerData.cpf) return false;
  if (!customerData.address) return false;
  if (!customerData.address.cep || !customerData.address.rua || !customerData.address.numero || 
      !customerData.address.bairro || !customerData.address.cidade || !customerData.address.estado) {
    return false;
  }
  return true;
};





