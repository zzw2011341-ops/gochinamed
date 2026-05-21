/**
 * 酒店搜索 API - 基于腾讯混元 AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchHotels } from '@/lib/travel-search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const destination = searchParams.get('destination');
    const checkIn = searchParams.get('checkIn') || undefined;
    const checkOut = searchParams.get('checkOut') || undefined;
    const rooms = parseInt(searchParams.get('rooms') || '1');
    const budget = (searchParams.get('budget') as 'budget' | 'mid-range' | 'luxury') || undefined;

    if (!destination) {
      return NextResponse.json(
        { error: 'destination is required' },
        { status: 400 }
      );
    }

    const result = await searchHotels({
      destination,
      hotelCheckIn: checkIn,
      hotelCheckOut: checkOut,
      rooms,
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
      hotels: result.data.hotels,
      provider: result.provider,
      timestamp: result.timestamp,
    });
  } catch (error: any) {
    console.error('酒店搜索 API 错误:', error);
    return NextResponse.json(
      { error: 'Internal server eror', details: error.message },
      { status: 500 }
    );
  }
}
