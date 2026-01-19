import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries, users, serviceFees, doctors, hospitals } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

interface PaymentRequest {
  userId: string;
  plan: {
    id: string;
    name: string;
    totalAmount: number;
    medicalFee: number;
    hotelFee: number;
    flightFee: number;
    doctorId?: string;
    hospitalId?: string;
    bookingData?: any;
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

    // 获取中介费率
    const medicalFeeConfig = await db.query.serviceFees.findFirst({
      where: eq(serviceFees.type, 'medical'),
    });
    const flightFeeConfig = await db.query.serviceFees.findFirst({
      where: eq(serviceFees.type, 'flight'),
    });
    const hotelFeeConfig = await db.query.serviceFees.findFirst({
      where: eq(serviceFees.type, 'hotel'),
    });

    const medicalRate = Number(medicalFeeConfig?.rate || 0.05);
    const flightRate = Number(flightFeeConfig?.rate || 0.03);
    const hotelRate = Number(hotelFeeConfig?.rate || 0.04);

    const medicalMinFee = Number(medicalFeeConfig?.minFee || 50);
    const flightMinFee = Number(flightFeeConfig?.minFee || 30);
    const hotelMinFee = Number(hotelFeeConfig?.minFee || 40);

    // 计算各项服务费用
    const medicalServiceFee = Math.max(plan.medicalFee * medicalRate, medicalMinFee);
    const flightServiceFee = Math.max(plan.flightFee * flightRate, flightMinFee);
    const hotelServiceFee = Math.max(plan.hotelFee * hotelRate, hotelMinFee);

    const subtotal = plan.medicalFee + plan.hotelFee + plan.flightFee;
    const totalServiceFee = medicalServiceFee + flightServiceFee + hotelServiceFee;
    const totalAmount = subtotal + totalServiceFee;

    // 获取用户的预订信息（从session或其他地方）
    const bookingData = plan.bookingData || {};
    const travelDate = new Date(bookingData.travelDate || Date.now() + 7 * 24 * 60 * 60 * 1000);
    const appointmentDate = new Date(bookingData.appointmentDate || Date.now() + 10 * 24 * 60 * 60 * 1000);
    const returnDate = new Date(bookingData.returnDate || Date.now() + 14 * 24 * 60 * 60 * 1000);

    // 创建订单
    const [order] = await db.insert(orders).values({
      id: uuidv4(),
      userId,
      doctorId: plan.doctorId || null,
      hospitalId: plan.hospitalId || null,
      status: 'confirmed',
      doctorAppointmentStatus: plan.doctorId ? 'pending' : 'confirmed',
      doctorAppointmentDate: plan.doctorId ? appointmentDate : null,
      serviceReservationStatus: 'pending',
      medicalFee: plan.medicalFee.toString(),
      hotelFee: plan.hotelFee.toString(),
      flightFee: plan.flightFee.toString(),
      ticketFee: '0',
      subtotal: subtotal.toString(),
      serviceFeeRate: '0.05',
      serviceFeeAmount: totalServiceFee.toString(),
      totalAmount: totalAmount.toString(),
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // 创建行程记录
    const flightItinerary = await db.insert(itineraries).values({
      id: uuidv4(),
      orderId: order.id,
      type: 'flight',
      name: `Flight from ${bookingData.originCity || 'Origin'} to ${bookingData.destinationCity || 'Destination'}`,
      description: `International flight for ${plan.name}`,
      startDate: travelDate,
      endDate: travelDate,
      location: `${bookingData.originCity || 'Origin'} - ${bookingData.destinationCity || 'Destination'}`,
      price: plan.flightFee.toString(),
      status: 'pending',
      notificationSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    await db.insert(itineraries).values({
      id: uuidv4(),
      orderId: order.id,
      type: 'hotel',
      name: `${bookingData.hotelName || 'Hotel'} Accommodation`,
      description: `${bookingData.nights || 7} nights hotel stay`,
      startDate: travelDate,
      endDate: returnDate,
      location: bookingData.destinationCity || 'Destination',
      price: plan.hotelFee.toString(),
      status: 'pending',
      notificationSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(itineraries).values({
      id: uuidv4(),
      orderId: order.id,
      type: 'ticket', // 使用'ticket'类型代替'medical'
      name: 'Medical Consultation',
      description: `Medical consultation at ${bookingData.hospitalName || 'Hospital'}`,
      startDate: appointmentDate,
      status: 'pending',
      notificationSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 更新用户的证件信息
    await db.update(users)
      .set({
        passportNumber,
        passportCountry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 后台任务：预约医生（如果有医生ID）
    if (plan.doctorId) {
      bookDoctorAppointment(db, order.id, plan.doctorId, appointmentDate, bookingData.notes).catch(err => {
        console.error('Failed to book doctor appointment:', err);
      });
    }

    // 后台任务：预订行程服务
    bookItineraryServices(db, order.id, bookingData).catch(err => {
      console.error('Failed to book itinerary services:', err);
    });

    // TODO: 发送支付确认邮件
    // await sendPaymentConfirmationEmail(userId, order.id, totalAmount);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Payment successful. Your booking is being processed.',
      redirectUrl: `/book/confirmation/${order.id}`,
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * 预约医生（后台任务）
 */
async function bookDoctorAppointment(
  db: any,
  orderId: string,
  doctorId: string,
  appointmentDate: Date,
  notes?: string
) {
  try {
    // 查询医生信息
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, doctorId),
    });

    if (!doctor) {
      console.error('Doctor not found:', doctorId);
      return;
    }

    // 更新订单的医生预约状态
    await db
      .update(orders)
      .set({
        doctorId: doctorId,
        doctorAppointmentStatus: 'confirmed',
        doctorAppointmentDate: appointmentDate,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // TODO: 发送预约确认通知
    // await sendAppointmentNotification(orderId, doctor, appointmentDate);

    console.log('Doctor appointment booked successfully:', orderId);
  } catch (error) {
    console.error('Failed to book doctor appointment:', error);
    throw error;
  }
}

/**
 * 预订行程服务（后台任务）
 */
async function bookItineraryServices(db: any, orderId: string, bookingData: any) {
  try {
    // 查询订单的所有行程记录
    const itinerariesList = await db.query.itineraries.findMany({
      where: eq(itineraries.orderId, orderId),
    });

    // 预订航班
    const flightItinerary = itinerariesList.find((i: any) => i.type === 'flight');
    if (flightItinerary) {
      // 模拟航班预订
      const flightReference = `FL${Date.now().toString().slice(-8)}`;
      await db
        .update(itineraries)
        .set({
          status: 'confirmed',
          bookingConfirmation: flightReference,
          notificationSent: true,
          updatedAt: new Date(),
        })
        .where(eq(itineraries.id, flightItinerary.id));

      // TODO: 发送航班预订确认通知
      // await sendFlightBookingNotification(orderId, flightReference);
    }

    // 预订酒店
    const hotelItinerary = itinerariesList.find((i: any) => i.type === 'hotel');
    if (hotelItinerary) {
      // 模拟酒店预订
      const hotelReference = `HT${Date.now().toString().slice(-8)}`;
      await db
        .update(itineraries)
        .set({
          status: 'confirmed',
          bookingConfirmation: hotelReference,
          notificationSent: true,
          updatedAt: new Date(),
        })
        .where(eq(itineraries.id, hotelItinerary.id));

      // TODO: 发送酒店预订确认通知
      // await sendHotelBookingNotification(orderId, hotelReference);
    }

    // 预订医疗咨询
    const medicalItinerary = itinerariesList.find((i: any) => i.type === 'ticket');
    if (medicalItinerary) {
      await db
        .update(itineraries)
        .set({
          status: 'confirmed',
          notificationSent: true,
          updatedAt: new Date(),
        })
        .where(eq(itineraries.id, medicalItinerary.id));
    }

    // 更新订单的行程预订状态
    await db
      .update(orders)
      .set({
        serviceReservationStatus: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log('Itinerary services booked successfully:', orderId);
  } catch (error) {
    console.error('Failed to book itinerary services:', error);
    throw error;
  }
}
