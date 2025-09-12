// src/contexts/JobsContext.js
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useAuth } from './AuthContext';

const JobsContext = createContext();

export const useJobs = () => useContext(JobsContext);

const AuthenticatedJobsProvider = ({ children, currentUser }) => {
    const collectionPath = `artifacts/${currentUser.uid}/jobs`;
    const { data: jobs, loading, error } = useFirestoreCollection(collectionPath);

    const addJob = useCallback(async (jobData) => {
        await addDoc(collection(db, collectionPath), { ...jobData, createdAt: new Date() });
    }, [collectionPath]);

    const updateJob = useCallback(async (id, updatedData) => {
        const jobDoc = doc(db, collectionPath, id);
        await updateDoc(jobDoc, updatedData);
    }, [collectionPath]);
    
    const updateJobsBatch = useCallback(async (updatedJobs) => {
        const batch = writeBatch(db);
        updatedJobs.forEach(job => {
            const jobDoc = doc(db, collectionPath, job.id);
            batch.update(jobDoc, job.data);
        });
        await batch.commit();
    }, [collectionPath]);

    const deleteJob = useCallback(async (id) => {
        const jobDoc = doc(db, collectionPath, id);
        await deleteDoc(jobDoc);
    }, [collectionPath]);

    const value = useMemo(() => ({
        jobs, loading, error, addJob, updateJob, updateJobsBatch, deleteJob,
    }), [jobs, loading, error, addJob, updateJob, updateJobsBatch, deleteJob]);

    return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};

export const JobsProvider = ({ children }) => {
    const { currentUser } = useAuth();
    if (!currentUser) {
        const emptyValue = { jobs: [], loading: true, error: new Error("User not authenticated.") };
        return <JobsContext.Provider value={emptyValue}>{children}</JobsContext.Provider>;
    }
    return <AuthenticatedJobsProvider currentUser={currentUser}>{children}</AuthenticatedJobsProvider>;
};

