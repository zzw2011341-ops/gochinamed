import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'File upload temporarily disabled. Please configure COS credentials.' },
    { status: 501 }
  );
}
