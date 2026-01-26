import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCustomer } from '@/context/CustomerContext';

interface CPFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCPF: (cpf: string) => void;
}

export const CPFModal = ({ isOpen, onClose, onAddCPF }: CPFModalProps) => {
  const { customerData, saveCustomerData } = useCustomer();
  const [cpf, setCpf] = useState(customerData?.cpf || '');
  const [name, setName] = useState(customerData?.name || '');

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cpfNumbers = cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      toast.error('CPF deve conter 11 dígitos');
      return;
    }
    
    // Validar nome
    if (!name || name.trim() === '') {
      toast.error('Nome é obrigatório');
      return;
    }
    
    // Salvar CPF e nome juntos no contexto (garantir que ambos sejam salvos simultaneamente)
    const trimmedName = name.trim();
    const normalizedCPF = cpf.replace(/\D/g, '');
    
    console.log('📝 Salvando no CPFModal:', { cpf: normalizedCPF, name: trimmedName });
    
    // Salvar dados
    saveCustomerData({ 
      cpf: cpf, // Manter formatação para exibição
      name: trimmedName 
    });
    
    // Verificar se foi salvo corretamente após um pequeno delay
    setTimeout(() => {
      const saved = localStorage.getItem('customer_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🔍 Verificando dados salvos:', parsed);
        
        if (parsed.cpf && parsed.name) {
          console.log('✅ Dados confirmados no localStorage');
          onAddCPF(cpf);
          toast.success('CPF e nome adicionados com sucesso!', { id: 'cpf-saved' });
        } else {
          console.error('❌ Dados não foram salvos corretamente:', parsed);
          toast.error('Erro ao salvar dados. Tente novamente.', { id: 'cpf-error' });
        }
      } else {
        console.error('❌ Nenhum dado encontrado no localStorage');
        toast.error('Erro ao salvar dados. Tente novamente.', { id: 'cpf-error' });
      }
    }, 200);
  };

  // Carregar CPF e nome do contexto quando modal abrir
  useEffect(() => {
    if (isOpen) {
      if (customerData?.cpf) {
        setCpf(customerData.cpf);
      }
      if (customerData?.name) {
        setName(customerData.name);
      }
    }
  }, [isOpen, customerData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/60 z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    Informações necessárias para sua nota fiscal
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Microcopy de segurança */}
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Usamos essas informações apenas para emitir a nota fiscal do seu pedido.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    maxLength={14}
                    required
                  />
                </div>

                {/* Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

