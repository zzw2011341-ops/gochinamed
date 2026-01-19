import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 获取用户的订单，按创建时间倒序
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    // 为每个订单获取行程信息
    const ordersWithItineraries = await Promise.all(
      userOrders.map(async (order) => {
        const orderItineraries = await db
          .select()
          .from(itineraries)
          .where(eq(itineraries.orderId, order.id));

        return {
          ...order,
          itineraries: orderItineraries,
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: ordersWithItineraries,
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
