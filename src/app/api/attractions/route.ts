/**
 * 景点搜索 API - 数据库 + 混元 AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchAttractions } from '@/lib/travel-search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 有 city 参数，尝试从数据库查询，失败则用 AI
    if (city) {
      try {
        const { AttractionManager } = await import('@/storage/database/attractionsManager');
        
        if (searchParams.get('featured') === 'true') {
          const attractions = await AttractionManager.getFeatured(limit);
          if (attractions.length > 0) {
            return NextResponse.json({ attractions, source: 'database', count: attractions.length });
          }
        }

        const result = await AttractionManager.search({
          city,
          category: category || undefined,
          limit,
          offset: 0,
        });

        if (result.total > 0) {
          return NextResponse.json({ 
            attractions: result.attractions, 
            source: 'database',
            count: result.total 
          });
        }
      } catch (dbError: any) {
        console.log('数据库不可用，使用 AI 搜索:', dbError.message);
      }

      // 用 AI 搜索景点
      const aiResult = await searchAttractions(city, category || undefined);

      if (aiResult.success) {
        const attractions = Array.isArray(aiResult.data?.attractions) 
          ? aiResult.data.attractions 
          : (Array.isArray(aiResult.data) ? aiResult.data : []);
        
        return NextResponse.json({ 
          attractions,
          source: 'ai',
          count: attractions.length,
          provider: aiResult.provider
        });
      }

      // AI 也失败
      return NextResponse.json(
        { error: aiResult.error || '景点搜索失败' },
        { status: 500 }
      );
    }

    // 无 city 参数，尝试返回特色景点
    try {
      const { AttractionManager } = await import('@/storage/database/attractionsManager');
      const featured = await AttractionManager.getFeatured(limit);
      return NextResponse.json({ 
        attractions: featured, 
        source: 'database',
        count: featured.length 
      });
    } catch (dbError: any) {
      return NextResponse.json({ 
        attractions: [], 
        source: 'unavailable',
        count: 0,
        message: 'Database not available'
      });
    }

  } catch (error: any) {
    console.error('景点搜索 API 错误:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
