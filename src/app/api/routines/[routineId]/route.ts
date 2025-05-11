// src/app/api/routines/[routineId]/route.ts
import { NextResponse } from 'next/server';
import { getRoutineById, updateRoutine, deleteRoutine } from '@/backend/services/routineService'; // Assuming these exist
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/routines/[routineId] - Get a specific routine by ID for the current user
export async function GET(request: Request, { params }: { params: { routineId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const routineId = params.routineId;
     if (!routineId) {
        return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    const routine = await getRoutineById(routineId, user.id); // Your function to get a routine by ID and user ID

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ routine });

  } catch (error: any) {
    console.error(`Error fetching routine ${params.routineId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch routine' }, { status: 500 });
  }
}

// PUT /api/routines/[routineId] - Update a specific routine by ID for the current user
export async function PUT(request: Request, { params }: { params: { routineId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const routineId = params.routineId;
    if (!routineId) {
        return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    const updateData = await request.json();
    // TODO: Add input validation for updateData

    const updatedRoutine = await updateRoutine(routineId, user.id, updateData); // Your function to update a routine

    if (!updatedRoutine) {
      return NextResponse.json({ error: 'Routine not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Routine updated successfully', routine: updatedRoutine });

  } catch (error: any) {
    console.error(`Error updating routine ${params.routineId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update routine' }, { status: 500 });
  }
}

// DELETE /api/routines/[routineId] - Delete a specific routine by ID for the current user
export async function DELETE(request: Request, { params }: { params: { routineId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const routineId = params.routineId;
     if (!routineId) {
        return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    const success = await deleteRoutine(routineId, user.id); // Your function to delete a routine

    if (!success) {
      return NextResponse.json({ error: 'Routine not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Routine deleted successfully' });

  } catch (error: any) {
    console.error(`Error deleting routine ${params.routineId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete routine' }, { status: 500 });
  }
}
