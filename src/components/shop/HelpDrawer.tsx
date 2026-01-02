import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Package, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCustomer } from '@/context/CustomerContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'Como faço um pedido?',
    answer: 'Basta adicionar os produtos desejados ao carrinho, preencher seu endereço de entrega e finalizar a compra. Você receberá um código de rastreamento por email.'
  },
  {
    question: 'Quais são as formas de pagamento?',
    answer: 'Aceitamos PIX, cartão de crédito e débito. O pagamento via PIX oferece desconto adicional.'
  },
  {
    question: 'Qual o prazo de entrega?',
    answer: 'O prazo de entrega varia de 5 a 7 dias úteis após a confirmação do pagamento. Você pode rastrear seu pedido pelo CPF na seção de rastreamento.'
  },
  {
    question: 'Como funciona o frete grátis?',
    answer: 'O frete grátis é aplicado automaticamente em pedidos acima de R$ 99,00. Não é necessário código promocional.'
  },
  {
    question: 'Posso cancelar meu pedido?',
    answer: 'Sim, você pode cancelar seu pedido até 24 horas após a confirmação do pagamento. Após esse período, entre em contato conosco através do suporte.'
  },
  {
    question: 'Como uso os cupons de desconto?',
    answer: 'Os cupons podem ser ativados na página do produto ou no menu de cupons. Após ativar, você terá 15 minutos para finalizar a compra e o desconto será aplicado automaticamente.'
  },
  {
    question: 'Como faço a troca ou devolução?',
    answer: 'Você tem até 7 dias após o recebimento para solicitar troca ou devolução. Entre em contato conosco e envie o produto em sua embalagem original.'
  },
  {
    question: 'Meu pedido está atrasado, o que fazer?',
    answer: 'Primeiro, rastreie seu pedido pelo CPF. Se o prazo de entrega foi ultrapassado, entre em contato conosco para verificar o status e solicitar reembolso se necessário.'
  }
];

export const HelpDrawer = ({ isOpen, onClose }: HelpDrawerProps) => {
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [trackingCPF, setTrackingCPF] = useState('');
  const [showTracking, setShowTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<{ orderNumber: string; status: string; date: string } | null>(null);
  const { customerData } = useCustomer();

  // Preencher CPF automaticamente se estiver disponível e resetar resultado ao abrir
  useEffect(() => {
    if (isOpen) {
      setTrackingResult(null);
      if (customerData?.cpf && !trackingCPF) {
        setTrackingCPF(customerData.cpf);
      }
    }
  }, [isOpen, customerData?.cpf]);

  const handleTrackOrder = () => {
    // Usar CPF do input ou do customerData
    const cpfToUse = trackingCPF || customerData?.cpf || '';
    const cpf = cpfToUse.replace(/\D/g, ''); // Normalizar CPF (apenas números)
    
    if (cpf.length !== 11) {
      toast.error('CPF inválido. Digite um CPF válido com 11 dígitos.');
      return;
    }

    // Buscar pedidos salvos no localStorage (usando CPF normalizado)
    const ordersKey = `orders_${cpf}`;
    const savedOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    
    // Também verificar lastOrder se o CPF corresponder
    const lastOrder = localStorage.getItem('lastOrder');
    let allOrders = [...savedOrders];
    
    if (lastOrder) {
      try {
        const lastOrderData = JSON.parse(lastOrder);
        // Normalizar CPF do lastOrder para comparação
        const lastOrderCPF = lastOrderData.cpf ? lastOrderData.cpf.replace(/\D/g, '') : null;
        const customerCPF = customerData?.cpf ? customerData.cpf.replace(/\D/g, '') : null;
        
        // Verificar se o CPF corresponde (normalizado)
        if (lastOrderCPF === cpf || (!lastOrderCPF && customerCPF === cpf)) {
          // Adicionar lastOrder se não estiver já na lista
          const exists = allOrders.some((o: any) => o.orderNumber === lastOrderData.orderNumber);
          if (!exists) {
            allOrders.push(lastOrderData);
          }
        }
      } catch (e) {
        console.error('Erro ao ler lastOrder:', e);
      }
    }

    // Também buscar por todas as chaves de pedidos para garantir que não perdemos nenhum
    // (caso tenha sido salvo com formatação diferente)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orders_')) {
          const keyCPF = key.replace('orders_', '').replace(/\D/g, '');
          if (keyCPF === cpf && key !== ordersKey) {
            // Encontrou uma chave com CPF correspondente mas formato diferente
            const additionalOrders = JSON.parse(localStorage.getItem(key) || '[]');
            allOrders = [...allOrders, ...additionalOrders];
          }
        }
      }
    } catch (e) {
      console.error('Erro ao buscar pedidos adicionais:', e);
    }

    if (allOrders.length > 0) {
      // Pegar o pedido mais recente
      const latestOrder = allOrders.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      
      setTrackingResult({
        orderNumber: latestOrder.orderNumber || 'N/A',
        status: latestOrder.status || 'em_preparacao',
        date: latestOrder.date || new Date().toISOString()
      });
      
      toast.success('Pedido encontrado! Status: Em preparação');
    } else {
      setTrackingResult(null);
      toast.info('Nenhum pedido encontrado para este CPF.');
    }
  };

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
            className="fixed inset-0 bg-foreground/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="sticky top-0 bg-card pt-3 pb-2 z-10">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Central de Ajuda</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pb-8 space-y-6">
              {/* Track Order Section */}
              <div className="bg-gradient-to-r from-primary/10 to-tiktok-pink/10 rounded-xl border border-primary/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Rastrear Pedido</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Digite seu CPF para rastrear seus pedidos
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="000.000.000-00"
                    value={trackingCPF || customerData?.cpf || ''}
                    onChange={(e) => setTrackingCPF(formatCPF(e.target.value))}
                    maxLength={14}
                    className="flex-1"
                  />
                  <button
                    onClick={handleTrackOrder}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Buscar
                  </button>
                </div>
                {customerData?.cpf && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Usando CPF cadastrado: {customerData.cpf}
                  </p>
                )}
                {trackingResult && (
                  <div className="mt-4 p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">Pedido #{trackingResult.orderNumber}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium text-primary">Em preparação</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">
                          {new Date(trackingResult.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FAQ Section */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Perguntas Frequentes
                </h3>
                <div className="space-y-2">
                  {faqItems.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-border rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-medium text-left flex-1 pr-4">
                          {faq.question}
                        </span>
                        {activeFAQ === index ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                      <AnimatePresence>
                        {activeFAQ === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 text-sm text-muted-foreground">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Contact Section */}
              <div className="bg-muted rounded-xl p-4">
                <h3 className="font-semibold mb-2">Precisa de mais ajuda?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Entre em contato conosco através dos canais abaixo:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📧 Email:</span>
                    <span className="text-muted-foreground">suporte@loja.com.br</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📱 WhatsApp:</span>
                    <span className="text-muted-foreground">(11) 99999-9999</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">🕐 Horário:</span>
                    <span className="text-muted-foreground">Segunda a Sexta, 9h às 18h</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};




