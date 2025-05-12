// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser as getBackendCurrentUser } from '@/backend/services/authService'; // Assuming this exists in the backend service
import { auth, type User as FirebaseUser } from '@/lib/firebase'; // Import from the conditional firebase lib

export async function GET(request: Request) {
  try {
    let user: FirebaseUser | null = null;

    if (process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true') {
      // In mock mode, use the client-side mock auth state
      user = auth.currentUser as FirebaseUser | null; // auth from lib/firebase will be the mock
    } else {
      // In real mode, or if you want to verify against a backend session
      // (though typically 'me' routes rely on client-side SDK state for speed)
      // This example assumes you might have a backend service to validate/get current user
      // For a pure Firebase client-side app, this backend call might not be necessary for 'me'
      // user = await getBackendCurrentUser(request); // This would hit your Express backend's auth logic
      // For this setup, let's assume the client-side Firebase SDK is the source of truth for "me"
       user = auth.currentUser as FirebaseUser | null; // Still use the (real) Firebase SDK's currentUser
    }


    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    // Ensure password is not part of the user object returned
    // The actual FirebaseUser type from 'firebase/auth' doesn't directly expose password hashes.
    // The MockUser type might, so we strip it if it exists.
    const { password, ...userWithoutPassword } = user as any; // Use 'as any' if 'password' isn't on FirebaseUser

    return NextResponse.json({ user: userWithoutPassword });

  } catch (error: any) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get user info' }, { status: 500 });
  }
}
