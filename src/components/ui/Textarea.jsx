import React, { forwardRef } from 'react';

export const Textarea = forwardRef(({
  label,
  placeholder,
  rows = 4,
  error,
  className = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="text-sm font-medium text-brandHeading">
          {label}
          {required && <span className="text-brandDanger ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        placeholder={placeholder}
        rows={rows}
        className={`w-full text-sm bg-white text-brandHeading border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 py-2.5 px-3.5 ${
          error ? 'border-brandDanger' : 'border-brandBorder hover:border-gray-300'
        }`}
        {...props}
      />
      {error && (
        <span className="text-xs text-brandDanger font-medium flex items-center">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
