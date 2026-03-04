
import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-dark-900">
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        <LogoIcon className="h-16 w-16" />
        <h1 className="text-3xl font-bold text-white tracking-tight">Queue-Marshal</h1>
      </div>
      <div className="absolute bottom-12 flex items-center justify-center space-x-3">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
