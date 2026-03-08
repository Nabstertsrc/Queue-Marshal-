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

declare const firebase: any;

interface RequestModalProps {
  onClose: () => void;
}

type Step = 'details' | 'payment_selection' | 'processing' | 'success' | 'error';

import { useAuth } from '../contexts/AuthContext';

const RequestModal: React.FC<RequestModalProps> = ({ onClose }) => {
  const { user, token } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [taskDetails, setTaskDetails] = useState<Partial<Omit<Task, 'id' | 'createdAt' | 'status' | 'requesterId' | 'paymentMethod'>>>({ title: '', description: '' });
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
    const appFee = fee * 0.05;
    const vat = (fee + appFee) * 0.15;
    const total = fee + appFee + vat;

    setCommission(appFee + vat); // Use commission state to store total extra fees for simplicity or separate them
    setTotalAmount(total);
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

  const handleYocoPayment = async () => {
    setLoading(true);
    setPaymentError('');

    try {
      console.log('Initiating Yoco Checkout Request...');
      if (!token) throw new Error('Authentication token is missing.');

      const baseUrl = window.location.origin + window.location.pathname;
      const successUrl = `${baseUrl}?yoco_task_success=true#/`;
      const cancelUrl = `${baseUrl}#/`;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://queue-marshal-server-production.up.railway.app'}/api/payments/yoco/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amountInCents: Math.round(totalAmount * 100),
          successUrl,
          cancelUrl
        })
      });

      const data = await response.json();
      console.log('Checkout API Response:', data);
      if (data.success && data.redirectUrl) {
        // Save checkout ID and task details to verify when they return
        sessionStorage.setItem('pendingYocoTaskCheckout', data.checkoutId);
        sessionStorage.setItem('pendingTaskDetails', JSON.stringify({
          title: taskDetails.title,
          description: taskDetails.description,
          location: taskDetails.location,
          fee: taskDetails.fee,
          appCommission: (taskDetails.fee || 0) * 0.05,
          vatRate: 0.15,
          totalFee: totalAmount,
          duration: taskDetails.duration,
        }));

        // Redirect user to Yoco's hosted payment page
        window.location.href = data.redirectUrl;
      } else {
        setPaymentError("Failed to initiate Yoco payment: " + (data.error || "Unknown error"));
        setStep('error');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Yoco Checkout Error:', error);
      setPaymentError(error.message || "Network error processing payment.");
      setStep('error');
      setLoading(false);
    }
  };

  const handleSuccessfulPayment = async (paymentMethod: PaymentMethod) => {
    setLoading(true);
    setStep('processing');
    try {
      console.log('--- handleSuccessfulPayment ---');
      console.log('Method:', paymentMethod);

      if (!taskDetails.title || !taskDetails.location || !taskDetails.description || !taskDetails.fee || !taskDetails.duration) {
        throw new Error("Task details are incomplete. Please go back and fill all fields.");
      }

      const taskToCreate = {
        title: taskDetails.title,
        description: taskDetails.description,
        location: taskDetails.location as any,
        fee: taskDetails.fee || 0,
        appCommission: (taskDetails.fee || 0) * 0.05,
        vatRate: 0.15,
        totalFee: totalAmount,
        duration: taskDetails.duration || 0,
      };

      console.log('Sending addTask request...');
      const createdTask = await addTask(taskToCreate, paymentMethod);
      console.log('Task created successfully:', createdTask.id);

      setStep('success');
      setTimeout(() => {
        onClose();
        // Clear potential pending data
        sessionStorage.removeItem('pendingYocoTaskCheckout');
        sessionStorage.removeItem('pendingTaskDetails');
      }, 3000);
    } catch (err: any) {
      console.error('Error in handleSuccessfulPayment:', err);
      setPaymentError(err.message || 'Failed to create the task. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-dark-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-sm";

  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-white">New Request</h2>
              <p className="text-xs text-dark-300 mt-1">Find a marshal to stand in queue for you</p>
            </div>
            {formError && <p className="text-red-400 text-xs text-center bg-red-500/10 rounded-xl py-2 px-3 border border-red-500/20">{formError}</p>}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="title" className="text-sm font-medium text-dark-100">Title</label>
                <button
                  type="button"
                  onClick={handleGenerateTitle}
                  disabled={isGeneratingTitle || !taskDetails.description || (taskDetails.description?.length || 0) < 10}
                  className="text-[11px] text-primary hover:text-primary-300 disabled:text-dark-400 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  <SparklesIcon className="mr-1" />
                  <span>{isGeneratingTitle ? 'Generating...' : 'AI suggest'}</span>
                </button>
              </div>
              <input
                id="title"
                type="text"
                placeholder="e.g., Stand in line for concert tickets"
                required
                value={taskDetails.title || ''}
                onChange={e => setTaskDetails({ ...taskDetails, title: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Location</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <input ref={locationInputRef} type="text" placeholder="Search for a place" required className={`${inputClasses} pl-9`} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="description" className="text-sm font-medium text-dark-100">Description</label>
                <button
                  type="button"
                  onClick={handleImproveDescription}
                  disabled={isGeneratingDesc || !taskDetails.description || (taskDetails.description?.length || 0) < 10}
                  className="text-[11px] text-primary hover:text-primary-300 disabled:text-dark-400 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  <SparklesIcon className="mr-1" />
                  <span>{isGeneratingDesc ? 'Improving...' : 'AI improve'}</span>
                </button>
              </div>
              <textarea id="description" placeholder="Describe what the marshal needs to do..." rows={3} required value={taskDetails.description || ''} onChange={e => setTaskDetails({ ...taskDetails, description: e.target.value })} className={`${inputClasses} resize-none`}></textarea>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-1.5">Fee (ZAR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm font-medium">R</span>
                  <input type="number" min="1" step="0.01" placeholder="50" required onChange={e => setTaskDetails({ ...taskDetails, fee: parseFloat(e.target.value) })} className={`${inputClasses} pl-8`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-1.5">Duration</label>
                <div className="relative">
                  <input type="number" min="0.5" step="0.5" placeholder="1" required onChange={e => setTaskDetails({ ...taskDetails, duration: parseFloat(e.target.value) })} className={`${inputClasses} pr-10`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 text-xs">hrs</span>
                </div>
              </div>
            </div>

            {taskDetails.fee && taskDetails.fee > 0 && (
              <div className="p-4 bg-dark-700/50 rounded-xl border border-dark-500 space-y-2">
                <div className="flex justify-between text-xs text-dark-200">
                  <span>Marshal fee (Base)</span>
                  <span>R {taskDetails.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-dark-200">
                  <span>App Service Fee (5%)</span>
                  <span>R {(taskDetails.fee * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-dark-200">
                  <span>VAT (15%)</span>
                  <span>R {((taskDetails.fee * 1.05) * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-dark-500">
                  <span>Total Payable</span>
                  <span className="text-primary">R {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button type="submit" className="w-full py-3.5 px-4 bg-primary text-dark-900 font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-400 transition-all duration-200 text-sm">
              Continue to Payment
            </button>
          </form>
        );

      case 'payment_selection':
        return (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white">Confirm & Pay</h2>
              <p className="text-xs text-dark-300 mt-1">Review your request and choose payment</p>
            </div>

            {/* Task summary card */}
            <div className="p-4 bg-dark-700/50 rounded-xl border border-dark-500 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{taskDetails.title}</p>
                  <p className="text-dark-300 text-xs mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    {taskDetails.location?.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">R{totalAmount.toFixed(2)}</p>
                  <p className="text-[10px] text-dark-400">inc. service fee</p>
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-dark-200 uppercase tracking-wider">Payment Method</p>

              <button
                onClick={handleYocoPayment}
                disabled={loading}
                className="w-full flex items-center p-4 bg-dark-700 border border-dark-500 rounded-xl hover:border-primary/50 hover:bg-dark-600 disabled:opacity-50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center mr-4">
                  <YocoIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium text-sm">Pay with Card</p>
                  <p className="text-dark-400 text-xs">Visa, Mastercard via Yoco</p>
                </div>
                <svg className="w-5 h-5 text-dark-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>

              <button
                onClick={() => handleSuccessfulPayment(PaymentMethod.ON_THE_SPOT)}
                disabled={loading}
                className="w-full flex items-center p-4 bg-dark-700 border border-dark-500 rounded-xl hover:border-primary/50 hover:bg-dark-600 disabled:opacity-50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center mr-4">
                  <CashIcon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium text-sm">Pay on the Spot</p>
                  <p className="text-dark-400 text-xs">Cash payment to marshal</p>
                </div>
                <svg className="w-5 h-5 text-dark-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <button onClick={() => { setStep('details'); setLoading(false); }} className="w-full mt-4 py-2.5 text-sm text-dark-300 hover:text-white transition-colors">
              ← Back to details
            </button>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white">Processing Payment</h2>
            <p className="mt-2 text-dark-300 text-sm">Please wait while we create your request...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8 animate-scale-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 mb-4">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white">Request Posted!</h2>
            <p className="mt-2 text-dark-300 text-sm">Your task is now live. You'll be notified when a marshal accepts.</p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <span className="text-xs text-dark-400">Closing automatically...</span>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 mb-4">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white">Payment Failed</h2>
            <p className="mt-2 text-red-400 text-sm bg-red-500/10 rounded-xl py-3 px-4 border border-red-500/20">{paymentError || 'An unknown error occurred.'}</p>
            <p className="mt-3 text-dark-400 text-xs">Try another payment method or check your details.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setStep('payment_selection')} className="px-6 py-2.5 bg-dark-600 text-white text-sm font-medium rounded-xl hover:bg-dark-500 transition-all">
                Try Again
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
      <div
        className="bg-dark-800 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-dark-600/50 p-6 w-full sm:max-w-md relative animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag indicator for mobile */}
        <div className="sm:hidden flex justify-center mb-4">
          <div className="w-10 h-1 bg-dark-500 rounded-full"></div>
        </div>

        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-dark-600 hover:bg-dark-500 text-dark-300 hover:text-white transition-all">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {renderStep()}
      </div>
    </div>
  );
};

export default RequestModal;