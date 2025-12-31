import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCoupons } from '@/context/CouponContext';
import { Ticket } from 'lucide-react';

interface ExitCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCouponSelected: () => void;
}

export const ExitCouponModal = ({ isOpen, onClose, onCouponSelected }: ExitCouponModalProps) => {
  const { coupons, activateCoupon } = useCoupons();
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

  const handleSelectCoupon = (couponId: string) => {
    setSelectedCouponId(couponId);
  };

  const handleConfirm = () => {
    if (!selectedCouponId) {
      toast.error('Por favor, selecione um cupom');
      return;
    }
    activateCoupon(selectedCouponId);
    toast.success('Cupom ativado! Você tem 15 minutos para usar.');
    onCouponSelected();
    onClose();
  };

  const handleDecline = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[80] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Gift Icon */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-tiktok-pink/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <Gift className="w-10 h-10 text-primary" />
                  <Sparkles className="w-6 h-6 text-tiktok-pink absolute -top-1 -right-1 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Você ganhou um cupom!
                </h2>
                <p className="text-muted-foreground">
                  Escolha um dos cupons abaixo antes de sair
                </p>
              </div>

              {/* Coupons List */}
              <div className="space-y-3 mb-6">
                {coupons.map((coupon) => (
                  <motion.button
                    key={coupon.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectCoupon(coupon.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedCouponId === coupon.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Ticket className="w-5 h-5 text-primary" />
                          <span className="text-xl font-bold text-primary">
                            {coupon.discountPercent}% OFF
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {coupon.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Código: <span className="font-mono font-medium">{coupon.code}</span>
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedCouponId === coupon.id
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}>
                        {selectedCouponId === coupon.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleDecline}
                  className="flex-1 py-3 border-2 border-border rounded-full font-semibold hover:bg-muted transition-colors"
                >
                  Não, obrigado
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
                >
                  Ativar Cupom
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


