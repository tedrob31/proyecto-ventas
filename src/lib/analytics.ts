import { Sale, Product } from '@/store/useStore';

// Estacionalidades simuladas para proyecciones
const SEASONAL_FACTORS: Record<number, number> = {
  0: 1.0, // Enero
  1: 0.9, // Febrero
  2: 1.1, // Marzo
  3: 1.2, // Abril
  4: 1.5, // Mayo (Día de la Madre)
  5: 1.1, // Junio
  6: 1.4, // Julio (Fiestas Patrias)
  7: 1.0, // Agosto
  8: 1.0, // Septiembre
  9: 1.1, // Octubre
  10: 1.2, // Noviembre
  11: 1.8, // Diciembre (Navidad)
};

export interface MonthlyStats {
  ingresos: number;
  costos: number;
  gananciaNeta: number;
  prendasVendidas: number;
  ordenes: number;
}

export function getMonthStats(sales: Sale[], targetMonth: number, targetYear: number): MonthlyStats {
  const monthSales = sales.filter(s => {
    const d = new Date(s.fecha_venta);
    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  return monthSales.reduce(
    (acc, s) => {
      acc.ingresos += s.total;
      acc.ordenes += 1;
      
      let saleCost = 0;
      let prendas = 0;
      s.detalles.forEach(d => {
        saleCost += (d.costo_aplicado * d.cantidad);
        prendas += d.cantidad;
      });

      acc.costos += saleCost;
      acc.gananciaNeta += (s.total - saleCost);
      acc.prendasVendidas += prendas;
      return acc;
    },
    { ingresos: 0, costos: 0, gananciaNeta: 0, prendasVendidas: 0, ordenes: 0 }
  );
}

export interface TopProduct {
  productoId: string;
  nombre: string;
  cantidadVendida: number;
  ingresosGenerados: number;
  gananciaGenerada: number;
}

export function getTopProducts(sales: Sale[], products: Product[], top: number = 5): TopProduct[] {
  const productMap: Record<string, TopProduct> = {};

  sales.forEach(s => {
    s.detalles.forEach(d => {
      if (!productMap[d.producto_id]) {
        const prod = products.find(p => p.id === d.producto_id);
        productMap[d.producto_id] = {
          productoId: d.producto_id,
          nombre: prod ? prod.nombre : 'Producto Desconocido',
          cantidadVendida: 0,
          ingresosGenerados: 0,
          gananciaGenerada: 0
        };
      }
      productMap[d.producto_id].cantidadVendida += d.cantidad;
      const ingreso = d.precio_aplicado * d.cantidad;
      const costo = d.costo_aplicado * d.cantidad;
      productMap[d.producto_id].ingresosGenerados += ingreso;
      productMap[d.producto_id].gananciaGenerada += (ingreso - costo);
    });
  });

  return Object.values(productMap)
    .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
    .slice(0, top);
}

export function calculateForecast(currentMonthStats: MonthlyStats, targetMonth: number): { estimatedTotal: number; multiplier: number } {
  const now = new Date();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();
  const currentDay = now.getDate() || 1;

  // Ritmo diario del mes actual
  const dailyPace = currentMonthStats.ingresos / currentDay;

  // Proyección cruda para cierre de este mes
  const rawMonthForecast = dailyPace * daysInMonth;

  // Multiplicador estacional para el mes objetivo
  const targetFactor = SEASONAL_FACTORS[targetMonth] || 1.0;
  const currentFactor = SEASONAL_FACTORS[currentMonth] || 1.0;

  // Ajuste
  const adjustedForecast = rawMonthForecast * (targetFactor / currentFactor);

  return {
    estimatedTotal: adjustedForecast,
    multiplier: targetFactor
  };
}

export interface AsesoraBreakdown {
  name: string;
  value: number;
}

export function getAsesorasBreakdown(sales: Sale[], targetMonth: number, targetYear: number): AsesoraBreakdown[] {
  const monthSales = sales.filter(s => {
    const d = new Date(s.fecha_venta);
    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  const map: Record<string, number> = {};
  monthSales.forEach(s => {
    if (!map[s.asesora_nombre]) map[s.asesora_nombre] = 0;
    map[s.asesora_nombre] += s.total;
  });

  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export interface YOYData {
  monthName: string;
  year1: number; // e.g. 2025
  year2: number; // e.g. 2026
}

export function getYearOverYear(sales: Sale[], y1: number, y2: number): YOYData[] {
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const data: YOYData[] = [];
  
  for (let m = 0; m < 12; m++) {
    const stats1 = getMonthStats(sales, m, y1);
    const stats2 = getMonthStats(sales, m, y2);
    data.push({
      monthName: monthNames[m],
      year1: stats1.ingresos,
      year2: stats2.ingresos
    });
  }
  return data;
}

export interface HistoricalRow {
  monthName: string;
  year: number;
  ingresos: number;
  gananciaNeta: number;
  crecimiento: number;
}

export function getHistoricalTable(sales: Sale[], monthsLimit: number = 12): HistoricalRow[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  const rows: HistoricalRow[] = [];
  let prevIngresos = 0;

  // Empezar desde el límite hacia atrás (ej. 12 meses atrás hasta el actual)
  // Pero calculamos en orden cronológico para sacar el crecimiento respecto al mes anterior.
  for (let i = monthsLimit; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    
    const stats = getMonthStats(sales, m, y);
    let crecimiento = 0;
    if (prevIngresos > 0) {
      crecimiento = ((stats.ingresos - prevIngresos) / prevIngresos) * 100;
    } else if (stats.ingresos > 0) {
      crecimiento = 100;
    }
    
    if (i < monthsLimit) { // Ignorar el mes más lejano que solo se usó para crecimiento inicial
      rows.unshift({
        monthName: monthNames[m],
        year: y,
        ingresos: stats.ingresos,
        gananciaNeta: stats.gananciaNeta,
        crecimiento
      });
    }
    prevIngresos = stats.ingresos;
  }
  
  return rows;
}

export function getInsights(sales: Sale[]): string[] {
  if (sales.length === 0) return ["No hay suficientes datos para generar insights."];
  
  const now = new Date();
  const historical = getHistoricalTable(sales, 24); // Mirar hasta 2 años
  
  if (historical.length < 2) return ["Necesitamos al menos 2 meses de datos para encontrar patrones."];
  
  const insights: string[] = [];
  
  // 1. Mejor mes histórico
  let bestMonth = historical[0];
  historical.forEach(h => {
    if (h.ingresos > bestMonth.ingresos) bestMonth = h;
  });
  
  if (bestMonth.ingresos > 0) {
    insights.push(`🔥 Tu récord de ventas fue en ${bestMonth.monthName} ${bestMonth.year} con S/${bestMonth.ingresos.toFixed(2)}.`);
  }

  // 2. Tendencia del mes actual
  const current = historical[0]; // El 0 es el más reciente gracias al unshift
  if (current.crecimiento > 0) {
    insights.push(`📈 Excelente ritmo. Tienes un crecimiento del ${current.crecimiento.toFixed(1)}% este mes en comparación al mes anterior.`);
  } else if (current.crecimiento < 0) {
    insights.push(`⚠️ El mes actual está un ${Math.abs(current.crecimiento).toFixed(1)}% por debajo del cierre del mes anterior.`);
  }

  // 3. Rentabilidad promedio (Ganancia vs Ingresos)
  const avgMargin = (current.gananciaNeta / (current.ingresos || 1)) * 100;
  if (avgMargin > 0) {
    insights.push(`💰 Tu margen de ganancia líquida actual oscila alrededor del ${avgMargin.toFixed(1)}% de lo que facturas.`);
  }

  return insights;
}
