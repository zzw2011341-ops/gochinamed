import { NextResponse } from 'next/server';
import { doctorManager } from '@/storage/database';

export async function GET() {
  try {
    const featuredDoctors = await doctorManager.getFeaturedDoctors(10);
    return NextResponse.json({ doctors: featuredDoctors });
  } catch (error) {
    console.error('Error fetching featured doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured doctors' },
      { status: 500 }
    );
  }
}
