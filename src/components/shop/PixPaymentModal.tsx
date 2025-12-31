import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export const PixPaymentModal = ({ isOpen, onClose, onPaymentComplete }: PixPaymentModalProps) => {
  const { totalPrice } = useCart();
  const { getApplicableCoupon } = useCoupons();
  const [copied, setCopied] = useState(false);

  // Calcular valor final com desconto PIX de 10% (simulação)
  const safeTotalPrice = totalPrice || 0;
  const applicableCoupon = getApplicableCoupon(safeTotalPrice);
  const couponDiscount = applicableCoupon ? (safeTotalPrice * applicableCoupon.discountPercent) / 100 : 0;
  const priceAfterCoupon = safeTotalPrice - couponDiscount;
  const pixDiscount = priceAfterCoupon * 0.1;
  const finalPrice = Math.max(0, priceAfterCoupon - pixDiscount);

  // Gerar código PIX simples (simulação)
  const generatePixCode = () => {
    const amountStr = finalPrice.toFixed(2).replace('.', '').padStart(13, '0');
    const transactionId = Math.random().toString(36).substring(2, 15).toUpperCase();
    
    // Código PIX simplificado para simulação
    return `00020126580014BR.GOV.BCB.PIX0136000000000000052040000530398654${amountStr}5802BR59${transactionId.length}${transactionId}60${transactionId.length}${transactionId}6304ABCD`;
  };

  const pixCode = generatePixCode();

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

  const handlePaymentComplete = () => {
    onPaymentComplete();
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
            className="fixed inset-0 bg-black/60 z-[70]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none"
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

              {/* PIX Code */}
              <div className="mb-6">
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
                  className="flex-1 py-3 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
                >
                  Já paguei
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
