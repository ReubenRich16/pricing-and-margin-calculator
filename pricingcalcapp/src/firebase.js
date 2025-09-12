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
export const getJobsCollection         = () => getCollectionRef('jobs');
export const getDriversCollection      = () => getCollectionRef('drivers');


// --- Improved batch deletion for collections > 500 docs ---
export const deleteEntireCollection = async (collectionName) => {
    const collectionRef = getCollectionRef(collectionName);
    if (!collectionRef) {
        console.error("User not authenticated, cannot delete collection.");
        return;
    }
    let totalDeleted = 0;
    try {
        while (true) {
            const querySnapshot = await getDocs(collectionRef);
            if (querySnapshot.empty) break;
            const batch = writeBatch(db);
            let ops = 0;
            querySnapshot.forEach((docSnapshot) => {
                if (ops < 500) {
                    batch.delete(doc(collectionRef, docSnapshot.id));
                    ops++;
                }
            });
            if (ops === 0) break;
            await batch.commit();
            totalDeleted += ops;
            if (ops < 500) break; // No more docs to delete
        }
        console.log(`Successfully deleted ${totalDeleted} documents from ${collectionName}.`);
    } catch (error) {
        console.error(`Error deleting collection ${collectionName}:`, error);
        throw error;
    }
};

export { app };

