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

    // 找到两个航班
    const flightItems = itineraryItems.filter(item => item.type === 'flight');
    if (flightItems.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Expected 2 flight itineraries' },
        { status: 400 }
      );
    }

    // 确定去程和返程（按时间排序）
    const validFlightItems = flightItems.filter(item => item.startDate !== null);
    if (validFlightItems.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Both flights must have start dates' },
        { status: 400 }
      );
    }
    validFlightItems.sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    const outboundFlight = validFlightItems[0];
    const returnFlight = validFlightItems[1];

    // 检查并修复返回航班的时间
    let needsFix = false;
    const metadata = returnFlight.metadata as any;
    
    if (metadata && metadata.flightDetails) {
      const segments = metadata.flightDetails.segments;
      
      // 检查第二段航班（北京到长春）的时间是否合理
      if (segments.length === 2) {
        const secondSegment = segments[1];
        const firstSegment = segments[0];
        
        // 验证时间逻辑
        // 第一段：纽约到北京
        // 第二段：北京到长春
        // 北京到长春应该飞行2小时，所以到达时间应该是出发时间+2小时
        
        const firstDeparture = new Date(firstSegment.departureTime);
        const firstArrival = new Date(firstSegment.arrivalTime);
        const correctSecondDeparture = new Date(firstArrival.getTime() + (metadata.layoverMinutes || 0) * 60 * 1000);
        const correctSecondArrival = new Date(correctSecondDeparture.getTime() + 120 * 60 * 1000); // 2小时飞行
        
        // 如果当前时间不正确，则修复
        if (Math.abs(secondSegment.departureTime.getTime() - correctSecondDeparture.getTime()) > 1000 ||
            Math.abs(secondSegment.arrivalTime.getTime() - correctSecondArrival.getTime()) > 1000) {
          
          // 更新航班段时间
          secondSegment.departureTime = correctSecondDeparture;
          secondSegment.arrivalTime = correctSecondArrival;
          
          // 更新航班总时间
          metadata.flightDetails.totalDurationMinutes = 
            (correctSecondDeparture.getTime() - firstSegment.departureTime.getTime()) / (60 * 1000) +
            120; // 第一段飞行时间 + 中转时间 + 第二段飞行时间
          
          // 更新行程的结束时间
          const newEndDate = correctSecondArrival;
          const newDurationMinutes = Math.floor((newEndDate.getTime() - returnFlight.startDate!.getTime()) / (60 * 1000));
          
          // 更新数据库
          await db
            .update(itineraries)
            .set({
              endDate: newEndDate,
              durationMinutes: newDurationMinutes,
              metadata: metadata,
              updatedAt: new Date(),
            })
            .where(eq(itineraries.id, returnFlight.id));
          
          needsFix = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: needsFix ? 'Return flight times fixed successfully' : 'Return flight times are correct',
      data: {
        fixed: needsFix,
        returnFlightId: returnFlight.id,
        outboundFlight: {
          id: outboundFlight.id,
          startDate: outboundFlight.startDate,
          endDate: outboundFlight.endDate,
        },
        returnFlight: {
          id: returnFlight.id,
          startDate: returnFlight.startDate,
          endDate: returnFlight.endDate,
        },
      }
    });

  } catch (error) {
    console.error('Failed to fix return flight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix return flight', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
