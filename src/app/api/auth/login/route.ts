// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { loginUser } from '@/backend/services/authService'; // Assuming you have a loginUser function
// Import any cookie/session libraries if needed
// import { serialize } from 'cookie';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // TODO: Add input validation here
    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Call the login service
    const user = await loginUser(email, password); // Your loginUser function should verify credentials

    if (!user) {
      // TODO: Return a more specific error if user not found or password incorrect
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // TODO: Establish session or return a token here
    // This is a critical step and depends on your chosen auth strategy.

    // Example 1: Using a hypothetical function that sets a session cookie (e.g., with Iron Session or next-auth)
    // const response = NextResponse.json({ message: 'Login successful', user: user });
    // await setAuthCookie(user.id, response); // Your function to handle cookie setting
    // return response;

    // Example 2: Generating and returning a JWT
    // const token = generateAuthToken(user.id);
    // const response = NextResponse.json({ message: 'Login successful', user: user, token });
    // return response;

    // For now, just return the user data (excluding sensitive info like password hash)
    // In a real app, DO NOT return the password hash.
    const { password: _, ...userWithoutPassword } = user; // Exclude password hash from response
    return NextResponse.json({ message: 'Login successful', user: userWithoutPassword }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
    // TODO: Handle specific errors
    return NextResponse.json({ error: error.message || 'Failed to login' }, { status: 500 });
  }
}
