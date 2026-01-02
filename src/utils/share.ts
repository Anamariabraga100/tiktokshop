/**
 * Função utilitária para compartilhar conteúdo
 * Usa Web Share API quando disponível (mobile), senão copia o link para a área de transferência
 */
export const shareContent = async (
  title: string,
  text: string,
  url?: string
): Promise<boolean> => {
  const shareUrl = url || window.location.href;
  const shareData: ShareData = {
    title,
    text,
    url: shareUrl,
  };

  // Verificar se Web Share API está disponível (principalmente mobile)
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error: any) {
      // Se o usuário cancelou, retorna false para não incrementar contador
      if (error.name === 'AbortError') {
        return false;
      }
      // Outros erros
      console.error('Erro ao compartilhar:', error);
      return false;
    }
  } else {
    // Fallback: copiar link para área de transferência
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      // Fallback adicional: usar método antigo
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }
};

