import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';
import { searchFlightRoute } from '@/lib/services/flightSearchService';

/**
 * 修复订单的航班和酒店数据
 * 用于更新旧订单中的错误数据（如错误的直飞/中转信息、时间顺序混乱等）
 */
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

    // 查询订单信息
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const order = orderList[0];
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // 查询订单的所有行程记录
    const itineraryItems = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId));

    let updatedCount = 0;
    const updateLog: any[] = [];

    // 修复航班数据
    for (const item of itineraryItems) {
      if (item.type === 'flight' && item.location) {
        // 解析航线信息，格式为 "Origin - Destination"
        const routeParts = item.location.split(' - ');
        if (routeParts.length === 2) {
          const originCity = routeParts[0].trim();
          const destCity = routeParts[1].trim();

          try {
            // 使用修复后的 searchFlightRoute 获取正确的航班信息
            const route = await searchFlightRoute(originCity, destCity);

            // 生成新的航班描述
            let newDescription = `Flight from ${originCity} to ${destCity}`;
            if (route.hasDirectFlight) {
              newDescription += ' (Direct)';
            } else if (route.connectionCities && route.connectionCities.length > 0) {
              newDescription += ` (Via ${route.connectionCities.join(', ')})`;
            } else {
              newDescription += ' (Connection required)';
            }

            // 更新航班记录
            await db
              .update(itineraries)
              .set({
                description: newDescription,
                durationMinutes: route.estimatedDurationMinutes,
                updatedAt: new Date(),
              })
              .where(eq(itineraries.id, item.id));

            updateLog.push({
              type: 'flight',
              id: item.id,
              route: `${originCity} -> ${destCity}`,
              oldDescription: item.description,
              newDescription,
              oldDuration: item.durationMinutes,
              newDuration: route.estimatedDurationMinutes,
              isDirect: route.hasDirectFlight,
              connectionCities: route.connectionCities,
            });

            updatedCount++;
          } catch (error) {
            console.error(`Failed to update flight ${item.id}:`, error);
            updateLog.push({
              type: 'flight',
              id: item.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    }

    // 修复酒店时间顺序问题
    // 如果酒店的开始时间晚于结束时间，则交换时间
    for (const item of itineraryItems) {
      if (item.type === 'hotel' && item.startDate && item.endDate) {
        const startTime = new Date(item.startDate).getTime();
        const endTime = new Date(item.endDate).getTime();

        if (startTime > endTime) {
          // 交换开始和结束时间
          await db
            .update(itineraries)
            .set({
              startDate: item.endDate,
              endDate: item.startDate,
              updatedAt: new Date(),
            })
            .where(eq(itineraries.id, item.id));

          updateLog.push({
            type: 'hotel',
            id: item.id,
            action: 'swapped_dates',
            oldStart: item.startDate,
            oldEnd: item.endDate,
            newStart: item.endDate,
            newEnd: item.startDate,
          });

          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      updatedCount,
      updateLog,
      message: `Successfully updated ${updatedCount} itinerary items`,
    });
  } catch (error) {
    console.error('Fix itinerary error:', error);
    return NextResponse.json(
      { error: 'Failed to fix itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
