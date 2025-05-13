// src/app/api/simulations/history/route.ts
import { NextResponse } from 'next/server';
import { getSimulationHistory, type SimulationParameters } from '@/backend/services/simulationService'; 
import { getCurrentUser } from '@/backend/services/authService'; 

// GET /api/simulations/history - Get simulation history for the current user
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
        if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 50) { // Added upper bound
            return NextResponse.json({ error: 'Invalid limit parameter. Must be a positive number up to 50.' }, { status: 400 });
        }
        limit = parsedLimit;
    }
    // const offset = parseInt(searchParams.get('offset') || '0', 10);
    // const startDate = searchParams.get('startDate'); // Example filtering

    const history = await getSimulationHistory(user.id, limit /*, offset, startDate */); 

    // The getSimulationHistory function in simulationService currently returns mock data.
    // In a real application, this would fetch historical simulation data from a database.
    // Timestamps should ideally be handled as Date objects or ISO strings consistently.

    return NextResponse.json({ history });

  } catch (error: any) {
    console.error('Error fetching simulation history:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch simulation history' }, { status: 500 });
  }
}
