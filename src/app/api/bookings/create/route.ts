import { NextRequest, NextResponse } from 'next/server';
import { calculateFlightCostUSD } from '@/lib/services/flightPricingLocal';

interface PlanOption {
  id: string;
  name: string;
  description: string;
  hotelFee: number;
  flightFee: number;
  carFee: number;
  ticketFee: number;
  reservationFee: number;
  medicalSurgeryFee: number;
  medicineFee: number;
  nursingFee: number;
  nutritionFee: number;
  medicalFee: number;
  totalAmount: number;
  highlights: string[];
  duration: string;
  hotelName: string;
  hotelStars: number;
  flightClass: string;
  consultationDirection?: string;
  examinationItems?: string;
  surgeryTypes?: string;
  treatmentDirection?: string;
  rehabilitationDirection?: string;
  medicalPlan?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      originCity,
      destinationCity,
      travelDate,
      treatmentType = 'consultation',
      numberOfPeople = '1',
      budget = '3000',
    } = body;

    if (!originCity || !destinationCity || !travelDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isSameCity = originCity === destinationCity;
    const numPeople = parseInt(numberOfPeople) || 1;

    // 简单生成3个方案
    const plans: PlanOption[] = [
      {
        id: 'budget',
        name: 'Budget Plan',
        description: 'Economical option for budget travelers',
        hotelFee: 700 * numPeople,
        flightFee: isSameCity ? 0 : (await calculateFlightCostUSD(originCity, destinationCity, 'economy', numPeople)).typicalPrice,
        carFee: 50 * numPeople,
        ticketFee: 0,
        reservationFee: 50,
        medicalSurgeryFee: 0,
        medicineFee: 200,
        nursingFee: 0,
        nutritionFee: 0,
        medicalFee: 200,
        totalAmount: 0,
        highlights: ['Budget hotel', 'Economy flight', 'Basic medical'],
        duration: '7 days',
        hotelName: 'Budget Hotel',
        hotelStars: 3,
        flightClass: isSameCity ? 'local-transport' : 'economy',
        consultationDirection: 'general',
        medicalPlan: 'Basic medical consultation',
      },
      {
        id: 'standard',
        name: 'Standard Plan',
        description: 'Balanced option with good value',
        hotelFee: 1050 * numPeople,
        flightFee: isSameCity ? 0 : (await calculateFlightCostUSD(originCity, destinationCity, 'business', numPeople)).typicalPrice,
        carFee: 80 * numPeople,
        ticketFee: 0,
        reservationFee: 100,
        medicalSurgeryFee: 0,
        medicineFee: 400,
        nursingFee: 200,
        nutritionFee: 100,
        medicalFee: 700,
        totalAmount: 0,
        highlights: ['Standard hotel', 'Business flight', 'Standard medical'],
        duration: '7 days',
        hotelName: 'Standard Hotel',
        hotelStars: 4,
        flightClass: isSameCity ? 'local-transport' : 'business',
        consultationDirection: treatmentType,
        medicalPlan: 'Standard medical services',
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        description: 'Luxury option for premium experience',
        hotelFee: 1500 * numPeople,
        flightFee: isSameCity ? 0 : (await calculateFlightCostUSD(originCity, destinationCity, 'first', numPeople)).typicalPrice,
        carFee: 100 * numPeople,
        ticketFee: 0,
        reservationFee: 200,
        medicalSurgeryFee: 0,
        medicineFee: 800,
        nursingFee: 500,
        nutritionFee: 300,
        medicalFee: 1600,
        totalAmount: 0,
        highlights: ['Luxury hotel', 'First class flight', 'Premium medical'],
        duration: '7 days',
        hotelName: 'Luxury Hotel',
        hotelStars: 5,
        flightClass: isSameCity ? 'local-transport' : 'first',
        consultationDirection: treatmentType,
        medicalPlan: 'Comprehensive medical services',
      }
    ];

    // 计算 totalAmount
    const budgetNum = parseInt(budget) || 3000;
    for (const plan of plans) {
      plan.totalAmount = plan.hotelFee + plan.flightFee + plan.carFee + plan.ticketFee + plan.reservationFee + plan.medicalFee;
      // 如果总费用超过预算，标记超出预算
      if (budgetNum > 0 && plan.totalAmount > budgetNum) {
        plan.highlights.push('Over budget by $' + (plan.totalAmount - budgetNum));
      }
    }

    // 返回请求数据，供后续页面使用
    const requestData = {
      originCity,
      destinationCity,
      travelDate,
      treatmentType,
      numberOfPeople,
      budget,
      selectedHospital: body.selectedHospital || '',
      selectedDoctor: body.selectedDoctor || '',
      consultationDirection: body.consultationDirection || '',
      examinationItems: body.examinationItems || '',
      surgeryTypes: body.surgeryTypes || '',
      treatmentDirection: body.treatmentDirection || '',
      rehabilitationDirection: body.rehabilitationDirection || '',
    };

    return NextResponse.json({
      success: true,
      plans,
      requestData,
    });

  } catch (error) {
    console.error('Error creating plans:', error);
    return NextResponse.json(
      { error: 'Failed to generate plans' },
      { status: 500 }
    );
  }
}
