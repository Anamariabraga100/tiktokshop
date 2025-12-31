import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Address {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface CustomerData {
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: Address;
  createdAt?: string;
}

interface CustomerContextType {
  customerData: CustomerData | null;
  saveCustomerData: (data: CustomerData) => void;
  updateAddress: (address: Address) => void;
  updateCPF: (cpf: string) => void;
  clearCustomerData: () => void;
  hasAddress: boolean;
  hasCPF: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const STORAGE_KEY = 'customer_data';

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);

  // Carregar dados do localStorage ao inicializar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCustomerData(parsed);
      } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Salvar no localStorage sempre que os dados mudarem
  useEffect(() => {
    if (customerData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [customerData]);

  const saveCustomerData = (data: CustomerData) => {
    const newData: CustomerData = {
      ...customerData,
      ...data,
      createdAt: customerData?.createdAt || new Date().toISOString(),
    };
    setCustomerData(newData);
  };

  const updateAddress = (address: Address) => {
    setCustomerData((prev) => ({
      ...prev,
      address,
      createdAt: prev?.createdAt || new Date().toISOString(),
    }));
  };

  const updateCPF = (cpf: string) => {
    setCustomerData((prev) => ({
      ...prev,
      cpf,
      createdAt: prev?.createdAt || new Date().toISOString(),
    }));
  };

  const clearCustomerData = () => {
    setCustomerData(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasAddress = !!customerData?.address;
  const hasCPF = !!customerData?.cpf;

  return (
    <CustomerContext.Provider
      value={{
        customerData,
        saveCustomerData,
        updateAddress,
        updateCPF,
        clearCustomerData,
        hasAddress,
        hasCPF,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};


