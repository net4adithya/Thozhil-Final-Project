import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  onClick = null,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`border border-slate-200 rounded-xl bg-white shadow-xs transition-colors duration-150 ${
        hoverEffect ? 'hover:border-slate-300 hover:shadow-sm' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
      className={`px-5 py-3.5 border-b border-slate-100 flex items-center justify-between ${className}`}
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
      className={`px-5 py-3 bg-slate-50/80 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs text-slate-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
