/**
 * 航空数据API服务
 * 使用 Aviation Stack API（免费版本）
 * 免费额度：100次/月
 * 文档: https://aviationstack.com/documentation
 *
 * 注意：Aviation Stack主要提供实时航班数据，适合查询航班状态
 * 对于机票预订，需要对接OTA（在线旅行社）API，如Amadeus、Skyscanner等
 */

import { BaseApiService } from '../base';
import { AirportInfo, FlightInfo, FlightSearchParams, ApiResponse } from '../types';

export class AviationApiService extends BaseApiService {
  /**
   * 获取机场信息
   */
  async getAirports(search?: string): Promise<ApiResponse<AirportInfo[]>> {
    return this.request<any[]>('/cities', {
      params: {
        access_key: this.config.apiKey,
        search: search || '',
        limit: 100,
      },
    }).then((response) => {
      if (!response.success || !response.data) {
        return response;
      }

      const apiData = response.data;
      const airports: AirportInfo[] = apiData
        .filter((item: any) => item.airports && item.airports.length > 0)
        .flatMap((item: any) =>
          item.airports.map((airport: any) => ({
            iataCode: airport.iata_code,
            icaoCode: airport.icao_code,
            name: airport.airport_name,
            city: item.city_name,
            country: item.country_name,
            latitude: Number(airport.latitude),
            longitude: Number(airport.longitude),
          }))
        );

      return {
        success: true,
        data: airports,
        metadata: response.metadata,
      };
    });
  }

  /**
   * 根据IATA代码获取机场信息
   */
  async getAirportByIata(iataCode: string): Promise<ApiResponse<AirportInfo>> {
    return this.getAirports(iataCode).then((response) => {
      if (!response.success || !response.data || response.data.length === 0) {
        return {
          success: false,
          error: {
            code: 'AIRPORT_NOT_FOUND',
            message: `Airport with IATA code ${iataCode} not found`,
          },
          metadata: response.metadata,
        };
      }

      return {
        success: true,
        data: response.data[0],
        metadata: response.metadata,
      };
    });
  }

  /**
   * 查询航班（实时航班状态）
   * 注意：这返回的是实时航班，不是可预订的航班
   * 可预订航班需要对接OTA API
   */
  async searchFlights(
    params: FlightSearchParams
  ): Promise<ApiResponse<FlightInfo[]>> {
    // Aviation Stack只支持查询实时航班，不支持按日期搜索
    // 这里返回一个说明
    return {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message:
          'Flight search requires OTA API integration (Amadeus, Skyscanner, etc.). Aviation Stack only provides real-time flight status.',
      },
      metadata: {
        timestamp: Date.now(),
        provider: this.config.provider,
      },
    };
  }

  /**
   * 获取航班实时状态
   */
  async getFlightStatus(flightNumber: string): Promise<ApiResponse<any>> {
    return this.request<any[]>('/flights', {
      params: {
        access_key: this.config.apiKey,
        flight_iata: flightNumber,
      },
    }).then((response) => {
      if (!response.success || !response.data) {
        return response;
      }

      const flights = response.data;
      if (flights.length === 0) {
        return {
          success: false,
          error: {
            code: 'FLIGHT_NOT_FOUND',
            message: `Flight ${flightNumber} not found`,
          },
          metadata: response.metadata,
        };
      }

      return {
        success: true,
        data: flights[0],
        metadata: response.metadata,
      };
    });
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<ApiResponse<any>> {
    return this.getAirports('PEK');
  }
}
