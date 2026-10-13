import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const Timer = ({
  initialSeconds = 120,
  isActive = false,
  onTimeUp,
  warningThreshold = 60,
  dangerThreshold = 15,
  className = '',
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // Sync state if initialSeconds parameter resets
  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isActive) return;

    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, isActive, onTimeUp]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    if (secondsLeft <= dangerThreshold) return 'text-brandDanger bg-red-50 border-brandDanger/30 animate-pulse';
    if (secondsLeft <= warningThreshold) return 'text-brandWarning bg-amber-50 border-brandWarning/30';
    return 'text-primary bg-blue-50 border-primary/20';
  };

  return (
    <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm font-semibold select-none transition-colors duration-250 ${getColorClass()} ${className}`}>
      <Clock className="w-4 h-4 shrink-0 text-current" />
      <span className="font-mono text-current">{formatTime(secondsLeft)}</span>
    </div>
  );
};
