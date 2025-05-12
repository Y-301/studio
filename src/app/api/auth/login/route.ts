// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { loginUser as backendLoginUser } from '@/backend/services/authService';
import { auth as firebaseAuth, firebaseSignInWithEmailAndPassword, type User } from '@/lib/firebase'; // Use firebase.ts

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let userResponse: User | any | null = null; // any for mock flexibility

    if (process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true') {
      // Use mock auth from firebase.ts
      const { user } = await firebaseAuth.signInWithEmailAndPassword(firebaseAuth, email, password);
      userResponse = user;
    } else if (process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'false' && firebaseConfigIsValid()) {
      // Use real Firebase auth from firebase.ts
      const userCredential = await firebaseSignInWithEmailAndPassword(firebaseAuth as any, email, password);
      userResponse = userCredential.user;
    }
     else {
      // Fallback to backend service if mocks are off and Firebase client config is bad,
      // or if you prefer a backend-driven auth flow.
      // Note: This path might be less common if primarily using Firebase client SDK for auth.
      console.warn("Attempting login via backend service. This might be due to invalid client Firebase config or intentional backend auth flow.");
      userResponse = await backendLoginUser(email, password);
    }

    if (!userResponse) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Ensure password (even mock one) is not returned
    const { password: _, ...userWithoutPassword } = userResponse; 
    
    // In a real app, you'd set up a session or return a JWT here from the backend if not client-SDK handled.
    // For Firebase client SDK, the SDK handles session state. This API route might just confirm success.
    return NextResponse.json({ message: 'Login successful', user: userWithoutPassword }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
    let errorMessage = error.message || 'Failed to login';
    let statusCode = 500;

    // Handle Firebase specific errors if they propagate here (especially from real Firebase)
    if (error.code) {
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = 'Invalid email or password.';
                statusCode = 401;
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed login attempts. Please try again later.';
                statusCode = 429;
                break;
            case 'auth/network-request-failed':
                 errorMessage = 'Network error. Please check your connection.';
                 statusCode = 503; // Service Unavailable or Bad Gateway
                 break;
            default:
                // Keep original for other Firebase errors or generic errors
                break;
        }
    }
     // If it's a mock error message that contains auth/ specific strings
    if (errorMessage.includes('auth/invalid-credential')) {
        errorMessage = 'Invalid email or password. (Mock)';
        statusCode = 401;
    }


    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}


function firebaseConfigIsValid() {
    return process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith("YOUR_");
}
