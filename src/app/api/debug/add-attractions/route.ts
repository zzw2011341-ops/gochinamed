import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { itineraries, orders } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// 默认景点数据（当原始数据丢失时使用）
const DEFAULT_ATTRACTIONS = {
  'Changchun': [
    { id: 'cc-1', nameEn: 'Changchun Museum', nameZh: '长春市博物馆', description: 'Museum', price: 15 },
    { id: 'cc-2', nameEn: 'Jingyuetan Park', nameZh: '净月潭', description: 'Scenic Park', price: 30 },
  ],
  'Beijing': [
    { id: 'bj-1', nameEn: 'National Museum of China', nameZh: '中国国家博物馆', description: 'Museum', price: 20 },
    { id: 'bj-2', nameEn: 'Forbidden City', nameZh: '故宫', description: 'Historic Site', price: 40 },
    { id: 'bj-3', nameEn: 'Great Wall', nameZh: '长城', description: 'Historic Site', price: 35 },
  ],
  'Shanghai': [
    { id: 'sh-1', nameEn: 'Shanghai Museum', nameZh: '上海博物馆', description: 'Museum', price: 20 },
    { id: 'sh-2', nameEn: 'The Bund', nameZh: '外滩', description: 'Scenic Area', price: 0 },
  ],
};

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

    // 检查订单是否有门票费用
    const ticketFee = Number(order.ticketFee || 0);
    if (ticketFee === 0) {
      return NextResponse.json({
        success: true,
        message: 'No ticket fee found, no attractions to add',
        order,
      });
    }

    // 查询现有行程记录
    const itineraryItems = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId));

    // 检查是否已有景点记录（type='ticket'且metadata.attractionType='tourism'）
    const hasAttractions = itineraryItems.some(
      item => item.type === 'ticket' && 
      item.metadata && 
      item.metadata.attractionType === 'tourism'
    );

    if (hasAttractions) {
      return NextResponse.json({
        success: true,
        message: 'Attractions already exist',
        itineraryItems,
      });
    }

    // 找到医疗咨询和航班信息，确定日期范围
    const medicalConsultation = itineraryItems.find(
      item => item.type === 'ticket' &&
      item.metadata &&
      item.metadata.medicalType === 'consultation'
    );

    // 按日期排序航班
    const flights = itineraryItems
      .filter(item => item.type === 'flight')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const outboundFlight = flights[0]; // 最早的航班是去程
    const returnFlight = flights[flights.length - 1]; // 最晚的航班是回程

    if (!medicalConsultation) {
      return NextResponse.json({
        success: false,
        error: 'Cannot find medical consultation',
        itineraryItems,
      });
    }

    if (!outboundFlight || !returnFlight) {
      return NextResponse.json({
        success: false,
        error: 'Cannot find flight information',
        flights,
        itineraryItems,
      });
    }

    // 获取目的地城市
    const destinationCity = medicalConsultation.location || 'Unknown';
    const cityAttractions = DEFAULT_ATTRACTIONS[destinationCity as keyof typeof DEFAULT_ATTRACTIONS] || DEFAULT_ATTRACTIONS['Beijing'];

    // 计算景点日期：医疗咨询后1天
    const medicalDate = new Date(medicalConsultation.startDate);
    const attractionDate = new Date(medicalDate);
    attractionDate.setDate(attractionDate.getDate() + 1);
    attractionDate.setHours(14, 0, 0, 0); // 下午2点

    // 检查景点日期是否在回程前至少1天
    const returnDate = new Date(returnFlight.startDate);
    const returnDateMinusOneDay = new Date(returnDate.getTime() - 24 * 60 * 60 * 1000);

    if (attractionDate >= returnDateMinusOneDay) {
      // 如果医疗咨询后没有时间，尝试在到达后、医疗咨询前安排
      const arrivalDate = new Date(outboundFlight.endDate);
      const alternativeDate = new Date(arrivalDate);
      alternativeDate.setDate(alternativeDate.getDate() + 2);
      alternativeDate.setHours(14, 0, 0, 0);

      if (alternativeDate < medicalDate && alternativeDate > arrivalDate) {
        attractionDate.setTime(alternativeDate.getTime());
      } else {
        return NextResponse.json({
          success: false,
          error: 'No available time slot for attractions',
          details: {
            medicalDate: medicalDate.toISOString(),
            arrivalDate: arrivalDate.toISOString(),
            returnDate: returnDate.toISOString(),
          },
        });
      }
    }

    // 创建景点记录（使用默认景点数据）
    const createdAttractions = [];
    for (const attraction of cityAttractions) {
      const attractionDurationMinutes = 120;
      const attractionEndDate = new Date(attractionDate.getTime() + attractionDurationMinutes * 60 * 1000);

      const [newAttraction] = await db.insert(itineraries).values({
        id: uuidv4(),
        orderId: order.id,
        type: 'ticket',
        name: attraction.nameEn,
        description: attraction.description,
        startDate: attractionDate,
        endDate: attractionEndDate,
        location: destinationCity,
        price: attraction.price.toString(),
        durationMinutes: attractionDurationMinutes,
        metadata: {
          attractionType: 'tourism',
          attractionId: attraction.id,
        },
        status: 'pending',
        notificationSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      createdAttractions.push(newAttraction);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${createdAttractions.length} attractions`,
      attractions: createdAttractions,
    });

  } catch (error) {
    console.error('Failed to add attractions:', error);
    return NextResponse.json(
      { error: 'Failed to add attractions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
