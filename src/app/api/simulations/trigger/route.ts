// src/app/api/simulations/trigger/route.ts
import { NextResponse } from 'next/server';
// Assuming SimulationParameters is defined in simulationService and startWakeUpSimulation exists
import { type SimulationParameters } from '@/backend/services/simulationService'; 
import { getCurrentUser } from '@/backend/services/authService'; 

// Mock function as simulationService is not fully implemented
const startWakeUpSimulation = async (userId: string, params: SimulationParameters): Promise<void> => {
  console.log(`Mock: Starting wake-up simulation for user ${userId} with params:`, params);
  // In a real app, this would trigger the simulation logic, potentially involving device control.
  return Promise.resolve();
};


// POST /api/simulations/trigger - Trigger a new simulation for the current user
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const rawBody = await request.json();
    
    // Basic validation for simulationParams
    if (!rawBody || typeof rawBody.startTime !== 'string' || typeof rawBody.durationMinutes !== 'number' || !rawBody.intensity) {
        return NextResponse.json({ error: 'Missing or invalid simulation parameters. Required: startTime (string), durationMinutes (number), intensity (string).' }, { status: 400 });
    }
    if (!['low', 'medium', 'high'].includes(rawBody.intensity)) {
         return NextResponse.json({ error: 'Invalid intensity value. Must be low, medium, or high.' }, { status: 400 });
    }
    if (isNaN(new Date(rawBody.startTime).getTime())) {
        return NextResponse.json({ error: 'Invalid startTime format. Please use a valid ISO date string.' }, { status: 400 });
    }
    if (rawBody.durationMinutes <= 0 || rawBody.durationMinutes > 120) { // Example bounds
        return NextResponse.json({ error: 'Invalid durationMinutes. Must be between 1 and 120.' }, { status: 400 });
    }


    const simulationParams: SimulationParameters = {
        ...rawBody,
        startTime: new Date(rawBody.startTime), // Convert string to Date object
    };

    await startWakeUpSimulation(user.id, simulationParams); 

    return NextResponse.json({ message: 'Wake-up simulation triggered successfully (Mock)' });

  } catch (error: any) {
    console.error('Error triggering simulation:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to trigger simulation' }, { status: 500 });
  }
}
