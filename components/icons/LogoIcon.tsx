import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const LogoIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => {
  const { theme } = useTheme();
  const logoSrc = theme === 'light' ? 'logo-light.png' : 'logo.jpg';

  return (
    <img src={logoSrc} alt="Queue-Marshal Logo" className={`rounded-full ${className}`} {...props} />
  );
};
