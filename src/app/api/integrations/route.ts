// src/app/api/integrations/route.ts
import { NextResponse } from 'next/server';
import { getUserIntegrations, addIntegration } from '@/backend/services/integrationService'; // Assuming these exist
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// GET /api/integrations - Get all integrations connected by the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const integrations = await getUserIntegrations(user.id); // Your function to get integrations for a user

    // TODO: Ensure sensitive credentials (like API keys, tokens) are NOT returned to the frontend

    return NextResponse.json({ integrations });

  } catch (error: any) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch integrations' }, { status: 500 });
  }
}

// POST /api/integrations - Add a new integration for the current user
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const integrationData = await request.json();
    // TODO: Add input validation for integrationData
    // Validate fields like integrationType, connection details (e.g., API key, OAuth details)
    // Be extremely careful when handling sensitive data received here.

    const newIntegration = await addIntegration(user.id, integrationData); // Your function to add an integration

    // TODO: Decide what to return. Avoid returning sensitive credentials.
    // Maybe return a confirmation message and a non-sensitive representation of the integration.
     if (!newIntegration) {
         // This might happen if the integration type is invalid or connection fails
         return NextResponse.json({ error: 'Failed to add integration' }, { status: 400 });
     }


    return NextResponse.json({ message: 'Integration added successfully', integration: { id: newIntegration.id, type: newIntegration.type } }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding integration:', error);
    return NextResponse.json({ error: error.message || 'Failed to add integration' }, { status: 500 });
  }
}

// You might add PUT for updating integration settings if needed
// export async function PUT(request: Request) { ... }
