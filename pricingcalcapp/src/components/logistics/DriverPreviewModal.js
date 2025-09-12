// src/components/logistics/DriverPreviewModal.js
import React from 'react';

const DriverPreviewModal = ({ driver, onClose }) => {
    if (!driver) return null;
    const sortedJobs = [...(driver.assigned_jobs || [])].sort((a, b) => a.route_order - b.route_order);

    return (
        <div className="bg-slate-100 rounded-xl w-full max-w-md mx-auto">
            <div className="p-6 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Route Preview</h2>
                        <p>This is what {driver.name} will see.</p>
                    </div>
                    <button onClick={onClose} className="text-3xl">&times;</button>
                </div>
                <div className="space-y-3 overflow-y-auto">
                    {sortedJobs.map(job => (
                        <div key={job.id} className="bg-white rounded-lg p-4 border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{job.job_id} ({job.type})</p>
                                    <p className="text-sm">{job.address}</p>
                                    <p className="text-sm font-bold text-indigo-600 mt-1">{job.timeslot}</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{job.route_order}</div>
                                    <div className="text-xs">STOP</div>
                                </div>
                            </div>
                             <div className="mt-2 pt-2 border-t">
                                <p className="text-xs font-semibold mb-1">MATERIALS:</p>
                                <ul className="list-disc list-inside">
                                {job.materials.map((m, i) => (
                                    <li key={i} className="text-sm">{m.name} - <span className="font-semibold">{m.allocated}/{m.required} {m.unit}</span></li>
                                ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DriverPreviewModal;

