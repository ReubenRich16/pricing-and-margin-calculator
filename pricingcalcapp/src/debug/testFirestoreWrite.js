// src/debug/testFirestoreWrite.js
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export async function testFirestoreWrite() {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.warn('No authenticated user yet.');
      return;
    }
    const materialsCol = collection(db, 'artifacts', uid, 'materials');
    const docRef = await addDoc(materialsCol, {
      materialName: 'Test Material',
      supplier: 'Debug Supplier',
      costPrice: 9.99,
      createdAt: serverTimestamp()
    });
    console.log('Test material written with id:', docRef.id);

    const snap = await getDocs(materialsCol);
    console.log('Materials count after write:', snap.size);
    snap.forEach(d => console.log('Material doc:', d.id, d.data()));
  } catch (e) {
    console.error('Test write failed:', e);
  }
}