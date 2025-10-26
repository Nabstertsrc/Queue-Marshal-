
import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-primary">
      <div className="flex items-center space-x-4">
        <LogoIcon className="h-16 w-16 text-white" />
        <h1 className="text-4xl font-bold text-white">Queue-Marshal</h1>
      </div>
       <div className="absolute bottom-12 flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full bg-white animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-white animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 rounded-full bg-white animate-pulse"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
