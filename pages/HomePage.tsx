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

      <main className="flex-1 relative overflow-y-auto w-full">
        <div className="container mx-auto px-4 py-6 sm:p-8">

          {/* Welcome / Marketing Banner */}
          <div className="mb-8 relative group overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl glass p-8">
            <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <LogoIcon className="w-64 h-64" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center px-3 py-1 bg-primary/20 border border-primary/30 text-primary text-[10px] font-black tracking-widest uppercase rounded-full mb-4">
                {user?.role === 'requester' ? 'The 100-Hour Thief' : 'Professional Patient'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
                {user?.role === 'requester' ? (
                  <>Reclaim your <span className="text-primary italic">Time</span>. <br />We'll handle the wait.</>
                ) : (
                  <>Turn your <span className="text-primary underline decoration-2 underline-offset-4">Patience</span> into <span className="text-primary italic">Profit</span>.</>
                )}
              </h1>
              <p className="text-dark-200 text-sm sm:text-md leading-relaxed mb-6 opacity-80">
                {user?.role === 'requester' ? (
                  "The average person spends over 100 hours per year standing in lines. Queue Marshal is the definitive solution to reclaim your lost time."
                ) : (
                  "Provide essential queuing services for busy individuals and businesses. Browse the map, accept tasks, and build your professional marshal reputation."
                )}
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-6 py-2.5 bg-primary text-dark-900 font-black rounded-xl hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  Learn More
                </button>
                {user?.role === 'requester' && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2.5 glass border border-white/10 text-white font-bold rounded-xl hover:bg-white/5 transition-all"
                  >
                    Post a Task
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className={`w-full lg:w-3/5 order-2 lg:order-1 flex flex-col space-y-4`}>
              {/* Mobile view toggle */}
              <div className="md:hidden flex bg-dark-800 border border-dark-600/50 p-1.5 rounded-xl">
                <button
                  onClick={() => setShowMap(true)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${showMap ? 'bg-primary text-dark-900' : 'text-dark-300'}`}
                >
                  Map
                </button>
                <button
                  onClick={() => setShowMap(false)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${!showMap ? 'bg-primary text-dark-900' : 'text-dark-300'}`}
                >
                  List ({openTasks.length})
                </button>
              </div>

              {/* Map/List Switcher Container */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className={`w-full md:w-1/2 lg:w-full relative ${showMap ? 'block' : 'hidden md:block'}`} style={{ minHeight: '400px' }}>
                  <Map tasks={openTasks} onMarkerClick={handleMarkerClick} selectedTaskId={selectedTaskId} />
                  <div className="md:hidden absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-dark-900 to-transparent pointer-events-none"></div>
                </div>

                <div className={`w-full md:w-1/2 lg:hidden bg-dark-900 overflow-y-auto ${!showMap ? 'block' : 'hidden md:block'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Open Requests</h2>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">LIVE</span>
                  </div>
                  {openTasks.length > 0 ? (
                    <div className="space-y-3">
                      {openTasks.map(task => (
                        <TaskCard key={task.id} task={task} isSelected={selectedTaskId === task.id} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-dark-800/50 rounded-2xl border border-dark-600/30">
                      <p className="text-dark-300 text-sm">No open requests found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Side List */}
            <div className="hidden lg:block lg:w-2/5 order-1 lg:order-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Nearby Requests</h2>
                <div className="flex items-center space-x-1.5 px-2 py-1 bg-primary/10 rounded-full">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Live</span>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 custom-scrollbar">
                {openTasks.length > 0 ? (
                  openTasks.map(task => (
                    <TaskCard key={task.id} task={task} isSelected={selectedTaskId === task.id} />
                  ))
                ) : (
                  <div className="text-center py-20 bg-dark-800/50 rounded-[2rem] border border-white/5">
                    <p className="text-dark-300">No active tasks nearby.</p>
                  </div>
                )}
              </div>
            </div>
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
