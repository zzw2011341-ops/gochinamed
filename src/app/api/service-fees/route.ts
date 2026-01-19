import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { serviceFees } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const db = await getDb();

    // 获取所有活跃的中介费率
    const fees = await db
      .select()
      .from(serviceFees)
      .where(eq(serviceFees.isActive, true));

    return NextResponse.json({
      success: true,
      fees: fees.map((fee: any) => ({
        type: fee.type,
        rate: Number(fee.rate),
        minFee: fee.minFee ? Number(fee.minFee) : 0,
        maxFee: fee.maxFee ? Number(fee.maxFee) : null,
        descriptionEn: fee.descriptionEn,
        descriptionZh: fee.descriptionZh,
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
