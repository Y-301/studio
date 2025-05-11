// src/app/api/integrations/[integrationId]/route.ts
import { NextResponse } from 'next/server';
import { deleteIntegration } from '@/backend/services/integrationService'; // Assuming this exists
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// DELETE /api/integrations/[integrationId] - Delete a specific integration for the current user
export async function DELETE(request: Request, { params }: { params: { integrationId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const integrationId = params.integrationId;
     if (!integrationId) {
        return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
    }


    const success = await deleteIntegration(integrationId, user.id); // Your function to delete an integration

    if (!success) {
      // This might mean the integration wasn't found, or it doesn't belong to the user
      return NextResponse.json({ error: 'Integration not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Integration deleted successfully' });

  } catch (error: any) {
    console.error(`Error deleting integration ${params.integrationId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete integration' }, { status: 500 });
  }
}

// You might add GET here if you need to fetch detailed info for ONE integration (be careful with sensitive data!)
// export async function GET(request: Request, { params }: { params: { integrationId: string } }) { ... }
// You might add PUT/PATCH if you need to update settings for ONE integration
// export async function PUT(request: Request, { params }: { params: { integrationId: string } }) { ... }
