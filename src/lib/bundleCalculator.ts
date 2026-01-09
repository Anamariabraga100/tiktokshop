/**
 * Calculadora de Bundle - Sistema de pacotes com preços fixos
 * 
 * Regras:
 * - Bundle 2 unidades: R$ 32,90 (economia R$ 4,90)
 * - Bundle 3 unidades: R$ 44,90 (economia R$ 11,80)
 * 
 * Estrutura genérica para funcionar com qualquer produto
 */

export interface BundleOffer {
  quantity: number; // Quantidade total no bundle (2, 3, etc)
  totalPrice: number; // Preço total do bundle
  savings: number; // Economia total comparada ao preço individual
  label: string; // Texto da oferta (ex: "Leve 2 por R$32,90")
  helperText: string; // Texto auxiliar (ex: "Economize R$ 4,90 no total")
  buttonText: string; // Texto do botão CTA
}

export interface BundleConfig {
  price2Units: number; // Preço fixo para 2 unidades
  price3Units: number; // Preço fixo para 3 unidades
  savings2Units: number; // Economia para 2 unidades
  savings3Units: number; // Economia para 3 unidades
}

const DEFAULT_CONFIG: BundleConfig = {
  price2Units: 32.90, // Preço fixo para 2 unidades
  price3Units: 44.90, // Preço fixo para 3 unidades
  savings2Units: 4.90, // Economia: (18.90 * 2) - 32.90 = 4.90
  savings3Units: 11.80, // Economia: (18.90 * 3) - 44.90 = 11.80
};

/**
 * Calcula as ofertas de bundle disponíveis para um produto
 * @param unitPrice Preço unitário do produto
 * @param currentQuantity Quantidade atual no carrinho
 * @param config Configuração de preços fixos (opcional)
 * @returns Array com as ofertas de bundle disponíveis
 */
export function calculateBundleOffers(
  unitPrice: number,
  currentQuantity: number = 1,
  config: Partial<BundleConfig> = {}
): BundleOffer[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const offers: BundleOffer[] = [];

  // Bundle de 2 unidades
  const price2Units = finalConfig.price2Units;
  const savings2 = finalConfig.savings2Units;

  offers.push({
    quantity: 2,
    totalPrice: price2Units,
    savings: savings2,
    label: `Leve 2 unidades por R$ ${price2Units.toFixed(2).replace('.', ',')}`,
    helperText: `Economize R$ ${savings2.toFixed(2).replace('.', ',')}`,
    buttonText: `Adicionar +1 unidade (ficar com 2)`,
  });

  // Bundle de 3 unidades
  const price3Units = finalConfig.price3Units;
  const savings3 = finalConfig.savings3Units;

  offers.push({
    quantity: 3,
    totalPrice: price3Units,
    savings: savings3,
    label: `Leve 3 unidades por R$ ${price3Units.toFixed(2).replace('.', ',')}`,
    helperText: `Economize R$ ${savings3.toFixed(2).replace('.', ',')} — melhor custo-benefício`,
    buttonText: `Adicionar +2 unidades (ficar com 3)`,
  });

  return offers;
}

/**
 * Calcula o preço total considerando preços fixos de bundle
 * @param unitPrice Preço unitário
 * @param quantity Quantidade total
 * @param config Configuração de preços fixos
 * @returns Preço total com bundle aplicado
 */
export function calculateBundlePrice(
  unitPrice: number,
  quantity: number,
  config: Partial<BundleConfig> = {}
): number {
  if (quantity <= 0) return 0;
  if (quantity === 1) return unitPrice;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Se tiver exatamente 2 unidades, usar preço fixo do bundle
  if (quantity === 2) {
    return finalConfig.price2Units;
  }
  
  // Se tiver exatamente 3 unidades, usar preço fixo do bundle
  if (quantity === 3) {
    return finalConfig.price3Units;
  }
  
  // Se tiver mais de 3 unidades, aplicar bundles progressivamente
  if (quantity > 3) {
    // Calcular quantos bundles de 3 unidades completos + unidades restantes
    const bundlesOf3 = Math.floor(quantity / 3);
    const remainingUnits = quantity % 3;
    
    // Preço dos bundles de 3
    const bundle3Price = finalConfig.price3Units;
    
    // Preço das unidades restantes
    let remainingPrice = 0;
    if (remainingUnits === 1) {
      remainingPrice = unitPrice; // 1 unidade = preço normal
    } else if (remainingUnits === 2) {
      // 2 unidades = usar preço fixo do bundle de 2
      remainingPrice = finalConfig.price2Units;
    }
    
    return (bundle3Price * bundlesOf3) + remainingPrice;
  }

  return unitPrice * quantity;
}

/**
 * Retorna a melhor oferta de bundle baseada na quantidade atual
 * @param unitPrice Preço unitário
 * @param currentQuantity Quantidade atual
 * @param config Configuração
 * @returns A melhor oferta ou null se não houver
 */
export function getBestBundleOffer(
  unitPrice: number,
  currentQuantity: number,
  config: Partial<BundleConfig> = {}
): BundleOffer | null {
  const offers = calculateBundleOffers(unitPrice, currentQuantity, config);
  
  // Se já tiver 3 ou mais, não mostrar ofertas
  if (currentQuantity >= 3) {
    return null;
  }
  
  // Se tiver 1, mostrar oferta de 2
  if (currentQuantity === 1) {
    return offers.find(o => o.quantity === 2) || null;
  }
  
  // Se tiver 2, mostrar oferta de 3
  if (currentQuantity === 2) {
    return offers.find(o => o.quantity === 3) || null;
  }
  
  return null;
}

/**
 * Retorna todas as ofertas de bundle disponíveis (para exibição simultânea)
 * @param unitPrice Preço unitário
 * @param config Configuração
 * @returns Array com todas as ofertas disponíveis (2 e 3 unidades)
 */
export function getAllBundleOffers(
  unitPrice: number,
  config: Partial<BundleConfig> = {}
): BundleOffer[] {
  return calculateBundleOffers(unitPrice, 1, config);
}

/**
 * Calcula quanto o usuário economizaria aumentando para uma quantidade específica
 * @param unitPrice Preço unitário
 * @param currentQuantity Quantidade atual
 * @param targetQuantity Quantidade desejada
 * @param config Configuração
 * @returns Economia potencial
 */
export function calculatePotentialSavings(
  unitPrice: number,
  currentQuantity: number,
  targetQuantity: number,
  config: Partial<BundleConfig> = {}
): number {
  const currentPrice = calculateBundlePrice(unitPrice, currentQuantity, config);
  const targetPrice = calculateBundlePrice(unitPrice, targetQuantity, config);
  // Economia = (preço atual sem bundle) - (preço com bundle)
  const currentRegularPrice = unitPrice * currentQuantity;
  const targetRegularPrice = unitPrice * targetQuantity;
  const regularPriceDifference = targetRegularPrice - currentRegularPrice;
  return regularPriceDifference - (targetPrice - currentPrice);
}

