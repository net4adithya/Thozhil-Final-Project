import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useApp } from '../context/InternContext';

// ==========================================
// BUTTON
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isSuccess?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isSuccess = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'relative font-semibold overflow-hidden transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 flex items-center justify-center gap-2 select-none rounded-md';

  const variants = {
    // Brand blue — the main CTA (matches sample "Paste Code" button)
    primary: 'bg-secondary text-white hover:bg-secondary-hover shadow-sm hover:shadow-brand-glow',
    // Outline — secondary action (matches sample "Upload File / ZIP")
    outline: 'bg-white dark:bg-cardDark text-textPrimary-light dark:text-textPrimary-dark border border-borderLight dark:border-borderDark hover:border-secondary hover:text-secondary dark:hover:text-secondary',
    // Secondary — same as outline
    secondary: 'bg-white dark:bg-cardDark text-textPrimary-light dark:text-textPrimary-dark border border-borderLight dark:border-borderDark hover:border-secondary hover:text-secondary',
    // Accent — same as primary in this theme
    accent: 'bg-secondary text-white hover:bg-secondary-hover',
    // Danger
    danger: 'bg-danger text-white hover:bg-red-600',
    // Ghost
    ghost: 'bg-transparent text-textSecondary-light dark:text-textSecondary-dark hover:bg-brand-light dark:hover:bg-slate-800 border border-transparent',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 h-8',
    md: 'text-sm px-4 py-2.5 h-10',
    lg: 'text-sm px-6 py-3 h-11',
  };

  return (
    <button
      disabled={isLoading || isSuccess || props.disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.span
            key="success"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Check size={16} className="stroke-[2.5]" />
            Done
          </motion.span>
        ) : isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="animate-spin" size={16} />
            Please wait
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

// ==========================================
// CARD — white surface, soft shadow, rounded-lg
// ==========================================
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverGlow = true
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-cardDark
        border border-borderLight dark:border-borderDark
        rounded-xl
        shadow-card
        transition-all duration-150
        p-6
        ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:border-secondary/30' : hoverGlow ? 'hover:shadow-card-hover' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ==========================================
// FLOATING INPUT
// ==========================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(!!props.value || !!props.defaultValue);
  }, [props.value, props.defaultValue]);

  return (
    <div className="relative w-full mb-5">
      <input
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          setHasValue(!!e.target.value);
        }}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          if (props.onChange) props.onChange(e);
        }}
        className={`
          w-full px-3 pt-5 pb-1.5 text-sm bg-white dark:bg-bgDark
          text-textPrimary-light dark:text-textPrimary-dark
          border ${error ? 'border-danger' : 'border-borderLight dark:border-borderDark'}
          rounded-md transition-all duration-150 shadow-sm
          ${className}
        `}
        {...props}
        placeholder={isFocused || hasValue ? props.placeholder : ''}
      />
      <label
        className={`
          absolute left-3 top-1/2 -translate-y-1/2 text-sm text-textSecondary-light dark:text-textSecondary-dark
          pointer-events-none transition-all duration-150 origin-left
          ${(isFocused || hasValue) ? 'scale-75 -translate-y-[15px] text-secondary' : ''}
        `}
      >
        {label}
      </label>
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-1 -bottom-5 text-[11px] text-danger font-medium flex items-center gap-1"
          >
            <AlertCircle size={11} />
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// FLOATING TEXTAREA
// ==========================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(!!props.value || !!props.defaultValue);
  }, [props.value, props.defaultValue]);

  return (
    <div className="relative w-full mb-5">
      <textarea
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          setHasValue(!!e.target.value);
        }}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          if (props.onChange) props.onChange(e);
        }}
        className={`
          w-full px-3 pt-5 pb-2 text-sm bg-white dark:bg-bgDark
          text-textPrimary-light dark:text-textPrimary-dark
          border ${error ? 'border-danger' : 'border-borderLight dark:border-borderDark'}
          rounded-md transition-all duration-150 resize-y min-h-[120px] shadow-sm
          ${className}
        `}
        {...props}
        placeholder={isFocused || hasValue ? props.placeholder : ''}
      />
      <label
        className={`
          absolute left-3 top-4 text-sm text-textSecondary-light dark:text-textSecondary-dark
          pointer-events-none transition-all duration-150 origin-left
          ${(isFocused || hasValue) ? 'scale-75 -translate-y-[10px] text-secondary' : ''}
        `}
      >
        {label}
      </label>
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-1 -bottom-5 text-[11px] text-danger font-medium flex items-center gap-1"
          >
            <AlertCircle size={11} />
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// SKELETON
// ==========================================
export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`shimmer-glow rounded-md ${className}`} style={{ minHeight: '1em' }} />
  );
};

// ==========================================
// PROGRESS RING
// ==========================================
interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number;
  colorClass?: string;
  ringColorClass?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  radius,
  stroke,
  progress,
  colorClass = 'stroke-secondary',
  ringColorClass = 'stroke-slate-100 dark:stroke-slate-700'
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        className={`fill-transparent ${ringColorClass}`}
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <motion.circle
        className={`fill-transparent ${colorClass}`}
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};

// ==========================================
// TOAST CONTAINER
// ==========================================
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  const icons = {
    success: <Check className="text-success shrink-0" size={15} />,
    info:    <Info className="text-secondary shrink-0" size={15} />,
    warning: <AlertTriangle className="text-warning shrink-0" size={15} />,
    error:   <X className="text-danger shrink-0" size={15} />,
  };

  const accents = {
    success: 'border-l-success',
    info:    'border-l-secondary',
    warning: 'border-l-warning',
    error:   'border-l-danger',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18 }}
            className={`
              pointer-events-auto px-4 py-3 flex gap-3 items-start rounded-lg
              bg-white dark:bg-cardDark
              border border-borderLight dark:border-borderDark
              border-l-4 ${accents[toast.type]}
              shadow-dropdown
            `}
          >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
