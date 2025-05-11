// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { signupUser } from '@/backend/services/authService'; // Assuming you have a signupUser function

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // TODO: Add input validation here (e.g., check if email and password are provided and meet criteria)
    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    // Basic email format check (more robust validation is recommended)
    if (!/\S+@\S+\.\S+/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
     // Basic password length check (add more complexity rules as needed)
     if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }


    // Call the signup service
    const newUser = await signupUser(email, password); // Your signupUser function should handle hashing passwords

    // TODO: Depending on your auth strategy (sessions or tokens),
    // you might set a cookie or return a token here.
    // For token-based auth, you'd generate and return a token.
    // Example (conceptual): const token = generateAuthToken(newUser.id);
    // return NextResponse.json({ message: 'User registered successfully', user: newUser, token }, { status: 201 });

    // If using session cookies with NextAuth.js or similar, the service might handle it.
    // Otherwise, you'd manually set a cookie here using response headers.


    return NextResponse.json({ message: 'User registered successfully', user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    // TODO: Handle specific errors (e.g., user already exists) and return appropriate status codes
    // Example: if (error.message === 'User already exists') { return NextResponse.json({ error: 'User already exists' }, { status: 409 }); }
    return NextResponse.json({ error: error.message || 'Failed to register user' }, { status: 500 });
  }
}

// You might also add other methods if needed, though POST is typical for signup
// export async function GET(request: Request) { ... }
