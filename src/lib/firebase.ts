// import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore, type Firestore } from "firebase/firestore"; // Example if you use Firestore
// import { getStorage, type FirebaseStorage } from "firebase/storage"; // Example if you use Storage

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// // Initialize Firebase
// let app: FirebaseApp;
// if (!getApps().length) {
//   app = initializeApp(firebaseConfig);
// } else {
//   app = getApp();
// }

// const auth: Auth = getAuth(app);
// const db: Firestore = getFirestore(app); // Example
// const storage: FirebaseStorage = getStorage(app); // Example

// export { app, auth , db, storage };

// Mock Implementation Starts Here

export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Firebase User type has more, but these are common.
  // Adding getIdToken for apiClient compatibility
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

// In-memory store for users (email -> {password, profile})
const mockUserStore: Record<string, { password?: string; profile: MockUser }> = {
  "demo@example.com": {
    password: "password123",
    profile: {
      uid: "mock-uid-demo",
      email: "demo@example.com",
      displayName: "Demo User",
      photoURL: "https://picsum.photos/seed/demouser/40/40",
      getIdToken: async () => "mock-id-token-demo",
    },
  },
};

let mockCurrentUser: MockUser | null = null;
const authStateListeners: Array<(user: MockUser | null) => void> = [];

const notifyAuthStateChanged = () => {
  // Update the currentUser property on the mockAuth object itself for direct access
  (mockAuth as any).currentUser = mockCurrentUser; 
  authStateListeners.forEach(listener => listener(mockCurrentUser));
};

export const auth = {
  currentUser: mockCurrentUser, // This will be updated by login/logout via notifyAuthStateChanged
  onAuthStateChanged: (callback: (user: MockUser | null) => void): (() => void) => {
    authStateListeners.push(callback);
    // Immediately call with current state, simulating Firebase behavior
    Promise.resolve().then(() => callback(mockCurrentUser)); 
    
    return () => { // Unsubscribe function
      const index = authStateListeners.indexOf(callback);
      if (index > -1) {
        authStateListeners.splice(index, 1);
      }
    };
  },
  signInWithEmailAndPassword: async (authInstance: any, email: string, pass: string): Promise<{ user: MockUser }> => {
    console.log("[MockAuth] Attempting signIn:", email);
    const storedUser = mockUserStore[email];
    if (storedUser && storedUser.password === pass) {
      mockCurrentUser = storedUser.profile;
      notifyAuthStateChanged();
      console.log("[MockAuth] signIn successful:", mockCurrentUser);
      return { user: mockCurrentUser };
    }
    console.log("[MockAuth] signIn failed: Invalid credentials");
    throw new Error("auth/invalid-credential"); // Simulate Firebase error
  },
  createUserWithEmailAndPassword: async (authInstance: any, email: string, pass: string): Promise<{ user: MockUser }> => {
    console.log("[MockAuth] Attempting createUser:", email);
    if (mockUserStore[email]) {
      console.log("[MockAuth] createUser failed: Email already in use");
      throw new Error("auth/email-already-in-use");
    }
    const uid = `mock-uid-${Date.now()}`;
    const newUser: MockUser = {
      uid,
      email,
      displayName: null,
      photoURL: null,
      getIdToken: async () => `mock-id-token-${uid}`,
    };
    mockUserStore[email] = { password: pass, profile: newUser };
    mockCurrentUser = newUser;
    notifyAuthStateChanged();
    console.log("[MockAuth] createUser successful:", mockCurrentUser);
    return { user: mockCurrentUser };
  },
  sendPasswordResetEmail: async (authInstance: any, email: string): Promise<void> => {
    console.log(`[MockAuth] Password reset email would be sent to ${email}`);
    if (!mockUserStore[email]) {
        // Even if user doesn't exist, Firebase doesn't typically throw an error here
        // to prevent email enumeration attacks.
        console.log(`[MockAuth] User ${email} not found, but pretending to send email.`);
    }
    return Promise.resolve();
  },
  signOut: async (authInstance: any): Promise<void> => {
    console.log("[MockAuth] Signing out user:", mockCurrentUser?.email);
    mockCurrentUser = null;
    notifyAuthStateChanged();
    console.log("[MockAuth] signOut successful");
    return Promise.resolve();
  },
  updateProfile: async (user: MockUser, profileUpdates: { displayName?: string | null; photoURL?: string | null }): Promise<void> => {
    if (!mockCurrentUser || mockCurrentUser.uid !== user.uid) {
      throw new Error("auth/user-not-found_OR_WRONG_USER_FOR_UPDATE");
    }
    console.log("[MockAuth] Updating profile for:", user.email, "with", profileUpdates);
    if (profileUpdates.displayName !== undefined) {
      mockCurrentUser.displayName = profileUpdates.displayName;
    }
    if (profileUpdates.photoURL !== undefined) {
      mockCurrentUser.photoURL = profileUpdates.photoURL;
    }
    // Update in store as well if necessary for persistence across mock sessions (not implemented here for simplicity)
    const userInStore = Object.values(mockUserStore).find(u => u.profile.uid === mockCurrentUser!.uid);
    if(userInStore){
        if (profileUpdates.displayName !== undefined) userInStore.profile.displayName = profileUpdates.displayName;
        if (profileUpdates.photoURL !== undefined) userInStore.profile.photoURL = profileUpdates.photoURL;
    }
    notifyAuthStateChanged(); // Notify if current user's direct properties changed
    console.log("[MockAuth] Profile updated:", mockCurrentUser);
    return Promise.resolve();
  },
  reauthenticateWithCredential: async (user: MockUser, credential: any): Promise<{user: MockUser}> => {
    // Super simplified mock: always succeeds if credential is provided and matches current user's "mocked" password
    console.log("[MockAuth] Reauthenticating user:", user.email);
    if (!mockCurrentUser || mockCurrentUser.uid !== user.uid || !user.email) {
      throw new Error("auth/user-mismatch_OR_NO_EMAIL");
    }
    const storedUser = mockUserStore[user.email];
    // 'credential' in a real scenario is an AuthCredential, here we might expect it to contain the password
    // For this mock, let's assume credential.password holds the current password
    if (storedUser && credential && credential.password === storedUser.password) {
      console.log("[MockAuth] Reauthentication successful for", user.email);
      return Promise.resolve({ user: mockCurrentUser });
    }
    console.log("[MockAuth] Reauthentication failed for", user.email);
    throw new Error("auth/wrong-password");
  },
  updatePassword: async (user: MockUser, newPassword?: string | null): Promise<void> => {
     if (!mockCurrentUser || mockCurrentUser.uid !== user.uid || !user.email) {
      throw new Error("auth/user-not-found_OR_WRONG_USER_FOR_UPDATE");
    }
    if (!newPassword) {
        throw new Error("auth/invalid-argument_PASSWORD_EMPTY");
    }
    console.log("[MockAuth] Updating password for:", user.email);
    const userInStore = mockUserStore[user.email];
    if (userInStore) {
        userInStore.password = newPassword;
    }
    console.log("[MockAuth] Password updated for", user.email);
    return Promise.resolve();
  }
};


// Mock Firestore (basic structure, not fully implemented as it's not actively used yet)
const mockFirestoreStore: Record<string, Record<string, any>> = {
  // Example: 'users/userId': { displayName: 'Test', email: 'test@example.com' }
};

export const db = {
  collection: (collectionPath: string) => ({
    doc: (documentPath?: string) => ({
      get: async () => {
        console.log(`[MockFirestore] GET doc: ${collectionPath}/${documentPath}`);
        const data = mockFirestoreStore[`${collectionPath}/${documentPath}`];
        return Promise.resolve({
          exists: !!data,
          data: () => data,
          id: documentPath,
        });
      },
      set: async (data: any, options?: any) => {
        console.log(`[MockFirestore] SET doc: ${collectionPath}/${documentPath} with data:`, data, "options:", options);
        mockFirestoreStore[`${collectionPath}/${documentPath}`] = data; // Simplified, merge logic for options.merge not handled
        return Promise.resolve();
      },
      update: async (data: any) => {
         console.log(`[MockFirestore] UPDATE doc: ${collectionPath}/${documentPath} with data:`, data);
        const existingData = mockFirestoreStore[`${collectionPath}/${documentPath}`] || {};
        mockFirestoreStore[`${collectionPath}/${documentPath}`] = { ...existingData, ...data };
        return Promise.resolve();
      },
      delete: async () => {
        console.log(`[MockFirestore] DELETE doc: ${collectionPath}/${documentPath}`);
        delete mockFirestoreStore[`${collectionPath}/${documentPath}`];
        return Promise.resolve();
      },
      onSnapshot: (observer: {
        next?: (snapshot: any) => void;
        error?: (error: Error) => void;
        complete?: () => void;
      }) => {
        // Super basic onSnapshot mock: just sends current state once
        console.log(`[MockFirestore] onSnapshot for: ${collectionPath}/${documentPath}`);
        const data = mockFirestoreStore[`${collectionPath}/${documentPath}`];
        const mockSnapshot = {
          exists: !!data,
          data: () => data,
          id: documentPath,
        };
        if (observer.next) observer.next(mockSnapshot);
        // Real onSnapshot would return an unsubscribe function
        return () => { console.log(`[MockFirestore] Unsubscribed from onSnapshot for: ${collectionPath}/${documentPath}`); };
      }
    }),
    add: async (data: any) => {
      const newId = `mock-doc-${Date.now()}`;
      console.log(`[MockFirestore] ADD to collection: ${collectionPath}, new ID: ${newId}, data:`, data);
      mockFirestoreStore[`${collectionPath}/${newId}`] = data;
      return Promise.resolve({ id: newId });
    },
    where: () => { // Basic mock, doesn't actually filter
        console.warn("[MockFirestore] 'where' queries are not fully implemented in mock.");
        return {
            onSnapshot: (observer: any) => {
                if(observer.next) observer.next({ docs: Object.entries(mockFirestoreStore).filter(([key]) => key.startsWith(collectionPath + '/')).map(([key, value]) => ({id: key.split('/').pop(), data: () => value}))});
                return () => {};
            },
            get: async () => {
                 console.warn("[MockFirestore] 'where' queries get() is not fully implemented in mock.");
                 return Promise.resolve({ docs: Object.entries(mockFirestoreStore).filter(([key]) => key.startsWith(collectionPath + '/')).map(([key, value]) => ({id: key.split('/').pop(), data: () => value})) });
            }
        }
    }
  }),
};


// Log warnings if placeholder values are used for any Firebase config keys (kept for reference).
const placeholderWarning = (key: string) =>
  `Firebase config is using a placeholder value for ${key}. ` +
  "This is fine for mock mode. If switching to real Firebase, " +
  "ensure .env file has your Firebase project credentials.";

const firebaseConfigOriginal = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

if (!firebaseConfigOriginal.apiKey || firebaseConfigOriginal.apiKey.includes("YOUR_") || firebaseConfigOriginal.apiKey.includes("PLACEHOLDER")) {
  console.warn(placeholderWarning("NEXT_PUBLIC_FIREBASE_API_KEY"));
}
if (!firebaseConfigOriginal.authDomain || firebaseConfigOriginal.authDomain.includes("YOUR_") || firebaseConfigOriginal.authDomain.includes("PLACEHOLDER")) {
  console.warn(placeholderWarning("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"));
}
if (!firebaseConfigOriginal.projectId || firebaseConfigOriginal.projectId.includes("YOUR_") || firebaseConfigOriginal.projectId.includes("PLACEHOLDER")) {
  console.warn(placeholderWarning("NEXT_PUBLIC_FIREBASE_PROJECT_ID"));
}

if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.includes("YOUR_") || process.env.GOOGLE_API_KEY.includes("PLACEHOLDER")) {
    console.warn(
    "Genkit is using a placeholder value for GOOGLE_API_KEY in .env. " +
    "This is fine for mock mode. If switching to real Genkit, set your GOOGLE_API_KEY."
    );
}

// Export a mock app object if any part of the app expects it
export const app = { name: "[mock Firebase app]" };
export const storage = { name: "[mock Firebase storage]" }; // if used
