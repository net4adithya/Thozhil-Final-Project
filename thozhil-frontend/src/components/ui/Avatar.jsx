import React from 'react';

export const Avatar = ({
  src = null,
  name = '',
  initials = '',
  size = 'md',
  status = null, // 'online' | 'offline' | null
  className = '',
}) => {
  const getInitials = (fullName) => {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayInitials = initials || getInitials(name);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg font-semibold',
    xl: 'w-20 h-20 text-2xl font-bold',
  };

  const statusColors = {
    online: 'bg-brandSuccess border-white',
    offline: 'bg-gray-400 border-white',
  };

  return (
    <div className={`relative inline-block select-none shrink-0 ${className}`}>
      <div className={`rounded-full flex items-center justify-center border border-brandBorder font-medium overflow-hidden bg-gradient-to-tr from-gray-100 to-gray-50 text-brandHeading ${sizes[size]}`}>
        {src ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <span>{displayInitials}</span>
        )}
      </div>
      
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white h-2.5 w-2.5 ${statusColors[status]}`}
        />
      )}
    </div>
  );
};
