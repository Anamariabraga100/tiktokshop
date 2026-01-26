import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, HelpCircle, Bell, ChevronDown, X, TrendingUp, Star, MapPin } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { categories } from '@/data/products';

interface HeaderProps {
  onCartClick: () => void;
  onCategorySelect?: (categoryId: string | null) => void;
  onCouponsClick?: () => void;
  onTabClick?: (tab: string) => void;
  activeHeaderTab?: string | null;
  onAddressClick?: () => void;
}

export const Header = ({ onCartClick, onCategorySelect, onCouponsClick, onTabClick, activeHeaderTab, onAddressClick }: HeaderProps) => {
  const { totalItems } = useCart();
  const { customerData } = useCustomer();
  const [showCategories, setShowCategories] = useState(false);
  const hasAddress = !!customerData?.address?.rua && !!customerData?.address?.cep;

  const tabs = ['Ajuda', 'Categorias', 'Novidades', 'Mais Vendidos'];
  const activeTab = activeHeaderTab || null;

  const handleTabClick = (tab: string) => {
    if (tab === 'Categorias') {
      setShowCategories(!showCategories);
    } else if (tab === 'Endereço') {
      // Endereço abre o modal diretamente
      onAddressClick?.();
    } else {
      onTabClick?.(tab);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    onCategorySelect?.(categoryId);
    setShowCategories(false);
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="sticky top-0 bg-card/95 backdrop-blur-sm z-40 border-b border-border will-change-transform"
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 max-w-7xl mx-auto">
          {/* Logo TikTok Shop - Apenas texto */}
          <div className="flex-shrink-0 mr-3 md:mr-4">
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-bold leading-tight text-foreground">TikTok</span>
              <span className="text-xs md:text-sm font-medium leading-tight text-foreground">Shop</span>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex items-center gap-3 md:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide flex-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`relative flex items-center gap-1 text-xs md:text-sm lg:text-base font-medium whitespace-nowrap transition-colors ${
                  tab === activeTab
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'Ajuda' && <HelpCircle className="w-3 h-3 md:w-4 md:h-4 text-primary" />}
                {tab === 'Novidades' && <Star className="w-3 h-3 md:w-4 md:h-4 text-primary" />}
                {tab === 'Mais Vendidos' && <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-primary" />}
                {tab}
                {tab === 'Categorias' && <ChevronDown className={`w-3 h-3 transition-transform ${showCategories ? 'rotate-180' : ''}`} />}
                {tab === activeTab && (
                  <motion.div
                    layoutId="headerActiveTab"
                    className="absolute -bottom-3 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
            
            {/* Endereço Button - substituindo Ofertas */}
            {onAddressClick && (
              <button
                onClick={() => handleTabClick('Endereço')}
                className={`relative flex items-center gap-1 text-xs md:text-sm lg:text-base font-medium whitespace-nowrap transition-colors ${
                  'text-foreground'
                }`}
              >
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                Endereço
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-2 md:ml-4">
            <button 
              onClick={onCouponsClick}
              className="relative p-2 md:p-2.5 hover:bg-muted rounded-lg transition-colors"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCartClick}
              className="relative p-2 md:p-2.5 hover:bg-muted rounded-lg transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Categories Dropdown */}
      <AnimatePresence>
        {showCategories && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategories(false)}
              className="fixed inset-0 bg-foreground/20 z-30"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-14 md:top-16 left-0 right-0 bg-card border-b border-border z-30 shadow-lg"
            >
              <div className="p-4 md:p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="font-semibold md:text-lg">Categorias</h3>
                  <button onClick={() => setShowCategories(false)} className="p-1 hover:bg-muted rounded transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCategoryClick(category.id)}
                      className="flex flex-col items-center gap-1 md:gap-2 p-3 md:p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                    >
                      <span className="text-2xl md:text-3xl">{category.icon}</span>
                      <span className="text-xs md:text-sm font-medium">{category.name}</span>
                    </motion.button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    onCategorySelect?.(null);
                    setShowCategories(false);
                  }}
                  className="w-full mt-3 py-2 text-sm text-primary font-medium"
                >
                  Ver todos os produtos
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
