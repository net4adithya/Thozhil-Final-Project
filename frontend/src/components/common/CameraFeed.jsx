import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Video, Mic, RefreshCw, AlertCircle } from 'lucide-react';

export const CameraFeed = ({
  isRecording = false,
  muted = false,
  cameraActive = true,
  className = '',
}) => {
  const [deviceStatus, setDeviceStatus] = useState('checking'); // 'checking' | 'active' | 'denied'
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Simulate user allowing camera access
    const timer = setTimeout(() => {
      setDeviceStatus(cameraActive ? 'active' : 'denied');
    }, 800);

    return () => clearTimeout(timer);
  }, [cameraActive]);

  // Simulate video stream rendering onto canvas
  useEffect(() => {
    if (deviceStatus !== 'active' || !cameraActive) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = 640;
    let height = canvas.height = 480;

    let particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 3 + 1,
        color: `rgba(37, 99, 235, ${Math.random() * 0.3 + 0.1})` // Blue highlight particles
      });
    }

    const drawSimulatedCamera = () => {
      // Background gradient representing office background reflection
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
      grad.addColorStop(0, '#1E293B'); // slate 800
      grad.addColorStop(1, '#0F172A'); // slate 900
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw silhouette representing candidate head
      ctx.fillStyle = '#334155'; // slate 700
      ctx.beginPath();
      // Head
      ctx.arc(width / 2, height / 2.5, 75, 0, Math.PI * 2);
      ctx.fill();
      // Shoulders
      ctx.beginPath();
      ctx.ellipse(width / 2, height + 30, 150, 100, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ambient light effect representing camera exposure adjustments
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.fillRect(0, 0, width, height);

      // Draw moving particles representing ambient video compression noise
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Guide grid overlay (looks professional)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      // Verticals
      ctx.beginPath();
      ctx.moveTo(width / 3, 0); ctx.lineTo(width / 3, height);
      ctx.moveTo((width / 3) * 2, 0); ctx.lineTo((width / 3) * 2, height);
      // Horizontals
      ctx.moveTo(0, height / 3); ctx.lineTo(width, height / 3);
      ctx.moveTo(0, (height / 3) * 2); ctx.lineTo(width, (height / 3) * 2);
      ctx.stroke();

      // Status text indicator overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('1080p WebCam (Simulated Feed)', 20, height - 20);

      animationRef.current = requestAnimationFrame(drawSimulatedCamera);
    };

    drawSimulatedCamera();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [deviceStatus, cameraActive]);

  return (
    <div className={`relative bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800 aspect-video ${className}`}>
      {/* Active stream canvas */}
      {deviceStatus === 'active' && cameraActive ? (
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
          {deviceStatus === 'checking' ? (
            <div className="flex flex-col items-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-semibold">Configuring media stream...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2.5">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                <CameraOff className="w-7 h-7" />
              </div>
              <span className="text-sm font-bold text-slate-200">Video Capture Paused</span>
              <span className="text-xs text-slate-500 max-w-xs leading-normal">
                Make sure camera permissions are enabled in your settings configuration.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Badges and overlays */}
      {deviceStatus === 'active' && cameraActive && (
        <>
          {/* Top recording indicator */}
          <div className="absolute top-3 left-3 flex items-center space-x-2 bg-slate-950/70 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-brandDanger animate-pulse' : 'bg-brandSuccess'}`} />
            <span className="text-[10px] font-bold tracking-wider text-slate-200 uppercase">
              {isRecording ? 'LIVE RECORDING' : 'CAMERA ACTIVE'}
            </span>
          </div>

          {/* Device configurations badge */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-2 bg-slate-950/70 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-semibold text-slate-300">
            <Mic className={`w-3.5 h-3.5 ${muted ? 'text-brandDanger' : 'text-brandSuccess'}`} />
            <span>{muted ? 'MUTED' : 'MIC ACTIVE'}</span>
          </div>
        </>
      )}
    </div>
  );
};
