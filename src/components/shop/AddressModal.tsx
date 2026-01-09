import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCustomer, Address, CustomerData } from '@/context/CustomerContext';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAddress: () => void;
}

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const AddressModal = ({ isOpen, onClose, onAddAddress }: AddressModalProps) => {
  const { customerData, updateAddress, saveCustomerData } = useCustomer();
  const [formData, setFormData] = useState({
    email: customerData?.email || '',
    cep: customerData?.address?.cep || '',
    rua: customerData?.address?.rua || '',
    numero: customerData?.address?.numero || '',
    complemento: customerData?.address?.complemento || '',
    bairro: customerData?.address?.bairro || '',
    cidade: customerData?.address?.cidade || '',
    estado: customerData?.address?.estado || '',
  });
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  // Formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    }
    return value;
  };

  // Buscar endereço pelo CEP
  const fetchCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setIsLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
        complemento: data.complemento || prev.complemento,
      }));
      
      toast.success('Endereço encontrado!');
    } catch (error) {
      toast.error('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsLoadingCEP(false);
    }
  };

  // Buscar CEP quando tiver 8 dígitos
  useEffect(() => {
    const cleanCEP = formData.cep.replace(/\D/g, '');
    // Só busca se tiver 8 dígitos, modal estiver aberto, não estiver carregando e os campos principais estiverem vazios
    if (cleanCEP.length === 8 && isOpen && !isLoadingCEP && !formData.rua && !formData.cidade) {
      const timeoutId = setTimeout(() => {
        fetchCEP(formData.cep);
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cep, isOpen]);

  // Carregar dados do contexto quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: customerData?.email || '',
        cep: customerData?.address?.cep || '',
        rua: customerData?.address?.rua || '',
        numero: customerData?.address?.numero || '',
        complemento: customerData?.address?.complemento || '',
        bairro: customerData?.address?.bairro || '',
        cidade: customerData?.address?.cidade || '',
        estado: customerData?.address?.estado || '',
      });
    }
  }, [isOpen, customerData]);

  // Bloquear scroll do body quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      // Salvar a posição atual do scroll
      const scrollY = window.scrollY;
      // Bloquear o scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar o scroll quando fechar
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cep || !formData.rua || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validar e-mail se preenchido
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Por favor, insira um e-mail válido');
      return;
    }
    
    // Salvar endereço no contexto
    const address: Address = {
      cep: formData.cep,
      rua: formData.rua,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
    };
    
    // Salvar endereço e e-mail juntos usando saveCustomerData para garantir sincronização
    const dataToSave: Partial<CustomerData> = { address };
    if (formData.email) {
      dataToSave.email = formData.email;
    }
    saveCustomerData(dataToSave as CustomerData);
    
    onAddAddress();
    // Notificação será exibida pelo CartDrawer através de handleAddAddress
  };

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
            className="fixed inset-0 bg-foreground/60 z-[59]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 pointer-events-none safe-area-inset"
            onClick={(e) => {
              // Se clicar no container (fora do conteúdo), fecha
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            <div 
              className="bg-card rounded-2xl p-4 sm:p-6 md:p-8 max-w-md md:max-w-lg w-full shadow-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto pointer-events-auto safe-area-inset"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold truncate">
                    Adicionar endereço de entrega
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                      maxLength={9}
                      required
                    />
                    {isLoadingCEP && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O endereço será preenchido automaticamente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    required
                  >
                    <SelectTrigger id="estado" className="w-full">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]" style={{ zIndex: 100 }}>
                      <SelectItem value="AC">Acre</SelectItem>
                      <SelectItem value="AL">Alagoas</SelectItem>
                      <SelectItem value="AP">Amapá</SelectItem>
                      <SelectItem value="AM">Amazonas</SelectItem>
                      <SelectItem value="BA">Bahia</SelectItem>
                      <SelectItem value="CE">Ceará</SelectItem>
                      <SelectItem value="DF">Distrito Federal</SelectItem>
                      <SelectItem value="ES">Espírito Santo</SelectItem>
                      <SelectItem value="GO">Goiás</SelectItem>
                      <SelectItem value="MA">Maranhão</SelectItem>
                      <SelectItem value="MT">Mato Grosso</SelectItem>
                      <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="PA">Pará</SelectItem>
                      <SelectItem value="PB">Paraíba</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                      <SelectItem value="PE">Pernambuco</SelectItem>
                      <SelectItem value="PI">Piauí</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      <SelectItem value="RO">Rondônia</SelectItem>
                      <SelectItem value="RR">Roraima</SelectItem>
                      <SelectItem value="SC">Santa Catarina</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="SE">Sergipe</SelectItem>
                      <SelectItem value="TO">Tocantins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rua">Rua *</Label>
                  <Input
                    id="rua"
                    placeholder="Nome da rua"
                    value={formData.rua}
                    onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      placeholder="123"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      placeholder="Apto, Bloco, etc"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    placeholder="Nome do bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    placeholder="Nome da cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                  />
                </div>

                {/* Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity"
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
