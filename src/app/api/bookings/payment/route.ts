import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries, doctors } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface Attraction {
  id: string;
  name?: string;
  nameEn?: string;
  nameZh?: string;
  location?: string;
  price?: number;
  visitDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, plan, payment, documents, attractions } = body;

    console.log('[Payment] Received keys:', Object.keys(body));

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Missing plan data' }, { status: 400 });
    }

    const db = await getDb();
    const orderId = uuidv4();
    const now = new Date();

    // Parse fees
    const m = Number(plan.medicalFee) || 0;
    const h = Number(plan.hotelFee) || 0;
    const f = Number(plan.flightFee) || 0;
    const tf = Number(plan.ticketFee) || 0;
    const subtotal = m + h + f + tf;
    const sfr = Number(plan.serviceFeeRate) || 0.05;
    const sfa = Math.round(subtotal * sfr * 100) / 100;
    const total = subtotal + sfa;

    // Build order data
    const insertData: any = {
      id: orderId,
      userId: userId || plan.userId || '',
      status: 'pending',
      doctorAppointmentStatus: 'pending',
      serviceReservationStatus: 'pending',
      medicalFee: String(m),
      hotelFee: String(h),
      flightFee: String(f),
      ticketFee: String(tf),
      subtotal: String(subtotal),
      serviceFeeRate: String(sfr),
      serviceFeeAmount: String(sfa),
      totalAmount: String(total),
      currency: plan.currency || 'USD',
      createdAt: now,
      updatedAt: now,
    };

    // Link doctor/hospital from bookingData
    const bd = plan.bookingData;
    if (bd?.doctorId && bd.doctorId !== '') insertData.doctorId = bd.doctorId;
    if (bd?.selectedHospital && bd.selectedHospital !== '') insertData.hospitalId = bd.selectedHospital;

    // Medical fields
    if (bd?.consultationDirection) insertData.consultationDirection = bd.consultationDirection;
    if (bd?.examinationItems) insertData.examinationItems = bd.examinationItems;
    if (bd?.surgeryTypes) insertData.surgeryTypes = bd.surgeryTypes;
    if (bd?.treatmentDirection) insertData.treatmentDirection = bd.treatmentDirection;
    if (bd?.rehabilitationDirection) insertData.rehabilitationDirection = bd.rehabilitationDirection;

    console.log('[Payment] Insert order keys:', Object.keys(insertData));
    await db.insert(orders).values(insertData);

    // Build itinerary items（Bug 2 + Bug 5: 按天分时，避免所有行程在同一天）
    const items: any[] = [];
    const travelDate = bd?.travelDate ? new Date(bd.travelDate) : now;
    const returnDate = bd?.returnDate ? new Date(bd.returnDate) : new Date(+travelDate + 259200000);

    // 1. 去程航班（Bug 1: 多段联程航班）
    if (bd?.travelDate) {
      const origin = bd.originCity || 'Origin';
      const dest = bd.destinationCity || 'Destination';
      // Bug 1 修复：从 plan.flightRoute 读取多段联程信息
      const flightRoute = (plan as any).flightRoute;
      const segments: any[] = flightRoute?.segments || [];

      if (segments.length > 0) {
        // 多段联程：构造前端确认页所需的完整 segment 格式
        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];
        const flightStart = new Date(travelDate);
        flightStart.setHours(8, 0, 0, 0);
        const flightEnd = new Date(travelDate);
        flightEnd.setHours(12, 0, 0, 0);

        // 构造 flightSegments，字段名对齐确认页 page.tsx 的期望
        const flightSegments = segments.map((seg: any, idx: number) => {
          const depTime = new Date(travelDate);
          depTime.setHours(8 + idx * 4, 0, 0, 0);
          const arrTime = new Date(depTime.getTime() + 4 * 3600000);
          return {
            flightNumber: seg.flightNumber || `${seg.airline || 'CA'}${1000 + idx}`,
            airline: seg.airline || (idx === 0 ? '国际航空' : '国内航空'),
            origin: seg.origin || seg.from || '',
            destination: seg.destination || seg.to || '',
            departureTime: depTime.toISOString(),
            arrivalTime: arrTime.toISOString(),
            durationMinutes: 240,
            airport: seg.airport || '',
          };
        });

        const layoverMinutes = 120; // 默认中转2小时
        items.push({
          id: uuidv4(), orderId, type: 'flight',
          name: `${origin} → ${dest} Flight`,
          startDate: flightStart, endDate: flightEnd,
          location: `${firstSeg.origin || firstSeg.from} → ${lastSeg.destination || lastSeg.to}`,
          metadata: {
            flightDetails: {
              segments: flightSegments,
              isDirect: false,
              connectionCity: flightRoute.description || '',
              layoverMinutes,
            }
          },
          status: 'pending', createdAt: now,
        });
      } else {
        // 单段航班（同城或无需转机）
        const flightStart = new Date(travelDate);
        flightStart.setHours(8, 0, 0, 0);
        const flightEnd = new Date(travelDate);
        flightEnd.setHours(12, 0, 0, 0);
        items.push({
          id: uuidv4(), orderId, type: 'flight',
          name: `${origin} → ${dest} Flight`,
          startDate: flightStart, endDate: flightEnd,
          location: `${origin} → ${dest}`,
          status: 'pending', createdAt: now,
        });
      }
    }

    // 2. 酒店（travelDate ~ returnDate）
    if (bd?.hotelName) {
      items.push({
        id: uuidv4(), orderId, type: 'hotel',
        name: bd.hotelName,
        startDate: travelDate, endDate: returnDate,
        location: bd.destinationCity || '',
        status: 'pending', createdAt: now,
      });
    }

    // 3. 医疗预约（Bug 4: 查询真实医生名；Bug 2: travelDate+1 09:00-11:00）
    if (bd?.doctorId && bd.doctorId !== '') {
      // Bug 4: 从数据库查询医生名
      let docName = 'Doctor';
      try {
        const doctorList = await db.select({
          nameEn: doctors.nameEn,
          nameZh: doctors.nameZh,
        }).from(doctors).where(eq(doctors.id, bd.doctorId)).limit(1);
        if (doctorList.length > 0) {
          docName = doctorList[0].nameEn || doctorList[0].nameZh || 'Doctor';
        }
      } catch (e) {
        console.error('[Payment] Error fetching doctor name:', e);
      }

      // Bug 2: 医疗预约安排在 travelDate+1 09:00-11:00
      const aptDate = bd.appointmentDate ? new Date(bd.appointmentDate) : new Date(+travelDate + 86400000);
      aptDate.setHours(9, 0, 0, 0);
      const aptEnd = new Date(aptDate.getTime() + 2 * 3600000); // +2 hours
      items.push({
        id: uuidv4(), orderId, type: 'ticket',
        name: `Medical Consultation - ${docName}`,
        startDate: aptDate, endDate: aptEnd,
        location: bd.destinationCity || '',
        status: 'pending', createdAt: now,
      });
    }

    // 4. 景点（Bug 3: 只用用户传的 attractions，不用 bd?.selectedAttractions）
    // Bug 2: 按天分时，景点安排在 travelDate+1 14:00 起
    const attrList: Attraction[] = attractions || [];  // Bug 3: 只使用用户明确选择的景点
    let attrDayOffset = 1; // 从 travelDate+1 开始
    for (const attr of attrList) {
      const attrName = attr.name || attr.nameEn || attr.nameZh || 'Attraction';
      // 使用用户指定的 visitDate，或者按天分配
      let attrDate: Date;
      if (attr.visitDate) {
        attrDate = new Date(attr.visitDate);
      } else {
        attrDate = new Date(+travelDate + attrDayOffset * 86400000);
        attrDate.setHours(14, 0, 0, 0); // Bug 2: 14:00-17:00
        attrDayOffset++;
      }
      const attrEnd = new Date(attrDate.getTime() + 3 * 3600000); // +3 hours
      items.push({
        id: uuidv4(), orderId, type: 'ticket',
        name: attrName,
        startDate: attrDate, endDate: attrEnd,
        location: attr.location || bd?.destinationCity || '',
        price: String(attr.price || 0),
        status: 'pending', createdAt: now,
      });
    }

    if (items.length > 0) {
      console.log('[Payment] Inserting', items.length, 'itinerary items');
      for (const item of items) {
        await db.insert(itineraries).values(item);
      }
    }

    console.log('[Payment] Done:', orderId);
    return NextResponse.json({
      success: true, orderId,
      message: 'Payment successful',
      redirectUrl: '/book/confirmation/' + orderId,
    });

  } catch (error: any) {
    console.error('[Payment] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Payment failed', details: error.message }, { status: 500 });
  }
}
