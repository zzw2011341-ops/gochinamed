import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { serviceReservations, itineraries, orders } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// 验证schema
const reservationSchema = z.object({
  orderId: z.string(),
  itineraryId: z.string().optional(),
  type: z.enum(['flight', 'train', 'hotel', 'car_rental', 'ticket', 'visa', 'insurance']),
  providerName: z.string(),
  providerReference: z.string(),
  price: z.number(),
  currency: z.string().default('USD'),
  details: z.any().optional(),
  remarks: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = reservationSchema.parse(body);

    const db = await getDb();

    // 查询订单信息
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, validatedData.orderId),
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // 创建服务预订记录
    const reservationId = uuidv4();
    const now = new Date();

    const reservation = await db.insert(serviceReservations).values({
      id: reservationId,
      orderId: validatedData.orderId,
      itineraryId: validatedData.itineraryId,
      type: validatedData.type,
      providerName: validatedData.providerName,
      providerReference: validatedData.providerReference,
      status: 'confirmed',
      reservationDate: now,
      confirmationDate: now,
      price: validatedData.price,
      currency: validatedData.currency,
      details: validatedData.details,
      remarks: validatedData.remarks,
      notificationSent: false,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // 更新对应的itinerary记录
    if (validatedData.itineraryId) {
      await db
        .update(itineraries)
        .set({
          status: 'confirmed',
          bookingConfirmation: validatedData.providerReference,
          updatedAt: now,
        })
        .where(eq(itineraries.id, validatedData.itineraryId));
    }

    // TODO: 发送预订确认通知（邮件/短信）
    // await sendReservationConfirmation(order.userId, reservation[0]);

    return NextResponse.json({
      success: true,
      message: 'Service reservation confirmed successfully',
      reservation: reservation[0],
    });
  } catch (error) {
    console.error('Failed to create service reservation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create service reservation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 查询订单的所有服务预订
    const reservations = await db.query.serviceReservations.findMany({
      where: eq(serviceReservations.orderId, orderId),
    });

    return NextResponse.json({
      success: true,
      reservations,
    });
  } catch (error) {
    console.error('Failed to fetch service reservations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service reservations' },
      { status: 500 }
    );
  }
}
