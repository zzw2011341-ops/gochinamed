import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { itineraries, orders } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 查询订单信息
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const order = orderList[0];
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 查询所有行程记录
    const itineraryItems = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId));

    const issues: any[] = [];
    const suggestions: any[] = [];

    // 按类型分组行程
    const flights = itineraryItems.filter(item => item.type === 'flight');
    const tickets = itineraryItems.filter(item => item.type === 'ticket');
    const hotels = itineraryItems.filter(item => item.type === 'hotel');

    // 1. 检查航班顺序
    if (flights.length >= 2) {
      // 过滤出有开始日期的航班
      const flightsWithDates = flights.filter(f => f.startDate !== null);
      
      // 按开始日期排序
      const sortedFlights = flightsWithDates.sort((a, b) =>
        new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()
      );

      const firstFlight = sortedFlights[0];
      const lastFlight = sortedFlights[sortedFlights.length - 1];

      // 检查航班方向
      const firstRoute = firstFlight.location || '';
      const lastRoute = lastFlight.location || '';

      // 分析航班起点和终点
      const [firstOrigin, firstDest] = firstRoute.split(' - ').map(s => s.trim());
      const [lastOrigin, lastDest] = lastRoute.split(' - ').map(s => s.trim());

      // 判断逻辑：第一个航班应该是去程（origin → destination），最后一个航班应该是回程（destination → origin）
      if (firstOrigin === lastDest && firstDest === lastOrigin) {
        // 顺序正确
        suggestions.push({
          type: 'flight_order',
          status: 'correct',
          message: `航班顺序正确：${firstOrigin} → ${firstDest} → ${lastDest}`,
        });
      } else {
        // 顺序可能有问题
        issues.push({
          type: 'flight_order',
          severity: 'high',
          message: `航班顺序可能不正确：第一个航班 ${firstRoute}，最后一个航班 ${lastRoute}`,
          suggestion: `应该是：出发地 → 目的地 → 出发地，但当前是：${firstOrigin} → ${firstDest} → ${lastDest}`,
        });
      }
    }

    // 2. 检查到达时间（假设第一个航班是去程）
    let arrivalDate: Date | null = null;
    let firstRoute = '';
    let firstOrigin = '';
    let firstDest = '';

    if (flights.length > 0) {
      // 过滤出有开始和结束日期的航班
      const validFlights = flights.filter(f => f.startDate !== null && f.endDate !== null);
      
      if (validFlights.length > 0) {
        const outboundFlight = validFlights.reduce((earliest, current) =>
          new Date(current.startDate!) < new Date(earliest.startDate!) ? current : earliest
        );
        arrivalDate = new Date(outboundFlight.endDate!);
        firstRoute = outboundFlight.location || '';
        const routeParts = firstRoute.split(' - ');
        firstOrigin = routeParts[0]?.trim() || '';
        firstDest = routeParts[1]?.trim() || '';
      }
    }

    // 3. 检查医生预约时间
    const doctorAppointmentDate = order.doctorAppointmentDate ? new Date(order.doctorAppointmentDate) : null;
    if (doctorAppointmentDate && arrivalDate) {
      if (doctorAppointmentDate < arrivalDate) {
        issues.push({
          type: 'doctor_appointment',
          severity: 'critical',
          message: `医生预约时间 ${doctorAppointmentDate.toISOString()} 在航班到达时间 ${arrivalDate.toISOString()} 之前`,
          suggestion: `医生预约应该在航班到达之后，建议安排在 ${new Date(arrivalDate.getTime() + 24 * 60 * 60 * 1000).toISOString()} 之后`,
        });
      } else {
        suggestions.push({
          type: 'doctor_appointment',
          status: 'correct',
          message: `医生预约时间正确：在航班到达之后`,
        });
      }
    }

    // 4. 检查医疗咨询时间
    const medicalConsultation = tickets.find(
      item => item.metadata && (item.metadata as any).medicalType === 'consultation' && item.startDate !== null
    );
    if (medicalConsultation && arrivalDate) {
      const medicalDate = new Date(medicalConsultation.startDate!);
      if (medicalDate < arrivalDate) {
        issues.push({
          type: 'medical_consultation',
          severity: 'critical',
          message: `医疗咨询时间 ${medicalDate.toISOString()} 在航班到达时间 ${arrivalDate.toISOString()} 之前`,
          suggestion: `医疗咨询应该在航班到达之后，建议安排在到达后1-2天`,
        });
      }
    }

    // 5. 检查酒店时间
    if (hotels.length > 0 && arrivalDate) {
      const hotel = hotels[0];
      if (hotel.startDate && hotel.endDate) {
        const hotelStart = new Date(hotel.startDate);
        const hotelEnd = new Date(hotel.endDate);

        if (hotelStart < arrivalDate) {
          issues.push({
            type: 'hotel_time',
            severity: 'medium',
            message: `酒店入住时间 ${hotelStart.toISOString()} 在航班到达之前`,
            suggestion: `酒店入住应该在航班到达当天下午开始`,
          });
        }
      }
    }

    // 6. 检查景点时间
    const attractions = tickets.filter(
      item => item.metadata && (item.metadata as any).attractionType === 'tourism'
    );
    if (attractions.length > 0 && medicalConsultation && medicalConsultation.startDate) {
      const medicalDate = new Date(medicalConsultation.startDate);
      attractions.forEach(attraction => {
        if (attraction.startDate) {
          const attractionDate = new Date(attraction.startDate);
          if (attractionDate < medicalDate) {
            issues.push({
              type: 'attraction_time',
              severity: 'medium',
              message: `景点游览 ${attraction.name} 时间 ${attractionDate.toISOString()} 在医疗咨询之前`,
              suggestion: `建议景点安排在医疗咨询之后的空闲时间`,
            });
          }
        }
      });
    }

    // 7. 生成正确的时间线建议
    if (arrivalDate) {
      const timelineSuggestions: any[] = [];

      // 到达当天
      timelineSuggestions.push({
        day: 1,
        activity: 'Arrival & Check-in',
        time: `${arrivalDate.toLocaleString()}`,
        description: `航班到达${firstRoute ? ` (${firstRoute})` : ''}，下午办理酒店入住`,
      });

      // 第2天：医疗咨询
      const medicalDate = medicalConsultation && medicalConsultation.startDate
        ? new Date(medicalConsultation.startDate)
        : new Date(arrivalDate.getTime() + 24 * 60 * 60 * 1000);
      timelineSuggestions.push({
        day: 2,
        activity: 'Medical Consultation',
        time: `${medicalDate.toLocaleString()}`,
        description: '前往医院进行医疗咨询',
      });

      // 第3天：景点游览
      if (attractions.length > 0) {
        const attractionDate = new Date(medicalDate.getTime() + 24 * 60 * 60 * 1000);
        timelineSuggestions.push({
          day: 3,
          activity: 'Sightseeing',
          time: `${attractionDate.toLocaleString()}`,
          description: `游览景点：${attractions.map(a => a.name).join(', ')}`,
        });
      }

      // 返程日
      const returnDate = flights.length > 1
        ? new Date(
            flights
              .filter(f => f.startDate !== null)
              .reduce((latest, current) =>
                new Date(current.startDate!) > new Date(latest.startDate!) ? current : latest
              ).startDate!
          )
        : null;
      if (returnDate) {
        timelineSuggestions.push({
          day: 'Return',
          activity: 'Check-out & Return Flight',
          time: `${returnDate.toLocaleString()}`,
          description: `上午退房，前往机场返回${firstOrigin}`,
        });
      }

      suggestions.push({
        type: 'recommended_timeline',
        status: 'info',
        message: '建议的行程时间线',
        timeline: timelineSuggestions,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        arrivalDate,
        doctorAppointmentDate,
        issues,
        suggestions,
        summary: {
          totalIssues: issues.length,
          criticalIssues: issues.filter(i => i.severity === 'critical').length,
          hasFlights: flights.length > 0,
          hasMedical: medicalConsultation !== undefined,
          hasAttractions: attractions.length > 0,
          hasHotel: hotels.length > 0,
        },
      },
    });
  } catch (error) {
    console.error('Failed to validate itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to validate itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
