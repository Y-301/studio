
// src/lib/firebase.ts
// This file now primarily provides local authentication and data interaction logic
// by calling the local backend.

// --- Local User Interface (replaces FirebaseUserType) ---
export interface User {
  uid: string; // Corresponds to 'id' from backend
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Add any other fields you need from the user object
  // emailVerified: boolean; // Example if needed
}

// --- App Status Context (New) ---
// This is now primarily managed by AppContext.tsx which calls /api/data/app-status
// export interface AppStatus {
//   isSeededByCsv: boolean;
//   isAppInitialized: boolean; // True if users exist (app has been set up)
//   isLoading: boolean;
// }

// --- Local Authentication Logic ---
const WAKESYNC_TOKEN_KEY = 'wakeSyncToken';
const WAKESYNC_USER_KEY = 'wakeSyncUser'; // Stores the User object (uid, displayName, email, photoURL)

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
    if (typeof window !== 'undefined') { // Double check for safety, though already in a window block
      localStorage.removeItem(WAKESYNC_USER_KEY);
      localStorage.removeItem(WAKESYNC_TOKEN_KEY);
    }
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
          // Clear potentially corrupted data
          localStorage.removeItem(WAKESYNC_USER_KEY);
          localStorage.removeItem(WAKESYNC_TOKEN_KEY);
        }
      }
      // Compare UIDs to see if the actual user changed
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

interface BackendUser {
  id: string;
  email: string;
  name?: string;
  photoURL?: string | null;
  createdAt: string;
  updatedAt: string;
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
    if (typeof window !== 'undefined') {
        Promise.resolve().then(() => callback(currentUserInternal));
    } else {
        Promise.resolve().then(() => callback(null));
    }
    return () => {
      const index = authStateListeners.indexOf(callback);
      if (index > -1) authStateListeners.splice(index, 1);
    };
  },
  signInWithEmailAndPassword: async (_authIgnored: any, email: string, pass: string): Promise<{ user: User; token?: string }> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    try {
      const response = await localApiClient<{ user: BackendUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      if (response.token && response.user && typeof window !== 'undefined') {
        const feUser = mapBackendUserToFrontendUser(response.user);
        localStorage.setItem(WAKESYNC_TOKEN_KEY, response.token);
        localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(feUser));
        currentUserInternal = feUser;
        notifyAuthStateChanged();
        return { user: feUser, token: response.token };
      }
      if (!response.token || !response.user) {
        throw new Error("Login failed: No token or transformed user data received/processed correctly from backend.");
      }
      // Fallback if window is undefined (should not happen for login UI flow)
      return { user: mapBackendUserToFrontendUser(response.user), token: response.token };

    } catch (error) {
      console.error("signInWithEmailAndPassword error:", error);
      throw error;
    }
  },
  createUserWithEmailAndPassword: async (_authIgnored: any, email: string, pass: string, name?: string): Promise<{ user: User; token?: string }> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    try {
      const response = await localApiClient<{ user: BackendUser; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass, name }),
      });
      if (response.token && response.user && typeof window !== 'undefined') {
        const feUser = mapBackendUserToFrontendUser(response.user);
        localStorage.setItem(WAKESYNC_TOKEN_KEY, response.token);
        localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(feUser));
        currentUserInternal = feUser;
        notifyAuthStateChanged();
        return { user: feUser, token: response.token };
      }
      if (!response.token || !response.user) {
        throw new Error("Signup failed: No token or transformed user data received/processed correctly from backend.");
      }
      return { user: mapBackendUserToFrontendUser(response.user), token: response.token };

    } catch (error) {
      console.error("createUserWithEmailAndPassword error:", error);
      throw error;
    }
  },
  sendPasswordResetEmail: async (_authIgnored: any, email: string): Promise<void> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    console.log(`[LocalAuth] Password reset email initiated for ${email} (via backend).`);
    try {
        await localApiClient('/auth/request-password-reset', {
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
        const localApiClient = (await import('./apiClient')).apiClient;
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
        const backendProfileUpdates: { name?: string | null; photoURL?: string | null } = {};
        if (profileUpdates.displayName !== undefined) backendProfileUpdates.name = profileUpdates.displayName;
        if (profileUpdates.photoURL !== undefined) backendProfileUpdates.photoURL = profileUpdates.photoURL;

        const response = await localApiClient<{ user: BackendUser }>(`/auth/profile`, {
            method: 'PUT',
            body: JSON.stringify(backendProfileUpdates)
        });

        if (response.user) {
            const feUser = mapBackendUserToFrontendUser(response.user);
            if (typeof window !== 'undefined') {
                localStorage.setItem(WAKESYNC_USER_KEY, JSON.stringify(feUser));
            }
            currentUserInternal = feUser;
            notifyAuthStateChanged();
            console.log("[LocalAuth] Profile updated and synced from backend.");
        } else {
            throw new Error("Profile update response did not include user data.");
        }

      } catch (error) {
        console.error("Error updating profile on backend:", error);
        throw error;
      }
    } else {
        console.warn("[LocalAuth] updateProfile called but no current user or UID mismatch.");
    }
    return Promise.resolve();
  },
  // reauthenticateWithCredential and updatePassword now primarily rely on backend for logic
  reauthenticateWithCredential: async (_user: User, credential: { password?: string }): Promise<{user: User}> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    console.warn("[LocalAuth] reauthenticateWithCredential called. Backend handles re-auth.");
    if (!currentUserInternal) throw new Error("No user to reauthenticate");
     try {
        // This endpoint is conceptual, backend needs a robust re-auth flow.
        // For now, it might just verify password and return success if it matches.
        await localApiClient('/auth/reauthenticate', { // Example endpoint
            method: 'POST',
            body: JSON.stringify({ currentPassword: credential.password })
        });
        return Promise.resolve({ user: currentUserInternal });
    } catch (error) {
        console.error("Reauthentication error:", error);
        throw error;
    }
  },
  updatePassword: async (_user: User, newPassword?: string | null, currentPassword?: string | null): Promise<void> => {
    const localApiClient = (await import('./apiClient')).apiClient;
    console.warn("[LocalAuth] updatePassword called. Backend handles password change.");
     if (!newPassword) {
        throw new Error("New password cannot be empty.");
    }
    if (!currentPassword && _user.uid !== "guest-user") {
        console.warn("[LocalAuth] Current password not provided for password update. Backend will require it.");
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
    where: (_fieldPath: string, _opStr: string, _value: any) => ({
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


// Simplified Timestamp and serverTimestamp for local use.
export const Timestamp = {
  fromDate: (date: Date) => date, // Return Date object or ISO string
  now: () => new Date(),
};
export const serverTimestamp = () => new Date(); // Or new Date().toISOString()

// getEmailProviderCredential might not be directly equivalent in a custom backend.
// For re-authentication, the backend would typically expect the current password.
export const getEmailProviderCredential = (_email: string, pass: string) => {
  console.warn("[LocalAuth] getEmailProviderCredential called. Passing password for backend re-auth.");
  return { password: pass }; // Simplified for passing current password to backend
};


// Determine the effective mock mode for logging purposes.
// The application now primarily relies on the local backend.
// `NEXT_PUBLIC_USE_MOCK_MODE` can still be used to control frontend-only mocks if ever needed,
// but the `apiClient` will generally hit the local backend.
const explicitMockModeEnv = process.env.NEXT_PUBLIC_USE_MOCK_MODE;

if (explicitMockModeEnv === 'true') {
  console.info("WakeSync Frontend: NEXT_PUBLIC_USE_MOCK_MODE is true. Auth and API calls target local backend. Ensure backend is running.");
} else {
  console.info("WakeSync Frontend: NEXT_PUBLIC_USE_MOCK_MODE is false or not set. Auth and API calls target local backend. Ensure backend is running.");
}

export const storageRef = (instance: typeof storage, path?: string) => instance.ref(path);
