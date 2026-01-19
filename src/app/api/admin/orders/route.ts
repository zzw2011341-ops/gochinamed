import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, users, doctors, hospitals, itineraries, payments } from '@/storage/database/shared/schema';
import { eq, like, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// 验证schema
const updateOrderSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'confirmed', 'processing', 'completed', 'cancelled']).optional(),
  doctorAppointmentStatus: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  serviceReservationStatus: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  notes: z.string().optional(),
});

/**
 * GET - 获取所有订单
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDb();

    // 构建查询条件
    const conditions = [];
    if (status) {
      conditions.push(eq(orders.status, status));
    }
    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }
    if (search) {
      conditions.push(
        like(orders.id, `%${search}%`)
      );
    }

    // 查询订单
    let ordersList;
    if (conditions.length > 0) {
      ordersList = await db.query.orders.findMany({
        where: conditions.length === 1 ? conditions[0] : conditions.reduce((acc, cond) => acc && cond),
        orderBy: [desc(orders.createdAt)],
        limit,
        offset,
      });
    } else {
      ordersList = await db.query.orders.findMany({
        orderBy: [desc(orders.createdAt)],
        limit,
        offset,
      });
    }

    // 获取关联数据
    const enrichedOrders = await Promise.all(
      ordersList.map(async (order: any) => {
        const user = await db.query.users.findFirst({
          where: eq(users.id, order.userId),
        });

        const doctor = order.doctorId
          ? await db.query.doctors.findFirst({
              where: eq(doctors.id, order.doctorId),
            })
          : null;

        const hospital = order.hospitalId
          ? await db.query.hospitals.findFirst({
              where: eq(hospitals.id, order.hospitalId),
            })
          : null;

        const itinerariesList = await db.query.itineraries.findMany({
          where: eq(itineraries.orderId, order.id),
        });

        const paymentsList = await db.query.payments.findMany({
          where: eq(payments.orderId, order.id),
        });

        return {
          id: order.id,
          userId: order.userId,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
          userPhone: user?.phone || '',
          doctorId: order.doctorId,
          doctorName: doctor?.nameEn || '',
          hospitalId: order.hospitalId,
          hospitalName: hospital?.nameEn || '',
          status: order.status,
          doctorAppointmentStatus: order.doctorAppointmentStatus,
          doctorAppointmentDate: order.doctorAppointmentDate,
          serviceReservationStatus: order.serviceReservationStatus,
          medicalFee: order.medicalFee ? Number(order.medicalFee) : 0,
          hotelFee: order.hotelFee ? Number(order.hotelFee) : 0,
          flightFee: order.flightFee ? Number(order.flightFee) : 0,
          ticketFee: order.ticketFee ? Number(order.ticketFee) : 0,
          subtotal: order.subtotal ? Number(order.subtotal) : 0,
          serviceFeeAmount: order.serviceFeeAmount ? Number(order.serviceFeeAmount) : 0,
          totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
          currency: order.currency,
          notes: order.notes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          itineraryCount: itinerariesList.length,
          paymentCount: paymentsList.length,
        };
      })
    );

    // 获取总数
    const totalOrders = await db.select({ count: orders.id }).from(orders);

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      total: totalOrders.length,
    });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新订单信息
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const db = await getDb();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.doctorAppointmentStatus !== undefined) updateData.doctorAppointmentStatus = validatedData.doctorAppointmentStatus;
    if (validatedData.serviceReservationStatus !== undefined) updateData.serviceReservationStatus = validatedData.serviceReservationStatus;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const updated = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, validatedData.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updated[0],
    });
  } catch (error) {
    console.error('Failed to update order:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
