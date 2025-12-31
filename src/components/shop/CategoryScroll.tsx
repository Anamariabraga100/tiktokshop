import { motion } from 'framer-motion';
import { Category } from '@/types/product';

interface CategoryScrollProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

export const CategoryScroll = ({ categories, selectedCategory, onSelect }: CategoryScrollProps) => {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-3 md:gap-4 pb-2 md:flex-wrap md:justify-center"
      >
        <button
          onClick={() => onSelect(null)}
          className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-tiktok-pink to-primary text-white'
              : 'bg-secondary text-secondary-foreground hover:bg-muted'
          }`}
        >
          Todos
        </button>
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(category.id)}
            className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all flex items-center gap-2 ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-tiktok-pink to-primary text-white'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            <span className="text-base md:text-lg">{category.icon}</span>
            <span>{category.name}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};
