import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { CartProvider } from "./context/CartContext";
import { CouponProvider } from "./context/CouponContext";
import { CustomerProvider } from "./context/CustomerContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ThankYou from "./pages/ThankYou";
import { initFacebookPixel, trackPageView } from "./lib/facebookPixel";

const queryClient = new QueryClient();

// Inicializar Facebook Pixel
const FacebookPixelInit = () => {
  useEffect(() => {
    // Tentar obter Pixel ID de diferentes formas
    const pixelId = import.meta.env.VITE_FACEBOOK_PIXEL_ID || 
                    import.meta.env.FACEBOOK_PIXEL_ID;
    
    if (pixelId) {
      console.log('✅ Inicializando Facebook Pixel:', pixelId);
      initFacebookPixel(pixelId);
      // Aguardar um pouco antes de rastrear PageView para garantir que o pixel carregou
      setTimeout(() => {
        trackPageView();
      }, 500);
    } else {
      console.warn('⚠️ Facebook Pixel ID não configurado. Configure VITE_FACEBOOK_PIXEL_ID nas variáveis de ambiente.');
    }
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <CouponProvider>
          <CustomerProvider>
            <FacebookPixelInit />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/produto/:id" element={<Index />} />
                <Route path="/thank-you" element={<ThankYou />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CustomerProvider>
        </CouponProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
