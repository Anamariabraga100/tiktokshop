export interface ProductReview {
  id: string;
  userName: string;
  userInitials: string;
  rating: number;
  itemVariant?: string; // Ex: "Amarelo 48v"
  text: string;
  mediaUrl?: string; // URL para vídeo ou imagem
  mediaType?: 'video' | 'image';
  date: string;
}

export interface CreatorVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  creatorName: string;
  creatorInitials: string;
  title?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  soldCount: number;
  viewCount?: number;
  likesCount?: number;
  isHotDeal?: boolean;
  isNewCustomerDeal?: boolean;
  isLive?: boolean;
  freeShipping?: boolean;
  category: string;
  brand?: string;
  sizes?: string[];
  colors?: string[];
  description?: string;
  reviews?: ProductReview[];
  creatorVideos?: CreatorVideo[];
  url?: string; // URL para tráfego pago
  isHidden?: boolean; // Produto oculto (só acessível por link direto)
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  isGift?: boolean; // Flag para identificar brindes
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
