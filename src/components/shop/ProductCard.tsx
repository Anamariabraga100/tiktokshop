import { motion } from 'framer-motion';
import { Star, Truck, ShoppingCart, Heart, TrendingUp, Award, Check } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useState, useMemo, useCallback, memo, useRef } from 'react';
import { useCoupons } from '@/context/CouponContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  index?: number;
}

export const ProductCard = memo(({ product, onClick, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { activeCoupon } = useCoupons();
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const handleQuickAdd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar se o produto requer seleção de cor ou tamanho
    const requiresColor = product.colors && product.colors.length > 0;
    const requiresSize = product.sizes && product.sizes.length > 0;
    
    // Se requer seleção, abrir o drawer em vez de adicionar diretamente
    if (requiresColor || requiresSize) {
      onClick();
      return;
    }
    
    // Caso contrário, adicionar diretamente
    addToCart(product, product.sizes?.[0], product.colors?.[0]);
    setJustAdded(true);
    toast.success('Produto adicionado ao carrinho!', {
      duration: 2000,
      id: `cart-add-${product.id}`,
    });
    setTimeout(() => setJustAdded(false), 2000);
  }, [product, addToCart, onClick]);

  const handleLike = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  }, [isLiked]);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'mil';
    }
    return num.toString();
  };

  // Determine if product is trending (sold more than 2000)
  const isTrending = product.soldCount > 2000;
  // Determine if product is bestseller (sold more than 4000)
  const isBestSeller = product.soldCount > 4000;

  const handleCardClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Não executar se clicou em um botão ou elemento interativo
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    onClick();
  }, [onClick]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      onClick={handleCardClick}
      className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group md:hover:scale-[1.02] will-change-transform touch-manipulation active:scale-[0.98]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted md:aspect-square lg:aspect-[3/4]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
          loading="lazy"
          decoding="async"
        />
        
        {/* Badges - Only bestseller/trending */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isBestSeller && (
            <span className="bg-warning text-warning-foreground text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Award className="w-3 h-3" />
              Mais Vendido
            </span>
          )}
          {!isBestSeller && isTrending && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Tendência
            </span>
          )}
        </div>

        {/* Like button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className="absolute top-2 right-2 w-8 h-8 bg-card/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center z-20 touch-manipulation"
        >
          <Heart className={`w-4 h-4 transition-colors ${isLiked ? 'fill-primary text-primary' : 'text-foreground'}`} />
        </motion.button>

        {/* Quick add button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleQuickAdd}
          className={`absolute bottom-2 right-2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-primary-foreground opacity-0 group-hover:opacity-100 transition-all z-20 touch-manipulation ${
            justAdded ? 'bg-success opacity-100' : 'bg-primary'
          }`}
        >
          {justAdded ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Check className="w-5 h-5" />
            </motion.div>
          ) : (
            <ShoppingCart className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      <div className="p-3 md:p-4">
        {/* Product Name */}
        <h3 className="text-sm md:text-base font-medium text-foreground line-clamp-2 mb-2 min-h-[2.5rem] md:min-h-[3rem]">
          {product.name}
        </h3>

        {/* Price with Free Shipping on same line */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="price-sale text-lg md:text-xl">R$ {product.price.toFixed(2).replace('.', ',')}</span>
          {product.originalPrice && (
            <span className="price-original text-xs">R$ {product.originalPrice.toFixed(2).replace('.', ',')}</span>
          )}
          {discountPercent > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded">
              -{discountPercent}%
            </span>
          )}
          {product.freeShipping && (
            <span className="text-success text-[10px] font-medium flex items-center gap-0.5">
              <Truck className="w-3 h-3" />
              Frete grátis +R$50
            </span>
          )}
        </div>

        {/* Coupon badge */}
        {product.price >= 39 && !activeCoupon && (
          <div className="bg-destructive/10 text-destructive text-[10px] font-medium px-2 py-1 rounded mb-1 inline-block">
            🎟️ Compre R$39 e ganhe 10% OFF
          </div>
        )}

        {/* Rating and Stats */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="w-4 h-4 fill-warning text-warning" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>· {formatNumber(product.soldCount)} vendidos</span>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';
