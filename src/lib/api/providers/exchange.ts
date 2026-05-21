/**
 * 汇率API服务
 * 使用 exchangerate-api.com 提供的免费API
 * 免费额度：1500次/月
 * 文档: https://www.exchangerate-api.com/docs
 */

import { BaseApiService } from '../base';
import { ExchangeRateData, ApiResponse } from '../types';

export class ExchangeRateService extends BaseApiService {
  /**
   * 获取汇率（基于USD）
   */
  async getExchangeRates(base: string = 'USD'): Promise<ApiResponse<ExchangeRateData>> {
    return this.request<any>(`/latest/${base}`, {
      params: {
        apikey: this.config.apiKey,
      },
    }).then((response) => {
      if (!response.success || !response.data) {
        return response;
      }

      const apiData = response.data;
      const exchangeRateData: ExchangeRateData = {
        base: apiData.base,
        rates: apiData.rates,
        timestamp: new Date(apiData.time_last_update_unix * 1000),
        provider: this.config.provider,
      };

      return {
        success: true,
        data: exchangeRateData,
        metadata: response.metadata,
      };
    });
  }

  /**
   * 获取特定货币对的汇率
   */
  async getExchangeRate(
    from: string,
    to: string
  ): Promise<ApiResponse<{ rate: number; from: string; to: string }>> {
    const response = await this.getExchangeRates(from);

    if (!response.success || !response.data) {
      return response as unknown as ApiResponse<{ rate: number; from: string; to: string }>;
    }

    const rate = response.data.rates[to];
    if (rate === undefined) {
      return {
        success: false,
        error: {
          code: 'CURRENCY_NOT_SUPPORTED',
          message: `Currency ${to} is not supported`,
        },
        metadata: response.metadata,
      };
    }

    return {
      success: true,
      data: {
        rate,
        from,
        to,
      },
      metadata: response.metadata,
    };
  }

  /**
   * 获取历史汇率
   */
  async getHistoricalRates(
    date: Date,
    base: string = 'USD'
  ): Promise<ApiResponse<ExchangeRateData>> {
    const dateStr = date.toISOString().split('T')[0];

    return this.request<any>(`/${dateStr}/${base}`, {
      params: {
        apikey: this.config.apiKey,
      },
    }).then((response) => {
      if (!response.success || !response.data) {
        return response;
      }

      const apiData = response.data;
      const exchangeRateData: ExchangeRateData = {
        base: apiData.base,
        rates: apiData.rates,
        timestamp: new Date(date),
        provider: this.config.provider,
      };

      return {
        success: true,
        data: exchangeRateData,
        metadata: response.metadata,
      };
    });
  }

  /**
   * 转换货币金额
   */
  async convertCurrency(
    amount: number,
    from: string,
    to: string
  ): Promise<ApiResponse<{ amount: number; from: string; to: string; rate: number }>> {
    const response = await this.getExchangeRate(from, to);

    if (!response.success || !response.data) {
      return response as unknown as ApiResponse<{ amount: number; from: string; to: string; rate: number }>;
    }

    const convertedAmount = amount * response.data.rate;

    return {
      success: true,
      data: {
        amount: Number(convertedAmount.toFixed(2)),
        from,
        to,
        rate: response.data.rate,
      },
      metadata: response.metadata,
    };
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<ApiResponse<any>> {
    return this.getExchangeRates('USD');
  }
}
