import React, { useState, useEffect, useRef } from 'react';
import type { Task } from '../types';
import { PaymentMethod } from '../types';
import { useTasks } from '../contexts/TaskContext';
import { CashIcon, YocoIcon } from './icons/PaymentIcons';
import { generateTitleFromDescription, improveTaskDescription } from '../lib/gemini';
import { SparklesIcon } from './icons/GeminiIcons';


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

const RequestModal: React.FC<RequestModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<Step>('details');
  const [taskDetails, setTaskDetails] = useState<Partial<Omit<Task, 'id' | 'createdAt' | 'status' | 'requesterId' | 'paymentMethod'>>>({ title: '', description: ''});
  const [formError, setFormError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [commission, setCommission] = useState(0);

  const { addTask } = useTasks();
  
  const locationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fee = taskDetails.fee || 0;
    const calculatedCommission = fee * 0.15;
    setCommission(calculatedCommission);
    setTotalAmount(fee + calculatedCommission);
  }, [taskDetails.fee]);

  useEffect(() => {
    const initializeAutocomplete = () => {
      if (window.google && locationInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            setTaskDetails(prev => ({
              ...prev,
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
    if (!taskDetails.title || !taskDetails.location?.address || !taskDetails.description || !taskDetails.fee || !taskDetails.duration) {
      setFormError('Please fill out all fields.');
      return;
    }
    setStep('payment_selection');
  };

  const handleGenerateTitle = async () => {
      if (!taskDetails.description || isGeneratingTitle) return;
      setIsGeneratingTitle(true);
      setFormError('');
      try {
          const suggestedTitle = await generateTitleFromDescription(taskDetails.description);
          setTaskDetails(prev => ({ ...prev, title: suggestedTitle }));
      } catch (err: any) {
          setFormError(err.message);
      } finally {
          setIsGeneratingTitle(false);
      }
  };

  const handleImproveDescription = async () => {
      if (!taskDetails.description || isGeneratingDesc) return;
      setIsGeneratingDesc(true);
      setFormError('');
      try {
          const improvedDesc = await improveTaskDescription(taskDetails.description);
          setTaskDetails(prev => ({ ...prev, description: improvedDesc }));
      } catch (err: any) {
          setFormError(err.message);
      } finally {
          setIsGeneratingDesc(false);
      }
  };

  const handleYocoPayment = () => {
    setLoading(true);
    setPaymentError('');

    if (!window.YocoSDK) {
        setPaymentError('Yoco payment SDK could not be loaded. Please check your connection and try again.');
        setStep('error');
        setLoading(false);
        return;
    }

    const yoco = new window.YocoSDK({
      publicKey: 'pk_live_c1f26310jB0W9Oeee414',
    });

    yoco.showPopup({
      amountInCents: Math.round(totalAmount * 100),
      currency: 'ZAR',
      name: 'Queue-Marshal Task',
      description: taskDetails.title || 'Task Payment',
      callback: async (result: { id?: string; error?: { message: string } }) => {
        if (result.error) {
          setPaymentError(result.error.message || 'Yoco payment failed. Please try again.');
          setStep('error');
          setLoading(false);
        } else {
          // IMPORTANT: In a real-world application, you would send the token `result.id`
          // to your backend server. The server would then use your SECRET KEY to securely
          // process the charge. Using a secret key on the frontend is a major security risk.
          // For this demo, we will simulate a successful payment upon receiving the token.
          await handleSuccessfulPayment(PaymentMethod.PREPAID);
        }
      },
    });
  };

  const handleSuccessfulPayment = async (paymentMethod: PaymentMethod) => {
    setLoading(true);
    try {
        if (!taskDetails.title || !taskDetails.location || !taskDetails.description || !taskDetails.fee || !taskDetails.duration) {
          throw new Error("Task details are incomplete.");
        }
        const taskToCreate = {
          title: taskDetails.title,
          description: taskDetails.description,
          location: taskDetails.location,
          fee: taskDetails.fee,
          duration: taskDetails.duration,
        };
        await addTask(taskToCreate, paymentMethod);
        setStep('success');
        setTimeout(onClose, 3000);
    } catch (err: any) {
        setPaymentError(err.message || 'Failed to create the task after payment.');
        setStep('error');
    } finally {
        setLoading(false);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Create a New Request</h2>
            {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <button 
                  type="button" 
                  onClick={handleGenerateTitle} 
                  disabled={isGeneratingTitle || !taskDetails.description || taskDetails.description.length < 10}
                  className="text-xs text-primary hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  <SparklesIcon className="mr-1" />
                  <span>{isGeneratingTitle ? 'Generating...' : 'Suggest from description'}</span>
                </button>
              </div>
              <input 
                id="title"
                type="text" 
                placeholder="e.g., Stand in line for concert tickets" 
                required 
                value={taskDetails.title || ''}
                onChange={e => setTaskDetails({...taskDetails, title: e.target.value})} 
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input ref={locationInputRef} type="text" placeholder="Search for a place or address" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Task Details</label>
                 <button 
                  type="button" 
                  onClick={handleImproveDescription} 
                  disabled={isGeneratingDesc || !taskDetails.description || taskDetails.description.length < 10}
                  className="text-xs text-primary hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  <SparklesIcon className="mr-1" />
                  <span>{isGeneratingDesc ? 'Improving...' : 'Improve with AI'}</span>
                </button>
              </div>
              <textarea id="description" placeholder="Describe the task..." rows={4} required value={taskDetails.description || ''} onChange={e => setTaskDetails({...taskDetails, description: e.target.value})} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Marshal Fee (R)</label>
                <input type="number" min="1" step="0.01" placeholder="50.00" required onChange={e => setTaskDetails({...taskDetails, fee: parseFloat(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (Hours)</label>
                <input type="number" min="0.5" step="0.5" placeholder="1" required onChange={e => setTaskDetails({...taskDetails, duration: parseFloat(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
             {taskDetails.fee && taskDetails.fee > 0 && (
                <div className="p-3 bg-gray-100 rounded-md text-sm">
                    <div className="flex justify-between">
                        <span>Marshal Fee:</span>
                        <span>R {taskDetails.fee.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Service Fee (15%):</span>
                        <span>R {commission.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                        <span>Total Payment:</span>
                        <span>R {totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            )}
            <p className="text-xs text-gray-500 text-center">Payments made through the app are subject to a 15% service fee which helps us run the platform and process payments securely.</p>
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
                <p className="mt-4 text-2xl font-bold text-primary">Total: R {totalAmount.toFixed(2)}</p>
            </div>
             <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Choose a payment method:</p>
                
                <button 
                  onClick={handleYocoPayment} 
                  disabled={loading} 
                  className="w-full flex items-center justify-center py-3 px-4 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                >
                    <YocoIcon className="h-5 w-5 mr-3" /> {loading ? 'Processing...' : 'Pay with Card (Yoco)'}
                </button>
                
                <button 
                  onClick={() => handleSuccessfulPayment(PaymentMethod.ON_THE_SPOT)} 
                  disabled={loading} 
                  className="w-full flex items-center justify-center py-3 px-4 bg-gray-600 text-white font-semibold rounded-md shadow-md hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                >
                    <CashIcon className="h-5 w-5 mr-3" /> {loading ? 'Processing...' : 'Pay on the Spot'}
                </button>
            </div>
            <button onClick={() => { setStep('details'); setLoading(false); }} className="mt-4 text-sm text-gray-600 hover:underline">Go Back</button>
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
                <h2 className="mt-4 text-2xl font-bold">An Error Occurred</h2>
                <p className="mt-2 text-red-600 bg-red-100 p-3 rounded-md">{paymentError || 'An unknown error occurred.'}</p>
                <p className="mt-2 text-gray-600">Please try a different payment method or check your details.</p>
                <div className="mt-6 flex justify-center gap-4">
                  <button onClick={() => setStep('payment_selection')} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-300">
                      Try Again
                  </button>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {renderStep()}
      </div>
    </div>
  );
};

export default RequestModal;