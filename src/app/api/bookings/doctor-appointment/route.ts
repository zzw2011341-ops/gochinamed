import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, doctors } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// 验证schema
const appointmentSchema = z.object({
  orderId: z.string(),
  doctorId: z.string(),
  appointmentDate: z.string().datetime(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = appointmentSchema.parse(body);

    const db = await getDb();

    // 查询订单信息
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.id, validatedData.orderId))
      .limit(1);

    const order = orderList[0];
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // 查询医生信息
    const doctorList = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, validatedData.doctorId))
      .limit(1);

    const doctor = doctorList[0];
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // 更新订单的医生预约状态和预约日期
    const updatedOrder = await db
      .update(orders)
      .set({
        doctorId: validatedData.doctorId,
        doctorAppointmentStatus: 'confirmed',
        doctorAppointmentDate: new Date(validatedData.appointmentDate),
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, validatedData.orderId))
      .returning();

    // TODO: 发送预约确认通知（邮件/短信）
    // await sendAppointmentConfirmation(order.userId, doctor, appointmentDate);

    return NextResponse.json({
      success: true,
      message: 'Doctor appointment confirmed successfully',
      appointment: {
        orderId: updatedOrder[0].id,
        doctorId: updatedOrder[0].doctorId,
        doctorName: doctor.nameEn,
        appointmentDate: updatedOrder[0].doctorAppointmentDate,
        status: updatedOrder[0].doctorAppointmentStatus,
      },
    });
  } catch (error) {
    console.error('Failed to book doctor appointment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to book doctor appointment' },
      { status: 500 }
    );
  }
}
