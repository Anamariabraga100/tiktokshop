// Imports das imagens dos produtos
import camisaFeminina from '@/assets/products/Camisa Feminina Elegante Branca Premium.jpg';
import glossLabial from '@/assets/products/Gloss Labial Matte Rosa Duradouro.jpg';
import product3 from '@/assets/products/product-3.jpg';
import product4 from '@/assets/products/product-4.jpg';
import product5 from '@/assets/products/product-5.jpg';
import product6 from '@/assets/products/product-6.jpg';
import tenisEsportivo from '@/assets/products/Tênis Masculino e Feminino Esportivo.jpg';
import kit3CamisetasMasculinas from '@/assets/products/Kit 3 Camisetas Masculinas Algodão.webp';
import kitCamisaBermuda from '@/assets/products/Kit Masculino Camisa + Bermuda.webp';
import tenisCasual from '@/assets/products/Tênis Masculino Básico Casual.webp';
import kit3CamisetasUnissex from '@/assets/products/Kit 3 Camisetas Unissex Básicas.jpg';
import mauricinhoShorts from '@/assets/products/Mauricinho Kit 3 Shorts Masculino.webp';
import chineloNuvem from '@/assets/products/Chinelo Nuvem Slide YZ Confort.jpg';
import boneBrooklyn from '@/assets/products/Boné Brooklyn Beisebol Aba Reta.webp';
import shortLinho from '@/assets/products/Short Masculino Linho Premium.webp';
import kitBodyCream from '@/assets/products/Kit Body Cream e Body Splash Blue.webp';
import navalha from '@/assets/products/Navalha Para Barbearia Profissional.jpg';
import necessaire from '@/assets/products/Necessaire Masculina Organizadora Viagem.webp';
import kitFerramentas from '@/assets/products/Kit De Ferramentas 46 Peças Completo Vermelho.jpg';
import videoKitFerramentas1 from '@/assets/video-product/Kit De Ferramentas 46 Peças Completo 1.mp4';
import videoKitFerramentas2 from '@/assets/video-product/Kit De Ferramentas 46 Peças Completo 2.mp4';
import videoKitFerramentas4 from '@/assets/video-product/Kit De Ferramentas 46 Peças Completo 4.mp4';
import videoKitFerramentas5 from '@/assets/video-product/Kit De Ferramentas 46 Peças Completo 5.mp4';
import chavesPrecisao from '@/assets/products/Conjunto de Chaves 115 em 1 Precisão.jpg';
import parafusadeiraPro from '@/assets/products/ParafusadeiraFuradeira Profissional.jpg';
import capaIphone from '@/assets/products/Capa Para iPhone Silicone Premium.webp';
import barbeadorEletrico from '@/assets/products/Barbeador Elétrico Sem Fio Recarregável.jpg';
import kitCuidados from '@/assets/products/Kit Cuidados Masculinos Barbeiro Completo.webp';
import escovaDentes from '@/assets/products/Escova de Dentes Elétrica Sônica.jpg';
import parafusadeira48V from '@/assets/products/ParafusadeiraFuradeira 48V Bateria.jpg';
import product25 from '@/assets/products/product-25.jpg';
import product26 from '@/assets/products/product-26.jpg';
import productTest from '@/assets/products/product-1.jpg';
import parafusadeiraDomestica from '@/assets/products/Kit Parafusadeira Doméstica com maleta Leve Portátil USB Recarregável lemon tree.jpg';
import videoParafusadeira1 from '@/assets/video-product/Kit Parafusadeira Doméstica com maleta Leve Portátil USB Recarregável 1.mp4';
import videoParafusadeira2 from '@/assets/video-product/Kit Parafusadeira Doméstica com maleta Leve Portátil USB Recarregável 2.mp4';
import kitBarbeadorAparador from '@/assets/products/Kit Barbeador e Aparador de Pelos Cuidados Masculinos.jpg';
import videoBarbeador1 from '@/assets/video-product/Kit Barbeador e Aparador de Pelos Cuidados Masculinos.mp4';
import videoBarbeador2 from '@/assets/video-product/Kit Barbeador e Aparador de Pelos Cuidados Masculinos 2.mp4';
import videoBarbeador3 from '@/assets/video-product/Kit Barbeador e Aparador de Pelos Cuidados Masculinos 3.mp4';
import videoBarbeador4 from '@/assets/video-product/Kit Barbeador e Aparador de Pelos Cuidados Masculinos 4.mp4';
import videoBarbeador5 from '@/assets/video-product/Kit Barbeador e Aparador de Pelos Cuidados Masculinos 5.mp4';
import videoBarbeador6 from '@/assets/video-product/Kit Barbeador e Aparador de Pelos Cuidados Masculinos 6.mp4';
import { Product, Category, ProductReview, CreatorVideo } from '@/types/product';

export const categories: Category[] = [
  { id: '1', name: 'Moda', icon: '👗' },
  { id: '2', name: 'Beleza', icon: '💄' },
  { id: '4', name: 'Esportes', icon: '⚽' },
  { id: '5', name: 'Eletrônicos', icon: '📱' },
  { id: '6', name: 'Saúde', icon: '💊' },
  { id: '7', name: 'Acessórios', icon: '💍' },
  { id: '8', name: 'Ferramentas', icon: '🔧' },
];

export const products: Product[] = [
  // Original products
  {
    id: '1',
    name: 'Camisa Feminina Elegante Branca Premium',
    price: 89.90,
    originalPrice: 159.90,
    image: camisaFeminina,
    rating: 4.7,
    soldCount: 1508,
    viewCount: 15420,
    likesCount: 892,
    isHotDeal: true,
    isNewCustomerDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'Fashion BR',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Branco', 'Preto', 'Bege'],
    description: `A Camisa Feminina Elegante Branca Premium é uma peça essencial para o guarda-roupa moderno. Confeccionada em algodão 100% de alta qualidade, oferece máximo conforto e durabilidade.

**Características Técnicas:**
• Material: 100% Algodão Premium
• Gramatura: 180g/m²
• Tecido: Malha penteada, macia ao toque
• Lavagem: Pode ser lavada na máquina (água fria)
• Secagem: Secar à sombra, não usar secadora
• Não encolhe após lavagem
• Costuras reforçadas para maior durabilidade
• Gola redonda com acabamento em ribana
• Manga curta com acabamento em punho
• Barra inferior com acabamento em ribana

**Tamanhos Disponíveis:**
P (Busto: 88cm | Comprimento: 60cm)
M (Busto: 92cm | Comprimento: 62cm)
G (Busto: 96cm | Comprimento: 64cm)
GG (Busto: 100cm | Comprimento: 66cm)

**Cuidados:**
Lavar à mão ou na máquina com água fria. Não usar alvejante. Passar com ferro em temperatura média.`,
    reviews: [
      {
        id: 'r1',
        userName: 'Querida Oliveira',
        userInitials: 'QO',
        rating: 5,
        itemVariant: 'Branco M',
        text: 'Galera ótimo produto, chegou rápido, tudo completo, nada amassado nem quebrado, qualidade excelente e...',
        date: '2024-01-15',
      },
      {
        id: 'r2',
        userName: 'Ana Ferreira Costa',
        userInitials: 'AFC',
        rating: 5,
        itemVariant: 'Branco P',
        text: 'Qualidade do produto: Ótimo',
        date: '2024-01-20',
      },
      {
        id: 'r3',
        userName: 'Maria Silva',
        userInitials: 'MS',
        rating: 4,
        itemVariant: 'Preto G',
        text: 'Produto muito bom, tecido de qualidade. Só achei o tamanho um pouco grande, mas no geral superou expectativas!',
        date: '2024-01-18',
      },
    ] as ProductReview[],
  },
  {
    id: '2',
    name: 'Gloss Labial Matte Rosa Duradouro',
    price: 29.90,
    originalPrice: 69.90,
    image: glossLabial,
    rating: 4.8,
    soldCount: 4340,
    viewCount: 28900,
    likesCount: 2156,
    isHotDeal: true,
    freeShipping: true,
    category: 'Beleza',
    brand: 'BeautyPro',
    colors: ['Rosa', 'Nude', 'Berry'],
    description: `O Gloss Labial Matte Rosa Duradouro oferece cor intensa e acabamento matte sofisticado. Fórmula de longa duração que não resseca os lábios.

**Características Técnicas:**
• Volume: 4ml
• Tipo: Gloss Labial Matte
• Duração: Até 8 horas
• Fórmula: Enriquecida com vitamina E e manteiga de karité
• Pigmentação: Alta cobertura em uma única aplicação
• Acabamento: Matte aveludado
• Textura: Cremosa e fácil aplicação
• Não resseca os lábios
• Livre de parabenos
• Testado dermatologicamente

**Cores Disponíveis:**
Rosa - Tom vibrante e moderno
Nude - Tom natural para o dia a dia
Berry - Tom intenso para a noite

**Modo de Uso:**
Aplicar diretamente nos lábios limpos. Para melhor fixação, aplicar em camadas finas.`,
    reviews: [
      {
        id: 'r4',
        userName: 'Juliana Santos',
        userInitials: 'JS',
        rating: 5,
        itemVariant: 'Rosa',
        text: 'Perfeito! Cor linda, dura muito tempo e não resseca os lábios. Recomendo muito!',
        date: '2024-01-22',
      },
      {
        id: 'r5',
        userName: 'Carla Mendes',
        userInitials: 'CM',
        rating: 5,
        itemVariant: 'Nude',
        text: 'Adorei o produto, textura matte incrível e cor perfeita para o dia a dia.',
        date: '2024-01-19',
      },
    ] as ProductReview[],
  },
  {
    id: '3',
    name: 'Moletom Unissex Casual Confortável',
    price: 79.99,
    originalPrice: 129.00,
    image: product3,
    rating: 4.5,
    soldCount: 2256,
    viewCount: 18750,
    likesCount: 1034,
    freeShipping: true,
    isLive: true,
    category: 'Moda',
    brand: 'UrbanStyle',
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
    colors: ['Verde', 'Preto', 'Cinza', 'Azul Marinho'],
    description: `Moletom Unissex Casual Confortável ideal para o dia a dia. Confeccionado em algodão e poliéster, oferece conforto e estilo.

**Características Técnicas:**
• Material: 80% Algodão, 20% Poliéster
• Gramatura: 280g/m²
• Forro: Algodão felpado macio
• Capuz: Ajustável com cordão
• Bolsos: Kangaroo pocket frontal
• Punhos e barra: Em ribana elástica
• Zíper: YKK de alta qualidade
• Lavagem: Máquina (água fria)
• Secagem: Secar à sombra
• Não encolhe

**Tamanhos Disponíveis:**
P (Peito: 100cm | Comprimento: 68cm)
M (Peito: 108cm | Comprimento: 70cm)
G (Peito: 116cm | Comprimento: 72cm)
GG (Peito: 124cm | Comprimento: 74cm)
XGG (Peito: 132cm | Comprimento: 76cm)`,
    reviews: [
      {
        id: 'r6',
        userName: 'Pedro Alves',
        userInitials: 'PA',
        rating: 5,
        itemVariant: 'Preto G',
        text: 'Moletom muito confortável e quentinho! Material de boa qualidade, recomendo.',
        date: '2024-01-25',
      },
      {
        id: 'r7',
        userName: 'Fernanda Lima',
        userInitials: 'FL',
        rating: 4,
        itemVariant: 'Verde M',
        text: 'Gostei muito, cor linda e caimento perfeito. Só achei um pouco caro, mas vale a pena.',
        date: '2024-01-23',
      },
    ] as ProductReview[],
  },
  {
    id: '4',
    name: 'Protetor Solar FPS50 Hidratante',
    price: 49.90,
    originalPrice: 89.00,
    image: product4,
    rating: 4.9,
    soldCount: 8678,
    viewCount: 45200,
    likesCount: 3890,
    isHotDeal: true,
    freeShipping: true,
    category: 'Beleza',
    brand: 'SkinCare BR',
    description: `Protetor Solar FPS50 Hidratante com proteção UVA/UVB de amplo espectro. Fórmula não oleosa, ideal para uso diário.

**Características Técnicas:**
• FPS: 50 (Fator de Proteção Solar)
• Proteção: UVA/UVB de amplo espectro
• Volume: 120ml
• Tipo de pele: Todos os tipos
• Textura: Leve, não oleosa
• Toque: Seco, não deixa aspecto brilhante
• Resistente à água: Até 80 minutos
• Enriquecido com: Vitamina E e Aloe Vera
• Livre de: Parabenos, óleo mineral e fragrâncias
• Testado dermatologicamente
• Não comedogênico

**Modo de Uso:**
Aplicar generosamente 15 minutos antes da exposição ao sol. Reaplicar a cada 2 horas ou após nadar/suor excessivo.`,
    reviews: [
      {
        id: 'r8',
        userName: 'Roberto Silva',
        userInitials: 'RS',
        rating: 5,
        text: 'Excelente protetor solar! Não deixa a pele oleosa e protege muito bem. Uso diariamente.',
        date: '2024-01-24',
      },
      {
        id: 'r9',
        userName: 'Patricia Costa',
        userInitials: 'PC',
        rating: 5,
        text: 'Melhor protetor que já usei! Textura leve, não arde os olhos e proteção garantida.',
        date: '2024-01-21',
      },
      {
        id: 'r10',
        userName: 'Lucas Oliveira',
        userInitials: 'LO',
        rating: 4,
        text: 'Bom produto, hidrata bem e não deixa branco na pele. Recomendo!',
        date: '2024-01-19',
      },
    ] as ProductReview[],
  },
  {
    id: '5',
    name: 'Bolsa Crossbody Mini Rosa Tendência',
    price: 59.99,
    originalPrice: 99.00,
    image: product5,
    rating: 4.6,
    soldCount: 1892,
    viewCount: 12300,
    likesCount: 756,
    isNewCustomerDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'TrendyBags',
    colors: ['Rosa', 'Preto', 'Branco'],
    description: `Bolsa Crossbody Mini Rosa perfeita para o dia a dia. Design moderno e compacto, ideal para carregar o essencial.

**Características Técnicas:**
• Dimensões: 20cm x 15cm x 8cm
• Material: Poliéster de alta qualidade
• Forro: Algodão interno
• Alça: Ajustável (60-90cm)
• Fechamento: Zíper YKK
• Bolsos: 1 bolso principal + 1 bolso interno com zíper
• Peso: 180g
• Resistente à água
• Costuras reforçadas

**Cores Disponíveis:**
Rosa - Tom vibrante e moderno
Preto - Clássico e versátil
Branco - Elegante e sofisticado`,
    reviews: [
      {
        id: 'r11',
        userName: 'Amanda Souza',
        userInitials: 'AS',
        rating: 5,
        itemVariant: 'Rosa',
        text: 'Bolsa linda e perfeita! Tamanho ideal para o dia a dia, muito fofa.',
        date: '2024-01-26',
      },
      {
        id: 'r12',
        userName: 'Beatriz Rocha',
        userInitials: 'BR',
        rating: 4,
        itemVariant: 'Preto',
        text: 'Gostei muito, qualidade boa e preço justo. Só achei um pouco pequena, mas é o tamanho mini mesmo.',
        date: '2024-01-22',
      },
    ] as ProductReview[],
  },
  {
    id: '6',
    name: 'Bicicleta Ergométrica Home Fitness',
    price: 299.90,
    originalPrice: 599.00,
    image: product6,
    rating: 4.4,
    soldCount: 534,
    viewCount: 8900,
    likesCount: 234,
    isHotDeal: true,
    category: 'Esportes',
    brand: 'FitPro',
    description: `Bicicleta Ergométrica Home Fitness ideal para treinos em casa. Sistema de resistência magnética silencioso e suave.

**Características Técnicas:**
• Sistema de resistência: Magnético (8 níveis)
• Display: LCD com 5 funções (velocidade, distância, tempo, calorias, pulso)
• Assento: Ajustável verticalmente
• Guidão: Ajustável em altura
• Pedais: Com cintas de segurança
• Peso máximo do usuário: 100kg
• Dimensões: 100cm x 50cm x 120cm
• Peso do produto: 18kg
• Voltagem: 110V/220V
• Garantia: 1 ano

**Inclui:**
• Manual de instruções
• Ferramentas para montagem
• Garantia do fabricante`,
    reviews: [
      {
        id: 'r13',
        userName: 'Carlos Eduardo',
        userInitials: 'CE',
        rating: 5,
        text: 'Excelente bicicleta! Montagem fácil, silenciosa e muito resistente. Superou expectativas!',
        date: '2024-01-27',
      },
      {
        id: 'r14',
        userName: 'Marcos Paulo',
        userInitials: 'MP',
        rating: 4,
        text: 'Boa bicicleta pelo preço. Funciona bem, só achei o assento um pouco desconfortável, mas dá pra trocar.',
        date: '2024-01-20',
      },
    ] as ProductReview[],
  },
  
  // New products - Vestuário e Calçados
  {
    id: '7',
    name: 'Tênis Masculino e Feminino Esportivo',
    price: 29.90,
    originalPrice: 99.90,
    image: tenisEsportivo,
    rating: 4.5,
    soldCount: 12450,
    viewCount: 89000,
    likesCount: 5670,
    isHotDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'SportMax',
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43'],
    colors: ['Branco'],
    description: `Tênis Masculino e Feminino Esportivo com tecnologia de amortecimento. Ideal para caminhada, corrida e academia.

**Características Técnicas:**
• Material superior: Mesh respirável
• Solado: EVA com tecnologia de amortecimento
• Palmilha: Removível e anatômica
• Entressola: EVA de alta densidade
• Solado externo: Borracha com padrão antiderrapante
• Peso: 280g (tamanho 40)
• Drop: 8mm
• Tipo: Neutro
• Indicado para: Caminhada, corrida leve e academia

**Tamanhos Disponíveis:**
36 a 43 (numeração brasileira)
Tabela de medidas disponível no produto`,
    reviews: [
      {
        id: 'r15',
        userName: 'João Santos',
        userInitials: 'JS',
        rating: 5,
        itemVariant: 'Branco 42',
        text: 'Tênis muito confortável! Uso para caminhada e academia, qualidade excelente pelo preço.',
        date: '2024-01-28',
      },
      {
        id: 'r16',
        userName: 'Rafaela Martins',
        userInitials: 'RM',
        rating: 5,
        itemVariant: 'Branco 38',
        text: 'Adorei! Tênis leve, confortável e lindo. Perfeito para o dia a dia.',
        date: '2024-01-25',
      },
      {
        id: 'r17',
        userName: 'Thiago Lima',
        userInitials: 'TL',
        rating: 4,
        itemVariant: 'Branco 41',
        text: 'Bom tênis, confortável e resistente. Só achei que o solado poderia ser mais aderente.',
        date: '2024-01-23',
      },
    ] as ProductReview[],
  },
  {
    id: '8',
    name: 'Kit 3 Camisetas Masculinas Algodão',
    price: 29.56,
    originalPrice: 89.90,
    image: kit3CamisetasMasculinas,
    rating: 4.6,
    soldCount: 8900,
    viewCount: 56000,
    likesCount: 3450,
    isHotDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'BasicWear',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Preto/Branco/Cinza', 'Azul/Verde/Bege'],
    description: `Kit com 3 Camisetas Masculinas de Algodão 100%. Conforto e qualidade para o dia a dia.

**Características Técnicas:**
• Material: 100% Algodão
• Gramatura: 150g/m²
• Tipo: Malha penteada
• Gola: Redonda
• Manga: Curta
• Estilo: Básico, casual
• Lavagem: Máquina (água fria)
• Não encolhe após lavagem
• Costuras reforçadas

**Conteúdo do Kit:**
3 camisetas na cor escolhida

**Tamanhos Disponíveis:**
P (Peito: 100cm | Comprimento: 70cm)
M (Peito: 108cm | Comprimento: 72cm)
G (Peito: 116cm | Comprimento: 74cm)
GG (Peito: 124cm | Comprimento: 76cm)`,
    reviews: [
      {
        id: 'r18',
        userName: 'Felipe Rodrigues',
        userInitials: 'FR',
        rating: 5,
        itemVariant: 'Preto/Branco/Cinza G',
        text: 'Kit excelente! Camisetas de algodão de qualidade, caimento perfeito. Vale muito a pena!',
        date: '2024-01-29',
      },
      {
        id: 'r19',
        userName: 'Gabriel Almeida',
        userInitials: 'GA',
        rating: 4,
        itemVariant: 'Azul/Verde/Bege M',
        text: 'Bom custo-benefício. Tecido macio e confortável, só achei que poderia ser um pouco mais grosso.',
        date: '2024-01-26',
      },
    ] as ProductReview[],
  },
  {
    id: '9',
    name: 'Tênis Masculino Básico Casual',
    price: 39.90,
    originalPrice: 129.90,
    image: tenisCasual,
    rating: 4.4,
    soldCount: 6780,
    viewCount: 42000,
    likesCount: 2890,
    isHotDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'UrbanStep',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Branco'],
    description: `Tênis Masculino Básico Casual com design clássico e confortável. Perfeito para o dia a dia.

**Características Técnicas:**
• Material superior: Couro sintético
• Solado: EVA com borracha
• Palmilha: Removível e confortável
• Entressola: EVA de média densidade
• Solado externo: Borracha antiderrapante
• Peso: 320g (tamanho 42)
• Tipo: Casual
• Indicado para: Uso diário, trabalho, passeios

**Tamanhos Disponíveis:**
39 a 44 (numeração brasileira)`,
    reviews: [
      {
        id: 'r20',
        userName: 'Bruno Carvalho',
        userInitials: 'BC',
        rating: 4,
        itemVariant: 'Branco 42',
        text: 'Tênis básico e confortável, perfeito para o dia a dia. Preço justo.',
        date: '2024-01-30',
      },
      {
        id: 'r21',
        userName: 'Daniel Pereira',
        userInitials: 'DP',
        rating: 5,
        itemVariant: 'Branco 43',
        text: 'Excelente tênis! Confortável, durável e com bom acabamento. Recomendo!',
        date: '2024-01-27',
      },
    ] as ProductReview[],
  },
  {
    id: '10',
    name: 'Kit 3 Camisetas Unissex Básicas',
    price: 17.50,
    originalPrice: 59.90,
    image: kit3CamisetasUnissex,
    rating: 4.3,
    soldCount: 15600,
    viewCount: 98000,
    likesCount: 7890,
    isHotDeal: true,
    isNewCustomerDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'EssentialBR',
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
    colors: ['Cores Variadas'],
    description: `Kit com 3 Camisetas Unissex Básicas. Conforto e versatilidade para todos os estilos.

**Características Técnicas:**
• Material: 100% Algodão
• Gramatura: 140g/m²
• Tipo: Malha lisa
• Gola: Redonda
• Manga: Curta
• Estilo: Unissex, básico
• Lavagem: Máquina (água fria)
• Não encolhe
• Cores variadas no kit

**Conteúdo do Kit:**
3 camisetas em cores variadas

**Tamanhos Disponíveis:**
P, M, G, GG, XGG`,
    reviews: [
      {
        id: 'r22',
        userName: 'Isabela Ferreira',
        userInitials: 'IF',
        rating: 5,
        itemVariant: 'Cores Variadas M',
        text: 'Kit perfeito! Camisetas básicas de qualidade, preço imbatível. Comprei mais de um kit!',
        date: '2024-01-31',
      },
      {
        id: 'r23',
        userName: 'Ricardo Nunes',
        userInitials: 'RN',
        rating: 4,
        itemVariant: 'Cores Variadas G',
        text: 'Bom custo-benefício. Camisetas confortáveis, só achei que poderiam ter mais opções de cores.',
        date: '2024-01-28',
      },
    ] as ProductReview[],
  },
  {
    id: '11',
    name: 'Mauricinho Kit 3 Shorts Masculino',
    price: 33.06,
    originalPrice: 99.90,
    image: mauricinhoShorts,
    rating: 4.5,
    soldCount: 4560,
    viewCount: 32000,
    likesCount: 1890,
    isHotDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'BeachStyle',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Estampado', 'Liso'],
    description: `Mauricinho Kit 3 Shorts Masculino. Conforto e estilo para o verão.

**Características Técnicas:**
• Material: 100% Algodão
• Gramatura: 200g/m²
• Tipo: Malha lisa
• Cintura: Elástica com cordão
• Bolsos: 2 frontais + 2 traseiros
• Comprimento: Acima do joelho
• Lavagem: Máquina (água fria)
• Não encolhe

**Conteúdo do Kit:**
3 shorts na opção escolhida (estampado ou liso)

**Tamanhos Disponíveis:**
P, M, G, GG`,
    reviews: [
      {
        id: 'r24',
        userName: 'André Luiz',
        userInitials: 'AL',
        rating: 5,
        itemVariant: 'Estampado G',
        text: 'Shorts perfeitos! Confortáveis, boa qualidade e preço excelente. Recomendo!',
        date: '2024-02-01',
      },
      {
        id: 'r25',
        userName: 'Vinicius Costa',
        userInitials: 'VC',
        rating: 4,
        itemVariant: 'Liso M',
        text: 'Bom kit de shorts, qualidade ok pelo preço. Só achei que poderiam ser um pouco mais largos.',
        date: '2024-01-29',
      },
    ] as ProductReview[],
  },
  {
    id: '12',
    name: 'Chinelo Nuvem Slide YZ Confort',
    price: 22.90,
    originalPrice: 69.90,
    image: chineloNuvem,
    rating: 4.7,
    soldCount: 23400,
    viewCount: 156000,
    likesCount: 12300,
    isHotDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'CloudStep',
    sizes: ['35/36', '37/38', '39/40', '41/42', '43/44'],
    description: `Chinelo Nuvem Slide YZ Confort com tecnologia de amortecimento. Sensação de pisar em nuvens.

**Características Técnicas:**
• Material superior: EVA macio
• Solado: EVA de alta densidade com tecnologia de amortecimento
• Palmilha: Anatômica e removível
• Peso: 180g (tamanho 40)
• Tipo: Slide (sem tiras)
• Indicado para: Casa, praia, piscina
• Resistente à água
• Antiderrapante

**Tamanhos Disponíveis:**
35/36, 37/38, 39/40, 41/42, 43/44`,
    reviews: [
      {
        id: 'r26',
        userName: 'Larissa Araujo',
        userInitials: 'LA',
        rating: 5,
        itemVariant: '37/38',
        text: 'Chinelo super confortável! Parece nuvem mesmo, uso o dia todo em casa. Melhor compra!',
        date: '2024-02-02',
      },
      {
        id: 'r27',
        userName: 'Camila Ribeiro',
        userInitials: 'CR',
        rating: 5,
        itemVariant: '39/40',
        text: 'Adorei! Conforto incrível, qualidade excelente e preço justo. Já comprei mais de um par!',
        date: '2024-01-30',
      },
      {
        id: 'r28',
        userName: 'Eduardo Mendes',
        userInitials: 'EM',
        rating: 4,
        itemVariant: '41/42',
        text: 'Bom chinelo, confortável e macio. Só achei que poderia ter mais opções de cores.',
        date: '2024-01-28',
      },
    ] as ProductReview[],
    colors: ['Bege', 'Preto', 'Branco', 'Rosa'],
  },
  {
    id: '13',
    name: 'Short Masculino Linho Premium',
    price: 22.99,
    originalPrice: 79.90,
    image: shortLinho,
    rating: 4.4,
    soldCount: 3450,
    viewCount: 24000,
    likesCount: 1234,
    isHotDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'LinenBR',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Bege', 'Branco', 'Azul Claro'],
    description: `Short Masculino Linho Premium com tecido natural e respirável. Ideal para o verão e dias quentes.

**Características Técnicas:**
• Material: 100% Linho
• Gramatura: 150g/m²
• Tecido: Natural, respirável e fresco
• Cintura: Elástica com cordão ajustável
• Bolsos: 2 frontais + 2 traseiros
• Comprimento: Acima do joelho
• Lavagem: Máquina (água fria)
• Secagem: Secar à sombra
• Não encolhe

**Tamanhos Disponíveis:**
P, M, G, GG`,
    reviews: [
      {
        id: 'r29',
        userName: 'Rodrigo Santos',
        userInitials: 'RS',
        rating: 4,
        itemVariant: 'Bege M',
        text: 'Short confortável e de boa qualidade. Tecido de linho é perfeito para o verão.',
        date: '2024-02-03',
      },
    ] as ProductReview[],
  },
  {
    id: '14',
    name: 'Kit Masculino Camisa + Bermuda',
    price: 27.35,
    originalPrice: 89.90,
    image: kitCamisaBermuda,
    rating: 4.5,
    soldCount: 5670,
    viewCount: 38000,
    likesCount: 2340,
    isHotDeal: true,
    freeShipping: true,
    category: 'Moda',
    brand: 'ComboStyle',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Preto', 'Azul', 'Verde'],
    description: `Kit Masculino com Camisa e Bermuda. Conjunto completo e versátil para o dia a dia.

**Características Técnicas:**
• Material: 100% Algodão
• Gramatura: 160g/m²
• Camisa: Manga curta, gola redonda
• Bermuda: Cintura elástica com cordão
• Lavagem: Máquina (água fria)
• Não encolhe
• Costuras reforçadas

**Conteúdo do Kit:**
1 Camisa + 1 Bermuda na cor escolhida

**Tamanhos Disponíveis:**
P, M, G, GG`,
    reviews: [
      {
        id: 'r30',
        userName: 'Leonardo Barbosa',
        userInitials: 'LB',
        rating: 5,
        itemVariant: 'Preto G',
        text: 'Kit perfeito! Camisa e bermuda de qualidade, preço excelente. Recomendo!',
        date: '2024-02-04',
      },
    ] as ProductReview[],
  },
  {
    id: '15',
    name: 'Boné Brooklyn Beisebol Aba Reta',
    price: 24.90,
    originalPrice: 69.90,
    image: boneBrooklyn,
    rating: 4.6,
    soldCount: 7890,
    viewCount: 52000,
    likesCount: 3450,
    isHotDeal: true,
    freeShipping: true,
    category: 'Acessórios',
    brand: 'StreetCap',
    colors: ['Preto', 'Branco', 'Vermelho', 'Azul'],
    description: `Boné Brooklyn Beisebol Aba Reta com design clássico e ajuste confortável. Estilo urbano e versátil.

**Características Técnicas:**
• Material: 100% Poliéster
• Aba: Reta, rígida
• Ajuste: Fechamento com fivela ajustável
• Tamanho: Único (ajustável de 54cm a 62cm)
• Forro: Algodão interno
• Peso: 120g
• Resistente à água
• Design: Clássico beisebol

**Cores Disponíveis:**
Preto, Branco, Vermelho, Azul`,
    reviews: [
      {
        id: 'r31',
        userName: 'Matheus Rocha',
        userInitials: 'MR',
        rating: 5,
        itemVariant: 'Preto',
        text: 'Boné perfeito! Ajuste confortável, qualidade excelente e estilo incrível.',
        date: '2024-02-05',
      },
      {
        id: 'r32',
        userName: 'Gustavo Henrique',
        userInitials: 'GH',
        rating: 4,
        itemVariant: 'Branco',
        text: 'Bom boné, qualidade ok. Só achei que poderia ter mais opções de cores.',
        date: '2024-02-01',
      },
    ] as ProductReview[],
  },

  // Cuidados Pessoais e Beleza
  {
    id: '16',
    name: 'Navalha Para Barbearia Profissional',
    price: 12.49,
    originalPrice: 39.90,
    image: navalha,
    rating: 4.7,
    soldCount: 8900,
    viewCount: 67000,
    likesCount: 4560,
    isHotDeal: true,
    freeShipping: true,
    category: 'Beleza',
    brand: 'BarberPro',
    description: `Navalha Para Barbearia Profissional com lâmina de aço inoxidável. Corte preciso e duradouro.

**Características Técnicas:**
• Material: Aço inoxidável
• Lâmina: Afiada e resistente
• Cabo: Ergonômico e antiderrapante
• Tipo: Navalha descartável profissional
• Uso: Barbearia e uso pessoal
• Embalagem: Individual higienizada`,
    reviews: [
      {
        id: 'r16',
        userName: 'João Pedro',
        userInitials: 'JP',
        rating: 5,
        text: 'Navalha excelente! Muito afiada e de qualidade profissional. Uso na barbearia e os clientes sempre elogiam o corte. Recomendo muito!',
        date: '2024-02-06',
      },
      {
        id: 'r17',
        userName: 'Marcelo Silva',
        userInitials: 'MS',
        rating: 4,
        text: 'Boa navalha, lâmina afiada e cabo confortável. Só achei que poderia vir com mais unidades no pacote, mas a qualidade é boa.',
        date: '2024-02-03',
      },
      {
        id: 'r18',
        userName: 'Ricardo Costa',
        userInitials: 'RC',
        rating: 5,
        text: 'Perfeita para uso profissional! Lâmina de alta qualidade, corte preciso e embalagem higienizada. Vale muito a pena!',
        date: '2024-02-01',
      },
    ] as ProductReview[],
  },
  {
    id: '17',
    name: 'Kit Body Cream e Body Splash Blue',
    price: 54.40,
    originalPrice: 129.90,
    image: kitBodyCream,
    rating: 4.8,
    soldCount: 3450,
    viewCount: 28000,
    likesCount: 1890,
    isHotDeal: true,
    freeShipping: true,
    category: 'Beleza',
    brand: 'FragranceBR',
    colors: ['Blue', 'Pink', 'Gold'],
    description: `Kit Body Cream e Body Splash com fragrância duradoura. Hidratação e perfume em um só produto.

**Características Técnicas:**
• Body Cream: 200ml
• Body Splash: 250ml
• Fragrância: Longa duração
• Tipo de pele: Todos os tipos
• Enriquecido com: Vitamina E e Aloe Vera
• Livre de: Parabenos
• Textura: Cremosa e leve

**Cores/Fragrâncias Disponíveis:**
Blue - Fragrância fresca e masculina
Pink - Fragrância doce e feminina
Gold - Fragrância sofisticada e unissex`,
    reviews: [
      {
        id: 'r19',
        userName: 'Ana Paula',
        userInitials: 'AP',
        rating: 5,
        itemVariant: 'Pink',
        text: 'Adorei o kit! A fragrância é deliciosa e dura o dia todo. O creme hidrata muito bem e o body splash deixa um cheiro incrível. Super recomendo!',
        date: '2024-02-07',
      },
      {
        id: 'r20',
        userName: 'Carlos Mendes',
        userInitials: 'CM',
        rating: 5,
        itemVariant: 'Blue',
        text: 'Kit perfeito! Fragrância masculina e fresca, creme hidratante de qualidade e o body splash dura bastante. Melhor custo-benefício!',
        date: '2024-02-05',
      },
      {
        id: 'r21',
        userName: 'Fernanda Lima',
        userInitials: 'FL',
        rating: 4,
        itemVariant: 'Gold',
        text: 'Gostei muito! Fragrância sofisticada e unissex, produtos de boa qualidade. Só achei que o creme poderia ser um pouco mais cremoso.',
        date: '2024-02-02',
      },
    ] as ProductReview[],
  },
  {
    id: '18',
    name: 'Barbeador Elétrico Sem Fio Recarregável',
    price: 19.89,
    originalPrice: 69.90,
    image: barbeadorEletrico,
    rating: 4.5,
    soldCount: 12300,
    viewCount: 89000,
    likesCount: 5670,
    isHotDeal: true,
    freeShipping: true,
    category: 'Beleza',
    brand: 'ShaveTech',
    description: `Barbeador Elétrico Sem Fio Recarregável com tecnologia de corte precisa. Ideal para uso diário.

**Características Técnicas:**
• Tipo: Elétrico sem fio
• Bateria: Recarregável via USB
• Autonomia: Até 60 minutos de uso contínuo
• Lâminas: Aço inoxidável autoafiáveis
• Sistema: Rotativo com 3 cabeças
• Resistente à água: IPX7
• Indicador: LED de bateria
• Inclui: Cabo USB, estojo de viagem

**Garantia:**
1 ano`,
    reviews: [
      {
        id: 'r22',
        userName: 'Bruno Alves',
        userInitials: 'BA',
        rating: 5,
        text: 'Barbeador excelente! Muito potente, bateria dura bastante e o corte é bem rente. Uso todo dia e tô muito satisfeito. Melhor que esperava pelo preço!',
        date: '2024-02-08',
      },
      {
        id: 'r23',
        userName: 'Diego Santos',
        userInitials: 'DS',
        rating: 4,
        text: 'Bom barbeador, funciona bem e é prático. Só achei que poderia ser um pouco mais silencioso, mas pelo preço vale muito a pena.',
        date: '2024-02-05',
      },
      {
        id: 'r24',
        userName: 'Eduardo Rocha',
        userInitials: 'ER',
        rating: 5,
        text: 'Top demais! Lâminas afiadas, bateria dura bastante e é resistente à água. Uso no banho e funciona perfeitamente. Recomendo muito!',
        date: '2024-02-03',
      },
    ] as ProductReview[],
  },
  {
    id: '19',
    name: 'Kit Cuidados Masculinos Barbeiro Completo',
    price: 10.99,
    originalPrice: 34.90,
    image: kitCuidados,
    rating: 4.4,
    soldCount: 6780,
    viewCount: 45000,
    likesCount: 2890,
    isHotDeal: true,
    isNewCustomerDeal: true,
    freeShipping: true,
    category: 'Beleza',
    brand: 'GroomKit',
    description: `Kit Cuidados Masculinos Barbeiro Completo com todos os itens essenciais para cuidados pessoais.

**Características Técnicas:**
• Conteúdo: Navalha, pincel, espuma de barbear, loção pós-barba
• Navalha: Aço inoxidável
• Pincel: Cerdas naturais
• Espuma: 150ml
• Loção: 100ml
• Tipo: Kit completo profissional

**Conteúdo do Kit:**
1 Navalha profissional
1 Pincel de barbear
1 Espuma de barbear
1 Loção pós-barba`,
    reviews: [
      {
        id: 'r25',
        userName: 'Gabriel Oliveira',
        userInitials: 'GO',
        rating: 5,
        text: 'Kit completo e de qualidade! A navalha corta bem, o pincel é macio e a espuma faz bastante espuma. A loção pós-barba hidrata bem. Vale muito a pena!',
        date: '2024-02-09',
      },
      {
        id: 'r26',
        userName: 'Henrique Lima',
        userInitials: 'HL',
        rating: 4,
        text: 'Bom kit para começar. Produtos de qualidade, só achei que a espuma poderia ser um pouco mais cremosa, mas no geral gostei muito.',
        date: '2024-02-06',
      },
      {
        id: 'r27',
        userName: 'Igor Martins',
        userInitials: 'IM',
        rating: 5,
        text: 'Kit perfeito! Tudo que preciso para fazer a barba em casa. Qualidade profissional pelo preço. Já comprei mais um kit pra dar de presente!',
        date: '2024-02-04',
      },
    ] as ProductReview[],
  },
  {
    id: '20',
    name: 'Escova de Dentes Elétrica Sônica',
    price: 13.99,
    originalPrice: 49.90,
    image: escovaDentes,
    rating: 4.6,
    soldCount: 15600,
    viewCount: 98000,
    likesCount: 7890,
    isHotDeal: true,
    freeShipping: true,
    category: 'Saúde',
    brand: 'OralTech',
    colors: ['Branco', 'Rosa', 'Azul'],
    description: `Escova de Dentes Elétrica Sônica com tecnologia de vibração ultrassônica. Limpeza profunda e eficiente.

**Características Técnicas:**
• Tipo: Elétrica sônica
• Movimentos: 31.000 por minuto
• Bateria: Recarregável via USB
• Autonomia: Até 30 dias de uso
• Cabeça: Removível e substituível
• Timer: 2 minutos com alerta
• Resistente à água: IPX7
• Inclui: Cabo USB, estojo de viagem

**Cores Disponíveis:**
Branco, Rosa, Azul`,
    reviews: [
      {
        id: 'r28',
        userName: 'Juliana Ferreira',
        userInitials: 'JF',
        rating: 5,
        itemVariant: 'Rosa',
        text: 'Escova elétrica incrível! Limpeza muito mais profunda que escova normal. Bateria dura bastante e o timer de 2 minutos é perfeito. Recomendo muito!',
        date: '2024-02-10',
      },
      {
        id: 'r29',
        userName: 'Larissa Souza',
        userInitials: 'LS',
        rating: 5,
        itemVariant: 'Branco',
        text: 'Melhor escova que já tive! Dentes muito mais limpos, gengivas mais saudáveis. A vibração é suave mas eficiente. Vale cada centavo!',
        date: '2024-02-07',
      },
      {
        id: 'r30',
        userName: 'Mariana Costa',
        userInitials: 'MC',
        rating: 4,
        itemVariant: 'Azul',
        text: 'Boa escova elétrica, limpeza eficiente e bateria dura bastante. Só achei que poderia ter mais opções de cabeças no kit, mas a qualidade é boa.',
        date: '2024-02-05',
      },
    ] as ProductReview[],
  },

  // Ferramentas e Acessórios
  {
    id: '21',
    name: 'Necessaire Masculina Organizadora Viagem',
    price: 12.90,
    originalPrice: 39.90,
    image: necessaire,
    rating: 4.5,
    soldCount: 4560,
    viewCount: 32000,
    likesCount: 1890,
    isHotDeal: true,
    freeShipping: true,
    category: 'Acessórios',
    brand: 'TravelBag',
    colors: ['Preto', 'Cinza', 'Azul Marinho'],
    description: `Necessaire Masculina Organizadora para Viagem com múltiplos compartimentos. Ideal para organizar itens de higiene pessoal.

**Características Técnicas:**
• Dimensões: 25cm x 18cm x 8cm
• Material: Poliéster resistente à água
• Compartimentos: 3 principais + bolsos internos
• Fechamento: Zíper YKK
• Alça: Removível e ajustável
• Peso: 250g
• Resistente à água
• Fácil limpeza

**Cores Disponíveis:**
Preto, Cinza, Azul Marinho`,
    reviews: [
      {
        id: 'r31',
        userName: 'Nicolas Almeida',
        userInitials: 'NA',
        rating: 5,
        itemVariant: 'Preto',
        text: 'Necessaire perfeita! Muito organizada, vários compartimentos e material resistente. Levo em todas as viagens. Recomendo muito!',
        date: '2024-02-11',
      },
      {
        id: 'r32',
        userName: 'Otávio Rocha',
        userInitials: 'OR',
        rating: 4,
        itemVariant: 'Cinza',
        text: 'Boa nécessaire, bem organizada e de boa qualidade. Só achei que poderia ser um pouco maior, mas cabe tudo que preciso.',
        date: '2024-02-08',
      },
      {
        id: 'r39',
        userName: 'Paulo Henrique',
        userInitials: 'PH',
        rating: 5,
        itemVariant: 'Azul Marinho',
        text: 'Excelente! Muito prática e organizada. Material de qualidade e resistente à água. Perfeita para viagens. Vale muito a pena!',
        date: '2024-02-06',
      },
    ] as ProductReview[],
  },
  {
    id: '22',
    name: 'Parafusadeira/Furadeira 48V Bateria',
    price: 26.23,
    originalPrice: 89.90,
    image: parafusadeira48V,
    rating: 4.4,
    soldCount: 8900,
    viewCount: 67000,
    likesCount: 3450,
    isHotDeal: true,
    freeShipping: true,
    category: 'Ferramentas',
    brand: 'ToolMax',
    description: `Parafusadeira/Furadeira 48V com bateria recarregável. Potência e versatilidade para trabalhos domésticos e profissionais.

**Características Técnicas:**
• Voltagem: 48V
• Bateria: Li-ion recarregável
• Autonomia: Até 2 horas de uso contínuo
• Torque: Ajustável (0-20Nm)
• Velocidade: 2 velocidades (0-450/0-1500 RPM)
• Chuck: 10mm
• Peso: 1.2kg
• Inclui: Bateria, carregador, maleta

**Garantia:**
1 ano`,
    reviews: [
      {
        id: 'r40',
        userName: 'Renato Silva',
        userInitials: 'RS',
        rating: 5,
        text: 'Parafusadeira muito potente! Bateria dura bastante e tem força de sobra para trabalhos pesados. Uso profissionalmente e recomendo muito!',
        date: '2024-02-12',
      },
      {
        id: 'r41',
        userName: 'Sérgio Lima',
        userInitials: 'SL',
        rating: 4,
        text: 'Boa parafusadeira, potente e prática. Só achei que poderia vir com mais uma bateria, mas a qualidade é excelente pelo preço.',
        date: '2024-02-09',
      },
      {
        id: 'r42',
        userName: 'Thiago Costa',
        userInitials: 'TC',
        rating: 5,
        text: 'Excelente! Muito potente, bateria dura bastante e é leve. Perfeita para trabalhos domésticos e profissionais. Vale muito a pena!',
        date: '2024-02-07',
      },
    ] as ProductReview[],
  },
  {
    id: '23',
    name: 'Kit De Ferramentas 46 Peças Completo',
    price: 31.99,
    originalPrice: 78.98,
    image: kitFerramentas,
    rating: 4.3,
    soldCount: 23400,
    viewCount: 156000,
    likesCount: 9870,
    isHotDeal: true,
    isNewCustomerDeal: true,
    freeShipping: true,
    category: 'Ferramentas',
    brand: 'HandyKit',
    description: `Kit De Ferramentas 46 Peças Completo com todas as ferramentas essenciais para reparos domésticos e profissionais.

**Sobre este item:**
46 peças em aço vanádio e cromo
Maleta de transporte resistente

**Conteúdo do Kit:**
• 13 Soquetes: de 4mm à 14mm
• 21 Pontas de Soquete: FD4, 5.5, 7, HW3, 4, 5, 6, 7, 8, T10, 15, 20, 25, 30, 40
• Chaves L Allen: de 1.5mm à 2.5mm
• 1 Junta Universal de 1/4"
• 1 Barra de Extensão DR 1/4" × 2"
• 1 Barra de Extensão DR 1/4" × 4"
• 1 Barra de Extensão Flexível DR 1/4" × 6"
• 1 Barra Deslizante T 1/4"
• 1 Catraca de Liberação Rápida 1/4"
• 1 Alça Giratória de 6"
• 1 Adaptador de Ponta
• 1 Maleta de Ferramentas

**Características Técnicas:**
• Total de peças: 46
• Material: Aço vanádio e cromo de alta qualidade
• Acabamento: Cromado anti-ferrugem
• Maleta: Plástico resistente com organizador
• Peso: 2.5kg

**Aplicações:**
Reparos domésticos, montagem de móveis, manutenção de veículos, trabalhos profissionais`,
    creatorVideos: [
      {
        id: 'cv-kit-ferramentas-1',
        videoUrl: videoKitFerramentas1,
        creatorName: 'Ferramentas BR',
        creatorInitials: 'FB',
        title: 'Kit completo de ferramentas!',
      },
      {
        id: 'cv-kit-ferramentas-2',
        videoUrl: videoKitFerramentas2,
        creatorName: 'DIY Brasil',
        creatorInitials: 'DB',
        title: 'Unboxing do kit 46 peças',
      },
      {
        id: 'cv-kit-ferramentas-4',
        videoUrl: videoKitFerramentas4,
        creatorName: 'HandyTools',
        creatorInitials: 'HT',
        title: 'Kit completo para casa',
      },
      {
        id: 'cv-kit-ferramentas-5',
        videoUrl: videoKitFerramentas5,
        creatorName: 'Ferramentas Pro',
        creatorInitials: 'FP',
        title: 'Review do kit 46 peças',
      },
    ] as CreatorVideo[],
    reviews: [
      {
        id: 'r43',
        userName: 'Vitor Hugo',
        userInitials: 'VH',
        rating: 5,
        text: 'Kit completo demais! Tem todas as ferramentas que preciso. Qualidade excelente, maleta resistente e organização perfeita. Melhor custo-benefício que já vi!',
        date: '2024-02-13',
      },
      {
        id: 'r44',
        userName: 'Wagner Santos',
        userInitials: 'WS',
        rating: 5,
        text: 'Top! Kit muito completo, ferramentas de qualidade e a maleta é bem organizada. Uso pra tudo em casa e no trabalho. Recomendo muito!',
        date: '2024-02-10',
      },
      {
        id: 'r45',
        userName: 'Yuri Alves',
        userInitials: 'YA',
        rating: 4,
        text: 'Bom kit, ferramentas de qualidade e bem organizadas. Só achei que algumas peças poderiam ser um pouco maiores, mas no geral vale muito a pena.',
        date: '2024-02-08',
      },
      {
        id: 'r46',
        userName: 'Zeca Oliveira',
        userInitials: 'ZO',
        rating: 5,
        text: 'Kit perfeito! Tem tudo que preciso e mais um pouco. Ferramentas resistentes, maleta bem feita e preço excelente. Já mostrei pros amigos e vários compraram também!',
        date: '2024-02-05',
      },
    ] as ProductReview[],
  },
  {
    id: '24',
    name: 'Conjunto de Chaves 115 em 1 Precisão',
    price: 21.75,
    originalPrice: 69.90,
    image: chavesPrecisao,
    rating: 4.6,
    soldCount: 12300,
    viewCount: 89000,
    likesCount: 5670,
    isHotDeal: true,
    freeShipping: true,
    category: 'Ferramentas',
    brand: 'PrecisionTools',
    description: `Conjunto de Chaves 115 em 1 Precisão para trabalhos delicados e precisos. Ideal para eletrônicos, relógios e aparelhos pequenos.

**Características Técnicas:**
• Total de bits: 115 peças
• Material: Aço S2 de alta qualidade
• Tamanhos: De 0.8mm a 10mm
• Tipo: Chaves de fenda, philips, torx, hexagonais
• Estojo: Organizador com identificação
• Peso: 800g

**Aplicações:**
Eletrônicos, relógios, brinquedos, aparelhos pequenos`,
    reviews: [
      {
        id: 'r47',
        userName: 'André Luiz',
        userInitials: 'AL',
        rating: 5,
        text: 'Conjunto perfeito! Tem todas as chaves que preciso para trabalhar com eletrônicos. Bits de qualidade e estojo bem organizado. Recomendo muito!',
        date: '2024-02-14',
      },
      {
        id: 'r48',
        userName: 'Bernardo Rocha',
        userInitials: 'BR',
        rating: 4,
        text: 'Bom conjunto, bits de qualidade e bem organizados. Só achei que poderia ter mais algumas chaves torx, mas no geral atende bem minhas necessidades.',
        date: '2024-02-11',
      },
      {
        id: 'r49',
        userName: 'Caio Mendes',
        userInitials: 'CM',
        rating: 5,
        text: 'Excelente! Uso pra consertar celulares e notebooks. Tem todos os tamanhos que preciso e a qualidade dos bits é muito boa. Vale muito a pena!',
        date: '2024-02-09',
      },
    ] as ProductReview[],
  },
  {
    id: '25',
    name: 'Parafusadeira/Furadeira Profissional',
    price: 93.16,
    originalPrice: 259.90,
    image: parafusadeiraPro,
    rating: 4.8,
    soldCount: 5670,
    viewCount: 45000,
    likesCount: 2890,
    isHotDeal: true,
    freeShipping: true,
    category: 'Ferramentas',
    brand: 'ProDrill',
    description: `Parafusadeira/Furadeira Profissional de alta performance. Ideal para uso profissional e trabalhos pesados.

**Características Técnicas:**
• Voltagem: 20V
• Bateria: Li-ion 4.0Ah
• Autonomia: Até 4 horas
• Torque: Ajustável (0-65Nm)
• Velocidade: 2 velocidades (0-450/0-2000 RPM)
• Chuck: 13mm
• Peso: 1.8kg
• LED: Iluminação frontal
• Inclui: 2 baterias, carregador rápido, maleta profissional

**Garantia:**
2 anos`,
    reviews: [
      {
        id: 'r50',
        userName: 'Daniel Ferreira',
        userInitials: 'DF',
        rating: 5,
        text: 'Parafusadeira profissional excelente! Muito potente, bateria dura bastante e vem com 2 baterias. Uso profissionalmente e superou todas as expectativas!',
        date: '2024-02-15',
      },
      {
        id: 'r51',
        userName: 'Eduardo Lima',
        userInitials: 'EL',
        rating: 5,
        text: 'Top demais! Muito potente, torque ajustável e a iluminação LED ajuda muito. Maleta profissional e qualidade excelente. Melhor investimento!',
        date: '2024-02-12',
      },
      {
        id: 'r52',
        userName: 'Fabio Costa',
        userInitials: 'FC',
        rating: 4,
        text: 'Boa parafusadeira profissional, potente e de qualidade. Só achei um pouco pesada, mas pelo torque e potência vale muito a pena.',
        date: '2024-02-10',
      },
    ] as ProductReview[],
  },
  {
    id: '26',
    name: 'Capa Para iPhone Silicone Premium',
    price: 19.90,
    originalPrice: 59.90,
    image: capaIphone,
    rating: 4.5,
    soldCount: 34500,
    viewCount: 234000,
    likesCount: 15600,
    isHotDeal: true,
    freeShipping: true,
    category: 'Eletrônicos',
    brand: 'CasePro',
    colors: ['Preto', 'Transparente', 'Rosa', 'Azul', 'Verde'],
    description: `Capa Para iPhone Silicone Premium com proteção completa e design elegante. Compatível com todos os modelos iPhone.

**Características Técnicas:**
• Material: Silicone premium de alta qualidade
• Proteção: Anti-queda até 2 metros
• Espessura: 1.5mm nas bordas
• Compatibilidade: iPhone 12/13/14/15 (todos os modelos)
• Recortes: Precisos para câmera, botões e carregamento
• Textura: Macia ao toque, antiderrapante
• Peso: 25g

**Cores Disponíveis:**
Preto, Transparente, Rosa, Azul, Verde`,
    reviews: [
      {
        id: 'r53',
        userName: 'Gabriela Silva',
        userInitials: 'GS',
        rating: 5,
        itemVariant: 'Rosa',
        text: 'Capa perfeita! Proteção excelente, encaixa perfeitamente e não amarela. Design bonito e material de qualidade. Recomendo muito!',
        date: '2024-02-16',
      },
      {
        id: 'r54',
        userName: 'Helena Santos',
        userInitials: 'HS',
        rating: 5,
        itemVariant: 'Transparente',
        text: 'Adorei! Capa transparente que não amarela, proteção completa e encaixe perfeito. Já caiu algumas vezes e o celular está intacto. Vale muito a pena!',
        date: '2024-02-13',
      },
      {
        id: 'r55',
        userName: 'Isabela Rocha',
        userInitials: 'IR',
        rating: 4,
        itemVariant: 'Azul',
        text: 'Boa capa, proteção adequada e material de qualidade. Só achei que poderia ser um pouco mais fina, mas protege bem mesmo assim.',
        date: '2024-02-11',
      },
    ] as ProductReview[],
  },
  {
    id: '27',
    name: 'Kit Parafusadeira Doméstica com maleta Leve Portátil USB Recarregável—Presentes de Natal',
    price: 27.90,
    originalPrice: 68.90,
    image: parafusadeiraDomestica,
    rating: 4.5,
    soldCount: 10700,
    viewCount: 56700,
    likesCount: 3450,
    isHotDeal: true,
    freeShipping: true,
    category: 'Ferramentas',
    brand: 'HomeTool',
    description: `Kit Parafusadeira Doméstica com maleta Leve Portátil USB Recarregável. Ideal para trabalhos domésticos e manutenções simples.

**Características Técnicas:**
• Voltagem: USB recarregável (5V)
• Bateria: Li-ion integrada
• Autonomia: Até 2 horas de uso contínuo
• Torque: Ajustável
• Velocidade: Variável
• Chuck: 6.35mm
• Peso: 0.8kg
• Tipo: Portátil e leve
• Inclui: Maleta organizadora, bits variados, cabo USB

**Conteúdo do Kit:**
1 Parafusadeira portátil
1 Maleta organizadora
20 bits variados (phillips, fenda, torx, hexagonal)
1 Cabo USB para recarga
1 Manual de instruções

**Aplicações:**
Montagem de móveis, reparos domésticos, trabalhos em madeira, instalações simples

**Garantia:**
1 ano`,
    creatorVideos: [
      {
        id: 'cv1',
        videoUrl: videoParafusadeira1,
        creatorName: 'Família Liu',
        creatorInitials: 'FL',
        title: 'vai ser rápido...',
      },
      {
        id: 'cv2',
        videoUrl: videoParafusadeira2,
        creatorName: 'E-commerce BR',
        creatorInitials: 'EB',
        title: 'Kit parafusadeira com maleta!',
      },
    ] as CreatorVideo[],
    reviews: [
      {
        id: 'r33',
        userName: 'Paulo Henrique',
        userInitials: 'PH',
        rating: 5,
        text: 'Excelente parafusadeira! Leve, potente e muito prática. A maleta organizadora é um diferencial. Recomendo muito!',
        date: '2024-02-10',
      },
      {
        id: 'r34',
        userName: 'Roberto Alves',
        userInitials: 'RA',
        rating: 4,
        text: 'Muito boa para trabalhos domésticos. Bateria dura bastante e os bits são de qualidade. Vale a pena!',
        date: '2024-02-08',
      },
    ] as ProductReview[],
  },
  {
    id: '28',
    name: 'Kit Barbeador e Aparador de Pelos Cuidados Masculinos',
    price: 9.90,
    originalPrice: 29.99,
    image: kitBarbeadorAparador,
    rating: 4.8,
    soldCount: 8750,
    viewCount: 125000,
    likesCount: 12450,
    isHotDeal: true,
    freeShipping: true,
    category: 'Saúde',
    brand: 'GroomPro',
    description: `Kit completo de cuidados masculinos com barbeador elétrico e aparador de pelos. Tudo que você precisa para manter a barba e pelos sempre impecáveis.

**Características Técnicas:**
• Barbeador elétrico recarregável
• Aparador de pelos com regulador de altura (0.5mm a 10mm)
• Lâminas de aço inoxidável de alta qualidade
• Sistema de corte à prova d'água (IPX7)
• Bateria de lítio com autonomia de 90 minutos
• Carregamento rápido via USB-C (2 horas)
• Design ergonômico e antiderrapante
• Indicador de bateria LED
• Função de bloqueio de segurança
• Limpeza fácil e rápida

**Conteúdo do Kit:**
1 Barbeador elétrico recarregável
1 Aparador de pelos com regulador
3 Pentes de ajuste (3mm, 6mm, 9mm)
1 Escova de limpeza
1 Cabo USB-C para recarga
1 Manual de instruções
1 Estojo protetor

**Aplicações:**
Barba, bigode, pelos corporais, cabelo, pelos nasais

**Garantia:**
2 anos de garantia do fabricante`,
    creatorVideos: [
      {
        id: 'cv3',
        videoUrl: videoBarbeador1,
        creatorName: 'Estilo Masculino',
        creatorInitials: 'EM',
        title: 'Kit completo de cuidados!',
      },
      {
        id: 'cv4',
        videoUrl: videoBarbeador2,
        creatorName: 'Beauty Reviews',
        creatorInitials: 'BR',
        title: 'Testando o barbeador elétrico',
      },
      {
        id: 'cv5',
        videoUrl: videoBarbeador3,
        creatorName: 'Tech Lifestyle',
        creatorInitials: 'TL',
        title: 'Unboxing do kit barbeador',
      },
      {
        id: 'cv6',
        videoUrl: videoBarbeador4,
        creatorName: 'Grooming Pro',
        creatorInitials: 'GP',
        title: 'Como usar o aparador',
      },
      {
        id: 'cv7',
        videoUrl: videoBarbeador5,
        creatorName: 'Homem Moderno',
        creatorInitials: 'HM',
        title: 'Review completo do kit',
      },
      {
        id: 'cv8',
        videoUrl: videoBarbeador6,
        creatorName: 'Dicas Masculinas',
        creatorInitials: 'DM',
        title: 'Melhor custo-benefício!',
      },
    ] as CreatorVideo[],
    reviews: [
      {
        id: 'r35',
        userName: 'Carlos Eduardo',
        userInitials: 'CE',
        rating: 5,
        itemVariant: 'Kit Completo',
        text: 'Excelente kit! O barbeador é muito potente e o aparador funciona perfeitamente. A bateria dura bastante e a qualidade das lâminas é superior. Recomendo muito!',
        date: '2024-02-15',
      },
      {
        id: 'r36',
        userName: 'Felipe Santos',
        userInitials: 'FS',
        rating: 5,
        itemVariant: 'Kit Completo',
        text: 'Top demais! Pelo preço que paguei, não esperava essa qualidade. O barbeador corta bem rente, o aparador tem vários ajustes e a bateria dura bastante. Vale muito a pena! Comprei pra testar e acabei comprando mais um pra dar de presente pro meu pai. Ele também curtiu muito. A entrega foi rápida e o produto chegou bem embalado. Recomendo!',
        date: '2024-02-12',
      },
      {
        id: 'r37',
        userName: 'Rafael Oliveira',
        userInitials: 'RO',
        rating: 4,
        itemVariant: 'Kit Completo',
        text: 'Bom produto. Funciona bem, só achei que poderia ser mais silencioso.',
        date: '2024-02-10',
      },
      {
        id: 'r38',
        userName: 'Lucas Martins',
        userInitials: 'LM',
        rating: 5,
        itemVariant: 'Kit Completo',
        text: 'Kit perfeito! Uso todo dia e tô muito satisfeito. As lâminas são boas, bateria dura bastante e o design é legal. Super recomendo! Melhor custo-benefício que já vi. Já mostrei pros meus amigos e vários já compraram também. A qualidade é muito boa pelo preço. Vale cada centavo!',
        date: '2024-02-08',
      },
    ] as ProductReview[],
  },
  
  // 🧪 PRODUTO DE TESTE - R$ 3,99 com frete grátis
  {
    id: 'TEST-001',
    name: '🧪 Produto Teste - Frete Grátis',
    price: 3.99,
    originalPrice: 9.90,
    image: productTest,
    rating: 5.0,
    soldCount: 0,
    viewCount: 0,
    likesCount: 0,
    isHotDeal: true,
    isNewCustomerDeal: true,
    freeShipping: true, // ✅ Frete grátis sempre, independente do valor
    isHidden: true, // ✅ Oculto das listagens públicas (só acessível por link direto)
    category: 'Acessórios',
    brand: 'Teste',
    description: `Produto de teste para validar o fluxo completo de pagamento PIX.

**Características:**
• Preço: R$ 3,99
• Frete: Grátis (sempre)
• Ideal para: Testar pagamento PIX completo

**Uso:**
Este produto foi criado especificamente para testes de pagamento. Use para validar todo o fluxo desde a compra até a confirmação do pagamento.`,
    reviews: [
      {
        id: 'r-test-1',
        userName: 'Sistema',
        userInitials: 'SYS',
        rating: 5,
        text: 'Produto criado para testes de pagamento PIX.',
        date: '2024-01-01',
      },
    ] as ProductReview[],
  },
];
