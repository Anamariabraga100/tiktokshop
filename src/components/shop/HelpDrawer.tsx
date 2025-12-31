import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Package, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useState } from 'react';
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
  const { customerData } = useCustomer();

  const handleTrackOrder = () => {
    const cpf = trackingCPF.replace(/\D/g, '');
    if (cpf.length !== 11) {
      toast.error('CPF inválido. Digite um CPF válido com 11 dígitos.');
      return;
    }

    // Simular busca de pedido
    toast.success('Pedido encontrado! Status: Em trânsito');
    // Aqui você integraria com a API de rastreamento real
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


