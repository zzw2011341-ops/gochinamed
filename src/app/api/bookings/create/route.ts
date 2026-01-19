import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries, users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      originCity,
      destinationCity,
      travelDate,
      selectedHospital,
      selectedDoctor,
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

    // 计算预估费用
    const medicalFee = selectedDoctor ? 1000 : 500;
    const hotelFee = 150;
    const flightFee = 800;
    const subtotal = medicalFee + hotelFee + flightFee;
    const serviceFeeRate = 0.05;
    const serviceFeeAmount = Number(subtotal) * serviceFeeRate;
    const totalAmount = Number(subtotal) + serviceFeeAmount;

    // 创建订单
    const [order] = await db.insert(orders).values({
      userId,
      doctorId: selectedDoctor || null,
      hospitalId: selectedHospital || null,
      status: 'pending',
      medicalFee: medicalFee.toString(),
      hotelFee: hotelFee.toString(),
      flightFee: flightFee.toString(),
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
        name: `${originCity} → ${destinationCity}`,
        description: `Flight from ${originCity} to ${destinationCity}`,
        startDate: new Date(travelDate),
        status: 'pending',
        price: flightFee.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderId: order.id,
        type: 'medical',
        name: treatmentType || 'Medical Consultation',
        description: selectedDoctor ? `Consultation with doctor` : 'Medical treatment',
        startDate: new Date(travelDate),
        status: 'pending',
        price: medicalFee.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderId: order.id,
        type: 'hotel',
        name: 'Hotel Accommodation',
        description: `Hotel in ${destinationCity}`,
        startDate: new Date(travelDate),
        status: 'pending',
        price: hotelFee.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 更新用户的旅行偏好
    await db.update(users)
      .set({
        originCity,
        destinationCity,
        budget: budget || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Booking created successfully',
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
