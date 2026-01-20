/**
 * API服务统一导出
 */

// 类型定义
export * from './types';

// 基础服务类
export { BaseApiService } from './base';

// 服务管理器
export { ApiManager, apiManager } from './manager';

// API服务实现
export { WeatherApiService } from './providers/weather';
export { ExchangeRateService } from './providers/exchange';
export { AviationApiService } from './providers/aviation';
export { HotelApiService } from './providers/hotel';
export { HospitalApiService } from './providers/hospital';
export { TrainApiService } from './providers/train';
export { FlightApiService } from './providers/flight';
