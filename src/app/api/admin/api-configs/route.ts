import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { apiConfigs } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

/**
 * 获取所有API配置
 * GET /api/admin/api-configs
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: 添加权限验证
    const db = await getDb();
    const configs = await db.select().from(apiConfigs).orderBy(apiConfigs.provider);

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Failed to fetch API configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API configs' },
      { status: 500 }
    );
  }
}

/**
 * 创建API配置
 * POST /api/admin/api-configs
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: 添加权限验证
    const body = await request.json();

    // 验证必填字段
    if (!body.provider || !body.name || !body.baseUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, name, baseUrl' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 检查provider是否已存在
    const existing = await db
      .select()
      .from(apiConfigs)
      .where(eq(apiConfigs.provider, body.provider as any));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'API provider already configured' },
        { status: 409 }
      );
    }

    // 创建配置
    const [newConfig] = await db
      .insert(apiConfigs)
      .values({
        id: crypto.randomUUID(),
        provider: body.provider,
        name: body.name,
        description: body.description,
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        apiSecret: body.apiSecret,
        webhookUrl: body.webhookUrl,
        isActive: body.isActive ?? true,
        isDefault: body.isDefault ?? false,
        rateLimit: body.rateLimit,
        timeout: body.timeout || 30000,
        retryCount: body.retryCount || 3,
        config: body.config,
        metadata: body.metadata,
      })
      .returning();

    return NextResponse.json({ config: newConfig }, { status: 201 });
  } catch (error) {
    console.error('Failed to create API config:', error);
    return NextResponse.json(
      { error: 'Failed to create API config' },
      { status: 500 }
    );
  }
}
