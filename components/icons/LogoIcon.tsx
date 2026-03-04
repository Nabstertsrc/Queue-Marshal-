
import React from 'react';

export const LogoIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => (
  <img src="logo.jpg" alt="Queue-Marshal Logo" className={`rounded-full ${className}`} {...props} />
);
