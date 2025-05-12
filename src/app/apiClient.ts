// src/lib/apiClient.ts
import { auth, type User } from './firebase'; // Import from conditional firebase lib

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

async function getAuthHeaders() {
  // auth.currentUser will be MockUser or FirebaseUserType based on USE_MOCK_MODE
  const user = auth.currentUser as User | null; 
  
  if (user) {
    try {
      // user.getIdToken() will call mock or real Firebase method
      const token = await user.getIdToken(); 
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-ID': user.uid, 
      };
    } catch (error) {
      console.error("Error getting ID token:", error);
      // Fallback if token generation fails, but user object exists
      return { 
        'Content-Type': 'application/json',
        'X-User-ID': user.uid, 
       };
    }
  }
  // For unauthenticated scenarios or if backend expects a default mock user ID
  return { 
    'Content-Type': 'application/json',
    // If NEXT_PUBLIC_USE_MOCK_MODE is true, and no user is logged in, this ensures API calls
    // to the backend can still use the default 'user1' if the backend is designed for it.
    ...(process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true' && { 'X-User-ID': 'user1' }),
  };
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const dynamicHeaders = await getAuthHeaders(); 
  
  const requestHeaders: HeadersInit = {
    ...dynamicHeaders, 
    ...options.headers, 
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
    console.error('API Error:', errorData, 'Status:', response.status, 'Endpoint:', endpoint);
    throw new Error(errorData.message || `API request failed: ${response.status}`);
  }

  if (response.status === 204) { // No Content
    return null as T;
  }

  // Check for 'application/json' content type before parsing
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json() as Promise<T>;
  } else {
    // Handle non-JSON responses, e.g. plain text or empty successful responses
    // For now, returning null as T might be okay if you expect some non-JSON success states
    // Or you could try response.text() and handle it.
    console.warn(`Received non-JSON response from ${endpoint}. Content-Type: ${contentType}`);
    return null as T; // Or handle as text: await response.text() as T;
  }
}
