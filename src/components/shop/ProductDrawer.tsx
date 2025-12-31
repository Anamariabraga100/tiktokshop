import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Truck, Minus, Plus, ShoppingCart, Heart, Share2, Shield, Eye, Users, RefreshCw, CreditCard, Clock, Ticket, CheckCircle2, Check, ChevronDown, FileText } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';
import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { toast } from 'sonner';
import { products } from '@/data/products';
import { ProductReviews } from './ProductReviews';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ProductDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onBuyNow?: () => void;
}

export const ProductDrawer = memo(({ product, isOpen, onClose, onBuyNow }: ProductDrawerProps) => {
  const { addToCart } = useCart();
  const { coupons, activeCoupon, couponTimeRemaining, activateCoupon } = useCoupons();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  const handleActivateCoupon = useCallback((couponId: string) => {
    activateCoupon(couponId);
    toast.success('Cupom ativado! Você tem 15 minutos para usar.');
  }, [activateCoupon]);

  // Random viewer count
  const viewerCount = useMemo(() => Math.floor(Math.random() * 200) + 50, [product?.id]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, selectedColor);
    }
    onClose();
  }, [quantity, product, selectedSize, selectedColor, addToCart, onClose]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
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
    const siteUrl = window.location.origin;
    const shareText = `Confira este produto: ${product?.name} - ${siteUrl}`;

    try {
      // Tentar usar Web Share API se disponível (mobile)
      if (navigator.share) {
        await navigator.share({
          title: product?.name,
          text: shareText,
          url: siteUrl,
        });
        toast.success('Link compartilhado!');
      } else {
        // Fallback: copiar para área de transferência
        await navigator.clipboard.writeText(siteUrl);
        toast.success('Link copiado para a área de transferência!');
      }
    } catch (error) {
      // Usuário cancelou ou erro
      if (error instanceof Error && error.name !== 'AbortError') {
        // Se não for cancelamento, tentar copiar
        try {
          await navigator.clipboard.writeText(siteUrl);
          toast.success('Link copiado para a área de transferência!');
        } catch (copyError) {
          toast.error('Erro ao compartilhar link');
        }
      }
    }
  }, [product]);

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
      };
    }
  }, [isOpen]);

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
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 z-[60] bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
            {/* Handle */}
            <div className="sticky top-0 bg-card pt-3 pb-2 z-10">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {product.brand?.charAt(0)}
                </div>
                <span className="font-semibold text-foreground text-sm">{product.brand}</span>
                <span className="text-primary">✓</span>
              </div>
              <div className="flex items-center gap-2">
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
            <div className="px-4">
              {/* Product Image */}
              <div className="relative aspect-square mx-auto max-w-md rounded-2xl overflow-hidden bg-muted mb-4">
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
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i === 0 ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-4">
              {/* Title and Actions */}
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-foreground flex-1">
                  {product.name}
                </h2>
                <div className="flex gap-2">
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

              {/* Price with Free Shipping on same line */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-bold text-primary">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="bg-primary/10 text-primary text-sm font-semibold px-2 py-0.5 rounded">
                      -{discountPercent}%
                    </span>
                  </>
                )}
                {product.freeShipping && (
                  <span className="text-success text-xs font-medium flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Frete grátis +R$99
                  </span>
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

              {/* Rating and Stats */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-warning text-warning" />
                  <span className="font-semibold">{product.rating}</span>
                </div>
                <span className="text-muted-foreground">
                  {formatNumber(product.soldCount)} vendidos
                </span>
                {product.viewCount && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatNumber(product.viewCount)} visualizações
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

              {/* Quantity */}
              <div>
                <p className="text-sm font-medium mb-2">Quantidade</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Product Description - Expandable */}
              {product.description && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="description" className="border-none">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="font-semibold">Descrição do Produto</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                          {product.description.split('**').map((part, index) => {
                            if (index % 2 === 1) {
                              return <strong key={index} className="font-semibold">{part}</strong>;
                            }
                            return <span key={index}>{part}</span>;
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {/* Available Coupons Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold">Cupons Disponíveis</h3>
                </div>
                <div className="space-y-2">
                  {coupons.map((coupon) => (
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
                      
                      <div className="p-3 pl-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl font-bold text-primary">
                                {coupon.discountPercent}% OFF
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
                              Ativar
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
            </div>
            </div>

            {/* Bottom Actions */}
            <div className="sticky bottom-0 bg-card border-t border-border p-4 safe-bottom">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-4 px-6 border-2 border-foreground text-foreground rounded-full font-semibold hover:bg-muted transition-colors text-sm"
                >
                  Adicionar ao carrinho
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
                >
                  Comprar agora
                </button>
              </div>
            </div>
          </motion.div>
      </>
    </AnimatePresence>
  );
});

ProductDrawer.displayName = 'ProductDrawer';
