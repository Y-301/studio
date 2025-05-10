
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore, type Firestore } from "firebase/firestore"; // Example if you use Firestore
// import { getStorage, type FirebaseStorage } from "firebase/storage"; // Example if you use Storage

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_FIREBASE_PROJECT_ID_PLACEHOLDER",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_FIREBASE_APP_ID_PLACEHOLDER",
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

// Log a warning if placeholder values are used, as Firebase will not work correctly.
if (firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY_PLACEHOLDER") {
  console.warn(
    "Firebase is using placeholder API keys. " +
    "Please set up your .env file with your Firebase project credentials for the app to function correctly. " +
    "Refer to .env.example or your project's Firebase console."
  );
}
