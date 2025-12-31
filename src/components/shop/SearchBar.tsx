import { Search, Camera, Mic, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = 'Buscar produtos...' }: SearchBarProps) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex items-center"
    >
      <div className="relative flex-1 flex items-center bg-secondary rounded-full overflow-hidden border border-border md:max-w-2xl md:mx-auto">
        <Search className="w-5 h-5 ml-4 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 py-3 px-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm md:text-base md:py-4"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Mic className="w-5 h-5" />
        </button>
        <button className="p-3 text-muted-foreground hover:text-foreground transition-colors border-l border-border">
          <Camera className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};
