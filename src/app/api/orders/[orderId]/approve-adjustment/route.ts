import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

interface ApprovalRequest {
  adjustmentId: string;
  action: 'approve' | 'reject';
  reason?: string;
  userId: string;
}

interface ApprovalResponse {
  success: boolean;
  message: string;
  newTotalAmount?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body: ApprovalRequest = await request.json();

    // 验证必需字段
    if (!body.adjustmentId || !body.action || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: adjustmentId, action, userId' },
        { status: 400 }
      );
    }

    if (body.action !== 'approve' && body.action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
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

    // 获取调整记录
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

    const adjustmentIndex = existingAdjustments.findIndex((adj: string) => {
      const parsed = JSON.parse(adj);
      return parsed.id === body.adjustmentId;
    });

    if (adjustmentIndex === -1) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    const adjustment = JSON.parse(existingAdjustments[adjustmentIndex]);

    // 如果是拒绝，移除调整并恢复价格
    if (body.action === 'reject') {
      // 从调整列表中移除
      existingAdjustments.splice(adjustmentIndex, 1);

      // 重新计算价格调整
      let totalAdjustment = 0;
      existingAdjustments.forEach((adj: string) => {
        const parsed = JSON.parse(adj);
        if (parsed.priceAdjustmentStatus === 'approved') {
          totalAdjustment += Number(parsed.priceAdjustment) || 0;
        }
      });

      const currentTotalAmount = typeof order.totalAmount === 'number'
        ? order.totalAmount
        : parseFloat(order.totalAmount || '0');
      const newTotalAmount = currentTotalAmount - (Number(adjustment.priceAdjustment) || 0);

      await db
        .update(orders)
        .set({
          planAdjustments: JSON.stringify(existingAdjustments),
          priceAdjustmentAmount: totalAdjustment.toString(),
          priceAdjustmentStatus: existingAdjustments.length > 0 ? 'pending' : null,
          totalAmount: newTotalAmount.toString(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      return NextResponse.json({
        success: true,
        message: 'Adjustment rejected successfully',
        newTotalAmount: newTotalAmount.toString(),
      } as ApprovalResponse);
    }

    // 如果是批准，更新调整状态
    adjustment.priceAdjustmentStatus = 'approved';
    adjustment.approvedAt = new Date().toISOString();
    adjustment.approvalReason = body.reason || '';

    existingAdjustments[adjustmentIndex] = JSON.stringify(adjustment);

    // 检查是否所有调整都已批准
    const allApproved = existingAdjustments.every((adj: string) => {
      const parsed = JSON.parse(adj);
      return parsed.priceAdjustmentStatus === 'approved';
    });

    await db
      .update(orders)
      .set({
        planAdjustments: JSON.stringify(existingAdjustments),
        priceAdjustmentStatus: allApproved ? 'approved' : 'pending',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      success: true,
      message: 'Adjustment approved successfully',
    } as ApprovalResponse);
  } catch (error) {
    console.error('Adjustment approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve adjustment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}