import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { apiConfigs } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

/**
 * 获取单个API配置
 * GET /api/admin/api-configs/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: 添加权限验证
    const { id } = await params;

    const db = await getDb();
    const [config] = await db
      .select()
      .from(apiConfigs)
      .where(eq(apiConfigs.id, id));

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Failed to fetch API config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API config' },
      { status: 500 }
    );
  }
}

/**
 * 更新API配置
 * PATCH /api/admin/api-configs/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: 添加权限验证
    const { id } = await params;
    const body = await request.json();

    const db = await getDb();

    // 检查配置是否存在
    const existing = await db
      .select()
      .from(apiConfigs)
      .where(eq(apiConfigs.id, id));

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    // 更新配置
    const [updatedConfig] = await db
      .update(apiConfigs)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(apiConfigs.id, id))
      .returning();

    return NextResponse.json({ config: updatedConfig });
  } catch (error) {
    console.error('Failed to update API config:', error);
    return NextResponse.json(
      { error: 'Failed to update API config' },
      { status: 500 }
    );
  }
}

/**
 * 删除API配置
 * DELETE /api/admin/api-configs/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: 添加权限验证
    const { id } = await params;

    const db = await getDb();

    // 检查配置是否存在
    const existing = await db
      .select()
      .from(apiConfigs)
      .where(eq(apiConfigs.id, id));

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    // 删除配置
    await db.delete(apiConfigs).where(eq(apiConfigs.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete API config:', error);
    return NextResponse.json(
      { error: 'Failed to delete API config' },
      { status: 500 }
    );
  }
}
