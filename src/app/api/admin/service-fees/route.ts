import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { serviceFees } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// 验证schema
const updateServiceFeeSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['medical', 'flight', 'hotel', 'ticket', 'general']),
  rate: z.number().min(0).max(1),
  minFee: z.number().min(0),
  maxFee: z.number().min(0).optional(),
  descriptionEn: z.string().optional(),
  descriptionZh: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET - 获取所有服务费率
 */
export async function GET() {
  try {
    const db = await getDb();

    const fees = await db.select().from(serviceFees);

    return NextResponse.json({
      success: true,
      fees: fees.map((fee: any) => ({
        id: fee.id,
        type: fee.type,
        rate: Number(fee.rate),
        minFee: fee.minFee ? Number(fee.minFee) : 0,
        maxFee: fee.maxFee ? Number(fee.maxFee) : null,
        descriptionEn: fee.descriptionEn,
        descriptionZh: fee.descriptionZh,
        isActive: fee.isActive,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch service fees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service fees' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新服务费率
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateServiceFeeSchema.parse(body);

    const db = await getDb();

    const updateData: any = {
      rate: validatedData.rate.toString(),
      minFee: validatedData.minFee.toString(),
      descriptionEn: validatedData.descriptionEn,
      descriptionZh: validatedData.descriptionZh,
      isActive: validatedData.isActive,
      updatedAt: new Date(),
    };

    if (validatedData.maxFee !== undefined) {
      updateData.maxFee = validatedData.maxFee.toString();
    }

    const updated = await db
      .update(serviceFees)
      .set(updateData)
      .where(eq(serviceFees.type, validatedData.type))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Service fee updated successfully',
      fee: {
        id: updated[0].id,
        type: updated[0].type,
        rate: Number(updated[0].rate),
        minFee: Number(updated[0].minFee),
        maxFee: updated[0].maxFee ? Number(updated[0].maxFee) : null,
        descriptionEn: updated[0].descriptionEn,
        descriptionZh: updated[0].descriptionZh,
        isActive: updated[0].isActive,
      },
    });
  } catch (error) {
    console.error('Failed to update service fee:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update service fee' },
      { status: 500 }
    );
  }
}
