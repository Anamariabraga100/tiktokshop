import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ShoppingCart, Play, Plus, X, ChevronRight, ChevronLeft, Heart, Share2 } from 'lucide-react';
import { products } from '@/data/products';
import { Product, CartItem, CreatorVideo } from '@/types/product';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/context/CouponContext';
import { toast } from 'sonner';
import { VariantSelectorModal } from '@/components/shop/VariantSelectorModal';
import { shareContent } from '@/utils/share';

const ThankYou = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { activateCoupon } = useCoupons();
  const [purchasedItems, setPurchasedItems] = useState<CartItem[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [fullscreenVideoIndex, setFullscreenVideoIndex] = useState<number | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [videoStates, setVideoStates] = useState<{ [key: string]: { isLiked: boolean; likesCount: number; sharesCount: number } }>({});
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'paid' | 'pending' | 'expired' | 'error'>('checking');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // ⚠️ IMPORTANTE: Verificar status do pagamento quando página carregar (refresh-safe)
  // Isso garante que mesmo após refresh ou acesso direto, o status seja validado pelo backend
  useEffect(() => {
    const verifyPaymentStatus = async () => {
      // Obter transactionId (prioridade: state > sessionStorage > localStorage)
      let txId: string | null = null;
      
      // Primeiro: tentar do state (navegação com React Router)
      if (location.state?.transactionId) {
        txId = location.state.transactionId;
      } else {
        // Segundo: tentar do sessionStorage (fallback para window.location.href)
        const sessionState = sessionStorage.getItem('thankYouState');
        if (sessionState) {
          try {
            const parsed = JSON.parse(sessionState);
            txId = parsed.transactionId || null;
          } catch (e) {
            console.error('Erro ao recuperar transactionId do sessionStorage:', e);
          }
        }
        
        // Terceiro: tentar do localStorage (refresh da página)
        if (!txId) {
          const savedOrder = localStorage.getItem('lastOrder');
          if (savedOrder) {
            try {
              const order = JSON.parse(savedOrder);
              txId = order.umbrellaTransactionId || order.transactionId || null;
            } catch (e) {
              console.error('Erro ao recuperar transactionId:', e);
            }
          }
        }
      }

      if (!txId) {
        console.warn('⚠️ TransactionId não encontrado, assumindo pagamento pendente');
        setPaymentStatus('pending');
        return;
      }

      setTransactionId(txId);

      try {
        // ⚠️ CRÍTICO: Consultar backend para verificar status real
        // Nunca confiar apenas no frontend/localStorage
        const response = await fetch(`/api/order-status?transactionId=${txId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error('❌ Erro ao verificar status:', data.error);
          setPaymentStatus('error');
          return;
        }

        console.log('✅ Status verificado pelo backend:', {
          transactionId: txId,
          status: data.status
        });

        // ⚠️ Backend é a fonte da verdade
        if (data.status === 'PAID') {
          setPaymentStatus('paid');
        } else if (data.status === 'EXPIRED') {
          setPaymentStatus('expired');
          toast.error('O PIX expirou. Entre em contato com o suporte.', {
            duration: 5000
          });
        } else {
          // WAITING_PAYMENT ou outros
          setPaymentStatus('pending');
          // Mostrar aviso mas não redirecionar (permite acesso direto)
          toast.info('Pagamento ainda não confirmado.', {
            duration: 5000
          });
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status do pagamento:', error);
        setPaymentStatus('error');
        // Em caso de erro, apenas mostrar aviso (permite acesso direto)
        toast.error('Erro ao verificar status do pagamento.', {
          duration: 5000
        });
      }
    };

    verifyPaymentStatus();
  }, [location.state, navigate]);

  useEffect(() => {
    try {
      // Gerar número do pedido
      const orderNum = Math.random().toString(36).substring(2, 10).toUpperCase();
      setOrderNumber(orderNum);

      // Recuperar itens comprados (prioridade: state > sessionStorage > localStorage)
      let itemsToSet: CartItem[] = [];
      
      console.log('🔍 Tentando recuperar itens:', {
        hasLocationState: !!location.state?.items,
        hasSessionStorage: !!sessionStorage.getItem('thankYouState'),
        hasLocalStorage: !!localStorage.getItem('lastOrder')
      });
      
      if (location.state?.items) {
        // Primeiro: tentar do state (navegação com React Router)
        console.log('✅ Recuperando do location.state');
        itemsToSet = location.state.items || [];
      } else {
        // Segundo: tentar do sessionStorage (fallback para window.location.href)
        const sessionState = sessionStorage.getItem('thankYouState');
        if (sessionState) {
          try {
            console.log('✅ Recuperando do sessionStorage');
            const parsed = JSON.parse(sessionState);
            itemsToSet = parsed.items || [];
            console.log('📦 Itens do sessionStorage:', itemsToSet.length, itemsToSet);
            // Limpar sessionStorage após ler
            sessionStorage.removeItem('thankYouState');
          } catch (e) {
            console.error('❌ Erro ao recuperar state do sessionStorage:', e);
          }
        }
        
        // Terceiro: tentar do localStorage (refresh da página)
        if (itemsToSet.length === 0) {
          const savedOrder = localStorage.getItem('lastOrder');
          if (savedOrder) {
            try {
              console.log('✅ Recuperando do localStorage');
              const order = JSON.parse(savedOrder);
              itemsToSet = order.items || [];
              console.log('📦 Itens do localStorage:', itemsToSet.length, itemsToSet);
            } catch (e) {
              console.error('❌ Erro ao recuperar pedido:', e);
            }
          }
        }
      }
      
      // Validar e filtrar apenas itens válidos com id
      const validItems = Array.isArray(itemsToSet) 
        ? itemsToSet.filter(item => item && typeof item === 'object' && item.id)
        : [];
      
      if (validItems.length > 0) {
        console.log('✅ Itens válidos recuperados:', validItems.length);
        setPurchasedItems(validItems);
      } else {
        // Se não houver dados, apenas definir array vazio (permite acesso direto)
        setPurchasedItems([]);
      }
    } catch (error) {
      console.error('Erro ao inicializar ThankYou:', error);
      // Em caso de erro, apenas definir array vazio (permite acesso direto)
      setPurchasedItems([]);
    }
  }, [location.state, navigate, paymentStatus]);

  // Obter categorias dos produtos comprados
  const purchasedCategories = useMemo(() => {
    try {
      if (!purchasedItems || purchasedItems.length === 0) {
        return [];
      }
      const categories = new Set<string>();
      (purchasedItems || []).forEach(item => {
        if (item && typeof item === 'object' && item.category) {
          categories.add(item.category);
        }
      });
      return Array.from(categories);
    } catch (error) {
      console.error('Erro ao calcular categorias:', error);
      return [];
    }
  }, [purchasedItems]);

  // Produtos relacionados (mesma categoria dos comprados)
  // Sempre mostrar pelo menos 8 produtos
  const relatedProducts = useMemo(() => {
    try {
      // Validar e filtrar apenas itens válidos com id
      const validItems = Array.isArray(purchasedItems) 
        ? purchasedItems.filter(item => item && typeof item === 'object' && item && 'id' in item)
        : [];
      const purchasedIds = new Set(validItems.map(item => item?.id).filter(Boolean));
      let related: Product[] = [];
    
    // Primeiro, tentar pegar produtos da mesma categoria
    if (purchasedCategories.length > 0) {
      related = products.filter(product => {
        if (purchasedIds.has(product.id)) return false;
        return purchasedCategories.includes(product.category);
      });
    }
    
    // Se não tiver produtos relacionados ou tiver menos de 8, completar com os mais vendidos
    if (related.length < 8) {
      const allProducts = products
        .filter(product => {
          if (purchasedIds.has(product.id)) return false;
          // Se já tem produtos relacionados, não adicionar duplicados
          if (related.length > 0 && related.some(p => p.id === product.id)) return false;
          return true;
        })
        .sort((a, b) => b.soldCount - a.soldCount);
      
      // Adicionar produtos até completar 8
      const needed = 8 - related.length;
      related = [...related, ...allProducts.slice(0, needed)];
    }

      // Ordenar por mais vendidos e limitar a 8
      return related
        .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
        .slice(0, 8);
    } catch (error) {
      console.error('Erro ao calcular produtos relacionados:', error);
      return [];
    }
  }, [purchasedCategories, purchasedItems]);

  // Vídeos do criador (pegar vídeos de produtos relacionados)
  const creatorVideos = useMemo(() => {
    try {
      const videos: Array<{ product: Product; video: CreatorVideo }> = [];
      // Validar e filtrar apenas itens válidos com id
      const validItems = Array.isArray(purchasedItems)
        ? purchasedItems.filter(item => item && typeof item === 'object' && item && 'id' in item)
        : [];
      const purchasedIds = new Set(validItems.map(item => item?.id).filter(Boolean));
    
    // Primeiro, pegar produtos com mais vídeos (priorizar Kit Barbeador que tem 6 vídeos)
    // Ordenar por: quantidade de vídeos (desc), depois por soldCount (desc)
    const productsWithVideos = products
      .filter(p => !purchasedIds.has(p.id) && p.creatorVideos && p.creatorVideos.length > 0)
      .sort((a, b) => {
        // Priorizar produtos com mais vídeos
        const aVideoCount = a.creatorVideos?.length || 0;
        const bVideoCount = b.creatorVideos?.length || 0;
        if (bVideoCount !== aVideoCount) {
          return bVideoCount - aVideoCount;
        }
        // Se tiverem a mesma quantidade de vídeos, ordenar por vendas
        return (b.soldCount || 0) - (a.soldCount || 0);
      });
    
      // Adicionar vídeos até o limite, priorizando produtos com mais vídeos
    productsWithVideos.forEach(product => {
      if (product.creatorVideos && videos.length < 15) {
        product.creatorVideos.forEach(video => {
          if (videos.length < 15) {
            videos.push({ product, video });
          }
        });
      }
      });
      
      return videos;
    } catch (error) {
      console.error('Erro ao calcular vídeos do criador:', error);
      return [];
    }
  }, [purchasedItems]);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Verificar se o produto requer seleção de cor ou tamanho
    const requiresColor = product.colors && product.colors.length > 0;
    const requiresSize = product.sizes && product.sizes.length > 0;
    
    // Se requer seleção, abrir modal de variantes
    if (requiresColor || requiresSize) {
      setVariantModalProduct(product);
      return;
    }
    
    // Caso contrário, adicionar diretamente
    addToCart(product, product.sizes?.[0], product.colors?.[0]);
    
    // Aplicar cupom de frete grátis
    localStorage.setItem('freeShippingFromThankYou', 'true');
    
    // Adicionar delay para que a notificação apareça após a notificação de produto adicionado
    setTimeout(() => {
      toast.success('Frete grátis aplicado!', {
        duration: 3000,
        id: 'free-shipping-applied',
      });
    }, 300);
    
    // Voltar para a página inicial com header e footer
    setTimeout(() => {
      navigate('/');
      // Abrir carrinho automaticamente
      localStorage.setItem('openCart', 'true');
    }, 500);
  };

  const handleVariantConfirm = (size?: string, color?: string) => {
    if (!variantModalProduct) return;
    
    addToCart(variantModalProduct, size, color);
    
    // Aplicar cupom de frete grátis
    localStorage.setItem('freeShippingFromThankYou', 'true');
    
    // Adicionar delay para que a notificação apareça após a notificação de produto adicionado
    setTimeout(() => {
      toast.success('Frete grátis aplicado!', {
        duration: 3000,
        id: 'free-shipping-applied',
      });
    }, 300);
    
    // Voltar para a página inicial com header e footer
    setTimeout(() => {
      navigate('/');
      // Abrir carrinho automaticamente
      localStorage.setItem('openCart', 'true');
    }, 500);
  };

  // Função para gerar likes determinístico baseado no ID do vídeo
  const getLikesCount = useCallback((videoId: string, productLikesCount?: number) => {
    // Se o produto tem likesCount, usar ele
    if (productLikesCount) return productLikesCount;
    // Caso contrário, gerar determinístico baseado no ID com melhor distribuição
    let hash = 0;
    for (let i = 0; i < videoId.length; i++) {
      const char = videoId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Usar múltiplos fatores para garantir melhor distribuição
    const seed = hash * 9301 + 49297; // Números primos para melhor distribuição
    // Gerar número entre 10000 e 60000 com melhor distribuição
    return Math.abs(seed % 50000) + 10000;
  }, []);

  const handleVideoClick = (index: number) => {
    if (index < 0 || index >= creatorVideos.length) return;
    setFullscreenVideoIndex(index);
    // Inicializar estado do vídeo se não existir
    const video = creatorVideos[index];
    if (video && video.video && video.video.id && !videoStates[video.video.id]) {
      const initialLikes = getLikesCount(video.video.id, video.product?.likesCount);
      setVideoStates(prev => ({
        ...prev,
        [video.video.id]: {
          isLiked: false,
          likesCount: initialLikes,
          sharesCount: Math.floor(Math.random() * 1000) + 200,
        }
      }));
    }
  };

  const handleCloseFullscreen = () => {
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.pause();
      fullscreenVideoRef.current.currentTime = 0;
    }
    setFullscreenVideoIndex(null);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullscreenVideo || !fullscreenVideo.video || !fullscreenVideo.video.id) return;
    
    const videoId = fullscreenVideo.video.id;
    const currentState = videoStates[videoId] || {
      isLiked: false,
      likesCount: fullscreenVideo.product?.likesCount || Math.floor(Math.random() * 50000) + 10000,
      sharesCount: Math.floor(Math.random() * 1000) + 200,
    };
    
    const newIsLiked = !currentState.isLiked;
    setVideoStates(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        isLiked: newIsLiked,
        likesCount: newIsLiked 
          ? (prev[videoId]?.likesCount || currentState.likesCount) + 1 
          : Math.max(0, (prev[videoId]?.likesCount || currentState.likesCount) - 1),
        sharesCount: prev[videoId]?.sharesCount || currentState.sharesCount,
      }
    }));
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullscreenVideo || !fullscreenVideo.video || !fullscreenVideo.video.id || !fullscreenVideo.product) return;
    
    const videoId = fullscreenVideo.video.id;
    const shareText = fullscreenVideo.video.title 
      ? `Confira este vídeo: ${fullscreenVideo.video.title}`
      : `Confira este vídeo de ${fullscreenVideo.video.creatorName || 'criador'}`;
    
    const shareUrl = fullscreenVideo.product.url || `${window.location.origin}/produto/${fullscreenVideo.product.id}`;
    
    const success = await shareContent(
      fullscreenVideo.video.title || 'Vídeo de criador',
      shareText,
      shareUrl
    );
    
    if (success) {
      const currentState = videoStates[videoId] || {
        isLiked: false,
        likesCount: fullscreenVideo.product?.likesCount || Math.floor(Math.random() * 50000) + 10000,
        sharesCount: Math.floor(Math.random() * 1000) + 200,
      };
      
      setVideoStates(prev => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          sharesCount: (prev[videoId]?.sharesCount || currentState.sharesCount) + 1,
          likesCount: prev[videoId]?.likesCount || currentState.likesCount,
          isLiked: prev[videoId]?.isLiked || false,
        }
      }));
      
      if (navigator.share) {
        toast.success('Compartilhado com sucesso!', { id: 'video-share' });
      } else {
        toast.success('Link copiado para a área de transferência!', { id: 'video-share' });
      }
    }
  };

  const handleNextVideo = () => {
    if (!creatorVideos || fullscreenVideoIndex === null || creatorVideos.length === 0) return;
    const nextIndex = (fullscreenVideoIndex + 1) % creatorVideos.length;
    setFullscreenVideoIndex(nextIndex);
  };

  const handlePreviousVideo = () => {
    if (!creatorVideos || fullscreenVideoIndex === null || creatorVideos.length === 0) return;
    const prevIndex = fullscreenVideoIndex === 0 ? creatorVideos.length - 1 : fullscreenVideoIndex - 1;
    setFullscreenVideoIndex(prevIndex);
  };

  const fullscreenVideo = fullscreenVideoIndex !== null && creatorVideos && creatorVideos.length > 0 
    ? creatorVideos[fullscreenVideoIndex] 
    : null;

  // SEMPRE renderizar a página, mesmo sem dados completos

  // ⚠️ IMPORTANTE: Mostrar estado de verificação do pagamento
  // Backend é a fonte da verdade - nunca confiar apenas no frontend
  const renderPaymentStatus = () => {
    if (paymentStatus === 'checking') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-4"
          >
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Verificando Pagamento...
          </h1>
          <p className="text-lg text-muted-foreground">
            Aguarde enquanto confirmamos seu pagamento
          </p>
        </motion.div>
      );
    }

    if (paymentStatus === 'pending' || paymentStatus === 'error') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-warning/20 rounded-full mb-4"
          >
            <X className="w-16 h-16 text-warning" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Pagamento Não Confirmado
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Seu pagamento ainda não foi confirmado pelo sistema
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecionando...
          </p>
        </motion.div>
      );
    }

    if (paymentStatus === 'expired') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-destructive/20 rounded-full mb-4"
          >
            <X className="w-16 h-16 text-destructive" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            PIX Expirado
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            O código PIX expirou
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecionando...
          </p>
        </motion.div>
      );
    }

    // paymentStatus === 'paid' (confirmado pelo backend)
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-success/20 rounded-full mb-4"
        >
          <CheckCircle2 className="w-16 h-16 text-success" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Pagamento Confirmado!
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          Pedido #{orderNumber} está sendo preparado
        </p>
        <p className="text-sm text-muted-foreground">
          Você receberá atualizações por email
        </p>
      </motion.div>
    );
  };

  // Log para debug
  console.log('🔍 ThankYou Render:', {
    paymentStatus,
    purchasedItemsCount: purchasedItems?.length || 0,
    orderNumber,
    relatedProductsCount: relatedProducts?.length || 0,
    creatorVideosCount: creatorVideos?.length || 0,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Confirmação de Pagamento - Verificação pelo Backend */}
        {renderPaymentStatus()}

        {/* Oportunidade Exclusiva */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl p-5 md:p-6 mb-6 text-center"
        >
          <p className="text-base md:text-lg font-bold text-foreground mb-2">
            🎁 Adicione mais produtos e envie tudo junto
          </p>
          <p className="text-sm md:text-base text-muted-foreground">
            Frete grátis no mesmo pedido
          </p>
        </motion.div>

        {/* Produtos Relacionados */}
        {relatedProducts && relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-2">
              Aproveite mais produtos com frete grátis
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Produtos relacionados à sua compra
            </p>
            
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
              <div className="flex gap-3 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4">
                {(relatedProducts || []).filter(p => p && typeof p === 'object' && 'id' in p).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="flex-shrink-0 w-40 md:w-auto bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all group cursor-pointer"
                    onClick={(e) => {
                      handleAddToCart(product, e);
                    }}
                  >
                    <div className="relative aspect-square bg-muted">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {product.isHotDeal && (
                        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full">
                          🔥 Hot
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product, e);
                        }}
                        className="absolute bottom-2 right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 z-20"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium line-clamp-2 mb-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-primary mb-2">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                        {product.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through ml-1">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </p>
                      <Button
                        size="sm"
                        className="w-full gap-2 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product, e);
                        }}
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Adicionar
                      </Button>
                      <p className="text-xs text-success mt-1 text-center font-medium">
                        🚚 Frete grátis
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Vídeos do Criador - Estilo TikTok */}
        {creatorVideos && creatorVideos.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-2">
              Produtos que talvez você possa gostar
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Confira estes produtos em vídeo
            </p>
            
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {(creatorVideos || []).filter(v => v && v.product && v.video && typeof v.video === 'object' && 'id' in v.video).map(({ product, video }, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="flex-shrink-0 w-[160px]"
                >
                  <div
                    className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted cursor-pointer group"
                    onClick={() => handleVideoClick(index)}
                  >
                    {/* Thumbnail do vídeo */}
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title || product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          const video = e.currentTarget;
                          video.currentTime = 1;
                        }}
                      />
                    )}

                    {/* Play Overlay - Sempre visível */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity group-hover:bg-black/30">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
                      </div>
                    </div>

                    {/* Title Overlay */}
                    {video.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs font-medium line-clamp-2">
                          {video.title}
                        </p>
                      </div>
                    )}

                    {/* Product Price Badge */}
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      R$ {product.price.toFixed(0).replace('.', ',')}
                    </div>

                    {/* Likes no lado direito - Estilo TikTok */}
                    {(() => {
                      // Usar o mesmo número de likes que será usado no fullscreen
                      const videoState = videoStates[video.video.id];
                      const initialLikes = videoState?.likesCount || getLikesCount(video.video.id, product.likesCount);
                      const formattedLikes = initialLikes > 1000 
                        ? (initialLikes / 1000).toFixed(1).replace('.', ',') + 'mil' 
                        : initialLikes.toString();
                      return (
                        <div className="absolute right-2 top-2 flex flex-col items-center gap-1 z-10">
                          <div className="flex flex-col items-center gap-0.5">
                            <Heart className="w-5 h-5 text-white drop-shadow-lg" />
                            <span className="text-white text-[10px] font-semibold drop-shadow-lg">
                              {formattedLikes}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Creator Info e Product Name */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-tiktok-pink/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-semibold text-foreground">
                          {video.creatorInitials}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">
                        {video.creatorName}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                      {product.name}
                    </p>
                    <Button
                      size="sm"
                      className="w-full mt-2 gap-1 text-xs font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product, e);
                      }}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Adicionar
                    </Button>
                    <p className="text-[10px] text-success mt-1 text-center font-medium">
                      🚚 Frete grátis
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Fullscreen Video Modal - Estilo TikTok */}
        <AnimatePresence>
          {fullscreenVideo && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseFullscreen}
                className="fixed inset-0 bg-black z-[100]"
              />

              <div className="fixed inset-0 z-[101] flex flex-col bg-black overflow-hidden">
                <button
                  onClick={handleCloseFullscreen}
                  className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative flex-1 overflow-hidden">
                  <video
                    key={fullscreenVideoIndex}
                    ref={fullscreenVideoRef}
                    src={fullscreenVideo.video.videoUrl}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    autoPlay
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fullscreenVideoRef.current) {
                        if (fullscreenVideoRef.current.paused) {
                          fullscreenVideoRef.current.play();
                        } else {
                          fullscreenVideoRef.current.pause();
                        }
                      }
                    }}
                  />

                  {/* Right Side Actions - Likes e Share */}
                  {(() => {
                    const currentState = fullscreenVideo ? (videoStates[fullscreenVideo.video.id] || {
                      isLiked: false,
                      likesCount: getLikesCount(fullscreenVideo.video.id, fullscreenVideo.product.likesCount),
                      sharesCount: Math.floor(Math.random() * 1000) + 200,
                    }) : null;
                    
                    return currentState ? (
                      <div className="absolute right-4 md:right-8 bottom-20 md:bottom-32 flex flex-col gap-4 md:gap-6 z-10">
                        {/* Like Button */}
                        <button
                          onClick={handleLike}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                            <Heart className={`w-6 h-6 ${currentState.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                          </div>
                          <span className="text-white text-xs font-medium">
                            {currentState.likesCount > 1000 
                              ? (currentState.likesCount / 1000).toFixed(1).replace('.', ',') + 'mil' 
                              : currentState.likesCount}
                          </span>
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={handleShare}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                            <Share2 className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-white text-xs font-medium">
                            {currentState.sharesCount > 1000 
                              ? (currentState.sharesCount / 1000).toFixed(1).replace('.', ',') + 'mil' 
                              : currentState.sharesCount}
                          </span>
                        </button>
                      </div>
                    ) : null;
                  })()}

                  {/* Product Info Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-tiktok-pink/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-foreground">
                          {fullscreenVideo.video.creatorInitials}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">
                          {fullscreenVideo.video.creatorName}
                        </p>
                        {fullscreenVideo.video.title && (
                          <p className="text-white/90 text-sm line-clamp-2">
                            {fullscreenVideo.video.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Product Card */}
                    <div 
                      className="bg-black/80 backdrop-blur-sm p-3 md:p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-black/90 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(fullscreenVideo.product, e);
                      }}
                    >
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={fullscreenVideo.product.image}
                          alt={fullscreenVideo.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm md:text-base line-clamp-1">
                          {fullscreenVideo.product.name}
                        </p>
                        <p className="text-white/80 text-xs md:text-sm">
                          R$ {fullscreenVideo.product.price.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextVideo();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousVideo();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Variant Selector Modal */}
        <VariantSelectorModal
          isOpen={variantModalProduct !== null}
          onClose={() => setVariantModalProduct(null)}
          product={variantModalProduct}
          onConfirm={handleVariantConfirm}
        />
      </div>
    </div>
  );
};

export default ThankYou;
