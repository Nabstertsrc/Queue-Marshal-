import React, { useState } from 'react';
import type { Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { StarIcon } from './icons/MiscIcons';
import { UserRole } from '../types';

interface RatingModalProps {
    task: Task;
    onClose: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ task, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const { addRating } = useTasks();

    if (!user) return null;

    const ratedUserId = user.role === UserRole.REQUESTER ? task.marshalId : task.requesterId;

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select at least one star.');
            return;
        }
        if (!ratedUserId) {
            setError('Could not find the user to rate.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await addRating(task.id, ratedUserId, rating, comment);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to submit rating.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
            <div className="bg-dark-800 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-dark-600/50 p-6 w-full sm:max-w-md relative animate-slide-up" onClick={e => e.stopPropagation()}>
                {/* Drag indicator */}
                <div className="sm:hidden flex justify-center mb-4">
                    <div className="w-10 h-1 bg-dark-500 rounded-full"></div>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-dark-600 hover:bg-dark-500 text-dark-300 hover:text-white transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 mb-3">
                        <StarIcon className="w-7 h-7 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Rate Experience</h2>
                    <p className="mt-1 text-dark-300 text-sm">How was your {user.role === UserRole.REQUESTER ? 'Marshal' : 'Requester'}?</p>
                </div>

                <div className="flex justify-center space-x-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110"
                        >
                            <StarIcon
                                className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star ? 'text-amber-400' : 'text-dark-500'
                                    }`}
                            />
                        </button>
                    ))}
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium text-dark-300 mb-1.5">Comment (optional)</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-sm resize-none"
                        placeholder="Share your experience..."
                    />
                </div>

                {error && <p className="text-red-400 text-xs text-center mb-3 bg-red-500/10 rounded-xl py-2 px-3 border border-red-500/20">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={loading || rating === 0}
                    className="w-full py-3.5 px-4 bg-primary text-dark-900 font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                >
                    {loading ? (
                        <span className="flex items-center justify-center space-x-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>
                            <span>Submitting...</span>
                        </span>
                    ) : 'Submit Rating'}
                </button>
            </div>
        </div>
    );
};

export default RatingModal;