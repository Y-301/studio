// src/app/api/wristband/events/route.ts
import { NextResponse } from 'next/server';
import { getWristbandEvents } from '@/backend/services/wristbandService'; // Assuming this exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/wristband/events - Get recent wristband events for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Optional: Read query parameters for pagination or filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10); // Default limit to 10
    // const offset = parseInt(searchParams.get('offset') || '0', 10);
    // const startDate = searchParams.get('startDate'); // Example filtering

     // TODO: Add validation for query parameters (e.g., ensure limit is a positive number)
     if (isNaN(limit) || limit <= 0) {
         return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
     }


    const events = await getWristbandEvents(user.id, limit /*, offset, startDate */); // Your function to get events

    // TODO: If your getWristbandEvents function returns Date objects as strings,
    // you might need to convert them back to Date objects here if the client expects them.
    // However, it's generally better for the service function to return the correct types.

    return NextResponse.json({ events });

  } catch (error: any) {
    console.error('Error fetching wristband events:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch wristband events' }, { status: 500 });
  }
}
