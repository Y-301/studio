// src/lib/apiClient.ts
// import { auth } from './firebase'; // Will be used when implementing token-based auth

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

// async function getAuthHeaders() {
//   const user = auth.currentUser;
//   if (user) {
//     try {
//       const token = await user.getIdToken();
//       return {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       };
//     } catch (error) {
//       console.error("Error getting ID token:", error);
//       return { 'Content-Type': 'application/json' }; // Fallback if token fails
//     }
//   }
//   return { 'Content-Type': 'application/json' };
// }

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // const headers = await getAuthHeaders(); // Uncomment when auth is fully implemented with backend token verification
  
  // For now, use simple headers without auth token
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
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
    console.error('API Error:', errorData);
    throw new Error(errorData.message || `API request failed: ${response.status}`);
  }

  if (response.status === 204) { // No Content
    return null as T;
  }

  return response.json() as Promise<T>;
}
