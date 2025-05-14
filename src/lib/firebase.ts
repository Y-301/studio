
// src/lib/firebase.ts
// This file now primarily provides local authentication and data interaction logic
// by calling the local backend. Firebase SDK specific code is removed.

import { apiClient } from './apiClient';

// --- Local User Interface (replaces FirebaseUserType) ---
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Add any other fields you need from the user object
  // emailVerified: boolean; // Example if needed
  // getIdToken: (forceRefresh?: boolean) => Promise<string>; // Not directly used by UI now
}

// --- App Status Context (New) ---
export interface AppStatus {
  isSeededByCsv: boolean;
  isAppInitialized: boolean; // True if users exist, guiding first-time flow
  isLoading: boolean;
}

// --- Local Authentication Logic ---
const WAKESYNC_TOKEN_KEY = 'wakeSyncToken';
const WAKESYNC_USER_KEY = 'wakeSyncUser';

let currentUserInternal: User | null = null;
try {
  const storedUser = localStorage.getItem(WAKESYNC_USER_KEY);
  if (storedUser) {
    currentUserInternal = JSON.parse(storedUser);
  }
} catch (e) {
  console.error("Error parsing stored user:", e);
  localStorage.removeItem(WAKESYNC_USER_KEY);
  localStorage.removeItem(WAKESYNC_TOKEN_KEY);
}

const authStateListeners: Array<(user: User | null) => void> = [];

const notifyAuthStateChanged = () => {
  // Update the auth object's currentUser property
  (auth as any).currentUser = currentUserInternal;
  authStateListeners.forEach(listener => {
    try {
      listener(currentUserInternal);
    } catch (e) {
      console.error("Error in onAuthStateChanged listener:", e);
    }
  });
};

// Listen to storage changes to sync auth state across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === WAKESYNC_TOKEN_KEY || event.key === WAKESYNC_USER_KEY) {
      const token = localStorage.getItem(WAKESYNC_TOKEN_KEY);
      const userJson = localStorage.getItem(WAKESYNC_USER_KEY);
      if (token && userJson) {
        try {
          currentUserInternal = JSON.parse(userJson);
        } catch (e) {
          currentUserInternal = null;
        }
      } else {
        currentUserInternal = null;
      }
      notifyAuthStateChanged();
    }
  });
}


export const auth = {
  currentUser: currentUserInternal, // Keep this updated
  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    authStateListeners.push(callback);
    // Call immediately with current state
    Promise.resolve().then(() => callback(currentUserInternal));
    return () => { // Unsubscribe function
      const index = authStateListeners.indexOf(callback);
      if (index > -1) authStateListeners.splice(index, 1);
    };
  },
  signInWithEmailAndPassword: async (_authIgnored: any, email: string, pass: string): Promise<{ user: User, token?: string }> => {
    try {
      const response = await apiClient<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      if (response.token && response.user) {
        localStorage.setItem(WAKESYNC_TOKEN_KEY, response.token);
        localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(response.user));
        currentUserInternal = response.user;
        notifyAuthStateChanged();
        return { user: response.user, token: response.token };
      }
      throw new Error("Login failed: No token or user data received from backend.");
    } catch (error) {
      console.error("signInWithEmailAndPassword error:", error);
      throw error; // Re-throw to be caught by UI
    }
  },
  createUserWithEmailAndPassword: async (_authIgnored: any, email: string, pass: string, name?: string): Promise<{ user: User, token?: string }> => {
    try {
      const response = await apiClient<{ user: User; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass, name }),
      });
      if (response.token && response.user) {
        localStorage.setItem(WAKESYNC_TOKEN_KEY, response.token);
        localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(response.user));
        currentUserInternal = response.user;
        notifyAuthStateChanged();
        return { user: response.user, token: response.token };
      }
      throw new Error("Signup failed: No token or user data received from backend.");
    } catch (error) {
      console.error("createUserWithEmailAndPassword error:", error);
      throw error;
    }
  },
  sendPasswordResetEmail: async (_authIgnored: any, email: string): Promise<void> => {
    // This would typically call a backend endpoint. For local, it's a placeholder.
    console.log(`[LocalAuth] Password reset email would be sent to ${email} (via backend).`);
    // Example: await apiClient('/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) });
    return Promise.resolve(); // Simulate success
  },
  signOut: async (_authIgnored: any): Promise<void> => {
    localStorage.removeItem(WAKESYNC_TOKEN_KEY);
    localStorage.removeItem(WAKESYNC_USER_KEY);
    currentUserInternal = null;
    notifyAuthStateChanged();
    // Optionally call a backend logout endpoint if it invalidates tokens server-side
    // await apiClient('/auth/logout', { method: 'POST' });
    return Promise.resolve();
  },
  updateProfile: async (user: User, profileUpdates: { displayName?: string | null; photoURL?: string | null }): Promise<void> => {
    // This would call a backend endpoint to update user profile.
    // For now, we'll update localStorage and notify listeners.
    if (currentUserInternal && currentUserInternal.uid === user.uid) {
      const updatedUser = { ...currentUserInternal, ...profileUpdates };
      localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(updatedUser));
      currentUserInternal = updatedUser;
      notifyAuthStateChanged();
      console.log("[LocalAuth] Profile updated in localStorage (backend update needed for persistence).");
      // Example: await apiClient(`/users/${user.uid}/profile`, { method: 'PUT', body: JSON.stringify(profileUpdates) });
    }
    return Promise.resolve();
  },
  reauthenticateWithCredential: async (_user: User, _credential: any): Promise<{user: User}> => {
    // This is complex to mock locally without a backend flow for reauth.
    // For now, assume success if called or simulate a specific behavior.
    console.warn("[LocalAuth] reauthenticateWithCredential called - assuming success for local demo.");
    if (!currentUserInternal) throw new Error("No user to reauthenticate");
    return Promise.resolve({ user: currentUserInternal });
  },
  updatePassword: async (_user: User, _newPassword?: string | null): Promise<void> => {
    // This would call a backend endpoint.
    console.warn("[LocalAuth] updatePassword called (backend update needed for actual change).");
    // Example: await apiClient(`/users/${user.uid}/password`, { method: 'PUT', body: JSON.stringify({ currentPassword: '...', newPassword }) });
    return Promise.resolve();
  },
  // No direct EmailAuthProvider.credential replacement needed if backend handles reauth logic
  // We just need to send current and new password to a backend endpoint.
};

// --- Mock Firestore/Storage (Simplified for Local Backend Focus) ---
// Since we are moving to a local backend for data, these direct db/storage
// interactions from the frontend are no longer the primary data source.
// They are kept minimal or could be fully removed if all data flows through apiClient.

export const db = {
  collection: (collectionPath: string) => ({
    doc: (documentPath?: string) => ({
      get: async () => {
        console.warn(`[LocalDB-Mock] Attempted to GET doc: ${collectionPath}/${documentPath}. Data should come from local backend via apiClient.`);
        return Promise.resolve({ exists: () => false, data: () => undefined, id: documentPath });
      },
      set: async (_data: any, _options?: { merge?: boolean }) => {
        console.warn(`[LocalDB-Mock] Attempted to SET doc: ${collectionPath}/${documentPath}. Data should be saved via local backend.`);
        return Promise.resolve();
      },
      // Add other Firestore methods as needed, all pointing to console warnings.
    }),
    // Add other collection methods similarly.
  }),
};

export const storage = {
  ref: (path?: string) => ({
    put: async (_data: Blob | Uint8Array | ArrayBuffer, _metadata?: any) => {
      console.warn(`[LocalStorage-Mock] Attempted to UPLOAD file: ${path}. File handling should be via local backend.`);
      return Promise.resolve({ ref: { getDownloadURL: async () => "mock-url" }, metadata: {}, totalBytes: 0 });
    },
    getDownloadURL: async () => {
      console.warn(`[LocalStorage-Mock] Attempted to GET DOWNLOAD URL for: ${path}. File handling should be via local backend.`);
      return Promise.resolve("mock-url");
    },
    // Add other storage methods.
  }),
  uploadBytes: async (_ref: any, _data: any, _metadata?: any) => {
    console.warn(`[LocalStorage-Mock] storage.uploadBytes called. File handling via local backend.`);
    return { ref: { getDownloadURL: async () => "mock-url" } } as any;
  },
  getDownloadURL: async (_ref: any) => {
     console.warn(`[LocalStorage-Mock] storage.getDownloadURL called. File handling via local backend.`);
    return "mock-url";
  },
  deleteObject: async (_ref: any) => {
    console.warn(`[LocalStorage-Mock] storage.deleteObject called. File handling via local backend.`);
    return Promise.resolve();
  }
};

// Dummy Timestamp/serverTimestamp for type compatibility if still imported elsewhere.
// These should ideally not be used directly in frontend if backend handles timestamps.
export const Timestamp = {
  fromDate: (date: Date) => date, // Or return a specific object if your code expects it
  now: () => new Date(),
};
export const serverTimestamp = () => new Date(); // Or a specific marker understood by backend

// No Firebase App initialization needed for this local-backend-centric approach.
export const app = { name: "[Local App Stub]" };


// Helper for checking if a Firebase API key looks like a placeholder
const isApiKeyPlaceholder = (key?: string) => !key || key.includes("YOUR_") || key.includes("PLACEHOLDER") || key.includes("MOCK_") || key.length < 10;

// Auto-detect mock mode based on Firebase keys in .env
// This variable controls console messages, not the core logic which now always hits local backend.
const explicitMockModeEnv = process.env.NEXT_PUBLIC_USE_MOCK_MODE;
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const autoDetectedMockMode = isApiKeyPlaceholder(firebaseApiKey);

const CURRENTLY_IN_MOCK_DEBUG_MODE =
  explicitMockModeEnv === 'true' ? true :
  explicitMockModeEnv === 'false' ? false :
  autoDetectedMockMode;

if (CURRENTLY_IN_MOCK_DEBUG_MODE) {
  if (explicitMockModeEnv === 'true') {
    console.info("WakeSync Frontend: Running in LOCAL MODE (explicitly set by NEXT_PUBLIC_USE_MOCK_MODE=true). All auth/data via local backend.");
  } else {
    console.info("WakeSync Frontend: Running in LOCAL MODE (auto-detected due to missing/placeholder Firebase API Key). All auth/data via local backend. For REAL Firebase, provide valid credentials in .env.");
  }
} else {
   if (explicitMockModeEnv === 'false') {
     console.info("WakeSync Frontend: Configured for REAL Firebase services (explicitly set by NEXT_PUBLIC_USE_MOCK_MODE=false). Ensure backend is deployed and configured accordingly if not using local backend.");
   } else {
     console.info("WakeSync Frontend: Configured for REAL Firebase services (auto-detected based on valid Firebase API Key). Ensure backend is deployed if not using local backend. To force LOCAL MODE, set NEXT_PUBLIC_USE_MOCK_MODE=true in .env.");
   }
}
// The actual User type for re-export if needed elsewhere, ensuring it's the local one.
// export type User = LocalUser;
export const getEmailProviderCredential = (_email: string, _pass: string) => {
  console.warn("getEmailProviderCredential called. Reauth should be handled by backend.");
  return { type: "password", providerId: "password" }; // Placeholder
};
export const storageRef = (instance: any, path?: string) => instance.ref(path);
