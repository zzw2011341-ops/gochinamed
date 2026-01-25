import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

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

    // 查询行程记录
    const itineraryItems = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId));

    // 分析时间线
    const analysis: any = {
      orderId,
      orderCreatedAt: order.createdAt,
      ticketFee: order.ticketFee,
      hasAttractions: false,
      flights: [],
      medicalConsultation: null,
      hotel: null,
      attractions: [],
      issues: [],
    };

    // 分类分析行程项目
    for (const item of itineraryItems) {
      if (item.type === 'flight') {
        const flightDetails = item.metadata?.flightDetails;
        if (flightDetails && flightDetails.segments) {
          analysis.flights.push({
            id: item.id,
            name: item.name,
            startDate: item.startDate,
            endDate: item.endDate,
            location: item.location,
            segments: flightDetails.segments.map((seg: any) => ({
              flightNumber: seg.flightNumber,
              origin: seg.origin,
              destination: seg.destination,
              departureTime: seg.departureTime,
              arrivalTime: seg.arrivalTime,
            })),
          });
        }
      } else if (item.type === 'ticket') {
        const metadata = item.metadata || {};
        if (metadata.medicalType === 'consultation') {
          analysis.medicalConsultation = {
            id: item.id,
            name: item.name,
            startDate: item.startDate,
            endDate: item.endDate,
            location: item.location,
          };
        } else if (metadata.attractionType === 'tourism') {
          analysis.hasAttractions = true;
          analysis.attractions.push({
            id: item.id,
            name: item.name,
            startDate: item.startDate,
            endDate: item.endDate,
            location: item.location,
            price: item.price,
          });
        }
      } else if (item.type === 'hotel') {
        analysis.hotel = {
          id: item.id,
          name: item.name,
          startDate: item.startDate,
          endDate: item.endDate,
          location: item.location,
        };
      }
    }

    // 验证问题
    if (analysis.flights.length !== 2) {
      analysis.issues.push({
        type: 'flight_count',
        severity: 'error',
        message: `Expected 2 flights (round trip), found ${analysis.flights.length}`,
      });
    }

    if (analysis.flights.length >= 2) {
      const outbound = analysis.flights[0];
      const returnFlight = analysis.flights[1];

      // 检查第一段航班的起点
      const firstSegmentOrigin = outbound.segments[0].origin;
      const firstSegmentDestination = outbound.segments[outbound.segments.length - 1].destination;

      // 检查第二段航班的起点
      const returnSegmentOrigin = returnFlight.segments[0].origin;
      const returnSegmentDestination = returnFlight.segments[returnFlight.segments.length - 1].destination;

      // 期望的逻辑：去程是 New York → Changchun，返程是 Changchun → New York
      if (firstSegmentOrigin !== 'New York') {
        analysis.issues.push({
          type: 'outbound_origin',
          severity: 'error',
          message: `Outbound flight should start from New York, but starts from ${firstSegmentOrigin}`,
        });
      }

      if (firstSegmentDestination !== 'Changchun') {
        analysis.issues.push({
          type: 'outbound_destination',
          severity: 'error',
          message: `Outbound flight should end at Changchun, but ends at ${firstSegmentDestination}`,
        });
      }

      if (returnSegmentOrigin !== 'Changchun') {
        analysis.issues.push({
          type: 'return_origin',
          severity: 'error',
          message: `Return flight should start from Changchun, but starts from ${returnSegmentOrigin}`,
        });
      }

      if (returnSegmentDestination !== 'New York') {
        analysis.issues.push({
          type: 'return_destination',
          severity: 'error',
          message: `Return flight should end at New York, but ends at ${returnSegmentDestination}`,
        });
      }
    }

    // 检查医疗咨询时间
    if (analysis.medicalConsultation) {
      const medicalDate = new Date(analysis.medicalConsultation.startDate);
      // 检查是否是凌晨时间（不合理）
      const hours = medicalDate.getUTCHours();
      if (hours >= 0 && hours < 6) {
        analysis.issues.push({
          type: 'medical_time',
          severity: 'warning',
          message: `Medical consultation at ${medicalDate.toISOString()} (UTC ${hours}:00) - Hospital may not be open at this time`,
        });
      }
    }

    // 检查景点缺失
    if (!analysis.hasAttractions && Number(order.ticketFee || 0) > 0) {
      analysis.issues.push({
        type: 'missing_attractions',
        severity: 'error',
        message: `Order has ticket fee (${order.ticketFee}) but no attraction itineraries found`,
      });
    }

    // 生成推荐的时间线
    analysis.recommendedTimeline = generateRecommendedTimeline(analysis);

    return NextResponse.json({
      success: true,
      data: analysis,
    });

  } catch (error) {
    console.error('Failed to diagnose order:', error);
    return NextResponse.json(
      { error: 'Failed to diagnose order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateRecommendedTimeline(analysis: any) {
  const timeline: any[] = [];
  const issues = analysis.issues;

  // 如果航班方向错误，提供修正建议
  const hasFlightDirectionError = issues.some((i: any) =>
    i.type === 'outbound_origin' || i.type === 'outbound_destination' ||
    i.type === 'return_origin' || i.type === 'return_destination'
  );

  if (hasFlightDirectionError && analysis.flights.length >= 2) {
    const outbound = analysis.flights[0];
    const returnFlight = analysis.flights[1];

    // 建议去程：New York → Changchun
    timeline.push({
      type: 'flight',
      action: 'create_outbound',
      description: 'Flight from New York to Changchun',
      origin: 'New York',
      destination: 'Changchun',
      connection: 'Beijing',
    });

    // 建议时间安排
    timeline.push({
      type: 'hotel',
      action: 'adjust',
      description: 'Hotel check-in (after arrival)',
      location: 'Changchun',
    });

    timeline.push({
      type: 'ticket',
      action: 'adjust',
      description: 'Medical consultation (morning, 10:00 AM local time)',
      location: 'Changchun',
      time: '10:00 AM',
    });

    if (!analysis.hasAttractions) {
      timeline.push({
        type: 'ticket',
        action: 'create',
        description: 'Add attractions (museum, park)',
        location: 'Changchun',
        time: 'afternoon',
      });
    }

    // 建议返程：Changchun → New York
    timeline.push({
      type: 'flight',
      action: 'create_return',
      description: 'Flight from Changchun to New York',
      origin: 'Changchun',
      destination: 'New York',
      connection: 'Beijing',
    });
  }

  return timeline;
}
