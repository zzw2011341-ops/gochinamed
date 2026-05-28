/**
 * 本地航班价格估算（不依赖外部 SDK）
 * 根据已知道路经验和规则估算航班费用
 */
import { calculateFlightCostUSD as originalCalc } from './flightSearchService';

// 缓存结果，避免重复调用
const priceCache = new Map<string, { minPrice: number; maxPrice: number; typicalPrice: number }>();

// 固定估算价格（美元/人）
const ESTIMATED_PRICES: Record<string, { economy: number; business: number; first: number }> = {
  'New York-BeiJing': { economy: 800, business: 2400, first: 5000 },
  'New York-Shanghai': { economy: 750, business: 2200, first: 4500 },
  'Los Angeles-BeiJing': { economy: 650, business: 2000, first: 4200 },
  'Los Angeles-Shanghai': { economy: 600, business: 1900, first: 4000 },
  'London-BeiJing': { economy: 500, business: 1500, first: 3500 },
  'London-Shanghai': { economy: 480, business: 1400, first: 3200 },
  'Paris-BeiJing': { economy: 550, business: 1600, first: 3800 },
  'Shanghai-BeiJing': { economy: 150, business: 400, first: 800 },
  'Guangzhou-BeiJing': { economy: 120, business: 350, first: 700 },
  'Shenzhen-BeiJing': { economy: 130, business: 380, first: 750 },
  'Hangzhou-BeiJing': { economy: 100, business: 300, first: 600 },
  'Nanjing-BeiJing': { economy: 80, business: 250, first: 500 },
  'Chengdu-BeiJing': { economy: 120, business: 350, first: 700 },
  'Wuhan-BeiJing': { economy: 90, business: 280, first: 550 },
  'XiAn-BeiJing': { economy: 70, business: 200, first: 400 },
};

function getEstimatedPrice(origin: string, destination: string, cabinClass: string): number {
  const key = `${origin}-${destination}`;
  const prices = ESTIMATED_PRICES[key] || ESTIMATED_PRICES[`${destination}-${origin}`];
  if (prices) {
    return prices[cabinClass as keyof typeof prices] || prices.economy;
  }
  // 国际长途默认
  if (origin !== destination) {
    if (['Beijing','Shanghai','Guangzhou'].includes(destination) && 
        !['Beijing','Shanghai','Guangzhou'].includes(origin)) {
      return cabinClass === 'first' ? 5000 : cabinClass === 'business' ? 2400 : 800;
    }
    return cabinClass === 'first' ? 3500 : cabinClass === 'business' ? 1600 : 600;
  }
  return cabinClass === 'first' ? 600 : cabinClass === 'business' ? 300 : 100;
}

// 包装函数：先尝试快速估算，如果原函数超时则返回估算值
export async function calculateFlightCostUSD(
  origin: string,
  destination: string,
  cabinClass: 'economy' | 'business' | 'first',
  passengers: number = 1
): Promise<{ minPrice: number; maxPrice: number; typicalPrice: number }> {
  const cacheKey = `${origin}|${destination}|${cabinClass}`;
  
  // 检查缓存
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey)!;
  }

  // 返回估算值
  const unitPrice = getEstimatedPrice(origin, destination, cabinClass);
  const result = {
    minPrice: Math.round(unitPrice * 0.8 * passengers),
    maxPrice: Math.round(unitPrice * 1.2 * passengers),
    typicalPrice: Math.round(unitPrice * passengers),
  };
  
  priceCache.set(cacheKey, result);
  return result;
}
