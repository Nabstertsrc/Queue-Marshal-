
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
            setSuccess('Registration successful! You can now log in.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to register.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AnimatedBackground />
            <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <LogoIcon className="h-12 w-auto text-primary" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error}</div>}
                            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">{success}</div>}
                            
                            <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input type="text" name="name" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">Surname</label>
                                    <input type="text" name="surname" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" name="email" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Cellphone Number</label>
                                <input type="tel" name="cellphone" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            
                             <div>
                                <label className="block text-sm font-medium text-gray-700">ID Number</label>
                                <input type="text" name="idNumber" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input type="password" name="password" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <input type="password" name="confirmPassword" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Register as a...</label>
                                 <div className="mt-2 flex items-center justify-around">
                                     <label className="inline-flex items-center">
                                         <input type="radio" className="form-radio h-4 w-4 text-primary focus:ring-primary" name="role" value={UserRole.REQUESTER} checked={formData.role === UserRole.REQUESTER} onChange={() => handleRoleChange(UserRole.REQUESTER)}/>
                                         <span className="ml-2 text-gray-700">Requester</span>
                                     </label>
                                     <label className="inline-flex items-center">
                                         <input type="radio" className="form-radio h-4 w-4 text-primary focus:ring-primary" name="role" value={UserRole.MARSHAL} checked={formData.role === UserRole.MARSHAL} onChange={() => handleRoleChange(UserRole.MARSHAL)}/>
                                         <span className="ml-2 text-gray-700">Marshal</span>
                                     </label>
                                 </div>
                            </div>

                            {/* Document Upload Placeholders */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Documents (Optional)</p>
                                <label className="block text-sm text-gray-600">ID Document: <input type="file" className="text-sm" /></label>
                                <label className="block text-sm text-gray-600">Bank Details Proof: <input type="file" className="text-sm" /></label>
                            </div>

                            <div>
                                <button type="submit" disabled={loading || !location} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary-300">
                                    {loading ? 'Registering...' : 'Sign Up'}
                                </button>
                            </div>
                        </form>
                         <div className="mt-6 text-center text-sm">
                            <p className="text-gray-500">
                               Already have an account?{' '}
                               <Link to="/login" className="font-medium text-primary hover:text-primary-700">Log in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;