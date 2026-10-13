import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'An error occurred',
  message = 'We encountered an error while fetching the requested content.',
  retryLabel = 'Try again',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-brandDanger/20 rounded-xl bg-red-50/20 ${className}`}>
      <div className="p-3 bg-brandDanger/10 rounded-full text-brandDanger mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-brandHeading mb-1">{title}</h3>
      <p className="text-sm text-brandBody max-w-sm mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm">
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
