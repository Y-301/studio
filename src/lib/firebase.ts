import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore, type Firestore } from "firebase/firestore"; // Example if you use Firestore
// import { getStorage, type FirebaseStorage } from "firebase/storage"; // Example if you use Storage

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
// const db: Firestore = getFirestore(app); // Example
// const storage: FirebaseStorage = getStorage(app); // Example

export { app, auth /*, db, storage */ };

// Log warnings if placeholder values are used for any Firebase config keys.
const placeholderWarning = (key: string) =>
  `Firebase is using a placeholder value for ${key}. ` +
  "Please set up your .env file with your Firebase project credentials for the app to function correctly. " +
  "Refer to .env or your project's Firebase console.";

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY_PLACEHOLDER") {
  console.warn(placeholderWarning("NEXT_PUBLIC_FIREBASE_API_KEY"));
}
if (!firebaseConfig.authDomain || firebaseConfig.authDomain === "YOUR_FIREBASE_AUTH_DOMAIN_PLACEHOLDER") {
  console.warn(placeholderWarning("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"));
}
if (!firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_FIREBASE_PROJECT_ID_PLACEHOLDER") {
  console.warn(placeholderWarning("NEXT_PUBLIC_FIREBASE_PROJECT_ID"));
}
// Add similar checks for other critical Firebase config values if needed.
// storageBucket, messagingSenderId, and appId are often less critical for auth-only setups
// but good to be aware of.

// Check for Genkit API key placeholder if GOOGLE_API_KEY is used by genkit.ts
if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === "YOUR_GOOGLE_API_KEY_PLACEHOLDER") {
    console.warn(
    "Genkit is using a placeholder value for GOOGLE_API_KEY in .env. " +
    "GenAI features may not work correctly. Please set your GOOGLE_API_KEY."
    );
}
