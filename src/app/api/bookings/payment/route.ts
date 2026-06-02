import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
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

    // Build itinerary items
    const items: any[] = [];
    const travelDate = bd?.travelDate ? new Date(bd.travelDate) : now;
    const returnDate = bd?.returnDate ? new Date(bd.returnDate) : new Date(+travelDate + 259200000);

    // 1. Flight
    if (bd?.travelDate) {
      const origin = bd.originCity || 'Origin';
      const dest = bd.destinationCity || 'Destination';
      items.push({
        id: uuidv4(), orderId, type: 'flight',
        name: `${origin} → ${dest} Flight`,
        startDate: travelDate, endDate: travelDate,
        location: `${origin} → ${dest}`,
        status: 'pending', createdAt: now,
      });
    }

    // 2. Hotel
    if (bd?.hotelName) {
      items.push({
        id: uuidv4(), orderId, type: 'hotel',
        name: bd.hotelName,
        startDate: travelDate, endDate: returnDate,
        location: bd.destinationCity || '',
        status: 'pending', createdAt: now,
      });
    }

    // 3. Medical appointment (use travelDate, not today)
    if (bd?.doctorId && bd.doctorId !== '') {
      const docName = plan.doctorName || 'Doctor';
      const aptDate = bd.appointmentDate ? new Date(bd.appointmentDate) : travelDate;
      items.push({
        id: uuidv4(), orderId, type: 'ticket',
        name: `Medical Consultation - ${docName}`,
        startDate: aptDate, endDate: aptDate,
        location: bd.destinationCity || '',
        status: 'pending', createdAt: now,
      });
    }

    // 4. Attractions (tourism tickets)
    const attrList: Attraction[] = attractions || bd?.selectedAttractions || [];
    for (const attr of attrList) {
      const attrName = attr.name || attr.nameEn || attr.nameZh || 'Attraction';
      const attrDate = attr.visitDate ? new Date(attr.visitDate) : travelDate;
      items.push({
        id: uuidv4(), orderId, type: 'ticket',
        name: attrName,
        startDate: attrDate, endDate: attrDate,
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
