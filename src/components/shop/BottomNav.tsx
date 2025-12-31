import { motion } from 'framer-motion';
import { Home, Tag, ShoppingBag, Ticket, MessageSquare } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount?: number;
  onCartClick?: () => void;
  onCouponsClick?: () => void;
}

export const BottomNav = ({ activeTab, onTabChange, cartCount = 0, onCartClick, onCouponsClick }: BottomNavProps) => {
  const tabs = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'deals', label: 'Ofertas', icon: Tag },
    { id: 'cart', label: 'Carrinho', icon: ShoppingBag, isCart: true, isSpecial: true },
    { id: 'orders', label: 'Pedidos', icon: MessageSquare },
    { id: 'cupons', label: 'Cupons', icon: Ticket, onClick: onCouponsClick },
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.isCart && onCartClick) {
      onCartClick();
    } else if (tab.onClick) {
      tab.onClick();
    } else {
      onTabChange(tab.id);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-bottom-nav z-40 safe-bottom md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isSpecial) {
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabClick(tab)}
                className="flex flex-col items-center gap-0.5 relative"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink rounded-xl flex items-center justify-center shadow-lg relative">
                  <Icon className="w-5 h-5 text-white" />
                  {tab.isCart && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-foreground">{tab.label}</span>
              </motion.button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`bottom-nav-item relative ${isActive ? 'active' : ''}`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
