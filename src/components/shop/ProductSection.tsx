import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Product } from '@/types/product';
import { ProductCard } from './ProductCard';

interface ProductSectionProps {
  title: string;
  emoji?: string;
  products: Product[];
  onProductClick: (product: Product) => void;
  viewAll?: boolean;
}

export const ProductSection = ({ 
  title, 
  emoji, 
  products, 
  onProductClick,
  viewAll = true 
}: ProductSectionProps) => {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-2">
          {emoji && <span>{emoji}</span>}
          {title}
        </h2>
        {viewAll && (
          <button className="flex items-center gap-1 text-sm md:text-base text-muted-foreground hover:text-foreground transition-colors">
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product)}
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

interface HorizontalProductScrollProps {
  title: string;
  emoji?: string;
  products: Product[];
  onProductClick: (product: Product) => void;
}

export const HorizontalProductScroll = ({ 
  title, 
  emoji, 
  products, 
  onProductClick 
}: HorizontalProductScrollProps) => {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-2">
          {emoji && <span>{emoji}</span>}
          {title}
        </h2>
        <button className="flex items-center gap-1 text-sm md:text-base text-muted-foreground hover:text-foreground transition-colors">
          Ver todos
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        <div className="flex gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              className="flex-shrink-0 w-40 md:w-auto"
            >
              <div 
                onClick={() => onProductClick(product)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                  {product.isHotDeal && (
                    <span className="absolute top-2 left-2 badge-hot-deal text-[10px]">
                      🔥 Hot
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-2 mb-1">{product.name}</p>
                <p className="text-primary font-bold">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                  {product.originalPrice && (
                    <span className="text-muted-foreground line-through text-xs ml-2">
                      R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
