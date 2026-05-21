/**
 * 航班搜索 API - 基于腾讯混元 AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchFlights, generateTravelPlan } from '@/lib/travel-search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin') || undefined;
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate') || undefined;
    const returnDate = searchParams.get('returnDate') || undefined;
    const passengers = parseInt(searchParams.get('passengers') || '1');

    if (!destination) {
      return NextResponse.json(
        { error: 'destination is required' },
        { status: 400 }
      );
    }

    const result = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flights: result.data.flights,
      provider: result.provider,
      timestamp: result.timestamp,
    });
  } catch (error: any) {
    console.error('航班搜索 API 错误:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * 生成完整旅行方案
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, departureDate, returnDate, passengers, budget } = body;

    if (!destination) {
      return NextResponse.json(
        { error: 'destination is required' },
        { status: 400 }
      );
    }

    const result = await generateTravelPlan({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      budget,
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
    console.error('旅行方案生成错误:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
