/**
 * 医疗价格查询 - 可选医院和治疗项目列表 API
 */

import { NextResponse } from 'next/server';
import { hospitalPrices } from '@/data/hospital-prices';

export async function GET() {
  try {
    // 按城市分组
    const byCity = new Map<string, Set<string>>();
    const treatments = new Set<string>();
    const hospitals = new Map<string, { nameEn: string; nameZh: string; cities: string[] }>();

    hospitalPrices.forEach(p => {
      // 按城市分组医院
      if (!byCity.has(p.city)) byCity.set(p.city, new Set());
      byCity.get(p.city)!.add(p.hospitalNameZh);

      // 收集所有治疗项目
      treatments.add(p.treatment);

      // 收集医院信息
      if (!hospitals.has(p.hospitalId)) {
        hospitals.set(p.hospitalId, { 
          nameEn: p.hospitalNameEn, 
          nameZh: p.hospitalNameZh,
          cities: []
        });
      }
      const h = hospitals.get(p.hospitalId)!;
      if (!h.cities.includes(p.city)) h.cities.push(p.city);
    });

    const cityList: Record<string, string[]> = {};
    byCity.forEach((hospitals, city) => {
      cityList[city] = [...hospitals];
    });

    return NextResponse.json({
      cities: Object.keys(cityList).map(c => ({
        name: c,
        hospitals: cityList[c]
      })),
      treatments: [...treatments],
      hospitalList: [...hospitals.values()],
      count: {
        hospitals: hospitals.size,
        treatments: treatments.size,
        cities: Object.keys(cityList).length,
        totalRecords: hospitalPrices.length,
      },
      dataSource: 'real-database',
      lastUpdated: '2026-05-21',
    });
  } catch (error: any) {
    console.error('医疗价格列表查询错误:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available options', details: error.message },
      { status: 500 }
    );
  }
}
