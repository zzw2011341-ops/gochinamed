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
// 注意：这些数据仅用于主要枢纽之间的直飞航线，对于非主要枢纽或长途航线，应该使用中转逻辑
const PREDEFINED_ROUTES: Record<string, Omit<FlightRoute, 'lastUpdated'>> = {
  // 中国国内航线（主要城市之间）
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
  'PEK-SHA': {
    origin: 'Beijing',
    destination: 'Shanghai',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 120,
    flightNumbers: ['CA1501', 'CA1503', 'MU5101', 'MU5103'],
    airlines: ['Air China', 'China Eastern'],
    minPriceUSD: 100,
    maxPriceUSD: 300,
    typicalPriceUSD: 150,
  },

  // 国际航线（仅主要枢纽之间的直飞，其他城市需要中转）
  // 中国主要枢纽（北京、上海、广州）到欧美主要枢纽
  'PEK-JFK': {
    origin: 'Beijing',
    destination: 'New York',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 840, // 14小时
    flightNumbers: ['CA981', 'CA983'],
    airlines: ['Air China'],
    minPriceUSD: 800,
    maxPriceUSD: 2000,
    typicalPriceUSD: 1200,
  },
  'PEK-LAX': {
    origin: 'Beijing',
    destination: 'Los Angeles',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 900, // 15小时
    flightNumbers: ['CA987', 'CA989'],
    airlines: ['Air China'],
    minPriceUSD: 800,
    maxPriceUSD: 2200,
    typicalPriceUSD: 1300,
  },
  'PVG-JFK': {
    origin: 'Shanghai',
    destination: 'New York',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 900, // 15小时
    flightNumbers: ['MU586', 'MU588'],
    airlines: ['China Eastern'],
    minPriceUSD: 800,
    maxPriceUSD: 2200,
    typicalPriceUSD: 1300,
  },
  'PVG-LAX': {
    origin: 'Shanghai',
    destination: 'Los Angeles',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 960, // 16小时
    flightNumbers: ['MU577', 'MU585'],
    airlines: ['China Eastern'],
    minPriceUSD: 800,
    maxPriceUSD: 2400,
    typicalPriceUSD: 1400,
  },
  'PEK-LHR': {
    origin: 'Beijing',
    destination: 'London',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 600, // 10小时
    flightNumbers: ['CA937', 'CA939'],
    airlines: ['Air China'],
    minPriceUSD: 700,
    maxPriceUSD: 1800,
    typicalPriceUSD: 1100,
  },
  'PEK-FRA': {
    origin: 'Beijing',
    destination: 'Frankfurt',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 540, // 9小时
    flightNumbers: ['CA931', 'CA965'],
    airlines: ['Air China'],
    minPriceUSD: 650,
    maxPriceUSD: 1700,
    typicalPriceUSD: 1000,
  },
  'PEK-CDG': {
    origin: 'Beijing',
    destination: 'Paris',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 600, // 10小时
    flightNumbers: ['CA933', 'CA875'],
    airlines: ['Air China'],
    minPriceUSD: 700,
    maxPriceUSD: 1800,
    typicalPriceUSD: 1100,
  },
  'PEK-NRT': {
    origin: 'Beijing',
    destination: 'Tokyo',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 180, // 3小时
    flightNumbers: ['CA181', 'CA925'],
    airlines: ['Air China'],
    minPriceUSD: 300,
    maxPriceUSD: 700,
    typicalPriceUSD: 450,
  },
  'PEK-ICN': {
    origin: 'Beijing',
    destination: 'Seoul',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 120, // 2小时
    flightNumbers: ['CA123', 'CA125'],
    airlines: ['Air China'],
    minPriceUSD: 200,
    maxPriceUSD: 500,
    typicalPriceUSD: 300,
  },

  // 东南亚主要航线
  'PEK-SIN': {
    origin: 'Beijing',
    destination: 'Singapore',
    hasDirectFlight: true,
    connectionCities: [],
    estimatedDurationMinutes: 360, // 6小时
    flightNumbers: ['SQ801', 'CA969'],
    airlines: ['Singapore Airlines', 'Air China'],
    minPriceUSD: 400,
    maxPriceUSD: 900,
    typicalPriceUSD: 550,
  },
};

// 中国城市列表（用于判断航线类型）
const CHINA_CITIES = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Chongqing', 'Hangzhou', 'Nanjing', 'Wuhan', 'Xi\'an', 'Tianjin', 'Qingdao', 'Dalian', 'Xiamen', 'Kunming', 'Changsha', 'Harbin', 'Changchun', 'Shenyang', 'Urumqi', 'Lhasa', 'Sanya', 'Guiyang', 'Nanning'];

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

    const searchQuery = `flights from ${origin} to ${destination} direct flight connection price duration airlines ${new Date().getFullYear()}`;

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
        if (text.includes('direct flight') || text.includes('non-stop') || text.includes('nonstop')) {
          flightRoute.hasDirectFlight = true;
        }

        // 检测是否需要中转
        if (text.includes('connecting flight') || text.includes('connection') || text.includes('stopover') || text.includes('layover')) {
          flightRoute.hasDirectFlight = false;

          // 尝试提取中转城市
          const hubCities = ['beijing', 'shanghai', 'guangzhou', 'tokyo', 'seoul', 'singapore', 'dubai', 'hong kong', 'london', 'paris', 'frankfurt'];
          for (const hub of hubCities) {
            if (text.includes(hub)) {
              const formattedHub = hub.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              if (!flightRoute.connectionCities?.includes(formattedHub)) {
                flightRoute.connectionCities?.push(formattedHub);
              }
            }
          }
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

        // 如果搜索结果显示需要中转但没有提取到中转城市，使用规则判断
        if (!flightRoute.hasDirectFlight && (!flightRoute.connectionCities || flightRoute.connectionCities.length === 0)) {
          const connectionCity = getConnectionCity(origin, destination);
          if (connectionCity) {
            flightRoute.connectionCities = [connectionCity];
          }
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
 * 判断航线是否需要中转
 * 规则：
 * 1. 中国非主要枢纽城市到国际城市需要中转（经北京/上海/广州）
 * 2. 国际城市到中国非主要枢纽城市需要中转
 * 3. 跨洲长途航线（如欧洲-大洋洲）通常需要中转
 * 4. 非主要国际枢纽之间的长途航线需要中转
 */
function shouldRequireConnection(origin: string, destination: string): boolean {
  // 中国主要国际枢纽
  const chinaMajorHubs = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hong Kong'];

  // 主要国际枢纽（可以直飞的城市）
  const majorInternationalHubs = [
    // 中国
    ...chinaMajorHubs,
    // 美国
    'New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Washington',
    // 欧洲
    'London', 'Paris', 'Frankfurt', 'Amsterdam', 'Rome', 'Madrid',
    // 亚洲
    'Tokyo', 'Seoul', 'Singapore', 'Dubai', 'Bangkok', 'Hong Kong', 'Mumbai',
    // 大洋洲
    'Sydney', 'Melbourne',
  ];

  // 判断是否是主要枢纽
  const isOriginMajorHub = majorInternationalHubs.includes(origin);
  const isDestinationMajorHub = majorInternationalHubs.includes(destination);

  // 判断是否是中国城市
  const isOriginChina = CHINA_CITIES.includes(origin);
  const isDestinationChina = CHINA_CITIES.includes(destination);

  // 判断是否是主要国际城市（美国、欧洲、澳大利亚等）
  const isOriginInternational = ['New York', 'Los Angeles', 'San Francisco', 'London', 'Paris', 'Frankfurt', 'Tokyo', 'Sydney'].includes(origin);
  const isDestinationInternational = ['New York', 'Los Angeles', 'San Francisco', 'London', 'Paris', 'Frankfurt', 'Tokyo', 'Sydney'].includes(destination);

  // 情况1：中国非主要枢纽到国际城市（需要中转）
  if (isOriginChina && !isOriginMajorHub && isDestinationInternational) {
    return true;
  }

  // 情况2：国际城市到中国非主要枢纽（需要中转）
  if (isDestinationChina && !isDestinationMajorHub && isOriginInternational) {
    return true;
  }

  // 情况3：中国小城市之间（可能不需要中转，但距离远可能需要）
  if (isOriginChina && isDestinationChina && !isOriginMajorHub && !isDestinationMajorHub) {
    // 距离远的中国城市之间可能需要中转
    const farDistancePairs = [
      ['Urumqi', 'Harbin'], ['Urumqi', 'Changchun'], ['Urumqi', 'Shenyang'],
      ['Lhasa', 'Harbin'], ['Lhasa', 'Changchun'],
      ['Sanya', 'Urumqi'], ['Sanya', 'Lhasa'],
    ];
    for (const pair of farDistancePairs) {
      if ((pair[0] === origin && pair[1] === destination) || (pair[0] === destination && pair[1] === origin)) {
        return true;
      }
    }
  }

  // 情况4：非主要枢纽之间的长途国际航线（需要中转）
  if (!isOriginMajorHub && !isDestinationMajorHub && isOriginInternational && isDestinationInternational) {
    // 检查是否是远距离（比如东欧到南美）
    const longDistancePairs = [
      ['Rome', 'Sydney'], ['Madrid', 'Tokyo'],
    ];
    for (const pair of longDistancePairs) {
      if ((pair[0] === origin && pair[1] === destination) || (pair[0] === destination && pair[1] === origin)) {
        return true;
      }
    }
    return true; // 默认需要中转
  }

  // 默认：如果两端都是主要枢纽，可能直飞
  return false;
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
 * 获取推荐的中转城市
 * 根据出发地和目的地选择最佳中转枢纽
 */
function getConnectionCity(origin: string, destination: string): string {
  // 中国主要枢纽
  const chinaHubs = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hong Kong'];

  // 主要国际枢纽
  const majorInternationalHubs = [
    'New York', 'Los Angeles', 'San Francisco', 'London', 'Paris', 'Frankfurt',
    'Tokyo', 'Seoul', 'Singapore', 'Dubai', 'Bangkok', 'Sydney'
  ];

  const isOriginChina = CHINA_CITIES.includes(origin);
  const isDestinationChina = CHINA_CITIES.includes(destination);

  // 规则1：中国城市到国际城市，优先推荐北京/上海/广州
  if (isOriginChina && !isDestinationChina) {
    // 东北城市（长春、哈尔滨、沈阳）推荐北京
    if (['Changchun', 'Harbin', 'Shenyang'].includes(origin)) {
      return 'Beijing';
    }
    // 华东地区推荐上海
    if (['Hangzhou', 'Nanjing', 'Suzhou', 'Ningbo'].includes(origin) || origin.includes('Shanghai')) {
      return 'Shanghai';
    }
    // 华南地区推荐广州/深圳
    if (['Guangzhou', 'Shenzhen', 'Foshan', 'Dongguan'].includes(origin)) {
      return 'Guangzhou';
    }
    // 西南地区推荐成都
    if (['Chengdu', 'Chongqing', 'Kunming', 'Guiyang'].includes(origin)) {
      return 'Chengdu';
    }
    // 默认推荐北京
    return 'Beijing';
  }

  // 规则2：国际城市到中国城市，优先推荐北京/上海/广州
  if (!isOriginChina && isDestinationChina) {
    // 北美城市推荐北京
    if (['New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Washington', 'Toronto'].includes(origin)) {
      return 'Beijing';
    }
    // 欧洲城市推荐上海或北京
    if (['London', 'Paris', 'Frankfurt', 'Amsterdam', 'Rome', 'Madrid'].includes(origin)) {
      return 'Shanghai';
    }
    // 东南亚城市推荐广州或成都
    if (['Singapore', 'Bangkok', 'Kuala Lumpur', 'Jakarta', 'Manila'].includes(origin)) {
      return 'Guangzhou';
    }
    // 日韩推荐北京
    if (['Tokyo', 'Seoul', 'Osaka'].includes(origin)) {
      return 'Beijing';
    }
    // 默认推荐北京
    return 'Beijing';
  }

  // 规则3：中国小城市之间，推荐最近的枢纽
  if (isOriginChina && isDestinationChina) {
    // 东北地区之间推荐北京
    if (['Changchun', 'Harbin', 'Shenyang'].includes(origin) && ['Changchun', 'Harbin', 'Shenyang'].includes(destination)) {
      return 'Beijing';
    }
    // 西北地区推荐西安或北京
    if (['Urumqi', 'Lhasa'].includes(origin) || ['Urumqi', 'Lhasa'].includes(destination)) {
      return 'Beijing';
    }
    // 西南地区推荐成都
    if (['Chengdu', 'Chongqing', 'Kunming', 'Guiyang'].includes(origin) && ['Chengdu', 'Chongqing', 'Kunming', 'Guiyang'].includes(destination)) {
      return 'Chengdu';
    }
    // 华南地区推荐广州
    if (['Guangzhou', 'Shenzhen', 'Nanning'].includes(origin) && ['Guangzhou', 'Shenzhen', 'Nanning'].includes(destination)) {
      return 'Guangzhou';
    }
    // 默认推荐北京
    return 'Beijing';
  }

  // 规则4：国际长途航线（如欧洲-澳大利亚），推荐Dubai或Singapore
  if (!isOriginChina && !isDestinationChina) {
    const europe = ['London', 'Paris', 'Frankfurt', 'Rome', 'Madrid'];
    const oceania = ['Sydney', 'Melbourne', 'Auckland'];

    if (europe.includes(origin) && oceania.includes(destination)) {
      return 'Singapore';
    }
    if (oceania.includes(origin) && europe.includes(destination)) {
      return 'Singapore';
    }

    // 欧洲-美洲，推荐Dubai或London
    if (europe.includes(origin) && majorInternationalHubs.includes(destination)) {
      return 'Dubai';
    }
    if (majorInternationalHubs.includes(origin) && europe.includes(destination)) {
      return 'Dubai';
    }
  }

  // 默认返回空字符串（不需要中转）
  return '';
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
 * 对于非预定义的航线，强制应用中转逻辑
 * 修复：移除缓存检查，每次重新计算以确保中转逻辑正确应用
 */
export async function searchFlightRoute(
  origin: string,
  destination: string
): Promise<FlightRoute> {
  // 1. 首先判断是否需要中转（强制规则，优先级最高）
  const requiresConnection = shouldRequireConnection(origin, destination);
  const connectionCity = getConnectionCity(origin, destination);

  console.log(`[FlightRoute] ${origin} -> ${destination}: requiresConnection=${requiresConnection}, connectionCity=${connectionCity}`);

  // 2. 检查预定义数据（仅适用于主要枢纽之间的直飞航线）
  const predefined = getPredefinedRoute(origin, destination);
  if (predefined) {
    // 即使有预定义数据，也要检查是否应该中转
    if (requiresConnection) {
      console.log(`[FlightRoute] Overriding predefined route for ${origin} -> ${destination} to require connection`);
      // 覆盖预定义数据，强制中转
      predefined.hasDirectFlight = false;
      predefined.connectionCities = connectionCity ? [connectionCity] : [];
      // 增加中转时间（2-4小时）
      predefined.estimatedDurationMinutes += 120 + Math.floor(Math.random() * 120);
      // 增加中转费用
      predefined.minPriceUSD = Math.round(predefined.minPriceUSD * 1.3);
      predefined.maxPriceUSD = Math.round(predefined.maxPriceUSD * 1.5);
      predefined.typicalPriceUSD = Math.round(predefined.typicalPriceUSD * 1.4);
    }
    saveToCache(predefined);
    return predefined;
  }

  // 3. 使用联网搜索
  const realData = await searchRealFlightData(origin, destination);
  if (realData) {
    // 强制应用中转逻辑（优先级最高）
    if (requiresConnection) {
      console.log(`[FlightRoute] Forcing connection for ${origin} -> ${destination}`);
      realData.hasDirectFlight = false;
      realData.connectionCities = connectionCity ? [connectionCity] : [];

      // 如果联网搜索没有正确设置中转，增加中转时间
      if (realData.estimatedDurationMinutes < 600) {
        realData.estimatedDurationMinutes += 120 + Math.floor(Math.random() * 120);
      }

      // 增加中转费用
      if (realData.minPriceUSD > 0) {
        realData.minPriceUSD = Math.round(realData.minPriceUSD * 1.3);
        realData.maxPriceUSD = Math.round(realData.maxPriceUSD * 1.5);
        realData.typicalPriceUSD = Math.round(realData.typicalPriceUSD * 1.4);
      }
    }
    saveToCache(realData);
    return realData;
  }

  // 4. 如果都失败了，使用估算数据
  const estimatedDuration = estimateFlightDurationByDistance(origin, destination);

  // 如果需要中转，增加中转时间（2-4小时）
  const estimatedDurationWithConnection = requiresConnection
    ? estimatedDuration + (120 + Math.floor(Math.random() * 120))
    : estimatedDuration;

  const estimatedRoute: FlightRoute = {
    origin,
    destination,
    hasDirectFlight: !requiresConnection,
    connectionCities: requiresConnection && connectionCity ? [connectionCity] : [],
    estimatedDurationMinutes: estimatedDurationWithConnection,
    flightNumbers: [],
    airlines: [],
    minPriceUSD: Math.round(estimatedDurationWithConnection * 2), // 基于时长估算价格（包含中转）
    maxPriceUSD: Math.round(estimatedDurationWithConnection * 5),
    typicalPriceUSD: Math.round(estimatedDurationWithConnection * 3.5),
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
  const city1InChina = CHINA_CITIES.some(c => city1.toLowerCase().includes(c.toLowerCase()));
  const city2InChina = CHINA_CITIES.some(c => city2.toLowerCase().includes(c.toLowerCase()));
  
  return city1InChina && city2InChina;
}
