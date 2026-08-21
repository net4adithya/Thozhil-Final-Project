import React from 'react';

export const Badge = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-150';
  
  const variants = {
    primary: 'bg-primary/5 text-primary border-primary/20',
    secondary: 'bg-gray-100 text-brandHeading border-brandBorder',
    success: 'bg-brandSuccess/5 text-brandSuccess border-brandSuccess/20',
    warning: 'bg-brandWarning/5 text-brandWarning border-brandWarning/20',
    danger: 'bg-brandDanger/5 text-brandDanger border-brandDanger/20',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
