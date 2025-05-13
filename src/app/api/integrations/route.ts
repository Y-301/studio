// src/app/api/integrations/route.ts
import { NextResponse } from 'next/server';
// import { getUserIntegrations, addIntegration } from '@/backend/services/integrationService'; // Assuming these exist
import { getCurrentUser } from '@/backend/services/authService'; // To get the current user

// Mock functions as integrationService is not fully implemented
interface MockIntegration { id: string; userId: string; type: string; details: any; createdAt: string; }
const mockIntegrations: MockIntegration[] = [];

const getUserIntegrations = async (userId: string): Promise<MockIntegration[]> => {
  console.log(`Mock: Fetching integrations for user ${userId}`);
  return mockIntegrations.filter(int => int.userId === userId);
};

const addIntegration = async (userId: string, integrationData: { type: string, details: any }): Promise<MockIntegration | null> => {
  console.log(`Mock: Adding integration for user ${userId}`, integrationData);
  const newIntegration: MockIntegration = {
    id: `int_${Date.now()}`,
    userId,
    type: integrationData.type,
    details: integrationData.details,
    createdAt: new Date().toISOString(),
  };
  mockIntegrations.push(newIntegration);
  return newIntegration;
};


// GET /api/integrations - Get all integrations connected by the current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const integrations = await getUserIntegrations(user.id); 

    // Ensure sensitive credentials (like API keys, tokens) are NOT returned to the frontend.
    // The mock functions above don't store sensitive data, but in a real implementation, this is crucial.
    const safeIntegrations = integrations.map(({ details, ...rest }) => ({
      ...rest,
      // Only include non-sensitive parts of details if necessary, or omit details entirely.
      // For demo, we'll omit details from the response.
    }));


    return NextResponse.json({ integrations: safeIntegrations });

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
    
    if (!integrationData || typeof integrationData.type !== 'string' || !integrationData.type.trim()) {
      return NextResponse.json({ error: 'Invalid integration data: type is required.' }, { status: 400 });
    }
    // Add more specific validation based on integration type if needed.
    // E.g., if type is 'oauth', expect certain credential fields.
    // Be extremely careful when handling sensitive data received here.

    const newIntegration = await addIntegration(user.id, integrationData); 

     if (!newIntegration) {
         return NextResponse.json({ error: 'Failed to add integration (e.g., invalid type or connection failed)' }, { status: 400 });
     }

    // Return a non-sensitive representation of the integration.
    const { details, ...safeNewIntegration } = newIntegration;
    return NextResponse.json({ 
      message: 'Integration added successfully (Mock)', 
      integration: safeNewIntegration 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding integration:', error);
    return NextResponse.json({ error: error.message || 'Failed to add integration' }, { status: 500 });
  }
}
