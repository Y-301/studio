// src/lib/firebase.ts
// This file now primarily provides local authentication and data interaction logic
// by calling the local backend.

// Import the mock store and its specific user type
import { mockUserStore, type MockStoredUser } from './mockAuthStore';

// --- Local User Interface (for frontend consumption, without sensitive mock data like password) ---
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Add any other fields you need from the user object
  // emailVerified: boolean; // Example if needed
}

// --- Local Authentication Logic ---
const WAKESYNC_TOKEN_KEY = 'wakeSyncToken';
const WAKESYNC_USER_KEY = 'wakeSyncUser'; // Stores the frontend User object

let currentUserInternal: User | null = null;
const authStateListeners: Array<(user: User | null) => void> = [];

// Client-side initialization of currentUserInternal and storage event listener
if (typeof window !== 'undefined') {
  try {
    const storedUserJson = localStorage.getItem(WAKESYNC_USER_KEY);
    if (storedUserJson) {
      currentUserInternal = JSON.parse(storedUserJson);
    }
  } catch (e) {
    console.error("Error parsing stored user from localStorage:", e);
    // Attempt to clear potentially corrupted items
    localStorage.removeItem(WAKESYNC_USER_KEY);
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
          console.error("Error parsing user from storage event:", e);
          localStorage.removeItem(WAKESYNC_USER_KEY);
          localStorage.removeItem(WAKESYNC_TOKEN_KEY);
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
  (auth as any).currentUser = currentUserInternal; // Update the exported auth object's currentUser
  authStateListeners.forEach(listener => {
    try {
      listener(currentUserInternal);
    } catch (e) {
      console.error("Error in onAuthStateChanged listener:", e);
    }
  });
};

// This interface matches the user structure expected from the backend API responses
interface BackendUser {
  id: string; // Corresponds to uid
  email: string;
  name?: string; // Corresponds to displayName
  photoURL?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // other fields from backend if necessary
}

const mapBackendUserToFrontendUser = (backendUser: BackendUser): User => {
  return {
    uid: backendUser.id,
    email: backendUser.email,
    displayName: backendUser.name || null,
    photoURL: backendUser.photoURL || null,
  };
};


export const auth = {
  currentUser: currentUserInternal,
  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    authStateListeners.push(callback);
    // Immediately invoke callback with current state, ensuring it runs client-side
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => callback(currentUserInternal));
    } else {
      // During SSR, auth state is initially null
      Promise.resolve().then(() => callback(null));
    }
    return () => {
      const index = authStateListeners.indexOf(callback);
      if (index > -1) authStateListeners.splice(index, 1);
    };
  },
  signInWithEmailAndPassword: async (_authIgnored: any, email: string, pass: string): Promise<{ user: User; token?: string }> => {
    const localApiClient = (await import('./apiClient')).apiClient; // Dynamic import
    try {
      const response = await localApiClient<{ user: BackendUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      if (response && response.token && response.user) {
        const feUser = mapBackendUserToFrontendUser(response.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(WAKESYNC_TOKEN_KEY, response.token);
          localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(feUser));
        }
        currentUserInternal = feUser;
        notifyAuthStateChanged();
        return { user: feUser, token: response.token };
      }
      // This path indicates an issue with the backend response or mapping
      throw new Error("Login failed: No token or transformed user data received/processed correctly from backend.");
    } catch (error) {
      console.error("[LocalAuth] signInWithEmailAndPassword error:", error);
      throw error; // Re-throw to be caught by UI
    }
  },
  createUserWithEmailAndPassword: async (_authIgnored: any, email: string, pass: string, name?: string): Promise<{ user: User; token?: string }> => {
    const localApiClient = (await import('./apiClient')).apiClient; // Dynamic import
    try {
      const response = await localApiClient<{ user: BackendUser; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass, name }),
      });

      if (response && response.token && response.user) {
        const feUser = mapBackendUserToFrontendUser(response.user);
        
        // Also update the mockUserStore for consistency if apiClient needs it for /app-status mock
        const newMockStoredUser: MockStoredUser = {
            uid: feUser.uid,
            email: feUser.email,
            displayName: feUser.displayName,
            photoURL: feUser.photoURL,
            password: pass, // Only for mock store local check, not for frontend User object
            createdAt: response.user.createdAt || new Date().toISOString(),
            updatedAt: response.user.updatedAt || new Date().toISOString(),
        };
        mockUserStore[feUser.uid] = newMockStoredUser;


        if (typeof window !== 'undefined') {
          localStorage.setItem(WAKESYNC_TOKEN_KEY, response.token);
          localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(feUser));
        }
        currentUserInternal = feUser;
        notifyAuthStateChanged();
        return { user: feUser, token: response.token };
      }
      throw new Error("Signup failed: No token or transformed user data received/processed correctly from backend.");
    } catch (error) {
      console.error("[LocalAuth] createUserWithEmailAndPassword error:", error);
      throw error;
    }
  },
  sendPasswordResetEmail: async (_authIgnored: any, email: string): Promise<void> => {
    const localApiClient = (await import('./apiClient')).apiClient; // Dynamic import
    console.log(`[LocalAuth] Password reset email initiated for ${email} (via backend).`);
    try {
        await localApiClient('/auth/request-password-reset', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        return Promise.resolve();
    } catch(error) {
        console.error("[LocalAuth] sendPasswordResetEmail error:", error);
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
        const localApiClient = (await import('./apiClient')).apiClient; // Dynamic import
        await localApiClient('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("[LocalAuth] Error calling backend logout, proceeding with client-side logout:", error);
    }
    return Promise.resolve();
  },
  updateProfile: async (user: User, profileUpdates: { displayName?: string | null; photoURL?: string | null }): Promise<void> => {
    const localApiClient = (await import('./apiClient')).apiClient; // Dynamic import
    if (currentUserInternal && currentUserInternal.uid === user.uid) {
      try {
        const backendProfileUpdates: { name?: string | null; photoURL?: string | null } = {};
        if (profileUpdates.displayName !== undefined) backendProfileUpdates.name = profileUpdates.displayName;
        if (profileUpdates.photoURL !== undefined) backendProfileUpdates.photoURL = profileUpdates.photoURL;

        const response = await localApiClient<{ user: BackendUser }>(`/auth/profile`, {
            method: 'PUT',
            body: JSON.stringify(backendProfileUpdates)
        });

        if (response && response.user) {
            const feUser = mapBackendUserToFrontendUser(response.user);
            if (typeof window !== 'undefined') {
                localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(feUser));
            }
            currentUserInternal = feUser;
            notifyAuthStateChanged();
        } else {
            throw new Error("Profile update response did not include valid user data.");
        }

      } catch (error) {
        console.error("[LocalAuth] Error updating profile on backend:", error);
        throw error;
      }
    } else {
        console.warn("[LocalAuth] updateProfile called but no current user or UID mismatch.");
         throw new Error("User not authenticated or UID mismatch for profile update.");
    }
  },
  reauthenticateWithCredential: async (_user: User, credential: { password?: string }): Promise<{user: User}> => {
    // This function's utility is limited without a real Firebase backend for re-authentication.
    // The local backend would need a specific endpoint to verify a password, which isn't standard like Firebase re-auth.
    console.warn("[LocalAuth] reauthenticateWithCredential called. This is a conceptual placeholder for local backend.");
    if (!currentUserInternal) throw new Error("No user to reauthenticate");
    // For a local backend, this would typically involve sending the current password to an endpoint.
    // Since it's a mock, we'll assume success if a password is provided.
    if (credential.password) {
        return Promise.resolve({ user: currentUserInternal });
    }
    throw new Error("Reauthentication failed (mock: password required).");
  },
  updatePassword: async (_user: User, newPassword?: string | null, currentPassword?: string | null): Promise<void> => {
    const localApiClient = (await import('./apiClient')).apiClient; // Dynamic import
    console.warn("[LocalAuth] updatePassword called. Relies on backend for password change.");
     if (!newPassword) {
        throw new Error("New password cannot be empty.");
    }
    if (!currentPassword && (_user?.uid !== "guest-user" && _user?.uid !== undefined)) { // Ensure user is not guest or undefined
        console.warn("[LocalAuth] Current password not provided for password update. Backend will likely require it.");
    }
    try {
        await localApiClient(`/auth/change-password`, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return Promise.resolve();
    } catch (error) {
        console.error("[LocalAuth] Error updating password:", error);
        throw error;
    }
  },
};

// Simplified Timestamp and serverTimestamp for local use.
export const Timestamp = {
  fromDate: (date: Date): Date => date, // Return Date object
  now: (): Date => new Date(),
};
export const serverTimestamp = (): Date => new Date();

// Simplified getEmailProviderCredential for local use with backend
export const getEmailProviderCredential = (_email: string, pass: string) => {
  console.warn("[LocalAuth] getEmailProviderCredential called. Returning password for potential backend re-auth verification.");
  return { password: pass };
};


const explicitMockModeEnv = typeof window !== 'undefined' ? localStorage.getItem('NEXT_PUBLIC_USE_MOCK_MODE') : process.env.NEXT_PUBLIC_USE_MOCK_MODE;
const isMockMode = explicitMockModeEnv === 'true';

if (typeof window !== 'undefined' && explicitMockModeEnv === null && process.env.NEXT_PUBLIC_USE_MOCK_MODE) {
    // If env var is set but localStorage is not, initialize localStorage.
    localStorage.setItem('NEXT_PUBLIC_USE_MOCK_MODE', process.env.NEXT_PUBLIC_USE_MOCK_MODE);
}

if (isMockMode) {
  console.info("WakeSync Frontend: Operating in LOCAL/MOCK mode. Auth and API calls target local backend (or frontend mocks in apiClient).");
} else {
  console.info("WakeSync Frontend: Operating in LIVE mode. Auth and API calls target local backend (or configured live backend).");
}

// This is not used by this local auth setup but kept for type compatibility if other parts of the app expect it.
// export const EmailAuthProvider = { PROVIDER_ID: "password" }; // Firebase's constant

// Stub for storageRef if needed elsewhere, though storage operations are also now conceptual for local backend.
export const storageRef = (instance: typeof storage, path?: string) => instance.ref(path);


// --- Mock Firestore/Storage Stubs (Conceptual for Local Backend) ---
// These are minimal stubs as data operations should go through apiClient to the local backend.
export const db = {
  collection: (collectionPath: string) => ({
    doc: (documentPath?: string) => ({
      get: async () => {
        console.warn(`[LocalDB-Stub] GET doc: ${collectionPath}/${documentPath}. Data via apiClient.`);
        return Promise.resolve({ exists: () => false, data: () => undefined, id: documentPath || "mock-doc-id" });
      },
      set: async (_data: any, _options?: { merge?: boolean }) => {
        console.warn(`[LocalDB-Stub] SET doc: ${collectionPath}/${documentPath}. Data via apiClient.`);
        return Promise.resolve();
      },
      update: async (_data: any) => {
        console.warn(`[LocalDB-Stub] UPDATE doc: ${collectionPath}/${documentPath}. Data via apiClient.`);
        return Promise.resolve();
      },
      delete: async () => {
        console.warn(`[LocalDB-Stub] DELETE doc: ${collectionPath}/${documentPath}. Data via apiClient.`);
        return Promise.resolve();
      }
    }),
    add: async (_data: any) => {
        console.warn(`[LocalDB-Stub] ADD to collection: ${collectionPath}. Data via apiClient.`);
        return Promise.resolve({ id: "mock-new-doc-id" });
    },
    where: (_fieldPath: string, _opStr: string, _value: any) => ({
        get: async () => {
            console.warn(`[LocalDB-Stub] GET with WHERE on collection: ${collectionPath}. Data via apiClient.`);
            return Promise.resolve({ empty: true, docs: [], size: 0 });
        }
    })
  }),
};

export const storage = {
  ref: (path?: string) => ({
    put: async (_data: Blob | Uint8Array | ArrayBuffer, _metadata?: any) => {
      console.warn(`[LocalStorage-Stub] UPLOAD file: ${path}. File handling via local backend/apiClient.`);
      return Promise.resolve({ ref: { getDownloadURL: async () => "mock-upload-url" }, metadata: {}, totalBytes: 0 } as any);
    },
    getDownloadURL: async () => {
      console.warn(`[LocalStorage-Stub] GET DOWNLOAD URL for: ${path}. File handling via local backend/apiClient.`);
      return Promise.resolve("mock-download-url");
    },
    delete: async () => {
        console.warn(`[LocalStorage-Stub] DELETE file: ${path}. File handling via local backend/apiClient.`);
        return Promise.resolve();
    }
  }),
  uploadBytes: async (_ref: any, _data: any, _metadata?: any) => {
    console.warn(`[LocalStorage-Stub] storage.uploadBytes called. File handling via local backend/apiClient.`);
    return { ref: { getDownloadURL: async () => "mock-upload-url" } } as any;
  },
  getDownloadURL: async (_ref: any) => {
     console.warn(`[LocalStorage-Stub] storage.getDownloadURL called. File handling via local backend/apiClient.`);
    return "mock-download-url";
  },
  deleteObject: async (_ref: any) => {
    console.warn(`[LocalStorage-Stub] storage.deleteObject called. File handling via local backend/apiClient.`);
    return Promise.resolve();
  }
};
