import React from 'react';

export const Spinner = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizes = {
    xs: 'w-3.5 h-3.5 border-1.5',
    sm: 'w-4.5 h-4.5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colors = {
    primary: 'border-primary/20 border-t-primary',
    white: 'border-white/20 border-t-white',
    gray: 'border-gray-200 border-t-gray-500',
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizes[size]} ${colors[color]} ${className}`}
      style={{ borderStyle: 'solid' }}
    />
  );
};
