import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

declare const YocoSDK: any;

const PaymentPage: React.FC = () => {
    const { user, token } = useAuth();
    const [amount, setAmount] = useState<number>(100);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleYocoPayment = () => {
        if (!window.YocoSDK) {
            alert("Yoco SDK not loaded. Please refresh.");
            return;
        }

        const yoco = new YocoSDK({
            publicKey: import.meta.env.VITE_YOCO_PUBLIC_KEY || 'pk_test_ed3c84a6w7mo6nyjr6k3', // Default test key
        });

        yoco.showPopup({
            amountInCents: amount * 100,
            currency: 'ZAR',
            name: 'Queue-Marshal Top-up',
            description: `Recharge wallet with R${amount}`,
            callback: async (result: any) => {
                if (result.error) {
                    alert("Payment failed: " + result.error.message);
                } else {
                    setLoading(true);
                    try {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/yoco`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                token: result.id,
                                amountInCents: amount * 100
                            })
                        });

                        const data = await response.json();
                        if (data.success) {
                            alert(`Successful! R${amount} added to your wallet.`);
                            navigate('/dashboard');
                        } else {
                            alert("Server error: " + data.error);
                        }
                    } catch (error) {
                        alert("Network error processing payment.");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        });
    };

    if (!user) return null;

    return (
        <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test" }}>
            <div className="flex-1 bg-dark-900 overflow-y-auto p-6 md:p-12">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-8 flex items-center text-dark-300 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>

                    <h1 className="text-3xl font-extrabold text-white mb-2">Recharge Wallet</h1>
                    <p className="text-dark-300 mb-8">Choose an amount and your preferred payment method.</p>

                    <div className="bg-dark-800 rounded-3xl border border-dark-600/50 p-8 shadow-2xl">
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-dark-200 mb-3">Top-up Amount (Rands/USD)</label>
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                {[50, 100, 200, 500].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        className={`py-3 rounded-xl border text-sm font-bold transition-all ${amount === val
                                            ? 'bg-primary text-dark-900 border-primary shadow-lg shadow-primary/20'
                                            : 'bg-dark-700 text-white border-dark-500 hover:bg-dark-600'}`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full px-4 py-4 bg-dark-700 border border-dark-500 rounded-2xl text-white font-bold text-center text-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-6">
                            {/* YOCO Button */}
                            <button
                                onClick={handleYocoPayment}
                                disabled={loading}
                                className="w-full py-5 bg-[#005aff] text-white font-black text-lg rounded-2xl hover:brightness-110 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-blue-500/10 disabled:opacity-50"
                            >
                                <span className="uppercase tracking-tighter italic">YOCO</span>
                                <span>Pay with Card (SA)</span>
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-600"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-dark-800 px-4 text-dark-400">Or International</span></div>
                            </div>

                            {/* PayPal Button */}
                            <div className="rounded-2xl overflow-hidden min-h-[50px]">
                                <PayPalButtons
                                    style={{ layout: "vertical", shape: "pill", label: "pay" }}
                                    createOrder={(data, actions) => {
                                        return actions.order.create({
                                            intent: "CAPTURE",
                                            purchase_units: [{
                                                amount: {
                                                    currency_code: "USD",
                                                    value: amount.toString()
                                                }
                                            }]
                                        });
                                    }}
                                    onApprove={async (data, actions) => {
                                        if (actions.order) {
                                            const details = await actions.order.capture();
                                            setLoading(true);
                                            try {
                                                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/paypal/capture-order`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({ orderId: details.id })
                                                });
                                                const result = await res.json();
                                                if (result.success) {
                                                    alert("PayPal Payment Successful!");
                                                    navigate('/dashboard');
                                                }
                                            } catch (e) {
                                                alert("Error syncing PayPal payment.");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-dark-400">
                            Payments are processed securely. Your card details are never stored on our servers.
                        </p>
                    </div>
                </div>
            </div>
        </PayPalScriptProvider>
    );
};

export default PaymentPage;
