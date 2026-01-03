import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, MessageCircle, Share2, Bookmark, ArrowLeft, ChevronDown, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreatorVideo, Product } from '@/types/product';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { shareContent } from '@/utils/share';
import { toast } from 'sonner';

interface CreatorVideosSectionProps {
  videos: CreatorVideo[];
  product?: Product;
  onProductClick?: () => void;
}

interface Comment {
  id: string;
  userName: string;
  userInitials: string;
  text: string;
}

const SAMPLE_COMMENTS: Comment[] = [
  { id: '1', userName: 'Família Liu', userInitials: 'FL', text: 'Muito bom o produto! Recomendo!' },
  { id: '2', userName: 'E-commerce BR', userInitials: 'EB', text: 'Excelente qualidade pelo preço!' },
  { id: '3', userName: 'Ana Silva', userInitials: 'AS', text: 'Comprei e estou muito satisfeita. Super prático!' },
  { id: '4', userName: 'Pedro Santos', userInitials: 'PS', text: 'Vale muito a pena, entrega rápida também!' },
  { id: '5', userName: 'Maria Costa', userInitials: 'MC', text: 'Produto incrível, uso todo dia em casa!' },
];

// Componente otimizado para cada item de vídeo com lazy loading
interface VideoItemProps {
  video: CreatorVideo;
  index: number;
  onVideoClick: (video: CreatorVideo) => void;
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement | null }>;
  videoObserverRefs: React.MutableRefObject<{ [key: string]: IntersectionObserver | null }>;
  loadedVideosRef: React.MutableRefObject<Set<string>>;
  initialLikesCount?: number;
}

const VideoItem = ({ video, index, onVideoClick, videoRefs, videoObserverRefs, loadedVideosRef, initialLikesCount }: VideoItemProps) => {
  // Usar likesCount passado como prop ou gerar determinístico baseado no ID
  const likesCount = useMemo(() => {
    if (initialLikesCount !== undefined) return initialLikesCount;
    // Usar hash melhor distribuído do ID para gerar número determinístico
    let hash = 0;
    for (let i = 0; i < video.id.length; i++) {
      const char = video.id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Usar múltiplos fatores para garantir melhor distribuição
    const seed = hash * 9301 + 49297; // Números primos para melhor distribuição
    // Gerar número entre 10000 e 60000 com melhor distribuição
    return Math.abs(seed % 50000) + 10000;
  }, [video.id, initialLikesCount]);
  
  return (
    <motion.div
      key={video.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex-shrink-0 w-[160px]"
    >
      <div
        className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted cursor-pointer group"
        onClick={() => onVideoClick(video)}
      >
        {/* Thumbnail do vídeo - Simplificado como na página ThankYou */}
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title || ''}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <video
            ref={(el) => (videoRefs.current[video.id] = el)}
            src={video.videoUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              video.currentTime = 1;
            }}
          />
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Title Overlay (if exists) */}
        {video.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-white text-xs font-medium line-clamp-1">
              {video.title}
            </p>
          </div>
        )}

        {/* Likes no lado direito - Estilo TikTok */}
        <div className="absolute right-2 top-2 flex flex-col items-center gap-1 z-10">
          <div className="flex flex-col items-center gap-0.5">
            <Heart className="w-5 h-5 text-white drop-shadow-lg" />
            <span className="text-white text-[10px] font-semibold drop-shadow-lg">
              {likesCount > 1000 ? (likesCount / 1000).toFixed(1).replace('.', ',') + 'mil' : likesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Creator Info */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-tiktok-pink/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-foreground">
            {video.creatorInitials}
          </span>
        </div>
        <p className="text-xs font-medium text-foreground truncate">
          {video.creatorName}
        </p>
      </div>
    </motion.div>
  );
};

export const CreatorVideosSection = ({ videos, product, onProductClick }: CreatorVideosSectionProps) => {
  const [fullscreenVideoIndex, setFullscreenVideoIndex] = useState<number | null>(null);
  const [videoStates, setVideoStates] = useState<{ [key: string]: { isLiked: boolean; isBookmarked: boolean; likesCount: number; sharesCount: number } }>({});
  const [commentsCount] = useState(0); // Comentários desativados pelo dono do vídeo
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(SAMPLE_COMMENTS);
  const [commentText, setCommentText] = useState('');
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoObserverRefs = useRef<{ [key: string]: IntersectionObserver | null }>({});
  const loadedVideosRef = useRef<Set<string>>(new Set());
  
  const fullscreenVideo = fullscreenVideoIndex !== null ? videos[fullscreenVideoIndex] : null;
  
  // Função para gerar likes determinístico baseado no ID do vídeo
  const getLikesCount = useCallback((videoId: string) => {
    // Gerar hash melhor distribuído
    let hash = 0;
    for (let i = 0; i < videoId.length; i++) {
      const char = videoId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Usar múltiplos fatores para garantir melhor distribuição
    const seed = hash * 9301 + 49297; // Números primos para melhor distribuição
    // Gerar número entre 10000 e 60000 com melhor distribuição
    return Math.abs(seed % 50000) + 10000;
  }, []);

  // Inicializar estados do vídeo atual se não existir
  useEffect(() => {
    if (fullscreenVideo && !videoStates[fullscreenVideo.id]) {
      setVideoStates(prev => ({
        ...prev,
        [fullscreenVideo.id]: {
          isLiked: false,
          isBookmarked: false,
          likesCount: getLikesCount(fullscreenVideo.id),
          sharesCount: Math.floor(Math.random() * 1000) + 200,
        }
      }));
    }
  }, [fullscreenVideo?.id, getLikesCount]);
  
  const currentVideoState = fullscreenVideo ? (videoStates[fullscreenVideo.id] || {
    isLiked: false,
    isBookmarked: false,
    likesCount: getLikesCount(fullscreenVideo.id),
    sharesCount: Math.floor(Math.random() * 1000) + 200,
  }) : null;

  const handleVideoClick = (video: CreatorVideo) => {
    const index = videos.findIndex(v => v.id === video.id);
    setFullscreenVideoIndex(index >= 0 ? index : 0);
  };

  const handleCloseFullscreen = () => {
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.pause();
      fullscreenVideoRef.current.currentTime = 0;
    }
    setFullscreenVideoIndex(null);
    setShowComments(false);
  };

  // Função para pausar todos os vídeos (otimizada com useCallback)
  const pauseAllVideos = useCallback((includeFullscreen = true) => {
    // Pausar todos os vídeos na lista horizontal
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    });
    
    // Pausar vídeo fullscreen atual se solicitado
    if (includeFullscreen && fullscreenVideoRef.current) {
      const currentVideo = fullscreenVideoRef.current;
      currentVideo.pause();
      currentVideo.currentTime = 0;
      currentVideo.muted = true; // Mutar temporariamente para evitar áudio
    }
  }, []);

  const handleNextVideo = () => {
    if (fullscreenVideoIndex === null) return;
    
    // Pausar todos os vídeos primeiro
    pauseAllVideos();
    
    const nextIndex = (fullscreenVideoIndex + 1) % videos.length;
    setFullscreenVideoIndex(nextIndex);
    setShowComments(false);
  };

  const handlePreviousVideo = () => {
    if (fullscreenVideoIndex === null) return;
    
    // Pausar todos os vídeos primeiro
    pauseAllVideos();
    
    const prevIndex = fullscreenVideoIndex === 0 ? videos.length - 1 : fullscreenVideoIndex - 1;
    setFullscreenVideoIndex(prevIndex);
    setShowComments(false);
  };

  const handleProductClick = () => {
    // Se o produto tiver URL, abrir em nova aba para tráfego pago
    if (product?.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer');
      handleCloseFullscreen();
      return;
    }
    // Caso contrário, fechar o vídeo e chamar o callback
    handleCloseFullscreen();
    if (onProductClick) {
      // Pequeno delay para que el modal se cierre antes de abrir el drawer
      setTimeout(() => {
        onProductClick();
      }, 100);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentsCount === 0) return; // Não permitir comentar se estiver desativado
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userName: 'Você',
      userInitials: 'V',
      text: commentText.trim(),
    };
    
    setComments([...comments, newComment]);
    setCommentText('');
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullscreenVideo || !currentVideoState) return;
    
    const newIsLiked = !currentVideoState.isLiked;
    setVideoStates(prev => ({
      ...prev,
      [fullscreenVideo.id]: {
        ...prev[fullscreenVideo.id],
        isLiked: newIsLiked,
        likesCount: newIsLiked 
          ? (prev[fullscreenVideo.id]?.likesCount || 0) + 1 
          : Math.max(0, (prev[fullscreenVideo.id]?.likesCount || 0) - 1),
      }
    }));
  };

  const toggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Não permitir abrir comentários se estiverem desativados (commentsCount === 0)
    if (commentsCount === 0) return;
    setShowComments(!showComments);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullscreenVideo || !currentVideoState) return;
    
    const shareText = fullscreenVideo.title 
      ? `Confira este vídeo: ${fullscreenVideo.title}`
      : `Confira este vídeo de ${fullscreenVideo.creatorName}`;
    
    // Usar URL do produto se disponível, senão usar URL do produto na aplicação
    const shareUrl = product?.url || (product ? `${window.location.origin}/produto/${product.id}` : window.location.href);
    
    const success = await shareContent(
      fullscreenVideo.title || 'Vídeo de criador',
      shareText,
      shareUrl
    );
    
    // Só incrementa o contador se o compartilhamento foi realmente bem-sucedido
    // e não foi cancelado pelo usuário
    if (success) {
      // Verificar se foi compartilhado via Web Share API (não apenas copiado)
      // ou se foi copiado com sucesso
      setVideoStates(prev => ({
        ...prev,
        [fullscreenVideo.id]: {
          ...prev[fullscreenVideo.id],
          sharesCount: (prev[fullscreenVideo.id]?.sharesCount || 0) + 1,
        }
      }));
      
      if (navigator.share) {
        toast.success('Compartilhado com sucesso!', { id: 'video-share' });
      } else {
        toast.success('Link copiado para a área de transferência!', { id: 'video-share' });
      }
    }
    // Se não foi bem-sucedido, não faz nada (não mostra erro para não incomodar se o usuário cancelou)
  };

  // Pausar todos los videos cuando el componente se desmonta ou quando fecha o modal
  useEffect(() => {
    if (fullscreenVideoIndex === null) {
      // Quando fecha o modal, pausar todos os vídeos
      pauseAllVideos(true);
    }
  }, [fullscreenVideoIndex]);

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      pauseAllVideos(true);
      // Limpar todos os observers
      Object.values(videoObserverRefs.current).forEach((observer) => {
        if (observer) {
          observer.disconnect();
        }
      });
      videoObserverRefs.current = {};
    };
  }, [pauseAllVideos]);

  // Auto-play quando se abre em tela cheia ou muda de vídeo (otimizado para mobile)
  useEffect(() => {
    if (fullscreenVideoIndex !== null && fullscreenVideoRef.current && fullscreenVideo) {
      const video = fullscreenVideoRef.current;
      const currentVideoId = fullscreenVideo.id;
      
      // Pausar TODOS os outros vídeos primeiro (incluindo os da lista horizontal)
      pauseAllVideos(false);
      
      // Garantir que está pausado e resetado primeiro
      video.pause();
      video.currentTime = 0;
      
      // Desmutar o vídeo novo (já que mutamos ao trocar)
      video.muted = false;
      
      // Listener para garantir que quando este vídeo tocar, nenhum outro toque
      const handlePlay = () => {
        // Pausar todos os outros vídeos quando este começar a tocar
        Object.values(videoRefs.current).forEach((vid) => {
          if (vid && vid !== video && !vid.paused) {
            vid.pause();
            vid.currentTime = 0;
          }
        });
      };
      
      // Adicionar o listener de play imediatamente
      video.addEventListener('play', handlePlay);
      
      // Função otimizada para tentar tocar o vídeo
      const attemptPlay = () => {
        // Verificar se ainda é o vídeo ativo
        if (video !== fullscreenVideoRef.current) {
          return;
        }
        
        // Verificar se ainda é o mesmo vídeo antes de tocar
        if (fullscreenVideoIndex === null || videos[fullscreenVideoIndex]?.id !== currentVideoId) {
          return;
        }
        
        if (video && video.paused) {
          // Garantir que todos os outros vídeos estão pausados antes de tocar
          pauseAllVideos(false);
          
          // Tentar tocar - otimizado para mobile
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              // No mobile, pode falhar silenciosamente - não fazer nada
              console.debug('Video play failed:', error);
            });
          }
        }
      };
      
      // Handler otimizado para quando o vídeo estiver pronto
      const handleCanPlay = () => {
        attemptPlay();
      };
      
      // Remover listeners anteriores primeiro
      video.removeEventListener('canplay', handleCanPlay);
      
      // Adicionar listener otimizado (apenas canplay, mais eficiente)
      video.addEventListener('canplay', handleCanPlay, { once: true });
      
      // Tentar tocar quando o vídeo estiver pronto
      if (video.readyState >= 3) {
        // Se já tem dados suficientes, tentar tocar imediatamente
        attemptPlay();
      } else if (video.readyState >= 2) {
        // Se tem metadados, tentar tocar no próximo frame
        requestAnimationFrame(() => {
          attemptPlay();
        });
      } else {
        // Se não tem dados, forçar carregamento
        video.load();
      }
      
      return () => {
        if (video) {
          // Remover todos os listeners
          video.removeEventListener('play', handlePlay);
          video.removeEventListener('canplay', handleCanPlay);
        }
      };
    }
  }, [fullscreenVideoIndex, fullscreenVideo?.id, pauseAllVideos, videos]);

  // Hacer scroll al top del drawer cuando se cierra el modal
  useEffect(() => {
    if (!fullscreenVideo) {
      // Pequeño delay para que el modal se cierre completamente
      setTimeout(() => {
        const drawer = document.querySelector('.fixed.bottom-0.max-h-\\[90vh\\]') || 
                      document.querySelector('[data-radix-dialog-content]');
        if (drawer) {
          drawer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 200);
    }
  }, [fullscreenVideo]);

  if (!videos || videos.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold">
          Vídeos de criadores ({videos.length}+)
        </h3>
      </div>

      {/* Videos Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {videos.map((video, index) => {
          // Gerar likes determinístico para passar ao VideoItem
          const getLikesForVideo = (videoId: string) => {
            let hash = 0;
            for (let i = 0; i < videoId.length; i++) {
              const char = videoId.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash;
            }
            // Usar múltiplos fatores para garantir melhor distribuição
            const seed = hash * 9301 + 49297; // Números primos para melhor distribuição
            return Math.abs(seed % 50000) + 10000;
          };
          
          return (
            <VideoItem
              key={video.id}
              video={video}
              index={index}
              onVideoClick={handleVideoClick}
              videoRefs={videoRefs}
              videoObserverRefs={videoObserverRefs}
              loadedVideosRef={loadedVideosRef}
              initialLikesCount={getLikesForVideo(video.id)}
            />
          );
        })}
      </div>

      {/* Fullscreen Video Modal - Renderizado fora do drawer usando portal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {fullscreenVideo && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseFullscreen}
                className="fixed inset-0 bg-black z-[200]"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              />

              {/* Fullscreen Video Container */}
              <div
                className="fixed inset-0 z-[201] flex flex-col bg-black overflow-hidden"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              >
              {/* Botão de voltar (seta) no topo esquerdo */}
              <button
                onClick={handleCloseFullscreen}
                className="absolute top-4 left-4 md:top-6 md:left-6 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              {/* Video Container - Full Screen */}
              <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-black">
                <video
                  key={fullscreenVideoIndex}
                  ref={fullscreenVideoRef}
                  src={fullscreenVideo.videoUrl}
                  className="w-full h-full object-contain"
                  style={{
                    aspectRatio: '9/16',
                    maxWidth: '100%',
                    maxHeight: '100vh',
                    width: 'auto',
                    height: 'auto'
                  }}
                  loop
                  playsInline
                  preload="auto"
                  autoPlay
                  onClick={(e) => {
                    e.stopPropagation();
                    if (fullscreenVideoRef.current) {
                      if (fullscreenVideoRef.current.paused) {
                        fullscreenVideoRef.current.play().catch(() => {
                          // Ignorar erros de autoplay no mobile
                        });
                      } else {
                        fullscreenVideoRef.current.pause();
                      }
                    }
                  }}
                />

                {/* Navigation Arrows */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextVideo();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousVideo();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Right Side Actions */}
                <div className="absolute right-4 md:right-8 bottom-20 md:bottom-32 flex flex-col gap-4 md:gap-6 z-10">
                  {/* Like - Primeiro (em cima) */}
                  <button
                    onClick={handleLike}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                      <Heart className={`w-6 h-6 ${currentVideoState?.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </div>
                    <span className="text-white text-xs font-medium">
                      {currentVideoState?.likesCount 
                        ? (currentVideoState.likesCount > 1000 
                          ? (currentVideoState.likesCount / 1000).toFixed(1).replace('.', ',') + 'mil' 
                          : currentVideoState.likesCount)
                        : '0'}
                    </span>
                  </button>

                  {/* Share - Segundo (embaixo dos likes) */}
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-xs font-medium">
                      {currentVideoState?.sharesCount 
                        ? (currentVideoState.sharesCount > 1000 
                          ? (currentVideoState.sharesCount / 1000).toFixed(1).replace('.', ',') + 'mil' 
                          : currentVideoState.sharesCount)
                        : '0'}
                    </span>
                  </button>

                  {/* Bookmark - Com animação */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!fullscreenVideo || !currentVideoState) return;
                      setVideoStates(prev => ({
                        ...prev,
                        [fullscreenVideo.id]: {
                          ...prev[fullscreenVideo.id],
                          isBookmarked: !prev[fullscreenVideo.id]?.isBookmarked,
                        }
                      }));
                    }}
                    className="flex flex-col items-center gap-1"
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <motion.div 
                      className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                      animate={currentVideoState?.isBookmarked ? { 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Bookmark className={`w-6 h-6 ${currentVideoState?.isBookmarked ? 'fill-white text-white' : 'text-white'}`} />
                    </motion.div>
                  </motion.button>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 md:max-w-2xl md:left-1/2 md:-translate-x-1/2 z-10">
                  {/* Creator Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-tiktok-pink/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-foreground">
                        {fullscreenVideo.creatorInitials}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">
                        {fullscreenVideo.creatorName}
                      </p>
                      {fullscreenVideo.title && (
                        <p className="text-white/90 text-sm line-clamp-2">
                          {fullscreenVideo.title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  {product && (
                    <div 
                      className="bg-black/80 backdrop-blur-sm p-3 md:p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-black/90 transition-colors"
                      onClick={handleProductClick}
                    >
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm md:text-base line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-white/80 text-xs md:text-sm">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Panel */}
              <AnimatePresence>
                {showComments && commentsCount > 0 && (
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[60vh] flex flex-col z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className="w-12 h-1 bg-muted rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="px-4 pb-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          {commentsCount} comentários
                        </h3>
                        <button
                          onClick={toggleComments}
                          className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                      {commentsCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <MessageCircle className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground">
                            Comentários desativados pelo dono do vídeo
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-tiktok-pink/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold">{comment.userInitials}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">{comment.userName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Comment Input - Desabilitado quando commentsCount === 0 */}
                    {commentsCount === 0 ? null : (
                      <div className="px-4 py-3 border-t border-border">
                        <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Adicionar comentário..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="flex-1 px-4 py-2 bg-muted rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {commentText.trim() && (
                            <button
                              type="submit"
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Publicar
                            </button>
                          )}
                        </form>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

