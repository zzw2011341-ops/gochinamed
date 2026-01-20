/**
 * API服务管理器
 * 统一管理所有API服务
 */

import { ApiConfig, ApiResponse } from './types';
import { WeatherApiService } from './providers/weather';
import { ExchangeRateService } from './providers/exchange';
import { AviationApiService } from './providers/aviation';
import { HotelApiService } from './providers/hotel';
import { HospitalApiService } from './providers/hospital';
import { TrainApiService } from './providers/train';
import { FlightApiService } from './providers/flight';

export class ApiManager {
  private services: Map<string, any> = new Map();
  private configs: Map<string, ApiConfig> = new Map();

  /**
   * 注册API配置
   */
  registerConfig(config: ApiConfig): void {
    this.configs.set(config.provider, config);
  }

  /**
   * 获取API服务实例
   */
  getService<T>(provider: string): T | null {
    if (!this.services.has(provider)) {
      const config = this.configs.get(provider);
      if (!config) {
        return null;
      }

      const service = this.createService(config);
      if (service) {
        this.services.set(provider, service);
      }
    }

    return this.services.get(provider) || null;
  }

  /**
   * 创建API服务实例
   */
  private createService(config: ApiConfig): any {
    switch (config.provider) {
      case 'openweather':
        return new WeatherApiService(config);
      case 'exchangerate':
        return new ExchangeRateService(config);
      case 'aviationstack':
        return new AviationApiService(config);
      case 'booking':
      case 'hotel':
        return new HotelApiService(config);
      case 'hospital_booking':
        return new HospitalApiService(config);
      case '12306':
      case 'train':
        return new TrainApiService(config);
      case 'amadeus':
      case 'flight':
        return new FlightApiService(config);
      default:
        return null;
    }
  }

  /**
   * 测试API连接
   */
  async testConnection(provider: string): Promise<ApiResponse<any>> {
    const service = this.getService<any>(provider);
    if (!service) {
      return {
        success: false,
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: `API service for ${provider} is not configured`,
        },
        metadata: {
          timestamp: Date.now(),
          provider,
        },
      };
    }

    return service.testConnection();
  }

  /**
   * 获取天气API服务
   */
  getWeatherService(): WeatherApiService | null {
    return this.getService<WeatherApiService>('openweather');
  }

  /**
   * 获取汇率API服务
   */
  getExchangeRateService(): ExchangeRateService | null {
    return this.getService<ExchangeRateService>('exchangerate');
  }

  /**
   * 获取航空数据API服务
   */
  getAviationService(): AviationApiService | null {
    return this.getService<AviationApiService>('aviationstack');
  }

  /**
   * 获取酒店API服务
   */
  getHotelService(): HotelApiService | null {
    return this.getService<HotelApiService>('booking') ||
           this.getService<HotelApiService>('hotel');
  }

  /**
   * 获取医院API服务
   */
  getHospitalService(): HospitalApiService | null {
    return this.getService<HospitalApiService>('hospital_booking');
  }

  /**
   * 获取火车API服务
   */
  getTrainService(): TrainApiService | null {
    return this.getService<TrainApiService>('12306') ||
           this.getService<TrainApiService>('train');
  }

  /**
   * 获取航班API服务
   */
  getFlightService(): FlightApiService | null {
    return this.getService<FlightApiService>('amadeus') ||
           this.getService<FlightApiService>('flight');
  }

  /**
   * 获取所有已注册的API配置
   */
  getAllConfigs(): ApiConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * 获取API配置
   */
  getConfig(provider: string): ApiConfig | undefined {
    return this.configs.get(provider);
  }

  /**
   * 更新API配置
   */
  updateConfig(provider: string, config: Partial<ApiConfig>): void {
    const existing = this.configs.get(provider);
    if (existing) {
      const updated = { ...existing, ...config };
      this.configs.set(provider, updated);

      // 如果服务已存在，重新创建
      if (this.services.has(provider)) {
        this.services.delete(provider);
      }
    }
  }

  /**
   * 移除API配置
   */
  removeConfig(provider: string): void {
    this.configs.delete(provider);
    this.services.delete(provider);
  }
}

// 创建全局API管理器实例
export const apiManager = new ApiManager();
