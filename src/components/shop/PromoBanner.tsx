import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PromoBannerProps {
  onOffersClick?: () => void;
  onCouponsClick?: () => void;
}

export const PromoBanner = ({ onOffersClick, onCouponsClick }: PromoBannerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Calculate time until midnight (24h countdown that resets daily)
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl p-6 md:p-8 lg:p-10"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--tiktok-cyan) / 0.1) 100%)',
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-2 left-4 w-16 h-16 md:w-24 md:h-24 rounded-full bg-primary/20 blur-xl" />
      <div className="absolute top-8 right-8 w-24 h-24 md:w-32 md:h-32 rounded-lg bg-tiktok-cyan/10 rotate-12 blur-lg" />
      <div className="absolute bottom-4 left-1/4 text-primary/40 text-2xl md:text-3xl">✦</div>
      <div className="absolute top-1/3 right-1/4 text-primary/30 text-lg md:text-xl">✦</div>

      {/* Content */}
      <div className="relative z-10 md:flex md:items-center md:justify-between">
        <div className="md:flex-1">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-primary fill-primary" />
              <span className="text-sm md:text-base font-semibold text-foreground">Ofertas do Dia</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <div className="flex items-center gap-1">
                <span className="bg-foreground text-background text-sm md:text-base font-mono font-bold px-2 py-1 md:px-3 md:py-1.5 rounded">
                  {formatTime(timeLeft.hours)}
                </span>
                <span className="font-bold">:</span>
                <span className="bg-foreground text-background text-sm md:text-base font-mono font-bold px-2 py-1 md:px-3 md:py-1.5 rounded">
                  {formatTime(timeLeft.minutes)}
                </span>
                <span className="font-bold">:</span>
                <span className="bg-foreground text-background text-sm md:text-base font-mono font-bold px-2 py-1 md:px-3 md:py-1.5 rounded">
                  {formatTime(timeLeft.seconds)}
                </span>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 md:mb-2">
            Super Ofertas de Hoje
          </h2>
          <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base lg:text-lg">Até 70% OFF em produtos selecionados</p>
          
          <div className="flex gap-3 md:gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOffersClick}
              className="px-6 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-tiktok-pink to-primary text-white rounded-full font-semibold text-sm md:text-base shadow-lg"
            >
              Ver ofertas
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCouponsClick}
              className="px-6 py-2.5 md:px-8 md:py-3 bg-card border border-border text-foreground rounded-full font-semibold text-sm md:text-base"
            >
              Cupons
            </motion.button>
          </div>
        </div>
      </div>

      {/* Decorative cosmetics icons */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-60">
        <div className="w-20 h-20 bg-primary/30 rounded-full blur-sm flex items-center justify-center text-3xl">
          💄
        </div>
      </div>
      <div className="absolute -right-4 top-1/4 opacity-60">
        <div className="w-16 h-16 bg-tiktok-cyan/20 rounded-lg rotate-12 blur-sm flex items-center justify-center text-2xl">
          🛍️
        </div>
      </div>
    </motion.div>
  );
};
