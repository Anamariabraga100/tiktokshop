import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/shop/Header';
import { SearchBar } from '@/components/shop/SearchBar';
import { CategoryScroll } from '@/components/shop/CategoryScroll';
import { QuickActions } from '@/components/shop/QuickActions';
import { PromoBanner } from '@/components/shop/PromoBanner';
import { ProductSection, HorizontalProductScroll } from '@/components/shop/ProductSection';
import { ProductDrawer } from '@/components/shop/ProductDrawer';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { CouponsDrawer } from '@/components/shop/CouponsDrawer';
import { HelpDrawer } from '@/components/shop/HelpDrawer';
import { ExitCouponModal } from '@/components/shop/ExitCouponModal';
import { AddressModal } from '@/components/shop/AddressModal';
import { BottomNav } from '@/components/shop/BottomNav';
import { ScrollToTop } from '@/components/shop/ScrollToTop';
import { products, categories } from '@/data/products';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { Orders } from './Orders';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'sold';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExitCouponModalOpen, setIsExitCouponModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [headerTab, setHeaderTab] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const { totalItems } = useCart();

  // Verificar se há ID de produto na URL e abrir automaticamente
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    // Se a URL for /produto/:id, abrir o produto
    if (pathParts[0] === 'produto' && pathParts[1]) {
      const productIdFromUrl = pathParts[1];
      const product = products.find(p => p.id === productIdFromUrl);
      if (product && product.id !== selectedProduct?.id) {
        setSelectedProduct(product);
        setIsProductDrawerOpen(true);
      } else if (!product) {
        // Produto não encontrado, redirecionar para home
        navigate('/', { replace: true });
      }
    } else if (pathParts.length === 0 || pathParts[0] === '') {
      // Se estiver na home e houver produto aberto, fechar
      if (selectedProduct && isProductDrawerOpen) {
        setSelectedProduct(null);
        setIsProductDrawerOpen(false);
      }
    }
  }, [location.pathname, selectedProduct, isProductDrawerOpen, navigate]);

  // Handle tab changes
  useEffect(() => {
    if (activeTab === 'deals') {
      setSelectedCategory(null);
      setSearchQuery('');
    }
    // Scroll to top when tab changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Verificar se deve abrir o carrinho (vindo da página de agradecimento)
  useEffect(() => {
    const shouldOpenCart = localStorage.getItem('openCart');
    if (shouldOpenCart === 'true') {
      setIsCartOpen(true);
      localStorage.removeItem('openCart');
    }
  }, []);

  // Detectar quando o usuário tenta sair do site
  useEffect(() => {
    let hasShownModal = false;

    // Detectar quando o mouse sai da janela (tentativa de fechar)
    const handleMouseLeave = (e: MouseEvent) => {
      // Só ativa se o mouse sair pela parte superior da janela (indicando fechamento)
      if (e.clientY <= 0 && !hasShownModal && !isExitCouponModalOpen) {
        const hasShownToday = sessionStorage.getItem('exitCouponShown');
        if (!hasShownToday) {
          hasShownModal = true;
          setIsExitCouponModalOpen(true);
          sessionStorage.setItem('exitCouponShown', 'true');
        }
      }
    };

    // Detectar quando o usuário tenta navegar para outra página (mudança de aba)
    const handleVisibilityChange = () => {
      if (document.hidden && !hasShownModal && !isExitCouponModalOpen) {
        const hasShownToday = sessionStorage.getItem('exitCouponShown');
        if (!hasShownToday) {
          hasShownModal = true;
          setIsExitCouponModalOpen(true);
          sessionStorage.setItem('exitCouponShown', 'true');
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isExitCouponModalOpen]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by header tab
    if (headerTab === 'AO VIVO') {
      result = result.filter((p) => p.isLive);
    } else if (headerTab === 'Ofertas') {
      // Produtos com desconto (originalPrice > price)
      result = result.filter((p) => p.originalPrice && p.originalPrice > p.price);
      // Ordenar por maior desconto
      result.sort((a, b) => {
        const discountA = a.originalPrice && a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discountB = b.originalPrice && b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discountB - discountA;
      });
    } else if (headerTab === 'Novidades') {
      // Produtos novos: isNewCustomerDeal, isHotDeal, ou com alta avaliação recente
      result = result.filter((p) => 
        p.isNewCustomerDeal || 
        p.isHotDeal ||
        (p.rating >= 4.5 && p.soldCount < 500) // Produtos bem avaliados mas pouco vendidos (novos)
      );
      // Ordenar por rating e depois por soldCount (menos vendidos primeiro = mais novos)
      result.sort((a, b) => {
        if (a.rating !== b.rating) return b.rating - a.rating;
        return a.soldCount - b.soldCount;
      });
    } else if (headerTab === 'Mais Vendidos') {
      // Ordenar por quantidade vendida (mais vendidos primeiro)
      result.sort((a, b) => b.soldCount - a.soldCount);
    }

    // Filter by tab
    if (activeTab === 'deals') {
      result = result.filter((p) => p.isHotDeal);
    }

    // Filter by category
    if (selectedCategory) {
      const category = categories.find((c) => c.id === selectedCategory);
      if (category) {
        result = result.filter((p) => p.category === category.name);
      }
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Sort products
    const sorted = [...result];
    switch (sortOption) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'sold':
        sorted.sort((a, b) => b.soldCount - a.soldCount);
        break;
      default:
        break;
    }

    return sorted;
  }, [selectedCategory, searchQuery, activeTab, sortOption, headerTab]);

  // Produtos mais baratos do site (ordenados por preço)
  const cheapestProducts = [...products]
    .sort((a, b) => a.price - b.price)
    .slice(0, 8);
  
  const hotDeals = products.filter((p) => p.isHotDeal);
  const newCustomerDeals = products.filter((p) => p.isNewCustomerDeal);
  const mostSold = [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 4);

  const handleProductClick = (product: Product) => {
    // Se o produto tiver URL, abrir em nova aba para tráfego pago
    if (product.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer');
      return;
    }
    // Atualizar URL para o produto
    navigate(`/produto/${product.id}`, { replace: false });
    // Abrir o drawer
    setSelectedProduct(product);
    setIsProductDrawerOpen(true);
  };

  const handleBuyNow = () => {
    setIsProductDrawerOpen(false);
    setIsCartOpen(true);
  };

  const scrollToOffers = () => {
    // Se estiver na aba home, rola para ofertas, senão muda para aba de ofertas
    if (activeTab === 'home') {
      document.getElementById('offers-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveTab('deals');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'price-asc':
        return 'Menor preço';
      case 'price-desc':
        return 'Maior preço';
      case 'rating':
        return 'Melhor avaliação';
      case 'sold':
        return 'Mais vendidos';
      default:
        return 'Padrão';
    }
  };

  const handleHeaderTabClick = (tab: string) => {
    if (tab === 'Ajuda') {
      setIsHelpOpen(true);
      return;
    }
    // Nova lógica: todas as abas definem o headerTab, exceto se não houver seleção
    setHeaderTab(tab);
    setSelectedCategory(null);
    setSearchQuery('');
    setActiveTab('home');
    
    // Scroll suave para o topo quando mudar de aba
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const getSectionTitle = () => {
    if (headerTab === 'Ajuda') {
      return 'Ajuda';
    }
    if (headerTab === 'Novidades') {
      return '✨ Novidades';
    }
    if (headerTab === 'Mais Vendidos') {
      return '🏆 Mais Vendidos';
    }
    if (activeTab === 'deals') {
      return 'Ofertas especiais';
    }
    if (selectedCategory) {
      return categories.find((c) => c.id === selectedCategory)?.name || 'Produtos';
    }
    if (searchQuery) {
      return `Resultados para "${searchQuery}"`;
    }
    return 'Recomendados para você';
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <Header 
        onCartClick={() => setIsCartOpen(true)} 
        onCategorySelect={setSelectedCategory}
        onCouponsClick={() => setIsCouponsOpen(true)}
        onTabClick={handleHeaderTabClick}
        activeHeaderTab={headerTab}
        onAddressClick={() => setIsAddressModalOpen(true)}
      />

      <main className="px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto">
        {activeTab === 'orders' ? (
          <Orders 
            onProductClick={handleProductClick} 
            onGoToShop={() => {
              setActiveTab('home');
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }}
          />
        ) : (
          <>
            <div className="mb-4">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar produtos, marcas..." />
            </div>

            {activeTab === 'home' && (
          <>
            <QuickActions 
              onCouponsClick={() => setIsCouponsOpen(true)} 
              onOffersClick={scrollToOffers}
              onAddressClick={() => setIsAddressModalOpen(true)}
            />

            <div className="mb-6 md:mb-8">
              <PromoBanner 
                onOffersClick={scrollToOffers}
                onCouponsClick={() => setIsCouponsOpen(true)}
              />
            </div>
          </>
        )}

        <div className="mb-6 md:mb-8">
          <CategoryScroll categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        {/* Sort and Filter Bar */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <p className="text-sm md:text-base text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {getSortLabel(sortOption)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOption('default')}>Padrão</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('price-asc')}>Menor preço</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('price-desc')}>Maior preço</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('rating')}>Melhor avaliação</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('sold')}>Mais vendidos</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {cheapestProducts.length > 0 && !selectedCategory && activeTab === 'home' && (
          <div id="offers-section" className="mb-6 md:mb-8">
            <HorizontalProductScroll title="Ofertas Relâmpago" emoji="⚡" products={cheapestProducts} onProductClick={handleProductClick} />
          </div>
        )}

        {!selectedCategory && activeTab === 'home' && (
          <div className="mb-6 md:mb-8">
            <HorizontalProductScroll title="Mais vendidos" emoji="🏆" products={mostSold} onProductClick={handleProductClick} />
          </div>
        )}

        <ProductSection
          title={getSectionTitle()}
          emoji={
            headerTab === 'Ofertas' ? '🔥' : 
            headerTab === 'Novidades' ? '✨' : 
            headerTab === 'Mais Vendidos' ? '🏆' : 
            activeTab === 'deals' ? '🔥' : 
            selectedCategory ? categories.find((c) => c.id === selectedCategory)?.icon : '💎'
          }
          products={filteredProducts}
          onProductClick={handleProductClick}
        />

        {newCustomerDeals.length > 0 && !selectedCategory && activeTab === 'home' && (
          <div className="mt-6 md:mt-8">
            <ProductSection title="Ofertas para novos clientes" emoji="✨" products={newCustomerDeals} onProductClick={handleProductClick} />
          </div>
        )}

        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 px-4"
          >
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-6">Tente ajustar sua busca ou filtros</p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              {(searchQuery || selectedCategory) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
              {activeTab === 'deals' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab('home');
                  }}
                >
                  Ver todos os produtos
                </Button>
              )}
            </div>
          </motion.div>
        )}
          </>
        )}
      </main>

      <ScrollToTop />
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onCouponsClick={() => setIsCouponsOpen(true)}
      />
      <ProductDrawer 
        product={selectedProduct} 
        isOpen={isProductDrawerOpen} 
        onClose={() => {
          setIsProductDrawerOpen(false);
          // Limpar URL quando fechar o drawer
          if (location.pathname.startsWith('/produto/')) {
            navigate('/', { replace: true });
          }
        }} 
        onBuyNow={handleBuyNow}
        onProductClick={handleProductClick}
      />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <CouponsDrawer isOpen={isCouponsOpen} onClose={() => setIsCouponsOpen(false)} />
      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ExitCouponModal 
        isOpen={isExitCouponModalOpen} 
        onClose={() => setIsExitCouponModalOpen(false)}
        onCouponSelected={() => {
          // Cupom já foi ativado pelo modal
        }}
      />
      <AddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)}
        onAddAddress={() => setIsAddressModalOpen(false)}
      />
    </div>
  );
};

export default Index;
