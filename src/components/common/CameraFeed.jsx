import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Video, Mic, RefreshCw, AlertCircle } from 'lucide-react';

export const CameraFeed = ({
  isRecording = false,
  muted = false,
  cameraActive = true,
  className = '',
}) => {
  const [deviceStatus, setDeviceStatus] = useState('checking'); // 'checking' | 'active' | 'paused' | 'denied'
  const [hasRealCamera, setHasRealCamera] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Request real webcam feed from navigator.mediaDevices
  useEffect(() => {
    let currentStream = null;

    const startWebcam = async () => {
      if (!cameraActive) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setDeviceStatus('paused');
        return;
      }

      setDeviceStatus('checking');
      setErrorMessage('');

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            },
            audio: false
          });

          currentStream = stream;
          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play().catch(() => {});
            };
          }

          setHasRealCamera(true);
          setDeviceStatus('active');
        } else {
          throw new Error('Webcam media device API is not supported in this browser.');
        }
      } catch (err) {
        console.warn('Webcam stream unavailable, falling back to simulated feed:', err.message);
        setErrorMessage(err.message);
        setHasRealCamera(false);
        setDeviceStatus('active'); // allow simulated fallback so user is not blocked
      }
    };

    startWebcam();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive]);

  // Re-attach video stream if ref mounts
  useEffect(() => {
    if (hasRealCamera && streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [hasRealCamera, deviceStatus]);

  // Fallback animation on canvas if no physical camera or permission denied
  useEffect(() => {
    if (hasRealCamera || deviceStatus !== 'active' || !cameraActive) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = 640);
    let height = (canvas.height = 480);

    let particles = [];
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 3 + 1,
        color: `rgba(37, 99, 235, ${Math.random() * 0.3 + 0.1})`
      });
    }

    const drawFallback = () => {
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
      grad.addColorStop(0, '#1E293B');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Silhouette
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2.5, 75, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(width / 2, height + 30, 150, 100, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ambient exposure
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.fillRect(0, 0, width, height);

      // Particles
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

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 3, 0); ctx.lineTo(width / 3, height);
      ctx.moveTo((width / 3) * 2, 0); ctx.lineTo((width / 3) * 2, height);
      ctx.moveTo(0, height / 3); ctx.lineTo(width, height / 3);
      ctx.moveTo(0, (height / 3) * 2); ctx.lineTo(width, (height / 3) * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('WebCam Feed (Simulated Preview)', 20, height - 20);

      animationRef.current = requestAnimationFrame(drawFallback);
    };

    drawFallback();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [hasRealCamera, deviceStatus, cameraActive]);

  return (
    <div className={`relative bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800 aspect-video ${className}`}>
      
      {/* Real Live Webcam Video Feed */}
      {hasRealCamera && cameraActive && deviceStatus === 'active' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
      )}

      {/* Fallback Simulation Canvas if no hardware webcam */}
      {!hasRealCamera && cameraActive && deviceStatus === 'active' && (
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
      )}

      {/* Checking / Loading State */}
      {deviceStatus === 'checking' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-slate-950/80 backdrop-blur-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-semibold mt-3 text-slate-200">Initializing camera feed...</span>
        </div>
      )}

      {/* Paused / Disabled State */}
      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-slate-950">
          <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-2">
            <CameraOff className="w-7 h-7" />
          </div>
          <span className="text-sm font-bold text-slate-200">Camera Feed Paused</span>
          <span className="text-xs text-slate-500 max-w-xs leading-normal mt-1">
            Click the Camera button below to re-enable your live video feed.
          </span>
        </div>
      )}

      {/* Status Badges Overlay */}
      {cameraActive && deviceStatus === 'active' && (
        <>
          {/* Top recording indicator */}
          <div className="absolute top-3 left-3 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-md">
            <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-brandDanger animate-pulse' : 'bg-brandSuccess'}`} />
            <span className="text-[10px] font-bold tracking-wider text-slate-200 uppercase">
              {isRecording ? 'LIVE RECORDING' : hasRealCamera ? 'HD CAMERA LIVE' : 'CAMERA ACTIVE'}
            </span>
          </div>

          {/* Device configuration badge */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-semibold text-slate-300 shadow-md">
            <Mic className={`w-3.5 h-3.5 ${muted ? 'text-brandDanger' : 'text-brandSuccess'}`} />
            <span>{muted ? 'MUTED' : 'MIC ACTIVE'}</span>
          </div>
        </>
      )}

    </div>
  );
};

export default CameraFeed;
