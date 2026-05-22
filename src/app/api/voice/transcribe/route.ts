import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Voice transcription temporarily disabled.' },
    { status: 501 }
  );
}
