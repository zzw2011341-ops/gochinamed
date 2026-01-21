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
  "flightClass": "${isSameCity ? 'local-transportation' : 'economy/business/first'}",
  "consultationDirection": "${body.consultationDirection || 'Based on treatment type'}",
  "examinationItems": "${body.examinationItems || 'Recommended tests'}",
  "surgeryTypes": "${body.surgeryTypes || 'Specific surgery type if applicable'}",
  "treatmentDirection": "${body.treatmentDirection || 'Treatment approach'}",
  "rehabilitationDirection": "${body.rehabilitationDirection || 'Rehabilitation focus if needed'}",
  "medicalPlan": "Detailed medical plan description",
  "isPriceValidated": true
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
        plans = generateDefaultPlans(
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
          body.rehabilitationDirection
        );
      }

      // 确保我们有3个方案
      if (!Array.isArray(plans) || plans.length !== 3) {
        plans = generateDefaultPlans(
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
          body.rehabilitationDirection
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
          body.rehabilitationDirection
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
      let defaultPlans = generateDefaultPlans(
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
        body.rehabilitationDirection
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
          body.rehabilitationDirection
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

// 生成默认方案（当AI不可用时）
function generateDefaultPlans(
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
  rehabilitationDirection?: string
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
  const budgetFlightFee = isSameCity ? 0 : 600 * numberOfPeople;
  const standardFlightFee = isSameCity ? 0 : 900 * numberOfPeople;
  const premiumFlightFee = isSameCity ? 0 : 1500 * numberOfPeople;

  const budgetCarFee = isSameCity ? 80 * numberOfPeople : 50 * numberOfPeople;
  const standardCarFee = isSameCity ? 120 * numberOfPeople : 80 * numberOfPeople;
  const premiumCarFee = isSameCity ? 180 * numberOfPeople : 100 * numberOfPeople;

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
        isSameCity ? 'Local taxi transportation' : 'Economy class flights',
        ...hasMedicalSelection ? ['Essential medical consultation'] : [],
        'Basic tourist attractions included',
        'Standard appointment booking'
      ],
      duration: '7 days 6 nights',
      hotelName: 'City Comfort Hotel',
      hotelStars: 3,
      flightClass: isSameCity ? 'local-transportation' : 'economy',
      doctorId: selectedDoctor || undefined,
      hospitalId: selectedHospital || undefined,
      consultationDirection: consultationDirection || treatmentType || 'general_consultation',
      examinationItems: examinationItems || 'basic_checkup',
      surgeryTypes: surgeryTypes || (treatmentType === 'surgery' ? 'general_surgery' : undefined),
      treatmentDirection: treatmentDirection || (treatmentType === 'therapy' ? 'physical_therapy' : undefined),
      rehabilitationDirection: rehabilitationDirection || (treatmentType === 'rehabilitation' ? 'post_surgery' : undefined),
      medicalPlan: 'Basic medical plan focusing on essential treatments and follow-up care.',
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
        isSameCity ? 'Premium car service' : 'Standard class flights',
        ...hasMedicalSelection ? ['Comprehensive medical checkup'] : [],
        'Premium tourist attractions',
        '24/7 translation service',
        'Priority appointment booking'
      ],
      duration: '7 days 6 nights',
      hotelName: 'Grand Medical Hotel',
      hotelStars: 4,
      flightClass: isSameCity ? 'premium-transport' : 'standard',
      doctorId: selectedDoctor || undefined,
      hospitalId: selectedHospital || undefined,
      consultationDirection: consultationDirection || treatmentType || 'comprehensive_consultation',
      examinationItems: examinationItems || 'comprehensive_tests',
      surgeryTypes: surgeryTypes || (treatmentType === 'surgery' ? 'specialized_surgery' : undefined),
      treatmentDirection: treatmentDirection || (treatmentType === 'therapy' ? 'comprehensive_therapy' : undefined),
      rehabilitationDirection: rehabilitationDirection || (treatmentType === 'rehabilitation' ? 'comprehensive_rehab' : undefined),
      medicalPlan: 'Comprehensive medical plan including specialist consultation, detailed examinations, and personalized treatment protocols.',
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
        isSameCity ? 'VIP private car service' : 'Business class flights',
        ...hasMedicalSelection ? ['Specialist consultation & treatment'] : [],
        'Exclusive tourist experiences',
        'Personal medical assistant',
        isSameCity ? 'Chauffeur service available' : 'VIP airport service',
        'Full medical insurance included',
        'VIP appointment booking'
      ],
      duration: '7 days 6 nights',
      hotelName: 'Royal Wellness Resort',
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
  rehabilitationDirection?: string
): PlanOption {
  const defaultPlan = {
    name: 'Standard Plan',
    description: 'A comprehensive travel plan',
    hotelFee: 1000 * numberOfPeople,
    flightFee: isSameCity ? 0 : 800 * numberOfPeople,
    carFee: isSameCity ? 100 * numberOfPeople : 60 * numberOfPeople,
    ticketFee: 50 * numberOfPeople,
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
  if (plan.ticketFee !== undefined) normalized.ticketFee = Number(plan.ticketFee) || defaultPlan.ticketFee;
  if (plan.reservationFee !== undefined) normalized.reservationFee = Number(plan.reservationFee) || defaultPlan.reservationFee;
  if (plan.medicalSurgeryFee !== undefined) normalized.medicalSurgeryFee = Number(plan.medicalSurgeryFee) || defaultPlan.medicalSurgeryFee;
  if (plan.medicineFee !== undefined) normalized.medicineFee = Number(plan.medicineFee) || defaultPlan.medicineFee;
  if (plan.nursingFee !== undefined) normalized.nursingFee = Number(plan.nursingFee) || defaultPlan.nursingFee;
  if (plan.nutritionFee !== undefined) normalized.nutritionFee = Number(plan.nutritionFee) || defaultPlan.nutritionFee;
  if (plan.medicalFee !== undefined) normalized.medicalFee = Number(plan.medicalFee) || defaultPlan.medicalFee;
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
  }

  // 重新计算医疗费用总和
  normalized.medicalFee =
    normalized.medicalSurgeryFee +
    normalized.medicineFee +
    normalized.nursingFee +
    normalized.nutritionFee;

  // 计算总价
  normalized.totalAmount =
    normalized.hotelFee +
    normalized.flightFee +
    normalized.carFee +
    normalized.ticketFee +
    normalized.reservationFee +
    normalized.medicalFee;

  // 确保 id 字段存在
  normalized.id = plan.id || `plan-${Math.random().toString(36).substr(2, 9)}`;

  return normalized as PlanOption;
}
