import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  icon: Icon = null,
  className = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="text-sm font-medium text-brandHeading flex items-center">
          {label}
          {required && <span className="text-brandDanger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brandBody">
            <Icon className="h-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`w-full text-sm bg-white text-brandHeading border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 py-2.5 ${
            Icon ? 'pl-9 pr-3' : 'px-3.5'
          } ${
            error ? 'border-brandDanger' : 'border-brandBorder hover:border-gray-300'
          }`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-brandDanger font-medium flex items-center">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
