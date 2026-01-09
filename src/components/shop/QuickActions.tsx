import { motion } from 'framer-motion';
import { MapPin, CreditCard, HelpCircle, Ticket, Percent, Tag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionsProps {
  onCouponsClick?: () => void;
  onOffersClick?: () => void;
  onAddressClick?: () => void;
}

export const QuickActions = ({ onCouponsClick, onOffersClick, onAddressClick }: QuickActionsProps) => {
  const handleAddressClick = () => {
    if (onAddressClick) {
      onAddressClick();
    } else {
      toast.info('Adicione um endereço no carrinho para continuar');
    }
  };

  const handlePaymentClick = () => {
    toast.info('Métodos de pagamento disponíveis: Cartão de crédito, PIX, Boleto');
  };

  const handleHelpClick = () => {
    toast.info('Central de ajuda: Entre em contato pelo WhatsApp ou email de suporte');
  };

  const actions = [
    { icon: Percent, label: 'Cupons', badge: '3', onClick: onCouponsClick },
    { icon: Tag, label: 'Vouchers', badge: '2', onClick: onCouponsClick },
    { icon: Sparkles, label: 'Ofertas', onClick: onOffersClick },
    { icon: MapPin, label: 'Endereço', onClick: handleAddressClick },
    { icon: CreditCard, label: 'Pagamento', onClick: handlePaymentClick },
    { icon: HelpCircle, label: 'Ajuda', onClick: handleHelpClick },
  ];

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-6 md:mx-0 md:px-0 md:overflow-visible" style={{ paddingTop: '8px', marginTop: '-8px' }}>
      <div className="flex gap-2 md:gap-3 md:flex-wrap md:justify-center">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="relative flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-secondary rounded-full text-sm md:text-base font-medium text-secondary-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <action.icon className="w-4 h-4 md:w-5 md:h-5" />
            {action.label}
            {action.badge && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm z-10 border-2 border-card">
                {action.badge}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
