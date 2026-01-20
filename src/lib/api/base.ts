/**
 * 基础API服务类
 * 提供统一的API调用接口和错误处理
 */

import { ApiResponse, ApiConfig, ApiRequestOptions } from './types';

export abstract class BaseApiService {
  protected config: ApiConfig;
  protected requestCount: number = 0;
  protected lastRequestTime: number = 0;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  /**
   * 更新API配置
   */
  updateConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 检查API是否可用
   */
  isAvailable(): boolean {
    return this.config.isActive && !!this.config.apiKey;
  }

  /**
   * 速率限制检查
   */
  protected checkRateLimit(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = this.config.rateLimit
      ? 60000 / this.config.rateLimit
      : 0;

    if (timeSinceLastRequest < minInterval) {
      return false;
    }

    this.lastRequestTime = now;
    return true;
  }

  /**
   * 通用HTTP请求方法
   */
  protected async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: {
          code: 'API_UNAVAILABLE',
          message: 'API service is not available or not configured',
        },
        metadata: {
          timestamp: Date.now(),
          provider: this.config.provider,
        },
      };
    }

    if (!this.checkRateLimit()) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded, please try again later',
        },
        metadata: {
          timestamp: Date.now(),
          provider: this.config.provider,
        },
      };
    }

    const {
      timeout = this.config.timeout,
      retries = this.config.retryCount,
      headers = {},
      params = {},
      body = undefined,
    } = options;

    let lastError: any = null;
    let attempt = 0;

    while (attempt <= retries) {
      attempt++;

      try {
        const url = new URL(endpoint, this.config.baseUrl);

        // 添加查询参数
        Object.keys(params).forEach((key) => {
          if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, String(params[key]));
          }
        });

        // 准备请求头
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...headers,
        };

        // 添加API密钥（如果有）
        if (this.config.apiKey) {
          requestHeaders['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        // 准备请求体
        const requestOptions: RequestInit = {
          method: body ? 'POST' : 'GET',
          headers: requestHeaders,
          signal: AbortSignal.timeout(timeout),
        };

        if (body) {
          requestOptions.body = JSON.stringify(body);
        }

        // 发送请求
        const response = await fetch(url.toString(), requestOptions);
        const data = await response.json();

        this.requestCount++;

        // 检查响应状态
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${data.message || response.statusText}`
          );
        }

        return {
          success: true,
          data,
          metadata: {
            timestamp: Date.now(),
            requestId: response.headers.get('x-request-id') || undefined,
            provider: this.config.provider,
          },
        };
      } catch (error) {
        lastError = error;

        // 如果是最后一次尝试，抛出错误
        if (attempt > retries) {
          break;
        }

        // 等待一段时间后重试（指数退避）
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // 所有重试都失败
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'API request failed',
        details: lastError,
      },
      metadata: {
        timestamp: Date.now(),
        provider: this.config.provider,
      },
    };
  }

  /**
   * 测试API连接
   */
  abstract testConnection(): Promise<ApiResponse<any>>;

  /**
   * 获取API统计信息
   */
  getStats(): { requestCount: number; lastRequestTime: number } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }
}
