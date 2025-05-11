// src/app/api/devices/[deviceId]/route.ts
import { NextResponse } from 'next/server';
import { getDeviceById, updateDevice, deleteDevice } from '@/backend/services/deviceService'; // Assuming these exist
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/devices/[deviceId] - Get a specific device by ID for the current user
export async function GET(request: Request, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const deviceId = params.deviceId;
    if (!deviceId) {
        return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const device = await getDeviceById(deviceId, user.id); // Your function to get a device by ID and user ID

    if (!device) {
      return NextResponse.json({ error: 'Device not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ device });

  } catch (error: any) {
    console.error(`Error fetching device ${params.deviceId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch device' }, { status: 500 });
  }
}

// PUT /api/devices/[deviceId] - Update a specific device by ID for the current user
export async function PUT(request: Request, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const deviceId = params.deviceId;
    if (!deviceId) {
        return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const updateData = await request.json();
    // TODO: Add input validation for updateData

    const updatedDevice = await updateDevice(deviceId, user.id, updateData); // Your function to update a device

    if (!updatedDevice) {
      return NextResponse.json({ error: 'Device not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Device updated successfully', device: updatedDevice });

  } catch (error: any) {
    console.error(`Error updating device ${params.deviceId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update device' }, { status: 500 });
  }
}

// DELETE /api/devices/[deviceId] - Delete a specific device by ID for the current user
export async function DELETE(request: Request, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const deviceId = params.deviceId;
    if (!deviceId) {
        return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const success = await deleteDevice(deviceId, user.id); // Your function to delete a device

    if (!success) {
      return NextResponse.json({ error: 'Device not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Device deleted successfully' });

  } catch (error: any) {
    console.error(`Error deleting device ${params.deviceId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete device' }, { status: 500 });
  }
}
