// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { getNotifications } from '@/backend/services/notificationService'; // Assuming this exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/notifications - Get notifications for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Optional: Read query parameters for filtering (e.g., read/unread), pagination, etc.
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10); // Default limit to 20
    const status = searchParams.get('status'); // 'read', 'unread', or null for all

     // TODO: Add validation for query parameters (e.g., valid limit, valid status values)
     if (isNaN(limit) || limit <= 0) {
         return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
     }
      if (status && !['read', 'unread'].includes(status)) {
          return NextResponse.json({ error: 'Invalid status parameter' }, { status: 400 });
      }


    const notifications = await getNotifications(user.id, { limit, status }); // Your function to get notifications

    return NextResponse.json({ notifications });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

// You might add POST here if users can create notifications for others (less common)
// or a PUT/PATCH for bulk marking as read.
// export async function PUT(request: Request) { ... } // e.g., mark all as read
