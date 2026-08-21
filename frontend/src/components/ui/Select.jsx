import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(({
  label,
  options = [],
  placeholder = 'Select an option',
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
      <div className="relative rounded-lg shadow-sm">
        <select
          ref={ref}
          className={`w-full text-sm bg-white text-brandHeading border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 py-2.5 pl-3.5 pr-10 appearance-none cursor-pointer ${
            error ? 'border-brandDanger' : 'border-brandBorder hover:border-gray-300'
          }`}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-brandBody">
          <ChevronDown className="h-4 h-4" />
        </div>
      </div>
      {error && (
        <span className="text-xs text-brandDanger font-medium flex items-center">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
