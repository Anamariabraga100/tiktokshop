import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product } from '@/types/product';
import { toast } from 'sonner';
import { trackAddToCart } from '@/lib/facebookPixel';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size?: string, color?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, size?: string, color?: string) => {
    setItems((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingItem) {
        // Não mostrar notificação de quantidade atualizada
        return prev.map((item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      toast.success('Adicionado ao carrinho!', { id: `cart-add-${product.id}` });
      
      // Rastrear evento AddToCart no Facebook Pixel
      trackAddToCart(
        product.id,
        product.name,
        product.price,
        1,
        product.category
      );
      
      return [
        ...prev,
        { ...product, quantity: 1, selectedSize: size, selectedColor: color },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
    toast.success('Removido do carrinho!', { id: `cart-remove-${productId}` });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    // Não mostrar toast ao limpar carrinho após pagamento
  };

  // Calcular total
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
