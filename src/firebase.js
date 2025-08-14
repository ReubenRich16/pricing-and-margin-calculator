// --- Firebase Initialization & Configuration ---
// This module centralizes all Firebase setup and exports for the app.
// It supports both static config (local dev) and dynamic config (prod/cloud environments).

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore";

// --- Dynamic Configuration Support ---
const firebaseConfigString = typeof __firebase_config !== 'undefined'
  ? __firebase_config
  : JSON.stringify({
      apiKey: "AIzaSyCU4oA__sV1wCjGdRy_pVYGhq1Hc_BYM3M",
      authDomain: "reuben-s-testt.firebaseapp.com",
      projectId: "reuben-s-testt",
      storageBucket: "reuben-s-testt.firebasestorage.app",
      messagingSenderId: "888500392763",
      appId: "1:888500392763:web:68ce9aa69f96458424dd1e"
      // (measurementId is optional for most apps)
    });

const firebaseConfig = JSON.parse(firebaseConfigString);

// --- Use your new appId (projectId is fine) ---
export const appId = "reuben-s-testt";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- Export customers collection ref for re-use ---
export const customersCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');

// --- Export App (optional, for advanced usage) ---
export { app };
