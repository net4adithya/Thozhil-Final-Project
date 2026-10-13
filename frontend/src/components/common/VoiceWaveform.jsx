import React, { useEffect, useRef } from 'react';

export const VoiceWaveform = ({
  isActive = false,
  className = '',
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth || 300;
    let height = canvas.height = 40;

    let bars = Array.from({ length: 45 }).map((_, idx) => ({
      x: (idx * (width / 45)),
      w: (width / 45) - 3,
      h: 2,
      targetH: 2
    }));

    const drawWave = () => {
      ctx.clearRect(0, 0, width, height);

      // Gradient for voice visualizer bars
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#3B82F6'); // Blue 500
      grad.addColorStop(0.5, '#2563EB'); // Blue 600
      grad.addColorStop(1, '#1D4ED8'); // Blue 700

      ctx.fillStyle = grad;

      bars.forEach((bar, idx) => {
        // If active, generate random audio frequency fluctuations. Otherwise, remain flat
        if (isActive) {
          if (Math.random() < 0.15) {
            // Generate standard sine-based audio wave values with random multiplier
            const centerFactor = 1 - Math.abs(idx - 22.5) / 22.5; // taller in middle
            bar.targetH = Math.max(3, Math.random() * (height - 6) * centerFactor);
          }
        } else {
          bar.targetH = 2; // Flatline when not speaking
        }

        // Interpolate current height towards target height for smooth transition
        bar.h += (bar.targetH - bar.h) * 0.25;

        // Render bar centered vertically
        const y = (height - bar.h) / 2;
        ctx.beginPath();
        ctx.roundRect(bar.x, y, bar.w, bar.h, 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();

    // Resize listener
    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth || 300;
        bars.forEach((bar, idx) => {
          bar.x = (idx * (width / 45));
          bar.w = (width / 45) - 3;
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive]);

  return (
    <div className={`w-full flex items-center justify-center bg-gray-50 border border-brandBorder rounded-lg p-3 ${className}`}>
      <canvas ref={canvasRef} className="w-full h-10 block" />
    </div>
  );
};
