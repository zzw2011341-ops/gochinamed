// API服务通用类型定义

/**
 * API响应基础类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: number;
    requestId?: string;
    provider: string;
  };
}

/**
 * API配置接口
 */
export interface ApiConfig {
  id: string;
  provider: string;
  name: string;
  description?: string;
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  rateLimit?: number;
  timeout: number;
  retryCount: number;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
  lastTestedAt?: Date;
  lastTestStatus?: string;
  lastTestMessage?: string;
}

/**
 * 天气数据类型
 */
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  condition: string;
  description: string;
  icon: string;
  visibility: number;
  uvIndex?: number;
  timestamp: Date;
  location: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
}

/**
 * 汇率数据类型
 */
export interface ExchangeRateData {
  base: string;
  rates: Record<string, number>;
  timestamp: Date;
  provider: string;
}

/**
 * 机场信息类型
 */
export interface AirportInfo {
  iataCode: string;
  icaoCode?: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

/**
 * 航班查询参数
 */
export interface FlightSearchParams {
  origin: string; // 起始机场代码
  destination: string; // 目的地机场代码
  departureDate: Date;
  returnDate?: Date;
  passengers?: number;
  classType?: 'economy' | 'business' | 'first';
  directOnly?: boolean;
}

/**
 * 航班信息类型
 */
export interface FlightInfo {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: AirportInfo;
  destination: AirportInfo;
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  stops: number;
  price: number;
  currency: string;
  classType: string;
  availableSeats: number;
  isDirect: boolean;
}

/**
 * 酒店查询参数
 */
export interface HotelSearchParams {
  city: string;
  checkInDate: Date;
  checkOutDate: Date;
  guests?: number;
  rooms?: number;
  starRating?: number;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * 酒店信息类型
 */
export interface HotelInfo {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  starRating: number;
  roomTypes: {
    type: string;
    price: number;
    currency: string;
    available: number;
    amenities: string[];
  }[];
  amenities: string[];
  images: string[];
  rating: number;
  reviewsCount: number;
}

/**
 * 医院查询参数
 */
export interface HospitalSearchParams {
  city: string;
  specialty?: string;
  level?: string;
  name?: string;
}

/**
 * 医院信息类型
 */
export interface HospitalInfo {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  level: string;
  specialties: string[];
  latitude: number;
  longitude: number;
  image?: string;
  website?: string;
  rating?: number;
  consultationFeeRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

/**
 * 医生查询参数
 */
export interface DoctorSearchParams {
  city: string;
  hospitalId?: string;
  specialty?: string;
  name?: string;
}

/**
 * 医生信息类型
 */
export interface DoctorInfo {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  hospital: {
    id: string;
    name: string;
  };
  experienceYears: number;
  consultationFee: number;
  currency: string;
  image?: string;
  rating?: number;
  availability?: {
    date: Date;
    slots: string[];
  }[];
}

/**
 * 高铁查询参数
 */
export interface TrainSearchParams {
  origin: string; // 起始站
  destination: string; // 目的地站
  departureDate: Date;
  passengers?: number;
  seatType?: 'economy' | 'business' | 'first';
}

/**
 * 高铁信息类型
 */
export interface TrainInfo {
  trainNumber: string;
  origin: {
    code: string;
    name: string;
  };
  destination: {
    code: string;
    name: string;
  };
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  price: number;
  currency: string;
  seatType: string;
  availableSeats: number;
}

/**
 * API请求选项
 */
export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
}
