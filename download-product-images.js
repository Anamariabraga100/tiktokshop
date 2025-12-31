/**
 * Script para baixar imagens de produtos usando URLs de placeholder.
 * Execute com: node download-product-images.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// URLs diretas de imagens de produtos do Unsplash (serviço gratuito)
const PRODUCT_IMAGE_URLS = {
  '7': 'https://images.unsplash.com/photo-1542291026-7c2dfe14e3b1?w=800&h=800&fit=crop', // Sneakers
  '8': 'https://images.unsplash.com/photo-1581655356764-62c2b84b8e49?w=800&h=800&fit=crop', // T-shirts
  '9': 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop', // Casual shoes
  '10': 'https://images.unsplash.com/photo-1521572163474-6864f9ac17a3?w=800&h=800&fit=crop', // Basic t-shirts
  '11': 'https://images.unsplash.com/photo-1556048212-080c8c4af539?w=800&h=800&fit=crop', // Shorts
  '12': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop', // Sandals
  '13': 'https://images.unsplash.com/photo-1594938291221-94f7a7eb0a97?w=800&h=800&fit=crop', // Linen shorts
  '14': 'https://images.unsplash.com/photo-1506629905607-bd37c39475f9?w=800&h=800&fit=crop', // Shirt combo
  '15': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop', // Baseball cap
  '16': 'https://images.unsplash.com/photo-1621605815971-fbc98d665ffd?w=800&h=800&fit=crop', // Razor
  '17': 'https://images.unsplash.com/photo-1595453701899-a2dfb6f02e0c?w=800&h=800&fit=crop', // Body cream
  '18': 'https://images.unsplash.com/photo-1602143407151-6f2ffad62861?w=800&h=800&fit=crop', // Electric shaver
  '19': 'https://images.unsplash.com/photo-1594736797933-d0d4fb4f59bc?w=800&h=800&fit=crop', // Grooming kit
  '20': 'https://images.unsplash.com/photo-1607613009820-7aec4ea39856?w=800&h=800&fit=crop', // Electric toothbrush
  '21': 'https://images.unsplash.com/photo-1600326145359-3dc167d43289?w=800&h=800&fit=crop', // Toiletry bag
  '22': 'https://images.unsplash.com/photo-1586985289688-4e93f9c78b2d?w=800&h=800&fit=crop', // Cordless drill
  '23': 'https://images.unsplash.com/photo-1504148450368-2ad5a0b79cc6?w=800&h=800&fit=crop', // Tool kit
  '24': 'https://images.unsplash.com/photo-1585132131013-4e70e99c4e2f?w=800&h=800&fit=crop', // Screwdriver set
  '25': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop', // Professional drill
  '26': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop', // Phone case
};

function downloadImage(productId, url, outputPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(outputPath);
    
    client.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Imagem product-${productId}.jpg baixada com sucesso`);
          resolve(true);
        });
      } else {
        file.close();
        fs.unlinkSync(outputPath);
        console.log(`✗ Erro ao baixar imagem para produto ${productId}: Status ${response.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      console.log(`✗ Erro ao baixar imagem para produto ${productId}: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  const imagesDir = path.join(__dirname, 'src', 'assets', 'products');
  
  // Cria a pasta se não existir
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  console.log(`Baixando imagens para: ${imagesDir}`);
  console.log('-'.repeat(50));
  
  let successCount = 0;
  
  // Baixa as imagens para produtos de 7 a 26
  for (let productId = 7; productId <= 26; productId++) {
    const productIdStr = String(productId);
    const url = PRODUCT_IMAGE_URLS[productIdStr];
    
    if (!url) {
      console.log(`✗ URL não encontrada para produto ${productId}`);
      continue;
    }
    
    const outputFile = path.join(imagesDir, `product-${productId}.jpg`);
    
    const success = await downloadImage(productId, url, outputFile);
    if (success) {
      successCount++;
    }
    
    // Pequeno delay para não sobrecarregar o servidor
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('-'.repeat(50));
  console.log(`Processo concluído! ${successCount}/20 imagens baixadas com sucesso.`);
  console.log(`\nPróximos passos:`);
  console.log(`1. Verifique as imagens baixadas em: ${imagesDir}`);
  console.log(`2. Atualize o arquivo products.ts para usar as novas imagens`);
}

main().catch(console.error);

