import React from 'react';

export const Badge = ({
  children,
  variant = 'primary',
  size = 'sm',
  dot = false,
  icon: Icon = null,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border select-none';
  
  const variants = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    live: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const dotColors = {
    primary: 'bg-blue-600',
    secondary: 'bg-slate-500',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-red-600',
    info: 'bg-sky-600',
    live: 'bg-blue-600',
    neutral: 'bg-slate-400',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5 font-medium',
  };

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.sm} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.primary}`} />
      )}
      {Icon && (
        <Icon className="w-3 h-3 shrink-0" />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
