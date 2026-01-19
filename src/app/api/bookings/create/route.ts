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
  selectedHospital?: string;
  selectedDoctor?: string;
  treatmentType: string;
  budget: string;
}

interface PlanOption {
  id: string;
  name: string;
  description: string;
  medicalFee: number;
  hotelFee: number;
  flightFee: number;
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

    // 使用AI生成三个不同的方案
    const hasMedicalSelection = selectedHospital || selectedDoctor;
    const numberOfPeople = parseInt(body.numberOfPeople || '1') || 1;

    const prompt = `You are a medical tourism consultant. Generate 3 different travel plan options for a patient.

User Details:
- Origin City: ${originCity}
- Destination City: ${destinationCity}
- Travel Date: ${travelDate}
- Treatment Type: ${treatmentType || 'General Consultation'}
- Budget: $${budget || 'Not specified'}
- Number of Travelers: ${numberOfPeople}
- ${hasMedicalSelection ? 'Selected Doctor/Hospital: Yes' : 'Selected Doctor/Hospital: No'}

Please generate 3 distinct options with different price points and features:
1. Budget-Friendly Option (Basic hotel, economy flight, essential services)
2. Standard Option (Mid-range hotel, standard flight, good services)
3. Premium Option (Luxury hotel, business class flight, comprehensive services)

For each option, provide a JSON object with this structure:
{
  "name": "Option Name (e.g., Budget-Friendly Plan)",
  "description": "Brief description of what this plan offers",
  "medicalFee": number (${hasMedicalSelection ? '500-3000' : '0'} - set to 0 if no doctor/hospital selected),
  "hotelFee": number (100-500 per night * 7 days * ${numberOfPeople} travelers),
  "flightFee": number (500-2000 * ${numberOfPeople} travelers),
  "totalAmount": number (sum of all fees),
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "duration": "e.g., 7 days 6 nights",
  "hotelName": "Hotel name",
  "hotelStars": number (1-5),
  "flightClass": "economy/business/first"
}

${!hasMedicalSelection ? 'IMPORTANT: Since no doctor or hospital was selected, set medicalFee to 0 for all plans.' : ''}

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
        plans = generateDefaultPlans(budget, treatmentType, selectedHospital, selectedDoctor, numberOfPeople);
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
          selectedHospital,
          selectedDoctor,
          treatmentType,
        },
      });

    } catch (aiError) {
      console.error('AI generation failed, using default plans:', aiError);
      // AI生成失败时使用默认方案
      const defaultPlans = generateDefaultPlans(budget, treatmentType, selectedHospital, selectedDoctor, numberOfPeople);
      return NextResponse.json({
        success: true,
        plans: defaultPlans,
        requestData: {
          userId,
          originCity,
          destinationCity,
          travelDate,
          numberOfPeople: numberOfPeople.toString(),
          selectedHospital,
          selectedDoctor,
          treatmentType,
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
  numberOfPeople: number = 1
): PlanOption[] {
  const baseBudget = parseFloat(budget) || 3000;
  const hasMedicalSelection = selectedHospital || selectedDoctor;

  // 如果没有选择医生/医院，医疗费用为0
  const medicalFeeBase = hasMedicalSelection ? 800 : 0;

  const plans = [
    {
      id: 'budget',
      name: 'Budget-Friendly Plan',
      description: 'Economical option with essential services for budget-conscious travelers',
      medicalFee: medicalFeeBase,
      hotelFee: 700 * numberOfPeople,
      flightFee: 600 * numberOfPeople,
      totalAmount: 0, // 稍后计算
      highlights: [
        'Basic 3-star hotel accommodation',
        'Economy class flights',
        ...hasMedicalSelection ? ['Essential medical consultation'] : [],
        'Local transportation included'
      ],
      duration: '7 days 6 nights',
      hotelName: 'City Comfort Hotel',
      hotelStars: 3,
      flightClass: 'economy'
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      description: 'Balanced option with quality services and good comfort',
      medicalFee: medicalFeeBase + 400,
      hotelFee: 1050 * numberOfPeople,
      flightFee: 900 * numberOfPeople,
      totalAmount: 0, // 稍后计算
      highlights: [
        '4-star hotel near hospital',
        'Standard class flights',
        ...hasMedicalSelection ? ['Comprehensive medical checkup'] : [],
        '24/7 translation service',
        'Airport transfers included'
      ],
      duration: '7 days 6 nights',
      hotelName: 'Grand Medical Hotel',
      hotelStars: 4,
      flightClass: 'standard'
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      description: 'Luxury option with top-tier services and maximum comfort',
      medicalFee: medicalFeeBase + 1200,
      hotelFee: 1750 * numberOfPeople,
      flightFee: 1500 * numberOfPeople,
      totalAmount: 0, // 稍后计算
      highlights: [
        '5-star luxury hotel with wellness center',
        'Business class flights',
        ...hasMedicalSelection ? ['Specialist consultation & treatment'] : [],
        'Personal medical assistant',
        'VIP airport service',
        'Full medical insurance included'
      ],
      duration: '7 days 6 nights',
      hotelName: 'Royal Wellness Resort',
      hotelStars: 5,
      flightClass: 'business'
    }
  ];

  // 计算总价
  return plans.map(plan => ({
    ...plan,
    totalAmount: plan.medicalFee + plan.hotelFee + plan.flightFee
  }));
}
