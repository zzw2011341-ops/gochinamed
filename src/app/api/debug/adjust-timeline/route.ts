import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

/**
 * 时间线调整API
 * 基于正确的arrivalDate调整酒店和医疗咨询的日期
 */
export async function POST(request: NextRequest) {
  const { orderId } = await request.json();

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  try {
    const db = await getDb();

    // 获取订单信息
    const orderList = await db.select().from(orders).where(eq(orders.id, orderId));
    const order = orderList[0];

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 获取现有行程记录
    const itineraryList = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId))
      .orderBy(itineraries.startDate);

    // 提取航班信息
    const flightItineraries = itineraryList.filter(i => i.type === 'flight');
    if (flightItineraries.length < 2) {
      return NextResponse.json({
        success: false,
        message: 'Order has less than 2 flights'
      }, { status: 400 });
    }

    const outboundFlight = flightItineraries[0];
    const returnFlight = flightItineraries[1];

    if (!outboundFlight.endDate || !returnFlight.startDate) {
      return NextResponse.json({
        success: false,
        message: 'Invalid flight dates'
      }, { status: 400 });
    }

    const arrivalDate = outboundFlight.endDate;
    const returnDate = returnFlight.startDate;

    const adjustments = [];

    // 调整酒店日期
    const hotelItinerary = itineraryList.find(i => i.type === 'hotel');
    if (hotelItinerary) {
      // 酒店入住：到达后4小时
      const newHotelStartDate = new Date(arrivalDate.getTime() + 4 * 60 * 60 * 1000);
      // 酒店退房：回程当天上午
      const newHotelEndDate = new Date(returnDate.getTime());
      newHotelEndDate.setHours(10, 0, 0, 0);

      // 确保酒店日期合理
      const safeHotelStartDate = newHotelStartDate < newHotelEndDate ? newHotelStartDate : new Date(arrivalDate.getTime());

      await db.update(itineraries)
        .set({
          startDate: safeHotelStartDate,
          endDate: newHotelEndDate,
          updatedAt: new Date(),
        })
        .where(eq(itineraries.id, hotelItinerary.id));

      adjustments.push({
        type: 'hotel',
        oldStart: hotelItinerary.startDate?.toISOString(),
        oldEnd: hotelItinerary.endDate?.toISOString(),
        newStart: safeHotelStartDate.toISOString(),
        newEnd: newHotelEndDate.toISOString(),
      });
    }

    // 调整医疗咨询日期
    const medicalItinerary = itineraryList.find(i => i.type === 'ticket' && i.metadata && (i.metadata as any).medicalType);
    if (medicalItinerary) {
      // 医疗咨询：到达后1天上午10点
      const newMedicalStartDate = new Date(arrivalDate.getTime() + 1 * 24 * 60 * 60 * 1000);
      newMedicalStartDate.setHours(10, 0, 0, 0);

      // 确保在到达和回程之间
      const minMedicalDate = new Date(arrivalDate.getTime() + 20 * 60 * 60 * 1000);
      const maxMedicalDate = new Date(returnDate.getTime() - 24 * 60 * 60 * 1000);

      let adjustedMedicalStartDate = newMedicalStartDate;
      if (adjustedMedicalStartDate < minMedicalDate) {
        adjustedMedicalStartDate = new Date(minMedicalDate.getTime());
        adjustedMedicalStartDate.setHours(10, 0, 0, 0);
      }
      if (adjustedMedicalStartDate > maxMedicalDate) {
        adjustedMedicalStartDate = new Date(maxMedicalDate.getTime());
        adjustedMedicalStartDate.setHours(10, 0, 0, 0);
      }

      const newMedicalEndDate = new Date(adjustedMedicalStartDate.getTime() + 60 * 60 * 1000);

      await db.update(itineraries)
        .set({
          startDate: adjustedMedicalStartDate,
          endDate: newMedicalEndDate,
          updatedAt: new Date(),
        })
        .where(eq(itineraries.id, medicalItinerary.id));

      // 更新订单的医生预约日期
      await db.update(orders)
        .set({
          doctorAppointmentDate: adjustedMedicalStartDate,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      adjustments.push({
        type: 'medical',
        oldStart: medicalItinerary.startDate?.toISOString(),
        oldEnd: medicalItinerary.endDate?.toISOString(),
        newStart: adjustedMedicalStartDate.toISOString(),
        newEnd: newMedicalEndDate.toISOString(),
      });
    }

    // 调整景点日期
    const attractionItineraries = itineraryList.filter(i => i.type === 'ticket' && i.metadata && (i.metadata as any).attractionType);
    if (attractionItineraries.length > 0) {
      const medicalItineraryDate = medicalItinerary?.endDate || arrivalDate;

      // 景点：医疗咨询后1天或到达后2天
      let attractionDate = new Date(medicalItineraryDate.getTime());
      attractionDate.setDate(attractionDate.getDate() + 1);
      attractionDate.setHours(14, 0, 0, 0);

      const dateAfterArrival = new Date(arrivalDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      dateAfterArrival.setHours(10, 0, 0, 0);

      if (attractionDate < dateAfterArrival) {
        attractionDate = dateAfterArrival;
      }

      // 确保在回程前至少1天
      const maxAttractionDate = new Date(returnDate.getTime() - 24 * 60 * 60 * 1000);
      if (attractionDate >= maxAttractionDate) {
        attractionDate = new Date(arrivalDate.getTime());
        attractionDate.setDate(attractionDate.getDate() + 1);
        attractionDate.setHours(10, 0, 0, 0);
      }

      for (const attraction of attractionItineraries) {
        const newAttractionDate = new Date(attractionDate.getTime());
        const newAttractionEndDate = new Date(newAttractionDate.getTime() + 120 * 60 * 1000);

        await db.update(itineraries)
          .set({
            startDate: newAttractionDate,
            endDate: newAttractionEndDate,
            updatedAt: new Date(),
          })
          .where(eq(itineraries.id, attraction.id));

        adjustments.push({
          type: 'attraction',
          name: attraction.name,
          oldStart: attraction.startDate?.toISOString(),
          oldEnd: attraction.endDate?.toISOString(),
          newStart: newAttractionDate.toISOString(),
          newEnd: newAttractionEndDate.toISOString(),
        });

        // 下一个景点安排在第二天
        attractionDate.setDate(attractionDate.getDate() + 1);
        if (attractionDate >= maxAttractionDate) {
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Timeline adjusted successfully. ${adjustments.length} items updated.`,
      adjustments,
      summary: {
        orderId,
        arrivalDate: arrivalDate.toISOString(),
        returnDate: returnDate.toISOString(),
      },
    });

  } catch (error) {
    console.error('Adjust timeline error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust timeline', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
