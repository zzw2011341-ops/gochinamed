import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { apiConfigs } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { apiManager } from '@/lib/api';

/**
 * 测试API连接
 * POST /api/admin/api-configs/test/[id]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let db: Awaited<ReturnType<typeof getDb>> | undefined;
  let configId: string | undefined;

  try {
    // TODO: 添加权限验证
    const resolvedParams = await params;
    configId = resolvedParams.id;

    db = await getDb();

    // 获取API配置
    const [config] = await db
      .select()
      .from(apiConfigs)
      .where(eq(apiConfigs.id, configId));

    if (!config) {
      return NextResponse.json(
        { error: 'API config not found' },
        { status: 404 }
      );
    }

    // 注册配置到API管理器
    apiManager.registerConfig({
      ...config,
      description: config.description || undefined,
      apiKey: config.apiKey || undefined,
      apiSecret: config.apiSecret || undefined,
      webhookUrl: config.webhookUrl || undefined,
      rateLimit: config.rateLimit || undefined,
      config: config.config ? (config.config as Record<string, any>) : undefined,
      metadata: config.metadata ? (config.metadata as Record<string, any>) : undefined,
      lastTestedAt: config.lastTestedAt || undefined,
      lastTestStatus: config.lastTestStatus || undefined,
      lastTestMessage: config.lastTestMessage || undefined,
    });

    // 测试连接
    const result = await apiManager.testConnection(config.provider);

    // 更新测试状态
    await db
      .update(apiConfigs)
      .set({
        lastTestedAt: new Date(),
        lastTestStatus: result.success ? 'success' : 'failed',
        lastTestMessage: result.error?.message || result.error?.code,
        updatedAt: new Date(),
      })
      .where(eq(apiConfigs.id, configId));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to test API connection:', error);

    // 记录失败状态（如果db已初始化）
    if (db && configId) {
      await db
        .update(apiConfigs)
        .set({
          lastTestedAt: new Date(),
          lastTestStatus: 'failed',
          lastTestMessage: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(apiConfigs.id, configId));
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
