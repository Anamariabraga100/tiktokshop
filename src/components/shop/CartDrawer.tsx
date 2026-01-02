import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ArrowLeft, Truck, Clock, Ticket, Star, CheckCircle2, FileText, Gift, QrCode, CreditCard, DollarSign } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';
import { useCustomer } from '@/context/CustomerContext';
import { useState, useMemo, useEffect } from 'react';
import { AddressModal } from './AddressModal';
import { CPFModal } from './CPFModal';
import { PixPaymentModal } from './PixPaymentModal';
import { CardPaymentModal } from './CardPaymentModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { activeCoupon, couponTimeRemaining, getApplicableCoupon, isFirstPurchase, markPurchaseCompleted, activateCoupon } = useCoupons();
  const { customerData, hasAddress, hasCPF, updateAddress, updateCPF } = useCustomer();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCPFModal, setShowCPFModal] = useState(false);
  const [postponedAddress, setPostponedAddress] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [showAddressAlert, setShowAddressAlert] = useState(false);
  const [showCPFAlert, setShowCPFAlert] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'card'>('pix');

  const freeShippingThreshold = 99;
  const missingForFreeShipping = Math.max(0, freeShippingThreshold - totalPrice);
  const freeShippingProgress = Math.min(100, (totalPrice / freeShippingThreshold) * 100);
  // Verificar se tem frete grátis da página de agradecimento
  const freeShippingFromThankYou = localStorage.getItem('freeShippingFromThankYou') === 'true';
  const hasFreeShipping = totalPrice >= freeShippingThreshold || freeShippingFromThankYou;

  // Aplicar cupom de R$5 apenas na primeira compra
  // Verificar se é primeira compra antes de aplicar
  const firstPurchaseDiscount = items.length > 0 && isFirstPurchase() ? 5 : 0;
  
  // Outros cupons percentuais são aplicados se ativos
  const applicableCoupon = getApplicableCoupon(totalPrice);
  const otherCouponDiscount = applicableCoupon && applicableCoupon.id !== '4'
    ? (totalPrice * applicableCoupon.discountPercent) / 100
    : 0;
  
  // Total de desconto de cupons (R$5 fixo + outros cupons)
  const couponDiscount = firstPurchaseDiscount + otherCouponDiscount;
  const priceAfterCoupon = totalPrice - couponDiscount;
  
  // PIX tem 10% de desconto adicional
  const pixDiscount = selectedPaymentMethod === 'pix' ? priceAfterCoupon * 0.1 : 0;
  const priceAfterPix = priceAfterCoupon - pixDiscount;

  // Calculate original total and savings
  const originalTotal = items.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  const productDiscount = originalTotal - totalPrice;
  const totalSavings = productDiscount + couponDiscount + pixDiscount;

  const formatCouponTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calcular previsão de entrega (5-7 dias úteis) e frete
  const { deliveryInfo, shippingPrice, formattedShippingPrice } = useMemo(() => {
    if (!hasAddress) {
      return { deliveryInfo: null, shippingPrice: 0, formattedShippingPrice: '0,00' };
    }

    // Calcular intervalo de entrega (5-7 dias úteis a partir de hoje)
    const today = new Date();
    const minDays = 5;
    const maxDays = 7;
    
    // Calcular data mínima (5 dias úteis)
    let minDaysAdded = 0;
    let minCount = 0;
    while (minDaysAdded < minDays && minCount < 20) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + minCount);
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        minDaysAdded++;
      }
      minCount++;
    }
    
    // Calcular data máxima (7 dias úteis)
    let maxDaysAdded = 0;
    let maxCount = 0;
    while (maxDaysAdded < maxDays && maxCount < 20) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + maxCount);
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        maxDaysAdded++;
      }
      maxCount++;
    }
    
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minCount);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxCount);
    
    const minDay = minDate.getDate();
    const maxDay = maxDate.getDate();
    const monthName = maxDate.toLocaleDateString('pt-BR', { month: 'long' });
    const month = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    // Calcular frete
    const price = hasFreeShipping ? 0 : (10.80 + Math.random() * (18.90 - 10.80));
    const formatted = price.toFixed(2).replace('.', ',');
    
    return {
      deliveryInfo: { minDay, maxDay, month, minDate, maxDate },
      shippingPrice: price,
      formattedShippingPrice: formatted
    };
  }, [hasAddress, hasFreeShipping]);

  // Calcular preço final incluindo frete
  const finalPrice = priceAfterPix + shippingPrice;

  const handleCheckout = () => {
    if (!hasAddress) {
      setShowAddressAlert(true);
      return;
    }
    
    if (!hasCPF) {
      setShowCPFAlert(true);
      return;
    }
    
    // Abrir modal baseado no método selecionado
    if (selectedPaymentMethod === 'pix') {
      console.log('Abrindo modal PIX');
      setShowPixModal(true);
    } else {
      setShowCardModal(true);
    }
  };

  const handlePaymentComplete = () => {
    // Marcar compra como concluída se for primeira compra
    if (isFirstPurchase()) {
      markPurchaseCompleted();
    }
    // Toast será mostrado pelo modal de pagamento
    clearCart();
    onClose();
  };

  const handleAddressLater = () => {
    setShowAddressModal(false);
    setShowAddressAlert(false);
    setPostponedAddress(true);
  };

  const handleAddAddressFromAlert = () => {
    setShowAddressAlert(false);
    setShowAddressModal(true);
  };

  const handleAddCPFFromAlert = () => {
    setShowCPFAlert(false);
    setShowCPFModal(true);
  };

  const handleAddAddress = () => {
    setShowAddressModal(false);
    // O endereço já foi salvo pelo contexto no AddressModal
    // Adicionar pequeno delay para evitar sobreposição com outras notificações
    setTimeout(() => {
      toast.success('Endereço adicionado com sucesso!', { id: 'address-added' });
    }, 100);
  };

  const handleCloseAttempt = () => {
    if (items.length > 0) {
      setPendingClose(true);
      setShowExitModal(true);
    } else {
      onClose();
    }
  };

  const handleFinalizePurchase = () => {
    setShowExitModal(false);
    setPendingClose(false);
    // Fecha o modal e mantém o carrinho aberto para finalizar a compra
    // O usuário pode então clicar em "Fazer pedido"
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    setPendingClose(false);
    onClose();
  };

  // Find the best selling item to show as "Melhor escolha"
  const bestItem = items.length > 0 ? items.reduce((best, item) => 
    (item.soldCount || 0) > (best.soldCount || 0) ? item : best
  ) : null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAttempt}
              className="fixed inset-0 bg-foreground/50 z-50"
            />

            {/* Drawer - Full Screen Style */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 top-0 bg-card z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseAttempt}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold">Resumo do pedido</h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      Finalização da compra segura garantida
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Truck className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Seu carrinho está vazio</h3>
                    <p className="text-muted-foreground mb-6">Descubra ofertas incríveis e adicione itens ao seu carrinho</p>
                    <button
                      onClick={onClose}
                      className="px-8 py-4 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold"
                    >
                      Começar a comprar
                    </button>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {/* Address and CPF Buttons */}
                    <div className="space-y-3">
                      {!hasAddress && (
                        <button
                          onClick={() => setShowAddressModal(true)}
                          className="w-full p-4 bg-muted rounded-xl border border-border hover:bg-muted/80 transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">+ Adicionar endereço de entrega</span>
                        </button>
                      )}
                      {hasAddress && customerData?.address && (
                        <div className="w-full p-4 bg-success/10 rounded-xl border border-success/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-success" />
                            <span className="text-sm font-medium text-success">
                              {customerData.address.rua}, {customerData.address.numero} - {customerData.address.bairro}
                            </span>
                          </div>
                          <button
                            onClick={() => setShowAddressModal(true)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Alterar
                          </button>
                        </div>
                      )}
                      
                      {!hasCPF && (
                        <button
                          onClick={() => setShowCPFModal(true)}
                          className="w-full p-4 bg-muted rounded-xl border border-border hover:bg-muted/80 transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">+ Adicionar CPF</span>
                        </button>
                      )}
                      {hasCPF && customerData?.cpf && (
                        <div className="w-full p-4 bg-success/10 rounded-xl border border-success/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-success" />
                            <span className="text-sm font-medium text-success">CPF: {customerData.cpf}</span>
                          </div>
                          <button
                            onClick={() => setShowCPFModal(true)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Alterar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Free Shipping Progress */}
                    {!hasFreeShipping && (
                      <div className="bg-card rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-semibold">
                            Falta R$ {missingForFreeShipping.toFixed(2).replace('.', ',')} para frete grátis!
                          </span>
                        </div>
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <div 
                            className="h-full bg-gradient-to-r from-success to-success/80 transition-all duration-500 rounded-full flex items-center justify-center"
                            style={{ width: `${freeShippingProgress}%` }}
                          >
                            {freeShippingProgress > 20 && (
                              <span className="text-[9px] font-bold text-white">
                                {Math.round(freeShippingProgress)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[10px] text-muted-foreground">R$ 0</span>
                          <span className="text-[10px] text-muted-foreground">R$ {freeShippingThreshold.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    )}

                    {hasFreeShipping && (
                      <div className="bg-success/10 rounded-xl border border-success/20 p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                          <span className="text-sm font-semibold text-success">
                            🎉 Parabéns! Você ganhou frete grátis!
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Product Section */}
                    <div className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold">A Melhor Escolha De Compras</h3>
                        <button className="text-xs text-muted-foreground hover:text-foreground">
                          Adicionar nota &gt;
                        </button>
                      </div>

                      {items.map((item, index) => {
                        const isBestChoice = bestItem?.id === item.id && !item.isGift;
                        const itemOriginalPrice = item.originalPrice || item.price;
                        const itemDiscount = itemOriginalPrice - item.price;
                        const itemDiscountPercent = itemOriginalPrice > 0 
                          ? Math.round((itemDiscount / itemOriginalPrice) * 100) 
                          : 0;
                        const isGift = item.isGift;

                        return (
                          <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className={index > 0 ? 'mt-4 pt-4 border-t border-border' : ''}>
                            {isBestChoice && (
                              <div className="flex items-center gap-1 mb-2 text-warning">
                                <Star className="w-4 h-4 fill-warning" />
                                <span className="text-xs font-medium">
                                  Melhor escolha! {item.soldCount?.toLocaleString() || 0} vendido(s) e com nota {item.rating}/5,0
                                </span>
                              </div>
                            )}

                            {isGift && (
                              <div className="flex items-center gap-1 mb-2 text-success">
                                <Gift className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  🎁 Brinde grátis em compras acima de R$100
                                </span>
                              </div>
                            )}

                            <div className="flex gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium mb-2 line-clamp-2">{item.name}</h4>
                                
                                {/* Variantes selecionadas - discreto */}
                                {(item.selectedColor || item.selectedSize) && (
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {item.selectedColor && (
                                      <span className="text-xs text-muted-foreground">
                                        Cor: <span className="font-medium text-foreground">{item.selectedColor}</span>
                                      </span>
                                    )}
                                    {item.selectedSize && (
                                      <span className="text-xs text-muted-foreground">
                                        {item.selectedColor && ' • '}Tamanho: <span className="font-medium text-foreground">{item.selectedSize}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {isGift && (
                                    <span className="text-xs px-2 py-0.5 bg-success/20 text-success rounded font-semibold">
                                      🎁 Brinde Grátis
                                    </span>
                                  )}
                                  {!isGift && item.isHotDeal && (
                                    <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded font-semibold">
                                      Oferta Relâmpago
                                    </span>
                                  )}
                                  {!isGift && (
                                    <span className="text-xs px-2 py-0.5 bg-muted text-foreground rounded">
                                      Devolução gratuita
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                  {isGift ? (
                                    <span className="text-base font-bold text-success">
                                      Grátis
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-base font-bold text-foreground">
                                        R$ {item.price.toFixed(2).replace('.', ',')}
                                      </span>
                                      {item.originalPrice && item.originalPrice > item.price && (
                                        <>
                                          <span className="text-xs text-muted-foreground line-through">
                                            R$ {item.originalPrice.toFixed(2).replace('.', ',')}
                                          </span>
                                          <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded font-semibold">
                                            -{itemDiscountPercent}%
                                          </span>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  {!isGift ? (
                                    <>
                                      <div className="flex items-center gap-2 border border-border rounded-lg">
                                        <button
                                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                          className="p-1.5 hover:bg-muted transition-colors"
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                        <button
                                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                          className="p-1.5 hover:bg-muted transition-colors"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">
                                      Brinde adicionado automaticamente
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Shipping Information */}
                    {hasAddress && deliveryInfo && (
                      <div className="bg-card rounded-xl border border-border p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Truck className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-sm font-semibold">
                                  Receba de {deliveryInfo.minDay} a {deliveryInfo.maxDay} de {deliveryInfo.month}
                                </p>
                                <p className="text-xs text-muted-foreground">Envio Padrão</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {hasFreeShipping ? (
                                <span className="text-sm font-bold text-success">Grátis</span>
                              ) : (
                                <span className="text-sm font-bold">R$ {formattedShippingPrice}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TikTok Shop Discount */}
                    {(firstPurchaseDiscount > 0 || otherCouponDiscount > 0) && (
                      <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Desconto do TikTok Shop</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-success">- R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                            <span className="text-muted-foreground">&gt;</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-card rounded-xl border border-border p-4">
                      <h3 className="text-base font-semibold mb-4">Resumo do pedido</h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal do produto ^</span>
                          <span className="font-medium">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                        
                        {originalTotal > totalPrice && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Preço original</span>
                              <span className="text-muted-foreground line-through">R$ {originalTotal.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between text-success">
                              <span>Desconto no produto</span>
                              <span className="font-medium">- R$ {productDiscount.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </>
                        )}
                        
                        {/* Cupom de R$5 sempre aparece quando houver itens */}
                        {items.length > 0 && (
                          <div className="flex justify-between text-success">
                            <span>Cupom de Primeira Compra</span>
                            <span className="font-medium">- R$ 5,00</span>
                          </div>
                        )}
                        
                        {/* Outros cupons percentuais */}
                        {applicableCoupon && applicableCoupon.id !== '4' && (
                          <div className="flex justify-between text-success">
                            <span>Cupons do TikTok Shop - {applicableCoupon.description.split(' ')[0]}</span>
                            <span className="font-medium">- R$ {otherCouponDiscount.toFixed(2).replace('.', ',')}</span>
                          </div>
                        )}
                        
                        {selectedPaymentMethod === 'pix' && pixDiscount > 0 && (
                          <div className="flex justify-between text-success">
                            <span>Desconto PIX (10%)</span>
                            <span className="font-medium">- R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                          </div>
                        )}

                        {/* Frete */}
                        {hasAddress && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frete</span>
                            <span className="font-medium">
                              {hasFreeShipping ? (
                                <span className="text-success">Grátis</span>
                              ) : (
                                <>R$ {formattedShippingPrice}</>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-base font-semibold">Total</span>
                          <span className="text-xl font-bold">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Impostos inclusos</p>
                      </div>

                      {totalSavings > 0 && (
                        <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-sm font-medium text-primary flex items-center gap-1">
                            😊 Você está economizando R$ {totalSavings.toFixed(2).replace('.', ',')} nesse pedido.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Payment Method Selection */}
                    <div className="bg-card rounded-xl border border-border p-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">Método de pagamento</h3>
                        {selectedPaymentMethod === 'pix' && pixDiscount > 0 && (
                          <span className="text-xs text-success font-medium">
                            Economize R$ {pixDiscount.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {/* PIX Option - Selected by default */}
                        <button
                          onClick={() => setSelectedPaymentMethod('pix')}
                          className={`w-full p-3 border-2 rounded-xl transition-all text-left ${
                            selectedPaymentMethod === 'pix'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                selectedPaymentMethod === 'pix' ? 'bg-primary/20' : 'bg-muted'
                              }`}>
                                <QrCode className={`w-5 h-5 ${selectedPaymentMethod === 'pix' ? 'text-primary' : 'text-foreground'}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">PIX</span>
                                  <span className="bg-success text-success-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    10% OFF
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">Aprovação imediata</p>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedPaymentMethod === 'pix'
                                ? 'border-primary bg-primary'
                                : 'border-border'
                            }`}>
                              {selectedPaymentMethod === 'pix' && (
                                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Card Option - Discreet */}
                        <button
                          onClick={() => setSelectedPaymentMethod('card')}
                          className={`w-full p-2.5 border rounded-lg transition-all text-left ${
                            selectedPaymentMethod === 'card'
                              ? 'border-primary bg-primary/5'
                              : 'border-border/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CreditCard className={`w-4 h-4 ${selectedPaymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`text-xs ${selectedPaymentMethod === 'card' ? 'font-semibold' : 'text-muted-foreground'}`}>
                                Cartão de Crédito
                              </span>
                            </div>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              selectedPaymentMethod === 'card'
                                ? 'border-primary bg-primary'
                                : 'border-border'
                            }`}>
                              {selectedPaymentMethod === 'card' && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Button */}
              {items.length > 0 && (
                <div className="border-t border-border bg-card px-4" style={{ paddingTop: '1rem', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    className="w-full py-4 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold text-base"
                  >
                    Fazer pedido
                  </motion.button>
                  
                  {activeCoupon && couponTimeRemaining && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      O cupom para novos clientes expira em {formatCouponTime(couponTimeRemaining)}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={handleAddressLater}
        onAddAddress={handleAddAddress}
      />

      {/* CPF Modal */}
      <CPFModal
        isOpen={showCPFModal}
        onClose={() => setShowCPFModal(false)}
        onAddCPF={() => {
          // O CPF já foi salvo pelo contexto no CPFModal
          setShowCPFModal(false);
          toast.success('CPF adicionado com sucesso!', { id: 'cpf-added-cart' });
        }}
      />

      {/* Exit Confirmation Modal - Versão Simplificada */}
      <AlertDialog 
        open={showExitModal} 
        onOpenChange={(open) => {
          if (!open) {
            setShowExitModal(false);
            setPendingClose(false);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl p-6 max-w-sm">
          {/* Botão X no canto superior direito */}
          <button
            onClick={handleExitConfirm}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          <AlertDialogHeader className="text-center space-y-6 pt-2">
            {/* Ícone simples */}
            <div className="flex justify-center items-center my-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-tiktok-pink/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-10 h-10 text-primary" />
                </div>
              </div>
            </div>

            {/* Texto principal */}
            <div className="space-y-4">
              <AlertDialogTitle className="text-base font-normal text-foreground leading-tight">
                Você está economizando R$
              </AlertDialogTitle>
              
              {/* Valor do desconto total em destaque */}
              {totalSavings > 0 ? (
                <div className="space-y-2">
                  <p className="text-5xl md:text-6xl font-bold text-destructive leading-none">
                    {totalSavings.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {productDiscount > 0 && `R$ ${productDiscount.toFixed(2).replace('.', ',')} em produtos`}
                    {productDiscount > 0 && couponDiscount > 0 && ' • '}
                    {couponDiscount > 0 && `R$ ${couponDiscount.toFixed(2).replace('.', ',')} em cupons`}
                    {pixDiscount > 0 && (productDiscount > 0 || couponDiscount > 0) && ' • '}
                    {pixDiscount > 0 && `R$ ${pixDiscount.toFixed(2).replace('.', ',')} no PIX`}
                  </p>
                </div>
              ) : couponDiscount > 0 ? (
                <div className="space-y-2">
                  <p className="text-5xl md:text-6xl font-bold text-destructive leading-none">
                    {couponDiscount.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Com cupons disponíveis
                  </p>
                </div>
              ) : productDiscount > 0 ? (
                <div className="space-y-2">
                  <p className="text-5xl md:text-6xl font-bold text-destructive leading-none">
                    {productDiscount.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Em descontos de produtos
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-5xl md:text-6xl font-bold text-primary leading-none">
                    {totalPrice.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Finalize sua compra agora
                  </p>
                </div>
              )}
              
              {/* Mensagem persuasiva adicional */}
              {totalSavings > 0 && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Não perca essa oportunidade! Finalize agora e aproveite todos esses descontos.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogHeader>

          {/* Botões */}
          <div className="flex flex-col gap-3 pt-6 pb-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFinalizePurchase}
              className="w-full rounded-full bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-white py-5 text-base font-bold shadow-lg transition-all relative overflow-hidden"
            >
              <span className="relative z-10">Finalizar compra e economizar R$ {totalSavings > 0 ? totalSavings.toFixed(2).replace('.', ',') : 'agora'}</span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </motion.button>
            <button
              onClick={handleExitConfirm}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Não, obrigado
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Address Alert Dialog */}
      <AlertDialog 
        open={showAddressAlert} 
        onOpenChange={setShowAddressAlert}
      >
        <AlertDialogContent className="rounded-3xl p-6 max-w-sm">
          <AlertDialogHeader className="text-center space-y-3">
            <AlertDialogTitle className="text-lg font-semibold">
              Adicionar endereço de entrega
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Sua conta não tem um endereço de envio, adicione um para prosseguir com a finalização da compra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 pt-4">
            <AlertDialogAction 
              onClick={handleAddAddressFromAlert} 
              className="w-full rounded-full bg-gradient-to-r from-tiktok-pink to-primary py-3 text-base font-semibold"
            >
              Adicionar
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={handleAddressLater} 
              className="w-full rounded-full border-2 py-3 text-base font-medium"
            >
              Mais tarde
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CPF Alert Dialog */}
      <AlertDialog 
        open={showCPFAlert} 
        onOpenChange={setShowCPFAlert}
      >
        <AlertDialogContent className="rounded-3xl p-6 max-w-sm">
          <AlertDialogHeader className="text-center space-y-3">
            <AlertDialogTitle className="text-lg font-semibold">
              Adicionar CPF
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              É necessário informar o CPF para prosseguir com a finalização da compra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 pt-4">
            <AlertDialogAction 
              onClick={handleAddCPFFromAlert} 
              className="w-full rounded-full bg-gradient-to-r from-tiktok-pink to-primary py-3 text-base font-semibold"
            >
              Adicionar CPF
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={() => setShowCPFAlert(false)} 
              className="w-full rounded-full border-2 py-3 text-base font-medium"
            >
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PIX Payment Modal */}
      <PixPaymentModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Card Payment Modal */}
      <CardPaymentModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
      />
    </>
  );
};
