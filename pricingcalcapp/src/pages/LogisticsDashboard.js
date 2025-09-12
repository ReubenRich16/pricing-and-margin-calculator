// src/pages/LogisticsDashboard.js
import React, { useState, useMemo } from 'react';
import { useJobs } from '../contexts/JobsContext';
import { useDrivers } from '../contexts/DriversContext';
import CreateJobModal from '../components/logistics/CreateJobModal';
import EditMaterialsModal from '../components/logistics/EditMaterialsModal';
import RouteCreationModal from '../components/logistics/RouteCreationModal';
import DriverPreviewModal from '../components/logistics/DriverPreviewModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { formatDate } from '../utils/formatDate';

const LogisticsDashboard = () => {
    const { jobs, loading: jobsLoading, addJob, updateJob, deleteJob } = useJobs();
    const { drivers, loading: driversLoading } = useDrivers();
    
    const [modal, setModal] = useState({ type: null, data: null });

    const unassignedJobs = useMemo(() => (jobs || []).filter(j => !j.assigned_driver), [jobs]);
    const assignedJobs = useMemo(() => (jobs || []).filter(j => j.assigned_driver), [jobs]);
    
    const driversWithJobs = useMemo(() => {
        return (drivers || []).map(driver => ({
            ...driver,
            assigned_jobs: assignedJobs.filter(job => job.assigned_driver === driver.id)
        }));
    }, [drivers, assignedJobs]);

    const loading = jobsLoading || driversLoading;
    if (loading) return <div>Loading logistics data...</div>;

    const handleSaveCustomJob = (jobData) => {
        addJob({ ...jobData, last_updated: new Date().toISOString() });
        setModal({ type: null, data: null });
    };

    const handleSaveAllocations = (jobId, newMaterials) => {
        updateJob(jobId, { materials: newMaterials });
        setModal({ type: null, data: null });
    };

    const handleSaveRoute = (driverId, routeJobs, startTime) => {
        // In a real app, this would be a batch update.
        console.log("Saving route for driver ID:", driverId, "with jobs:", routeJobs, "starting at", startTime);
        // Here you would call a function like `updateJobsBatch` from your context
        setModal({ type: null, data: null });
    };

    const handleDeleteCustomJob = (jobId) => {
        deleteJob(jobId);
        setModal({ type: null, data: null });
    };
    
    return (
        <>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Logistics Dashboard</h1>
                        <button onClick={() => setModal({ type: 'CREATE_JOB' })} className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg shadow-sm">+ Create Custom Job</button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <h2 className="text-xl font-bold text-slate-800">Available Jobs ({unassignedJobs.length})</h2>
                            <div className="mt-4 space-y-2">
                                {unassignedJobs.map(job => <div key={job.id} className="p-2 border rounded">{job.job_id} - {job.address}</div>)}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <h2 className="text-xl font-bold text-slate-800">Drivers</h2>
                            <div className="mt-4 space-y-4">
                                {driversWithJobs.map(driver => (
                                    <div key={driver.id} className="p-3 border rounded-lg">
                                        <h3 className="font-bold">{driver.name} ({driver.assigned_jobs.length} jobs)</h3>
                                        <div className="mt-2 space-y-1">
                                            {driver.assigned_jobs.map(job => <div key={job.id} className="text-sm p-1 bg-slate-100 rounded">{job.job_id}</div>)}
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            <button onClick={() => setModal({ type: 'CREATE_ROUTE', data: driver })} className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Create/Edit Route</button>
                                            <button onClick={() => setModal({ type: 'PREVIEW_ROUTE', data: driver })} className="text-xs px-2 py-1 bg-gray-500 text-white rounded">Preview</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {modal.type && (
                <div className="modal fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
                    {modal.type === 'CREATE_JOB' && <CreateJobModal suppliers={[]} onSave={handleSaveCustomJob} onClose={() => setModal({ type: null, data: null })} />}
                    {modal.type === 'EDIT_MATERIALS' && <EditMaterialsModal job={modal.data} onSave={handleSaveAllocations} onClose={() => setModal({ type: null, data: null })} />}
                    {modal.type === 'CREATE_ROUTE' && <RouteCreationModal driver={modal.data} jobs={jobs} onSave={handleSaveRoute} onClose={() => setModal({ type: null, data: null })} onEditMaterials={(job) => setModal({ type: 'EDIT_MATERIALS', data: job })} />}
                    {modal.type === 'PREVIEW_ROUTE' && <DriverPreviewModal driver={modal.data} onClose={() => setModal({ type: null, data: null })} />}
                    {modal.type === 'CONFIRMATION' && <ConfirmationModal isOpen={true} {...modal.data} onClose={() => setModal({ type: null, data: null })} />}
                </div>
            )}
        </>
    );
};

export default LogisticsDashboard;

