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
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutes ago";
      return Math.floor(seconds) + " seconds ago";
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
        await acceptTask(task.id);
        // UI will update via context
    } catch (error) {
        console.error("Failed to accept task", error);
        alert("There was an error accepting the task.");
    } finally {
        setIsAccepting(false);
    }
  };

  return (
    <div id={`task-${task.id}`} className={`bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 ${isSelected ? 'ring-2 ring-primary scale-105' : 'hover:shadow-xl'}`}>
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800 flex-1 pr-2">{task.title}</h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                task.paymentMethod === PaymentMethod.PREPAID 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
                {task.paymentMethod}
            </span>
        </div>
        <div className="flex items-start mt-2 text-gray-500 text-sm">
          <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{task.location.address}</span>
        </div>
        
        <p className="mt-3 text-gray-600 text-sm flex-grow">
          {task.description}
        </p>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
             <div className="flex items-center">
                <InformationCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>Posted {timeAgo(task.createdAt)}</span>
            </div>
            <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span>Est. Duration: {task.duration} hours</span>
            </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-lg font-bold text-primary">R{task.fee.toFixed(2)}</p>
          {user?.role === UserRole.MARSHAL && (
            <button onClick={handleAccept} disabled={isAccepting} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75 disabled:bg-gray-400">
              {isAccepting ? 'Accepting...' : 'Accept Task'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;