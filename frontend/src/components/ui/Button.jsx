import React from 'react';
import { motion } from 'framer-motion';
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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-sm shadow-primary/20 active:scale-98',
    secondary: 'bg-white text-brandHeading border border-brandBorder hover:bg-gray-50 focus:ring-primary shadow-sm active:scale-98',
    success: 'bg-brandSuccess text-white hover:bg-green-600 focus:ring-brandSuccess shadow-sm active:scale-98',
    danger: 'bg-brandDanger text-white hover:bg-red-600 focus:ring-brandDanger shadow-sm active:scale-98',
    ghost: 'bg-transparent text-brandBody hover:bg-gray-100 hover:text-brandHeading focus:ring-gray-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={`w-4 h-4 mr-2 text-current`} />
      )}
      
      <span>{children}</span>
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={`w-4 h-4 ml-2 text-current`} />
      )}
    </motion.button>
  );
};
