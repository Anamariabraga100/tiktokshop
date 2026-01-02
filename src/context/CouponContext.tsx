import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  minOrder: number;
  expiresAt: Date | null;
  isActive: boolean;
  isActivated: boolean;
}

interface CouponContextType {
  coupons: Coupon[];
  activeCoupon: Coupon | null;
  activateCoupon: (couponId: string) => void;
  deactivateCoupon: () => void;
  getApplicableCoupon: (orderTotal: number) => Coupon | null;
  couponTimeRemaining: number | null;
  isFirstPurchase: () => boolean;
  markPurchaseCompleted: () => void;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

const initialCoupons: Coupon[] = [
  {
    id: '1',
    code: 'PRIMEIRO10',
    description: '10% OFF em pedidos acima de R$39',
    discountPercent: 10,
    minOrder: 39,
    expiresAt: null,
    isActive: true,
    isActivated: false,
  },
  {
    id: '2',
    code: 'FRETE5',
    description: 'R$5 OFF no frete',
    discountPercent: 5,
    minOrder: 50,
    expiresAt: null,
    isActive: true,
    isActivated: false,
  },
  {
    id: '3',
    code: 'SUPER15',
    description: '15% OFF em pedidos acima de R$100',
    discountPercent: 15,
    minOrder: 100,
    expiresAt: null,
    isActive: true,
    isActivated: false,
  },
  {
    id: '4',
    code: 'PRIMEIRACOMPRA5',
    description: 'R$5 OFF na primeira compra',
    discountPercent: 0, // Será tratado como valor fixo
    minOrder: 0,
    expiresAt: null,
    isActive: true,
    isActivated: false,
  },
];

export const CouponProvider = ({ children }: { children: ReactNode }) => {
  // Carregar cupom ativo do localStorage
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const savedCoupons = localStorage.getItem('coupons');
      if (savedCoupons) {
        const parsed = JSON.parse(savedCoupons);
        // Converter expiresAt de string para Date
        return parsed.map((c: any) => ({
          ...c,
          expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
        }));
      }
    } catch (error) {
      console.error('Failed to load coupons from localStorage', error);
    }
    return initialCoupons;
  });

  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(() => {
    try {
      const savedActive = localStorage.getItem('activeCoupon');
      if (savedActive) {
        const parsed = JSON.parse(savedActive);
        const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
        // Verificar se o cupom ainda não expirou
        if (expiresAt && expiresAt.getTime() > Date.now()) {
          return { ...parsed, expiresAt };
        }
      }
    } catch (error) {
      console.error('Failed to load active coupon from localStorage', error);
    }
    return null;
  });

  const [couponTimeRemaining, setCouponTimeRemaining] = useState<number | null>(null);

  // Calcular tempo restante inicial quando activeCoupon é carregado
  useEffect(() => {
    if (activeCoupon && activeCoupon.expiresAt) {
      const remaining = Math.max(0, activeCoupon.expiresAt.getTime() - Date.now());
      setCouponTimeRemaining(remaining > 0 ? remaining : null);
    } else {
      setCouponTimeRemaining(null);
    }
  }, [activeCoupon?.id]); // Quando o cupom ativo mudar

  // Salvar cupons no localStorage quando mudarem
  useEffect(() => {
    try {
      localStorage.setItem('coupons', JSON.stringify(coupons));
    } catch (error) {
      console.error('Failed to save coupons to localStorage', error);
    }
  }, [coupons]);

  // Salvar cupom ativo no localStorage quando mudar
  useEffect(() => {
    try {
      if (activeCoupon) {
        localStorage.setItem('activeCoupon', JSON.stringify(activeCoupon));
      } else {
        localStorage.removeItem('activeCoupon');
      }
    } catch (error) {
      console.error('Failed to save active coupon to localStorage', error);
    }
  }, [activeCoupon]);

  // Timer for active coupon
  useEffect(() => {
    if (!activeCoupon || !activeCoupon.expiresAt) {
      setCouponTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, activeCoupon.expiresAt!.getTime() - Date.now());
      setCouponTimeRemaining(remaining);

      if (remaining <= 0) {
        deactivateCoupon();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCoupon]);

  const activateCoupon = (couponId: string) => {
    const coupon = coupons.find((c) => c.id === couponId);
    if (!coupon) return;

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Desativa qualquer cupom ativo anterior
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.isActivated) {
          return { ...c, isActivated: false, expiresAt: null };
        }
        return c;
      })
    );

    // Ativa o novo cupom
    const updatedCoupon = { ...coupon, isActivated: true, expiresAt };
    
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? updatedCoupon : c))
    );
    setActiveCoupon(updatedCoupon);
    setCouponTimeRemaining(15 * 60 * 1000);
  };

  const deactivateCoupon = () => {
    if (activeCoupon) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === activeCoupon.id ? { ...c, isActivated: false, expiresAt: null } : c
        )
      );
    }
    setActiveCoupon(null);
    setCouponTimeRemaining(null);
  };

  const isFirstPurchase = (): boolean => {
    try {
      const hasCompletedPurchase = localStorage.getItem('hasCompletedPurchase');
      return !hasCompletedPurchase;
    } catch (error) {
      return true; // Se houver erro, assume que é primeira compra
    }
  };

  const markPurchaseCompleted = () => {
    try {
      localStorage.setItem('hasCompletedPurchase', 'true');
      // Desativar cupom de primeira compra após compra concluída
      if (activeCoupon && activeCoupon.id === '4') {
        deactivateCoupon();
      }
    } catch (error) {
      console.error('Failed to mark purchase as completed', error);
    }
  };


  const getApplicableCoupon = (orderTotal: number): Coupon | null => {
    // Cupom de primeira compra (R$5) - só aplica se for realmente primeira compra
    if (activeCoupon && activeCoupon.id === '4' && orderTotal > 0 && isFirstPurchase()) {
      return activeCoupon;
    }

    // Cupom ativo normal (verificar se atende ao valor mínimo)
    if (activeCoupon && activeCoupon.id !== '4' && orderTotal >= activeCoupon.minOrder) {
      return activeCoupon;
    }
    return null;
  };

  return (
    <CouponContext.Provider
      value={{
        coupons,
        activeCoupon,
        activateCoupon,
        deactivateCoupon,
        getApplicableCoupon,
        couponTimeRemaining,
        isFirstPurchase,
        markPurchaseCompleted,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};

export const useCoupons = () => {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error('useCoupons must be used within a CouponProvider');
  }
  return context;
};
