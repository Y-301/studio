// src/app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { getRecentLogs } from '@/backend/services/logService'; // Assuming this exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/logs - Get recent log entries (potentially filtered by user or system)
export async function GET(request: Request) {
  try {
    // NOTE: This endpoint might be for administrators or for fetching logs related to the current user.
    // If it's for user-specific logs, uncomment the authentication check:
    // const user = await getCurrentUser(request);
    // if (!user) {
    //   return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    // }

    // Optional: Read query parameters for filtering, pagination, etc.
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10); // Default limit to 20
    // const level = searchParams.get('level'); // e.g., 'info', 'warn', 'error'
    // const userId = user ? user.id : undefined; // Pass user ID if filtering by user

     // TODO: Add validation for query parameters (e.g., ensure limit is positive)
     if (isNaN(limit) || limit <= 0) {
         return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
     }
     // TODO: Validate 'level' if used


    const logs = await getRecentLogs(limit /*, level, userId */); // Your function to get logs

    return NextResponse.json({ logs });

  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
