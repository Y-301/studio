// src/app/api/data/export/route.ts
import { NextResponse } from 'next/server';
import { requestDataExport } from '@/backend/services/dataService'; // Assuming this exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/data/export - Request data export for the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Optional: Read query parameters for specific data types or date ranges to export
    // const { searchParams } = new URL(request.url);
    // const dataType = searchParams.get('dataType'); // e.g., 'simulations', 'events'
    // const startDate = searchParams.get('startDate');
    // const endDate = searchParams.get('endDate');

    // TODO: Add input validation for query parameters if used


    // In a real application, data export is often an asynchronous process (can take time).
    // This endpoint typically triggers the export process and informs the user how to retrieve it (e.g., email link).
    const exportId = await requestDataExport(user.id /*, dataType, startDate, endDate */); // Your function to initiate export

     if (!exportId) {
         // Could return an error if export failed to start
         return NextResponse.json({ error: 'Failed to initiate data export' }, { status: 500 });
     }


    // Inform the user that the export has been initiated
    // TODO: Provide information on how the user will receive the export (e.g., "an email will be sent to you")
    return NextResponse.json({ message: 'Data export initiated', exportId: exportId });

  } catch (error: any) {
    console.error('Error initiating data export:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate data export' }, { status: 500 });
  }
}

// You might add GET /api/data/export/[exportId]/status to check the status of an export
// export async function GET(request: Request, { params }: { params: { exportId: string } }) { ... }
// You might add GET /api/data/export/[exportId]/download if providing direct downloads (requires careful security)
// export async function GET(request: Request, { params }: { params: { exportId: string } }) { ... }
