/**
 * 生成详细的航班信息（包含中转信息）
 */

export interface FlightSegment {
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  airline: string;
}

export interface FlightDetails {
  isDirect: boolean;
  segments: FlightSegment[];
  connectionCity?: string;
  layoverMinutes?: number;
  totalDurationMinutes: number;
  totalPriceUSD: number;
}

/**
 * 生成真实的航班号
 */
export function generateRealisticFlightNumber(
  origin: string,
  destination: string,
  classType: 'economy' | 'business' | 'first' = 'economy'
): string {
  const airlines: Record<string, string[]> = {
    'Beijing': ['CA', 'CZ', 'MU', 'HU'],
    'Shanghai': ['MU', 'FM', 'HO', 'CA'],
    'Guangzhou': ['CZ', 'ZH', 'CA'],
    'Shenzhen': ['ZH', 'CZ', 'CA'],
    'New York': ['UA', 'DL', 'AA', 'CA'],
    'London': ['BA', 'VS', 'CA'],
    'Paris': ['AF', 'CA', 'MU'],
    'Frankfurt': ['LH', 'CA'],
    'Tokyo': ['JL', 'NH', 'CA', 'CZ'],
    'Seoul': ['KE', 'OZ', 'CA', 'CZ'],
  };

  // 根据城市选择航空公司
  const airlineCode = airlines[origin]?.[Math.floor(Math.random() * airlines[origin].length)] || 'CA';
  const flightNumber = Math.floor(Math.random() * 9000) + 1000;

  return `${airlineCode}${flightNumber}`;
}

/**
 * 获取航空公司名称
 */
function getAirlineName(airlineCode: string): string {
  const airlines: Record<string, string> = {
    'CA': 'Air China',
    'MU': 'China Eastern',
    'CZ': 'China Southern',
    'HU': 'Hainan Airlines',
    'FM': 'Shanghai Airlines',
    'HO': 'Juneyao Air',
    'ZH': 'Shenzhen Airlines',
    'UA': 'United Airlines',
    'DL': 'Delta Air Lines',
    'AA': 'American Airlines',
    'BA': 'British Airways',
    'VS': 'Virgin Atlantic',
    'AF': 'Air France',
    'LH': 'Lufthansa',
    'JL': 'Japan Airlines',
    'NH': 'ANA',
    'KE': 'Korean Air',
    'OZ': 'Asiana Airlines',
  };

  return airlines[airlineCode] || 'Airline';
}

/**
 * 估算单段航班的飞行时间（分钟）
 */
function estimateSingleSegmentDuration(origin: string, destination: string): number {
  const durationTable: Record<string, number> = {
    'Beijing-Shanghai': 120,
    'Beijing-Guangzhou': 180,
    'Beijing-Chengdu': 150,
    'Beijing-Shenzhen': 180,
    'Shanghai-Guangzhou': 150,
    'Shanghai-Chengdu': 150,
    'Beijing-Changchun': 120,
    'Shanghai-Changchun': 150,
    'Beijing-New York': 840,
    'Shanghai-New York': 900,
    'Beijing-London': 600,
    'Shanghai-London': 660,
    'Beijing-Paris': 600,
    'Shanghai-Paris': 660,
    'Beijing-Tokyo': 180,
    'Shanghai-Tokyo': 180,
    'Beijing-Seoul': 120,
    'Shanghai-Seoul': 150,
  };

  const key1 = `${origin}-${destination}`;
  const key2 = `${destination}-${origin}`;

  return durationTable[key1] || durationTable[key2] || 240;
}

/**
 * 生成详细的航班信息
 */
export function generateFlightDetails(
  origin: string,
  destination: string,
  departureTime: Date,
  isDirect: boolean,
  connectionCity?: string,
  typicalPriceUSD: number = 1000
): FlightDetails {
  const segments: FlightSegment[] = [];

  if (isDirect) {
    // 直飞航班
    const durationMinutes = estimateSingleSegmentDuration(origin, destination);
    const arrivalTime = new Date(departureTime.getTime() + durationMinutes * 60 * 1000);
    const flightNumber = generateRealisticFlightNumber(origin, destination);

    segments.push({
      flightNumber,
      origin,
      destination,
      departureTime,
      arrivalTime,
      durationMinutes,
      airline: getAirlineName(flightNumber.substring(0, 2)),
    });

    return {
      isDirect: true,
      segments,
      totalDurationMinutes: durationMinutes,
      totalPriceUSD: typicalPriceUSD,
    };
  } else {
    // 中转航班
    if (!connectionCity) {
      // 如果没有指定中转城市，使用默认规则
      connectionCity = getDefaultConnectionCity(origin, destination);
    }

    // 第一段：origin -> connectionCity
    const firstSegmentDuration = estimateSingleSegmentDuration(origin, connectionCity);
    const firstSegmentArrival = new Date(departureTime.getTime() + firstSegmentDuration * 60 * 1000);
    const firstFlightNumber = generateRealisticFlightNumber(origin, connectionCity);

    segments.push({
      flightNumber: firstFlightNumber,
      origin,
      destination: connectionCity,
      departureTime,
      arrivalTime: firstSegmentArrival,
      durationMinutes: firstSegmentDuration,
      airline: getAirlineName(firstFlightNumber.substring(0, 2)),
    });

    // 中转时间（2-4小时）
    const layoverMinutes = 120 + Math.floor(Math.random() * 120);

    // 第二段：connectionCity -> destination
    const secondSegmentDeparture = new Date(firstSegmentArrival.getTime() + layoverMinutes * 60 * 1000);
    const secondSegmentDuration = estimateSingleSegmentDuration(connectionCity, destination);
    const secondSegmentArrival = new Date(secondSegmentDeparture.getTime() + secondSegmentDuration * 60 * 1000);
    const secondFlightNumber = generateRealisticFlightNumber(connectionCity, destination);

    segments.push({
      flightNumber: secondFlightNumber,
      origin: connectionCity,
      destination,
      departureTime: secondSegmentDeparture,
      arrivalTime: secondSegmentArrival,
      durationMinutes: secondSegmentDuration,
      airline: getAirlineName(secondFlightNumber.substring(0, 2)),
    });

    return {
      isDirect: false,
      segments,
      connectionCity,
      layoverMinutes,
      totalDurationMinutes: firstSegmentDuration + layoverMinutes + secondSegmentDuration,
      totalPriceUSD: Math.round(typicalPriceUSD * 1.3),
    };
  }
}

/**
 * 获取默认中转城市
 */
function getDefaultConnectionCity(origin: string, destination: string): string {
  // 东北地区推荐北京
  if (['Changchun', 'Harbin', 'Shenyang'].includes(origin)) {
    return 'Beijing';
  }

  // 华东地区推荐上海
  if (['Hangzhou', 'Nanjing', 'Suzhou'].includes(origin)) {
    return 'Shanghai';
  }

  // 默认返回北京
  return 'Beijing';
}

/**
 * 格式化航班信息用于显示
 */
export function formatFlightDetails(flightDetails: FlightDetails): string {
  if (flightDetails.isDirect) {
    const segment = flightDetails.segments[0];
    return `Direct flight ${segment.flightNumber}`;
  } else {
    const first = flightDetails.segments[0];
    const second = flightDetails.segments[1];
    return `Connection: ${first.flightNumber} + ${second.flightNumber} (Via ${flightDetails.connectionCity})`;
  }
}
