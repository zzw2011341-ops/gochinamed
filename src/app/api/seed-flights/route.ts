import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { flights } from '@/storage/database/shared/schema';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    
    const flightData = [
      { fn: 'CA1234', al: 'Air China', from: 'PEK', to: 'PVG' },
      { fn: 'MU5678', al: 'China Eastern', from: 'PVG', to: 'PEK' },
      { fn: 'CZ9012', al: 'China Southern', from: 'CAN', to: 'PEK' },
      { fn: 'CA5678', al: 'Air China', from: 'PEK', to: 'CAN' },
      { fn: 'HU3456', al: 'Hainan Airlines', from: 'PEK', to: 'SHA' },
    ];
    
    let created = 0;
    const now = new Date();
    for (const f of flightData) {
      try {
        await db.insert(flights).values({
          id: uuidv4(),
          flightNumber: f.fn,
          airline: f.al,
          origin: f.from,
          destination: f.to,
          departureTime: now,
          arrivalTime: now,
          durationMinutes: 150,
          price: '500.00',
          availableSeats: 100,
          classType: 'economy',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      } catch (e) {
        // Skip duplicates
      }
    }
    
    return NextResponse.json({ success: true, created: created });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
