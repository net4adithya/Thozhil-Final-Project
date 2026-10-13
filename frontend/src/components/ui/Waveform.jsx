import React from 'react';

/**
 * Animated Waveform component for AI Speaking presence
 * Features 5 synchronized sine-oscillating bars in enterprise primary blue
 */
export const Waveform = ({ isSpeaking = true, className = '' }) => {
  return (
    <div className={`flex items-center justify-center space-x-1 h-6 ${className}`}>
      {[0.4, 0.8, 1.0, 0.7, 0.5, 0.9, 0.6].map((multiplier, idx) => (
        <span
          key={idx}
          className={`w-1 rounded-full bg-blue-600 transition-all duration-300 ${
            isSpeaking ? 'animate-pulse' : 'h-1.5 opacity-40'
          }`}
          style={{
            height: isSpeaking ? `${Math.max(6, Math.min(24, 20 * multiplier))}px` : '4px',
            animationDelay: `${idx * 120}ms`,
            animationDuration: '800ms'
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;
