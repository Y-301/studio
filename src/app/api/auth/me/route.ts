// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/backend/services/authService'; // Assuming you have a getCurrentUser function

export async function GET(request: Request) {
  try {
    // This function needs to determine the current user based on the request (e.g., from a cookie or token)
    // You will need to implement getCurrentUser in backend/services/authService.ts
    const user = await getCurrentUser(request);

    if (!user) {
      // If getCurrentUser returns null or undefined, the user is not authenticated
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Return the user data (excluding sensitive info like password hash)
    // Ensure your User interface/model has a password field, even if optional in some contexts
    const { password: _, ...userWithoutPassword } = user; // Use object destructuring to omit 'password'
    return NextResponse.json({ user: userWithoutPassword });

  } catch (error: any) {
    console.error('Get current user error:', error);
    // Return a 500 error for unexpected server issues
    return NextResponse.json({ error: error.message || 'Failed to get user info' }, { status: 500 });
  }
}
