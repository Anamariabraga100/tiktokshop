import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, QrCode, Clock, Shield, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';
import { useCustomer } from '@/context/CustomerContext';
import { saveOrderToSupabase, OrderRow } from '@/lib/supabase';
import { createPixTransaction } from '@/lib/umbrellapag';
import { trackPixGerado, trackPixCopiado } from '@/lib/facebookPixel';

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
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutos em segundos
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Calcular valor final (sem desconto PIX)
  // Mesma lógica do CartDrawer para consistência
  const safeTotalPrice = totalPrice || 0;
  
  // Outros cupons percentuais são aplicados se ativos
  const applicableCoupon = getApplicableCoupon(safeTotalPrice);
  const otherCouponDiscount = applicableCoupon && applicableCoupon.id !== '4'
    ? (safeTotalPrice * applicableCoupon.discountPercent) / 100
    : 0;
  
  // Total de desconto de cupons (sem desconto de primeira compra)
  const couponDiscount = otherCouponDiscount;
  const priceAfterCoupon = safeTotalPrice - couponDiscount;
  
  // PIX não tem desconto adicional
  const pixDiscount = 0;

  // Calcular frete grátis (threshold R$ 50)
  const freeShippingThreshold = 50;
  const freeShippingFromThankYou = localStorage.getItem('freeShippingFromThankYou') === 'true' && safeTotalPrice >= freeShippingThreshold;
  const hasFreeShipping = safeTotalPrice >= freeShippingThreshold || freeShippingFromThankYou;
  const shippingPrice = hasFreeShipping ? 0 : 9.90;
  
  // Calcular valor final incluindo frete
  const finalPrice = priceAfterCoupon + shippingPrice;

  // Formatar resumo do pedido
  const regularItems = items.filter(item => !item.isGift);
  const productNames = regularItems.map(item => {
    const name = item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name;
    return item.quantity > 1 ? `${name} (${item.quantity}x)` : name;
  });
  const orderSummary = productNames.length > 0 
    ? productNames.join(' + ')
    : 'Produto';

  // Resetar timer quando novo PIX for gerado
  useEffect(() => {
    if (pixCode && !isExpired) {
      setTimeRemaining(600); // Resetar para 10 minutos
      setIsExpired(false);
    }
  }, [pixCode, isExpired]);

  // Timer regressivo
  useEffect(() => {
    // Limpar timer anterior sempre que as dependências mudarem
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isOpen && pixCode && !isExpired) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, pixCode, isExpired]);

  // Formatar tempo restante
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Criar transação PIX no UmbrellaPag quando o modal abrir
  useEffect(() => {
    if (isOpen && customerData && items.length > 0 && !pixCode && !isProcessing) {
      const createTransaction = async () => {
        try {
          setIsProcessing(true);
          
          // Validar dados do cliente antes de criar transação (validação rigorosa)
          const cpfNormalized = customerData.cpf?.replace(/\D/g, '') || '';
          if (!customerData.cpf || cpfNormalized.length !== 11) {
            throw new Error('CPF não informado ou inválido. Preencha seu CPF antes de pagar.');
          }
          
          if (!customerData.name || customerData.name.trim() === '') {
            throw new Error('Nome não informado. Preencha seu nome antes de pagar.');
          }
          
          // Validar endereço completo (todos os campos obrigatórios)
          if (!customerData.address) {
            throw new Error('Endereço não informado. Preencha seu endereço de entrega antes de pagar.');
          }
          
          const address = customerData.address;
          const missingFields: string[] = [];
          
          if (!address.cep || address.cep.replace(/\D/g, '').length !== 8) {
            missingFields.push('CEP');
          }
          if (!address.rua || address.rua.trim() === '') {
            missingFields.push('Rua');
          }
          if (!address.numero || address.numero.trim() === '') {
            missingFields.push('Número');
          }
          if (!address.bairro || address.bairro.trim() === '') {
            missingFields.push('Bairro');
          }
          if (!address.cidade || address.cidade.trim() === '') {
            missingFields.push('Cidade');
          }
          if (!address.estado || address.estado.trim() === '') {
            missingFields.push('Estado');
          }
          
          if (missingFields.length > 0) {
            throw new Error(`Endereço incompleto. Preencha os seguintes campos: ${missingFields.join(', ')}.`);
          }
          
          // Log explícito para debug (conforme tutorial) - APENAS SE PASSAR VALIDAÇÃO
          console.log('📋 Dados para transação:', {
            customer: {
              name: customerData.name,
              email: customerData.email || '(não informado)',
              phone: customerData.phone || '(não informado)',
              cpf: cpfNormalized.substring(0, 3) + '***',
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
            
            // Disparar evento pix_gerado
            trackPixGerado(finalPrice, transaction.id);
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

  // Gerar novo PIX
  const handleGenerateNewPix = async () => {
    setPixCode('');
    setUmbrellaTransaction(null);
    setIsExpired(false);
    setTimeRemaining(600);
    setIsProcessing(false);
    
    // Forçar recriação da transação
    const createTransaction = async () => {
      try {
        setIsProcessing(true);
        
        const transaction = await createPixTransaction(
          customerData!,
          items,
          finalPrice,
          {
            orderId: Math.random().toString(36).substring(2, 10).toUpperCase(),
            isFirstPurchase: isFirstPurchase(),
          }
        );
        
        setUmbrellaTransaction(transaction);
        const qrCode = transaction.qrCode || transaction.pix?.qrCode || transaction.pix?.qrCodeImage || '';
        
        if (qrCode) {
          setPixCode(qrCode);
          trackPixGerado(finalPrice, transaction.id);
        }
      } catch (error: any) {
        console.error('❌ Erro ao gerar novo PIX:', error);
        toast.error('Erro ao gerar novo código PIX. Tente novamente.');
        setIsProcessing(false);
      }
    };
    
    await createTransaction();
  };

  const handleCopy = async () => {
    if (!pixCode || isExpired) return;
    
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      
      // Disparar evento pix_copiado
      trackPixCopiado(finalPrice, umbrellaTransaction?.id);
      
      // Haptic feedback no mobile (se disponível)
      if ('vibrate' in navigator) {
        navigator.vibrate(50); // Vibração curta de 50ms
      }
      
      // Feedback visual - manter por 2.5 segundos
      setTimeout(() => setCopied(false), 2500);
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

  // Prevenir scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background overflow-y-auto"
        >
          <div className="min-h-screen flex flex-col">
            {/* Header Fixo com Timer de Reserva */}
            {pixCode && !isExpired && (
              <div className="sticky top-0 z-20 bg-orange-50 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-800 px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm font-semibold text-foreground">
                    ⏳ Seu pedido está reservado por <span className="font-mono text-base text-orange-600 dark:text-orange-400">{formatTime(timeRemaining)}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-6 pb-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">Pagamento via PIX</h1>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 pb-24">
              {/* Valor */}
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-primary mb-3">
                  R$ {finalPrice.toFixed(2).replace('.', ',')}
                </p>
                <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-950/20 px-4 py-2.5 rounded-full mx-auto max-w-md border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    Pagamento seguro • Confirmação automática
                  </p>
                </div>
              </div>

              {/* Resumo do Pedido */}
              <div className="mb-4 px-4">
                <p className="text-sm text-foreground text-center">
                  <span className="font-medium">📦 {orderSummary}</span>
                  <br />
                  <span className="text-muted-foreground">
                    🚚 {hasFreeShipping ? 'Frete grátis' : `Frete: R$ ${shippingPrice.toFixed(2).replace('.', ',')}`} • Entrega para todo o Brasil
                  </span>
                </p>
              </div>


              {/* Status de expiração */}
              {isExpired && pixCode && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive font-medium text-center mb-3">
                    ⚠️ Código PIX expirado
                  </p>
                  <button
                    onClick={handleGenerateNewPix}
                    disabled={isProcessing}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: '48px' }}
                  >
                    {isProcessing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Gerando novo PIX...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        <span>Gerar novo PIX</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Loading */}
              {isProcessing && !pixCode && (
                <div className="mb-6 bg-muted rounded-xl p-8 border border-border flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"
                  />
                  <p className="text-sm text-muted-foreground">Gerando QR Code PIX...</p>
                </div>
              )}

              {/* PIX Code */}
              {pixCode && !isExpired && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2 text-center">Código PIX (Copiar e Cola)</p>
                  <div className="bg-muted/50 rounded-xl p-2.5 border border-border/50 mb-4">
                    <p className="text-[9px] font-mono break-all text-muted-foreground/70 select-all text-center leading-relaxed">
                      {pixCode}
                    </p>
                  </div>
                  
                  {/* Botão COPIAR logo abaixo do código */}
                  <button
                    onClick={handleCopy}
                    disabled={isExpired}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 mb-4 ${
                      copied 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                    style={{ minHeight: '56px' }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-6 h-6" />
                        <span>PIX COPIADO</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-6 h-6" />
                        <span>COPIAR CÓDIGO PIX</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Status de pagamento */}
              {pixCode && !isExpired && (
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
                    <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm font-semibold text-foreground">
                      ⏳ Copie o PIX e pague para confirmar seu pedido
                    </p>
                  </div>
                </div>
              )}

              {/* Instruções de pagamento */}
              {pixCode && !isExpired && (
                <div className="bg-muted/50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold mb-3">Instruções de pagamento:</p>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Abra o app do seu banco</li>
                    <li>Escolha a opção PIX</li>
                    <li>Selecione "Pix Copia e Cola"</li>
                    <li>Cole o código copiado</li>
                    <li>Confirme o pagamento</li>
                  </ol>
                </div>
              )}

              {/* Erro */}
              {!pixCode && !isProcessing && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive text-center">
                    Erro ao gerar QR Code PIX. Tente novamente.
                  </p>
                </div>
              )}
            </div>

            {/* Rodapé simplificado */}
            {pixCode && !isExpired && (
              <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-10">
                <p className="text-xs text-center text-green-600 dark:text-green-400 font-medium">
                  ✔ Após o pagamento, seu pedido será confirmado automaticamente
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
