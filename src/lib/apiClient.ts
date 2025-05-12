
// src/lib/apiClient.ts
import { auth, type MockUser } from './firebase'; // Import mock auth and MockUser type

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

async function getAuthHeaders() {
  const user = auth.currentUser as MockUser | null; // Use the mock auth.currentUser
  if (user) {
    try {
      const token = await user.getIdToken(); // This will call the mock getIdToken
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-ID': user.uid, // Optionally send mock user ID
      };
    } catch (error) {
      console.error("Error getting mock ID token:", error);
      return { 
        'Content-Type': 'application/json',
        'X-User-ID': user.uid, // Still send UID if token fails for some reason
       };
    }
  }
  // For unauthenticated or demo scenarios where backend might use a default user
  return { 
    'Content-Type': 'application/json',
    'X-User-ID': 'user1', // Default mock user ID if no one is logged in
  };
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const dynamicHeaders = await getAuthHeaders(); 
  
  const requestHeaders: HeadersInit = {
    ...dynamicHeaders, // Spread dynamic headers which include Content-Type and potentially Auth/X-User-ID
    ...options.headers, // Allow overriding or adding more headers from options
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: requestHeaders,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText || 'API request failed with no JSON body' };
    }
    console.error('API Error:', errorData);
    throw new Error(errorData.message || `API request failed: ${response.status}`);
  }

  if (response.status === 204) { // No Content
    return null as T;
  }

  return response.json() as Promise<T>;
}
