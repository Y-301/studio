
// src/lib/firebase.ts
// This file now primarily provides local authentication and data interaction logic
// by calling the local backend.

import type { apiClient } from './apiClient'; // Import type for stricter checking if needed

// --- Local User Interface (replaces FirebaseUserType) ---
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Add any other fields you need from the user object
  // emailVerified: boolean; // Example if needed
}

// --- App Status Context (New) ---
export interface AppStatus {
  isSeededByCsv: boolean;
  isAppInitialized: boolean; // True if users exist (app has been set up)
  isLoading: boolean;
}

// --- Local Authentication Logic ---
const WAKESYNC_TOKEN_KEY = 'wakeSyncToken';
const WAKESYNC_USER_KEY = 'wakeSyncUser';

let currentUserInternal: User | null = null;
const authStateListeners: Array<(user: User | null) => void> = [];

// Client-side initialization of currentUserInternal and storage event listener
if (typeof window !== 'undefined') {
  try {
    const storedUser = localStorage.getItem(WAKESYNC_USER_KEY);
    if (storedUser) {
      currentUserInternal = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error("Error parsing stored user:", e);
    localStorage.removeItem(WAKESYNC_USER_KEY); // Attempt to clear corrupted data
    localStorage.removeItem(WAKESYNC_TOKEN_KEY);
  }

  window.addEventListener('storage', (event) => {
    if (event.key === WAKESYNC_TOKEN_KEY || event.key === WAKESYNC_USER_KEY) {
      const token = localStorage.getItem(WAKESYNC_TOKEN_KEY);
      const userJson = localStorage.getItem(WAKESYNC_USER_KEY);
      let newCurrentUser: User | null = null;
      if (token && userJson) {
        try {
          newCurrentUser = JSON.parse(userJson);
        } catch (e) {
          //
        }
      }
      if (currentUserInternal?.uid !== newCurrentUser?.uid || 
          (currentUserInternal === null && newCurrentUser !== null) || 
          (currentUserInternal !== null && newCurrentUser === null)
      ) {
        currentUserInternal = newCurrentUser;
        notifyAuthStateChanged();
      }
    }
  });
}


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


export const auth = {
  currentUser: currentUserInternal, // Keep this updated
  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    authStateListeners.push(callback);
    // Call immediately with current state
    if (typeof window !== 'undefined') { // Ensure this also runs client-side for initial state
        Promise.resolve().then(() => callback(currentUserInternal));
    } else {
        // For SSR, callback with null or initial server-side derived user if implemented
        Promise.resolve().then(() => callback(null));
    }
    return () => { // Unsubscribe function
      const index = authStateListeners.indexOf(callback);
      if (index > -1) authStateListeners.splice(index, 1);
    };
  },
  signInWithEmailAndPassword: async (_authIgnored: any, email: string, pass: string): Promise<{ user: User, token?: string }> => {
    // This function needs apiClient, which might not be available if this file is imported server-side
    // For functions that make API calls, ensure they are called client-side or handle SSR appropriately.
    const localApiClient = (await import('./apiClient')).apiClient; // Dynamically import for client-side usage
    try {
      const response = await localApiClient<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      if (response.token && response.user && typeof window !== 'undefined') {
        localStorage.setItem(WAKESYNC_TOKEN_KEY, response.token);
        localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(response.user));
        currentUserInternal = response.user;
        notifyAuthStateChanged();
        return { user: response.user, token: response.token };
      }
      if (!response.token || !response.user) {
        throw new Error("Login failed: No token or user data received from backend.");
      }
      // This case should not be reached if window is undefined, but as a fallback
      return { user: response.user, token: response.token };

    } catch (error) {
      console.error("signInWithEmailAndPassword error:", error);
      throw error; // Re-throw to be caught by UI
    }
  },
  createUserWithEmailAndPassword: async (_authIgnored: any, email: string, pass: string, name?: string): Promise<{ user: User, token?: string }> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    try {
      const response = await localApiClient<{ user: User; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass, name }),
      });
      if (response.token && response.user && typeof window !== 'undefined') {
        localStorage.setItem(WAKESYNC_TOKEN_KEY, response.token);
        localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(response.user));
        currentUserInternal = response.user;
        notifyAuthStateChanged();
        return { user: response.user, token: response.token };
      }
      if (!response.token || !response.user) {
        throw new Error("Signup failed: No token or user data received from backend.");
      }
      return { user: response.user, token: response.token };

    } catch (error) {
      console.error("createUserWithEmailAndPassword error:", error);
      throw error;
    }
  },
  sendPasswordResetEmail: async (_authIgnored: any, email: string): Promise<void> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    console.log(`[LocalAuth] Password reset email initiated for ${email} (via backend).`);
    try {
        await localApiClient('/auth/request-password-reset', { // Assuming this endpoint exists or will be created
            method: 'POST',
            body: JSON.stringify({ email })
        });
        return Promise.resolve();
    } catch(error) {
        console.error("sendPasswordResetEmail error:", error);
        throw error;
    }
  },
  signOut: async (_authIgnored: any): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(WAKESYNC_TOKEN_KEY);
      localStorage.removeItem(WAKESYNC_USER_KEY);
    }
    currentUserInternal = null;
    notifyAuthStateChanged();
    try {
        // Optionally call a backend logout endpoint if it invalidates tokens server-side
        const localApiClient = (await import('./apiClient')).apiClient; // Conditional import
        await localApiClient('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Error calling backend logout, proceeding with client-side logout:", error);
    }
    return Promise.resolve();
  },
  updateProfile: async (user: User, profileUpdates: { displayName?: string | null; photoURL?: string | null }): Promise<void> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    if (currentUserInternal && currentUserInternal.uid === user.uid) {
      try {
        // Optimistically update local state
        const updatedUser = { ...currentUserInternal, ...profileUpdates };
        if (typeof window !== 'undefined') {
          localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(updatedUser));
        }
        currentUserInternal = updatedUser;
        notifyAuthStateChanged();
        console.log("[LocalAuth] Profile updated optimistically.");
        
        // Call backend to persist (example endpoint)
        await localApiClient(`/users/${user.uid}/profile`, { 
            method: 'PUT', 
            body: JSON.stringify(profileUpdates) 
        });
        console.log("[LocalAuth] Profile update sent to backend.");

      } catch (error) {
        console.error("Error updating profile on backend, local changes might not persist:", error);
        // Optionally revert optimistic update or notify user
        throw error;
      }
    }
    return Promise.resolve();
  },
  reauthenticateWithCredential: async (_user: User, credential: any): Promise<{user: User}> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    console.warn("[LocalAuth] reauthenticateWithCredential called.");
    if (!currentUserInternal) throw new Error("No user to reauthenticate");
     try {
        // Backend should handle re-authentication logic
        // This is a placeholder for what a backend call might look like
        const response = await localApiClient('/auth/reauthenticate', { // Example endpoint
            method: 'POST',
            body: JSON.stringify({ currentPassword: credential.password }) // Assuming credential contains password
        });
        // Assuming backend confirms reauth and returns user or success
        return Promise.resolve({ user: currentUserInternal }); // Or response.user if backend returns it
    } catch (error) {
        console.error("Reauthentication error:", error);
        throw error;
    }
  },
  updatePassword: async (_user: User, newPassword?: string | null, currentPassword?: string | null): Promise<void> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    console.warn("[LocalAuth] updatePassword called.");
     if (!newPassword) {
        throw new Error("New password cannot be empty.");
    }
    if (!currentPassword && _user.uid !== "guest-user") { // Simple check, real reauth is better
        console.warn("[LocalAuth] Current password not provided for password update. Backend might require it.");
    }
    try {
        await localApiClient(`/auth/change-password`, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return Promise.resolve();
    } catch (error) {
        console.error("Error updating password:", error);
        throw error;
    }
  },
};

// --- Mock Firestore/Storage (Simplified for Local Backend Focus) ---
// These are minimal stubs as data should flow via apiClient to the local backend.
export const db = {
  collection: (collectionPath: string) => ({
    doc: (documentPath?: string) => ({
      get: async () => {
        console.warn(`[LocalDB-Stub] Attempted to GET doc: ${collectionPath}/${documentPath}. Data should come from local backend via apiClient.`);
        return Promise.resolve({ exists: () => false, data: () => undefined, id: documentPath || "mock-doc-id" });
      },
      set: async (_data: any, _options?: { merge?: boolean }) => {
        console.warn(`[LocalDB-Stub] Attempted to SET doc: ${collectionPath}/${documentPath}. Data should be saved via local backend.`);
        return Promise.resolve();
      },
      update: async (_data: any) => {
        console.warn(`[LocalDB-Stub] Attempted to UPDATE doc: ${collectionPath}/${documentPath}. Data should be updated via local backend.`);
        return Promise.resolve();
      },
      delete: async () => {
        console.warn(`[LocalDB-Stub] Attempted to DELETE doc: ${collectionPath}/${documentPath}. Data should be deleted via local backend.`);
        return Promise.resolve();
      }
    }),
    add: async (_data: any) => {
        console.warn(`[LocalDB-Stub] Attempted to ADD to collection: ${collectionPath}. Data should be added via local backend.`);
        return Promise.resolve({ id: "mock-new-doc-id" });
    },
    where: (_fieldPath: string, _opStr: string, _value: any) => ({ // Basic stub for where
        get: async () => {
            console.warn(`[LocalDB-Stub] Attempted to GET with WHERE on collection: ${collectionPath}. Data should be queried via local backend.`);
            return Promise.resolve({ empty: true, docs: [], size: 0 });
        }
    })
  }),
};

export const storage = {
  ref: (path?: string) => ({
    put: async (_data: Blob | Uint8Array | ArrayBuffer, _metadata?: any) => {
      console.warn(`[LocalStorage-Stub] Attempted to UPLOAD file: ${path}. File handling should be via local backend.`);
      return Promise.resolve({ ref: { getDownloadURL: async () => "mock-upload-url" }, metadata: {}, totalBytes: 0 } as any);
    },
    getDownloadURL: async () => {
      console.warn(`[LocalStorage-Stub] Attempted to GET DOWNLOAD URL for: ${path}. File handling should be via local backend.`);
      return Promise.resolve("mock-download-url");
    },
    delete: async () => {
        console.warn(`[LocalStorage-Stub] Attempted to DELETE file: ${path}. File handling should be via local backend.`);
        return Promise.resolve();
    }
  }),
  // Keep simplified top-level stubs if they were directly used
  uploadBytes: async (_ref: any, _data: any, _metadata?: any) => {
    console.warn(`[LocalStorage-Stub] storage.uploadBytes called. File handling via local backend.`);
    return { ref: { getDownloadURL: async () => "mock-upload-url" } } as any;
  },
  getDownloadURL: async (_ref: any) => {
     console.warn(`[LocalStorage-Stub] storage.getDownloadURL called. File handling via local backend.`);
    return "mock-download-url";
  },
  deleteObject: async (_ref: any) => {
    console.warn(`[LocalStorage-Stub] storage.deleteObject called. File handling via local backend.`);
    return Promise.resolve();
  }
};


export const Timestamp = {
  fromDate: (date: Date) => date.toISOString(),
  now: () => new Date().toISOString(),
};
export const serverTimestamp = () => new Date().toISOString(); 

export const app = { name: "[Local App Stub]" };

export const getEmailProviderCredential = (email: string, pass: string) => {
  console.warn("[LocalAuth] getEmailProviderCredential called. Actual reauth should be handled by backend.");
  // For mock reauth, this might just return an object that updatePassword expects.
  // Since we are moving reauth logic to backend, this might become less relevant.
  return { type: "password", providerId: "password", email, password: pass }; // Placeholder
};

// Helper function for checking if an API key looks like a placeholder or is missing.
const isApiKeyPlaceholder = (key?: string): boolean => {
    if (!key) return true; // Key is missing or undefined
    const lowerKey = key.toLowerCase();
    const placeholders = ["your_", "placeholder", "mock_", "example"];
    if (placeholders.some(p => lowerKey.includes(p))) return true;
    if (key.length < 10) return true; // Arbitrary short length check
    return false;
};

const explicitMockModeEnv = process.env.NEXT_PUBLIC_USE_MOCK_MODE;
const firebaseApiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Determine the effective mock mode.
// Priority:
// 1. If NEXT_PUBLIC_USE_MOCK_MODE is explicitly "true" or "false".
// 2. If not explicitly set, auto-detect based on Firebase API key validity.
let effectiveMockMode: boolean;
if (explicitMockModeEnv === 'true') {
    effectiveMockMode = true;
} else if (explicitMockModeEnv === 'false') {
    effectiveMockMode = false;
} else {
    effectiveMockMode = isApiKeyPlaceholder(firebaseApiKeyFromEnv);
}

// This log will now reflect the effective mode for console/debug purposes.
// The actual API client logic now always hits the local backend.
// The `src/lib/firebase.ts` mocks Firebase client-side specific behaviors.
if (effectiveMockMode) {
  console.info("WakeSync Frontend: Firebase services are MOCKED (due to NEXT_PUBLIC_USE_MOCK_MODE or placeholder API key). API calls target local backend.");
} else {
  console.info("WakeSync Frontend: Configured for REAL Firebase services (valid API key detected and NEXT_PUBLIC_USE_MOCK_MODE not 'true'). Ensure Firebase project is set up. API calls target local backend.");
}
// The type `User` is already defined in this file.
export const storageRef = (instance: typeof storage, path?: string) => instance.ref(path);
