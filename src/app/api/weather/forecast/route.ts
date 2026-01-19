import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 验证schema
const forecastSchema = z.object({
  city: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

/**
 * 获取天气预报信息
 * TODO: 集成真实的天气API（如 OpenWeatherMap, WeatherAPI 等）
 */
async function fetchWeatherForecast(city: string, startDate: Date, endDate: Date) {
  try {
    // TODO: 替换为真实的天气API调用
    // const response = await fetch(
    //   `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=7`,
    // );
    // const data = await response.json();

    // 模拟天气预报数据
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const forecast = [];

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature: {
          min: 15 + Math.floor(Math.random() * 10), // 15-25°C
          max: 25 + Math.floor(Math.random() * 10), // 25-35°C
        },
        condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        humidity: 40 + Math.floor(Math.random() * 40), // 40-80%
        wind: {
          speed: 5 + Math.floor(Math.random() * 15), // 5-20 km/h
          direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        },
        uvIndex: Math.floor(Math.random() * 11), // 0-10
      });
    }

    return {
      city,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      forecast,
      summary: {
        averageTemp: forecast.reduce((sum, day) => sum + day.temperature.max, 0) / forecast.length,
        rainyDays: forecast.filter(day => day.condition.includes('Rain')).length,
        bestDays: forecast.filter(day => !day.condition.includes('Rain')).length,
      },
    };
  } catch (error) {
    console.error('Failed to fetch weather forecast:', error);
    throw new Error('Failed to fetch weather forecast');
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!city || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: city, startDate, endDate' },
        { status: 400 }
      );
    }

    const validatedData = forecastSchema.parse({
      city,
      startDate,
      endDate,
    });

    const weatherData = await fetchWeatherForecast(
      validatedData.city,
      new Date(validatedData.startDate),
      new Date(validatedData.endDate)
    );

    return NextResponse.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    console.error('Failed to get weather forecast:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to get weather forecast' },
      { status: 500 }
    );
  }
}
