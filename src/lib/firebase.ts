// src/lib/firebase.ts

// --- Configuration for Real Firebase (Used when USE_MOCK_MODE is false) ---
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  type Auth, 
  type User as FirebaseUserType, // Rename to avoid conflict with our MockUser
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential as firebaseReauthenticateWithCredential,
  EmailAuthProvider // Needed for reauthentication credential
} from "firebase/auth";
import { 
  getFirestore, 
  type Firestore,
  collection as firestoreCollection,
  doc as firestoreDoc,
  getDoc as firestoreGetDoc,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  addDoc as firestoreAddDoc,
  onSnapshot as firestoreOnSnapshot,
  query as firestoreQuery,
  where as firestoreWhere,
  getDocs as firestoreGetDocs,
  Timestamp as FirestoreTimestamp,
  serverTimestamp as firestoreServerTimestamp
} from "firebase/firestore";
// import { getStorage, type FirebaseStorage } from "firebase/storage"; // Example if you use Storage

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- Mock Implementations (Used when USE_MOCK_MODE is true) ---

export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean; // Added for completeness
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  // Add other methods if your app uses them, e.g., delete, reload
}

// In-memory store for users (email -> {password, profile})
// Passwords are not "hashed" in this mock, stored as plain text for simplicity.
const mockUserStore: Record<string, { password?: string; profile: MockUser }> = {
  "demo@example.com": {
    password: "password123",
    profile: {
      uid: "mock-uid-demo",
      email: "demo@example.com",
      displayName: "Demo User",
      photoURL: "https://picsum.photos/seed/demouser/40/40",
      emailVerified: true,
      getIdToken: async () => "mock-id-token-demo",
    },
  },
};

let mockCurrentUserInternal: MockUser | null = null;
const mockAuthStateListeners: Array<(user: MockUser | null) => void> = [];

const notifyMockAuthStateChanged = () => {
  // Update the currentUser property on the mockAuth object itself for direct access
  mockAuthSingleton.currentUser = mockCurrentUserInternal;
  mockAuthStateListeners.forEach(listener => {
    try {
      listener(mockCurrentUserInternal);
    } catch (e) {
      console.error("Error in mock onAuthStateChanged listener:", e);
    }
  });
};

const mockAuthSingleton = {
  currentUser: mockCurrentUserInternal,
  onAuthStateChanged: (callback: (user: MockUser | null) => void): (() => void) => {
    mockAuthStateListeners.push(callback);
    // Immediately call with current state, simulating Firebase behavior
    Promise.resolve().then(() => callback(mockCurrentUserInternal));
    
    return () => { // Unsubscribe function
      const index = mockAuthStateListeners.indexOf(callback);
      if (index > -1) {
        mockAuthStateListeners.splice(index, 1);
      }
    };
  },
  signInWithEmailAndPassword: async (_authInstanceIgnored: any, email: string, pass: string): Promise<{ user: MockUser }> => {
    console.log("[MockAuth] Attempting signIn:", email);
    const storedUserEntry = mockUserStore[email];
    if (storedUserEntry && storedUserEntry.password === pass) {
      mockCurrentUserInternal = storedUserEntry.profile;
      notifyMockAuthStateChanged();
      console.log("[MockAuth] signIn successful:", mockCurrentUserInternal);
      return { user: mockCurrentUserInternal };
    }
    console.log("[MockAuth] signIn failed: Invalid credentials for", email);
    throw Object.assign(new Error("Mock Auth: Invalid credentials."), { code: "auth/invalid-credential" });
  },
  createUserWithEmailAndPassword: async (_authInstanceIgnored: any, email: string, pass: string): Promise<{ user: MockUser }> => {
    console.log("[MockAuth] Attempting createUser:", email);
    if (mockUserStore[email]) {
      console.log("[MockAuth] createUser failed: Email already in use");
      throw Object.assign(new Error("Mock Auth: Email already in use."), { code: "auth/email-already-in-use" });
    }
    const uid = `mock-uid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newUser: MockUser = {
      uid,
      email,
      displayName: null,
      photoURL: null,
      emailVerified: false, // New users are typically not verified initially
      getIdToken: async (_forceRefresh?: boolean) => `mock-id-token-${uid}`,
    };
    mockUserStore[email] = { password: pass, profile: newUser };
    mockCurrentUserInternal = newUser;
    notifyMockAuthStateChanged();
    console.log("[MockAuth] createUser successful:", mockCurrentUserInternal);
    return { user: mockCurrentUserInternal };
  },
  sendPasswordResetEmail: async (_authInstanceIgnored: any, email: string): Promise<void> => {
    console.log(`[MockAuth] Password reset email would be sent to ${email}.`);
    if (!mockUserStore[email]) {
        console.log(`[MockAuth] User ${email} not found, but pretending to send email (Firebase behavior).`);
    }
    return Promise.resolve();
  },
  signOut: async (_authInstanceIgnored: any): Promise<void> => {
    console.log("[MockAuth] Signing out user:", mockCurrentUserInternal?.email);
    mockCurrentUserInternal = null;
    notifyMockAuthStateChanged();
    console.log("[MockAuth] signOut successful");
    return Promise.resolve();
  },
  updateProfile: async (user: MockUser, profileUpdates: { displayName?: string | null; photoURL?: string | null }): Promise<void> => {
    if (!mockCurrentUserInternal || mockCurrentUserInternal.uid !== user.uid || !user.email) {
      throw Object.assign(new Error("Mock Auth: User not found or mismatch for profile update."), { code: "auth/user-mismatch" });
    }
    console.log("[MockAuth] Updating profile for:", user.email, "with", profileUpdates);
    
    const userInStore = mockUserStore[user.email];
    if (userInStore) {
        if (profileUpdates.displayName !== undefined) {
            userInStore.profile.displayName = profileUpdates.displayName;
            if (mockCurrentUserInternal.uid === userInStore.profile.uid) mockCurrentUserInternal.displayName = profileUpdates.displayName;
        }
        if (profileUpdates.photoURL !== undefined) {
            userInStore.profile.photoURL = profileUpdates.photoURL;
            if (mockCurrentUserInternal.uid === userInStore.profile.uid) mockCurrentUserInternal.photoURL = profileUpdates.photoURL;
        }
        notifyMockAuthStateChanged(); // Notify if current user's direct properties changed
        console.log("[MockAuth] Profile updated in store:", userInStore.profile);
    } else {
        console.warn("[MockAuth] User not found in store for profile update, only updating current user object if it matches.");
         if (mockCurrentUserInternal.uid === user.uid) {
            if (profileUpdates.displayName !== undefined) mockCurrentUserInternal.displayName = profileUpdates.displayName;
            if (profileUpdates.photoURL !== undefined) mockCurrentUserInternal.photoURL = profileUpdates.photoURL;
            notifyMockAuthStateChanged();
        }
    }
    return Promise.resolve();
  },
  reauthenticateWithCredential: async (user: MockUser, credential: any): Promise<{user: MockUser}> => {
    console.log("[MockAuth] Reauthenticating user:", user.email);
    if (!mockCurrentUserInternal || mockCurrentUserInternal.uid !== user.uid || !user.email) {
      throw Object.assign(new Error("Mock Auth: User mismatch or no email for reauthentication."), { code: "auth/user-mismatch" });
    }
    const storedUserEntry = mockUserStore[user.email];
    // Real credential is an AuthCredential. Here, we assume `credential.password` for mock.
    if (storedUserEntry && credential && credential.type === "password" && credential.password === storedUserEntry.password) {
      console.log("[MockAuth] Reauthentication successful for", user.email);
      return Promise.resolve({ user: mockCurrentUserInternal });
    }
    console.log("[MockAuth] Reauthentication failed for", user.email);
    throw Object.assign(new Error("Mock Auth: Incorrect password for reauthentication."), { code: "auth/wrong-password" });
  },
  updatePassword: async (user: MockUser, newPassword?: string | null): Promise<void> => {
     if (!mockCurrentUserInternal || mockCurrentUserInternal.uid !== user.uid || !user.email) {
      throw Object.assign(new Error("Mock Auth: User not found or mismatch for password update."), { code: "auth/user-mismatch" });
    }
    if (!newPassword || newPassword.length < 6) { // Basic validation
        throw Object.assign(new Error("Mock Auth: Password should be at least 6 characters."), { code: "auth/weak-password" });
    }
    console.log("[MockAuth] Updating password for:", user.email);
    const userInStore = mockUserStore[user.email];
    if (userInStore) {
        userInStore.password = newPassword;
        console.log("[MockAuth] Password updated in store for", user.email);
    } else {
         console.warn("[MockAuth] User not found in store for password update.");
    }
    return Promise.resolve();
  },
  // Adding a mock EmailAuthProvider for constructing credentials
  EmailAuthProvider: {
    credential: (email: string, pass: string) => ({
        type: "password", // Custom property for mock to identify
        providerId: "password", // Matches Firebase
        email, // Store for potential use, not standard on Firebase credential object itself
        password: pass, // Store for mock reauth
        signInMethod: "password"
    })
  }
};

// Mock Firestore
const mockFirestoreStore: Record<string, any> = {
  // Example: 'users/userId': { displayName: 'Test', email: 'test@example.com', createdAt: new Date() }
  // Example: 'settings/userId': { theme: 'dark', timezone: 'UTC', notifications: {email: true, push: false}}
};

const mockDbSingleton = {
  collection: (collectionPath: string) => ({
    doc: (documentPath?: string) => {
      const fullPath = documentPath ? `${collectionPath}/${documentPath}` : `${collectionPath}/${`mock-doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}`; // Auto-ID if no path
      return {
        get: async () => {
          console.log(`[MockFirestore] GET doc: ${fullPath}`);
          const data = mockFirestoreStore[fullPath];
          // Simulate Firestore Timestamp objects for date fields
          const processedData = data ? JSON.parse(JSON.stringify(data), (key, value) => {
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
              // This is a basic check for ISO string, real Firebase Timestamps have toDate()
              return { toDate: () => new Date(value) }; // Simulate Timestamp object
            }
            return value;
          }) : undefined;
          return Promise.resolve({
            exists: () => !!processedData, // Make exists a function
            data: () => processedData,
            id: fullPath.split('/').pop(),
          });
        },
        set: async (data: any, options?: { merge?: boolean }) => {
          console.log(`[MockFirestore] SET doc: ${fullPath} with data:`, data, "options:", options);
          const dataToStore = JSON.parse(JSON.stringify(data)); // Deep clone and handle serverTimestamp
          Object.keys(dataToStore).forEach(key => {
            if (dataToStore[key] && dataToStore[key]._seconds !== undefined && dataToStore[key]._nanoseconds !== undefined) { // Heuristic for mock serverTimestamp
                dataToStore[key] = new Date().toISOString(); // Convert mock serverTimestamp to ISO string for storage
            }
          });

          if (options?.merge) {
            mockFirestoreStore[fullPath] = { ...(mockFirestoreStore[fullPath] || {}), ...dataToStore };
          } else {
            mockFirestoreStore[fullPath] = dataToStore;
          }
          console.log(`[MockFirestore] Store for ${fullPath}:`, mockFirestoreStore[fullPath]);
          return Promise.resolve();
        },
        update: async (data: any) => {
         console.log(`[MockFirestore] UPDATE doc: ${fullPath} with data:`, data);
          if (!mockFirestoreStore[fullPath]) {
            // Firestore's update fails if the document doesn't exist
            throw new Error(`MockFirestore: No document to update at ${fullPath}`);
          }
          const dataToUpdate = JSON.parse(JSON.stringify(data));
           Object.keys(dataToUpdate).forEach(key => {
            if (dataToUpdate[key] && dataToUpdate[key]._seconds !== undefined && dataToUpdate[key]._nanoseconds !== undefined) {
                dataToUpdate[key] = new Date().toISOString();
            }
          });
          mockFirestoreStore[fullPath] = { ...mockFirestoreStore[fullPath], ...dataToUpdate };
          console.log(`[MockFirestore] Store for ${fullPath} after update:`, mockFirestoreStore[fullPath]);
          return Promise.resolve();
        },
        delete: async () => {
          console.log(`[MockFirestore] DELETE doc: ${fullPath}`);
          delete mockFirestoreStore[fullPath];
          return Promise.resolve();
        },
        onSnapshot: (observer: {
          next?: (snapshot: any) => void;
          error?: (error: Error) => void;
          complete?: () => void;
        }) => {
          console.log(`[MockFirestore] onSnapshot for: ${fullPath}`);
          const data = mockFirestoreStore[fullPath];
           const processedData = data ? JSON.parse(JSON.stringify(data), (key, value) => {
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
              return { toDate: () => new Date(value) };
            }
            return value;
          }) : undefined;
          const mockSnapshot = {
            exists: () => !!processedData,
            data: () => processedData,
            id: fullPath.split('/').pop(),
          };
          if (observer.next) {
            // Simulate async nature
            setTimeout(() => observer.next!(mockSnapshot), 0);
          }
          return () => { console.log(`[MockFirestore] Unsubscribed from onSnapshot for: ${fullPath}`); };
        }
      };
    },
    add: async (data: any) => {
      const newId = `mock-doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const fullPath = `${collectionPath}/${newId}`;
      console.log(`[MockFirestore] ADD to collection: ${collectionPath}, new ID: ${newId}, data:`, data);
      const dataToStore = JSON.parse(JSON.stringify(data));
      Object.keys(dataToStore).forEach(key => {
        if (dataToStore[key] && dataToStore[key]._seconds !== undefined && dataToStore[key]._nanoseconds !== undefined) {
            dataToStore[key] = new Date().toISOString();
        }
      });
      mockFirestoreStore[fullPath] = dataToStore;
      return Promise.resolve({ id: newId, path: fullPath });
    },
    where: (fieldPath: string, opStr: string, value: any) => {
        console.warn(`[MockFirestore] 'where' query on '${collectionPath}' for '${fieldPath} ${opStr} ${value}'. Mock implementation is basic.`);
        return {
            onSnapshot: (observer: any) => {
                const results = Object.entries(mockFirestoreStore)
                    .filter(([key, docData]) => {
                        if (!key.startsWith(collectionPath + '/')) return false;
                        // Basic equality check for demo. Real 'where' is complex.
                        return docData[fieldPath] === value;
                    })
                    .map(([key, docData]) => ({ id: key.split('/').pop(), data: () => docData, exists: () => true }));
                if(observer.next) setTimeout(() => observer.next({ docs: results, empty: results.length === 0, size: results.length }), 0);
                return () => {};
            },
            get: async () => {
                 const results = Object.entries(mockFirestoreStore)
                    .filter(([key, docData]) => {
                        if (!key.startsWith(collectionPath + '/')) return false;
                        return docData[fieldPath] === value;
                    })
                    .map(([key, docData]) => ({ id: key.split('/').pop(), data: () => docData, exists: () => true }));
                 return Promise.resolve({ docs: results, empty: results.length === 0, size: results.length });
            }
        }
    },
    get: async () => { // Mock get() on a collection reference
        console.log(`[MockFirestore] GET collection: ${collectionPath}`);
        const results = Object.entries(mockFirestoreStore)
            .filter(([key]) => key.startsWith(collectionPath + '/'))
            .map(([key, docData]) => {
                const processedData = JSON.parse(JSON.stringify(docData), (_k, val) => {
                    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(val)) {
                        return { toDate: () => new Date(val) };
                    }
                    return val;
                });
                return { id: key.split('/').pop(), data: () => processedData, exists: () => true };
            });
        return Promise.resolve({ docs: results, empty: results.length === 0, size: results.length });
    }
  }),
  // Mock serverTimestamp
  serverTimestamp: () => ({
    // This is a sentinel value that the mock set/update/add functions can look for.
    // Real Firebase Timestamps are more complex.
    _seconds: Math.floor(Date.now() / 1000),
    _nanoseconds: (Date.now() % 1000) * 1000000,
    toDate: () => new Date(), // For immediate use if needed, though usually processed by write operations
  }),
  Timestamp: { // Mock Timestamp class
    fromDate: (date: Date) => ({
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: (date.getTime() % 1000) * 1000000,
        toDate: () => date,
    }),
    now: () => {
        const now = new Date();
        return {
            seconds: Math.floor(now.getTime() / 1000),
            nanoseconds: (now.getTime() % 1000) * 1000000,
            toDate: () => now,
        };
    }
  }
};

// Mock Storage (very basic)
const mockStorageStore: Record<string, { blob: Blob, metadata: any, downloadURL: string }> = {};
const mockStorageSingleton = {
  ref: (path?: string) => ({
    put: async (data: Blob | Uint8Array | ArrayBuffer, metadata?: any) => {
      const storagePath = path || `mock-file-${Date.now()}`;
      const blob = data instanceof Blob ? data : new Blob([data]);
      const downloadURL = URL.createObjectURL(blob); // Temporary URL for client-side access
      mockStorageStore[storagePath] = { blob, metadata, downloadURL };
      console.log(`[MockStorage] File uploaded to ${storagePath}`, metadata);
      return Promise.resolve({
        ref: mockStorageSingleton.ref(storagePath),
        metadata: metadata || { name: storagePath.split('/').pop() },
        totalBytes: blob.size,
        // ... other snapshot properties
      });
    },
    getDownloadURL: async () => {
      const storagePath = path || "";
      if (mockStorageStore[storagePath]) {
        console.log(`[MockStorage] Get download URL for ${storagePath}`);
        return Promise.resolve(mockStorageStore[storagePath].downloadURL);
      }
      throw new Error(`MockStorage: File not found at ${storagePath}`);
    },
    delete: async () => {
        const storagePath = path || "";
        if (mockStorageStore[storagePath]) {
            URL.revokeObjectURL(mockStorageStore[storagePath].downloadURL); // Clean up blob URL
            delete mockStorageStore[storagePath];
            console.log(`[MockStorage] File deleted from ${storagePath}`);
            return Promise.resolve();
        }
        console.warn(`[MockStorage] Attempted to delete non-existent file at ${storagePath}`);
        return Promise.resolve();
    },
    toString: () => `gs://mock-bucket/${path}` // Mimic gs:// URL
  }),
};


// --- Conditional Export Logic ---
const USE_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true';

let app: FirebaseApp;
let auth: Auth | typeof mockAuthSingleton;
let db: Firestore | typeof mockDbSingleton;
let storage: any; // Using 'any' for storage mock due to its complexity if not fully mocked
let Timestamp: typeof FirestoreTimestamp | typeof mockDbSingleton.Timestamp;
let serverTimestamp: typeof firestoreServerTimestamp | typeof mockDbSingleton.serverTimestamp;

if (USE_MOCK_MODE) {
  console.log("WakeSync is using MOCK Firebase services.");
  app = { name: "[mock Firebase app]" } as FirebaseApp; // Mock app object
  auth = mockAuthSingleton;
  db = mockDbSingleton;
  storage = mockStorageSingleton; // Provide the mock storage
  Timestamp = mockDbSingleton.Timestamp as typeof mockDbSingleton.Timestamp;
  serverTimestamp = mockDbSingleton.serverTimestamp as typeof mockDbSingleton.serverTimestamp;

} else {
  console.log("WakeSync is using REAL Firebase services.");
  if (!getApps().length) {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR_")) {
        console.error("CRITICAL: Firebase API Key is not configured. Real Firebase will not work. Check your .env file.");
        // Fallback to mock if real config is invalid to prevent app crash, but log prominently
        auth = mockAuthSingleton;
        db = mockDbSingleton;
        storage = mockStorageSingleton;
        Timestamp = mockDbSingleton.Timestamp as typeof mockDbSingleton.Timestamp;
        serverTimestamp = mockDbSingleton.serverTimestamp as typeof mockDbSingleton.serverTimestamp;
        app = { name: "[mock Firebase app - FALLBACK]" } as FirebaseApp;
        alert("Firebase is not configured correctly. The app is running in a limited mock mode. Please check browser console and .env file.");
    } else {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        // storage = getStorage(app); // Uncomment if you use Firebase Storage
        storage = { name: "[Real Firebase Storage - Not Fully Implemented Yet if Unused]" }; // Placeholder if not used
        Timestamp = FirestoreTimestamp;
        serverTimestamp = firestoreServerTimestamp;
    }
  } else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    // storage = getStorage(app); // Uncomment if you use Firebase Storage
    storage = { name: "[Real Firebase Storage - Not Fully Implemented Yet if Unused]" }; // Placeholder if not used
    Timestamp = FirestoreTimestamp;
    serverTimestamp = firestoreServerTimestamp;
  }
}

// Export a consistent User type
type User = FirebaseUserType | MockUser;


// For reauthentication:
const getEmailProviderCredential = USE_MOCK_MODE 
    ? mockAuthSingleton.EmailAuthProvider.credential 
    : EmailAuthProvider.credential;


export { 
    app, 
    auth, 
    db, 
    storage, 
    type User, 
    Timestamp, 
    serverTimestamp,
    // Export specific auth methods if needed directly, or prefer using them via the 'auth' object
    firebaseSignInWithEmailAndPassword,
    firebaseCreateUserWithEmailAndPassword,
    firebaseOnAuthStateChanged,
    firebaseSignOut,
    firebaseSendPasswordResetEmail,
    firebaseUpdateProfile,
    firebaseUpdatePassword,
    firebaseReauthenticateWithCredential,
    getEmailProviderCredential, // Export the correct credential function
    // Export specific firestore methods (not usually needed as `db` object is used)
    firestoreCollection,
    firestoreDoc,
    firestoreGetDoc,
    firestoreSetDoc,
    firestoreUpdateDoc,
    firestoreDeleteDoc,
    firestoreAddDoc,
    firestoreOnSnapshot,
    firestoreQuery,
    firestoreWhere,
    firestoreGetDocs
};

// Log warnings if placeholder values are used for any Firebase config keys (kept for reference).
if (!USE_MOCK_MODE) {
    const placeholderWarning = (key: string, value?: string) => {
        if (!value || value.includes("YOUR_") || value.includes("PLACEHOLDER") || value.length < 10) {
            console.warn(
                `Firebase config is using a placeholder or potentially invalid value for ${key}. ` +
                "Ensure .env file has your Firebase project credentials for REAL mode to work correctly."
            );
            return true;
        }
        return false;
    }
    placeholderWarning("NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    placeholderWarning("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
    placeholderWarning("NEXT_PUBLIC_FIREBASE_PROJECT_ID", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.includes("YOUR_") || process.env.GOOGLE_API_KEY.includes("PLACEHOLDER")) {
        console.warn(
        "Genkit might be using a placeholder value for GOOGLE_API_KEY in .env. " +
        "If Genkit relies on Firebase Admin or specific Google Cloud services tied to this project, " +
        "ensure GOOGLE_API_KEY is correctly set for REAL mode."
        );
    }
} else {
    // In mock mode, explicitly set some demo users if the store is empty (e.g. after a code change and hot reload)
    if (!mockUserStore["another@example.com"]) {
        mockUserStore["another@example.com"] = {
            password: "password",
            profile: {
                uid: "mock-uid-another",
                email: "another@example.com",
                displayName: "Another User",
                photoURL: null,
                emailVerified: true,
                getIdToken: async () => "mock-id-token-another",
            }
        }
    }
}
