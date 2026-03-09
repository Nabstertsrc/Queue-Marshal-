import React, { useState, useRef } from 'react';
import Map from '../components/Map';
import TaskCard from '../components/TaskCard';
import FloatingActionButton from '../components/FloatingActionButton';
import RequestModal from '../components/RequestModal';
import HowItWorksModal from '../components/HowToWorksModal';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, PaymentMethod } from '../types';
import { useLocation } from 'react-router-dom';
import { LogoIcon } from '../components/icons/LogoIcon';

const HomePage: React.FC = () => {
  const { openTasks, addTask } = useTasks();
  const { user, token } = useAuth();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const isVerifying = useRef(false);

  React.useEffect(() => {
    // When using HashRouter, external redirects usually put the query string before the hash.
    const searchString = window.location.search || location.search;
    const queryParams = new URLSearchParams(searchString);
    const yocoSuccess = queryParams.get('yoco_task_success');
    const pendingCheckoutId = sessionStorage.getItem('pendingYocoTaskCheckout');
    const pendingDetailsStr = sessionStorage.getItem('pendingTaskDetails');

    if (yocoSuccess) {
      console.log('--- Yoco Return Check ---');
      console.log('Success param:', yocoSuccess);
      console.log('Pending Checkout ID:', pendingCheckoutId);
      console.log('Has Token:', !!token);
    }

    if (yocoSuccess === 'true' && pendingCheckoutId && pendingDetailsStr && token) {
      if (isVerifying.current) return;
      isVerifying.current = true;
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
            console.log('Posting Task to Database...', taskDetails);

            // Call addTask with isPaid set to true
            await addTask(taskDetails, PaymentMethod.PREPAID, true);

            alert('Payment successful! Your task has been posted.');

            // Clean up session storage
            sessionStorage.removeItem('pendingYocoTaskCheckout');
            sessionStorage.removeItem('pendingTaskDetails');

            // Clean URL and refresh to show the new task without triggering a reload if possible
            const cleanUrl = window.location.origin + window.location.pathname + (window.location.hash || '#/');
            window.history.replaceState({}, document.title, cleanUrl);
          } else {
            console.error('Task Verification Fail:', data);
            alert("Task Payment verification failed: " + (data.error || 'Unknown error.'));
          }
        } catch (error: any) {
          console.error('Yoco Return Error:', error);
          alert('Error verifying task payment: ' + error.message);
          isVerifying.current = false;
        } finally {
          setGlobalLoading(false);
          // Do not reset isVerifying.current to false on success to prevent double fire
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
    <div className="flex-1 flex flex-col relative overflow-hidden bg-dark-900">
      {globalLoading && (
        <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="animate-spin h-10 w-10 text-primary mb-4" />
          <p className="text-white font-bold">Verifying Payment...</p>
        </div>
      )}

      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row w-full bg-dark-900">

        {/* Mobile toggle floats over map now */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-20 flex bg-dark-800/90 backdrop-blur-md border border-dark-600/50 p-1 rounded-[1.25rem] shadow-2xl">
          <button
            onClick={() => setShowMap(true)}
            className={`flex-1 py-3 px-4 text-xs font-black tracking-wide uppercase rounded-[1rem] transition-all ${showMap ? 'bg-primary text-dark-900 scale-[1.02] shadow-lg shadow-primary/20' : 'text-dark-300 hover:text-white'}`}
          >
            Map View
          </button>
          <button
            onClick={() => setShowMap(false)}
            className={`flex-1 py-3 px-4 text-xs font-black tracking-wide uppercase rounded-[1rem] transition-all ${!showMap ? 'bg-primary text-dark-900 scale-[1.02] shadow-lg shadow-primary/20' : 'text-dark-300 hover:text-white'}`}
          >
            Nearby ({openTasks.length})
          </button>
        </div>

        {/* The Map (Full Screen) */}
        <div className={`flex-1 relative h-full w-full ${showMap ? 'block' : 'hidden md:block'}`}>
          <Map tasks={openTasks} onMarkerClick={handleMarkerClick} selectedTaskId={selectedTaskId} />
        </div>

        {/* The Sidebar (Nearby Tasks) */}
        <div className={`w-full md:w-[400px] lg:w-[450px] flex-shrink-0 bg-dark-900 border-l border-white/5 h-full flex flex-col z-10 shadow-2xl ${!showMap ? 'block' : 'hidden md:flex'}`}>
          {/* Header */}
          <div className="p-5 md:p-6 border-b border-dark-800 bg-dark-900/95 backdrop-blur sticky top-0 z-10 hidden md:flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Nearby Requests</h2>
            <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
              <span className="text-[10px] text-primary font-black uppercase tracking-widest">Live</span>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-dark-950 md:bg-dark-900">
            {/* Mobile Header Equivalent */}
            <div className="md:hidden flex items-center justify-between mb-6 pt-[80px]">
              <h2 className="text-xl font-bold text-white tracking-tight">Nearby Requests</h2>
              <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                <span className="text-[10px] text-primary font-black uppercase tracking-widest">Live</span>
              </div>
            </div>

            {openTasks.length > 0 ? (
              openTasks.map(task => (
                <TaskCard key={task.id} task={task} isSelected={selectedTaskId === task.id} />
              ))
            ) : (
              <div className="text-center py-20 bg-dark-800/30 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-dark-800 flex items-center justify-center border border-white/5">
                  <svg className="w-6 h-6 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-1">It's quiet here</p>
                <p className="text-dark-400 text-sm">No active tasks nearby.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {user?.role === UserRole.REQUESTER && <FloatingActionButton onClick={() => setIsModalOpen(true)} />}
      {isModalOpen && <RequestModal onClose={() => setIsModalOpen(false)} />}
      {showHowTo && <HowItWorksModal onClose={() => setShowHowTo(false)} userRole={user?.role} />}
    </div>
  );
};

export default HomePage;
