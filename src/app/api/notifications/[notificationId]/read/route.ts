// src/app/api/notifications/[notificationId]/read/route.ts
import { NextResponse } from 'next/server';
import { markNotificationAsRead } from '@/backend/services/notificationService'; // Assuming this exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// POST /api/notifications/[notificationId]/read - Mark a specific notification as read for the current user
// Using POST is common for actions that change state.
export async function POST(request: Request, { params }: { params: { notificationId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const notificationId = params.notificationId;
     if (!notificationId) {
        return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const success = await markNotificationAsRead(notificationId, user.id); // Your function to mark as read

    if (!success) {
      // This might mean the notification wasn't found, or it doesn't belong to the user
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification marked as read successfully' });

  } catch (error: any) {
    console.error(`Error marking notification ${params.notificationId} as read:`, error);
    return NextResponse.json({ error: error.message || 'Failed to mark notification as read' }, { status: 500 });
  }
}

// You could also use PUT/PATCH for idempotency if preferred, but POST is common for actions.
// You might add a DELETE if users can dismiss/delete notifications.
// export async function DELETE(request: Request, { params }: { params: { notificationId: string } }) { ... }
