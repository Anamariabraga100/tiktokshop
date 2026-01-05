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
import { trackPixGerado, trackPixCopiado, trackPurchase } from '@/lib/facebookPixel';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export const PixPaymentModal = ({ isOpen, onClose, onPaymentComplete }: PixPaymentModalProps) => {
  const { totalPrice, items } = useCart();
  const { getApplicableCoupon, isFirstPurchase, markPurchaseCompleted } = useCoupons();
  const { customerData, hasAddress } = useCustomer();
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixCode, setPixCode] = useState<string>('');
  const [umbrellaTransaction, setUmbrellaTransaction] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null); // ✂️ CORTE 2: Usar orderId no polling
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutos em segundos
  const [isExpired, setIsExpired] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(''); // Mensagem de status dinâmica
  const [isPolling, setIsPolling] = useState<boolean>(false); // Indica se está fazendo polling
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pixGeneratedAtRef = useRef<number | null>(null); // Timestamp quando PIX foi gerado
  const isPaidRef = useRef<boolean>(false); // Ref para rastrear se foi pago (evita problemas de closure)
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

  // Calcular frete grátis (threshold R$ 50 OU produto com freeShipping)
  const freeShippingThreshold = 50;
  const freeShippingFromThankYou = localStorage.getItem('freeShippingFromThankYou') === 'true' && safeTotalPrice >= freeShippingThreshold;
  // ✅ Verificar se algum produto no carrinho tem frete grátis
  const hasProductWithFreeShipping = items.some(item => item.freeShipping === true);
  const hasFreeShipping = safeTotalPrice >= freeShippingThreshold || freeShippingFromThankYou || hasProductWithFreeShipping;
  // ✅ Mostrar frete apenas depois de preencher informações de entrega
  const shippingPrice = hasAddress ? (hasFreeShipping ? 0 : 7.90) : 0;
  
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
      isPaidRef.current = false; // Resetar ref de pagamento
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
            // Limpar polling quando expirar
            if (pollingRef.current) {
              clearTimeout(pollingRef.current);
              pollingRef.current = null;
            }
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

  // Polling para verificar status do pagamento
  useEffect(() => {
    // Limpar polling anterior
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }

    // ✂️ CORTE 1: Polling só no banco - SEM gateway
    // Só fazer polling se:
    // - Modal estiver aberto
    // - orderId disponível (chave primária lógica)
    // - Não expirou
    // - Ainda não foi pago (verificar ref)
    if (!isOpen || !orderId || isExpired || isPaidRef.current) {
      console.log('⏸️ Polling não iniciado:', {
        isOpen,
        hasOrderId: !!orderId,
        isExpired,
        isPaid: isPaidRef.current
      });
    }

    if (isOpen && orderId && !isExpired && !isPaidRef.current) {
      console.log('🔄 Iniciando polling para verificar pagamento (SOMENTE banco)...', {
        orderId: orderId,
        pixGeneratedAt: pixGeneratedAtRef.current ? new Date(pixGeneratedAtRef.current).toISOString() : 'não definido'
      });

      const checkPaymentStatus = async () => {
        try {
          setIsPolling(true);
          setStatusMessage('Aguardando confirmação do pagamento...');
          
          const apiUrl = import.meta.env.VITE_API_URL || '/api';
          console.log(`🔍 Verificando status do pagamento: ${apiUrl}/pix?orderId=${orderId}`);
          
          const response = await fetch(`${apiUrl}/pix?orderId=${orderId}`);
          
          if (!response.ok) {
            console.warn('⚠️ Erro ao verificar status do pagamento:', response.status);
            setStatusMessage('Verificando pagamento...');
            setIsPolling(false);
            return;
          }

          const result = await response.json();
          console.log('📊 Resultado da verificação (banco):', {
            success: result.success,
            isPaid: result.isPaid,
            isExpired: result.isExpired,
            status: result.status,
            orderId: orderId
          });
          
          // Verificar se expirou
          if (result.isExpired) {
            console.log('⏰ PIX expirado');
            setIsExpired(true);
            setStatusMessage('Código PIX expirado. Gere um novo código.');
            setIsPolling(false);
            return;
          }
          
          if (result.success && result.isPaid) {
            console.log('✅ Pagamento confirmado via polling!');
            setIsPaid(true);
            isPaidRef.current = true; // Marcar no ref também
            setStatusMessage('✅ Pagamento confirmado! Redirecionando...');
            setIsPolling(false);
            
            // Limpar polling
            if (pollingRef.current) {
              clearTimeout(pollingRef.current);
              pollingRef.current = null;
            }
            
            // Disparar Purchase para Facebook Pixel (usando orderId como event_id)
            try {
              const regularItems = items.filter(item => !item.isGift);
              const contents = regularItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                item_price: item.price,
              }));
              
              const nameParts = customerData?.name?.trim().split(/\s+/) || [];
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              // Usar orderId como event_id (Facebook deduplica automaticamente)
              trackPurchase(
                orderId, // ✅ Usar orderId como event_id
                finalPrice,
                regularItems.reduce((sum, item) => sum + item.quantity, 0),
                contents,
                {
                  email: customerData?.email,
                  phone: customerData?.phone,
                  name: customerData?.name,
                  firstName: firstName,
                  lastName: lastName,
                  cpf: customerData?.cpf,
                  externalId: customerData?.cpf?.replace(/\D/g, ''),
                  address: customerData?.address ? {
                    cidade: customerData.address.cidade,
                    estado: customerData.address.estado,
                    cep: customerData.address.cep,
                    country: 'br',
                  } : undefined,
                }
              );
              
              console.log('✅ Purchase disparado via polling com orderId:', orderId);
            } catch (pixelError: any) {
              // Ignorar erros de AdBlock (ERR_BLOCKED_BY_CLIENT)
              if (pixelError?.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
                  pixelError?.message?.includes('blocked')) {
                console.warn('⚠️ Facebook Pixel bloqueado por AdBlock (ignorado)');
              } else {
                console.error('❌ Erro ao disparar Purchase:', pixelError);
              }
              // Não falhar o fluxo por causa do Pixel
            }
            
            // Marcar compra como concluída
            if (isFirstPurchase()) {
              markPurchaseCompleted();
            }
            
            // Mostrar toast de sucesso
            toast.success('Pagamento confirmado! Redirecionando...', { 
              id: 'payment-confirmed',
              duration: 3000 
            });
            
            // Redirecionar para página de agradecimento após 2 segundos
            // ✅ Usar query string em vez de state (não quebra em refresh)
            setTimeout(() => {
              try {
                const orderIdParam = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
                navigate(`/thank-you${orderIdParam}`);
                onPaymentComplete();
              } catch (error) {
                console.error('Erro ao navegar:', error);
                const orderIdParam = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
                window.location.href = `/thank-you${orderIdParam}`;
              }
            }, 2000);
          }
        } catch (error) {
          console.error('❌ Erro ao verificar status do pagamento:', error);
          console.error('❌ Detalhes do erro:', {
            message: error instanceof Error ? error.message : String(error),
            orderId: orderId
          });
          setStatusMessage('Verificando pagamento...');
          setIsPolling(false);
          // Não parar o polling por causa de um erro temporário
        } finally {
          // Garantir que isPolling seja resetado
          setIsPolling(false);
        }
      };

      // Intervalo fixo de 7-8 segundos (recomendado)
      const POLLING_INTERVAL = 7500; // 7.5 segundos (média entre 7-8s)

      // Função recursiva para polling com intervalo fixo
      const scheduleNextCheck = () => {
        if (pollingRef.current) {
          clearTimeout(pollingRef.current);
        }

        console.log(`⏱️ Próxima verificação em ${POLLING_INTERVAL / 1000}s`);
        pollingRef.current = setTimeout(() => {
          // Verificar se ainda deve continuar o polling (usar ref para evitar problemas de closure)
          if (!isOpen || !orderId || isExpired || isPaidRef.current) {
            pollingRef.current = null;
            setIsPolling(false);
            return;
          }
          
          checkPaymentStatus().then(() => {
            // Só agendar próxima verificação se ainda não foi pago (verificar ref)
            if (!isPaidRef.current) {
              scheduleNextCheck();
            }
          }).catch(() => {
            // Em caso de erro, agendar próxima verificação mesmo assim (se ainda não foi pago)
            if (!isPaidRef.current) {
              scheduleNextCheck();
            }
          });
        }, POLLING_INTERVAL);
      };

      // Verificar imediatamente
      checkPaymentStatus().then(() => {
        // Só agendar próxima verificação se ainda não foi pago (verificar ref)
        if (!isPaidRef.current) {
          scheduleNextCheck();
        }
      }).catch(() => {
        // Em caso de erro, agendar mesmo assim (se ainda não foi pago)
        if (!isPaidRef.current) {
          scheduleNextCheck();
        }
      });
    }

    return () => {
      if (pollingRef.current) {
        console.log('🧹 Limpando polling...');
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, orderId, isExpired, items, finalPrice, customerData, isFirstPurchase, markPurchaseCompleted, navigate, onPaymentComplete]);

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
            orderId: transaction.orderId,
            status: transaction.status,
            hasQrCode: !!(transaction.qrCode || transaction.pix?.qrCode),
          });
          
          setUmbrellaTransaction(transaction);
          
          // ✂️ CORTE 2: Armazenar orderId para polling
          if (transaction.orderId) {
            setOrderId(transaction.orderId);
            console.log('✅ OrderId armazenado para polling:', transaction.orderId);
          }
          
          // Obter QR Code PIX (pode estar em diferentes campos)
          const qrCode = transaction.qrCode || transaction.pix?.qrCode || transaction.pix?.qrCodeImage || '';
          
          if (qrCode) {
            setPixCode(qrCode);
            pixGeneratedAtRef.current = Date.now(); // Marcar quando PIX foi gerado
            console.log('✅ QR Code obtido com sucesso', {
              timestamp: new Date(pixGeneratedAtRef.current).toISOString(),
              orderId: transaction.orderId
            });
            
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
    // Limpar polling anterior
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    
    setPixCode('');
    setUmbrellaTransaction(null);
    setOrderId(null); // Resetar orderId
    setIsExpired(false);
    setIsPaid(false);
    setStatusMessage(''); // Resetar mensagem
    setIsPolling(false); // Resetar polling
    isPaidRef.current = false; // Resetar ref
    pixGeneratedAtRef.current = null; // Resetar timestamp
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
      // ✅ Usar query string em vez de state (não quebra em refresh)
      setTimeout(() => {
        try {
          const orderIdParam = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
          navigate(`/thank-you${orderIdParam}`);
        } catch (error) {
          console.error('Erro ao navegar:', error);
          // Fallback: usar window.location se navigate falhar
          const orderIdParam = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
          window.location.href = `/thank-you${orderIdParam}`;
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
                    🚚 {!hasAddress ? 'Preencha o endereço para calcular o frete' : hasFreeShipping ? 'Frete grátis' : `Frete: R$ ${shippingPrice.toFixed(2).replace('.', ',')}`} • Entrega para todo o Brasil
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

              {/* Status de pagamento - Mensagem dinâmica */}
              {pixCode && !isExpired && !isPaid && (
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-3 rounded-full">
                    {isPolling ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full"
                      />
                    ) : (
                      <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    )}
                    <p className="text-sm font-semibold text-foreground">
                      {statusMessage || 'Aguardando confirmação do pagamento...'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Assim que o PIX for pago, seu pedido será confirmado automaticamente.
                  </p>
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
