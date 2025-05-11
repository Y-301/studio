// src/app/api/analytics/summary/route.ts
import { NextResponse } from 'next/server';
import { getUserAnalyticsSummary } from '@/backend/services/analyticsService'; // Assuming this exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/analytics/summary - Get a summary of analytics data for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Optional: Read query parameters for date range or type of summary
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // Default to weekly summary
    // const startDate = searchParams.get('startDate');
    // const endDate = searchParams.get('endDate');

    // TODO: Add validation for query parameters (e.g., valid period values)
     if (!['day', 'week', 'month', 'year'].includes(period)) {
         return NextResponse.json({ error: 'Invalid period parameter' }, { status: 400 });
     }


    const summary = await getUserAnalyticsSummary(user.id, period /*, startDate, endDate */); // Your function to get the summary

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics summary' }, { status: 500 });
  }
}
