// src/app/api/analytics/summary/route.ts
import { NextResponse } from 'next/server';
import { getUserAnalyticsSummary } from '@/backend/services/analyticsService'; 
import { getCurrentUser } from '@/backend/services/authService'; 

// GET /api/analytics/summary - Get a summary of analytics data for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; 

    const validPeriods = ['day', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
        return NextResponse.json({ error: 'Invalid period parameter. Must be one of: ' + validPeriods.join(', ') }, { status: 400 });
    }

    // The backend service `getUserAnalyticsSummary` currently uses mock data.
    // In a real application, it would fetch and process data from a database based on userId and period.
    const summary = await getUserAnalyticsSummary(user.id, period);

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics summary' }, { status: 500 });
  }
}
