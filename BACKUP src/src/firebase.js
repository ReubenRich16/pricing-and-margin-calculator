// --- Firebase Initialization & Configuration ---
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.error("Firebase configuration is missing or incomplete. Please check your .env.local file.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Per-user collections: artifacts/{uid}/{collectionName}
const getCollectionRef = (collectionName) => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return null; // Called before auth state resolved; caller should handle null.
  }
  return collection(db, 'artifacts', uid, collectionName);
};

export const getWorksheetsCollection   = () => getCollectionRef('worksheets');
export const getMaterialsCollection    = () => getCollectionRef('materials');
export const getLabourRatesCollection  = () => getCollectionRef('labourRates');
export const getCustomersCollection    = () => getCollectionRef('customers');

export { app };