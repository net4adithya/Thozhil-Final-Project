import React from 'react';

/**
 * FluidWaveGraphic Component
 * A handcrafted, high-fidelity SVG fluid wave backdrop featuring:
 * - Multi-layered azure & royal blue gradient waves with organic swell and crest curves
 * - Luminous neon-purple/magenta and electric-cyan glowing curved ribbons
 * - Subtle floating breathing animation and soft ambient glow
 * - Scalable responsive vector geometry matching user reference aesthetics
 */
export const FluidWaveGraphic = ({ 
  className = '', 
  variant = 'hero', // 'hero' | 'cta' | 'divider'
  height = 320,
  animated = true 
}) => {
  return (
    <div className={`relative w-full overflow-hidden select-none pointer-events-none ${className}`}>
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/2" />
      <div className="absolute bottom-0 left-1/2 w-[800px] h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />

      <svg
        viewBox="0 0 1440 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block min-w-[1000px] lg:min-w-full"
        style={{ height: height ? `${height}px` : 'auto', maxHeight: '420px' }}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Main Hero Azure Wave Gradient */}
          <linearGradient id="heroMainWaveGrad" x1="0%" y1="30%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="28%" stopColor="#1d4ed8" />
            <stop offset="55%" stopColor="#0284c7" />
            <stop offset="78%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Secondary Translucent Wave Gradient */}
          <linearGradient id="heroSecWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="80%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.35" />
          </linearGradient>

          {/* Third Soft Deep Base Wave Gradient */}
          <linearGradient id="heroBaseWaveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e40af" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#2563eb" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.75" />
          </linearGradient>

          {/* Purple / Magenta Neon Ribbon Gradient */}
          <linearGradient id="neonPurpleRibbon" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="35%" stopColor="#a855f7" />
            <stop offset="70%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>

          {/* Electric Cyan Neon Ribbon Gradient */}
          <linearGradient id="neonCyanRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="40%" stopColor="#22d3ee" />
            <stop offset="75%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>

          {/* Secondary Accent Ribbon Gradient */}
          <linearGradient id="neonAccentRibbon" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
          </linearGradient>

          {/* Soft Glow Filter for Purple Ribbon */}
          <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="3.5" floodColor="#a855f7" floodOpacity="0.45" />
          </filter>

          {/* Soft Glow Filter for Cyan Ribbon */}
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="3.5" floodColor="#22d3ee" floodOpacity="0.5" />
          </filter>

          {/* Subtle Wave Top Edge Shadow */}
          <filter id="waveTopShadow" x="-5%" y="-15%" width="110%" height="130%">
            <feDropShadow dx="0" dy="-4" stdDeviation="8" floodColor="#0284c7" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* -------------------------------------------------- */}
        {/* Layer 1: Background Soft Atmospheric Wave          */}
        {/* -------------------------------------------------- */}
        <path
          d="M0,260 
             C180,210 320,180 510,230 
             C700,280 840,160 1020,130 
             C1180,105 1310,170 1440,210 
             L1440,380 L0,380 Z"
          fill="url(#heroSecWaveGrad)"
          className={animated ? 'animate-[pulse_7s_ease-in-out_infinite]' : ''}
        />

        {/* -------------------------------------------------- */}
        {/* Layer 2: Middle Soft Base Wave with Depth         */}
        {/* -------------------------------------------------- */}
        <path
          d="M0,290 
             C160,260 300,225 440,245 
             C620,270 760,240 920,175 
             C1060,118 1220,155 1440,240 
             L1440,380 L0,380 Z"
          fill="url(#heroBaseWaveGrad)"
          opacity="0.45"
        />

        {/* -------------------------------------------------- */}
        {/* Layer 3: Main Foreground Fluid Wave                */}
        {/* Shape precisely matching the user reference:       */}
        {/* - Gentle swell on left (x=160, y=210)              */}
        {/* - Valley dip at center (x=520, y=275)              */}
        {/* - Majestic high crest at right (x=980, y=105)      */}
        {/* - Gentle descent to right edge (x=1440, y=240)     */}
        {/* -------------------------------------------------- */}
        <path
          d="M0,240 
             C140,210 220,195 340,225 
             C460,255 580,285 700,275 
             C820,265 890,175 990,105 
             C1090,38 1220,160 1340,215 
             C1390,238 1420,245 1440,248 
             L1440,380 L0,380 Z"
          fill="url(#heroMainWaveGrad)"
          filter="url(#waveTopShadow)"
        />

        {/* Subtle highlight sheen along the main wave crest */}
        <path
          d="M0,240 
             C140,210 220,195 340,225 
             C460,255 580,285 700,275 
             C820,265 890,175 990,105 
             C1090,38 1220,160 1340,215 
             C1390,238 1420,245 1440,248"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.75"
          fill="none"
        />

        {/* -------------------------------------------------- */}
        {/* Layer 4: Neon Purple Curved Ribbon                 */}
        {/* Arches up from bottom left, dives through center   */}
        {/* -------------------------------------------------- */}
        <path
          d="M110,290 
             C190,230 260,165 370,165 
             C490,165 570,240 680,270 
             C790,300 900,260 1020,190 
             C1120,130 1260,180 1390,245"
          stroke="url(#neonPurpleRibbon)"
          strokeWidth="3.25"
          strokeLinecap="round"
          fill="none"
          filter="url(#purpleGlow)"
          className={animated ? 'transition-all duration-700 hover:opacity-100' : ''}
        />

        {/* Secondary Hairline Purple Ribbon for depth */}
        <path
          d="M135,305 
             C210,245 280,180 390,180 
             C505,180 585,250 695,280 
             C805,310 915,270 1035,200 
             C1135,140 1275,190 1405,255"
          stroke="url(#neonPurpleRibbon)"
          strokeWidth="1.25"
          strokeOpacity="0.4"
          fill="none"
        />

        {/* -------------------------------------------------- */}
        {/* Layer 5: Electric Cyan Curved Ribbon               */}
        {/* Soars across and leaps over the grand wave crest   */}
        {/* -------------------------------------------------- */}
        <path
          d="M200,310 
             C290,285 360,230 450,210 
             C550,188 640,220 740,235 
             C840,250 900,210 990,130 
             C1080,50 1190,70 1320,150 
             C1380,185 1420,205 1440,215"
          stroke="url(#neonCyanRibbon)"
          strokeWidth="3.25"
          strokeLinecap="round"
          fill="none"
          filter="url(#cyanGlow)"
        />

        {/* Complementary Cyan Hairline Ribbon */}
        <path
          d="M225,325 
             C310,300 380,245 470,225 
             C570,203 660,235 760,250 
             C860,265 920,225 1010,145 
             C1100,65 1210,85 1340,165"
          stroke="url(#neonCyanRibbon)"
          strokeWidth="1.5"
          strokeOpacity="0.45"
          fill="none"
        />

        {/* Fine Floating Micro-accent Curves */}
        <path
          d="M620,220 C710,195 800,160 880,135"
          stroke="url(#neonAccentRibbon)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeOpacity="0.6"
          fill="none"
        />

        {/* Glowing Apex Particle Nodes at Crest Overlaps */}
        <circle cx="370" cy="165" r="3.5" fill="#e879f9" opacity="0.85" filter="url(#purpleGlow)" />
        <circle cx="990" cy="105" r="4" fill="#67e8f9" opacity="0.9" filter="url(#cyanGlow)" />
        <circle cx="1020" cy="190" r="3" fill="#a855f7" opacity="0.75" />
        <circle cx="1190" cy="70" r="3.5" fill="#38bdf8" opacity="0.85" filter="url(#cyanGlow)" />
      </svg>

      {/* Seamless bottom fade into page body */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />
    </div>
  );
};

export default FluidWaveGraphic;
