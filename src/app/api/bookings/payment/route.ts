import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, plan, payment, documents } = body;

    console.log('[Payment] Received keys:', Object.keys(body));

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Missing plan data' }, { status: 400 });
    }

    const db = await getDb();

    const orderId = uuidv4();
    const now = new Date();

    const m = Number(plan.medicalFee) || 0;
    const h = Number(plan.hotelFee) || 0;
    const f = Number(plan.flightFee) || 0;
    const sub = m + h + f;
    const sfr = Number(plan.serviceFeeRate) || 0.05;
    const sfa = Math.round(sub * sfr * 100) / 100;
    const total = sub + sfa;

    const insertData: any = {
      id: orderId,
      userId: userId || plan.userId || 'f7eccbed-7f25-446f-8596-10a0b3d9814f',
      status: 'pending',
      doctorAppointmentStatus: 'pending',
      serviceReservationStatus: 'pending',
      medicalFee: String(m),
      hotelFee: String(h),
      flightFee: String(f),
      ticketFee: '0',
      subtotal: String(sub),
      serviceFeeRate: String(sfr),
      serviceFeeAmount: String(sfa),
      totalAmount: String(total),
      currency: plan.currency || 'USD',
      createdAt: now,
      updatedAt: now,
    };

    if (plan.bookingData?.doctorId) insertData.doctorId = plan.bookingData.doctorId;
    if (plan.bookingData?.selectedHospital) insertData.hospitalId = plan.bookingData.selectedHospital;

    const bd = plan.bookingData;
    if (bd?.consultationDirection) insertData.consultationDirection = bd.consultationDirection;
    if (bd?.examinationItems) insertData.examinationItems = bd.examinationItems;
    if (bd?.surgeryTypes) insertData.surgeryTypes = bd.surgeryTypes;
    if (bd?.treatmentDirection) insertData.treatmentDirection = bd.treatmentDirection;
    if (bd?.rehabilitationDirection) insertData.rehabilitationDirection = bd.rehabilitationDirection;

    console.log('[Payment] Insert data keys:', Object.keys(insertData));
    await db.insert(orders).values(insertData);

    const items: any[] = [];

    if (bd?.travelDate) {
      const td = new Date(bd.travelDate);
      items.push({
        id: uuidv4(), orderId, type: 'flight',
        name: plan.name || 'Flight', startDate: td, endDate: td,
        location: (bd.originCity || '') + ' -> ' + (bd.destinationCity || ''),
        status: 'pending', createdAt: now,
      });
    }

    if (bd?.hotelName) {
      const sd = bd.travelDate ? new Date(bd.travelDate) : now;
      const ed = bd.returnDate ? new Date(bd.returnDate) : new Date(+sd + 259200000);
      items.push({
        id: uuidv4(), orderId, type: 'hotel',
        name: bd.hotelName, startDate: sd, endDate: ed,
        location: bd.destinationCity || '', status: 'pending', createdAt: now,
      });
    }

    if (bd?.doctorId) {
      const ad = bd.appointmentDate ? new Date(bd.appointmentDate) : now;
      items.push({
        id: uuidv4(), orderId, type: 'ticket',
        name: 'Medical Consultation', startDate: ad, endDate: ad,
        status: 'pending', createdAt: now,
      });
    }

    if (items.length > 0) {
      console.log('[Payment] Inserting', items.length, 'items');
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
