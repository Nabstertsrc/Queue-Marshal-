import React, { useState } from 'react';
import Map from '../components/Map';
import TaskCard from '../components/TaskCard';
import FloatingActionButton from '../components/FloatingActionButton';
import RequestModal from '../components/RequestModal';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, PaymentMethod } from '../types';
import { useLocation } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { openTasks, addTask } = useTasks();
  const { user, token } = useAuth();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  React.useEffect(() => {
    // Correctly get search params from the hash route using useLocation
    const queryParams = new URLSearchParams(location.search);
    const yocoSuccess = queryParams.get('yoco_task_success');
    const pendingCheckoutId = sessionStorage.getItem('pendingYocoTaskCheckout');
    const pendingDetailsStr = sessionStorage.getItem('pendingTaskDetails');

    console.log('--- Yoco Return Check ---');
    console.log('Success param:', yocoSuccess);
    console.log('Pending Checkout ID:', pendingCheckoutId);
    console.log('Has Token:', !!token);

    if (yocoSuccess === 'true' && pendingCheckoutId && pendingDetailsStr && token) {
      setGlobalLoading(true);
      const verifyTaskPayment = async () => {
        try {
          console.log('Verifying Yoco Task Payment...');
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://queue-marshal-server-production.up.railway.app'}/api/payments/yoco/verify-checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ checkoutId: pendingCheckoutId })
          });

          const data = await response.json();
          console.log('Verify Response:', data);

          if (data.success || data.message === 'Payment already processed.') {
            const taskDetails = JSON.parse(pendingDetailsStr);
            console.log('Posting Task to Database...');
            await addTask(taskDetails, PaymentMethod.PREPAID);
            alert('Payment successful! Your task has been posted.');
            sessionStorage.removeItem('pendingYocoTaskCheckout');
            sessionStorage.removeItem('pendingTaskDetails');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            alert("Task Payment verification failed: " + (data.error || 'Unknown error.'));
          }
        } catch (error) {
          console.error('Yoco Return Error:', error);
          alert('Error verifying task payment.');
        } finally {
          setGlobalLoading(false);
        }
      };
      verifyTaskPayment();
    }
  }, [token, addTask, location.search]);

  const handleMarkerClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    // On mobile, switch to list view when a marker is clicked
    if (window.innerWidth < 768) {
      setShowMap(false);
    }
    const element = document.getElementById(`task-${taskId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden bg-dark-900">
      {/* Mobile view toggle */}
      <div className="md:hidden flex bg-dark-800 border-b border-dark-600/50 p-1.5 mx-3 mt-2 rounded-xl">
        <button
          onClick={() => setShowMap(true)}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${showMap ? 'bg-primary text-dark-900' : 'text-dark-300'}`}
        >
          <span className="flex items-center justify-center space-x-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            <span>Map</span>
          </span>
        </button>
        <button
          onClick={() => setShowMap(false)}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${!showMap ? 'bg-primary text-dark-900' : 'text-dark-300'}`}
        >
          <span className="flex items-center justify-center space-x-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            <span>List ({openTasks.length})</span>
          </span>
        </button>
      </div>

      {/* Map - takes half on desktop, full on mobile when toggled */}
      <div className={`w-full md:w-1/2 lg:w-3/5 relative ${showMap ? 'flex-1 md:flex-none' : 'hidden md:block'}`} style={{ minHeight: showMap ? '300px' : undefined }}>
        <Map tasks={openTasks} onMarkerClick={handleMarkerClick} selectedTaskId={selectedTaskId} />
        {/* Gradient overlay on bottom for mobile */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-dark-900 to-transparent pointer-events-none"></div>
      </div>

      {/* Task list - side panel on desktop, full on mobile */}
      <div className={`md:w-1/2 lg:w-2/5 bg-dark-900 overflow-y-auto md:border-l md:border-dark-600/50 ${!showMap ? 'flex-1' : 'hidden md:block'}`}>
        <div className="px-3 sm:px-4 pt-3 pb-24">
          {/* Section header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Open Requests</h2>
              <p className="text-[10px] sm:text-xs text-dark-300">{openTasks.length} available near you</p>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] text-primary font-medium">Live</span>
            </div>
          </div>

          {openTasks.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {openTasks.map(task => (
                <TaskCard key={task.id} task={task} isSelected={selectedTaskId === task.id} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-dark-700 mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">No open requests</p>
              <p className="text-dark-300 text-xs mt-1">Check back later or post one!</p>
            </div>
          )}
        </div>
      </div>

      {user?.role === UserRole.REQUESTER && <FloatingActionButton onClick={() => setIsModalOpen(true)} />}

      {isModalOpen && <RequestModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default HomePage;
