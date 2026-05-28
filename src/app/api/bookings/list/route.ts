import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries, doctors, hospitals } from '@/storage/database/shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 查询所有订单
    const allOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    // 定义当前订单的标准：
    // 1. 创建时间在最近30天内
    // 2. 状态为 pending, confirmed, processing
    // 3. 行程开始日期在今天或之后
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeStatuses = ['pending', 'confirmed', 'processing'];
    const completedStatuses = ['completed', 'cancelled'];

    // 查询所有行程记录，用于判断是否为当前订单
    const allOrderIds = allOrders.map(o => o.id);
    const itineraryRecords = await db
      .select()
      .from(itineraries)
      .where(
        allOrderIds.length > 0 ?
        // 简化：只查询部分订单的行程（避免IN子句过长）
        eq(itineraries.orderId, allOrderIds[0])
        : eq(itineraries.orderId, '')
      );

    const itineraryMap = new Map<string, any[]>();
    itineraryRecords.forEach(item => {
      if (!itineraryMap.has(item.orderId)) {
        itineraryMap.set(item.orderId, []);
      }
      itineraryMap.get(item.orderId)!.push(item);
    });

    // 分类订单
    const currentOrders: any[] = [];
    const historicalOrders: any[] = [];

    for (const order of allOrders) {
      // 获取该订单的行程
      const orderItineraries = itineraryMap.get(order.id) || [];

      // 判断是否为当前订单
      const isRecentOrder = new Date(order.createdAt) > thirtyDaysAgo;
      const isActiveStatus = activeStatuses.includes(order.status);
      const isFutureTrip = orderItineraries.some(i =>
        i.startDate && new Date(i.startDate) >= new Date()
      );

      const isCurrent = isRecentOrder && isActiveStatus && isFutureTrip;

      // 获取医生和医院信息
      let doctor = null;
      let hospital = null;

      if (order.doctorId) {
        const doctorList = await db
          .select()
          .from(doctors)
          .where(eq(doctors.id, order.doctorId))
          .limit(1);
        doctor = doctorList[0];
      }

      if (order.hospitalId) {
        const hospitalList = await db
          .select()
          .from(hospitals)
          .where(eq(hospitals.id, order.hospitalId))
          .limit(1);
        hospital = hospitalList[0];
      }

      // 判断是否为医疗订单
      const hasMedicalService = !!(order.doctorId || order.hospitalId || order.medicalFee && Number(order.medicalFee) > 0);

      const orderInfo = {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        doctorAppointmentDate: order.doctorAppointmentDate,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        doctor: doctor ? {
          id: doctor.id,
          nameEn: doctor.nameEn,
          nameZh: doctor.nameZh,
          title: doctor.title,
        } : null,
        hospital: hospital ? {
          id: hospital.id,
          nameEn: hospital.nameEn,
          nameZh: hospital.nameZh,
          location: hospital.location,
        } : null,
        hasMedicalService,
        medicalFee: order.medicalFee ? Number(order.medicalFee) : 0,
        hotelFee: order.hotelFee ? Number(order.hotelFee) : 0,
        flightFee: order.flightFee ? Number(order.flightFee) : 0,
        treatmentType: order.treatmentDirection ?
          (order.surgeryTypes ? 'surgery' :
           order.rehabilitationDirection ? 'rehabilitation' :
           order.treatmentDirection.includes('therapy') ? 'therapy' :
           order.examinationItems ? 'examination' : 'consultation') :
          order.consultationDirection ? 'consultation' : null,
        itineraryCount: orderItineraries.length,
        upcomingDates: orderItineraries
          .filter(i => i.startDate && new Date(i.startDate) >= new Date())
          .map(i => ({
            type: i.type,
            date: i.startDate,
            name: i.name,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3),
      };

      if (isCurrent) {
        currentOrders.push(orderInfo);
      } else {
        historicalOrders.push(orderInfo);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        current: currentOrders,
        historical: historicalOrders,
        summary: {
          currentCount: currentOrders.length,
          historicalCount: historicalOrders.length,
          totalCount: allOrders.length,
        },
      },
    });

  } catch (error) {
    console.error('Failed to fetch orders list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders list' },
      { status: 500 }
    );
  }
}
