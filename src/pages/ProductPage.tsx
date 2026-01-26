import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Truck, Heart, Share2, Shield, Eye, Users, RefreshCw, CreditCard, Clock, Ticket, CheckCircle2, Check, ChevronLeft, ChevronRight, ShoppingCart, Search, User, X, Plus, Minus } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';
import { products } from '@/data/products';
import { ProductReviews } from '@/components/shop/ProductReviews';
import { CreatorVideosSection } from '@/components/shop/CreatorVideosSection';
import { HorizontalProductScroll } from '@/components/shop/ProductSection';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { shareContent } from '@/utils/share';
import { trackViewContent } from '@/lib/facebookPixel';
import { toast } from 'sonner';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { coupons, activeCoupon, couponTimeRemaining, activateCoupon } = useCoupons();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const product = useMemo(() => {
    return products.find(p => p.id === id) || null;
  }, [id]);

  // Get similar products
  const similarProducts = useMemo(() => {
    if (!product) return [];
    
    const targetCount = 8;
    const sameCategory = products
      .filter(p => p.id !== product.id && p.category === product.category)
      .slice(0, targetCount);
    
    if (sameCategory.length < targetCount) {
      const otherCategories = products
        .filter(p => p.id !== product.id && p.category !== product.category)
        .slice(0, targetCount - sameCategory.length);
      
      return [...sameCategory, ...otherCategories].slice(0, targetCount);
    }
    
    return sameCategory;
  }, [product]);

  // Track ViewContent
  useEffect(() => {
    if (product) {
      trackViewContent(
        product.id,
        product.name,
        product.price,
        product.category
      );
    }
  }, [product]);

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  const handleActivateCoupon = useCallback((couponId: string) => {
    activateCoupon(couponId);
    toast.success('Cupom ativado! Você tem 15 minutos para usar.', { id: 'product-coupon-activated' });
  }, [activateCoupon]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    
    // Validar se cor/tamanho foram selecionados quando necessário
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error('Por favor, selecione uma cor', { id: 'select-color-error-buy' });
      setIsOptionsModalOpen(true);
      return;
    }
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Por favor, selecione um tamanho', { id: 'select-size-error-buy' });
      setIsOptionsModalOpen(true);
      return;
    }
    
    // Se o produto tiver URL, redirecionar para tráfego pago
    if (product.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Adicionar ao carrinho (quantidade vezes) e abrir o carrinho
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, selectedColor);
    }
    setIsOptionsModalOpen(false);
    setIsCartOpen(true);
  }, [product, selectedSize, selectedColor, quantity, addToCart, navigate]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    
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

  const viewerCount = useMemo(() => Math.floor(Math.random() * 200) + 50, [product?.id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Produto não encontrado</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Voltar para a loja
          </button>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  
  // Função para obter imagem baseada na cor selecionada
  const getImageForColor = useCallback((color: string | undefined) => {
    if (!product || product.id !== '9') return images[0]; // Se não for o tênis, retorna primeira imagem
    
    // Para o produto tênis (id: '9'), mapear cores para imagens
    // tenis1 e tenis6 são pretos (tênis preto sendo segurado)
    // tenis2, tenis3, tenis4, tenis5, tenis7 são brancos
    if (color === 'Preto') {
      // Retornar primeira imagem de tênis preto (tenis1 - índice 1)
      return images[1] || images[0]; // tenis1 é o índice 1 (após tenisCasual)
    } else if (color === 'Branco') {
      // Retornar primeira imagem de tênis branco (tenis2 - índice 2)
      return images[2] || images[0]; // tenis2 é o índice 2
    }
    return images[0]; // Padrão: primeira imagem (tenisCasual)
  }, [product, images]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header estilo TikTok Shop */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm z-40 border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {/* Logo TikTok Shop - Apenas texto */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-bold leading-tight text-foreground">TikTok</span>
              <span className="text-xs md:text-sm font-medium leading-tight text-foreground">Shop</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tiktok-pink" />
              <input
                type="text"
                placeholder="Procurar"
                className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-tiktok-pink/30 focus:border-tiktok-pink focus:outline-none text-sm text-tiktok-pink placeholder:text-tiktok-pink/70 bg-white"
              />
            </div>
          </div>

          {/* Profile Icon - Simples */}
          <div className="flex-shrink-0">
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <User className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Product Image Gallery */}
        <div 
          className="relative w-full aspect-square bg-muted overflow-hidden"
          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
          onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
          onTouchEnd={() => {
            if (!touchStart || !touchEnd) return;
            const distance = touchStart - touchEnd;
            const isLeftSwipe = distance > 50;
            const isRightSwipe = distance < -50;
            if (isLeftSwipe && images.length > 1) {
              setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }
            if (isRightSwipe && images.length > 1) {
              setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            }
            setTouchStart(null);
            setTouchEnd(null);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              initial={{ opacity: 0, x: touchEnd && touchStart ? (touchEnd - touchStart) : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: touchEnd && touchStart ? (touchEnd - touchStart) : 0 }}
              transition={{ duration: 0.2 }}
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover select-none"
              loading="eager"
              draggable={false}
            />
          </AnimatePresence>
          
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-foreground/60 backdrop-blur-sm text-background hover:bg-foreground/80 transition-colors z-10"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-foreground/60 backdrop-blur-sm text-background hover:bg-foreground/80 transition-colors z-10"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Image counter */}
              <div className="absolute bottom-3 right-3 bg-foreground/60 backdrop-blur-sm text-background text-xs px-2 py-1 rounded">
                {currentImageIndex + 1}/{images.length}
              </div>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            {product.isHotDeal && (
              <span className="badge-hot-deal">🔥 Oferta Especial</span>
            )}
            {product.isNewCustomerDeal && (
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                Desconto para novos clientes
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="px-4 py-4 space-y-4">
          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-destructive">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm font-semibold text-tiktok-pink">
                    Economize até {discountPercent}%
                  </span>
                </>
              )}
            </div>
            {product.price >= 20 && (
              <span className="text-sm text-muted-foreground">
                {Math.ceil(product.price / 20)}x de R$ {(product.price / Math.ceil(product.price / 20)).toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h1 className="text-lg font-medium leading-tight">{product.name}</h1>

          {/* Seller Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vendido por</p>
              <p className="text-sm font-medium">Eclair Weber Calçados</p>
            </div>
            {product.freeShipping && (
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <Truck className="w-4 h-4" />
                <span>Frete grátis</span>
              </div>
            )}
          </div>

          {/* Rating and Sales */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-semibold text-sm">{product.rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({formatNumber(product.soldCount)})
            </span>
            <span className="text-sm text-muted-foreground">
              {formatNumber(product.soldCount)} vendido(s)
            </span>
          </div>

          {/* Select Options Button */}
          {(product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0) ? (
            <button
              onClick={() => setIsOptionsModalOpen(true)}
              className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <span className="font-medium">Selecionar opções</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : null}

          {/* Shipping Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Envio</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Entrega até Jan 30 - Feb 5
            </p>
            <p className="text-sm text-muted-foreground">
              {product.freeShipping ? 'Grátis' : 'R$ 10,30 Grátis'}
            </p>
          </div>

          {/* Retailer Policies */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Políticas do varejista</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Devolução em até 30 dias
            </p>
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
                {activeCoupon.id === '2' || activeCoupon.code === 'DESCONTO12'
                  ? 'O desconto está expirando'
                  : `O cupom de ${activeCoupon.discountPercent}% está expirando`}
              </div>
              <span className="font-bold">{formatCouponTime(couponTimeRemaining)}</span>
            </div>
          )}

          {/* Available Coupons */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold">Ofertas</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

          {/* Product Description */}
          {product.description && (
            <div className="space-y-2 pt-4">
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

          {/* Creator Videos */}
          {product.creatorVideos && product.creatorVideos.length > 0 && (
            <div className="pt-4 border-t border-border">
              <CreatorVideosSection 
                videos={product.creatorVideos || []} 
                product={product}
                onProductClick={() => {}}
              />
            </div>
          )}


          {/* Buyer Protection */}
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

          {/* Social Proof */}
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
                  navigate(`/produto/${p.id}`);
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Buy Button - Estilo TikTok Shop */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <motion.button
            onClick={() => {
              // Se tiver opções e não estiverem selecionadas, abrir modal
              const hasOptions = (product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0);
              const needsSelection = (product.colors && product.colors.length > 0 && !selectedColor) || 
                                    (product.sizes && product.sizes.length > 0 && !selectedSize);
              
              if (hasOptions && needsSelection) {
                setIsOptionsModalOpen(true);
              } else {
                handleBuyNow();
              }
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-lg font-semibold text-base flex items-center justify-center gap-2 shadow-lg"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Comprar agora</span>
          </motion.button>
        </div>
      </div>

      {/* Options Selection Modal */}
      <AnimatePresence>
        {isOptionsModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOptionsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-[101] max-h-[90vh] overflow-y-auto safe-area-inset-bottom"
            >
              {/* Close Button */}
              <div className="sticky top-0 bg-card border-b border-border flex justify-end p-4 z-10">
                <button
                  onClick={() => setIsOptionsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Summary */}
              <div className="px-4 pt-4 pb-6 flex gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={getImageForColor(selectedColor)}
                    alt={product.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-2xl font-bold text-foreground">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </span>
                      {product.originalPrice && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-sm font-semibold text-destructive">
                            (-{discountPercent}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedColor && selectedSize && (
                    <p className="text-sm text-foreground">
                      {selectedColor}, {selectedSize}
                    </p>
                  )}
                </div>
              </div>

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="px-4 pb-6">
                  <p className="text-sm font-medium mb-3">Cor</p>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                          selectedColor === color
                            ? 'border-foreground bg-muted'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                          <img
                            src={getImageForColor(color)}
                            alt={color}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium">{color}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="px-4 pb-6">
                  <p className="text-sm font-medium mb-3">Tamanho</p>
                  <div className="grid grid-cols-5 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-12 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedSize === size
                            ? 'border-foreground bg-muted text-foreground'
                            : 'border-border hover:border-muted-foreground text-foreground'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="px-4 pb-6">
                <p className="text-sm font-medium mb-3">Quantidade</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Buy Button - Fixed at bottom */}
              <div className="sticky bottom-0 bg-card border-t border-border p-4 safe-area-inset-bottom">
                <motion.button
                  onClick={() => {
                    if (product.colors && product.colors.length > 0 && !selectedColor) {
                      toast.error('Por favor, selecione uma cor');
                      return;
                    }
                    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
                      toast.error('Por favor, selecione um tamanho');
                      return;
                    }
                    setIsOptionsModalOpen(false);
                    handleBuyNow();
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-lg font-semibold text-base flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Comprar agora</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default ProductPage;

