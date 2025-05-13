// src/app/api/wristband/events/route.ts
import { NextResponse } from 'next/server';
import { getWristbandEvents, type WristbandEvent } from '@/backend/services/wristbandService'; 
import { getCurrentUser } from '@/backend/services/authService'; 

// GET /api/wristband/events - Get recent wristband events for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    let limit = 10; // Default limit
    if (limitParam) {
        const parsedLimit = parseInt(limitParam, 10);
        if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) { // Added upper bound
            return NextResponse.json({ error: 'Invalid limit parameter. Must be a positive number up to 100.' }, { status: 400 });
        }
        limit = parsedLimit;
    }
    // const offset = parseInt(searchParams.get('offset') || '0', 10);
    // const startDate = searchParams.get('startDate'); // Example filtering

    const events = await getWristbandEvents(user.id, limit /*, offset, startDate */); 

    // The getWristbandEvents function in wristbandService currently returns mock data.
    // In a real application, this would fetch historical wristband event data from a database.
    // Timestamps should ideally be handled as Date objects or ISO strings consistently.

    return NextResponse.json({ events });

  } catch (error: any) {
    console.error('Error fetching wristband events:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch wristband events' }, { status: 500 });
  }
}
