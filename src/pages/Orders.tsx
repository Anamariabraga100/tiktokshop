import { motion } from 'framer-motion';
import { Package, Search, Frown, ShoppingBag, Sparkles, ArrowRight, TrendingUp, Truck, CheckCircle2, Clock } from 'lucide-react';
import { Product, CartItem } from '@/types/product';
import { products } from '@/data/products';
import { HorizontalProductScroll } from '@/components/shop/ProductSection';
import { useCustomer } from '@/context/CustomerContext';
import { useState, useEffect } from 'react';

interface OrdersProps {
  onProductClick?: (product: Product) => void;
  onGoToShop?: () => void;
}

interface Order {
  orderNumber: string;
  items: CartItem[];
  totalPrice: number;
  paymentMethod: string;
  date: string;
  status: string;
  cpf: string | null;
}

export const Orders = ({ onProductClick, onGoToShop }: OrdersProps) => {
  const { customerData } = useCustomer();
  const [orders, setOrders] = useState<Order[]>([]);

  // Carregar pedidos do CPF atual
  useEffect(() => {
    if (customerData?.cpf) {
      const ordersKey = `orders_${customerData.cpf}`;
      const savedOrders = localStorage.getItem(ordersKey);
      if (savedOrders) {
        try {
          const parsedOrders = JSON.parse(savedOrders);
          // Ordenar por data (mais recente primeiro)
          const sortedOrders = parsedOrders.sort((a: Order, b: Order) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setOrders(sortedOrders);
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
        }
      }
    }
  }, [customerData?.cpf]);

  // Selecionar alguns produtos recomendados aleatórios ou populares
  const recommendedProducts = products
    .filter(p => p.rating >= 4.5 || p.soldCount > 1000)
    .sort((a, b) => (b.rating * b.soldCount) - (a.rating * a.soldCount))
    .slice(0, 8);

  // Produtos em destaque (top 3)
  const featuredProducts = recommendedProducts.slice(0, 3);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'em_preparacao':
        return {
          label: 'Em preparação',
          icon: Clock,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
        };
      case 'enviado':
        return {
          label: 'Enviado',
          icon: Truck,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
        };
      case 'entregue':
        return {
          label: 'Entregue',
          icon: CheckCircle2,
          color: 'text-success',
          bgColor: 'bg-success/10',
        };
      default:
        return {
          label: 'Em preparação',
          icon: Clock,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleGoToShop = () => {
    if (onGoToShop) {
      onGoToShop();
    } else {
      // Fallback: scroll to top e mudar para home tab se necessário
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <main className="px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto">
        {/* Lista de Pedidos */}
        {orders.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold mb-4">Meus Pedidos</h2>
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              return (
                <motion.div
                  key={order.orderNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold">Pedido #{order.orderNumber}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.date)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bgColor}`}>
                      <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                      <span className={`text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => {
                      const product = products.find(p => p.id === item.id);
                      if (!product) return null;
                      return (
                        <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qtd: {item.quantity} • R$ {product.price.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total e Método de Pagamento */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-primary">
                        R$ {order.totalPrice.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Pagamento</p>
                      <p className="text-sm font-medium capitalize">
                        {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State - Carinha Triste */}
        {orders.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center py-8 md:py-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mb-6 shadow-lg"
          >
            <Frown className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
            {/* Decorative sparkles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-primary/40" />
            </motion.div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-bold mb-3"
          >
            Você ainda não fez nenhum pedido
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-sm md:text-base max-w-md mb-6"
          >
            Que tal começar a explorar nossos produtos incríveis? Temos ofertas especiais esperando por você!
          </motion.p>

          {/* Botão CTA Principal - Estilo TikTok Shop */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoToShop}
            className="group relative px-8 py-4 md:px-10 md:py-5 bg-gradient-to-r from-tiktok-pink via-primary to-tiktok-pink text-white rounded-full font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <div className="relative flex items-center justify-center gap-3">
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
              <span>Começar a comprar</span>
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* Badge de oferta especial */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full"
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs md:text-sm font-medium text-primary">
              🎉 Frete grátis em compras acima de R$ 99
            </span>
          </motion.div>
        </motion.div>
        )}

        {/* Seção de Rastreamento - Melhorada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border p-6 mb-8 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-14 h-14 bg-gradient-to-br from-primary/20 to-tiktok-pink/20 rounded-2xl flex items-center justify-center">
              <Package className="w-7 h-7 text-primary" />
              {/* Decorative dot */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                Rastrear Pedido
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Novo
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Acompanhe seus pedidos pelo CPF de forma rápida e fácil
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-5 space-y-4 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm md:text-base font-semibold">Como rastrear seu pedido:</span>
            </div>
            <ul className="space-y-3 text-sm md:text-base text-foreground/80">
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-start gap-3"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span className="pt-0.5">Após finalizar sua compra, você receberá um código de rastreamento por email</span>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="flex items-start gap-3"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span className="pt-0.5">Você pode rastrear seu pedido informando o CPF utilizado na compra</span>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
                className="flex items-start gap-3"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span className="pt-0.5">O prazo de entrega varia de 5 a 7 dias úteis após a confirmação do pagamento</span>
              </motion.li>
            </ul>
          </div>
        </motion.div>

        {/* Banner de Oferta Especial */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 }}
          className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-tiktok-pink/10 to-primary/10 rounded-2xl border-2 border-primary/20 p-6 mb-8"
        >
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wide">
                  Oferta Especial
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-1">
                Primeira compra? Ganhe R$ 5 OFF! 🎁
              </h3>
              <p className="text-sm text-muted-foreground">
                Cupom de desconto aplicado automaticamente no primeiro pedido
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleGoToShop}
              className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-tiktok-pink to-primary rounded-full flex items-center justify-center text-white shadow-lg"
            >
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-tiktok-pink/5 rounded-full blur-xl" />
        </motion.div>

        {/* Produtos Recomendados */}
        {recommendedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <h2 className="text-xl md:text-2xl font-bold">Produtos que você pode gostar</h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
            </div>
            <HorizontalProductScroll
              title=""
              emoji=""
              products={recommendedProducts}
              onProductClick={onProductClick}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
};

