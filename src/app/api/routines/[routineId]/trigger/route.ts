// src/app/api/routines/[routineId]/trigger/route.ts
import { NextResponse } from 'next/server';
import { triggerRoutine } from '@/backend/services/routineService'; // Assuming this function exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// POST /api/routines/[routineId]/trigger - Trigger a specific routine for the current user
export async function POST(request: Request, { params }: { params: { routineId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const routineId = params.routineId;
     if (!routineId) {
        return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    // TODO: Optionally, you might pass execution parameters in the request body
    // const executionParams = await request.json();

    const success = await triggerRoutine(routineId, user.id /*, executionParams */); // Your function to trigger a routine

    if (!success) {
      // This might mean the routine wasn't found, or the user isn't authorized, or triggering failed
      return NextResponse.json({ error: 'Failed to trigger routine (not found, unauthorized, or execution error)' }, { status: 400 }); // Use 400 for various reasons
    }

    return NextResponse.json({ message: `Routine ${routineId} triggered successfully` });

  } catch (error: any) {
    console.error(`Error triggering routine ${params.routineId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to trigger routine' }, { status: 500 });
  }
}
