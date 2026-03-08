
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon } from './icons/LogoIcon';
import { UserIcon, DashboardIcon, LogoutIcon, MessagesIcon } from './icons/HeaderIcons';
import { VerificationStatus } from '../types';
import HowItWorksModal from './HowToWorksModal';
import ThemeEditor from './ThemeEditor';

const VerifiedBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`w-4 h-4 text-primary ${className}`} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isVerified = user?.verificationStatus === VerificationStatus.VERIFIED;
  const isAndroid = /Android/i.test(navigator.userAgent);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-dark-900 border-b border-dark-600/50 w-full sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo + Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <LogoIcon className="h-7 w-7 sm:h-8 sm:w-8 transition-transform group-hover:scale-110" />
              <span className="font-bold text-lg sm:text-xl text-white tracking-tight hidden xs:inline">Queue-Marshal</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-1 ml-8">
              <Link to="/" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/') ? 'text-white bg-dark-600' : 'text-dark-200 hover:text-white hover:bg-dark-700'}`}>
                Tasks
              </Link>
              <Link to="/messages" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${isActive('/messages') ? 'text-white bg-dark-600' : 'text-dark-200 hover:text-white hover:bg-dark-700'}`}>
                <MessagesIcon className="w-4 h-4" />
                <span>Messages</span>
              </Link>
              <Link to="/dashboard" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/dashboard') ? 'text-white bg-dark-600' : 'text-dark-200 hover:text-white hover:bg-dark-700'}`}>
                Dashboard
              </Link>
              <button
                onClick={() => setHowToOpen(true)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-dark-200 hover:text-white hover:bg-dark-700 transition-all duration-200 flex items-center space-x-1"
              >
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>How it Works</span>
              </button>
              {user?.isAdmin && (
                <Link to="/admin" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/admin') ? 'text-white bg-dark-600' : 'text-dark-200 hover:text-white hover:bg-dark-700'}`}>
                  <span className="flex items-center space-x-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span>Admin</span>
                  </span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Balance */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-dark-700 border border-dark-500">
              <span className="text-[10px] text-dark-300">BAL</span>
              <span className="text-xs font-bold text-primary">R{user?.balance?.toFixed(2) || '0.00'}</span>
            </div>

            {/* Verification badge */}
            {user?.role === 'marshal' && (
              <div className={`hidden sm:flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold ${isVerified ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-400'
                }`}>
                {isVerified ? <VerifiedBadge className="w-3 h-3" /> : <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>}
                <span>{isVerified ? 'Verified' : 'Pending'}</span>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dark-700 text-dark-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Theme Editor button */}
            <button
              onClick={() => setThemeEditorOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dark-700 text-dark-200 hover:text-primary transition-all duration-200"
              title="Change Theme"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>

            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-dark-500 transition-all duration-200 focus:outline-none">
                <img className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover ring-2 ring-dark-500" src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="Avatar" />
              </button>
              {dropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-60 rounded-xl shadow-2xl bg-dark-800 border border-dark-600 animate-scale-in overflow-hidden z-50">
                  <div className="p-4 border-b border-dark-600">
                    <div className="flex items-center space-x-3">
                      <img className="h-10 w-10 rounded-full object-cover" src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="" />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="text-sm font-semibold text-white truncate">{user?.name} {user?.surname}</p>
                          {isVerified && <VerifiedBadge />}
                        </div>
                        <p className="text-xs text-dark-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    {/* Mobile balance */}
                    <div className="sm:hidden mt-3 flex items-center justify-between px-3 py-2 bg-dark-700 rounded-lg">
                      <span className="text-xs text-dark-300">Balance</span>
                      <span className="text-sm font-bold text-primary">R{user?.balance?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-dark-100 hover:bg-dark-700 transition-colors">
                      <DashboardIcon className="mr-3 h-4 w-4 text-dark-300" />Dashboard
                    </Link>
                    <Link to="/messages" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-dark-100 hover:bg-dark-700 transition-colors">
                      <MessagesIcon className="mr-3 h-4 w-4 text-dark-300" />Messages
                    </Link>
                    <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-dark-100 hover:bg-dark-700 transition-colors">
                      <UserIcon className="mr-3 h-4 w-4 text-dark-300" />Profile
                    </Link>
                    {user?.isAdmin && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-dark-100 hover:bg-dark-700 transition-colors">
                        <svg className="mr-3 h-4 w-4 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Admin Panel
                      </Link>
                    )}
                    {isAndroid && (
                      <a href="/queue-marshal.apk" download className="flex items-center px-4 py-2.5 text-sm text-primary hover:bg-dark-700 transition-colors">
                        <svg className="mr-3 h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Android App
                      </a>
                    )}
                    <div className="border-t border-dark-600 my-1"></div>
                    <button onClick={() => { logout(); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-400 hover:bg-dark-700 transition-colors">
                      <LogoutIcon className="mr-3 h-4 w-4 text-red-400" />Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-dark-700 bg-dark-800 animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('/') ? 'text-white bg-dark-600' : 'text-dark-200'}`}>
              Tasks
            </Link>
            <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('/messages') ? 'text-white bg-dark-600' : 'text-dark-200'}`}>
              Messages
            </Link>
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard') ? 'text-white bg-dark-600' : 'text-dark-200'}`}>
              Dashboard
            </Link>
            <button
              onClick={() => { setHowToOpen(true); setMobileMenuOpen(false); }}
              className="w-full text-left block px-3 py-2.5 rounded-lg text-sm font-medium text-dark-200 hover:text-white hover:bg-dark-700 transition-all"
            >
              How it Works
            </button>
            {user?.isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('/admin') ? 'text-white bg-dark-600' : 'text-dark-200'}`}>
                Admin Panel
              </Link>
            )}
            {isAndroid && (
              <a href="/queue-marshal.apk" download className="block px-3 py-2.5 rounded-lg text-sm font-bold text-primary bg-primary/10 transition-all border border-primary/20">
                <span className="flex items-center">
                  <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download Android App (APK)
                </span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Marshal Verification Banner */}
      {user?.role === 'marshal' && !isVerified && (
        <div className="bg-amber-500/10 border-t border-amber-500/20 py-2.5 px-4 animate-fade-in relative z-40">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></div>
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-tighter leading-none">Verification Needed</p>
                <p className="text-[11px] text-amber-200/70 mt-0.5 hidden xs:block">Complete your profile to start accepting tasks and earning.</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="px-3 py-1 bg-amber-500 text-dark-900 text-[10px] font-black rounded-lg hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10 whitespace-nowrap"
            >
              GO TO PROFILE
            </Link>
          </div>
        </div>
      )}

      {howToOpen && <HowItWorksModal onClose={() => setHowToOpen(false)} userRole={user?.role} />}
      {themeEditorOpen && <ThemeEditor onClose={() => setThemeEditorOpen(false)} />}
    </header>
  );
};

export default Header;
