import { NextResponse } from 'next/server';
import { hospitalManager } from '@/storage/database';
import { callHunyuan } from '@/lib/hunyuan-client';

/**
 * 去重函数：根据医院ID去重
 */
function deduplicateHospitals(hospitals: any[]): any[] {
  const seen = new Set<string>();
  return hospitals.filter(h => {
    if (seen.has(h.id)) return false;
    seen.add(h.id);
    return true;
  });
}

export async function GET() {
  try {
    // 尝试从数据库获取
    try {
      const featuredHospitals = await hospitalManager.getFeaturedHospitals(20);
      // 去重
      const uniqueHospitals = deduplicateHospitals(featuredHospitals);
      if (uniqueHospitals.length > 0) {
        return NextResponse.json({ hospitals: uniqueHospitals.slice(0, 8), source: 'database' });
      }
    } catch (dbError: any) {
      console.log('数据库不可用，使用 AI 生成:', dbError.message);
    }

    // 降级到 AI
    const prompt = `请推荐 10 个中国顶级国际医疗医院，包含：
- nameEn（英文名称）
- nameZh（中文名称）
- rating（评分 1-5）
- addressEn（英文地址）
- addressZh（中文地址）
- specialties（擅长科室，数组）
- internationalPatientServices（国际患者服务，数组）

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
      provider: 'hunyuan-ai'
    });

  } catch (error: any) {
    console.error('Error fetching featured hospitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured hospitals' },
      { status: 500 }
    );
  }
}
