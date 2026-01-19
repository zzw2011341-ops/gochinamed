import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries, users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

interface PaymentRequest {
  userId: string;
  plan: {
    id: string;
    name: string;
    totalAmount: number;
    medicalFee: number;
    hotelFee: number;
    flightFee: number;
  };
  payment: {
    cardNumber: string;
    cardName: string;
    expiryDate: string;
    cvv: string;
  };
  documents: {
    passportNumber: string;
    passportCountry: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const {
      userId,
      plan,
      payment,
      documents: { passportNumber, passportCountry },
    } = body;

    // 验证必需字段
    if (!userId || !plan || !payment || !passportNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 模拟支付处理（实际项目中应该集成真实的支付网关）
    // 这里我们假设支付总是成功的
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 获取用户的预订信息（从session或其他地方）
    // 这里我们使用plan信息来创建订单
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 7); // 默认7天后

    // 计算服务费
    const subtotal = plan.medicalFee + plan.hotelFee + plan.flightFee;
    const serviceFeeRate = 0.05;
    const serviceFeeAmount = subtotal * serviceFeeRate;
    const totalAmount = subtotal + serviceFeeAmount;

    // 创建订单
    const [order] = await db.insert(orders).values({
      userId,
      status: 'confirmed',
      medicalFee: plan.medicalFee.toString(),
      hotelFee: plan.hotelFee.toString(),
      flightFee: plan.flightFee.toString(),
      subtotal: subtotal.toString(),
      serviceFeeRate: serviceFeeRate.toString(),
      serviceFeeAmount: serviceFeeAmount.toString(),
      totalAmount: totalAmount.toString(),
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // 创建行程记录
    await db.insert(itineraries).values([
      {
        orderId: order.id,
        type: 'flight',
        name: `International Flight`,
        description: `${plan.name} - International flight booking`,
        startDate: travelDate,
        status: 'confirmed',
        price: plan.flightFee.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderId: order.id,
        type: 'medical',
        name: 'Medical Consultation',
        description: `${plan.name} - Medical consultation included`,
        startDate: travelDate,
        status: 'confirmed',
        price: plan.medicalFee.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderId: order.id,
        type: 'hotel',
        name: 'Hotel Accommodation',
        description: `${plan.name} - Hotel accommodation`,
        startDate: travelDate,
        endDate: new Date(travelDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'confirmed',
        price: plan.hotelFee.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 更新用户的证件信息
    await db.update(users)
      .set({
        passportNumber,
        passportCountry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Payment successful. Booking confirmed.',
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
