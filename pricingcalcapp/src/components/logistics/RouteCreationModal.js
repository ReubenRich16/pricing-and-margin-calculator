// src/components/logistics/RouteCreationModal.js
import React, { useState, useEffect } from 'react';

// This is a simplified version of the Route Creation Modal for integration.
// A full implementation would require the complex drag-and-drop and time calculation logic.
const RouteCreationModal = ({ driver, onSave, onClose, onEditMaterials }) => {
    const [routeJobs, setRouteJobs] = useState([]);
    const [startTime, setStartTime] = useState('08:00');

    useEffect(() => {
        const sortedJobs = [...driver.assigned_jobs].sort((a, b) => (a.route_order || Infinity) - (b.route_order || Infinity));
        setRouteJobs(sortedJobs);
    }, [driver.assigned_jobs]);

    const handleSave = () => {
        onSave(driver.id, routeJobs, startTime);
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto">
            <div className="p-6 max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-start mb-4 pb-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold">Route for {driver.name}</h2>
                        <p>Set start time & drag to reorder.</p>
                    </div>
                    <button onClick={onClose} className="text-3xl">&times;</button>
                </div>
                <div className="mb-4 flex items-center gap-4">
                    <label className="text-sm font-medium">Start Time:</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="rounded-md"/>
                </div>
                <div className="space-y-1 overflow-y-auto pr-2">
                   {routeJobs.map(job => (
                       <div key={job.id} className="route-stop bg-white p-3 rounded-lg border flex items-center justify-between gap-4">
                           <p className="font-semibold">{job.job_id}</p>
                           <p className="text-sm">{job.address}</p>
                           <button onClick={() => onEditMaterials(job)} className="text-xs font-semibold text-blue-600">Edit Materials</button>
                       </div>
                   ))}
                </div>
            </div>
            <div className="bg-slate-100 px-6 py-4 rounded-b-xl flex justify-between items-center">
                <div className="text-sm font-semibold">Route Planning...</div>
                <div className="flex space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg">Save Route</button>
                </div>
            </div>
        </div>
    );
};

export default RouteCreationModal;

