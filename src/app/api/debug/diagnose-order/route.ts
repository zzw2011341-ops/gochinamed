import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

/**
 * 订单诊断API
 * 检测订单中的问题：
 * 1. 航班方向错误（originCity和destinationCity颠倒）
 * 2. 医疗咨询时间不合理（凌晨）
 * 3. 景点缺失
 * 4. 时间线逻辑混乱
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

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

    // 获取行程记录
    const itineraryList = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId))
      .orderBy(itineraries.startDate);

    // 分析结果
    const diagnosis: any = {
      orderId,
      issues: [],
      warnings: [],
      summary: {
        totalItineraries: itineraryList.length,
        flights: itineraryList.filter(i => i.type === 'flight').length,
        hotels: itineraryList.filter(i => i.type === 'hotel').length,
        medical: itineraryList.filter(i => i.type === 'ticket' && i.metadata && (i.metadata as any).medicalType).length,
        attractions: itineraryList.filter(i => i.type === 'ticket' && i.metadata && (i.metadata as any).attractionType).length,
      },
      itineraries: [],
    };

    // 解析订单的metadata（如果有）
    let orderMetadata = {};
    try {
      const orderMetadataValue = (order as any).metadata;
      if (orderMetadataValue) {
        orderMetadata = typeof orderMetadataValue === 'string' ? JSON.parse(orderMetadataValue) : orderMetadataValue;
      }
    } catch (e) {
      console.warn('Failed to parse order metadata:', e);
    }

    // 提取航班信息用于分析
    const flightItineraries = itineraryList.filter(i => i.type === 'flight');
    const outboundFlight = flightItineraries[0];
    const returnFlight = flightItineraries[1];

    if (outboundFlight && returnFlight) {
      // 检查航班方向
      const outboundLocation = outboundFlight.location || '';
      const returnLocation = returnFlight.location || '';

      // 提取城市名称（假设格式为 "City1 - City2"）
      const outboundParts = outboundLocation.split(' - ');
      const returnParts = returnLocation.split(' - ');

      if (outboundParts.length === 2 && returnParts.length === 2) {
        const outboundOrigin = outboundParts[0].trim();
        const outboundDest = outboundParts[1].trim();
        const returnOrigin = returnParts[0].trim();
        const returnDest = returnParts[1].trim();

        // 检查去程和回程的起止点是否正确匹配
        const isDirectionCorrect =
          outboundOrigin === returnDest &&
          outboundDest === returnOrigin;

        if (!isDirectionCorrect) {
          diagnosis.issues.push({
            type: 'FLIGHT_DIRECTION_ERROR',
            severity: 'CRITICAL',
            message: '航班方向不匹配：去程和回程的起止点不一致',
            details: {
              outbound: `${outboundOrigin} -> ${outboundDest}`,
              return: `${returnOrigin} -> ${returnDest}`,
              expected: `${outboundOrigin} -> ${outboundDest} -> ${outboundOrigin}`,
            },
            recommendation: '检查bookingData中的originCity和destinationCity是否颠倒',
          });
        }

        // 检查航班顺序（去程应该在回程之前）
        if (outboundFlight.startDate && returnFlight.startDate && outboundFlight.startDate > returnFlight.startDate) {
          diagnosis.issues.push({
            type: 'FLIGHT_SEQUENCE_ERROR',
            severity: 'CRITICAL',
            message: '航班顺序错误：去程在回程之后',
            details: {
              outboundDate: outboundFlight.startDate.toISOString(),
              returnDate: returnFlight.startDate.toISOString(),
            },
            recommendation: '检查travelDate和returnDate的设置',
          });
        }
      }
    }

    // 分析每个行程记录
    for (const itinerary of itineraryList) {
      const itineraryInfo: any = {
        id: itinerary.id,
        type: itinerary.type,
        name: itinerary.name,
        startDate: itinerary.startDate ? itinerary.startDate.toISOString() : 'N/A',
        endDate: itinerary.endDate ? itinerary.endDate.toISOString() : 'N/A',
        location: itinerary.location,
        issues: [],
      };

      const metadata = itinerary.metadata as any || {};

      // 检查医疗咨询时间
      if (itinerary.type === 'ticket' && metadata.medicalType && itinerary.startDate) {
        const hour = itinerary.startDate.getUTCHours();
        if (hour >= 0 && hour < 6) {
          diagnosis.issues.push({
            type: 'MEDICAL_TIME_INVALID',
            severity: 'HIGH',
            message: '医疗咨询安排在凌晨',
            details: {
              itineraryId: itinerary.id,
              startTime: itinerary.startDate.toISOString(),
              localTime: `${hour}:00 UTC`,
            },
            recommendation: '确保医疗咨询安排在工作时间（如上午10点）',
          });
          itineraryInfo.issues.push('医疗咨询安排在凌晨');
        }

        // 检查医疗咨询是否在到达航班之后
        if (outboundFlight && outboundFlight.endDate && itinerary.startDate < outboundFlight.endDate) {
          diagnosis.issues.push({
            type: 'MEDICAL_BEFORE_ARRIVAL',
            severity: 'CRITICAL',
            message: '医疗咨询安排在到达航班之前',
            details: {
              medicalDate: itinerary.startDate.toISOString(),
              arrivalDate: outboundFlight.endDate.toISOString(),
            },
            recommendation: '确保医疗咨询基于arrivalDate计算',
          });
          itineraryInfo.issues.push('医疗咨询在到达航班之前');
        }
      }

      // 检查景点
      if (itinerary.type === 'ticket' && metadata.attractionType && itinerary.startDate) {
        // 检查景点是否在医疗咨询之后（如果存在）
        const medicalItinerary = itineraryList.find(i => i.type === 'ticket' && i.metadata && (i.metadata as any).medicalType);
        if (medicalItinerary && medicalItinerary.endDate && itinerary.startDate < medicalItinerary.endDate) {
          diagnosis.warnings.push({
            type: 'ATTRACTION_BEFORE_MEDICAL',
            severity: 'MEDIUM',
            message: '景点游览安排在医疗咨询之前',
            details: {
              attractionDate: itinerary.startDate.toISOString(),
              medicalEndDate: medicalItinerary.endDate.toISOString(),
            },
            recommendation: '建议将景点安排在医疗咨询之后',
          });
          itineraryInfo.issues.push('景点在医疗咨询之前');
        }

        // 检查景点是否在回程航班之前
        if (returnFlight && returnFlight.startDate && itinerary.startDate >= returnFlight.startDate) {
          diagnosis.issues.push({
            type: 'ATTRACTION_AFTER_RETURN',
            severity: 'HIGH',
            message: '景点游览安排在回程航班之后',
            details: {
              attractionDate: itinerary.startDate.toISOString(),
              returnDate: returnFlight.startDate.toISOString(),
            },
            recommendation: '确保景点在回程航班之前',
          });
          itineraryInfo.issues.push('景点在回程航班之后');
        }
      }

      // 检查酒店时间
      if (itinerary.type === 'hotel' && itinerary.startDate && itinerary.endDate) {
        if (outboundFlight && outboundFlight.endDate && itinerary.startDate < outboundFlight.endDate) {
          diagnosis.issues.push({
            type: 'HOTEL_BEFORE_ARRIVAL',
            severity: 'HIGH',
            message: '酒店入住安排在到达航班之前',
            details: {
              hotelStartDate: itinerary.startDate.toISOString(),
              arrivalDate: outboundFlight.endDate.toISOString(),
            },
            recommendation: '确保酒店入住在到达航班之后（建议到达后4小时）',
          });
          itineraryInfo.issues.push('酒店入住在到达航班之前');
        }

        if (returnFlight && returnFlight.startDate && itinerary.endDate > returnFlight.startDate) {
          diagnosis.issues.push({
            type: 'HOTEL_AFTER_RETURN',
            severity: 'MEDIUM',
            message: '酒店退房安排在回程航班之后',
            details: {
              hotelEndDate: itinerary.endDate.toISOString(),
              returnDate: returnFlight.startDate.toISOString(),
            },
            recommendation: '确保酒店退房在回程航班当天上午',
          });
          itineraryInfo.issues.push('酒店退房在回程航班之后');
        }
      }

      diagnosis.itineraries.push(itineraryInfo);
    }

    // 检查景点缺失
    const hasTicketFee = parseFloat(order.ticketFee || '0') > 0;
    const hasAttractions = diagnosis.summary.attractions > 0;

    if (hasTicketFee && !hasAttractions) {
      diagnosis.issues.push({
        type: 'ATTRACTIONS_MISSING',
        severity: 'HIGH',
        message: '订单有门票费用但没有景点记录',
        details: {
          ticketFee: order.ticketFee,
          attractionCount: diagnosis.summary.attractions,
        },
        recommendation: '检查支付API中的景点创建逻辑，或使用add-attractions API补录',
      });
    }

    // 生成时间线建议
    diagnosis.timelineRecommendation = generateTimelineRecommendation(order, itineraryList, diagnosis);

    return NextResponse.json(diagnosis);
  } catch (error) {
    console.error('Diagnosis error:', error);
    return NextResponse.json(
      { error: 'Diagnosis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * 生成时间线建议
 */
function generateTimelineRecommendation(order: any, itineraryList: any[], diagnosis: any): string[] {
  const recommendations: string[] = [];

  const flightItineraries = itineraryList.filter(i => i.type === 'flight');
  const outboundFlight = flightItineraries[0];
  const returnFlight = flightItineraries[1];

  if (outboundFlight && returnFlight) {
    const arrivalDate = outboundFlight.endDate;
    const returnDate = returnFlight.startDate;

    recommendations.push(`理想时间线（基于到达时间 ${arrivalDate.toISOString()}）：`);
    recommendations.push(`1. 到达航班：${outboundFlight.startDate.toISOString()} - ${arrivalDate.toISOString()}`);
    recommendations.push(`2. 酒店入住：${new Date(arrivalDate.getTime() + 4 * 60 * 60 * 1000).toISOString()}`);
    recommendations.push(`3. 医疗咨询：${new Date(arrivalDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()}（到达后1天上午10点）`);
    recommendations.push(`4. 景点游览：${new Date(arrivalDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()}（医疗咨询后1天下午2点）`);
    recommendations.push(`5. 回程航班：${returnFlight.startDate.toISOString()} - ${returnFlight.endDate.toISOString()}`);

    if (diagnosis.issues.some((i: any) => i.type === 'FLIGHT_DIRECTION_ERROR')) {
      recommendations.push('');
      recommendations.push('⚠️ 注意：检测到航班方向错误，上述时间线基于错误的航班方向计算。');
      recommendations.push('建议：重新创建订单，确保正确选择出发地（originCity）和目的地（destinationCity）。');
    }
  }

  return recommendations;
}
