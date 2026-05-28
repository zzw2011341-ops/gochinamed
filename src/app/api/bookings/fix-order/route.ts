import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, addMedicalFee = false } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 查询订单和行程记录
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

    const itineraryItems = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId));

    const results: any = {
      hotelFixed: false,
      medicalFeeFixed: false,
    };

    // 1. 修复酒店时间
    const hotelItem = itineraryItems.find(item => item.type === 'hotel');
    if (hotelItem) {
      const flightItems = itineraryItems.filter(item => item.type === 'flight');
      if (flightItems.length === 2 && flightItems[0].startDate && flightItems[1].startDate) {
        // 确定正确的起止时间
        const outboundFlight = flightItems[0].startDate < flightItems[1].startDate
          ? flightItems[0]
          : flightItems[1];
        const returnFlight = flightItems[0].startDate < flightItems[1].startDate
          ? flightItems[1]
          : flightItems[0];

        const correctStartDate = outboundFlight.startDate!;
        const correctEndDate = returnFlight.startDate!;

        // 检查是否需要修复
        if (!hotelItem.startDate || !hotelItem.endDate) {
          console.log(`Hotel item ${hotelItem.id} has null dates, skipping`);
          return NextResponse.json({
            success: false,
            error: 'Hotel dates are null',
            orderId,
          });
        }

        const needsFix = hotelItem.startDate > hotelItem.endDate;

        if (needsFix) {
          await db
            .update(itineraries)
            .set({
              startDate: correctStartDate,
              endDate: correctEndDate,
              description: `${Math.ceil((correctEndDate.getTime() - correctStartDate.getTime()) / (24 * 60 * 60 * 1000))} nights accommodation`,
              updatedAt: new Date(),
            })
            .where(eq(itineraries.id, hotelItem.id));

          results.hotelFixed = true;
          results.hotelDates = {
            oldStartDate: hotelItem.startDate,
            oldEndDate: hotelItem.endDate,
            newStartDate: correctStartDate,
            newEndDate: correctEndDate,
          };
        }
      }
    }

    // 2. 添加基本的医生咨询费用（如果请求且符合条件）
    if (addMedicalFee && order.doctorId && Number(order.medicalFee) === 0) {
      // 添加基本的医生咨询费用
      const baseConsultationFee = 200; // 基础咨询费用

      // 更新订单的医疗费用
      await db
        .update(orders)
        .set({
          medicalFee: baseConsultationFee.toString(),
          // 更新 subtotal 和 totalAmount
          subtotal: (Number(order.subtotal) + baseConsultationFee).toString(),
          totalAmount: (Number(order.totalAmount) + baseConsultationFee * 1.01).toString(), // 加上 1% 服务费
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // 更新医疗行程的价格
      const medicalItem = itineraryItems.find(item => item.type === 'ticket');
      if (medicalItem) {
        await db
          .update(itineraries)
          .set({
            price: baseConsultationFee.toString(),
            updatedAt: new Date(),
          })
          .where(eq(itineraries.id, medicalItem.id));
      }

      results.medicalFeeFixed = true;
      results.medicalFee = {
        oldMedicalFee: order.medicalFee,
        newMedicalFee: baseConsultationFee.toString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Order fixed successfully',
      data: results,
    });

  } catch (error) {
    console.error('Failed to fix order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
