// src/app/api/devices/route.ts
import { NextResponse } from 'next/server';
import { getDevices, addDevice } from '@/backend/services/deviceService'; // Assuming these functions exist
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/devices - Get all devices for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const devices = await getDevices(user.id);
    return NextResponse.json({ devices });

  } catch (error: any) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch devices' }, { status: 500 });
  }
}

// POST /api/devices - Add a new device for the current user
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const deviceData = await request.json();
    // TODO: Add input validation for deviceData

    const newDevice = await addDevice(user.id, deviceData); // Your function to add a device

    return NextResponse.json({ message: 'Device added successfully', device: newDevice }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding device:', error);
    return NextResponse.json({ error: error.message || 'Failed to add device' }, { status: 500 });
  }
}

// You might also add PUT for bulk updates or DELETE for bulk deletion if needed
// export async function PUT(request: Request) { ... }
// export async function DELETE(request: Request) { ... }
