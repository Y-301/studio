// src/app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { getRecentLogs, LogEntry } from '@/backend/services/logService'; // Assuming this exists
// import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/logs - Get recent log entries (potentially filtered by user or system)
export async function GET(request: Request) {
  try {
    // NOTE: This endpoint might be for administrators or for fetching logs related to the current user.
    // If it's for user-specific logs, uncomment and use authentication check:
    // const user = await getCurrentUser(request);
    // if (!user) {
    //   return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    let limit = 20; // Default limit
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 500) { // Added upper bound
        return NextResponse.json({ error: 'Invalid limit parameter. Must be a positive number up to 500.' }, { status: 400 });
      }
      limit = parsedLimit;
    }
    
    const levelParam = searchParams.get('level');
    // Validate 'level' if used, e.g., against a list of valid log levels.
    // const validLevels = ['debug', 'info', 'warn', 'error', 'success'];
    // if (levelParam && !validLevels.includes(levelParam.toLowerCase())) {
    //     return NextResponse.json({ error: 'Invalid level parameter.' }, { status: 400 });
    // }
    // const userId = user ? user.id : undefined; // Pass user ID if filtering by user

    const logs = await getRecentLogs(limit, levelParam as LogEntry['level'] /*, userId */);

    return NextResponse.json({ logs });

  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
