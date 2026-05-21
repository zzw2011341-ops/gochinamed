/**
 * 医院治疗价格查询 API
 * 优先真实数据库 → 降级到混元 AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { callHunyuan } from '@/lib/hunyuan-client';
import { hospitalPrices, getHospitalPrices, getCityTreatmentPrices } from '@/data/hospital-prices';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hospital = searchParams.get('hospital') || '';
    const treatment = searchParams.get('treatment') || '';
    const city = searchParams.get('city') || 'Beijing';

    if (!treatment) {
      return NextResponse.json(
        { error: 'treatment parameter is required (e.g., "心脏搭桥", "膝关节置换")' },
        { status: 400 }
      );
    }

    // 1. 先从真实价格表查找
    let realData = hospitalPrices.filter(p => {
      const cityMatch = p.city.toLowerCase() === city.toLowerCase();
      const treatmentMatch = 
        p.treatment.includes(treatment) || 
        p.treatmentEn.toLowerCase().includes(treatment.toLowerCase());
      const hospitalMatch = hospital ? 
        p.hospitalNameEn.toLowerCase().includes(hospital.toLowerCase()) ||
        p.hospitalNameZh.includes(hospital) : true;
      return cityMatch && treatmentMatch && hospitalMatch;
    });

    if (realData.length > 0) {
      return NextResponse.json({
        query: { hospital, treatment, city },
        prices: realData.map(p => ({
          treatmentNameEn: p.treatmentEn,
          treatmentNameZh: p.treatment,
          hospitalNameEn: p.hospitalNameEn,
          hospitalNameZh: p.hospitalNameZh,
          estimatedCostUSD: `${p.priceRangeUSD[0].toLocaleString()}-${p.priceRangeUSD[1].toLocaleString()}`,
          estimatedCostCNY: `${p.priceRangeCNY[0].toLocaleString()}-${p.priceRangeCNY[1].toLocaleString()}`,
          costLevel: p.priceRangeUSD[1] > 10000 ? 'Luxury' : p.priceRangeUSD[1] > 3000 ? 'Mid-range' : 'Budget',
          includedServices: p.includes,
          excludedServices: p.excludes,
          insuranceCoverage: p.insuranceCoverage,
          notes: p.notes,
        })),
        source: 'real-database',
        count: realData.length,
        timestamp: Date.now(),
      });
    }

    // 2. 没有真实数据，降级到 AI 生成
    const prompt = `请提供 ${city} 地区${hospital ? ` ${hospital} 医院` : '国际医院'} 的 ${treatment} 治疗费用预估。

请包含：
- treatmentNameEn（治疗英文名称）
- treatmentNameZh（治疗中文名称）
- estimatedCostUSD（预估费用，美元范围，如 "8,000-15,000"）
- estimatedCostCNY（预估费用，人民币范围）
- costLevel（费用等级：Budget/Mid-range/Luxury）
- includedServices（包含服务，数组）
- excludedServices（不包含服务，数组）
- insuranceCoverage（保险覆盖说明）
- notes（注意事项）

只返回 JSON 数组。`;

    const response = await callHunyuan([
      { Role: 'system', Content: '你是国际医疗价格顾问，只返回 JSON 数组。' },
      { Role: 'user', Content: prompt }
    ], { model: 'hunyuan-lite', temperature: 0.5 });

    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/g, '').replace(/\n?```$/g, '');
    }

    const prices = JSON.parse(jsonStr);

    return NextResponse.json({
      query: { hospital, treatment, city },
      prices: Array.isArray(prices) ? prices : [prices],
      source: 'ai',
      provider: 'hunyuan-ai',
      timestamp: Date.now(),
    });

  } catch (error: any) {
    console.error('医院价格查询错误:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical prices', details: error.message },
      { status: 500 }
    );
  }
}
