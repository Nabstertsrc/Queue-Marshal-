import React, { useState, useEffect, useRef } from 'react';
import type { Task } from '../types';
import { PaymentMethod } from '../types';
import { useTasks } from '../contexts/TaskContext';
import { YocoIcon, PayPalIcon, CashIcon } from './icons/PaymentIcons';

declare global {
  interface Window {
    google: any;
    googleMapsApiLoaded?: boolean;
    YocoSDK: any;
  }
}

interface RequestModalProps {
  onClose: () => void;
}

type Step = 'details' | 'payment_selection' | 'success' | 'error';
type PaymentGateway = 'yoco' | 'paypal';

const RequestModal: React.FC<RequestModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<Step>('details');
  const [taskDetails, setTaskDetails] = useState<Partial<Omit<Task, 'id' | 'createdAt' | 'status' | 'requesterId' | 'paymentMethod'>>>({});
  const [formError, setFormError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway | null>(null);

  const { addTask, deleteTask } = useTasks();
  
  const locationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initializeAutocomplete = () => {
      if (window.google && locationInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            setTaskDetails(prev => ({
              ...prev,
              title: place.name,
              location: {
                address: place.formatted_address || '',
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              }
            }));
          }
        });
      }
    };
    
    if (window.google) {
      initializeAutocomplete();
    } else {
      window.addEventListener('google-maps-api-loaded', initializeAutocomplete);
    }

    return () => {
        window.removeEventListener('google-maps-api-loaded', initializeAutocomplete);
    };
  }, []);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!taskDetails.location?.address || !taskDetails.description || !taskDetails.fee || !taskDetails.duration) {
      setFormError('Please fill out all fields.');
      return;
    }
    setStep('payment_selection');
  };

  const createTask = async (paymentMethod: PaymentMethod): Promise<Task> => {
    if (!taskDetails.location || !taskDetails.description || !taskDetails.fee || !taskDetails.duration) {
      throw new Error("Task details are incomplete.");
    }
    const taskToCreate = {
      title: taskDetails.title || 'Task',
      description: taskDetails.description,
      location: taskDetails.location,
      fee: taskDetails.fee,
      duration: taskDetails.duration,
    };
    return await addTask(taskToCreate, paymentMethod);
  };

  const simulateYocoPayment = () => new Promise<void>((resolve, reject) => {
    try {
      // This is a simulation. A real implementation would show a modal.
      console.log("Simulating Yoco inline popup...");
      setTimeout(() => {
        if (Math.random() > 0.3) {
          console.log("Yoco payment successful!");
          resolve();
        } else {
          reject(new Error("Yoco payment failed. Please try again."));
        }
      }, 2000);
    } catch (e) {
      reject(new Error("Could not initialize Yoco. Please try another method."));
    }
  });

  const simulatePayPalPayment = () => new Promise<void>((resolve, reject) => {
    console.log("Simulating PayPal payment...");
    setTimeout(() => {
      if (Math.random() > 0.3) {
        console.log("PayPal payment successful!");
        resolve();
      } else {
        reject(new Error("PayPal payment failed. Please try again."));
      }
    }, 2000);
  });
  
  const processPrepaidPayment = async (method: PaymentGateway) => {
    setLoading(true);
    setPaymentError('');
    let taskToPay = createdTask;

    try {
      if (!taskToPay) {
        taskToPay = await createTask(PaymentMethod.PREPAID);
        setCreatedTask(taskToPay);
      }
      
      if (method === 'yoco') await simulateYocoPayment();
      else if (method === 'paypal') await simulatePayPalPayment();

      setStep('success');
      setTimeout(onClose, 3000);

    } catch (err: any) {
      setPaymentError(err.message || `An error occurred with ${method}.`);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSelection = async (method: PaymentGateway | 'on_the_spot') => {
    if (method === 'on_the_spot') {
      setLoading(true);
      try {
        await createTask(PaymentMethod.ON_THE_SPOT);
        setStep('success');
        setTimeout(onClose, 3000);
      } catch (err: any) {
        setPaymentError(err.message || 'Failed to create task.');
        setStep('error');
      } finally {
        setLoading(false);
      }
    } else {
      setPaymentGateway(method);
      await processPrepaidPayment(method);
    }
  };

  const handleGoBackToDetails = async () => {
    if (createdTask) {
        setLoading(true);
        try {
            await deleteTask(createdTask.id);
        } catch (e) {
            console.error("Failed to delete task on cancellation:", e);
        } finally {
            setCreatedTask(null);
            setLoading(false);
            setStep('details');
        }
    } else {
        setStep('details');
    }
  };
  
  const handleClose = () => {
    if (createdTask && step !== 'success') {
      deleteTask(createdTask.id).catch(e => console.error("Task cleanup failed on close:", e));
    }
    onClose();
  };


  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Create a New Request</h2>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input ref={locationInputRef} type="text" placeholder="Search for a place or address" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Task Details</label>
              <textarea placeholder="Describe the task..." rows={4} required onChange={e => setTaskDetails({...taskDetails, description: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Marshal Fee (R)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" required onChange={e => setTaskDetails({...taskDetails, fee: parseFloat(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (Hours)</label>
                <input type="number" min="0" step="0.5" placeholder="1" required onChange={e => setTaskDetails({...taskDetails, duration: parseFloat(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
            <button type="submit" className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-md shadow-md hover:bg-primary-700">Proceed to Payment</button>
          </form>
        );
      case 'payment_selection':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Confirm & Pay</h2>
            <div className="my-6 p-4 bg-gray-100 rounded-lg text-left">
                <p><strong>Task:</strong> {taskDetails.title}</p>
                <p><strong>Location:</strong> {taskDetails.location?.address}</p>
                <p className="mt-4 text-2xl font-bold text-primary">Total: R {taskDetails.fee?.toFixed(2)}</p>
            </div>
             <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Choose a payment method:</p>
                <button onClick={() => handlePaymentSelection('yoco')} disabled={loading} className="w-full flex items-center justify-center py-3 px-4 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors">
                    <YocoIcon className="h-5 w-5 mr-3" /> {loading && paymentGateway === 'yoco' ? 'Processing...' : 'Pay with Card (Yoco)'}
                </button>
                <button onClick={() => handlePaymentSelection('paypal')} disabled={loading} className="w-full flex items-center justify-center py-3 px-4 bg-blue-800 text-white font-semibold rounded-md shadow-md hover:bg-blue-900 disabled:bg-gray-400 transition-colors">
                    <PayPalIcon className="h-5 w-5 mr-3" /> {loading && paymentGateway === 'paypal' ? 'Processing...' : 'Pay with PayPal'}
                </button>
                <button onClick={() => handlePaymentSelection('on_the_spot')} disabled={loading} className="w-full flex items-center justify-center py-3 px-4 bg-gray-600 text-white font-semibold rounded-md shadow-md hover:bg-gray-700 disabled:bg-gray-400 transition-colors">
                    <CashIcon className="h-5 w-5 mr-3" /> {loading ? 'Processing...' : 'Pay on the Spot'}
                </button>
            </div>
            <button onClick={() => setStep('details')} className="mt-4 text-sm text-gray-600 hover:underline">Go Back</button>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="mt-4 text-2xl font-bold">Task Listed!</h2>
            <p className="mt-2 text-gray-600">Your task is now available for Marshals. You will be notified when it's accepted.</p>
          </div>
        );
      case 'error':
        return (
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h2 className="mt-4 text-2xl font-bold">Payment Failed</h2>
                <p className="mt-2 text-red-600 bg-red-100 p-3 rounded-md">{paymentError || 'An unknown error occurred.'}</p>
                <p className="mt-2 text-gray-600">Your task has been saved, but payment is required to list it.</p>
                <div className="mt-6 flex justify-center gap-4">
                  <button onClick={handleGoBackToDetails} disabled={loading} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-300 disabled:bg-gray-300">
                      Edit Details
                  </button>
                  <button onClick={() => processPrepaidPayment(paymentGateway!)} disabled={loading || !paymentGateway} className="py-2 px-4 bg-primary text-white font-semibold rounded-md shadow-md hover:bg-primary-700 disabled:bg-primary-300">
                      {loading ? 'Retrying...' : 'Retry Payment'}
                  </button>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {renderStep()}
      </div>
    </div>
  );
};

export default RequestModal;