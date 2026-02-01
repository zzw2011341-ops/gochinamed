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
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 查询订单的行程记录
    const itineraryItems = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId));

    // 找到航班
    const flightItems = itineraryItems.filter(item => item.type === 'flight');
    
    if (flightItems.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Expected 2 flight itineraries' },
        { status: 400 }
      );
    }

    // 按开始时间排序，确定去程和返程
    const validFlightItems = flightItems.filter(item => item.startDate !== null && item.endDate !== null);
    if (validFlightItems.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Both flights must have start and end dates' },
        { status: 400 }
      );
    }
    validFlightItems.sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    const outboundFlight = validFlightItems[0];
    const returnFlight = validFlightItems[1];

    // 检查返回航班的时间是否合理
    const outboundEnd = new Date(outboundFlight.endDate!);
    const returnStart = new Date(returnFlight.startDate!);
    
    // 返回航班开始应该至少比去程航班结束晚1天
    const expectedReturnStart = new Date(outboundEnd.getTime() + 24 * 60 * 60 * 1000);
    
    let hasIssues = [];
    
    // 检查时间顺序
    if (returnStart < expectedReturnStart) {
      hasIssues.push({
        type: 'time_order',
        message: `返回航班开始时间 (${returnStart.toISOString()}) 太早，应该在 ${expectedReturnStart.toISOString()} 之后`
      });
    }

    // 检查航班段的起点和终点是否正确
    const returnMetadata = returnFlight.metadata as any;
    if (returnMetadata && returnMetadata.flightDetails) {
      const segments = returnMetadata.flightDetails.segments;
      if (segments.length === 2) {
        const firstSegment = segments[0];
        const secondSegment = segments[1];
        
        // 返回航班应该是：纽约 -> 北京 -> 长春
        if (firstSegment.origin !== 'New York') {
          hasIssues.push({
            type: 'route_error',
            message: `返回航班第一段起点应该是 New York，实际是 ${firstSegment.origin}`
          });
        }
        
        if (secondSegment.destination !== 'Changchun') {
          hasIssues.push({
            type: 'route_error',
            message: `返回航班第二段终点应该是 Changchun，实际是 ${secondSegment.destination}`
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Flight data verified',
      data: {
        hasIssues: hasIssues.length > 0,
        issues: hasIssues,
        outboundFlight: {
          id: outboundFlight.id,
          name: outboundFlight.name,
          startDate: outboundFlight.startDate,
          endDate: outboundFlight.endDate,
          location: outboundFlight.location,
        },
        returnFlight: {
          id: returnFlight.id,
          name: returnFlight.name,
          startDate: returnFlight.startDate,
          endDate: returnFlight.endDate,
          location: returnFlight.location,
        },
        timeCheck: {
          outboundEnd: outboundEnd.toISOString(),
          returnStart: returnStart.toISOString(),
          expectedReturnStart: expectedReturnStart.toISOString(),
          daysDifference: (returnStart.getTime() - outboundEnd.getTime()) / (24 * 60 * 60 * 1000),
        }
      }
    });

  } catch (error) {
    console.error('Failed to verify flight data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify flight data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
