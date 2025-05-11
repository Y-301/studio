// src/app/api/routines/route.ts
import { NextResponse } from 'next/server';
import { getRoutines, createRoutine } from '@/backend/services/routineService'; // Assuming these exist
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/routines - Get all routines for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const routines = await getRoutines(user.id);
    return NextResponse.json({ routines });

  } catch (error: any) {
    console.error('Error fetching routines:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch routines' }, { status: 500 });
  }
}

// POST /api/routines - Create a new routine for the current user
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const routineData = await request.json();
    // TODO: Add input validation for routineData

    const newRoutine = await createRoutine(user.id, routineData); // Your function to create a routine

    return NextResponse.json({ message: 'Routine created successfully', routine: newRoutine }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating routine:', error);
    return NextResponse.json({ error: error.message || 'Failed to create routine' }, { status: 500 });
  }
}
