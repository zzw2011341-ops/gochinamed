import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

const config = new Config();
const llmClient = new LLMClient(config);

interface AdjustmentRequest {
  reason: string;
  type: 'consultation' | 'examination' | 'surgery' | 'treatment' | 'rehabilitation';
  currentValue?: string;
  newValue?: string;
  userId: string;
}

interface AdjustmentResponse {
  success: boolean;
  adjustment: {
    id: string;
    orderId: string;
    type: string;
    reason: string;
    currentValue: string;
    newValue: string;
    priceAdjustment: number;
    priceAdjustmentStatus: 'pending';
    createdAt: Date;
  };
  newTotalAmount: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body: AdjustmentRequest = await request.json();

    // 验证必需字段
    if (!body.reason || !body.type || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: reason, type, userId' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 获取订单信息
    const orderRecords = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderRecords || orderRecords.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderRecords[0];

    // 验证用户权限
    if (order.userId !== body.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User does not own this order' },
        { status: 403 }
      );
    }

    // 检查订单状态（只有confirmed状态可以调整）
    if (order.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Order must be in confirmed status to adjust plan' },
        { status: 400 }
      );
    }

    // 使用AI评估价格调整
    let priceAdjustment = 0;

    try {
      const prompt = `You are a medical tourism pricing expert. Evaluate the price adjustment for the following plan change:

Order Details:
- Order ID: ${orderId}
- Original Plan: ${order.medicalPlan || 'N/A'}
- Original Consultation Direction: ${order.consultationDirection || 'N/A'}
- Original Examination Items: ${order.examinationItems || 'N/A'}
- Original Surgery Types: ${order.surgeryTypes || 'N/A'}
- Original Treatment Direction: ${order.treatmentDirection || 'N/A'}
- Original Rehabilitation Direction: ${order.rehabilitationDirection || 'N/A'}
- Original Medical Fee: ${order.medicalFee || 'N/A'}

Proposed Change:
- Adjustment Type: ${body.type}
- Reason: ${body.reason}
- Current Value: ${body.currentValue || 'N/A'}
- New Value: ${body.newValue || 'N/A'}

Please evaluate the price impact of this change and provide:
1. The price adjustment amount (positive for increase, negative for decrease)
2. A brief explanation of the pricing logic

Respond in JSON format:
{
  "priceAdjustment": number (e.g., 500 for $500 increase, -300 for $300 decrease),
  "explanation": "Brief explanation of why this price change was calculated"
}

Be conservative and realistic in pricing. Consider market rates for medical services in China.`;

      const response = await llmClient.stream([
        { role: 'system', content: 'You are a JSON generator. Only output valid JSON objects.' },
        { role: 'user', content: prompt }
      ], {
        model: 'doubao-seed-1-6-251015',
        temperature: 0.5,
        thinking: 'disabled',
      });

      let fullContent = '';
      for await (const chunk of response) {
        if (chunk.content) {
          fullContent += chunk.content.toString();
        }
      }

      // 解析AI响应
      try {
        const cleanContent = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const aiResponse = JSON.parse(cleanContent);
        priceAdjustment = Number(aiResponse.priceAdjustment) || 0;
      } catch (parseError) {
        console.error('Failed to parse AI pricing response:', parseError);
        // 如果解析失败，使用默认估算
        priceAdjustment = estimatePriceAdjustment(body.type, body.newValue, body.currentValue);
      }
    } catch (aiError) {
      console.error('AI pricing failed, using default estimation:', aiError);
      priceAdjustment = estimatePriceAdjustment(body.type, body.newValue, body.currentValue);
    }

    // 获取现有的调整记录
    let existingAdjustments: any[] = [];
    if (order.planAdjustments) {
      try {
        if (Array.isArray(order.planAdjustments)) {
          existingAdjustments = order.planAdjustments;
        } else if (typeof order.planAdjustments === 'string') {
          existingAdjustments = JSON.parse(order.planAdjustments);
        }
      } catch (e) {
        existingAdjustments = [];
      }
    }

    // 创建新的调整记录
    const adjustmentId = `adj-${Date.now()}`;
    const newAdjustment = {
      id: adjustmentId,
      type: body.type,
      reason: body.reason,
      currentValue: body.currentValue || '',
      newValue: body.newValue || '',
      priceAdjustment,
      priceAdjustmentStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    // 更新调整历史
    existingAdjustments.push(JSON.stringify(newAdjustment));

    // 计算新的总价
    const currentPriceAdjustmentAmount = typeof order.priceAdjustmentAmount === 'number'
      ? order.priceAdjustmentAmount
      : parseFloat(order.priceAdjustmentAmount || '0');
    const newPriceAdjustmentAmount = currentPriceAdjustmentAmount + priceAdjustment;
    const currentTotalAmount = typeof order.totalAmount === 'number'
      ? order.totalAmount
      : parseFloat(order.totalAmount || '0');
    const newTotalAmount = currentTotalAmount + priceAdjustment;

    // 更新订单
    await db
      .update(orders)
      .set({
        planAdjustments: JSON.stringify(existingAdjustments),
        priceAdjustmentAmount: newPriceAdjustmentAmount.toString(),
        priceAdjustmentStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const responseAdjustment = {
      ...newAdjustment,
      orderId,
      createdAt: new Date(newAdjustment.createdAt),
    };

    return NextResponse.json({
      success: true,
      adjustment: responseAdjustment,
      newTotalAmount: newTotalAmount.toString(),
    } as AdjustmentResponse);
  } catch (error) {
    console.error('Plan adjustment error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 估算价格调整（当AI不可用时）
function estimatePriceAdjustment(
  type: string,
  newValue?: string,
  currentValue?: string
): number {
  // 根据调整类型和新旧值估算价格变化
  const adjustments: { [key: string]: number } = {
    consultation: 300,
    examination: 500,
    surgery: 2000,
    treatment: 1000,
    rehabilitation: 800,
  };

  return adjustments[type] || 0;
}