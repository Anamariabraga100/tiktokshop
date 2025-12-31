import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { CartItem, Product } from '@/types/product';
import { toast } from 'sonner';
import miniKitCanetas from '@/assets/products/Mini Kit canetas.png';

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
        toast.success('Quantidade atualizada!');
        return prev.map((item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      toast.success('Adicionado ao carrinho!');
      return [
        ...prev,
        { ...product, quantity: 1, selectedSize: size, selectedColor: color },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    // Não permite remover brindes manualmente
    const item = items.find(i => i.id === productId);
    if (item?.isGift) {
      toast.info('O brinde será removido automaticamente se o valor do pedido cair abaixo de R$100');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== productId));
    toast.success('Removido do carrinho!');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    // Não permite alterar quantidade de brindes
    const item = items.find(i => i.id === productId);
    if (item?.isGift) {
      toast.info('A quantidade do brinde não pode ser alterada');
      return;
    }
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
    toast.success('Carrinho limpo!');
  };

  // Calcular total sem brindes
  const regularItems = items.filter(item => !item.isGift);
  const totalItems = regularItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = regularItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Brinde: Mini Kit de Canetas (adiciona automaticamente quando total >= R$100)
  const giftThreshold = 100;
  const hasGift = totalPrice >= giftThreshold;
  const giftProduct: CartItem = useMemo(() => ({
    id: 'gift-mini-kit-canetas',
    name: 'Mini Kit de Canetas Coloridas',
    price: 0,
    image: miniKitCanetas,
    rating: 5.0,
    soldCount: 0,
    category: 'Brinde',
    quantity: 1,
    isGift: true,
  }), []);

  const hasGiftInCart = items.some(item => item.id === 'gift-mini-kit-canetas');

  // Adicionar ou remover brinde automaticamente
  useEffect(() => {
    if (hasGift && !hasGiftInCart) {
      // Adicionar brinde
      setItems((prev) => [...prev, giftProduct]);
      toast.success('🎁 Brinde adicionado! Mini Kit de Canetas Coloridas');
    } else if (!hasGift && hasGiftInCart) {
      // Remover brinde se o valor cair abaixo de R$100
      setItems((prev) => prev.filter(item => item.id !== 'gift-mini-kit-canetas'));
    }
  }, [hasGift, hasGiftInCart, giftProduct]);

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
