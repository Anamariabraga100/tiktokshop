import { motion } from 'framer-motion';
import { Star, Play } from 'lucide-react';
import { ProductReview } from '@/types/product';

interface ProductReviewsProps {
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
  productId?: string; // Para gerar número fictício consistente
}

export const ProductReviews = ({ reviews, averageRating, totalReviews, productId }: ProductReviewsProps) => {
  // Gerar número fictício de avaliações baseado no productId ou reviews.length
  const generateFakeReviewCount = () => {
    if (productId) {
      // Usar o ID do produto para gerar um número consistente
      const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      // Gerar número entre 200 e 800
      const fakeCount = 200 + (hash % 600);
      return fakeCount;
    }
    // Fallback: usar hash do número de reviews
    const hash = reviews.length * 47;
    return 200 + (hash % 600);
  };

  const fakeReviewCount = generateFakeReviewCount();
  const formatUserName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      // Formato: Q**o ou A**f C**o 1**5
      const firstFormatted = first.length > 2 
        ? `${first.charAt(0)}**${first.slice(-1)}`
        : `${first.charAt(0)}*`;
      const lastFormatted = last.length > 2
        ? `${last.charAt(0)}**${last.slice(-1)}`
        : `${last.charAt(0)}*`;
      return `${firstFormatted} ${lastFormatted}`;
    }
    const first = parts[0];
    return first.length > 2 
      ? `${first.charAt(0)}**${first.slice(-1)}`
      : `${first.charAt(0)}*`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">
          Avaliações dos clientes ({fakeReviewCount})
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating)
                    ? 'fill-warning text-warning'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="text-lg font-bold">{averageRating.toFixed(1)}/5</span>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-tiktok-pink/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  {review.userInitials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{formatUserName(review.userName)}</p>
                {review.itemVariant && (
                  <p className="text-xs text-muted-foreground">Item: {review.itemVariant}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Review Text */}
            <p className="text-sm text-foreground leading-relaxed">{review.text}</p>

            {/* Media (Video/Image) */}
            {review.mediaUrl && (
              <div className="relative w-full max-w-xs rounded-lg overflow-hidden bg-muted">
                {review.mediaType === 'video' ? (
                  <div className="relative aspect-video">
                    <img
                      src={review.mediaUrl}
                      alt="Review media"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-foreground ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={review.mediaUrl}
                    alt="Review media"
                    className="w-full h-auto object-cover"
                  />
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

