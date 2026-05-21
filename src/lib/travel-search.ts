/**
 * 旅行搜索服务 - 基于腾讯混元 AI
 * 提供航班、酒店、景点搜索和预订方案生成
 */

import { callHunyuan } from './hunyuan-client';
import { getDb } from 'coze-coding-dev-sdk';
import { attractions } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';

export interface TravelSearchParams {
  origin?: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  rooms?: number;
  budget?: 'budget' | 'mid-range' | 'luxury';
  preferences?: string[];
}

export interface TravelSearchResult {
  success: boolean;
  data?: any;
  error?: string;
  provider: string;
  timestamp: number;
}

/**
 * 搜索航班信息（混元 AI 生成）
 */
export async function searchFlights(params: TravelSearchParams): Promise<TravelSearchResult> {
  try {
    const prompt = `作为专业的旅行顾问，请为用户提供从 ${params.origin || '用户所在地'} 到 ${params.destination} 的航班搜索结果。

搜索条件：
- 出发地：${params.origin || '待确认'}
- 目的地：${params.destination}
- 出发日期：${params.departureDate || '近期'}
- 返程日期：${params.returnDate || '单程'}
- 乘客人数：${params.passengers || 1} 人

请以 JSON 格式返回 3-5 个航班选项，每个包含：
- airline（航空公司）
- flightNumber（航班号）
- departureTime（起飞时间）
- arrivalTime（到达时间）
- duration（飞行时长）
- price（价格，美元）
- aircraft（机型）
- stops（经停次数）

只返回 JSON，不要其他解释。`;

    const response = await callHunyuan([
      { Role: 'system', Content: '你是专业的航班搜索助手，只返回结构化 JSON 数据，不要代码块标记。' },
      { Role: 'user', Content: prompt }
    ], { model: 'hunyuan-lite', temperature: 0.3 });

    // 提取 JSON（可能包含代码块标记）
    let jsonStr = response.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json\n?/g, '').replace(/\n?\`\`\`$/g, '');
    }
    const flights = JSON.parse(jsonStr);
    
    return {
      success: true,
      data: { flights: Array.isArray(flights) ? flights : [flights] },
      provider: 'hunyuan-ai',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('航班搜索失败:', error);
    return {
      success: false,
      error: error.message || '航班搜索失败',
      provider: 'hunyuan-ai',
      timestamp: Date.now(),
    };
  }
}

/**
 * 搜索酒店信息（混元 AI 生成）
 */
export async function searchHotels(params: TravelSearchParams): Promise<TravelSearchResult> {
  try {
    const prompt = `作为专业的酒店预订顾问，请为用户提供在 ${params.destination} 的酒店搜索结果。

搜索条件：
- 城市：${params.destination}
- 入住日期：${params.hotelCheckIn || '近期'}
- 退房日期：${params.hotelCheckOut || '2晚后'}
- 房间数：${params.rooms || 1} 间
- 预算档次：${params.budget || '中等'}

请以 JSON 格式返回 3-5 个酒店选项，每个包含：
- name（酒店名称，中英文）
- nameEn（英文名称）
- nameZh（中文名称）
- rating（评分，1-5）
- pricePerNight（每晚价格，美元）
- totalPrice（总价）
- address（地址）
- amenities（设施列表，如：免费WiFi、游泳池、健身房）
- distanceToCityCenter（距市中心距离，公里）

只返回 JSON，不要其他解释。`;

    const response = await callHunyuan([
      { Role: 'system', Content: '你是专业的酒店搜索助手，只返回结构化 JSON 数据，不要代码块标记。' },
      { Role: 'user', Content: prompt }
    ], { model: 'hunyuan-lite', temperature: 0.3 });

    // 提取 JSON
    let jsonStr = response.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json\n?/g, '').replace(/\n?\`\`\`$/g, '');
    }
    const hotels = JSON.parse(jsonStr);
    
    return {
      success: true,
      data: { hotels: Array.isArray(hotels) ? hotels : [hotels] },
      provider: 'hunyuan-ai',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('酒店搜索失败:', error);
    return {
      success: false,
      error: error.message || '酒店搜索失败',
      provider: 'hunyuan-ai',
      timestamp: Date.now(),
    };
  }
}

/**
 * 生成完整旅行方案（航班+酒店+景点）
 */
export async function generateTravelPlan(params: TravelSearchParams): Promise<TravelSearchResult> {
  try {
    const prompt = `作为专业的医疗旅游规划师，请为用户生成一份完整的 ${params.destination} 旅行方案。

用户信息：
- 出发地：${params.origin || '待确认'}
- 目的地：${params.destination}
- 出行日期：${params.departureDate || '近期'}
- 乘客人数：${params.passengers || 1} 人
- 预算：${params.budget || '中等'}

请生成包含以下内容的完整方案（JSON格式）：
1. **航班建议**：3个选项（航空公司、航班号、时间、价格）
2. **酒店推荐**：3个选项（名称、评分、价格、设施）
3. **景点推荐**：5个必去景点（名称、简介、门票、推荐理由）
4. **行程建议**：3-5天行程安排
5. **医疗旅游提示**：针对国际患者的建议

只返回 JSON，格式如下：
{
  "flights": [...],
  "hotels": [...],
  "attractions": [...],
  "itinerary": [...],
  "medicalTips": [...]
}`;

    const response = await callHunyuan([
      { Role: 'system', Content: '你是 GoChinaMed 的专业医疗旅游规划师，为用户生成详细、准确的旅行方案。只返回 JSON，不要代码块标记。' },
      { Role: 'user', Content: prompt }
    ], { model: 'hunyuan-lite', temperature: 0.7 });

    // 提取 JSON
    let jsonStr = response.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json\n?/g, '').replace(/\n?\`\`\`$/g, '');
    }
    const plan = JSON.parse(jsonStr);
    
    return {
      success: true,
      data: plan,
      provider: 'hunyuan-ai',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('旅行方案生成失败:', error);
    return {
      success: false,
      error: error.message || '旅行方案生成失败',
      provider: 'hunyuan-ai',
      timestamp: Date.now(),
    };
  }
}

/**
 * 搜索景点信息（结合数据库 + AI）
 */
export async function searchAttractions(city: string, category?: string): Promise<TravelSearchResult> {
  try {
    // 尝试从数据库查询（如果可用）
    let dbResults: any[] = [];
    try {
      const db = await getDb();
      const conditions = [eq(attractions.city, city)];
      if (category) {
        conditions.push(eq(attractions.category, category));
      }
      
      dbResults = await db
        .select()
        .from(attractions)
        .where(and(...conditions))
        .limit(10);
    } catch (dbError: any) {
      console.log('数据库不可用，使用 AI 搜索:', dbError.message);
    }
    
    if (dbResults.length > 0) {
      return {
        success: true,
        data: { attractions: dbResults, source: 'database' },
        provider: 'database',
        timestamp: Date.now(),
      };
    }
    
    // 数据库没有则调用 AI
    const prompt = `请为用户推荐 ${city} 的 5-8 个热门景点（名胜古迹和人文景点）。

请以 JSON 格式返回，每个景点包含：
- nameEn（英文名称）
- nameZh（中文名称）
- descriptionEn（英文描述）
- descriptionZh（中文描述）
- category（类别：Historical/Cultural/Natural/Religious/Modern）
- rating（评分 1-5）
- ticketPrice（门票价格，美元）
- tipsEn（英文提示）
- tipsZh（中文提示）

只返回 JSON 数组。`;

    const response = await callHunyuan([
      { Role: 'system', Content: '你是专业的旅游景点推荐助手。只返回 JSON 数组，不要代码块标记。' },
      { Role: 'user', Content: prompt }
    ], { model: 'hunyuan-lite', temperature: 0.5 });

    // 提取 JSON
    let jsonStr = response.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json\n?/g, '').replace(/\n?\`\`\`$/g, '');
    }
    const aiAttractions = JSON.parse(jsonStr);
    
    return {
      success: true,
      data: { attractions: Array.isArray(aiAttractions) ? aiAttractions : [aiAttractions], source: 'ai' },
      provider: 'hunyuan-ai',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('景点搜索失败:', error);
    return {
      success: false,
      error: error.message || '景点搜索失败',
      provider: 'hunyuan-ai',
      timestamp: Date.now(),
    };
  }
}
