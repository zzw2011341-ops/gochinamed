import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * 景点修复API
 * 为已存在订单（有ticketFee但无景点记录）智能添加默认景点
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

    // 检查是否需要添加景点
    const ticketFee = parseFloat(order.ticketFee || '0');
    if (ticketFee === 0) {
      return NextResponse.json({
        success: false,
        message: 'Order has no ticket fee, no attractions needed'
      }, { status: 400 });
    }

    // 获取现有行程记录
    const itineraryList = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId))
      .orderBy(itineraries.startDate);

    // 检查是否已有景点
    const existingAttractions = itineraryList.filter(i => i.type === 'ticket' && i.metadata && (i.metadata as any).attractionType);
    if (existingAttractions.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Order already has ${existingAttractions.length} attractions`
      }, { status: 400 });
    }

    // 提取关键时间点
    const outboundFlight = itineraryList.find(i => i.type === 'flight' && (i.name.includes('Connecting') || i.name.includes('Flight')));
    const returnFlight = [...itineraryList].reverse().find(i => i.type === 'flight');
    const medicalConsultation = itineraryList.find(i => i.type === 'ticket' && i.metadata && (i.metadata as any).medicalType);

    const arrivalDate = outboundFlight?.endDate;
    const returnDate = returnFlight?.startDate;

    if (!arrivalDate || !returnDate) {
      return NextResponse.json({
        success: false,
        message: 'Cannot find flight information'
      }, { status: 400 });
    }

    // 获取目的地城市
    const hotelItinerary = itineraryList.find(i => i.type === 'hotel');
    const destinationCity = hotelItinerary?.location || 'Unknown';

    // 根据城市选择默认景点
    const defaultAttractions = getDefaultAttractionsForCity(destinationCity);

    // 计算最佳景点日期
    // 智能选择：必须在医疗咨询之后，且在到达之后
    let attractionDate;

    // 计算医疗咨询后1天的日期
    let dateAfterMedical: Date | null = null;
    if (medicalConsultation && medicalConsultation.endDate) {
      dateAfterMedical = new Date(medicalConsultation.endDate.getTime());
      dateAfterMedical.setDate(dateAfterMedical.getDate() + 1);
      dateAfterMedical.setHours(14, 0, 0, 0);
    }

    // 计算到达后2天的日期
    const dateAfterArrival = new Date(arrivalDate.getTime());
    dateAfterArrival.setDate(dateAfterArrival.getDate() + 2);
    dateAfterArrival.setHours(10, 0, 0, 0);

    // 选择较晚的日期（确保在医疗咨询和到达之后）
    if (dateAfterMedical && dateAfterMedical > dateAfterArrival) {
      attractionDate = dateAfterMedical;
    } else {
      attractionDate = dateAfterArrival;
    }

    // 最终验证：确保景点在到达后至少1天，在回程前至少1天
    const minAttractionDate = new Date(arrivalDate.getTime() + 24 * 60 * 60 * 1000);
    const maxAttractionDate = new Date(returnDate.getTime() - 24 * 60 * 60 * 1000);

    // 如果计算出的日期早于最小日期，使用最小日期
    if (attractionDate < minAttractionDate) {
      attractionDate = new Date(minAttractionDate.getTime());
      attractionDate.setHours(10, 0, 0, 0);
    }

    // 如果日期晚于最大日期，返回错误
    if (attractionDate >= maxAttractionDate) {
      return NextResponse.json({
        success: false,
        message: 'No available time slot for attractions',
        details: {
          attractionDate: attractionDate.toISOString(),
          minAttractionDate: minAttractionDate.toISOString(),
          maxAttractionDate: maxAttractionDate.toISOString(),
          medicalConsultationEnd: medicalConsultation?.endDate?.toISOString(),
          arrivalDate: arrivalDate.toISOString(),
        }
      }, { status: 400 });
    }

    // 添加默认景点
    const createdAttractions = [];
    for (const attraction of defaultAttractions) {
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

      // 下一个景点安排在第二天
      attractionDate = new Date(attractionDate.getTime());
      attractionDate.setDate(attractionDate.getDate() + 1);
      attractionDate.setHours(10, 0, 0, 0);

      // 检查是否还有足够的时间
      if (attractionDate >= maxAttractionDate) {
        break;
      }
    }

    // 更新订单的门票费用（如果需要）
    const totalAttractionPrice = createdAttractions.reduce((sum, a) => sum + parseFloat(a.price || '0'), 0);
    if (Math.abs(totalAttractionPrice - ticketFee) > 0.01) {
      console.warn(`Attraction price (${totalAttractionPrice}) differs from ticket fee (${ticketFee})`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${createdAttractions.length} attractions`,
      attractions: createdAttractions,
      summary: {
        orderId,
        destinationCity,
        arrivalDate: arrivalDate.toISOString(),
        returnDate: returnDate.toISOString(),
        attractionDate: createdAttractions[0]?.startDate?.toISOString() || '',
        totalAttractionPrice,
        ticketFee,
      }
    });

  } catch (error) {
    console.error('Add attractions error:', error);
    return NextResponse.json(
      { error: 'Failed to add attractions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * 根据城市获取默认景点
 */
function getDefaultAttractionsForCity(city: string): any[] {
  const cityLower = city.toLowerCase();

  const cityAttractions: Record<string, any[]> = {
    'beijing': [
      { id: 'bj-001', nameEn: 'Forbidden City', description: 'The imperial palace of Ming and Qing dynasties', price: 15 },
      { id: 'bj-002', nameEn: 'Great Wall of China', description: 'Ancient fortification built to protect China', price: 10 },
    ],
    'shanghai': [
      { id: 'sh-001', nameEn: 'The Bund', description: 'Famous waterfront area with colonial buildings', price: 0 },
      { id: 'sh-002', nameEn: 'Oriental Pearl Tower', description: 'Iconic TV tower and observation deck', price: 20 },
    ],
    'changchun': [
      { id: 'cc-001', nameEn: 'Changchun World Sculpture Park', description: 'World-class sculpture exhibition park', price: 10 },
      { id: 'cc-002', nameEn: 'Jingyuetan National Forest Park', description: 'Beautiful forest park with lake and nature', price: 15 },
    ],
    'guangzhou': [
      { id: 'gz-001', nameEn: 'Canton Tower', description: 'One of the tallest towers in the world', price: 18 },
      { id: 'gz-002', nameEn: 'Chen Clan Ancestral Hall', description: 'Traditional Lingnan architecture', price: 10 },
    ],
    'shenzhen': [
      { id: 'sz-001', nameEn: 'Window of the World', description: 'Famous theme park with world landmarks', price: 25 },
      { id: 'sz-002', nameEn: 'Dameisha Beach', description: 'Beautiful beach with sunshine and sand', price: 0 },
    ],
  };

  // 查找匹配的城市
  for (const [key, attractions] of Object.entries(cityAttractions)) {
    if (cityLower.includes(key)) {
      return attractions;
    }
  }

  // 默认景点
  return [
    { id: 'default-001', nameEn: 'City Museum', description: 'Local history and culture exhibition', price: 10 },
    { id: 'default-002', nameEn: 'City Park', description: 'Beautiful park for relaxation', price: 5 },
  ];
}
