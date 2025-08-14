// --- Firebase Initialization & Configuration ---
// This module centralizes all Firebase setup and exports for the app.
// It supports both static config (local dev) and dynamic config (prod/cloud environments).

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Dynamic Configuration Support ---
// Allows config to be injected at runtime via global variable (e.g., __firebase_config),
// otherwise falls back to hardcoded defaults for local development.
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

// --- Dynamic App ID Support ---
// Allows appId to be injected at runtime (for multi-tenancy) or defaults for single-tenant app.
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Initialize Firebase Services ---
// Centralizes creation of Firebase app, Firestore DB, and Auth.
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- Export App (optional, for advanced usage) ---
export { app };
