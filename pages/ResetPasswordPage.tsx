import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon } from '../components/icons/LogoIcon';
import AnimatedBackground from '../components/AnimatedBackground';

const ResetPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) {
            setError('Please enter your email.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email);
            setSuccess('Password reset sent successfully! Check your inbox.');
            setEmail('');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-dark-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-sm";

    return (
        <>
            <AnimatedBackground />
            <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
                    <div className="flex justify-center">
                        <LogoIcon className="h-16 w-auto" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-dark-200">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="glass rounded-3xl py-8 px-6 sm:px-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-20 blur-3xl rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary opacity-10 blur-3xl rounded-full"></div>

                        <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in flex items-center">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-xl text-sm animate-fade-in flex items-center">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {success}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-dark-100 mb-2">Email address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                    className={inputClasses}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3.5 px-4 bg-primary text-dark-900 border border-transparent rounded-xl shadow-lg shadow-primary/20 text-sm font-bold hover:bg-primary-400 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-dark-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"></path>
                                    </svg>
                                ) : 'Send Reset Link'}
                                {!loading && <span className="absolute right-4 group-hover:translate-x-1 transition-transform">→</span>}
                            </button>
                        </form>

                        <div className="mt-8 relative hidden sm:block">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-dark-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-dark-800 text-dark-400">Or</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center text-sm">
                            <Link to="/login" className="font-medium text-primary hover:text-primary-300 transition-colors">
                                Return to Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ResetPasswordPage;
