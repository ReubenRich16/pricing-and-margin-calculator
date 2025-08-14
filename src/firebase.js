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
      apiKey: "AIzaSyAiAQfKywpTslewwSliAYHyxSV3LPVjgoQ",
      authDomain: "pricing-and-margin-calculator.firebaseapp.com",
      projectId: "pricing-and-margin-calculator",
      storageBucket: "pricing-and-margin-calculator.firebasestorage.app",
      messagingSenderId: "298417414795",
      appId: "1:298417414795:web:b82bc178c078c4bd9a6a8e",
      measurementId: "G-CYKYR2KNHE"
    });

const firebaseConfig = JSON.parse(firebaseConfigString);

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- Export customers collection ref for re-use ---
export const customersCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');

// --- Export App (optional, for advanced usage) ---
export { app };
