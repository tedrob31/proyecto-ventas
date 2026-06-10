import { Product } from '@/store/useStore';

export interface ParsedItem {
  rawLine: string;
  matchedProduct?: Product;
  quantity: number;
  isLiquidacion: boolean;
  priceApplied: number;
  costoAplicado: number; // NUEVO
  subtotal: number;
  error?: string;
}

export function parseOrderText(text: string, products: Product[]): ParsedItem[] {
  if (!text.trim()) return [];

  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  return lines.map(line => {
    const rawLine = line.trim();
    const upperLine = rawLine.toUpperCase();
    
    // 1. Detectar si es liquidación o remate
    const isLiquidacion = upperLine.includes('LIQUIDACION') || upperLine.includes('REMATE');
    
    // 2. Extraer el código de la variante (Letras opcionales seguidas de números)
    // Ej: "PCD100" -> prefix: "PCD", suffix: "100" (3 dígitos)
    // Ej: "4000" -> prefix: "", suffix: "4000" (4 dígitos)
    const codeMatch = upperLine.match(/([A-Z]*)\s*-?\s*(\d+)/);
    
    let matchedProduct: Product | undefined = undefined;
    let error: string | undefined = undefined;
    
    if (codeMatch) {
      const prefix = codeMatch[1];
      const suffix = codeMatch[2];
      
      // Buscar en el catálogo: 
      // Coincidencia exacta de letra (codigo) Y cantidad de dígitos del número (numero)
      matchedProduct = products.find(p => (p.codigo || '').toUpperCase() === prefix && p.numero === suffix.length);
      
      if (!matchedProduct) {
        error = `Código ${prefix}${suffix} no válido (Prefijo "${prefix}" con ${suffix.length} dígitos no hallado).`;
      }
    } else {
      error = "No se detectó un código válido.";
    }

    // 3. La cantidad siempre es 1 (cada línea es 1 producto individual, aunque sea una variante)
    const quantity = 1;

    // 4. Cálculos y validaciones (sin validar stock)
    let priceApplied = 0;
    let costoAplicado = 0;
    let subtotal = 0;

    if (matchedProduct) {
      priceApplied = isLiquidacion ? matchedProduct.precio_liquidacion : matchedProduct.precio;
      costoAplicado = matchedProduct.precio_costo || 0;
      subtotal = priceApplied * quantity;
    }

    return {
      rawLine,
      matchedProduct,
      quantity,
      isLiquidacion,
      priceApplied,
      costoAplicado,
      subtotal,
      error
    };
  });
}
