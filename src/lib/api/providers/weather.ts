/**
 * OpenWeatherMap 天气API服务
 * 免费版本支持当前天气、5天预报等
 * 免费额度：1000次/天
 * 文档: https://openweathermap.org/api
 */

import { BaseApiService } from '../base';
import { WeatherData, ApiResponse } from '../types';

export class WeatherApiService extends BaseApiService {
  /**
   * 获取当前天气
   */
  async getCurrentWeather(city: string): Promise<ApiResponse<WeatherData>> {
    return this.request<WeatherData>('/weather', {
      params: {
        q: city,
        appid: this.config.apiKey,
        units: 'metric',
      },
    }).then((response) => {
      if (!response.success || !response.data) {
        return response;
      }

      // 转换API响应为标准格式
      const apiData = response.data as any;
      const weatherData: WeatherData = {
        temperature: apiData.main.temp,
        feelsLike: apiData.main.feels_like,
        humidity: apiData.main.humidity,
        pressure: apiData.main.pressure,
        windSpeed: apiData.wind.speed,
        windDirection: apiData.wind.deg,
        condition: apiData.weather[0].main,
        description: apiData.weather[0].description,
        icon: apiData.weather[0].icon,
        visibility: apiData.visibility,
        timestamp: new Date(),
        location: {
          city: apiData.name,
          country: apiData.sys.country,
          lat: apiData.coord.lat,
          lon: apiData.coord.lon,
        },
      };

      return {
        success: true,
        data: weatherData,
        metadata: response.metadata,
      };
    });
  }

  /**
   * 获取天气预报（5天）
   */
  async getWeatherForecast(
    city: string,
    days: number = 5
  ): Promise<ApiResponse<WeatherData[]>> {
    return this.request<any[]>('/forecast', {
      params: {
        q: city,
        appid: this.config.apiKey,
        units: 'metric',
        cnt: days * 8, // 每天8个3小时预报
      },
    }).then((response) => {
      if (!response.success || !response.data) {
        return response;
      }

      // 每天取一个预报（中午12点）
      const apiData = response.data as any[];
      const dailyData = apiData.filter(
        (item, index) => index % 8 === 4 // 每天的中午预报
      );

      const weatherData: WeatherData[] = dailyData.map((item) => ({
        temperature: item.main.temp,
        feelsLike: item.main.feels_like,
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        windSpeed: item.wind.speed,
        windDirection: item.wind.deg,
        condition: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        visibility: item.visibility,
        timestamp: new Date(item.dt * 1000),
        location: {
          city: city,
          country: '',
          lat: item.coord.lat,
          lon: item.coord.lon,
        },
      }));

      return {
        success: true,
        data: weatherData,
        metadata: response.metadata,
      };
    });
  }

  /**
   * 根据经纬度获取天气
   */
  async getWeatherByCoords(
    lat: number,
    lon: number
  ): Promise<ApiResponse<WeatherData>> {
    return this.request<WeatherData>('/weather', {
      params: {
        lat,
        lon,
        appid: this.config.apiKey,
        units: 'metric',
      },
    }).then((response) => {
      if (!response.success || !response.data) {
        return response;
      }

      const apiData = response.data as any;
      const weatherData: WeatherData = {
        temperature: apiData.main.temp,
        feelsLike: apiData.main.feels_like,
        humidity: apiData.main.humidity,
        pressure: apiData.main.pressure,
        windSpeed: apiData.wind.speed,
        windDirection: apiData.wind.deg,
        condition: apiData.weather[0].main,
        description: apiData.weather[0].description,
        icon: apiData.weather[0].icon,
        visibility: apiData.visibility,
        timestamp: new Date(),
        location: {
          city: apiData.name,
          country: apiData.sys.country,
          lat: apiData.coord.lat,
          lon: apiData.coord.lon,
        },
      };

      return {
        success: true,
        data: weatherData,
        metadata: response.metadata,
      };
    });
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<ApiResponse<any>> {
    return this.getCurrentWeather('London');
  }
}
