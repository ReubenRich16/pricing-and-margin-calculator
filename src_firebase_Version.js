import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiAQfKywpTslewwSliAYHyxSV3LPVjgoQ",
  authDomain: "pricing-and-margin-calculator.firebaseapp.com",
  projectId: "pricing-and-margin-calculator",
  storageBucket: "pricing-and-margin-calculator.firebasestorage.app",
  messagingSenderId: "298417414795",
  appId: "1:298417414795:web:b82bc178c078c4bd9a6a8e",
  measurementId: "G-CYKYR2KNHE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
