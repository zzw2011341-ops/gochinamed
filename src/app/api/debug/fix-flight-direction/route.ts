import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { searchFlightRoute } from '@/lib/services/flightSearchService';
import { generateFlightDetails } from '@/lib/services/flightDetailsGenerator';

/**
 * 中国城市列表（就医目的地）
 */
const CHINA_CITIES = [
  'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu',
  'hangzhou', 'wuhan', 'nanjing', 'xian', 'chongqing',
  'tianjin', 'qingdao', 'dalian', 'changchun', 'harbin',
  'shenyang', 'jinan', 'zhengzhou', 'changsha', 'nanning',
  'kunming', 'guiyang', 'lhasa', 'urumqi', 'lanzhou',
  'xining', 'yinchuan', 'taiyuan', 'shijiazhuang', 'hefei',
  'fuzhou', 'xiamen', 'nanchang', 'suzhou', 'ningbo',
  'wuxi', 'changzhou', 'nanchang', 'haikou', 'sanya'
];

/**
 * 航班方向纠正API
 * 检测并纠正订单中的航班方向错误
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
        message: 'Order has less than 2 flights, cannot determine direction'
      }, { status: 400 });
    }

    const outboundFlight = flightItineraries[0];
    const returnFlight = flightItineraries[1];

    // 提取城市名称
    const outboundLocation = outboundFlight.location || '';
    const returnLocation = returnFlight.location || '';

    const outboundParts = outboundLocation.split(' - ');
    const returnParts = returnLocation.split(' - ');

    if (outboundParts.length !== 2 || returnParts.length !== 2) {
      return NextResponse.json({
        success: false,
        message: 'Cannot parse flight location format'
      }, { status: 400 });
    }

    const outboundOrigin = outboundParts[0].trim().toLowerCase();
    const outboundDest = outboundParts[1].trim().toLowerCase();
    const returnOrigin = returnParts[0].trim().toLowerCase();
    const returnDest = returnParts[1].trim().toLowerCase();

    // 检查航班方向是否匹配
    const isDirectionMatched =
      outboundOrigin === returnDest &&
      outboundDest === returnOrigin;

    // 检查去程目的地是否是中国城市（就医目的地应该是中国）
    const outboundDestIsChina = CHINA_CITIES.includes(outboundDest);
    const returnDestIsChina = CHINA_CITIES.includes(returnDest);

    // 确定方向是否正确
    // 如果去程目的地是中国城市，方向正确
    // 如果去程目的地不是中国城市，但回程目的地是中国城市，方向错误
    let isDirectionCorrect = false;
    if (isDirectionMatched) {
      // 往返匹配，现在判断哪个方向是合理的
      // 医疗旅游：去程应该是从国外到中国，回程是从中国回国外
      if (outboundDestIsChina && !returnDestIsChina) {
        // 去程到中国，回程离开中国 - 正确
        isDirectionCorrect = true;
      } else if (!outboundDestIsChina && returnDestIsChina) {
        // 去程离开中国，回程到中国 - 错误
        isDirectionCorrect = false;
      } else if (outboundDestIsChina && returnDestIsChina) {
        // 两个目的地都是中国 - 无法判断，假设正确
        isDirectionCorrect = true;
      } else {
        // 两个目的地都不是中国 - 无法判断，假设正确
        isDirectionCorrect = true;
      }
    }

    if (isDirectionCorrect) {
      return NextResponse.json({
        success: false,
        message: 'Flight direction is correct, no need to fix',
        details: {
          outboundDestIsChina,
          returnDestIsChina,
        }
      });
    }

    // 检测哪个方向是正确的
    // 去程的目的地应该是中国城市（就医目的地）
    let correctOriginCity: string;
    let correctDestCity: string;

    if (!outboundDestIsChina && returnDestIsChina) {
      // 回程方向正确（New York -> Changchun），去程方向错误（Changchun -> New York）
      // 正确方向应该是：New York -> Changchun -> New York
      // 所以正确Origin = returnOrigin (New York), 正确Dest = returnDest (Changchun)
      correctOriginCity = returnOrigin; // New York
      correctDestCity = returnDest; // Changchun
    } else {
      // 无法自动判断
      return NextResponse.json({
        success: false,
        message: 'Cannot automatically determine correct flight direction. Both destinations appear to be non-China cities or both are China cities.',
        details: {
          outboundDest: outboundDest,
          returnDest: returnDest,
          outboundDestIsChina,
          returnDestIsChina,
        }
      }, { status: 400 });
    }

    // 删除现有航班
    for (const flight of flightItineraries) {
      await db.delete(itineraries).where(eq(itineraries.id, flight.id));
    }

    // 重新创建航班（使用正确的方向）
    // 需要从现有航班获取travelDate和returnDate
    const travelDate = outboundFlight.startDate;
    const returnDate = returnFlight.startDate;
    const flightFee = parseFloat(order.flightFee || '0');

    if (!travelDate || !returnDate) {
      return NextResponse.json({
        success: false,
        message: 'Cannot extract travel date from existing flights'
      }, { status: 400 });
    }

    // 获取去程航班信息
    const outboundRoute = await searchFlightRoute(correctOriginCity, correctDestCity);

    // 生成详细的航班信息
    const outboundFlightDetails = generateFlightDetails(
      correctOriginCity,
      correctDestCity,
      travelDate,
      outboundRoute.hasDirectFlight,
      outboundRoute.connectionCities?.[0],
      outboundRoute.typicalPriceUSD
    );

    // 生成航班描述
    let outboundDescription;
    if (outboundFlightDetails.isDirect) {
      const segment = outboundFlightDetails.segments[0];
      outboundDescription = `Direct flight ${segment.flightNumber}`;
    } else {
      const first = outboundFlightDetails.segments[0];
      const second = outboundFlightDetails.segments[1];
      outboundDescription = `${first.flightNumber} + ${second.flightNumber} (Via ${outboundFlightDetails.connectionCity})`;
    }

    const arrivalDate = outboundFlightDetails.segments[outboundFlightDetails.segments.length - 1].arrivalTime;

    await db.insert(itineraries).values({
      id: uuidv4(),
      orderId: order.id,
      type: 'flight',
      name: outboundFlightDetails.isDirect
        ? `Flight ${outboundFlightDetails.segments[0].flightNumber}`
        : `Connecting Flight ${outboundFlightDetails.segments[0].flightNumber} + ${outboundFlightDetails.segments[1].flightNumber}`,
      description: outboundDescription,
      startDate: outboundFlightDetails.segments[0].departureTime,
      endDate: arrivalDate,
      location: `${correctOriginCity} - ${correctDestCity}`,
      price: (flightFee / 2).toString(),
      flightNumber: outboundFlightDetails.segments[0].flightNumber,
      durationMinutes: outboundFlightDetails.totalDurationMinutes,
      metadata: {
        flightDetails: outboundFlightDetails,
        isDirect: outboundFlightDetails.isDirect,
        connectionCity: outboundFlightDetails.connectionCity,
        layoverMinutes: outboundFlightDetails.layoverMinutes,
      },
      status: 'pending',
      notificationSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 创建回程航班
    const returnRoute = await searchFlightRoute(correctDestCity, correctOriginCity);

    // 生成详细的回程航班信息
    const returnFlightDetails = generateFlightDetails(
      correctDestCity,
      correctOriginCity,
      returnDate as Date,
      returnRoute.hasDirectFlight,
      returnRoute.connectionCities?.[0],
      returnRoute.typicalPriceUSD
    );

    // 生成回程航班描述
    let returnDescription;
    if (returnFlightDetails.isDirect) {
      const segment = returnFlightDetails.segments[0];
      returnDescription = `Direct flight ${segment.flightNumber}`;
    } else {
      const first = returnFlightDetails.segments[0];
      const second = returnFlightDetails.segments[1];
      returnDescription = `${first.flightNumber} + ${second.flightNumber} (Via ${returnFlightDetails.connectionCity})`;
    }

    await db.insert(itineraries).values({
      id: uuidv4(),
      orderId: order.id,
      type: 'flight',
      name: returnFlightDetails.isDirect
        ? `Flight ${returnFlightDetails.segments[0].flightNumber}`
        : `Connecting Flight ${returnFlightDetails.segments[0].flightNumber} + ${returnFlightDetails.segments[1].flightNumber}`,
      description: returnDescription,
      startDate: returnFlightDetails.segments[0].departureTime,
      endDate: returnFlightDetails.segments[returnFlightDetails.segments.length - 1].arrivalTime,
      location: `${correctDestCity} - ${correctOriginCity}`,
      price: (flightFee / 2).toString(),
      flightNumber: returnFlightDetails.segments[0].flightNumber,
      durationMinutes: returnFlightDetails.totalDurationMinutes,
      metadata: {
        flightDetails: returnFlightDetails,
        isDirect: returnFlightDetails.isDirect,
        connectionCity: returnFlightDetails.connectionCity,
        layoverMinutes: returnFlightDetails.layoverMinutes,
      },
      status: 'pending',
      notificationSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 更新订单记录，标记航班方向已修正
    await db.update(orders)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      success: true,
      message: 'Flight direction corrected successfully',
      details: {
        orderId,
        oldOutbound: `${outboundOrigin} -> ${outboundDest}`,
        oldReturn: `${returnOrigin} -> ${returnDest}`,
        newOutbound: `${correctOriginCity} -> ${correctDestCity}`,
        newReturn: `${correctDestCity} -> ${correctOriginCity}`,
        arrivalDate: arrivalDate.toISOString(),
        reason: 'Flight direction was reversed. Corrected based on destination being a China city.',
      },
      recommendation: 'Please also adjust hotel and medical consultation dates based on the corrected arrival date.',
    });

  } catch (error) {
    console.error('Fix flight direction error:', error);
    return NextResponse.json(
      { error: 'Failed to fix flight direction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
