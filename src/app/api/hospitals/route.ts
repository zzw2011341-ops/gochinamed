/**
 * 医院信息查询 API
 * 支持两种模式：数据库查询（主） + 混元 AI（降级）
 */

import { NextRequest, NextResponse } from 'next/server';
import { callHunyuan } from '@/lib/hunyuan-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 尝试从数据库获取
    try {
      const { getDb } = await import('@/lib/db');
      const { hospitals } = await import('@/storage/database/shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      
      if (featured === 'true') {
        const results = await db.select().from(hospitals).where(eq(hospitals.isFeatured, true)).limit(limit);
        if (results.length > 0) {
          return NextResponse.json({ hospitals: results, source: 'database', count: results.length });
        }
      }

      const results = await db.select().from(hospitals).limit(limit);
      if (results.length > 0) {
        return NextResponse.json({ hospitals: results, source: 'database', count: results.length });
      }
    } catch (dbError: any) {
      console.log('数据库不可用，使用 AI 生成医院信息:', dbError.message);
    }

    // 降级到 AI
    const city = searchParams.get('city') || 'Beijing';
    const prompt = `请推荐 ${city} 的 5-8 个国际医疗医院，包含：
- nameEn（英文名称）
- nameZh（中文名称）
- rating（评分 1-5）
- addressEn（英文地址）
- addressZh（中文地址）
- specialties（擅长科室，数组）
- internationalPatientServices（国际患者服务，数组）
- estimatedCostLevel（费用等级：Budget/Mid-range/Luxury）

只返回 JSON 数组。`;

    const response = await callHunyuan([
      { Role: 'system', Content: '你是专业的国际医疗顾问，只返回 JSON 数组。' },
      { Role: 'user', Content: prompt }
    ], { model: 'hunyuan-lite', temperature: 0.5 });

    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/g, '').replace(/\n?```$/g, '');
    }

    const hospitals = JSON.parse(jsonStr);
    return NextResponse.json({
      hospitals: Array.isArray(hospitals) ? hospitals : [hospitals],
      source: 'ai',
      count: Array.isArray(hospitals) ? hospitals.length : 1,
      provider: 'hunyuan-ai'
    });

  } catch (error: any) {
    console.error('医院 API 错误:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
