import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';
import { useCustomer } from '@/context/CustomerContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CardPaymentModal = ({ isOpen, onClose }: CardPaymentModalProps) => {
  const { totalPrice } = useCart();
  const { getApplicableCoupon } = useCoupons();
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [installments, setInstallments] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showError, setShowError] = useState(false);

  // Calcular valor final
  const applicableCoupon = getApplicableCoupon(totalPrice);
  const couponDiscount = applicableCoupon ? (totalPrice * applicableCoupon.discountPercent) / 100 : 0;
  const finalPrice = totalPrice - couponDiscount;
  
  // Calcular valor da parcela com juros (taxa de 2.5% ao mês para 2x, 3x, 4x)
  const calculateInstallmentValue = (numInstallments: number) => {
    if (numInstallments === 1) {
      return finalPrice; // Sem juros
    }
    // Juros compostos: valor * (1 + taxa) ^ parcelas
    const interestRate = 0.025; // 2.5% ao mês
    const totalWithInterest = finalPrice * Math.pow(1 + interestRate, numInstallments);
    return totalWithInterest / numInstallments;
  };
  
  const installmentValue = calculateInstallmentValue(parseInt(installments));
  const totalWithInterest = installmentValue * parseInt(installments);

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 16) {
      return numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    return value;
  };

  const formatCVV = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos
    if (!cardNumber || cardNumber.replace(/\D/g, '').length < 13) {
      toast.error('Número do cartão inválido');
      return;
    }
    if (!cardName || cardName.length < 3) {
      toast.error('Nome no cartão inválido');
      return;
    }
    if (!expiryMonth || !expiryYear) {
      toast.error('Data de validade inválida');
      return;
    }
    if (!cvv || cvv.length < 3) {
      toast.error('CVV inválido');
      return;
    }

    setIsProcessing(true);
    setShowError(false);

    // Simular processamento
    setTimeout(() => {
      setIsProcessing(false);
      setShowError(true);
      toast.error('Transação recusada pelo emissor do cartão');
    }, 2000);
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
                  <CreditCard className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold">Pagamento com Cartão</h2>
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
                {parseInt(installments) > 1 && (
                  <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                    <p>
                      {installments}x de R$ {installmentValue.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs">
                      Total: R$ {totalWithInterest.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {showError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Transação Recusada</span>
                  </div>
                  <p className="text-sm text-destructive">
                    A transação foi recusada pelo emissor do cartão. Por favor, verifique os dados do cartão ou tente outro método de pagamento.
                  </p>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Card Number */}
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    required
                    disabled={isProcessing}
                  />
                </div>

                {/* Card Name */}
                <div className="space-y-2">
                  <Label htmlFor="cardName">Nome no Cartão</Label>
                  <Input
                    id="cardName"
                    placeholder="NOME COMO ESTÁ NO CARTÃO"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    required
                    disabled={isProcessing}
                  />
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Validade</Label>
                    <div className="flex gap-2">
                      <Select value={expiryMonth} onValueChange={setExpiryMonth} disabled={isProcessing}>
                        <SelectTrigger>
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent className="!z-[80]">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                              {month.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={expiryYear} onValueChange={setExpiryYear} disabled={isProcessing}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent className="!z-[80]">
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="000"
                      value={cvv}
                      onChange={(e) => setCvv(formatCVV(e.target.value))}
                      maxLength={3}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* Installments */}
                <div className="space-y-2">
                  <Label htmlFor="installments">Parcelas</Label>
                  <Select value={installments} onValueChange={setInstallments} disabled={isProcessing}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="!z-[80]">
                      {[1, 2, 3, 4].map((num) => {
                        const installmentVal = calculateInstallmentValue(num);
                        const totalVal = installmentVal * num;
                        return (
                          <SelectItem key={num} value={num.toString()}>
                            {num}x de R$ {installmentVal.toFixed(2).replace('.', ',')}
                            {num === 1 ? ' sem juros' : ` (Total: R$ ${totalVal.toFixed(2).replace('.', ',')})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Security Info */}
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Lock className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Seus dados estão protegidos e criptografados
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 border-2 border-border rounded-full font-semibold hover:bg-muted transition-colors"
                    disabled={isProcessing}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processando...' : 'Finalizar Pagamento'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

