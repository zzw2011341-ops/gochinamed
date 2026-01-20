import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

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

    // 验证必需字段
    if (!userId || !originCity || !destinationCity || !travelDate) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, originCity, destinationCity, travelDate' },
        { status: 400 }
      );
    }

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
    const hasMedicalSelection = selectedHospital || selectedDoctor || treatmentType;
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

    const prompt = `You are a medical tourism consultant. Generate 3 different travel plan options for a patient.

User Details:
- Origin City: ${originCity}
- Destination City: ${destinationCity}
- Travel Date: ${travelDate}
- Treatment Type: ${treatmentType || 'General Consultation'}
- Budget: $${budget || 'Not specified'}
- Number of Travelers: ${numberOfPeople}
${weatherPrompt}
- ${hasMedicalSelection ? 'Selected Doctor/Hospital: Yes' : 'Selected Doctor/Hospital: No'}
- ${isSameCity ? '⚠️ IMPORTANT: Same-city travel (origin and destination are the same)' : 'Different-city travel'}
${exchangeRates ? `Currency rates (USD-based): CNY=${exchangeRates.CNY}, EUR=${exchangeRates.EUR}, GBP=${exchangeRates.GBP}\n` : ''}

Please generate 3 distinct options with different price points and features:
1. Budget-Friendly Option (Basic hotel, economy flight, essential services)
2. Standard Option (Mid-range hotel, standard flight, good services)
3. Premium Option (Luxury hotel, business class flight, comprehensive services)

For each option, provide a JSON object with this structure:
{
  "name": "Option Name (e.g., Budget-Friendly Plan)",
  "description": "Brief description of what this plan offers",
  "hotelFee": number (100-500 per night * 7 days * ${numberOfPeople} travelers),
  "flightFee": number (${isSameCity ? '0 for same-city travel' : '500-2000 * ${numberOfPeople} travelers'}),
  "carFee": number (${isSameCity ? '50-200 for local transportation' : '30-100 for local airport-hotel transfers'}),
  "ticketFee": number (20-100 for tourist attractions),
  "reservationFee": number (50-200 for appointment booking),
  "medicalSurgeryFee": number (${hasMedicalSelection ? '2000-10000' : '0'}),
  "medicineFee": number (${hasMedicalSelection ? '100-500' : '0'}),
  "nursingFee": number (${hasMedicalSelection ? '200-800' : '0'}),
  "nutritionFee": number (${hasMedicalSelection ? '50-300' : '0'}),
  "medicalFee": number (sum of medicalSurgeryFee + medicineFee + nursingFee + nutritionFee, set to 0 if no doctor/hospital selected),
  "totalAmount": number (sum of hotelFee + flightFee + carFee + ticketFee + reservationFee + medicalFee),
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "duration": "e.g., 7 days 6 nights",
  "hotelName": "Hotel name",
  "hotelStars": number (1-5),
  "flightClass": "${isSameCity ? 'local-transportation' : 'economy/business/first'}"
}

${!hasMedicalSelection ? 'IMPORTANT: Since no doctor or hospital was selected, set all medical fees (medicalSurgeryFee, medicineFee, nursingFee, nutritionFee, medicalFee) to 0 for all plans.' : ''}
${isSameCity ? 'CRITICAL: Since origin and destination are the same city, set flightFee to 0. Use carFee for local transportation (taxi/car rental).' : ''}

Return ONLY the JSON array with 3 options, no additional text.`;

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
        plans = generateDefaultPlans(budget, treatmentType, selectedHospital, selectedDoctor, numberOfPeople);
      }

      // 确保我们有3个方案
      if (!Array.isArray(plans) || plans.length !== 3) {
        plans = generateDefaultPlans(budget, treatmentType, selectedHospital, selectedDoctor, numberOfPeople, isSameCity);
      }

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
      const defaultPlans = generateDefaultPlans(budget, treatmentType, selectedHospital, selectedDoctor, numberOfPeople, isSameCity);
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

// 生成默认方案（当AI不可用时）
function generateDefaultPlans(
  budget: string,
  treatmentType: string,
  selectedHospital?: string,
  selectedDoctor?: string,
  numberOfPeople: number = 1,
  isSameCity: boolean = false
): PlanOption[] {
  const baseBudget = parseFloat(budget) || 3000;
  const hasMedicalSelection = selectedHospital || selectedDoctor;

  // 医疗费用详细分类
  const medicalSurgeryFeeBase = hasMedicalSelection ? 2000 : 0;
  const medicineFeeBase = hasMedicalSelection ? 150 : 0;
  const nursingFeeBase = hasMedicalSelection ? 300 : 0;
  const nutritionFeeBase = hasMedicalSelection ? 80 : 0;
  const medicalFeeBase = medicalSurgeryFeeBase + medicineFeeBase + nursingFeeBase + nutritionFeeBase;

  // 同城旅行使用交通费用，不同城市使用机票费用
  const transportationFee = isSameCity;
  const budgetFlightFee = transportationFee ? 0 : 600 * numberOfPeople;
  const standardFlightFee = transportationFee ? 0 : 900 * numberOfPeople;
  const premiumFlightFee = transportationFee ? 0 : 1500 * numberOfPeople;

  const budgetCarFee = transportationFee ? 80 * numberOfPeople : 50 * numberOfPeople;
  const standardCarFee = transportationFee ? 120 * numberOfPeople : 80 * numberOfPeople;
  const premiumCarFee = transportationFee ? 180 * numberOfPeople : 100 * numberOfPeople;

  const plans = [
    {
      id: 'budget',
      name: 'Budget-Friendly Plan',
      description: 'Economical option with essential services for budget-conscious travelers',
      hotelFee: 700 * numberOfPeople,
      flightFee: budgetFlightFee,
      carFee: budgetCarFee,
      ticketFee: 30 * numberOfPeople,
      reservationFee: 50,
      medicalSurgeryFee: medicalSurgeryFeeBase,
      medicineFee: medicineFeeBase,
      nursingFee: nursingFeeBase,
      nutritionFee: nutritionFeeBase,
      medicalFee: medicalFeeBase,
      totalAmount: 0, // 稍后计算
      highlights: [
        'Basic 3-star hotel accommodation',
        transportationFee ? 'Local taxi transportation' : 'Economy class flights',
        ...hasMedicalSelection ? ['Essential medical consultation'] : [],
        'Basic tourist attractions included',
        'Standard appointment booking'
      ],
      duration: '7 days 6 nights',
      hotelName: 'City Comfort Hotel',
      hotelStars: 3,
      flightClass: transportationFee ? 'local-transportation' : 'economy'
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      description: 'Balanced option with quality services and good comfort',
      hotelFee: 1050 * numberOfPeople,
      flightFee: standardFlightFee,
      carFee: standardCarFee,
      ticketFee: 60 * numberOfPeople,
      reservationFee: 100,
      medicalSurgeryFee: medicalSurgeryFeeBase + 1000,
      medicineFee: medicineFeeBase + 50,
      nursingFee: nursingFeeBase + 100,
      nutritionFee: nutritionFeeBase + 30,
      medicalFee: medicalFeeBase + 1180,
      totalAmount: 0, // 稍后计算
      highlights: [
        '4-star hotel near hospital',
        transportationFee ? 'Premium car service' : 'Standard class flights',
        ...hasMedicalSelection ? ['Comprehensive medical checkup'] : [],
        'Premium tourist attractions',
        '24/7 translation service',
        'Priority appointment booking'
      ],
      duration: '7 days 6 nights',
      hotelName: 'Grand Medical Hotel',
      hotelStars: 4,
      flightClass: transportationFee ? 'premium-transport' : 'standard'
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      description: 'Luxury option with top-tier services and maximum comfort',
      hotelFee: 1750 * numberOfPeople,
      flightFee: premiumFlightFee,
      carFee: premiumCarFee,
      ticketFee: 100 * numberOfPeople,
      reservationFee: 200,
      medicalSurgeryFee: medicalSurgeryFeeBase + 3000,
      medicineFee: medicineFeeBase + 150,
      nursingFee: nursingFeeBase + 200,
      nutritionFee: nutritionFeeBase + 100,
      medicalFee: medicalFeeBase + 3450,
      totalAmount: 0, // 稍后计算
      highlights: [
        '5-star luxury hotel with wellness center',
        transportationFee ? 'VIP private car service' : 'Business class flights',
        ...hasMedicalSelection ? ['Specialist consultation & treatment'] : [],
        'Exclusive tourist experiences',
        'Personal medical assistant',
        transportationFee ? 'Chauffeur service available' : 'VIP airport service',
        'Full medical insurance included',
        'VIP appointment booking'
      ],
      duration: '7 days 6 nights',
      hotelName: 'Royal Wellness Resort',
      hotelStars: 5,
      flightClass: transportationFee ? 'vip-transport' : 'business'
    }
  ];

  // 计算总价
  return plans.map(plan => ({
    ...plan,
    totalAmount: plan.hotelFee + plan.flightFee + plan.carFee + plan.ticketFee + plan.reservationFee + plan.medicalFee
  }));
}
