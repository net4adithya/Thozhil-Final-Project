import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-blue-700 shadow-xs',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 shadow-xs active:bg-slate-100',
    outline: 'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100',
    accent: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 border border-slate-950 shadow-xs',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-700 shadow-xs',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-700 shadow-xs',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    link: 'bg-transparent text-blue-600 hover:text-blue-800 hover:underline p-0 h-auto font-normal focus-visible:ring-0',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1.5 h-7',
    sm: 'px-3 py-1.5 text-xs gap-1.5 h-8',
    md: 'px-3.5 py-2 text-xs md:text-sm gap-2 h-9',
    lg: 'px-4.5 py-2.5 text-sm gap-2.5 h-10',
    xl: 'px-5 py-3 text-base gap-3 h-11',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4 shrink-0 text-current" />
      )}
      
      <span>{children}</span>
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0 text-current" />
      )}
    </button>
  );
};

export default Button;
