import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { saveCustomerToSupabase, getCustomerFromSupabase, CustomerRow } from '@/lib/supabase';

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
    const loadCustomerData = async () => {
      // Primeiro, tenta carregar do localStorage (mais rápido)
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCustomerData(parsed);
          
          // Se tiver CPF, tenta sincronizar com Supabase
          if (parsed.cpf) {
            const supabaseData = await getCustomerFromSupabase(parsed.cpf);
            if (supabaseData) {
              // Atualiza com dados do Supabase (mais recentes)
              const syncedData: CustomerData = {
                name: supabaseData.name,
                email: supabaseData.email,
                phone: supabaseData.phone,
                cpf: supabaseData.cpf,
                address: supabaseData.address as Address | undefined,
                createdAt: supabaseData.created_at,
              };
              setCustomerData(syncedData);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedData));
            }
          }
        } catch (error) {
          console.error('Erro ao carregar dados do cliente:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    };

    loadCustomerData();
  }, []);

  // Salvar no localStorage sempre que os dados mudarem
  useEffect(() => {
    if (customerData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
      
      // Sincronizar com Supabase em background (não bloqueia a UI)
      if (customerData.cpf) {
        const customerRow: CustomerRow = {
          cpf: customerData.cpf,
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
        };
        
        // Salvar no Supabase de forma assíncrona (não espera resposta)
        saveCustomerToSupabase(customerRow).catch((error) => {
          console.error('Erro ao sincronizar com Supabase:', error);
          // Não mostra erro para o usuário, apenas loga
        });
      }
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

  const hasAddress = useMemo(() => !!customerData?.address, [customerData?.address]);
  // hasCPF agora verifica tanto CPF quanto nome (ambos são obrigatórios para PIX)
  const hasCPF = useMemo(() => {
    return !!(customerData?.cpf && customerData?.name && customerData.name.trim() !== '');
  }, [customerData?.cpf, customerData?.name]);

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


