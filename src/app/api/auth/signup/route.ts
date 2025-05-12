// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { signupUser as backendSignupUser } from '../../../../../backend/src/services/authService'; // Adjusted path
import {
  auth,
  firebaseCreateUserWithEmailAndPassword, // Use this for real Firebase
  firebaseUpdateProfile,                 // Use this for real Firebase
  type User,
  mockAuthSingleton // For type casting the mock
} from '@/lib/firebase';

function firebaseConfigIsValid() {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    return apiKey && !apiKey.startsWith("YOUR_") && !apiKey.startsWith("PLACEHOLDER") && !apiKey.startsWith("MOCK_") && apiKey.length > 10;
}

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
     if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    let newUserResponse: User | any | null = null;

    if (process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true') {
        // Use mock auth methods
        const { user } = await (auth as typeof mockAuthSingleton).createUserWithEmailAndPassword(auth as any, email, password);
        if (name && user && (auth as typeof mockAuthSingleton).updateProfile) {
             await (auth as typeof mockAuthSingleton).updateProfile(user as User, { displayName: name });
        }
        newUserResponse = (auth as typeof mockAuthSingleton).currentUser;
    } else if (firebaseConfigIsValid()) {
        // Use real Firebase modular functions
        const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
        if (name && userCredential.user) {
            await firebaseUpdateProfile(userCredential.user, { displayName: name });
        }
        newUserResponse = userCredential.user;
    } else {
      // Fallback to backend service if mocks are off and Firebase client config is bad,
      // or if you prefer a backend-driven auth flow.
      console.warn("Attempting signup via backend service due to invalid client Firebase config or intentional backend auth flow.");
      newUserResponse = await backendSignupUser(email, password); // Adapt backendSignupUser if it takes name
    }
    
    if (!newUserResponse) {
        // This case might not be hit if the services above throw, but as a safeguard.
        return NextResponse.json({ error: 'Failed to register user (unexpected).' }, { status: 500 });
    }

    const { password: _, ...userWithoutPassword } = newUserResponse;

    return NextResponse.json({ message: 'User registered successfully', user: userWithoutPassword }, { status: 201 });

  } catch (error: any) {
    console.error('Signup error:', error);
    let errorMessage = error.message || 'Failed to register user';
    let statusCode = 500;

    if (error.code) { // Firebase specific errors
        switch(error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email address is already in use.';
                statusCode = 409; // Conflict
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please use a stronger password.';
                statusCode = 400;
                break;
            // Add other Firebase error codes as needed
            case 'auth/api-key-not-valid':
                 errorMessage = 'Firebase API Key is not valid. Please check your configuration.';
                 statusCode = 500; // Internal server error or configuration error
                 break;
        }
    }
    // If it's a mock error message that contains auth/ specific strings
    if (errorMessage.includes('auth/email-already-in-use')) {
        errorMessage = `This email address is already in use. (${process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' ? 'Mock' : 'Real'})`;
        statusCode = 409;
    }


    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
