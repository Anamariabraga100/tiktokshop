import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCustomer } from '@/context/CustomerContext';
import { Address } from '@/context/CustomerContext';

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
  const { customerData, updateAddress } = useCustomer();
  const [formData, setFormData] = useState({
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
    if (isOpen && customerData?.address) {
      setFormData({
        cep: customerData.address.cep || '',
        rua: customerData.address.rua || '',
        numero: customerData.address.numero || '',
        complemento: customerData.address.complemento || '',
        bairro: customerData.address.bairro || '',
        cidade: customerData.address.cidade || '',
        estado: customerData.address.estado || '',
      });
    }
  }, [isOpen, customerData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cep || !formData.rua || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
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
    
    updateAddress(address);
    
    onAddAddress();
    toast.success('Endereço cadastrado com sucesso!');
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
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => {
              // Se clicar no container (fora do conteúdo), fecha
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            <div 
              className="bg-card rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    Adicionar endereço de entrega
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="grid grid-cols-2 gap-3">
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

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 border border-border rounded-full font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
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
