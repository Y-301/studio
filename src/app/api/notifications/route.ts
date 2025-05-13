// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
// import { getNotifications } from '@/backend/services/notificationService'; // Assuming this exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// Mock types and functions as notificationService is not fully implemented
interface MockNotification { id: string, userId: string, message: string, read: boolean, createdAt: string, type?: string }
const mockNotifications: MockNotification[] = [];

const getNotifications = async (userId: string, options: { limit?: number, status?: string | null }): Promise<MockNotification[]> => {
    console.log(`Mock: Fetching notifications for user ${userId}`, options);
    let userNotifications = mockNotifications.filter(n => n.userId === userId);
    if (options.status === 'read') userNotifications = userNotifications.filter(n => n.read);
    if (options.status === 'unread') userNotifications = userNotifications.filter(n => !n.read);
    return userNotifications.slice(0, options.limit || 20);
};

// GET /api/notifications - Get notifications for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const status = searchParams.get('status');

    let limit = 20; // Default limit
    if (limitParam) {
        const parsedLimit = parseInt(limitParam, 10);
        if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) { // Added upper bound
            return NextResponse.json({ error: 'Invalid limit parameter. Must be a positive number up to 100.' }, { status: 400 });
        }
        limit = parsedLimit;
    }

    if (status && !['read', 'unread', 'all'].includes(status.toLowerCase())) { // Added 'all'
        return NextResponse.json({ error: 'Invalid status parameter. Must be read, unread, or all.' }, { status: 400 });
    }

    const notifications = await getNotifications(user.id, { limit, status: status === 'all' ? null : status }); 

    return NextResponse.json({ notifications });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}
