
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon } from './icons/LogoIcon';
import { UserIcon, DashboardIcon, LogoutIcon } from './icons/HeaderIcons';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
    <header className="bg-white shadow-md w-full sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <LogoIcon className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl text-gray-800">Queue-Marshal</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-4 ml-10">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/') ? 'text-primary bg-primary-50' : 'text-gray-600 hover:bg-gray-100'}`}>Tasks</Link>
              <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard') ? 'text-primary bg-primary-50' : 'text-gray-600 hover:bg-gray-100'}`}>Dashboard</Link>
            </nav>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-primary transition">
              <img className="h-8 w-8 rounded-full object-cover" src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="User avatar" />
            </button>
            {dropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name} {user?.surname}</p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <DashboardIcon className="mr-3 h-5 w-5 text-gray-500" />
                    Dashboard
                  </Link>
                   <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <UserIcon className="mr-3 h-5 w-5 text-gray-500" />
                    Profile
                  </Link>
                  <div className="border-t border-gray-100"></div>
                  <button onClick={() => { logout(); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <LogoutIcon className="mr-3 h-5 w-5 text-gray-500" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
