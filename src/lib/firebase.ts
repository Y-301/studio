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
import { 
    getStorage, 
    ref as storageRef, 
    uploadBytes as firebaseUploadBytes, 
    getDownloadURL as firebaseGetDownloadURL,
    deleteObject as firebaseDeleteObject,
    type FirebaseStorage
} from "firebase/storage";

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
  emailVerified: boolean;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  delete?: () => Promise<void>; // Added for account deletion
}

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
      delete: async () => { 
        console.log("[MockAuth] Deleting user: demo@example.com");
        delete mockUserStore["demo@example.com"];
        if (mockCurrentUserInternal?.email === "demo@example.com") {
          mockCurrentUserInternal = null;
        }
        notifyMockAuthStateChanged();
      }
    },
  },
};

let mockCurrentUserInternal: MockUser | null = null;
const mockAuthStateListeners: Array<(user: MockUser | null) => void> = [];

const notifyMockAuthStateChanged = () => {
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
    Promise.resolve().then(() => callback(mockCurrentUserInternal));
    return () => {
      const index = mockAuthStateListeners.indexOf(callback);
      if (index > -1) mockAuthStateListeners.splice(index, 1);
    };
  },
  signInWithEmailAndPassword: async (_authInstanceIgnored: any, email: string, pass: string): Promise<{ user: MockUser }> => {
    const storedUserEntry = mockUserStore[email];
    if (storedUserEntry && storedUserEntry.password === pass) {
      mockCurrentUserInternal = storedUserEntry.profile;
      notifyMockAuthStateChanged();
      return { user: mockCurrentUserInternal };
    }
    throw Object.assign(new Error("Mock Auth: Invalid credentials."), { code: "auth/invalid-credential" });
  },
  createUserWithEmailAndPassword: async (_authInstanceIgnored: any, email: string, pass: string): Promise<{ user: MockUser }> => {
    if (mockUserStore[email]) {
      throw Object.assign(new Error("Mock Auth: Email already in use."), { code: "auth/email-already-in-use" });
    }
    const uid = `mock-uid-${Date.now()}`;
    const newUser: MockUser = {
      uid, email, displayName: null, photoURL: null, emailVerified: false,
      getIdToken: async () => `mock-id-token-${uid}`,
      delete: async () => { 
        console.log(`[MockAuth] Deleting user: ${email}`);
        delete mockUserStore[email];
        if (mockCurrentUserInternal?.email === email) {
          mockCurrentUserInternal = null;
        }
        notifyMockAuthStateChanged();
      }
    };
    mockUserStore[email] = { password: pass, profile: newUser };
    mockCurrentUserInternal = newUser;
    notifyMockAuthStateChanged();
    return { user: mockCurrentUserInternal };
  },
  sendPasswordResetEmail: async (_authInstanceIgnored: any, email: string): Promise<void> => {
    console.log(`[MockAuth] Password reset email would be sent to ${email}.`);
    return Promise.resolve();
  },
  signOut: async (_authInstanceIgnored: any): Promise<void> => {
    mockCurrentUserInternal = null;
    notifyMockAuthStateChanged();
    return Promise.resolve();
  },
  updateProfile: async (user: MockUser, profileUpdates: { displayName?: string | null; photoURL?: string | null }): Promise<void> => {
    if (!mockCurrentUserInternal || mockCurrentUserInternal.uid !== user.uid || !user.email) {
      throw Object.assign(new Error("Mock Auth: User not found or mismatch."), { code: "auth/user-mismatch" });
    }
    const userInStore = mockUserStore[user.email];
    if (userInStore) {
      if (profileUpdates.displayName !== undefined) userInStore.profile.displayName = profileUpdates.displayName;
      if (profileUpdates.photoURL !== undefined) userInStore.profile.photoURL = profileUpdates.photoURL;
      if (mockCurrentUserInternal.uid === userInStore.profile.uid) { // Update current user if it's the one being modified
        mockCurrentUserInternal = { ...mockCurrentUserInternal, ...profileUpdates };
      }
      notifyMockAuthStateChanged();
    }
    return Promise.resolve();
  },
  reauthenticateWithCredential: async (user: MockUser, credential: any): Promise<{user: MockUser}> => {
    if (!mockCurrentUserInternal || mockCurrentUserInternal.uid !== user.uid || !user.email) {
      throw Object.assign(new Error("Mock Auth: User mismatch for reauth."), { code: "auth/user-mismatch" });
    }
    const storedUserEntry = mockUserStore[user.email];
    if (storedUserEntry && credential?.type === "password" && credential.password === storedUserEntry.password) {
      return Promise.resolve({ user: mockCurrentUserInternal });
    }
    throw Object.assign(new Error("Mock Auth: Incorrect password for reauth."), { code: "auth/wrong-password" });
  },
  updatePassword: async (user: MockUser, newPassword?: string | null): Promise<void> => {
    if (!mockCurrentUserInternal || mockCurrentUserInternal.uid !== user.uid || !user.email) {
      throw Object.assign(new Error("Mock Auth: User not found or mismatch for password update."), { code: "auth/user-mismatch" });
    }
    if (!newPassword || newPassword.length < 6) {
      throw Object.assign(new Error("Mock Auth: Password should be at least 6 characters."), { code: "auth/weak-password" });
    }
    const userInStore = mockUserStore[user.email];
    if (userInStore) userInStore.password = newPassword;
    return Promise.resolve();
  },
  EmailAuthProvider: {
    credential: (email: string, pass: string) => ({ type: "password", providerId: "password", email, password: pass, signInMethod: "password" })
  }
};

const mockFirestoreStore: Record<string, any> = {};
const mockDbSingleton = {
  collection: (collectionPath: string) => ({
    doc: (documentPath?: string) => {
      const fullPath = documentPath ? `${collectionPath}/${documentPath}` : `${collectionPath}/mock-doc-${Date.now()}`;
      return {
        get: async () => {
          const data = mockFirestoreStore[fullPath];
          const processedData = data ? JSON.parse(JSON.stringify(data), (key, value) => 
            (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) ? { toDate: () => new Date(value) } : value
          ) : undefined;
          return Promise.resolve({ exists: () => !!processedData, data: () => processedData, id: fullPath.split('/').pop() });
        },
        set: async (data: any, options?: { merge?: boolean }) => {
          const dataToStore = JSON.parse(JSON.stringify(data));
          Object.keys(dataToStore).forEach(key => {
            if (dataToStore[key]?._seconds !== undefined) dataToStore[key] = new Date().toISOString();
          });
          mockFirestoreStore[fullPath] = options?.merge ? { ...(mockFirestoreStore[fullPath] || {}), ...dataToStore } : dataToStore;
          return Promise.resolve();
        },
        update: async (data: any) => {
          if (!mockFirestoreStore[fullPath]) throw new Error(`MockFirestore: No doc at ${fullPath}`);
          const dataToUpdate = JSON.parse(JSON.stringify(data));
          Object.keys(dataToUpdate).forEach(key => {
            if (dataToUpdate[key]?._seconds !== undefined) dataToUpdate[key] = new Date().toISOString();
          });
          mockFirestoreStore[fullPath] = { ...mockFirestoreStore[fullPath], ...dataToUpdate };
          return Promise.resolve();
        },
        delete: async () => { delete mockFirestoreStore[fullPath]; return Promise.resolve(); },
        onSnapshot: (observer: { next?: (snapshot: any) => void; error?: (error: Error) => void; }) => {
          const data = mockFirestoreStore[fullPath];
          const processedData = data ? JSON.parse(JSON.stringify(data), (key, value) => 
            (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) ? { toDate: () => new Date(value) } : value
          ) : undefined;
          const mockSnapshot = { exists: () => !!processedData, data: () => processedData, id: fullPath.split('/').pop() };
          if (observer.next) setTimeout(() => observer.next!(mockSnapshot), 0);
          return () => {};
        }
      };
    },
    add: async (data: any) => {
      const newId = `mock-doc-${Date.now()}`;
      const fullPath = `${collectionPath}/${newId}`;
      const dataToStore = JSON.parse(JSON.stringify(data));
      Object.keys(dataToStore).forEach(key => {
        if (dataToStore[key]?._seconds !== undefined) dataToStore[key] = new Date().toISOString();
      });
      mockFirestoreStore[fullPath] = dataToStore;
      return Promise.resolve({ id: newId, path: fullPath });
    },
    where: (fieldPath: string, opStr: string, value: any) => ({
      onSnapshot: (observer: any) => {
        const results = Object.entries(mockFirestoreStore)
          .filter(([key, docData]) => key.startsWith(collectionPath + '/') && docData[fieldPath] === value)
          .map(([key, docData]) => ({ id: key.split('/').pop(), data: () => docData, exists: () => true }));
        if(observer.next) setTimeout(() => observer.next({ docs: results, empty: results.length === 0, size: results.length }), 0);
        return () => {};
      },
      get: async () => {
        const results = Object.entries(mockFirestoreStore)
          .filter(([key, docData]) => key.startsWith(collectionPath + '/') && docData[fieldPath] === value)
          .map(([key, docData]) => ({ id: key.split('/').pop(), data: () => docData, exists: () => true }));
        return Promise.resolve({ docs: results, empty: results.length === 0, size: results.length });
      }
    }),
    get: async () => {
      const results = Object.entries(mockFirestoreStore)
        .filter(([key]) => key.startsWith(collectionPath + '/'))
        .map(([key, docData]) => {
          const processedData = JSON.parse(JSON.stringify(docData), (_k, val) => 
            (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(val)) ? { toDate: () => new Date(val) } : val
          );
          return { id: key.split('/').pop(), data: () => processedData, exists: () => true };
        });
      return Promise.resolve({ docs: results, empty: results.length === 0, size: results.length });
    }
  }),
  serverTimestamp: () => ({ _seconds: Math.floor(Date.now() / 1000), _nanoseconds: (Date.now() % 1000) * 1000000, toDate: () => new Date() }),
  Timestamp: {
    fromDate: (date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: (date.getTime() % 1000) * 1000000, toDate: () => date }),
    now: () => { const now = new Date(); return { seconds: Math.floor(now.getTime() / 1000), nanoseconds: (now.getTime() % 1000) * 1000000, toDate: () => now }; }
  }
};

const mockStorageStore: Record<string, { blob: Blob, metadata: any, downloadURL: string }> = {};
const mockStorageSingleton = {
  ref: (path?: string) => ({
    put: async (data: Blob | Uint8Array | ArrayBuffer, metadata?: any) => {
      const storagePath = path || `mock-file-${Date.now()}`;
      const blob = data instanceof Blob ? data : new Blob([data]);
      const downloadURL = URL.createObjectURL(blob);
      mockStorageStore[storagePath] = { blob, metadata, downloadURL };
      return Promise.resolve({ ref: mockStorageSingleton.ref(storagePath), metadata: metadata || { name: storagePath.split('/').pop() }, totalBytes: blob.size });
    },
    getDownloadURL: async () => {
      const storagePath = path || "";
      if (mockStorageStore[storagePath]) return Promise.resolve(mockStorageStore[storagePath].downloadURL);
      throw new Error(`MockStorage: File not found at ${storagePath}`);
    },
    delete: async () => {
      const storagePath = path || "";
      if (mockStorageStore[storagePath]) {
        URL.revokeObjectURL(mockStorageStore[storagePath].downloadURL);
        delete mockStorageStore[storagePath];
      }
      return Promise.resolve();
    },
    toString: () => `gs://mock-bucket/${path}`
  }),
};

// --- Conditional Export Logic ---
const explicitMockModeEnv = process.env.NEXT_PUBLIC_USE_MOCK_MODE;
let autoDetectedMockMode: boolean;

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const isApiKeyPlaceholder = (key?: string) => !key || key.includes("YOUR_") || key.includes("PLACEHOLDER") || key.includes("MOCK_") || key.length < 10;

if (isApiKeyPlaceholder(firebaseApiKey)) {
  autoDetectedMockMode = true;  // API key is missing or a placeholder, assume mock mode
} else {
  autoDetectedMockMode = false; // Valid API key found, assume real mode
}

const USE_MOCK_MODE =
  explicitMockModeEnv === 'true' ? true :
  explicitMockModeEnv === 'false' ? false :
  autoDetectedMockMode;

if (USE_MOCK_MODE) {
  if (explicitMockModeEnv === 'true') {
    console.info("WakeSync: Using MOCK Firebase services (explicitly set by NEXT_PUBLIC_USE_MOCK_MODE=true).");
  } else {
    console.info("WakeSync: Using MOCK Firebase services (auto-detected due to missing/placeholder Firebase API Key). For REAL Firebase, provide valid credentials in .env and ensure NEXT_PUBLIC_USE_MOCK_MODE is not 'true'.");
  }
} else {
   if (explicitMockModeEnv === 'false') {
     console.info("WakeSync: Using REAL Firebase services (explicitly set by NEXT_PUBLIC_USE_MOCK_MODE=false).");
   } else {
     console.info("WakeSync: Using REAL Firebase services (auto-detected based on valid Firebase API Key). To force MOCK mode, set NEXT_PUBLIC_USE_MOCK_MODE=true in .env.");
   }
}


let app: FirebaseApp;
let auth: Auth | typeof mockAuthSingleton;
let db: Firestore | typeof mockDbSingleton;
let storage: FirebaseStorage | typeof mockStorageSingleton;
let Timestamp: typeof FirestoreTimestamp | typeof mockDbSingleton.Timestamp;
let serverTimestamp: typeof firestoreServerTimestamp | typeof mockDbSingleton.serverTimestamp;

if (USE_MOCK_MODE) {
  app = { name: "[mock Firebase app]" } as FirebaseApp;
  auth = mockAuthSingleton;
  db = mockDbSingleton;
  storage = mockStorageSingleton;
  Timestamp = mockDbSingleton.Timestamp as typeof mockDbSingleton.Timestamp;
  serverTimestamp = mockDbSingleton.serverTimestamp as typeof mockDbSingleton.serverTimestamp;
} else {
  if (!getApps().length) {
    if (isApiKeyPlaceholder(firebaseConfig.apiKey)) {
      console.error("CRITICAL: Firebase API Key is not configured correctly for REAL mode. Defaulting to MOCK services to prevent app crash. Check your .env file.");
      auth = mockAuthSingleton;
      db = mockDbSingleton;
      storage = mockStorageSingleton;
      Timestamp = mockDbSingleton.Timestamp as typeof mockDbSingleton.Timestamp;
      serverTimestamp = mockDbSingleton.serverTimestamp as typeof mockDbSingleton.serverTimestamp;
      app = { name: "[mock Firebase app - FALLBACK]" } as FirebaseApp;
      if (typeof window !== 'undefined') { 
        alert("WakeSync Firebase is not configured correctly for REAL mode. The app is running with MOCK services. Please check browser console and .env file for API key issues.");
      }
    } else {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      Timestamp = FirestoreTimestamp;
      serverTimestamp = firestoreServerTimestamp;
    }
  } else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    Timestamp = FirestoreTimestamp;
    serverTimestamp = firestoreServerTimestamp;
  }
}

type User = FirebaseUserType | MockUser;

const getEmailProviderCredential = USE_MOCK_MODE 
    ? mockAuthSingleton.EmailAuthProvider.credential 
    : EmailAuthProvider.credential;

// Real Firebase Storage specific exports if not in mock mode
const uploadBytes = USE_MOCK_MODE ? mockStorageSingleton.ref('').put : firebaseUploadBytes; // put on mock ref is uploadBytes equivalent
const getDownloadURL = USE_MOCK_MODE ? mockStorageSingleton.ref('').getDownloadURL : firebaseGetDownloadURL; // getDownloadURL on mock ref
const deleteObject = USE_MOCK_MODE ? mockStorageSingleton.ref('').delete : firebaseDeleteObject; // delete on mock ref

export { 
  app, auth, db, storage, type User, Timestamp, serverTimestamp,
  firebaseSignInWithEmailAndPassword, firebaseCreateUserWithEmailAndPassword,
  firebaseOnAuthStateChanged, firebaseSignOut, firebaseSendPasswordResetEmail,
  firebaseUpdateProfile, firebaseUpdatePassword, firebaseReauthenticateWithCredential,
  getEmailProviderCredential,
  firestoreCollection, firestoreDoc, firestoreGetDoc, firestoreSetDoc,
  firestoreUpdateDoc, firestoreDeleteDoc, firestoreAddDoc,
  firestoreOnSnapshot, firestoreQuery, firestoreWhere, firestoreGetDocs,
  // Storage exports
  storageRef, // This is the same for both, points to the correct 'ref' function
  uploadBytes,
  getDownloadURL,
  deleteObject
};

if (!USE_MOCK_MODE) {
    const placeholderWarning = (key: string, value?: string) => {
        if (isApiKeyPlaceholder(value)) {
            console.warn(`WakeSync: Firebase config might be using a placeholder or invalid value for ${key}. Ensure .env file has valid Firebase project credentials for REAL mode.`);
            return true;
        }
        return false;
    }
    placeholderWarning("NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    placeholderWarning("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
    placeholderWarning("NEXT_PUBLIC_FIREBASE_PROJECT_ID", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

    if (isApiKeyPlaceholder(process.env.GOOGLE_API_KEY)) {
        console.warn("WakeSync: Genkit GOOGLE_API_KEY in .env might be a placeholder. AI features may not work in REAL mode without a valid key.");
    }
} else { // Populate mock store with more users if needed for testing
    if (!mockUserStore["another@example.com"]) {
        mockUserStore["another@example.com"] = {
            password: "password",
            profile: {
                uid: "mock-uid-another", email: "another@example.com", displayName: "Another User", photoURL: null, emailVerified: true,
                getIdToken: async () => "mock-id-token-another",
                delete: async () => { 
                  delete mockUserStore["another@example.com"]; 
                  if (mockCurrentUserInternal?.email === "another@example.com") mockCurrentUserInternal = null;
                  notifyMockAuthStateChanged();
                }
            }
        }
    }
    // Example: Auto-login demo user for easier development in mock mode
    // if (!mockCurrentUserInternal && mockUserStore["demo@example.com"]) {
    //     mockCurrentUserInternal = mockUserStore["demo@example.com"].profile;
    //     console.info("[MockAuth] Auto-logged in demo@example.com for convenience.");
    //     // notifyMockAuthStateChanged(); // This might be too early, let onAuthStateChanged handle initial call
    // }
}
