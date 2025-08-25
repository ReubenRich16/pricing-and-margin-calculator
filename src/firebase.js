// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const getCollectionRef = (collectionName) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  return collection(db, 'artifacts', uid, collectionName);
};

export const getWorksheetsCollection   = () => getCollectionRef('worksheets');
export const getMaterialsCollection    = () => getCollectionRef('materials');
export const getLabourRatesCollection  = () => getCollectionRef('labourRates');
export const getCustomersCollection    = () => getCollectionRef('customers');

// NEW: Function to delete all documents in a collection
export const deleteEntireCollection = async (collectionName) => {
    const collectionRef = getCollectionRef(collectionName);
    if (!collectionRef) {
        console.error("User not authenticated, cannot delete collection.");
        return;
    }
    try {
        const querySnapshot = await getDocs(collectionRef);
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnapshot) => {
            batch.delete(doc(collectionRef, docSnapshot.id));
        });
        await batch.commit();
        console.log(`Successfully deleted all documents from ${collectionName}.`);
    } catch (error) {
        console.error(`Error deleting collection ${collectionName}:`, error);
        // Optionally, re-throw the error to be handled by the UI
        throw error;
    }
};

export { app };