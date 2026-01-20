import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { apiConfigs } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { apiManager } from '@/lib/api';

/**
 * 获取天气数据
 * GET /api/weather?city=Beijing&type=current|forecast&days=5
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const type = searchParams.get('type') || 'current'; // current | forecast
    const days = parseInt(searchParams.get('days') || '5');

    if (!city) {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      );
    }

    // 获取天气API配置
    const db = await getDb();
    const [config] = await db
      .select()
      .from(apiConfigs)
      .where(eq(apiConfigs.provider, 'openweather' as any));

    if (!config || !config.isActive) {
      // 如果没有配置天气API，返回模拟数据
      const mockData = {
        temperature: Math.round(15 + Math.random() * 10),
        feelsLike: Math.round(15 + Math.random() * 10),
        humidity: Math.round(40 + Math.random() * 30),
        pressure: Math.round(1000 + Math.random() * 20),
        windSpeed: Math.round(Math.random() * 10),
        windDirection: Math.round(Math.random() * 360),
        condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
        description: 'Mock weather data (API not configured)',
        icon: '01d',
        visibility: 10000,
        timestamp: new Date(),
        location: {
          city: city,
          country: 'CN',
          lat: 39.9,
          lon: 116.4,
        },
      };

      return NextResponse.json({
        success: true,
        data: mockData,
        mock: true,
        message: 'Using mock data (weather API not configured)',
      });
    }

    // 注册配置并调用API
    apiManager.registerConfig({
      ...config,
      description: config.description || undefined,
      apiKey: config.apiKey || undefined,
      apiSecret: config.apiSecret || undefined,
      webhookUrl: config.webhookUrl || undefined,
      rateLimit: config.rateLimit || undefined,
      config: config.config ? (config.config as Record<string, any>) : undefined,
      metadata: config.metadata ? (config.metadata as Record<string, any>) : undefined,
      lastTestedAt: config.lastTestedAt || undefined,
      lastTestStatus: config.lastTestStatus || undefined,
      lastTestMessage: config.lastTestMessage || undefined,
    });
    const weatherService = apiManager.getWeatherService();

    if (!weatherService) {
      return NextResponse.json(
        { error: 'Weather service not available' },
        { status: 500 }
      );
    }

    let result;
    if (type === 'forecast') {
      result = await weatherService.getWeatherForecast(city, days);
    } else {
      result = await weatherService.getCurrentWeather(city);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data', details: error },
      { status: 500 }
    );
  }
}
