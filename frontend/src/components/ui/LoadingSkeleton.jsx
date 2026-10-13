import React from 'react';

export const LoadingSkeleton = ({
  variant = 'line', // 'line' | 'circle' | 'card' | 'table'
  count = 1,
  className = '',
}) => {
  const baseStyle = 'bg-gray-200 animate-pulse rounded-lg';

  const items = Array.from({ length: count });

  if (variant === 'circle') {
    return (
      <div className={`rounded-full bg-gray-200 animate-pulse ${className}`} />
    );
  }

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {items.map((_, idx) => (
          <div key={idx} className="bg-white border border-brandBorder rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-250 animate-pulse" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-2/3 bg-gray-250 animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-gray-250 animate-pulse rounded" />
              </div>
            </div>
            <div className="h-16 w-full bg-gray-250 animate-pulse rounded" />
            <div className="h-8 w-1/3 bg-gray-250 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3 w-full border border-brandBorder rounded-xl p-5 bg-white">
        <div className="h-6 w-full bg-gray-250 animate-pulse rounded" />
        <hr className="border-brandBorder" />
        {items.map((_, idx) => (
          <div key={idx} className="h-10 w-full bg-gray-250 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5 w-full">
      {items.map((_, idx) => (
        <div
          key={idx}
          className={`${baseStyle} h-4 ${className}`}
        />
      ))}
    </div>
  );
};
