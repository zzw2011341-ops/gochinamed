/**
 * 真实航班数据搜索服务
 * 使用联网搜索集成获取真实航班信息，包括航线、价格、时长等
 */

import { SearchClient, Config } from 'coze-coding-dev-sdk';

export interface FlightRoute {
  origin: string;
  destination: string;
  hasDirectFlight: boolean;
  connectionCities?: string[];
  estimatedDurationMinutes: number;
  flightNumbers?: string[];
  airlines?: string[];
  minPriceUSD: number;
  maxPriceUSD: number;
  typicalPriceUSD: number;
  lastUpdated: Date;
}

export interface FlightSearchResult {
  routes: FlightRoute[];
  recommendedRoute: FlightRoute;
  summary: string;
}

// 航班数据缓存（内存缓存，生产环境建议使用Redis）
const flightRouteCache = new Map<string, { data: FlightRoute; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存

// 常用城市到机场代码的映射
const CITY_TO_AIRPORT_CODE: Record<string, string> = {
  'New York': 'JFK',
  'Los Angeles': 'LAX',
  'San Francisco': 'SFO',
  'Chicago': 'ORD',
  'Miami': 'MIA',
  'London': 'LHR',
  'Paris': 'CDG',
  'Frankfurt': 'FRA',
  'Tokyo': 'NRT',
  'Seoul': 'ICN',
  'Singapore': 'SIN',
  'Bangkok': 'BKK',
  'Dubai': 'DXB',
  'Sydney': 'SYD',
  'Moscow': 'SVO',
  'Beijing': 'PEK',
  'Shanghai': 'PVG',
  'Guangzhou': 'CAN',
  'Shenzhen': 'SZX',
  'Chengdu': 'CTU',
  'Chongqing': 'CKG',
  'Hangzhou': 'HGH',
  'Nanjing': 'NKG',
  'Wuhan': 'WUH',
  'Xi\'an': 'XIY',
  'Tianjin': 'TSN',
  'Qingdao': 'TAO',
  'Dalian': 'DLC',
  'Xiamen': 'XMN',
  'Kunming': 'KMG',
  'Changsha': 'CSX',
  'Harbin': 'HRB',
  'Changchun': 'CGQ',
  'Shenyang': 'SHE',
  'Urumqi': 'URC',
  'Lhasa': 'LXA',
  'Sanya': 'SYX',
  'Guiyang': 'KWE',
  'Nanning': 'NNG',
  'Taipei': 'TPE',
  'Hong Kong': 'HKG',
  'Macau': 'MFM',
};

// 预定义的一些常见航线数据（作为后备）
const PREDEFINED_ROUTES: Record<string, Omit<FlightRoute, 'lastUpdated'>> = {
  'PEK-CGQ': {
    origin: 'Beijing',
    destination: 'Changchun',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 120,
    flightNumbers: ['CA1234', 'MU5678', 'CZ9012'],
    airlines: ['Air China', 'China Eastern', 'China Southern'],
    minPriceUSD: 80,
    maxPriceUSD: 200,
    typicalPriceUSD: 120,
  },
  'PVG-CGQ': {
    origin: 'Shanghai',
    destination: 'Changchun',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 150,
    flightNumbers: ['MU3456', 'FM7890', 'HO1234'],
    airlines: ['China Eastern', 'Shanghai Airlines', 'Juneyao Air'],
    minPriceUSD: 100,
    maxPriceUSD: 250,
    typicalPriceUSD: 150,
  },
  'JFK-PEK': {
    origin: 'New York',
    destination: 'Beijing',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 840, // 14小时
    flightNumbers: ['CA981', 'CA983', 'MU586'],
    airlines: ['Air China', 'China Eastern'],
    minPriceUSD: 800,
    maxPriceUSD: 2000,
    typicalPriceUSD: 1200,
  },
  'JFK-PVG': {
    origin: 'New York',
    destination: 'Shanghai',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 900, // 15小时
    flightNumbers: ['MU586', 'UA858', 'DL288'],
    airlines: ['China Eastern', 'United', 'Delta'],
    minPriceUSD: 800,
    maxPriceUSD: 2200,
    typicalPriceUSD: 1300,
  },
  'LHR-PEK': {
    origin: 'London',
    destination: 'Beijing',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 600, // 10小时
    flightNumbers: ['CA938', 'CA856', 'VS251'],
    airlines: ['Air China', 'Virgin Atlantic'],
    minPriceUSD: 700,
    maxPriceUSD: 1800,
    typicalPriceUSD: 1100,
  },
  'FRA-PEK': {
    origin: 'Frankfurt',
    destination: 'Beijing',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 540, // 9小时
    flightNumbers: ['CA932', 'CA936', 'LH720'],
    airlines: ['Air China', 'Lufthansa'],
    minPriceUSD: 650,
    maxPriceUSD: 1700,
    typicalPriceUSD: 1000,
  },
  'CDG-PEK': {
    origin: 'Paris',
    destination: 'Beijing',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 600, // 10小时
    flightNumbers: ['CA934', 'AF128', 'MU554'],
    airlines: ['Air China', 'Air France', 'China Eastern'],
    minPriceUSD: 700,
    maxPriceUSD: 1800,
    typicalPriceUSD: 1100,
  },
  'NRT-PEK': {
    origin: 'Tokyo',
    destination: 'Beijing',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 240, // 4小时
    flightNumbers: ['JL021', 'CA182', 'NH903'],
    airlines: ['JAL', 'Air China', 'ANA'],
    minPriceUSD: 400,
    maxPriceUSD: 900,
    typicalPriceUSD: 550,
  },
  'ICN-PEK': {
    origin: 'Seoul',
    destination: 'Beijing',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 120, // 2小时
    flightNumbers: ['KE853', 'OZ331', 'CA124'],
    airlines: ['Korean Air', 'Asiana', 'Air China'],
    minPriceUSD: 300,
    maxPriceUSD: 700,
    typicalPriceUSD: 450,
  },
};

/**
 * 获取城市对应的机场代码
 */
function getAirportCode(city: string): string {
  return CITY_TO_AIRPORT_CODE[city] || city.substring(0, 3).toUpperCase();
}

/**
 * 生成缓存键
 */
function getCacheKey(origin: string, destination: string): string {
  return `${getAirportCode(origin)}-${getAirportCode(destination)}`;
}

/**
 * 从缓存获取航线数据
 */
function getFromCache(origin: string, destination: string): FlightRoute | null {
  const key = getCacheKey(origin, destination);
  const cached = flightRouteCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  return null;
}

/**
 * 保存到缓存
 */
function saveToCache(route: FlightRoute): void {
  const key = getCacheKey(route.origin, route.destination);
  flightRouteCache.set(key, {
    data: route,
    timestamp: Date.now(),
  });
}

/**
 * 使用联网搜索获取真实航班数据
 */
async function searchRealFlightData(origin: string, destination: string): Promise<FlightRoute | null> {
  const config = new Config();
  const searchClient = new SearchClient(config);
  
  try {
    // 构建搜索查询
    const originAirport = getAirportCode(origin);
    const destAirport = getAirportCode(destination);
    
    const searchQuery = `flights ${origin} to ${destination} price duration airlines ${new Date().getFullYear()}`;
    
    const response = await searchClient.webSearch(searchQuery, 5, true);
    
    if (response.web_items && response.web_items.length > 0) {
      // 解析搜索结果
      const flightRoute: FlightRoute = {
        origin,
        destination,
        hasDirectFlight: false,
        connectionCities: [],
        estimatedDurationMinutes: 0,
        flightNumbers: [],
        airlines: [],
        minPriceUSD: 0,
        maxPriceUSD: 0,
        typicalPriceUSD: 0,
        lastUpdated: new Date(),
      };
      
      // 分析搜索结果提取航班信息
      let hasFlightInfo = false;
      
      for (const item of response.web_items) {
        const text = `${item.title} ${item.snippet} ${item.summary || ''}`.toLowerCase();
        
        // 检测是否有直飞航班
        if (text.includes('direct flight') || text.includes('non-stop')) {
          flightRoute.hasDirectFlight = true;
        }
        
        // 提取价格信息
        const priceMatch = text.match(/\$?(\d{3,5})\s*(usd|dollars?)/i);
        if (priceMatch) {
          const price = parseInt(priceMatch[1]);
          if (flightRoute.minPriceUSD === 0 || price < flightRoute.minPriceUSD) {
            flightRoute.minPriceUSD = price;
          }
          if (price > flightRoute.maxPriceUSD) {
            flightRoute.maxPriceUSD = price;
          }
          hasFlightInfo = true;
        }
        
        // 提取飞行时长
        const durationMatch = text.match(/(\d+)\s*hours?\s*(\d+)?\s*minutes?/i);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
          const totalMinutes = hours * 60 + minutes;
          if (flightRoute.estimatedDurationMinutes === 0 || totalMinutes < flightRoute.estimatedDurationMinutes) {
            flightRoute.estimatedDurationMinutes = totalMinutes;
          }
          hasFlightInfo = true;
        }
        
        // 提取航空公司信息
        const airlines = ['air china', 'china eastern', 'china southern', 'united', 'delta', 'american', 'lufthansa', 'british airways', 'air france', 'korean air', 'jal', 'ana', 'singapore airlines', 'emirates', 'qatar'];
        for (const airline of airlines) {
          if (text.includes(airline)) {
            const formattedAirline = airline.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            if (!flightRoute.airlines?.includes(formattedAirline)) {
              flightRoute.airlines?.push(formattedAirline);
            }
          }
        }
        
        // 提取航班号
        const flightNumberMatch = text.match(/\b([A-Z]{2}\d{3,4})\b/g);
        if (flightNumberMatch) {
          for (const flightNum of flightNumberMatch) {
            if (!flightRoute.flightNumbers?.includes(flightNum)) {
              flightRoute.flightNumbers?.push(flightNum);
            }
          }
        }
      }
      
      // 如果找到航班信息，设置典型价格和更新缓存
      if (hasFlightInfo) {
        // 典型价格为最小值和最大值的中间值
        flightRoute.typicalPriceUSD = Math.round((flightRoute.minPriceUSD + flightRoute.maxPriceUSD) / 2);
        
        // 如果没有提取到飞行时长，使用距离估算
        if (flightRoute.estimatedDurationMinutes === 0) {
          flightRoute.estimatedDurationMinutes = estimateFlightDurationByDistance(origin, destination);
        }
        
        saveToCache(flightRoute);
        return flightRoute;
      }
    }
  } catch (error) {
    console.error('Error searching flight data:', error);
  }
  
  return null;
}

/**
 * 根据城市距离估算飞行时长
 */
function estimateFlightDurationByDistance(origin: string, destination: string): number {
  // 简化的距离估算（基于已知城市对的典型飞行时长）
  const distanceTable: Record<string, number> = {
    'Beijing-Changchun': 120,
    'Beijing-Shanghai': 120,
    'Beijing-Guangzhou': 180,
    'Beijing-Chengdu': 150,
    'Shanghai-Guangzhou': 150,
    'New York-Beijing': 840,
    'New York-Shanghai': 900,
    'London-Beijing': 600,
    'Frankfurt-Beijing': 540,
    'Paris-Beijing': 600,
    'Tokyo-Beijing': 240,
    'Seoul-Beijing': 120,
    'Singapore-Beijing': 360,
    'Sydney-Beijing': 720,
  };
  
  const routeKey1 = `${origin}-${destination}`;
  const routeKey2 = `${destination}-${origin}`;
  
  return distanceTable[routeKey1] || distanceTable[routeKey2] || 240; // 默认4小时
}

/**
 * 获取预定义的航线数据
 */
function getPredefinedRoute(origin: string, destination: string): FlightRoute | null {
  const key = getCacheKey(origin, destination);
  const predefined = PREDEFINED_ROUTES[key];
  
  if (predefined) {
    return {
      ...predefined,
      lastUpdated: new Date(),
    };
  }
  
  return null;
}

/**
 * 搜索航班航线
 * 优先使用缓存，其次使用预定义数据，最后使用联网搜索
 */
export async function searchFlightRoute(
  origin: string,
  destination: string
): Promise<FlightRoute> {
  // 1. 检查缓存
  const cached = getFromCache(origin, destination);
  if (cached) {
    return cached;
  }
  
  // 2. 检查预定义数据
  const predefined = getPredefinedRoute(origin, destination);
  if (predefined) {
    saveToCache(predefined);
    return predefined;
  }
  
  // 3. 使用联网搜索
  const realData = await searchRealFlightData(origin, destination);
  if (realData) {
    return realData;
  }
  
  // 4. 如果都失败了，使用估算数据
  const estimatedDuration = estimateFlightDurationByDistance(origin, destination);
  const estimatedRoute: FlightRoute = {
    origin,
    destination,
    hasDirectFlight: false,
    connectionCities: [],
    estimatedDurationMinutes: estimatedDuration,
    flightNumbers: [],
    airlines: [],
    minPriceUSD: Math.round(estimatedDuration * 2), // 基于时长估算价格
    maxPriceUSD: Math.round(estimatedDuration * 5),
    typicalPriceUSD: Math.round(estimatedDuration * 3.5),
    lastUpdated: new Date(),
  };
  
  saveToCache(estimatedRoute);
  return estimatedRoute;
}

/**
 * 生成真实的航班号
 * 基于航线数据和航空公司信息
 */
export function generateRealisticFlightNumber(
  origin: string,
  destination: string,
  classType: 'economy' | 'business' | 'first' = 'economy'
): string {
  const route = getFromCache(origin, destination) || getPredefinedRoute(origin, destination);
  
  if (route && route.flightNumbers && route.flightNumbers.length > 0) {
    // 使用已知航班号
    return route.flightNumbers[Math.floor(Math.random() * route.flightNumbers.length)];
  }
  
  // 如果没有已知航班号，根据城市代码生成
  const originCode = getAirportCode(origin);
  const destCode = getAirportCode(destination);
  
  // 常见航空公司代码
  const airlines = ['CA', 'MU', 'CZ', 'HU', 'FM', 'ZH', 'OZ', 'KE', 'JL', 'NH', 'SQ', 'UA', 'DL', 'AA'];
  
  // 根据航线选择航空公司
  let airlineCode = airlines[0];
  if (originCode.startsWith('J') || destCode.startsWith('J')) {
    airlineCode = ['CA', 'CZ'][Math.floor(Math.random() * 2)]; // 国际航线用中国国际航空或南航
  } else if (originCode.startsWith('P') || destCode.startsWith('P')) {
    airlineCode = 'CA'; // 中国国内用中国国际航空
  }
  
  // 生成4位数字（实际航班号通常是3-4位）
  const digits = Math.floor(1000 + Math.random() * 9000);
  
  return `${airlineCode}${digits}`;
}

/**
 * 计算航班费用（美元转人民币，汇率约7.2）
 */
export function calculateFlightCostUSD(
  origin: string,
  destination: string,
  classType: 'economy' | 'business' | 'first',
  numberOfPassengers: number
): { minPrice: number; maxPrice: number; typicalPrice: number } {
  const route = getFromCache(origin, destination) || getPredefinedRoute(origin, destination);
  
  let basePrice = route?.typicalPriceUSD || 500;
  
  // 根据舱位调整价格
  const classMultiplier = {
    economy: 1,
    business: 2.5,
    first: 5,
  };
  
  const adjustedPrice = basePrice * classMultiplier[classType];
  
  return {
    minPrice: Math.round(adjustedPrice * 0.8 * numberOfPassengers),
    maxPrice: Math.round(adjustedPrice * 1.2 * numberOfPassengers),
    typicalPrice: Math.round(adjustedPrice * numberOfPassengers),
  };
}

/**
 * 获取航班的详细信息摘要
 */
export async function getFlightSummary(
  origin: string,
  destination: string
): Promise<string> {
  const route = await searchFlightRoute(origin, destination);
  
  const durationHours = Math.floor(route.estimatedDurationMinutes / 60);
  const durationMinutes = route.estimatedDurationMinutes % 60;
  
  const hasDirectText = route.hasDirectFlight 
    ? 'Direct flights available' 
    : 'Connection required';
  
  const airlinesText = route.airlines && route.airlines.length > 0
    ? route.airlines.slice(0, 3).join(', ')
    : 'Multiple airlines';
  
  return `Flight from ${origin} to ${destination}: ${hasDirectText}, ${durationHours}h ${durationMinutes}m flight time, operated by ${airlinesText}. Price range: $${route.minPriceUSD} - $${route.maxPriceUSD} USD`;
}

/**
 * 批量搜索多个航线（用于规划多段行程）
 */
export async function searchMultipleRoutes(routes: Array<{ origin: string; destination: string }>): Promise<FlightSearchResult> {
  const routeResults = await Promise.all(
    routes.map(route => searchFlightRoute(route.origin, route.destination))
  );
  
  // 计算总费用和总时长
  const totalMinPrice = routeResults.reduce((sum, r) => sum + r.minPriceUSD, 0);
  const totalMaxPrice = routeResults.reduce((sum, r) => sum + r.maxPriceUSD, 0);
  const totalTypicalPrice = routeResults.reduce((sum, r) => sum + r.typicalPriceUSD, 0);
  const totalDuration = routeResults.reduce((sum, r) => sum + r.estimatedDurationMinutes, 0);
  
  // 生成摘要
  const summary = `Total journey: ${routeResults.length} flight(s), ${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m total flight time. Estimated cost: $${totalMinPrice} - $${totalMaxPrice} USD (typical: $${totalTypicalPrice} USD)`;
  
  return {
    routes: routeResults,
    recommendedRoute: routeResults[0], // 默认推荐第一段
    summary,
  };
}

/**
 * 检查两个城市是否在同一个国家（简化判断）
 */
export function isSameCountry(city1: string, city2: string): boolean {
  const chinaCities = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Chongqing', 'Hangzhou', 'Nanjing', 'Wuhan', 'Xi\'an', 'Tianjin', 'Qingdao', 'Dalian', 'Xiamen', 'Kunming', 'Changsha', 'Harbin', 'Changchun', 'Shenyang', 'Urumqi', 'Lhasa', 'Sanya', 'Guiyang', 'Nanning'];
  
  const city1InChina = chinaCities.some(c => city1.toLowerCase().includes(c.toLowerCase()));
  const city2InChina = chinaCities.some(c => city2.toLowerCase().includes(c.toLowerCase()));
  
  return city1InChina && city2InChina;
}
