import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';
import { useCustomer } from '@/context/CustomerContext';
import { saveOrderToSupabase, OrderRow } from '@/lib/supabase';
import { createPixTransaction } from '@/lib/umbrellapag';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export const PixPaymentModal = ({ isOpen, onClose, onPaymentComplete }: PixPaymentModalProps) => {
  const { totalPrice, items } = useCart();
  const { getApplicableCoupon, isFirstPurchase, markPurchaseCompleted } = useCoupons();
  const { customerData } = useCustomer();
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixCode, setPixCode] = useState<string>('');
  const [umbrellaTransaction, setUmbrellaTransaction] = useState<any>(null);
  const navigate = useNavigate();

  // Calcular valor final com desconto PIX de 10% (simulação)
  // Mesma lógica do CartDrawer para consistência
  const safeTotalPrice = totalPrice || 0;
  
  // Aplicar cupom de R$5 apenas na primeira compra
  const firstPurchaseDiscount = items.length > 0 && isFirstPurchase() ? 5 : 0;
  
  // Outros cupons percentuais são aplicados se ativos
  const applicableCoupon = getApplicableCoupon(safeTotalPrice);
  const otherCouponDiscount = applicableCoupon && applicableCoupon.id !== '4'
    ? (safeTotalPrice * applicableCoupon.discountPercent) / 100
    : 0;
  
  // Total de desconto de cupons (R$5 fixo + outros cupons)
  const couponDiscount = firstPurchaseDiscount + otherCouponDiscount;
  const priceAfterCoupon = safeTotalPrice - couponDiscount;
  
  // PIX tem 10% de desconto adicional
  const pixDiscount = priceAfterCoupon * 0.1;
  const finalPrice = Math.max(0, priceAfterCoupon - pixDiscount);

  // Criar transação PIX no UmbrellaPag quando o modal abrir
  useEffect(() => {
    if (isOpen && customerData && items.length > 0 && !pixCode && !isProcessing) {
      const createTransaction = async () => {
        try {
          setIsProcessing(true);
          
          // Validar dados do cliente antes de criar transação
          if (!customerData.cpf) {
            throw new Error('CPF não informado. Preencha seus dados antes de pagar.');
          }
          
          if (!customerData.address) {
            throw new Error('Endereço não informado. Preencha seu endereço antes de pagar.');
          }
          
          // Log explícito para debug (conforme tutorial)
          console.log('📋 Dados para transação:', {
            customer: {
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone,
              cpf: customerData.cpf?.substring(0, 3) + '***',
            },
            itemsCount: items.length,
            totalPrice: finalPrice,
            hasAddress: !!customerData.address,
          });
          
          // Criar transação no UmbrellaPag
          const transaction = await createPixTransaction(
            customerData,
            items,
            finalPrice,
            {
              orderId: Math.random().toString(36).substring(2, 10).toUpperCase(),
              isFirstPurchase: isFirstPurchase(),
            }
          );
          
          console.log('✅ Transação criada:', {
            id: transaction.id,
            status: transaction.status,
            hasQrCode: !!(transaction.qrCode || transaction.pix?.qrCode),
          });
          
          setUmbrellaTransaction(transaction);
          
          // Obter QR Code PIX (pode estar em diferentes campos)
          const qrCode = transaction.qrCode || transaction.pix?.qrCode || transaction.pix?.qrCodeImage || '';
          
          if (qrCode) {
            setPixCode(qrCode);
            console.log('✅ QR Code obtido com sucesso');
          } else {
            // Tentar obter o QR Code da URL segura ou outros campos
            if (transaction.secureUrl) {
              console.warn('⚠️ QR Code não encontrado diretamente, mas há secureUrl:', transaction.secureUrl);
              // Se tiver secureUrl, pode ser necessário acessar via webhook
            }
            
            toast.error('QR Code PIX não foi gerado pela API. Verifique o console para mais detalhes.');
            console.error('❌ Transação criada, mas sem QR Code:', {
              transaction,
              availableFields: Object.keys(transaction),
            });
          }
        } catch (error: any) {
          console.error('❌ Erro ao criar transação PIX:', error);
          
          let errorMessage = 'Erro ao criar transação PIX. Tente novamente.';
          
          if (error.message) {
            errorMessage = error.message;
          } else if (error.response) {
            errorMessage = `Erro ${error.response.status}: ${error.response.statusText}`;
          }
          
          // Mostrar toast apenas uma vez
          toast.error(errorMessage, {
            duration: 8000,
            id: 'pix-error', // Usar ID para evitar múltiplos toasts
          });
          
          // Resetar estados em caso de erro
          setPixCode('');
          setUmbrellaTransaction(null);
          setIsProcessing(false); // Resetar aqui também
        }
      };
      
      createTransaction();
    }
  }, [isOpen, customerData, items, finalPrice, isFirstPurchase, pixCode, isProcessing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar código');
    }
  };

  const handlePaymentComplete = async () => {
    if (isProcessing || !umbrellaTransaction) return; // Prevenir múltiplos cliques
    
    try {
      setIsProcessing(true);
      
      // Marcar compra como concluída se for primeira compra
      if (isFirstPurchase()) {
        markPurchaseCompleted();
      }
      
      // Usar ID da transação ou gerar número do pedido
      const orderNumber = umbrellaTransaction.externalRef || umbrellaTransaction.id || Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Normalizar CPF (remover formatação) para garantir consistência
      const normalizedCPF = customerData?.cpf ? customerData.cpf.replace(/\D/g, '') : null;
      
      // Preparar dados do pedido para localStorage (compatibilidade)
      const orderData = {
        orderNumber,
        items: items,
        totalPrice: finalPrice,
        paymentMethod: 'pix',
        date: new Date().toISOString(),
        status: umbrellaTransaction.status || 'WAITING_PAYMENT', // Status da transação
        cpf: normalizedCPF,
        umbrellaTransactionId: umbrellaTransaction.id,
      };
      
      // Salvar como último pedido (para compatibilidade)
      localStorage.setItem('lastOrder', JSON.stringify(orderData));
      
      // Salvar na lista de pedidos do CPF (usando CPF normalizado)
      if (normalizedCPF) {
        const ordersKey = `orders_${normalizedCPF}`;
        const existingOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
        existingOrders.push(orderData);
        localStorage.setItem(ordersKey, JSON.stringify(existingOrders));
      }
      
      // Salvar pedido no Supabase (se CPF disponível)
      if (normalizedCPF) {
        const orderRow: OrderRow = {
          order_number: orderNumber,
          customer_cpf: normalizedCPF,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: typeof item.image === 'string' ? item.image : undefined,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
          total_price: finalPrice,
          payment_method: 'pix',
          pix_code: pixCode,
          status: umbrellaTransaction.status?.toLowerCase().replace('_', ' ') || 'waiting_payment',
          umbrella_transaction_id: umbrellaTransaction.id,
          umbrella_status: umbrellaTransaction.status,
          umbrella_qr_code: pixCode,
          umbrella_external_ref: umbrellaTransaction.externalRef,
          umbrella_end_to_end_id: umbrellaTransaction.endToEndId,
          umbrella_paid_at: umbrellaTransaction.paidAt,
        };
        
        // Salvar no Supabase de forma assíncrona
        saveOrderToSupabase(orderRow).catch((error) => {
          console.error('Erro ao salvar pedido no Supabase:', error);
          // Não mostra erro para o usuário, apenas loga
          // O pedido já foi salvo no localStorage como fallback
        });
      }
      
      setIsProcessing(false);
      
      // Fechar modal primeiro
      onClose();
      
      // Mostrar toast de sucesso
      toast.success('Transação PIX criada! Pague o QR Code para finalizar.', { id: 'payment-success', duration: 5000 });
      
      // Não chamar onPaymentComplete ainda - aguardar pagamento
      // O usuário precisa pagar o PIX primeiro
      
      // Redirecionar para tela de agradecimento com informações do pagamento
      setTimeout(() => {
        try {
          navigate('/thank-you', { 
            state: { 
              items: items,
              transaction: umbrellaTransaction,
              paymentPending: true,
            } 
          });
        } catch (error) {
          console.error('Erro ao navegar:', error);
          // Fallback: usar window.location se navigate falhar
          window.location.href = '/thank-you';
        }
      }, 500);
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      setIsProcessing(false);
      toast.error(error.message || 'Erro ao processar pagamento. Tente novamente.', { id: 'payment-error' });
    }
  };

  // Debug: verificar se o modal está sendo renderizado
  useEffect(() => {
    if (isOpen) {
      console.log('PixPaymentModal está aberto');
    }
  }, [isOpen]);

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
            className="fixed inset-0 bg-black/60 z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold">Pagamento PIX</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount */}
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Valor a pagar</p>
                <p className="text-4xl font-bold text-primary">
                  R$ {finalPrice.toFixed(2).replace('.', ',')}
                </p>
                {pixDiscount > 0 && (
                  <p className="text-sm text-success mt-2">
                    Desconto PIX (10%): R$ {pixDiscount.toFixed(2).replace('.', ',')}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {!pixCode && !isProcessing && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive font-medium mb-2">
                    ⚠️ Erro ao gerar QR Code PIX
                  </p>
                  <p className="text-xs text-destructive/80">
                    A API de pagamento requer um backend para funcionar. Em produção, 
                    crie um endpoint no seu servidor para processar os pagamentos.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Para desenvolvimento, você pode usar um serviço de proxy CORS ou 
                    criar um endpoint backend simples.
                  </p>
                </div>
              )}

              {/* PIX Code */}
              <div className="mb-6">
                {isProcessing && !pixCode ? (
                  <div className="bg-muted rounded-xl p-8 border border-border flex flex-col items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"
                    />
                    <p className="text-sm text-muted-foreground">Gerando QR Code PIX...</p>
                  </div>
                ) : pixCode ? (
                  <>
                    <p className="text-sm font-medium mb-3">Código PIX (Copiar e Colar)</p>
                    <div className="bg-muted rounded-xl p-4 border border-border relative">
                      <p className="text-xs font-mono break-all text-foreground select-all pr-12">
                        {pixCode}
                      </p>
                      <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="w-full mt-3 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5" />
                          Código copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copiar código PIX
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                    <p className="text-sm text-destructive">Erro ao gerar QR Code PIX. Tente novamente.</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold mb-2">Como pagar:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha a opção PIX</li>
                  <li>Selecione "Pix Copia e Cola"</li>
                  <li>Cole o código copiado</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border-2 border-border rounded-full font-semibold hover:bg-muted transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handlePaymentComplete}
                  disabled={isProcessing || !pixCode || !umbrellaTransaction}
                  className="flex-1 py-3 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <span>Confirmar pedido</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
