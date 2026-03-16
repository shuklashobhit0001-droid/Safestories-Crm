import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Toast } from '../../../components/Toast';
import './MonthFilter.css';

interface AddLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: () => void; // Callback to refresh leads list
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [leadManagers, setLeadManagers] = useState<{ id: number; name: string }[]>([]);

    const [isSourceOpen, setIsSourceOpen] = useState(false);
    const [isAssignedToOpen, setIsAssignedToOpen] = useState(false);
    const sourceRef = useRef<HTMLDivElement>(null);
    const assignedToRef = useRef<HTMLDivElement>(null);
    const sourceOptions = ['Chatbot', 'Website', 'Direct', 'Social Media', 'Other'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
                setIsSourceOpen(false);
            }
            if (assignedToRef.current && !assignedToRef.current.contains(event.target as Node)) {
                setIsAssignedToOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        fetch('/api/lead-managers')
            .then(r => r.json())
            .then(data => setLeadManagers(data))
            .catch(err => console.error('Failed to fetch lead managers:', err));
    }, [isOpen]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        age: '',
        source: 'Chatbot',
        assignedTo: '', // Defaulting to unassigned
        remarks: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    city: formData.city,
                    age: formData.age,
                    source: formData.source,
                    sales_agent_id: formData.assignedTo ? parseInt(formData.assignedTo) : null,
                    general_remarks: formData.remarks
                })
            });

            if (response.ok) {
                setToast({ message: 'Lead added successfully!', type: 'success' });
                onAdd(); // Refresh the list
                // reset form
                setFormData({
                    name: '', email: '', phone: '', city: '', age: '',
                    source: 'Chatbot', assignedTo: '', remarks: ''
                });
                setTimeout(() => {
                    onClose(); // Close modal after showing toast
                }, 2000);
            } else {
                const err = await response.json();
                setToast({ message: 'Failed to add lead: ' + (err.error || 'Unknown error'), type: 'error' });
            }
        } catch (error) {
            console.error('Submission error:', error);
            setToast({ message: 'Network error while adding lead.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg p-8 w-full max-w-xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <UserPlus size={24} />
                        <h2 className="text-2xl font-bold">Add New Lead</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Name<span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Phone Number<span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Email (Optional)</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    min="1"
                                    max="120"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Source<span className="text-red-500">*</span></label>
                                <div className="custom-dropdown w-full" ref={sourceRef}>
                                    <button
                                        type="button"
                                        className="dropdown-trigger w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                        onClick={() => setIsSourceOpen(!isSourceOpen)}
                                    >
                                        <span>{formData.source}</span>
                                        <svg
                                            className={`dropdown-arrow ${isSourceOpen ? 'open' : ''}`}
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                        >
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isSourceOpen && (
                                        <div className="dropdown-menu w-full max-h-48 overflow-y-auto">
                                            {sourceOptions.map(option => (
                                                <div
                                                    key={option}
                                                    className={`dropdown-item ${formData.source === option ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, source: option }));
                                                        setIsSourceOpen(false);
                                                    }}
                                                >
                                                    {option}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Assigned To</label>
                                <div className="custom-dropdown w-full" ref={assignedToRef}>
                                    <button
                                        type="button"
                                        className="dropdown-trigger w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                        onClick={() => setIsAssignedToOpen(!isAssignedToOpen)}
                                    >
                                        <span>
                                            {leadManagers.find(m => String(m.id) === formData.assignedTo)?.name || 'Unassigned'}
                                        </span>
                                        <svg
                                            className={`dropdown-arrow ${isAssignedToOpen ? 'open' : ''}`}
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                        >
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isAssignedToOpen && (
                                        <div className="dropdown-menu w-full max-h-48 overflow-y-auto">
                                            <div
                                                className={`dropdown-item ${formData.assignedTo === '' ? 'selected' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData(prev => ({ ...prev, assignedTo: '' }));
                                                    setIsAssignedToOpen(false);
                                                }}
                                            >
                                                Unassigned
                                            </div>
                                            {leadManagers.map(manager => (
                                                <div
                                                    key={manager.id}
                                                    className={`dropdown-item ${formData.assignedTo === String(manager.id) ? 'selected' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData(prev => ({ ...prev, assignedTo: String(manager.id) }));
                                                        setIsAssignedToOpen(false);
                                                    }}
                                                >
                                                    {manager.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Remarks</label>
                            <textarea
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                placeholder="Add any initial notes here..."
                                rows={3}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-8 border-t pt-6">
                        <button
                            type="button"
                            className="px-6 py-2 border rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium disabled:bg-gray-400 min-w-[120px]"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Add Lead'}
                        </button>
                    </div>
                </form>
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default AddLeadModal;
