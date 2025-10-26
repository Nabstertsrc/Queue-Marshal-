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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Rate Your Experience</h2>
                    <p className="mt-2 text-gray-600">How was your experience with this {user.role === UserRole.REQUESTER ? 'Marshal' : 'Requester'}?</p>
                </div>
                <div className="my-6 flex justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                            key={star}
                            className={`w-10 h-10 cursor-pointer ${
                                (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                        />
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Add a comment (optional)</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Share more details about your experience..."
                    />
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="mt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-md shadow-md hover:bg-primary-700 disabled:bg-primary-300"
                    >
                        {loading ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;