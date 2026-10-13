import React, { forwardRef } from 'react';

export const Checkbox = forwardRef(({
  label,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 5)}`;
  
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <div className="flex items-start space-x-2.5">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className="h-4.5 w-4.5 rounded border-brandBorder text-primary focus:ring-primary/20 focus:ring-offset-0 focus:outline-none transition-all duration-200 mt-0.5 cursor-pointer accent-primary"
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="text-sm font-medium text-brandHeading cursor-pointer select-none leading-tight">
            {label}
          </label>
        )}
      </div>
      {error && (
        <span className="text-xs text-brandDanger font-medium flex items-center pl-7">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
