import { NextResponse } from 'next/server';
import { hospitalManager } from '@/storage/database';

export async function GET() {
  try {
    const featuredHospitals = await hospitalManager.getFeaturedHospitals(10);
    return NextResponse.json({ hospitals: featuredHospitals });
  } catch (error) {
    console.error('Error fetching featured hospitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured hospitals' },
      { status: 500 }
    );
  }
}
