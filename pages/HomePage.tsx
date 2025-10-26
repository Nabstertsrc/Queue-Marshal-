
import React, { useState } from 'react';
import Map from '../components/Map';
import TaskCard from '../components/TaskCard';
import FloatingActionButton from '../components/FloatingActionButton';
import RequestModal from '../components/RequestModal';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const HomePage: React.FC = () => {
  const { openTasks } = useTasks();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const handleMarkerClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    const element = document.getElementById(`task-${taskId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div className="h-1/2 md:h-2/3 w-full">
         <Map tasks={openTasks} onMarkerClick={handleMarkerClick} />
      </div>
      <div className="flex-1 bg-secondary p-4 md:p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Open Requests</h2>
        {openTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {openTasks.map(task => (
              <TaskCard key={task.id} task={task} isSelected={selectedTaskId === task.id} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No open requests right now.</p>
            <p className="text-gray-500 text-sm">Check back later or be the first to post one!</p>
          </div>
        )}
      </div>

      {user?.role === UserRole.REQUESTER && <FloatingActionButton onClick={() => setIsModalOpen(true)} />}
      
      {isModalOpen && <RequestModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default HomePage;
