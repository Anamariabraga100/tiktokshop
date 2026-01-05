import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, QrCode, Check, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPayment: (method: 'pix' | 'card') => void;
}

export const PaymentMethodModal = ({ isOpen, onClose, onSelectPayment }: PaymentMethodModalProps) => {
  const { totalPrice } = useCart();
  const { getApplicableCoupon } = useCoupons();

  // Calcular valores
  const applicableCoupon = getApplicableCoupon(totalPrice);
  const couponDiscount = applicableCoupon ? (totalPrice * applicableCoupon.discountPercent) / 100 : 0;
  const priceAfterCoupon = totalPrice - couponDiscount;
  
  // PIX não tem desconto adicional
  const pixDiscount = 0;
  const pixPrice = priceAfterCoupon;
  const cardPrice = priceAfterCoupon;

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
            className="fixed inset-0 bg-foreground/60 z-[70]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Escolha o método de pagamento</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 mb-6">
                {/* PIX Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectPayment('pix')}
                  className="w-full p-4 border-2 border-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-all relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">PIX</span>
                          <span className="bg-success text-success-foreground text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Recomendado
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Aprovação imediata</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        R$ {pixPrice.toFixed(2).replace('.', ',')}
                      </p>
                      {pixDiscount > 0 && (
                        <p className="text-xs text-success">
                          Economize R$ {pixDiscount.toFixed(2).replace('.', ',')}
                        </p>
                      )}
                    </div>
                  </div>
                  {pixDiscount > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary/20">
                    <p className="text-xs text-muted-foreground">
                      <span className="line-through">R$ {cardPrice.toFixed(2).replace('.', ',')}</span>
                      {' '}→ <span className="font-semibold text-success">10% OFF</span>
                    </p>
                  </div>
                  )}
                </motion.button>

                {/* Card Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectPayment('card')}
                  className="w-full p-4 border-2 border-border rounded-xl hover:bg-muted transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-foreground" />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold">Cartão de Crédito</span>
                        <p className="text-xs text-muted-foreground">Parcelamento em até 12x</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        R$ {cardPrice.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Desconto (Cupom)</span>
                      <span className="font-medium">- R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold text-primary">
                        R$ {cardPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Com PIX: <span className="font-semibold text-success">
                        R$ {pixPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="w-full py-3 border-2 border-border rounded-full font-semibold hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

