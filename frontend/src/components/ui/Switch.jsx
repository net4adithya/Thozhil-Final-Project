import React from 'react';
import { motion } from 'framer-motion';

export const Switch = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  id,
}) => {
  const switchId = id || `switch-${Math.random().toString(36).substring(2, 5)}`;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {(label || description) && (
        <div className="flex flex-col pr-4">
          {label && (
            <label htmlFor={switchId} className="text-sm font-medium text-brandHeading cursor-pointer select-none">
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-brandBody select-none">
              {description}
            </span>
          )}
        </div>
      )}
      
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 ${
          checked ? 'bg-primary' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="sr-only">Toggle Switch</span>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
