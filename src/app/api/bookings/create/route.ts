import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { calculateFlightCostUSD } from '@/lib/services/flightSearchService';

const config = new Config();
const llmClient = new LLMClient(config);

interface BookingRequest {
  userId: string;
  originCity: string;
  destinationCity: string;
  travelDate: string;
  numberOfPeople?: string;
  passportNumber?: string;
  passportCountry?: string;
  selectedHospital?: string;
  selectedDoctor?: string;
  treatmentType: string;
  consultationDirection?: string;
  examinationItems?: string;
  surgeryTypes?: string;
  treatmentDirection?: string;
  rehabilitationDirection?: string;
  budget: string;
}

interface PlanOption {
  id: string;
  name: string;
  description: string;
  // 基础费用
  hotelFee: number;
  flightFee: number;
  carFee: number;
  ticketFee: number;
  reservationFee: number;
  // 医疗费用详细分类
  medicalSurgeryFee: number;
  medicineFee: number;
  nursingFee: number;
  nutritionFee: number;
  // 汇总字段（保持兼容性）
  medicalFee: number;
  totalAmount: number;
  highlights: string[];
  duration: string;
  hotelName: string;
  hotelStars: number;
  flightClass: string;
  // 医疗服务关联
  doctorId?: string;
  hospitalId?: string;
  // 医疗方案详细字段
  consultationDirection?: string;
  examinationItems?: string;
  surgeryTypes?: string;
  treatmentDirection?: string;
  rehabilitationDirection?: string;
  medicalPlan?: string;
  planAdjustments?: string[];
  // 验证信息
  isPriceValidated?: boolean;
  priceAdjustmentStatus?: 'pending' | 'approved' | 'rejected';
  priceAdjustmentAmount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json();
    const {
      userId,
      originCity,
      destinationCity,
      travelDate,
      selectedHospital = '',
      selectedDoctor = '',
      passportNumber = '',
      passportCountry = '',
      treatmentType,
      budget,
    } = body;

    // 添加调试日志
    console.log('='.repeat(80));
    console.log('[Create API] ==========================================');
    console.log('[Create API] Received travelDate:', travelDate);
    console.log('[Create API] Request body keys:', Object.keys(body));
    console.log('[Create API] Full request body:', JSON.stringify(body, null, 2));
    console.log('[Create API] ==========================================');

    // 验证必需字段
    if (!userId || !originCity || !destinationCity || !travelDate) {
      console.error('[Create API] Missing required fields:', {
        hasUserId: !!userId,
        hasOriginCity: !!originCity,
        hasDestinationCity: !!destinationCity,
        hasTravelDate: !!travelDate
      });
      return NextResponse.json(
        { error: 'Missing required fields: userId, originCity, destinationCity, travelDate' },
        { status: 400 }
      );
    }

    // 验证travelDate格式
    const parsedTravelDate = new Date(travelDate);
    if (isNaN(parsedTravelDate.getTime())) {
      console.error('[Create API] Invalid travelDate format:', travelDate);
      return NextResponse.json(
        { error: 'Invalid travelDate format. Expected YYYY-MM-DD', details: { provided: travelDate } },
        { status: 400 }
      );
    }

    console.log('[Create API] Parsed travelDate:', parsedTravelDate.toISOString());

    const db = await getDb();

    // 更新用户的旅行偏好
    await db.update(users)
      .set({
        originCity,
        destinationCity,
        budget: budget || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 判断是否是同城旅行（出发城市和到达城市相同）
    const isSameCity = originCity === destinationCity;

    // 判断是否有医疗服务需求（选择了医院、医生或治疗类型）
    const hasMedicalSelection = !!(selectedHospital || selectedDoctor || treatmentType);
    const numberOfPeople = parseInt(body.numberOfPeople || '1') || 1;

    // 获取天气和汇率数据（如果API已配置）
    let weatherData: any = null;
    let exchangeRates: any = null;

    try {
      // 获取目的地天气
      const weatherResponse = await fetch(
        `${request.nextUrl.origin}/api/weather?city=${encodeURIComponent(destinationCity)}&type=forecast&days=3`,
        { cache: 'no-store' }
      );
      if (weatherResponse.ok) {
        const weatherResult = await weatherResponse.json();
        if (weatherResult.success) {
          weatherData = weatherResult.data;
        }
      }

      // 获取汇率数据
      const exchangeResponse = await fetch(
        `${request.nextUrl.origin}/api/exchange?base=USD`,
        { cache: 'no-store' }
      );
      if (exchangeResponse.ok) {
        const exchangeResult = await exchangeResponse.json();
        if (exchangeResult.success) {
          exchangeRates = exchangeResult.data?.rates;
        }
      }
    } catch (apiError) {
      console.error('Failed to fetch weather/exchange data:', apiError);
      // API调用失败不影响主要流程，继续使用估算数据
    }

    // 构建天气提示
    let weatherPrompt = '';
    if (weatherData && Array.isArray(weatherData) && weatherData.length > 0) {
      const forecast = weatherData.slice(0, 3).map((w: any) =>
        `${new Date(w.timestamp).toLocaleDateString()}: ${w.condition}, ${Math.round(w.temperature)}°C`
      ).join(', ');
      weatherPrompt = `\nWeather Forecast for ${destinationCity}: ${forecast}\n`;
    }

    // 根据治疗类型确定费用策略
    const getFeeInstructions = () => {
      const feeRules: Record<string, string> = {
        'consultation': `
- medicalSurgeryFee: 0 (no surgery for consultation)
- medicineFee: 50-200 (basic medication)
- nursingFee: 0 (no nursing required)
- nutritionFee: 0 (no nutrition required)
- medicalFee: sum of above (50-200)
- ticketFee: 0 (no tourist attractions for medical consultation)`,
        'examination': `
- medicalSurgeryFee: 0 (no surgery for examination)
- medicineFee: 100-300 (test-related medications if needed)
- nursingFee: 0 (no nursing required)
- nutritionFee: 0 (no nutrition required)
- medicalFee: sum of above (100-300, based on examination types like CT, MRI, etc.)
- ticketFee: 0 (no tourist attractions for medical examination)`,
        'surgery': `
- medicalSurgeryFee: 2000-8000 (surgery costs based on type)
- medicineFee: 300-800 (post-surgery medications)
- nursingFee: 500-1500 (post-operative nursing care)
- nutritionFee: 100-400 (recovery nutrition support)
- medicalFee: sum of above (2900-10700)
- ticketFee: 0 (no tourist attractions for surgery)`,
        'therapy': `
- medicalSurgeryFee: 0 (no surgery for therapy)
- medicineFee: 200-600 (therapy medications)
- nursingFee: 200-600 (therapy nursing support)
- nutritionFee: 100-300 (therapy nutrition)
- medicalFee: sum of above (500-1500)
- ticketFee: 0 (no tourist attractions for therapy)`,
        'rehabilitation': `
- medicalSurgeryFee: 0 (no surgery for rehabilitation)
- medicineFee: 150-400 (rehabilitation medications)
- nursingFee: 400-1000 (intensive rehabilitation nursing)
- nutritionFee: 200-500 (rehabilitation nutrition)
- medicalFee: sum of above (750-1900)
- ticketFee: 0 (no tourist attractions for rehabilitation)`,
      };

      return feeRules[treatmentType || 'consultation'] || feeRules['consultation'];
    };

    // 获取真实航班价格（用于生成准确的方案）
    const USD_TO_CNY = 7.2;
    let flightPricing = {
      economy: { minCNY: 4000, maxCNY: 6000, typicalCNY: 5000 },
      business: { minCNY: 8000, maxCNY: 12000, typicalCNY: 10000 },
      first: { minCNY: 15000, maxCNY: 25000, typicalCNY: 20000 },
      currency: 'CNY'
    };

    if (!isSameCity) {
      try {
        const economyPrice = await calculateFlightCostUSD(originCity, destinationCity, 'economy', numberOfPeople);
        const businessPrice = await calculateFlightCostUSD(originCity, destinationCity, 'business', numberOfPeople);
        const firstPrice = await calculateFlightCostUSD(originCity, destinationCity, 'first', numberOfPeople);

        flightPricing = {
          economy: {
            minCNY: Math.round(economyPrice.minPrice * USD_TO_CNY),
            maxCNY: Math.round(economyPrice.maxPrice * USD_TO_CNY),
            typicalCNY: Math.round(economyPrice.typicalPrice * USD_TO_CNY)
          },
          business: {
            minCNY: Math.round(businessPrice.minPrice * USD_TO_CNY),
            maxCNY: Math.round(businessPrice.maxPrice * USD_TO_CNY),
            typicalCNY: Math.round(businessPrice.typicalPrice * USD_TO_CNY)
          },
          first: {
            minCNY: Math.round(firstPrice.minPrice * USD_TO_CNY),
            maxCNY: Math.round(firstPrice.maxPrice * USD_TO_CNY),
            typicalCNY: Math.round(firstPrice.typicalPrice * USD_TO_CNY)
          },
          currency: 'CNY'
        };

        console.log('[Flight Pricing] Real flight costs calculated:', {
          route: `${originCity} -> ${destinationCity}`,
          passengers: numberOfPeople,
          economy: flightPricing.economy,
          business: flightPricing.business,
          first: flightPricing.first
        });
      } catch (error) {
        console.error('[Flight Pricing] Error calculating flight costs, using default values:', error);
      }
    } else {
      flightPricing = {
        economy: { minCNY: 0, maxCNY: 0, typicalCNY: 0 },
        business: { minCNY: 0, maxCNY: 0, typicalCNY: 0 },
        first: { minCNY: 0, maxCNY: 0, typicalCNY: 0 },
        currency: 'CNY'
      };
    }

    const prompt = `You are a medical tourism consultant. Generate 3 different travel plan options for a patient.

User Details:
- Origin City: ${originCity}
- Destination City: ${destinationCity}
- Travel Date: ${travelDate}
- Treatment Type: ${treatmentType || 'General Consultation'}
- Consultation Direction: ${body.consultationDirection || 'Not specified'}
- Examination Items: ${body.examinationItems || 'Not specified'}
- Surgery Types: ${body.surgeryTypes || 'Not specified'}
- Treatment Direction: ${body.treatmentDirection || 'Not specified'}
- Rehabilitation Direction: ${body.rehabilitationDirection || 'Not specified'}
- Budget: $${budget || 'Not specified'}
- Number of Travelers: ${numberOfPeople}
${weatherPrompt}
- ${hasMedicalSelection ? 'Selected Doctor/Hospital: Yes' : 'Selected Doctor/Hospital: No'}
- ${isSameCity ? '⚠️ IMPORTANT: Same-city travel (origin and destination are the same)' : 'Different-city travel'}
${exchangeRates ? `Currency rates (USD-based): CNY=${exchangeRates.CNY}, EUR=${exchangeRates.EUR}, GBP=${exchangeRates.GBP}\n` : ''}

FEE CALCULATION RULES FOR "${treatmentType || 'consultation'}":${getFeeInstructions()}

Please generate 3 distinct options with different price points and features:
1. Budget-Friendly Option (Basic hotel, economy flight, essential services)
2. Standard Option (Mid-range hotel, business class flight, good services)
3. Premium Option (Luxury hotel, first class flight, comprehensive services)

For each option, provide a JSON object with this structure:
{
  "name": "Option Name (e.g., Budget-Friendly Plan)",
  "description": "Brief description of what this plan offers",
  "hotelFee": number (100-500 per night * 7 days * ${numberOfPeople} travelers),
  "flightFee": number (${isSameCity ? '0 for same-city travel' : `MUST use real flight costs: ${flightPricing.economy.typicalCNY} CNY for economy class (budget), ${flightPricing.business.typicalCNY} CNY for business class (standard), ${flightPricing.first.typicalCNY} CNY for first class (premium). Route: ${originCity} to ${destinationCity}, ${numberOfPeople} traveler(s). Price range per class: economy ${flightPricing.economy.minCNY}-${flightPricing.economy.maxCNY} CNY, business ${flightPricing.business.minCNY}-${flightPricing.business.maxCNY} CNY, first ${flightPricing.first.minCNY}-${flightPricing.first.maxCNY} CNY.`}),
  "carFee": number (${isSameCity ? '50-200 for local transportation' : '30-100 for local airport-hotel transfers'}),
  "ticketFee": 0 (MEDICAL TOURISM: No tourist attractions, this is for medical treatment),
  "reservationFee": number (50-200 for appointment booking),
  "medicalSurgeryFee": number (Based on treatment type rules above),
  "medicineFee": number (Based on treatment type rules above),
  "nursingFee": number (Based on treatment type rules above),
  "nutritionFee": number (Based on treatment type rules above),
  "medicalFee": number (sum of medicalSurgeryFee + medicineFee + nursingFee + nutritionFee),
  "totalAmount": number (sum of hotelFee + flightFee + carFee + ticketFee + reservationFee + medicalFee),
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "duration": "e.g., 7 days 6 nights",
  "hotelName": "Hotel name",
  "hotelStars": number (1-5),
  "flightClass": "${isSameCity ? 'local-transportation' : 'economy/business/first'}",
  "consultationDirection": "${body.consultationDirection || 'Based on treatment type'}",
  "examinationItems": "${body.examinationItems || 'Recommended tests'}",
  "surgeryTypes": "${body.surgeryTypes || 'Specific surgery type if applicable'}",
  "treatmentDirection": "${body.treatmentDirection || 'Treatment approach'}",
  "rehabilitationDirection": "${body.rehabilitationDirection || 'Rehabilitation focus if needed'}",
  "medicalPlan": "Detailed medical plan description based on ${treatmentType || 'consultation'}",
  "isPriceValidated": true
}

${!hasMedicalSelection ? 'IMPORTANT: Since no doctor or hospital was selected, set all medical fees (medicalSurgeryFee, medicineFee, nursingFee, nutritionFee, medicalFee) to 0 for all plans.' : ''}
${isSameCity ? 'CRITICAL: Since origin and destination are the same city, set flightFee to 0. Use carFee for local transportation (taxi/car rental).' : ''}
CRITICAL: This is a MEDICAL TOURISM platform, NOT a tourism platform. Do NOT include tourist attractions, sightseeing, or entertainment fees (ticketFee = 0).
IMPORTANT: Flight costs must be realistic based on the route from ${originCity} to ${destinationCity}. For example:
- Beijing to Changchun (domestic): 80-200 USD per person
- New York to Beijing (international): 800-2500 USD per person
- London to Beijing (international): 700-2000 USD per person
Use the exchange rate of 7.2 CNY per USD for price calculations.

Return ONLY the JSON array with 3 options, no additional text.`;

    console.log('[AI Prompt] Flight pricing info included in prompt:', flightPricing);

    try {
      const response = await llmClient.stream([
        { role: 'system', content: 'You are a JSON generator. Only output valid JSON arrays.' },
        { role: 'user', content: prompt }
      ], {
        model: 'doubao-seed-1-6-251015',
        temperature: 0.8,
        thinking: 'disabled',
      });

      let fullContent = '';
      for await (const chunk of response) {
        if (chunk.content) {
          fullContent += chunk.content.toString();
        }
      }

      // 解析AI返回的JSON
      let plans: PlanOption[];
      try {
        // 清理可能的markdown代码块标记
        const cleanContent = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        plans = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // 如果解析失败，生成默认方案
        plans = await generateDefaultPlans(
          budget,
          treatmentType,
          selectedHospital,
          selectedDoctor,
          numberOfPeople,
          isSameCity,
          body.consultationDirection,
          body.examinationItems,
          body.surgeryTypes,
          body.treatmentDirection,
          body.rehabilitationDirection,
          originCity,
          destinationCity
        );
      }

      // 确保我们有3个方案
      if (!Array.isArray(plans) || plans.length !== 3) {
        plans = await generateDefaultPlans(
          budget,
          treatmentType,
          selectedHospital,
          selectedDoctor,
          numberOfPeople,
          isSameCity,
          body.consultationDirection,
          body.examinationItems,
          body.surgeryTypes,
          body.treatmentDirection,
          body.rehabilitationDirection,
          originCity,
          destinationCity
        );
      }

      // 清理和验证数据，确保所有必需字段都存在
      plans = plans.map(plan =>
        normalizePlan(
          plan,
          isSameCity,
          hasMedicalSelection,
          numberOfPeople,
          selectedDoctor,
          selectedHospital,
          body.consultationDirection,
          body.examinationItems,
          body.surgeryTypes,
          body.treatmentDirection,
          body.rehabilitationDirection,
          treatmentType
        )
      );

      return NextResponse.json({
        success: true,
        plans: plans,
        requestData: {
          userId,
          originCity,
          destinationCity,
          travelDate,
          numberOfPeople: numberOfPeople.toString(),
          passportNumber,
          passportCountry,
          selectedHospital,
          selectedDoctor,
          treatmentType,
        },
        metadata: {
          weatherForecast: weatherData || null,
          exchangeRates: exchangeRates || null,
          dataSource: weatherData ? 'API' : 'estimated',
        },
      });

    } catch (aiError) {
      console.error('AI generation failed, using default plans:', aiError);
      // AI生成失败时使用默认方案
      let defaultPlans = await generateDefaultPlans(
        budget,
        treatmentType,
        selectedHospital,
        selectedDoctor,
        numberOfPeople,
        isSameCity,
        body.consultationDirection,
        body.examinationItems,
        body.surgeryTypes,
        body.treatmentDirection,
        body.rehabilitationDirection,
        originCity,
        destinationCity
      );
      // 确保数据归一化
      defaultPlans = defaultPlans.map(plan =>
        normalizePlan(
          plan,
          isSameCity,
          hasMedicalSelection,
          numberOfPeople,
          selectedDoctor,
          selectedHospital,
          body.consultationDirection,
          body.examinationItems,
          body.surgeryTypes,
          body.treatmentDirection,
          body.rehabilitationDirection,
          treatmentType
        )
      );
      return NextResponse.json({
        success: true,
        plans: defaultPlans,
        requestData: {
          userId,
          originCity,
          destinationCity,
          travelDate,
          numberOfPeople: numberOfPeople.toString(),
          passportNumber,
          passportCountry,
          selectedHospital,
          selectedDoctor,
          treatmentType,
        },
        metadata: {
          weatherForecast: weatherData || null,
          exchangeRates: exchangeRates || null,
          dataSource: weatherData ? 'API' : 'estimated',
        },
      });
    }

  } catch (error) {
    console.error('Error generating plans:', error);
    return NextResponse.json(
      { error: 'Failed to generate plans', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * 根据城市和星级获取真实的酒店名称
 */
function getRealHotelName(city: string, stars: number): string {
  const hotels: Record<string, { budget: string[]; standard: string[]; premium: string[] }> = {
    'Beijing': {
      budget: ['Hanting Hotel', 'Jinjiang Inn', '7 Days Inn', 'Home Inn'],
      standard: ['Holiday Inn Beijing', 'Crowne Plaza Beijing', 'Grand Hyatt Beijing', 'Sheraton Beijing'],
      premium: ['The Peninsula Beijing', 'Four Seasons Beijing', 'Waldorf Astoria Beijing', 'Shangri-La Beijing']
    },
    'Shanghai': {
      budget: ['Hanting Hotel', 'Jinjiang Inn', 'Home Inn', 'Motel 168'],
      standard: ['Renaissance Shanghai', 'Grand Hyatt Shanghai', 'Sheraton Shanghai', 'Okura Garden Hotel'],
      premium: ['The Peninsula Shanghai', 'Four Seasons Shanghai', 'Waldorf Astoria Shanghai', 'Grand Hyatt on the Bund']
    },
    'Guangzhou': {
      budget: ['7 Days Inn', 'Home Inn', 'Jinjiang Inn', 'Hanting Hotel'],
      standard: ['White Swan Hotel', 'Garden Hotel Guangzhou', 'China Hotel', 'Sheraton Guangzhou'],
      premium: ['Four Seasons Guangzhou', 'W Guangzhou', 'Shangri-La Guangzhou', 'The Ritz-Carlton Guangzhou']
    },
    'Shenzhen': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Shenzhen', 'Grand Hyatt Shenzhen', 'Renaissance Shenzhen', 'Crowne Plaza Shenzhen'],
      premium: ['Four Seasons Shenzhen', 'The St. Regis Shenzhen', 'The Ritz-Carlton Shenzhen', 'Shangri-La Shenzhen']
    },
    'Chengdu': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Chengdu', 'Crowne Plaza Chengdu', 'Grand Hyatt Chengdu', 'Hilton Chengdu'],
      premium: ['The Ritz-Carlton Chengdu', 'Shangri-La Chengdu', 'W Chengdu', 'Four Seasons Chengdu']
    },
    'Chongqing': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Chongqing', 'Hilton Chongqing', 'Crowne Plaza Chongqing', 'Radisson Chongqing'],
      premium: ['InterContinental Chongqing', 'The Ritz-Carlton Chongqing', 'Shangri-La Chongqing', 'W Chongqing']
    },
    'Hangzhou': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Hangzhou', 'Grand Hyatt Hangzhou', 'Crowne Plaza Hangzhou', 'Hilton Hangzhou'],
      premium: ['Four Seasons Hangzhou', 'The Ritz-Carlton Hangzhou', 'Shangri-La Hangzhou', 'W Hangzhou']
    },
    'Nanjing': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Nanjing', 'Hilton Nanjing', 'Crowne Plaza Nanjing', 'Grand Hyatt Nanjing'],
      premium: ['The Ritz-Carlton Nanjing', 'InterContinental Nanjing', 'Shangri-La Nanjing', 'W Nanjing']
    },
    'Wuhan': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Wuhan', 'Hilton Wuhan', 'Crowne Plaza Wuhan', 'Grand Hyatt Wuhan'],
      premium: ['The Ritz-Carlton Wuhan', 'InterContinental Wuhan', 'Shangri-La Wuhan', 'Wuhan Renaissance']
    },
    'Xi\'an': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Xi\'an', 'Hilton Xi\'an', 'Grand Hyatt Xi\'an', 'Crowne Plaza Xi\'an'],
      premium: ['The Ritz-Carlton Xi\'an', 'Shangri-La Xi\'an', 'W Xi\'an', 'InterContinental Xi\'an']
    },
    'Tianjin': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Tianjin', 'Hilton Tianjin', 'Renaissance Tianjin', 'Crowne Plaza Tianjin'],
      premium: ['The Ritz-Carlton Tianjin', 'Shangri-La Tianjin', 'W Tianjin', 'InterContinental Tianjin']
    },
    'Qingdao': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Qingdao', 'Hilton Qingdao', 'Crowne Plaza Qingdao', 'Grand Hyatt Qingdao'],
      premium: ['The Ritz-Carlton Qingdao', 'Shangri-La Qingdao', 'W Qingdao', 'InterContinental Qingdao']
    },
    'Dalian': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Dalian', 'Hilton Dalian', 'Crowne Plaza Dalian', 'Grand Hyatt Dalian'],
      premium: ['The Ritz-Carlton Dalian', 'Shangri-La Dalian', 'W Dalian', 'InterContinental Dalian']
    },
    'Xiamen': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Xiamen', 'Hilton Xiamen', 'Crowne Plaza Xiamen', 'Grand Hyatt Xiamen'],
      premium: ['The Ritz-Carlton Xiamen', 'Shangri-La Xiamen', 'W Xiamen', 'InterContinental Xiamen']
    },
    'Changsha': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Changsha', 'Hilton Changsha', 'Crowne Plaza Changsha', 'Grand Hyatt Changsha'],
      premium: ['The Ritz-Carlton Changsha', 'Shangri-La Changsha', 'W Changsha', 'InterContinental Changsha']
    },
    'Harbin': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Harbin', 'Hilton Harbin', 'Crowne Plaza Harbin', 'Grand Hyatt Harbin'],
      premium: ['The Ritz-Carlton Harbin', 'Shangri-La Harbin', 'W Harbin', 'InterContinental Harbin']
    },
    'Changchun': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Changchun', 'Hilton Changchun', 'Crowne Plaza Changchun', 'Grand Hyatt Changchun'],
      premium: ['The Ritz-Carlton Changchun', 'Shangri-La Changchun', 'W Changchun', 'InterContinental Changchun']
    },
    'Shenyang': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Shenyang', 'Hilton Shenyang', 'Crowne Plaza Shenyang', 'Grand Hyatt Shenyang'],
      premium: ['The Ritz-Carlton Shenyang', 'Shangri-La Shenyang', 'W Shenyang', 'InterContinental Shenyang']
    },
    'Jinan': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Jinan', 'Hilton Jinan', 'Crowne Plaza Jinan', 'Grand Hyatt Jinan'],
      premium: ['The Ritz-Carlton Jinan', 'Shangri-La Jinan', 'W Jinan', 'InterContinental Jinan']
    },
    'Zhengzhou': {
      budget: ['Home Inn', '7 Days Inn', 'Hanting Hotel', 'Jinjiang Inn'],
      standard: ['Sheraton Zhengzhou', 'Hilton Zhengzhou', 'Crowne Plaza Zhengzhou', 'Grand Hyatt Zhengzhou'],
      premium: ['The Ritz-Carlton Zhengzhou', 'Shangri-La Zhengzhou', 'W Zhengzhou', 'InterContinental Zhengzhou']
    },
  };

  const cityHotels = hotels[city];
  if (!cityHotels) {
    // 默认酒店（如果城市不在列表中）
    const defaultHotels = {
      3: ['Hanting Hotel', 'Home Inn', '7 Days Inn'],
      4: ['Sheraton Hotel', 'Hilton Hotel', 'Crowne Plaza'],
      5: ['The Ritz-Carlton', 'Shangri-La Hotel', 'Four Seasons Hotel']
    };
    const hotelList = defaultHotels[stars as 3 | 4 | 5] || defaultHotels[4];
    return hotelList[Math.floor(Math.random() * hotelList.length)];
  }

  const hotelList = stars === 3 ? cityHotels.budget : stars === 4 ? cityHotels.standard : cityHotels.premium;
  return hotelList[Math.floor(Math.random() * hotelList.length)];
}

// 生成默认方案（当AI不可用时）
async function generateDefaultPlans(
  budget: string,
  treatmentType: string,
  selectedHospital?: string,
  selectedDoctor?: string,
  numberOfPeople: number = 1,
  isSameCity: boolean = false,
  consultationDirection?: string,
  examinationItems?: string,
  surgeryTypes?: string,
  treatmentDirection?: string,
  rehabilitationDirection?: string,
  originCity: string = 'Origin',
  destinationCity: string = 'Destination'
): Promise<PlanOption[]> {
  const baseBudget = parseFloat(budget) || 3000;
  const hasMedicalSelection = selectedHospital || selectedDoctor;

  // 根据治疗类型确定医疗费用
  const getMedicalFees = (type: string, multiplier: number) => {
    const fees: Record<string, { surgery: number; medicine: number; nursing: number; nutrition: number }> = {
      'consultation': {
        surgery: 0,
        medicine: 50 * multiplier,
        nursing: 0,
        nutrition: 0,
      },
      'examination': {
        surgery: 0,
        medicine: 100 * multiplier,
        nursing: 0,
        nutrition: 0,
      },
      'surgery': {
        surgery: 3000 * multiplier,
        medicine: 300 * multiplier,
        nursing: 600 * multiplier,
        nutrition: 150 * multiplier,
      },
      'therapy': {
        surgery: 0,
        medicine: 250 * multiplier,
        nursing: 300 * multiplier,
        nutrition: 150 * multiplier,
      },
      'rehabilitation': {
        surgery: 0,
        medicine: 200 * multiplier,
        nursing: 500 * multiplier,
        nutrition: 250 * multiplier,
      },
    };

    const selected = fees[type || 'consultation'] || fees['consultation'];
    return {
      surgery: selected.surgery,
      medicine: selected.medicine,
      nursing: selected.nursing,
      nutrition: selected.nutrition,
      total: selected.surgery + selected.medicine + selected.nursing + selected.nutrition,
    };
  };

  // 获取不同等级的医疗费用
  const budgetFees = getMedicalFees(treatmentType, 1);
  const standardFees = getMedicalFees(treatmentType, 1.5);
  const premiumFees = getMedicalFees(treatmentType, 2.5);

  // 使用真实航班价格（转换为人民币，汇率约7.2）
  const USD_TO_CNY = 7.2;
  let budgetFlightCost, standardFlightCost, premiumFlightCost;

  if (isSameCity) {
    // 同城旅行：无机票费用
    budgetFlightCost = { minPrice: 0, maxPrice: 0, typicalPrice: 0 };
    standardFlightCost = { minPrice: 0, maxPrice: 0, typicalPrice: 0 };
    premiumFlightCost = { minPrice: 0, maxPrice: 0, typicalPrice: 0 };
  } else {
    // 国际/长途旅行：使用真实航班价格（包含强制中转逻辑）
    try {
      budgetFlightCost = await calculateFlightCostUSD(originCity, destinationCity, 'economy', numberOfPeople);
      standardFlightCost = await calculateFlightCostUSD(originCity, destinationCity, 'business', numberOfPeople);
      premiumFlightCost = await calculateFlightCostUSD(originCity, destinationCity, 'first', numberOfPeople);

      // 转换为人民币
      budgetFlightCost.minPrice = Math.round(budgetFlightCost.minPrice * USD_TO_CNY);
      budgetFlightCost.maxPrice = Math.round(budgetFlightCost.maxPrice * USD_TO_CNY);
      budgetFlightCost.typicalPrice = Math.round(budgetFlightCost.typicalPrice * USD_TO_CNY);

      standardFlightCost.minPrice = Math.round(standardFlightCost.minPrice * USD_TO_CNY);
      standardFlightCost.maxPrice = Math.round(standardFlightCost.maxPrice * USD_TO_CNY);
      standardFlightCost.typicalPrice = Math.round(standardFlightCost.typicalPrice * USD_TO_CNY);

      premiumFlightCost.minPrice = Math.round(premiumFlightCost.minPrice * USD_TO_CNY);
      premiumFlightCost.maxPrice = Math.round(premiumFlightCost.maxPrice * USD_TO_CNY);
      premiumFlightCost.typicalPrice = Math.round(premiumFlightCost.typicalPrice * USD_TO_CNY);
    } catch (error) {
      console.error('Error calculating flight costs:', error);
      // 如果计算失败，使用保守估计
      budgetFlightCost = { minPrice: 4000, maxPrice: 6000, typicalPrice: 5000 };
      standardFlightCost = { minPrice: 8000, maxPrice: 12000, typicalPrice: 10000 };
      premiumFlightCost = { minPrice: 15000, maxPrice: 25000, typicalPrice: 20000 };
    }
  }

  const budgetFlightFee = budgetFlightCost.typicalPrice;
  const standardFlightFee = standardFlightCost.typicalPrice;
  const premiumFlightFee = premiumFlightCost.typicalPrice;

  const budgetCarFee = isSameCity ? 80 * numberOfPeople : 50 * numberOfPeople;
  const standardCarFee = isSameCity ? 120 * numberOfPeople : 80 * numberOfPeople;
  const premiumCarFee = isSameCity ? 180 * numberOfPeople : 100 * numberOfPeople;

  // 获取真实的酒店名称
  const budgetHotelName = getRealHotelName(destinationCity, 3);
  const standardHotelName = getRealHotelName(destinationCity, 4);
  const premiumHotelName = getRealHotelName(destinationCity, 5);

  const plans = [
    {
      id: 'budget',
      name: 'Budget-Friendly Plan',
      description: 'Economical option with essential services for budget-conscious travelers',
      hotelFee: 700 * numberOfPeople,
      flightFee: budgetFlightFee,
      carFee: budgetCarFee,
      ticketFee: 0, // 医疗旅游不包含门票
      reservationFee: 50,
      medicalSurgeryFee: budgetFees.surgery,
      medicineFee: budgetFees.medicine,
      nursingFee: budgetFees.nursing,
      nutritionFee: budgetFees.nutrition,
      medicalFee: budgetFees.total,
      totalAmount: 0, // 稍后计算
      highlights: [
        'Basic 3-star hotel accommodation',
        isSameCity ? 'Local taxi transportation' : 'Economy class flights',
        ...hasMedicalSelection ? [`Medical ${treatmentType || 'service'}`] : [],
        'Standard appointment booking',
        'Basic translation support'
      ],
      duration: '7 days 6 nights',
      hotelName: budgetHotelName,
      hotelStars: 3,
      flightClass: isSameCity ? 'local-transportation' : 'economy',
      doctorId: selectedDoctor || undefined,
      hospitalId: selectedHospital || undefined,
      consultationDirection: consultationDirection || treatmentType || 'general_consultation',
      examinationItems: examinationItems || (treatmentType === 'examination' ? 'basic_tests' : 'not_applicable'),
      surgeryTypes: surgeryTypes || (treatmentType === 'surgery' ? 'general_surgery' : undefined),
      treatmentDirection: treatmentDirection || (treatmentType === 'therapy' ? 'physical_therapy' : undefined),
      rehabilitationDirection: rehabilitationDirection || (treatmentType === 'rehabilitation' ? 'post_surgery' : undefined),
      medicalPlan: `Basic medical plan for ${treatmentType || 'consultation'}. Essential services and follow-up care.`,
      isPriceValidated: true,
      priceAdjustmentStatus: 'pending' as const,
      priceAdjustmentAmount: 0,
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      description: 'Balanced option with quality services and good comfort',
      hotelFee: 1050 * numberOfPeople,
      flightFee: standardFlightFee,
      carFee: standardCarFee,
      ticketFee: 0, // 医疗旅游不包含门票
      reservationFee: 100,
      medicalSurgeryFee: standardFees.surgery,
      medicineFee: standardFees.medicine,
      nursingFee: standardFees.nursing,
      nutritionFee: standardFees.nutrition,
      medicalFee: standardFees.total,
      totalAmount: 0, // 稍后计算
      highlights: [
        '4-star hotel near hospital',
        isSameCity ? 'Premium car service' : 'Standard class flights',
        ...hasMedicalSelection ? [`Comprehensive medical ${treatmentType || 'service'}`] : [],
        '24/7 translation service',
        'Priority appointment booking',
        'Medical coordination assistance'
      ],
      duration: '7 days 6 nights',
      hotelName: standardHotelName,
      hotelStars: 4,
      flightClass: isSameCity ? 'premium-transport' : 'standard',
      doctorId: selectedDoctor || undefined,
      hospitalId: selectedHospital || undefined,
      consultationDirection: consultationDirection || treatmentType || 'comprehensive_consultation',
      examinationItems: examinationItems || (treatmentType === 'examination' ? 'comprehensive_tests' : 'not_applicable'),
      surgeryTypes: surgeryTypes || (treatmentType === 'surgery' ? 'specialized_surgery' : undefined),
      treatmentDirection: treatmentDirection || (treatmentType === 'therapy' ? 'comprehensive_therapy' : undefined),
      rehabilitationDirection: rehabilitationDirection || (treatmentType === 'rehabilitation' ? 'comprehensive_rehab' : undefined),
      medicalPlan: `Comprehensive medical plan for ${treatmentType || 'consultation'}. Specialist consultation, detailed examinations, and personalized treatment.`,
      isPriceValidated: true,
      priceAdjustmentStatus: 'pending' as const,
      priceAdjustmentAmount: 0,
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      description: 'Luxury option with top-tier services and maximum comfort',
      hotelFee: 1750 * numberOfPeople,
      flightFee: premiumFlightFee,
      carFee: premiumCarFee,
      ticketFee: 0, // 医疗旅游不包含门票
      reservationFee: 200,
      medicalSurgeryFee: premiumFees.surgery,
      medicineFee: premiumFees.medicine,
      nursingFee: premiumFees.nursing,
      nutritionFee: premiumFees.nutrition,
      medicalFee: premiumFees.total,
      totalAmount: 0, // 稍后计算
      highlights: [
        '5-star luxury hotel with wellness center',
        isSameCity ? 'VIP private car service' : 'Business class flights',
        ...hasMedicalSelection ? [`Specialist medical ${treatmentType || 'service'}`] : [],
        'Personal medical assistant',
        'VIP priority service',
        'Complete medical coordination',
        isSameCity ? 'Chauffeur service available' : 'VIP airport service',
        'Full medical insurance included'
      ],
      duration: '7 days 6 nights',
      hotelName: premiumHotelName,
      hotelStars: 5,
      flightClass: isSameCity ? 'vip-transport' : 'business',
      doctorId: selectedDoctor || undefined,
      hospitalId: selectedHospital || undefined,
      consultationDirection: consultationDirection || treatmentType || 'vip_consultation',
      examinationItems: examinationItems || 'vip_comprehensive_tests',
      surgeryTypes: surgeryTypes || (treatmentType === 'surgery' ? 'advanced_surgery' : undefined),
      treatmentDirection: treatmentDirection || (treatmentType === 'therapy' ? 'advanced_therapy' : undefined),
      rehabilitationDirection: rehabilitationDirection || (treatmentType === 'rehabilitation' ? 'vip_rehab' : undefined),
      medicalPlan: 'VIP medical plan with access to top specialists, cutting-edge diagnostic equipment, personalized treatment protocols, and comprehensive rehabilitation services.',
      isPriceValidated: true,
      priceAdjustmentStatus: 'pending' as const,
      priceAdjustmentAmount: 0,
    }
  ];

  // 计算总价
  return plans.map(plan => ({
    ...plan,
    totalAmount: plan.hotelFee + plan.flightFee + plan.carFee + plan.ticketFee + plan.reservationFee + plan.medicalFee
  }));
}

// 归一化方案数据，确保所有必需字段都存在
function normalizePlan(
  plan: any,
  isSameCity: boolean,
  hasMedicalSelection: boolean,
  numberOfPeople: number,
  selectedDoctor?: string,
  selectedHospital?: string,
  consultationDirection?: string,
  examinationItems?: string,
  surgeryTypes?: string,
  treatmentDirection?: string,
  rehabilitationDirection?: string,
  treatmentType?: string
): PlanOption {
  // 获取治疗类型，优先使用treatmentType参数，然后依次检查其他字段
  // 优先级：treatmentType > examinationItems > surgeryTypes > treatmentDirection > rehabilitationDirection > consultationDirection > 'consultation'
  let planTreatmentType = 'consultation';

  console.log(`[normalizePlan] START: treatmentType=${treatmentType}, examinationItems=${examinationItems}, surgeryTypes=${surgeryTypes}, treatmentDirection=${treatmentDirection}, rehabilitationDirection=${rehabilitationDirection}, consultationDirection=${consultationDirection}`);

  if (treatmentType && treatmentType !== 'consultation') {
    planTreatmentType = treatmentType;
    console.log(`[normalizePlan] Determined type from treatmentType: ${planTreatmentType}`);
  } else if (examinationItems && examinationItems !== 'not_applicable' && examinationItems !== 'basic_tests' && examinationItems !== 'recommended_tests') {
    planTreatmentType = 'examination';
    console.log(`[normalizePlan] Determined type from examinationItems: ${planTreatmentType}`);
  } else if (surgeryTypes && surgeryTypes !== undefined && surgeryTypes !== 'not_applicable' && surgeryTypes !== '') {
    planTreatmentType = 'surgery';
    console.log(`[normalizePlan] Determined type from surgeryTypes: ${planTreatmentType}`);
  } else if (treatmentDirection && treatmentDirection !== 'not_applicable' && treatmentDirection !== '') {
    planTreatmentType = 'therapy';
    console.log(`[normalizePlan] Determined type from treatmentDirection: ${planTreatmentType}`);
  } else if (rehabilitationDirection && rehabilitationDirection !== 'not_applicable' && rehabilitationDirection !== '') {
    planTreatmentType = 'rehabilitation';
    console.log(`[normalizePlan] Determined type from rehabilitationDirection: ${planTreatmentType}`);
  } else if (consultationDirection && consultationDirection !== 'general_consultation' && consultationDirection !== '') {
    planTreatmentType = 'consultation';
    console.log(`[normalizePlan] Determined type from consultationDirection: ${planTreatmentType}`);
  } else {
    console.log(`[normalizePlan] Defaulting to consultation type`);
  }

  // 根据治疗类型调整医疗费用（强制覆盖AI生成的数据）
  let adjustedMedicalSurgeryFee = 0;
  let adjustedMedicineFee = 0;
  let adjustedNursingFee = 0;
  let adjustedNutritionFee = 0;

  console.log(`[normalizePlan] Treatment type FINAL: ${planTreatmentType}`);
  console.log(`[normalizePlan] hasMedicalSelection: ${hasMedicalSelection}`);
  console.log(`[normalizePlan] Original fees - Surgery: ${plan.medicalSurgeryFee}, Medicine: ${plan.medicineFee}, Nursing: ${plan.nursingFee}, Nutrition: ${plan.nutritionFee}, Ticket: ${plan.ticketFee}`);

  // 强制根据治疗类型严格限制费用
  if (planTreatmentType === 'examination') {
    // 检查类型：强制清零手术费、护理费、营养费
    adjustedMedicalSurgeryFee = 0;
    adjustedNursingFee = 0;
    adjustedNutritionFee = 0;
    // 检查类型药费（如CT扫描的造影剂等），限制在合理范围（0-300）
    adjustedMedicineFee = Math.min(Math.max(plan.medicineFee || 0, 0), 300);
    console.log(`[normalizePlan] ✓ EXAMINATION TYPE: Forced Surgery=0, Nursing=0, Nutrition=0, Medicine=${adjustedMedicineFee}`);
  } else if (planTreatmentType === 'consultation') {
    // 咨询类型：强制清零手术费、护理费、营养费
    adjustedMedicalSurgeryFee = 0;
    adjustedNursingFee = 0;
    adjustedNutritionFee = 0;
    // 咨询类型药费较少（0-200）
    adjustedMedicineFee = Math.min(Math.max(plan.medicineFee || 0, 0), 200);
    console.log(`[normalizePlan] ✓ CONSULTATION TYPE: Forced Surgery=0, Nursing=0, Nutrition=0, Medicine=${adjustedMedicineFee}`);
  } else if (planTreatmentType === 'surgery') {
    // 手术类型：保留费用，但要确保合理性
    adjustedMedicalSurgeryFee = Math.max(plan.medicalSurgeryFee || 0, 0);
    adjustedMedicineFee = Math.max(plan.medicineFee || 0, 0);
    adjustedNursingFee = Math.max(plan.nursingFee || 0, 0);
    adjustedNutritionFee = Math.max(plan.nutritionFee || 0, 0);
    console.log(`[normalizePlan] ✓ SURGERY TYPE: Preserved fees - Surgery=${adjustedMedicalSurgeryFee}, Medicine=${adjustedMedicineFee}, Nursing=${adjustedNursingFee}, Nutrition=${adjustedNutritionFee}`);
  } else if (planTreatmentType === 'therapy') {
    // 治疗类型：强制清零手术费
    adjustedMedicalSurgeryFee = 0;
    adjustedMedicineFee = Math.max(plan.medicineFee || 0, 0);
    adjustedNursingFee = Math.max(plan.nursingFee || 0, 0);
    adjustedNutritionFee = Math.max(plan.nutritionFee || 0, 0);
    console.log(`[normalizePlan] ✓ THERAPY TYPE: Forced Surgery=0, kept other fees - Medicine=${adjustedMedicineFee}, Nursing=${adjustedNursingFee}, Nutrition=${adjustedNutritionFee}`);
  } else if (planTreatmentType === 'rehabilitation') {
    // 康复类型：强制清零手术费
    adjustedMedicalSurgeryFee = 0;
    adjustedMedicineFee = Math.max(plan.medicineFee || 0, 0);
    adjustedNursingFee = Math.max(plan.nursingFee || 0, 0);
    adjustedNutritionFee = Math.max(plan.nutritionFee || 0, 0);
    console.log(`[normalizePlan] ✓ REHABILITATION TYPE: Forced Surgery=0, kept other fees - Medicine=${adjustedMedicineFee}, Nursing=${adjustedNursingFee}, Nutrition=${adjustedNutritionFee}`);
  } else {
    // 默认类型：保守处理
    adjustedMedicalSurgeryFee = 0;
    adjustedMedicineFee = Math.min(Math.max(plan.medicineFee || 0, 0), 100);
    adjustedNursingFee = 0;
    adjustedNutritionFee = 0;
    console.log(`[normalizePlan] ✓ DEFAULT TYPE: Conservative fees - Surgery=0, Medicine=${adjustedMedicineFee}, Nursing=0, Nutrition=0`);
  }

  // 计算医疗总费用
  const adjustedMedicalFee = adjustedMedicalSurgeryFee + adjustedMedicineFee + adjustedNursingFee + adjustedNutritionFee;

  const defaultPlan = {
    name: 'Standard Plan',
    description: 'A comprehensive travel plan',
    hotelFee: 1000 * numberOfPeople,
    flightFee: isSameCity ? 0 : 800 * numberOfPeople,
    carFee: isSameCity ? 100 * numberOfPeople : 60 * numberOfPeople,
    ticketFee: 0, // 医疗旅游不包含门票
    reservationFee: 100,
    medicalSurgeryFee: hasMedicalSelection ? 3000 : 0,
    medicineFee: hasMedicalSelection ? 200 : 0,
    nursingFee: hasMedicalSelection ? 400 : 0,
    nutritionFee: hasMedicalSelection ? 100 : 0,
    medicalFee: hasMedicalSelection ? 3700 : 0,
    totalAmount: 0,
    highlights: ['Travel planning', 'Medical support', 'Translation service'],
    duration: '7 days 6 nights',
    hotelName: 'Comfort Hotel',
    hotelStars: 4,
    flightClass: isSameCity ? 'local-transportation' : 'economy',
    doctorId: undefined,
    hospitalId: undefined,
    consultationDirection: consultationDirection || 'general_consultation',
    examinationItems: examinationItems || 'basic_checkup',
    surgeryTypes: surgeryTypes,
    treatmentDirection: treatmentDirection,
    rehabilitationDirection: rehabilitationDirection,
    medicalPlan: 'Standard medical plan with comprehensive care.',
    isPriceValidated: true,
    priceAdjustmentStatus: 'pending' as const,
    priceAdjustmentAmount: 0,
  };

  const normalized: any = { ...defaultPlan };

  // 保留 AI 生成的值，但确保所有字段都存在
  if (plan.name) normalized.name = plan.name;
  if (plan.description) normalized.description = plan.description;
  if (plan.hotelFee !== undefined) normalized.hotelFee = Number(plan.hotelFee) || defaultPlan.hotelFee;
  if (plan.flightFee !== undefined) normalized.flightFee = Number(plan.flightFee) || defaultPlan.flightFee;
  if (plan.carFee !== undefined) normalized.carFee = Number(plan.carFee) || defaultPlan.carFee;

  // 强制设置ticketFee为0（医疗旅游不包含门票），忽略AI生成的任何值
  normalized.ticketFee = 0;
  if (plan.ticketFee && plan.ticketFee !== 0) {
    console.log(`[normalizePlan] ✓ FORCED: ticketFee was ${plan.ticketFee}, set to 0 (no tourist attractions)`);
  }

  if (plan.reservationFee !== undefined) normalized.reservationFee = Number(plan.reservationFee) || defaultPlan.reservationFee;

  // 使用调整后的医疗费用（根据治疗类型限制）
  normalized.medicalSurgeryFee = adjustedMedicalSurgeryFee;
  normalized.medicineFee = adjustedMedicineFee;
  normalized.nursingFee = adjustedNursingFee;
  normalized.nutritionFee = adjustedNutritionFee;
  normalized.medicalFee = adjustedMedicalFee;
  if (plan.highlights && Array.isArray(plan.highlights)) normalized.highlights = plan.highlights;
  if (plan.duration) normalized.duration = plan.duration;
  if (plan.hotelName) normalized.hotelName = plan.hotelName;
  if (plan.hotelStars !== undefined) normalized.hotelStars = Math.min(5, Math.max(1, Number(plan.hotelStars) || 4));
  if (plan.flightClass) normalized.flightClass = plan.flightClass;
  // 优先使用AI生成的doctorId和hospitalId，如果没有则使用传入的参数
  if (plan.doctorId) normalized.doctorId = plan.doctorId;
  else if (selectedDoctor) normalized.doctorId = selectedDoctor;

  if (plan.hospitalId) normalized.hospitalId = plan.hospitalId;
  else if (selectedHospital) normalized.hospitalId = selectedHospital;

  // 处理新的医疗方案字段
  if (plan.consultationDirection) normalized.consultationDirection = plan.consultationDirection;
  if (plan.examinationItems) normalized.examinationItems = plan.examinationItems;
  if (plan.surgeryTypes) normalized.surgeryTypes = plan.surgeryTypes;
  if (plan.treatmentDirection) normalized.treatmentDirection = plan.treatmentDirection;
  if (plan.rehabilitationDirection) normalized.rehabilitationDirection = plan.rehabilitationDirection;
  if (plan.medicalPlan) normalized.medicalPlan = plan.medicalPlan;
  if (plan.planAdjustments && Array.isArray(plan.planAdjustments)) normalized.planAdjustments = plan.planAdjustments;
  if (typeof plan.isPriceValidated === 'boolean') normalized.isPriceValidated = plan.isPriceValidated;
  if (plan.priceAdjustmentStatus && ['pending', 'approved', 'rejected'].includes(plan.priceAdjustmentStatus)) {
    normalized.priceAdjustmentStatus = plan.priceAdjustmentStatus;
  }
  if (typeof plan.priceAdjustmentAmount === 'number') normalized.priceAdjustmentAmount = plan.priceAdjustmentAmount;

  // 重新计算医疗费用（如果没有医疗服务，则所有医疗费用为0）
  if (!hasMedicalSelection) {
    normalized.medicalSurgeryFee = 0;
    normalized.medicineFee = 0;
    normalized.nursingFee = 0;
    normalized.nutritionFee = 0;
    normalized.medicalFee = 0;
    console.log(`[normalizePlan] ✓ NO MEDICAL SELECTION: All medical fees set to 0`);
  }

  // 重新计算总价
  normalized.totalAmount = normalized.hotelFee + normalized.flightFee + normalized.carFee + normalized.ticketFee + normalized.reservationFee + normalized.medicalFee;

  console.log(`[normalizePlan] ✓ FINAL: ticketFee=${normalized.ticketFee}, totalAmount=${normalized.totalAmount}`);

  // 重新计算医疗费用总和
  normalized.medicalFee =
    normalized.medicalSurgeryFee +
    normalized.medicineFee +
    normalized.nursingFee +
    normalized.nutritionFee;

  // 强制设置ticketFee为0（医疗旅游不包含门票）- 最后检查，确保没有被覆盖
  normalized.ticketFee = 0;

  // 计算总价
  normalized.totalAmount =
    normalized.hotelFee +
    normalized.flightFee +
    normalized.carFee +
    normalized.ticketFee +
    normalized.reservationFee +
    normalized.medicalFee;

  console.log(`[normalizePlan] Final totals - Hotel: ${normalized.hotelFee}, Flight: ${normalized.flightFee}, Car: ${normalized.carFee}, Ticket: ${normalized.ticketFee}, Reservation: ${normalized.reservationFee}, Medical: ${normalized.medicalFee}, Total: ${normalized.totalAmount}`);

  // 确保 id 字段存在
  normalized.id = plan.id || `plan-${Math.random().toString(36).substr(2, 9)}`;

  return normalized as PlanOption;
}
