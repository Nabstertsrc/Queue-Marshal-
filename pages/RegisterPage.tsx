
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { LogoIcon } from '../components/icons/LogoIcon';
import AnimatedBackground from '../components/AnimatedBackground';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        cellphone: '',
        email: '',
        idNumber: '',
        password: '',
        confirmPassword: '',
        role: UserRole.REQUESTER,
    });
    const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (err) => {
                console.warn(`Geolocation ERROR(${err.code}): ${err.message}`);
                setError('Could not get your location. Please enable location services.');
            },
            { timeout: 10000 }
        );
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (role: UserRole) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            await register({ ...formData, location });
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to register.');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-dark-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-sm";

    return (
        <>
            <AnimatedBackground />
            <div className="min-h-screen bg-transparent flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-lg animate-slide-up">
                    <div className="flex justify-center">
                        <LogoIcon className="h-12 w-auto" />
                    </div>
                    <h2 className="mt-4 text-center text-3xl font-bold text-white tracking-tight">Create your account</h2>
                    <p className="mt-2 text-center text-sm text-dark-200">Join thousands of users saving time</p>
                </div>

                <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="glass rounded-2xl py-8 px-6 sm:px-10 shadow-2xl">
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">{error}</div>}
                            {success && <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-xl text-sm animate-fade-in">{success}</div>}

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-dark-100 mb-2">Register as</label>
                                <div className="flex bg-dark-700 rounded-xl p-1 border border-dark-500">
                                    <button type="button" onClick={() => handleRoleChange(UserRole.REQUESTER)}
                                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${formData.role === UserRole.REQUESTER ? 'bg-primary text-dark-900 shadow-lg shadow-primary/25' : 'text-dark-200 hover:text-white'}`}>
                                        Requester
                                    </button>
                                    <button type="button" onClick={() => handleRoleChange(UserRole.MARSHAL)}
                                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${formData.role === UserRole.MARSHAL ? 'bg-primary text-dark-900 shadow-lg shadow-primary/25' : 'text-dark-200 hover:text-white'}`}>
                                        Marshal
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-dark-100 mb-1.5">First Name</label>
                                    <input type="text" name="name" required onChange={handleChange} placeholder="John" className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-100 mb-1.5">Last Name</label>
                                    <input type="text" name="surname" required onChange={handleChange} placeholder="Doe" className={inputClasses} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-100 mb-1.5">Email</label>
                                <input type="email" name="email" required onChange={handleChange} placeholder="name@example.com" className={inputClasses} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-100 mb-1.5">Phone Number</label>
                                <input type="tel" name="cellphone" required onChange={handleChange} placeholder="+27 XX XXX XXXX" className={inputClasses} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-100 mb-1.5">ID Number</label>
                                <input type="text" name="idNumber" required onChange={handleChange} placeholder="Your ID number" className={inputClasses} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-dark-100 mb-1.5">Password</label>
                                    <input type="password" name="password" required onChange={handleChange} placeholder="Min 6 characters" className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-100 mb-1.5">Confirm</label>
                                    <input type="password" name="confirmPassword" required onChange={handleChange} placeholder="••••••••" className={inputClasses} />
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="space-y-2 pt-2">
                                <p className="text-sm font-medium text-dark-100">Documents <span className="text-dark-400 font-normal">(optional)</span></p>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-dark-500 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
                                        <svg className="w-6 h-6 text-dark-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        <span className="text-xs text-dark-300">ID Document</span>
                                        <input type="file" className="hidden" />
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-dark-500 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
                                        <svg className="w-6 h-6 text-dark-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                        <span className="text-xs text-dark-300">Bank Details</span>
                                        <input type="file" className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <button type="submit" disabled={loading || !location}
                                className="w-full py-3.5 px-4 bg-primary text-dark-900 font-semibold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm mt-2">
                                {loading ? (
                                    <span className="flex items-center justify-center space-x-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>
                                        <span>Creating account...</span>
                                    </span>
                                ) : 'Create Account'}
                            </button>
                        </form>
                        <div className="mt-5 text-center text-sm">
                            <p className="text-dark-300">
                                Already have an account?{' '}
                                <Link to="/login" className="font-medium text-primary hover:text-primary-300 transition-colors">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;