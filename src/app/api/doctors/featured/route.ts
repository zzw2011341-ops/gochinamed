import { NextResponse } from 'next/server';
import { doctorManager } from '@/storage/database';

/**
 * 去重函数：根据医生ID去重
 */
function deduplicateDoctors(doctors: any[]): any[] {
  const seen = new Set<string>();
  return doctors.filter(d => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });
}

export async function GET() {
  try {
    const featuredDoctors = await doctorManager.getFeaturedDoctors(20);
    // 去重
    const uniqueDoctors = deduplicateDoctors(featuredDoctors);
    return NextResponse.json({ doctors: uniqueDoctors.slice(0, 12) });
  } catch (error) {
    console.error('Error fetching featured doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured doctors' },
      { status: 500 }
    );
  }
}
