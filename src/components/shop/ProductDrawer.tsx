import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Truck, ShoppingCart, Heart, Share2, Shield, Eye, Users, RefreshCw, CreditCard, Clock, Ticket, CheckCircle2, Check, ChevronDown, ArrowLeft } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';
import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { products } from '@/data/products';
import { ProductReviews } from './ProductReviews';
import { CreatorVideosSection } from './CreatorVideosSection';
import { HorizontalProductScroll } from './ProductSection';
import { shareContent } from '@/utils/share';
import { trackViewContent } from '@/lib/facebookPixel';

interface ProductDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onBuyNow?: () => void;
  onProductClick?: (product: Product) => void;
}

export const ProductDrawer = memo(({ product, isOpen, onClose, onBuyNow, onProductClick }: ProductDrawerProps) => {
  const { addToCart, items } = useCart();
  const { coupons, activeCoupon, couponTimeRemaining, activateCoupon } = useCoupons();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity] = useState(1); // Mantener quantity para las funciones pero no mostrar el selector
  const [isLiked, setIsLiked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Get similar products (same category first, then other categories if needed to reach 8 items)
  const similarProducts = useMemo(() => {
    if (!product) return [];
    
    const targetCount = 8;
    
    // Primeiro, buscar produtos da mesma categoria
    const sameCategory = products
      .filter(p => p.id !== product.id && p.category === product.category)
      .slice(0, targetCount);
    
    // Se não tiver 8 itens, buscar de outras categorias
    if (sameCategory.length < targetCount) {
      const otherCategories = products
        .filter(p => p.id !== product.id && p.category !== product.category)
        .slice(0, targetCount - sameCategory.length);
      
      return [...sameCategory, ...otherCategories].slice(0, targetCount);
    }
    
    return sameCategory;
  }, [product]);

  const handleActivateCoupon = useCallback((couponId: string) => {
    activateCoupon(couponId);
    toast.success('Cupom ativado! Você tem 15 minutos para usar.', { id: 'product-coupon-activated' });
  }, [activateCoupon]);

  // Random viewer count
  const viewerCount = useMemo(() => Math.floor(Math.random() * 200) + 50, [product?.id]);

  // Verificar se o produto já está no carrinho
  const isInCart = useMemo(() => {
    if (!product) return false;
    return items.some(
      (item) =>
        item.id === product.id &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
    );
  }, [product, items, selectedSize, selectedColor]);

  // Rastrear ViewContent quando produto for visualizado
  useEffect(() => {
    if (isOpen && product) {
      trackViewContent(
        product.id,
        product.name,
        product.price,
        product.category
      );
    }
  }, [isOpen, product]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    
    // Validar se cor/tamanho foram selecionados quando necessário
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error('Por favor, selecione uma cor', { id: 'select-color-error' });
      return;
    }
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Por favor, selecione um tamanho', { id: 'select-size-error' });
      return;
    }
    
    // Feedback visual
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    
    // Se o produto tiver URL, redirecionar para tráfego pago
    if (product.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer');
      onClose();
      return;
    }
    // Caso contrário, adicionar ao carrinho normalmente
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, selectedColor);
    }
    // Não fechar o drawer imediatamente para mostrar feedback
  }, [quantity, product, selectedSize, selectedColor, addToCart]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    
    // Validar se cor/tamanho foram selecionados quando necessário
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error('Por favor, selecione uma cor', { id: 'select-color-error-buy' });
      return;
    }
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Por favor, selecione um tamanho', { id: 'select-size-error-buy' });
      return;
    }
    
    // Se o produto tiver URL, redirecionar para tráfego pago
    if (product.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer');
      onClose();
      return;
    }
    // Caso contrário, adicionar ao carrinho e chamar onBuyNow
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, selectedColor);
    }
    onClose();
    onBuyNow?.();
  }, [quantity, product, selectedSize, selectedColor, addToCart, onClose, onBuyNow]);

  const discountPercent = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'mil';
    }
    return num.toString();
  };

  const formatCouponTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleShare = useCallback(async () => {
    if (!product) return;
    
    // Usar URL do produto se disponível, senão usar a URL atual
    const shareUrl = product.url || `${window.location.origin}/produto/${product.id}`;
    const shareText = `Confira este produto: ${product.name} por apenas R$ ${product.price.toFixed(2).replace('.', ',')}`;
    
    const success = await shareContent(
      product.name,
      shareText,
      shareUrl
    );
    
    if (success) {
      if (navigator.share) {
        toast.success('Compartilhado com sucesso!', { id: 'share-success' });
      } else {
        toast.success('Link copiado para a área de transferência!', { id: 'share-copy' });
      }
    } else {
      toast.error('Não foi possível compartilhar', { id: 'share-error' });
    }
  }, [product]);

  const drawerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Bloquear scroll do body quando o drawer estiver aberto
  useEffect(() => {
    if (isOpen) {
      // Salvar a posição atual do scroll
      const scrollY = window.scrollY;
      // Bloquear o scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar o scroll quando fechar
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
        // Resetar estados de drag
        setDragY(0);
        setIsDragging(false);
      };
    }
  }, [isOpen]);

  // Fazer scroll para o topo quando o produto mudar
  useEffect(() => {
    if (isOpen && product && drawerRef.current) {
      // Scroll suave para o topo do drawer
      drawerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product?.id, isOpen]);

  // Handlers para drag down no header
  const handleDragStart = useCallback((clientY: number) => {
    // Sempre permitir iniciar drag a partir do header, independente do scroll
    dragStartY.current = clientY;
    setIsDragging(true);
    setDragY(0);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = clientY - dragStartY.current;
    // Só permitir arrastar para baixo (valores positivos)
    if (deltaY > 0) {
      setDragY(deltaY);
      return true; // Indica que o drag está ocorrendo
    }
    return false;
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    // Se arrastou mais de 100px, fechar o modal
    const shouldClose = dragY > 100;
    
    if (shouldClose) {
      // Fechar modal imediatamente se arrastou o suficiente
      onClose();
    } else {
      // Resetar estados para animação suave de volta
      setIsDragging(false);
      setDragY(0);
    }
  }, [isDragging, dragY, onClose]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Não prevenir comportamento padrão no start, deixar o scroll funcionar
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging) {
      const shouldPrevent = handleDragMove(e.touches[0].clientY);
      if (shouldPrevent) {
        e.preventDefault();
      }
    }
  }, [handleDragMove, isDragging]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse handlers (para desktop com mouse)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientY);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      handleDragMove(e.clientY);
    }
  }, [isDragging, handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Global mouse handlers para continuar drag mesmo fora do header
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleGlobalMouseUp = () => {
      handleDragEnd();
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const shouldPrevent = handleDragMove(e.touches[0].clientY);
        if (shouldPrevent) {
          e.preventDefault();
        }
      }
    };

    const handleGlobalTouchEnd = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (!product || !isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50"
        />

        {/* Drawer */}
        <motion.div
          ref={drawerRef}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ 
            y: isDragging ? dragY : 0,
            opacity: 1
          }}
          exit={{ y: '100%', opacity: 0 }}
          transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 z-[60] bg-card rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl safe-area-inset-bottom"
        >
            {/* Botão de voltar fixo no topo */}
            <div 
              ref={headerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="sticky top-0 bg-card z-20 border-b border-border safe-area-inset-top cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-3 px-4 md:px-6 py-3">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors touch-manipulation"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">Detalhes do produto</h2>
                </div>
              </div>
            </div>

            {/* Handle */}
            <div className="pt-2 pb-1">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 pb-5 pt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {product.brand?.charAt(0)}
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-foreground text-sm truncate">{product.brand}</span>
                  <span className="text-primary flex-shrink-0">✓</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button className="p-2 rounded-full hover:bg-muted transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Container */}
            <div className="px-4 md:px-6 pb-2">
              {/* Product Image */}
              <div className="relative aspect-square mx-auto w-full max-w-sm rounded-2xl overflow-hidden bg-muted mb-5 shadow-sm">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {product.isHotDeal && (
                  <span className="badge-hot-deal">🔥 Oferta Especial</span>
                )}
                {product.isNewCustomerDeal && (
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                    Desconto para novos clientes
                  </span>
                )}
              </div>

              {/* Stats overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between">
                <div className="flex gap-2">
                  {product.viewCount && (
                    <div className="flex items-center gap-1 bg-foreground/60 backdrop-blur-sm text-background text-xs px-2 py-1 rounded-full">
                      <Eye className="w-3 h-3" />
                      {formatNumber(product.viewCount)}
                    </div>
                  )}
                  {product.likesCount && (
                    <div className="flex items-center gap-1 bg-foreground/60 backdrop-blur-sm text-background text-xs px-2 py-1 rounded-full">
                      <Heart className="w-3 h-3" />
                      {formatNumber(product.likesCount)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="px-4 md:px-6 pb-8 space-y-5">
              {/* Title and Actions */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg md:text-xl font-semibold text-foreground flex-1 line-clamp-2 leading-tight">
                  {product.name}
                </h2>
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={handleShare}
                    className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsLiked(!isLiked)}
                    className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'fill-primary text-primary' : ''}`} />
                  </motion.button>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl md:text-3xl font-bold text-primary">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-lg md:text-xl text-muted-foreground line-through">
                        R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="bg-primary/10 text-primary text-sm font-semibold px-2.5 py-1 rounded">
                        -{discountPercent}%
                      </span>
                    </>
                  )}
                </div>
                {/* Installments */}
                {product.price >= 20 && (
                  <span className="text-sm text-muted-foreground">
                    {Math.ceil(product.price / 20)}x de R$ {(product.price / Math.ceil(product.price / 20)).toFixed(2).replace('.', ',')}
                  </span>
                )}
                {product.freeShipping && (
                  <div className="flex items-center gap-1">
                    <span className="text-success text-sm md:text-base font-medium flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Frete grátis acima de R$50
                    </span>
                  </div>
                )}
              </div>

              {/* Coupon Badge */}
              {product.price >= 39 && !activeCoupon && (
                <div className="bg-destructive/10 text-destructive text-xs font-medium px-3 py-2 rounded-lg inline-flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Compre R$39 e ganhe 10% de desconto
                </div>
              )}

              {/* Active Coupon Timer */}
              {activeCoupon && couponTimeRemaining && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium px-3 py-2 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    O cupom de {activeCoupon.discountPercent}% está expirando
                  </div>
                  <span className="font-bold">{formatCouponTime(couponTimeRemaining)}</span>
                </div>
              )}

              {/* Rating and Stats - Sempre em uma linha */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-4 h-4 md:w-5 md:h-5 fill-warning text-warning" />
                  <span className="font-semibold text-sm md:text-base">{product.rating}</span>
                </div>
                <span className="text-muted-foreground text-sm md:text-base whitespace-nowrap">
                  {formatNumber(product.soldCount)} vendidos
                </span>
                {product.viewCount && (
                  <span className="text-muted-foreground flex items-center gap-1 text-sm md:text-base whitespace-nowrap">
                    <Eye className="w-4 h-4 md:w-5 md:h-5" />
                    {formatNumber(product.viewCount)}
                  </span>
                )}
                {product.likesCount && (
                  <span className="text-muted-foreground flex items-center gap-1 text-sm md:text-base whitespace-nowrap">
                    <Heart className="w-4 h-4 md:w-5 md:h-5" />
                    {formatNumber(product.likesCount)}
                  </span>
                )}
              </div>

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Cor: <span className="text-muted-foreground">{selectedColor || 'Selecione'}</span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedColor === color
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Tamanho: <span className="text-muted-foreground">{selectedSize || 'Selecione'}</span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 rounded-lg border text-sm font-medium transition-all ${
                          selectedSize === size
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Description */}
              {product.description && (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">Sobre este produto</h3>
                  <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {(showFullDescription || product.description.length <= 500
                      ? product.description
                      : product.description.substring(0, 500) + '...'
                    ).split('**').map((part, index) => {
                      if (index % 2 === 1) {
                        return <strong key={index} className="font-semibold">{part}</strong>;
                      }
                      return <span key={index}>{part}</span>;
                    })}
                  </div>
                  {product.description.length > 500 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      {showFullDescription ? 'Ver menos' : 'Ver mais'}
                    </button>
                  )}
                </div>
              )}

              {/* Available Coupons Section - Ofertas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold">Ofertas</h3>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {coupons.filter((coupon) => coupon.id !== '4').map((coupon) => (
                    <motion.div
                      key={coupon.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`relative overflow-hidden rounded-xl border-2 flex-shrink-0 min-w-[280px] ${
                        coupon.isActivated
                          ? 'border-success bg-success/5'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      {/* Dashed line decoration */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-tiktok-cyan" />
                      
                      <div className="p-3 pl-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl font-bold text-primary">
                                {coupon.discountPercent > 0 ? `${coupon.discountPercent}% OFF` : 'Brinde'}
                              </span>
                              {coupon.isActivated && (
                                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {coupon.description}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Código: <span className="font-mono font-medium">{coupon.code}</span>
                            </p>
                          </div>
                          
                          {!coupon.isActivated ? (
                            <button
                              onClick={() => handleActivateCoupon(coupon.id)}
                              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
                            >
                              Resgatar
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 bg-success/10 text-success rounded-full text-xs font-semibold flex-shrink-0">
                              Ativado
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Creator Videos Section */}
              {product.creatorVideos && product.creatorVideos.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <CreatorVideosSection 
                    videos={product.creatorVideos || []} 
                    product={product}
                    onProductClick={() => {
                      // Se o produto tiver URL, abrir em nova aba
                      if (product.url) {
                        window.open(product.url, '_blank', 'noopener,noreferrer');
                        return;
                      }
                      // Caso contrário, já estamos no drawer do produto, apenas fechar o vídeo
                      // El drawer ya está abierto, solo hacemos scroll hacia arriba cuando se cierra el modal
                    }}
                  />
                </div>
              )}

              {/* Store Information */}
              {product.brand && (() => {
                // Calcular estatísticas da loja
                const storeProducts = products.filter(p => p.brand === product.brand);
                const totalSold = storeProducts.reduce((sum, p) => sum + (p.soldCount || 0), 0);
                const avgRating = storeProducts.length > 0
                  ? storeProducts.reduce((sum, p) => sum + p.rating, 0) / storeProducts.length
                  : product.rating;
                const storeInitial = product.brand.charAt(0).toUpperCase();
                const formatStoreNumber = (num: number) => {
                  if (num >= 1000000) {
                    return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
                  }
                  if (num >= 1000) {
                    return (num / 1000).toFixed(1).replace('.0', '') + 'mil';
                  }
                  return num.toString();
                };

                return (
                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {/* Store Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-tiktok-cyan to-tiktok-pink flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">{storeInitial}</span>
                      </div>
                      
                      {/* Store Name and Verification */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base truncate">{product.brand}</h3>
                          <div className="w-5 h-5 rounded-full bg-tiktok-pink flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Store Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Produtos Vendidos</p>
                        <p className="text-base font-bold">{formatStoreNumber(totalSold)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reputação</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-warning text-warning" />
                          <p className="text-base font-bold">{avgRating.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Buyer Protection - Enhanced */}
              <div className="p-4 bg-muted rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <p className="font-semibold">Compra Protegida</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 text-success" />
                    <span>Devolução gratuita</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="w-4 h-4 text-success" />
                    <span>Reembolso por danos</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="w-4 h-4 text-success" />
                    <span>Pagamento seguro</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-success" />
                    <span>Reembolso por atraso</span>
                  </div>
                </div>
              </div>

              {/* Social Proof - Random viewer count */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{viewerCount} pessoas</span> estão vendo este produto agora
                </p>
              </div>

              {/* Customer Reviews */}
              {product.reviews && product.reviews.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <ProductReviews
                    reviews={product.reviews || []}
                    averageRating={product.rating}
                    totalReviews={product.reviews?.length || 0}
                    productId={product.id}
                  />
                </div>
              )}

              {/* Recommended Products */}
              {similarProducts.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <HorizontalProductScroll
                    title="Você também pode gostar"
                    products={similarProducts}
                    onProductClick={(p) => {
                      if (onProductClick) {
                        // Fazer scroll para o topo antes de mudar o produto
                        if (drawerRef.current) {
                          drawerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        // Pequeno delay para garantir que o scroll comece antes de mudar o produto
                        setTimeout(() => {
                          onProductClick(p);
                        }, 100);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="sticky bottom-0 bg-card border-t border-border px-4 md:px-6 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" style={{ paddingTop: '1rem', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
              <div className="flex gap-3 max-w-2xl mx-auto">
                  <motion.button
                    onClick={handleAddToCart}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 py-3.5 md:py-4 px-4 md:px-6 border-2 rounded-full font-semibold transition-all text-sm md:text-base flex items-center justify-center gap-2 ${
                      justAdded 
                        ? 'border-success bg-success/10 text-success' 
                        : 'border-foreground text-foreground hover:bg-muted'
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Adicionado!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>{isInCart ? 'Adicionar novamente' : 'Adicionar ao carrinho'}</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={handleBuyNow}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3.5 md:py-4 px-4 md:px-6 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm md:text-base flex items-center justify-center gap-2"
                  >
                    <span>Comprar agora</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
      </>
    </AnimatePresence>
  );
});

ProductDrawer.displayName = 'ProductDrawer';
