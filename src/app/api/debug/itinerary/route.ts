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

    // 查询所有行程记录
    const itineraryItems = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId));

    return NextResponse.json({
      success: true,
      data: {
        order,
        itineraryItems: itineraryItems.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          description: item.description,
          startDate: item.startDate,
          endDate: item.endDate,
          location: item.location,
          price: item.price,
          metadata: item.metadata,
          status: item.status,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch debug data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
