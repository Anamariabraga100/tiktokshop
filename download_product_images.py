"""
Script para baixar imagens de produtos usando URLs de placeholder.
Este script baixa imagens de serviços gratuitos de stock photos.
"""

import requests
import time
from pathlib import Path

# URLs diretas de imagens de produtos do Unsplash (serviço gratuito)
# Usando a API do Unsplash Photos que permite acesso direto por ID
PRODUCT_IMAGE_URLS = {
    '7': 'https://images.unsplash.com/photo-1542291026-7c2dfe14e3b1?w=800&h=800&fit=crop',  # Sneakers
    '8': 'https://images.unsplash.com/photo-1581655356764-62c2b84b8e49?w=800&h=800&fit=crop',  # T-shirts
    '9': 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop',  # Casual shoes
    '10': 'https://images.unsplash.com/photo-1521572163474-6864f9ac17a3?w=800&h=800&fit=crop',  # Basic t-shirts
    '11': 'https://images.unsplash.com/photo-1556048212-080c8c4af539?w=800&h=800&fit=crop',  # Shorts
    '12': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',  # Sandals
    '13': 'https://images.unsplash.com/photo-1594938291221-94f7a7eb0a97?w=800&h=800&fit=crop',  # Linen shorts
    '14': 'https://images.unsplash.com/photo-1506629905607-bd37c39475f9?w=800&h=800&fit=crop',  # Shirt combo
    '15': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop',  # Baseball cap
    '16': 'https://images.unsplash.com/photo-1621605815971-fbc98d665ffd?w=800&h=800&fit=crop',  # Razor
    '17': 'https://images.unsplash.com/photo-1595453701899-a2dfb6f02e0c?w=800&h=800&fit=crop',  # Body cream
    '18': 'https://images.unsplash.com/photo-1602143407151-6f2ffad62861?w=800&h=800&fit=crop',  # Electric shaver
    '19': 'https://images.unsplash.com/photo-1594736797933-d0d4fb4f59bc?w=800&h=800&fit=crop',  # Grooming kit
    '20': 'https://images.unsplash.com/photo-1607613009820-7aec4ea39856?w=800&h=800&fit=crop',  # Electric toothbrush
    '21': 'https://images.unsplash.com/photo-1600326145359-3dc167d43289?w=800&h=800&fit=crop',  # Toiletry bag
    '22': 'https://images.unsplash.com/photo-1586985289688-4e93f9c78b2d?w=800&h=800&fit=crop',  # Cordless drill
    '23': 'https://images.unsplash.com/photo-1504148450368-2ad5a0b79cc6?w=800&h=800&fit=crop',  # Tool kit
    '24': 'https://images.unsplash.com/photo-1585132131013-4e70e99c4e2f?w=800&h=800&fit=crop',  # Screwdriver set
    '25': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',  # Professional drill
    '26': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop',  # Phone case
}

def download_image(product_id, output_path):
    """Baixa uma imagem usando URL do Unsplash."""
    url = PRODUCT_IMAGE_URLS.get(product_id)
    if not url:
        print(f"URL não encontrada para produto {product_id}")
        return False
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✓ Imagem {output_path.name} baixada com sucesso")
            return True
        else:
            print(f"✗ Erro ao baixar imagem para produto {product_id}: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Erro ao baixar imagem para produto {product_id}: {e}")
        return False

def main():
    """Função principal para baixar todas as imagens."""
    # Caminho para a pasta de imagens
    script_dir = Path(__file__).parent
    images_dir = script_dir / 'src' / 'assets' / 'products'
    
    # Cria a pasta se não existir
    images_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Baixando imagens para: {images_dir}")
    print("-" * 50)
    
    # Baixa as imagens para produtos de 7 a 26
    success_count = 0
    for product_id in range(7, 27):
        product_id_str = str(product_id)
        output_file = images_dir / f'product-{product_id}.jpg'
        
        if download_image(product_id_str, output_file):
            success_count += 1
        
        # Pequeno delay para não sobrecarregar o servidor
        time.sleep(0.5)
    
    print("-" * 50)
    print(f"Processo concluído! {success_count}/20 imagens baixadas com sucesso.")
    print(f"\nPróximos passos:")
    print(f"1. Verifique as imagens baixadas em: {images_dir}")
    print(f"2. Atualize o arquivo products.ts para usar as novas imagens")

if __name__ == '__main__':
    main()

