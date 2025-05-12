// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { signupUser as backendSignupUser } from '@/backend/services/authService';
import { auth as firebaseAuth, firebaseCreateUserWithEmailAndPassword, type User } from '@/lib/firebase'; // Use firebase.ts

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json(); // Assuming 'name' might be passed

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
        const { user } = await firebaseAuth.createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (name && user && firebaseAuth.updateProfile) { // Check if updateProfile exists on mock
             await firebaseAuth.updateProfile(user as User, { displayName: name });
        }
        newUserResponse = firebaseAuth.currentUser; // Get potentially updated user
    } else if (process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'false' && firebaseConfigIsValid()) {
        const userCredential = await firebaseCreateUserWithEmailAndPassword(firebaseAuth as any, email, password);
        if (name && userCredential.user && firebaseAuth.updateProfile) {
            await firebaseAuth.updateProfile(userCredential.user, { displayName: name });
        }
        newUserResponse = userCredential.user;
    }
     else {
      console.warn("Attempting signup via backend service. This might be due to invalid client Firebase config or intentional backend auth flow.");
      newUserResponse = await backendSignupUser(email, password, name); // Adapt backendSignupUser if it takes name
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
        }
    }
    // If it's a mock error message that contains auth/ specific strings
    if (errorMessage.includes('auth/email-already-in-use')) {
        errorMessage = 'This email address is already in use. (Mock)';
        statusCode = 409;
    }


    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

function firebaseConfigIsValid() {
    return process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith("YOUR_");
}
