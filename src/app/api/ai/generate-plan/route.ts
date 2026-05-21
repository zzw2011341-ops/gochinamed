/**
 * AI 行程生成 API - 基于腾讯混元
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTravelPlan } from '@/lib/travel-search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate, 
      passengers = 1, 
      budget = 'mid-range',
      preferences = []
    } = body;

    if (!destination) {
      return NextResponse.json(
        { error: 'destination is required' },
        { status: 400 }
      );
    }

    // 生成完整旅行方案
    const result = await generateTravelPlan({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      budget: budget as any,
      preferences,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: result.data,
      provider: result.provider,
      timestamp: result.timestamp,
    });

  } catch (error: any) {
    console.error('行程生成 API 错误:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
