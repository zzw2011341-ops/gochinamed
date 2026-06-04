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

    // 4. 景点（Bug 3: 从 plan.bookingData.selectedAttractions 读取用户选择）
    // Bug 2: 按天分时，景点安排在 travelDate+1 14:00 起
    let attrList: Attraction[] = (plan?.bookingData?.selectedAttractions) || [];

    // 如果没选景点，自动补充目的城市默认景点
    if (attrList.length === 0 && bd?.destinationCity) {
      const cityDefaultAttractions: Record<string, Attraction[]> = {
        'Beijing': [
          { id: 'bj-1', nameEn: 'Forbidden City', nameZh: '故宫', location: 'Beijing', price: 60, visitDate: '', category: 'cultural' },
          { id: 'bj-2', nameEn: 'Great Wall', nameZh: '长城', location: 'Beijing', price: 45, visitDate: '', category: 'cultural' },
          { id: 'bj-3', nameEn: 'Temple of Heaven', nameZh: '天坛', location: 'Beijing', price: 35, visitDate: '', category: 'cultural' },
          { id: 'bj-4', nameEn: 'Summer Palace', nameZh: '颐和园', location: 'Beijing', price: 30, visitDate: '', category: 'natural' },
        ],
        'Hefei': [
          { id: 'hf-1', nameEn: 'Hefei Swan Lake', nameZh: '天鹅湖', location: 'Hefei', price: 0, visitDate: '', category: 'natural' },
          { id: 'hf-2', nameEn: 'Hefei Science Island', nameZh: '科学岛', location: 'Hefei', price: 20, visitDate: '', category: 'modern' },
          { id: 'hf-3', nameEn: 'Sanhe Ancient Town', nameZh: '三河古镇', location: 'Hefei', price: 40, visitDate: '', category: 'cultural' },
        ],
        'default': [
          { id: 'def-1', nameEn: 'City Central Park', nameZh: '市中心公园', location: bd?.destinationCity, price: 0, visitDate: '', category: 'natural' },
          { id: 'def-2', nameEn: 'Local Museum', nameZh: '当地博物馆', location: bd?.destinationCity, price: 30, visitDate: '', category: 'cultural' },
        ]
      };
      attrList = cityDefaultAttractions[bd.destinationCity] || cityDefaultAttractions['default'];
    }

    let attrDayOffset = 1; // 从 travelDate+1 开始
    for (const attr of attrList) {
      const attrName = attr.name || attr.nameEn || attr.nameZh || 'Attraction';
      let attrDate: Date;
      if (attr.visitDate) {
        attrDate = new Date(attr.visitDate);
      } else {
        attrDate = new Date(+travelDate + attrDayOffset * 86400000);
        attrDate.setHours(14, 0, 0, 0);
        attrDayOffset++;
      }
      const attrEnd = new Date(attrDate.getTime() + 3 * 3600000);
      items.push({
        id: uuidv4(), orderId, type: 'ticket',
        name: attrName,
        startDate: attrDate, endDate: attrEnd,
        location: attr.location || bd?.destinationCity || '',
        price: String(attr.price || 0),
        metadata: JSON.stringify({ attractionType: 'tourism' }),
        status: 'pending', createdAt: now,
      });
    }

    // 5. 美食推荐（自动生成）
    const cityFoodRecommendations: Record<string, any[]> = {
      'Beijing': [
        { id: 'food-bj-1', name: '北京烤鸭', description: '酥脆鸭皮配薄饼，北京经典菜肴', category: '主食' },
        { id: 'food-bj-2', name: '炸酱面', description: '浓郁酱香手工面条', category: '面食' },
        { id: 'food-bj-3', name: '驴打滚', description: '传统甜点，糯米卷豆沙', category: '甜点' },
      ],
      'Hefei': [
        { id: 'food-hf-1', name: '徽州毛豆腐', description: '发酵豆腐外酥里嫩，徽菜代表', category: '特色' },
        { id: 'food-hf-2', name: '庐州烤鸭', description: '合肥地方风味烤鸭', category: '主食' },
        { id: 'food-hf-3', name: '三河米饺', description: '米粉皮包裹馅料，口感独特', category: '小吃' },
      ],
      'default': [
        { id: 'food-def-1', name: '当地特色主食', description: '体验本地风味主食', category: '主食' },
        { id: 'food-def-2', name: '地方小吃', description: '感受街头美食文化', category: '小吃' },
      ]
    };
    const foodRecs = cityFoodRecommendations[bd?.destinationCity] || cityFoodRecommendations['default'];
    const orderMetadata = {
      foodRecommendations: foodRecs,
    };

    if (items.length > 0) {
      console.log('[Payment] Inserting', items.length, 'itinerary items');
      for (const item of items) {
        await db.insert(itineraries).values(item);
      }
    }

    // 将美食推荐写入订单 metadata
    await db.update(orders).set({ metadata: JSON.stringify(orderMetadata) }).where(eq(orders.id, orderId));

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
