
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { LogoIcon } from '../components/icons/LogoIcon';
import AnimatedBackground from '../components/AnimatedBackground';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.REQUESTER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, role);
      navigate(role === UserRole.ADMIN ? '/admin' : '/');
    } catch (err: any) {
      setError(err.message || 'Failed to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen bg-transparent flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
          <div className="flex justify-center">
            <LogoIcon className="h-12 w-auto sm:h-14" />
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back
          </h2>
          <p className="mt-1 text-center text-sm text-dark-200">
            Sign in to your account
          </p>
        </div>

        <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass rounded-2xl py-6 sm:py-8 px-5 sm:px-10 shadow-2xl">
            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-100 mb-1.5">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-dark-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-sm" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-100 mb-1.5">Password</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-dark-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-sm" />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">I am a</label>
                <div className="flex bg-dark-700 rounded-xl p-1 border border-dark-500">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.REQUESTER)}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${role === UserRole.REQUESTER
                      ? 'bg-primary text-dark-900 shadow-lg shadow-primary/25'
                      : 'text-dark-200 hover:text-white'
                      }`}
                  >
                    Requester
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.MARSHAL)}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${role === UserRole.MARSHAL
                      ? 'bg-primary text-dark-900 shadow-lg shadow-primary/25'
                      : 'text-dark-200 hover:text-white'
                      }`}
                  >
                    Marshal
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.ADMIN)}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${role === UserRole.ADMIN
                      ? 'bg-primary text-dark-900 shadow-lg shadow-primary/25'
                      : 'text-dark-200 hover:text-white'
                      }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 sm:py-3.5 px-4 bg-primary text-dark-900 font-semibold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm">
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>
                    <span>Signing in...</span>
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-5 sm:mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-500"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-transparent text-dark-300">New here?</span>
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <Link to="/register" className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-dark-400 rounded-xl text-sm font-medium text-white hover:bg-dark-600 transition-all duration-200">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;