import React from 'react';
import type { Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { UserRole, PaymentMethod } from '../types';
import { MapPinIcon, ClockIcon, InformationCircleIcon } from './icons/CardIcons';

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isSelected }) => {
  const { user } = useAuth();
  const { acceptTask } = useTasks();
  const [isAccepting, setIsAccepting] = React.useState(false);

  const timeAgo = (timestamp: number): string => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptTask(task.id);
    } catch (error) {
      console.error("Failed to accept task", error);
      alert("There was an error accepting the task.");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div id={`task-${task.id}`}
      className={`bg-dark-800 rounded-2xl overflow-hidden transition-all duration-300 border ${isSelected
          ? 'border-primary/50 shadow-lg shadow-primary/10'
          : 'border-dark-600/50 hover:border-dark-400'
        }`}
    >
      <div className="p-4 flex items-start space-x-4">
        {/* Left: Price circle */}
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center">
          <span className="text-xs text-primary font-medium">ZAR</span>
          <span className="text-lg font-bold text-primary leading-tight">{task.fee.toFixed(0)}</span>
        </div>

        {/* Middle: Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-white font-semibold text-base truncate pr-2">{task.title}</h3>
            <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${task.paymentMethod === PaymentMethod.PREPAID
                ? 'bg-primary/15 text-primary'
                : 'bg-amber-500/15 text-amber-400'
              }`}>
              {task.paymentMethod === PaymentMethod.PREPAID ? 'Paid' : 'Cash'}
            </span>
          </div>

          <div className="flex items-center mt-1.5 text-dark-200 text-xs">
            <MapPinIcon className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-dark-400" />
            <span className="truncate">{task.location.address}</span>
          </div>

          <p className="mt-2 text-dark-300 text-xs line-clamp-2 leading-relaxed">
            {task.description}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-dark-400">
              <span className="flex items-center">
                <ClockIcon className="h-3.5 w-3.5 mr-1" />
                {task.duration}h
              </span>
              <span>•</span>
              <span>{timeAgo(task.createdAt)}</span>
            </div>

            {user?.role === UserRole.MARSHAL && (
              <button onClick={handleAccept} disabled={isAccepting}
                className="px-5 py-2 bg-primary text-dark-900 text-xs font-bold rounded-xl hover:bg-primary-400 focus:outline-none disabled:opacity-50 transition-all duration-200 shadow-lg shadow-primary/20">
                {isAccepting ? (
                  <span className="flex items-center space-x-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>
                    <span>...</span>
                  </span>
                ) : 'Accept'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;