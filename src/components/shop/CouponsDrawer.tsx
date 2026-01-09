import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Clock, CheckCircle2 } from 'lucide-react';
import { useCoupons } from '@/context/CouponContext';
import { toast } from 'sonner';

interface CouponsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CouponsDrawer = ({ isOpen, onClose }: CouponsDrawerProps) => {
  const { coupons, activeCoupon, activateCoupon, couponTimeRemaining } = useCoupons();

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleActivate = (couponId: string) => {
    activateCoupon(couponId);
    toast.success('Cupom ativado! Você tem 15 minutos para usar.', { id: 'coupon-activated' });
    onClose();
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
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="sticky top-0 bg-card pt-3 pb-2 z-10">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Meus Cupons</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Coupon Warning */}
            {activeCoupon && couponTimeRemaining && (
              <div className="mx-4 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <div className="flex items-center gap-2 text-destructive">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {activeCoupon.id === '2' || activeCoupon.code === 'DESCONTO12'
                      ? 'O desconto está expirando'
                      : activeCoupon.discountPercent > 0 
                        ? `O cupom de ${activeCoupon.discountPercent}% de desconto está expirando`
                        : 'O cupom está expirando'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-destructive mt-1">
                  {formatTime(couponTimeRemaining)}
                </div>
              </div>
            )}

            {/* Coupons List */}
            <div className="p-4 space-y-3">
              {coupons.filter((coupon) => coupon.id !== '4').map((coupon) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative overflow-hidden rounded-xl border-2 ${
                    coupon.isActivated
                      ? 'border-success bg-success/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  {/* Dashed line decoration */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-tiktok-cyan" />
                  
                  <div className="p-4 pl-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold text-primary">
                            {coupon.discountPercent > 0 ? `${coupon.discountPercent}% OFF` : 'Cupom'}
                          </span>
                          {coupon.isActivated && (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {coupon.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Código: <span className="font-mono font-medium">{coupon.code}</span>
                        </p>
                      </div>
                      
                      {!coupon.isActivated ? (
                        <button
                          onClick={() => handleActivate(coupon.id)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                          Ativar
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-semibold">
                          Ativado
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Vouchers Section */}
            <div className="px-4 pb-8">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                🎟️ Vouchers Disponíveis
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-r from-tiktok-pink/10 to-primary/10 rounded-xl border border-primary/20">
                  <p className="text-lg font-bold text-primary">R$5 OFF</p>
                  <p className="text-xs text-muted-foreground">Primeira compra</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-tiktok-cyan/10 to-success/10 rounded-xl border border-success/20">
                  <p className="text-lg font-bold text-success">Frete Grátis</p>
                  <p className="text-xs text-muted-foreground">Sempre grátis</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
