
import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5C66.5685 5 80 18.4315 80 35C80 51.5685 66.5685 65 50 65C33.4315 65 20 51.5685 20 35C20 18.4315 33.4315 5 50 5Z" stroke="currentColor" strokeWidth="6"/>
    <path d="M15 95C15 78.4315 28.4315 65 45 65H55C71.5685 65 85 78.4315 85 95H15Z" stroke="currentColor" strokeWidth="6"/>
    <path d="M65 85L80 85" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    <path d="M20 85H35" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
  </svg>
);
