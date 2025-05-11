// src/app/api/simulations/trigger/route.ts
import { NextResponse } from 'next/server';
import { startWakeUpSimulation, SimulationParameters } from '@/backend/services/simulationService'; // Assuming this exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// POST /api/simulations/trigger - Trigger a new simulation for the current user
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const simulationParams: SimulationParameters = await request.json();
    // TODO: Add input validation for simulationParams
    // Ensure required fields like startTime, durationMinutes, intensity are present
    // Validate the format of startTime, durationMinutes, intensity, etc.

    // Convert startTime string to Date object if needed (if sent as string from frontend)
    if (typeof simulationParams.startTime === 'string') {
        simulationParams.startTime = new Date(simulationParams.startTime);
    }

    // Basic validation example
    if (!simulationParams.startTime || typeof simulationParams.durationMinutes !== 'number' || !simulationParams.intensity) {
        return NextResponse.json({ error: 'Missing required simulation parameters' }, { status: 400 });
    }
     if (!['low', 'medium', 'high'].includes(simulationParams.intensity)) {
         return NextResponse.json({ error: 'Invalid intensity value' }, { status: 400 });
     }


    await startWakeUpSimulation(user.id, simulationParams); // Your function to start the simulation

    return NextResponse.json({ message: 'Simulation triggered successfully' });

  } catch (error: any) {
    console.error('Error triggering simulation:', error);
    return NextResponse.json({ error: error.message || 'Failed to trigger simulation' }, { status: 500 });
  }
}
