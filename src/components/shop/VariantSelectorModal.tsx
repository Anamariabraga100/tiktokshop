import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface VariantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (size?: string, color?: string) => void;
}

export const VariantSelectorModal = ({ isOpen, onClose, product, onConfirm }: VariantSelectorModalProps) => {
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();

  // Resetar seleções quando o modal fecha ou o produto muda
  useEffect(() => {
    if (!isOpen || !product) {
      setSelectedSize(undefined);
      setSelectedColor(undefined);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleConfirm = () => {
    // Validar se cor/tamanho foram selecionados quando necessário
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      return;
    }
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      return;
    }
    
    onConfirm(selectedSize, selectedColor);
    // Resetar seleções
    setSelectedSize(undefined);
    setSelectedColor(undefined);
    onClose();
  };

  const canConfirm = 
    (!product.colors || product.colors.length === 0 || selectedColor) &&
    (!product.sizes || product.sizes.length === 0 || selectedSize);

  const handleClose = () => {
    setSelectedSize(undefined);
    setSelectedColor(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{product.name}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Selecione as opções desejadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Color Selection */}
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

          {/* Size Selection */}
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
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

