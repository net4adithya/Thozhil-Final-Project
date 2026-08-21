import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-brandSurface border border-brandBorder rounded-xl shadow-sm transition-all duration-250 ${
        hoverEffect ? 'hover:shadow-md hover:border-gray-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-5 py-4 border-b border-brandBorder flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardBody = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-5 py-4 bg-gray-50/50 border-t border-brandBorder rounded-b-xl flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
