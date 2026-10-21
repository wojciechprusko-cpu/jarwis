import { useState } from 'react';
import { JarvisState } from '../types';

const jarvisCoreImg = '/jarvis_core_matrix.jpg';

interface ArcReactorProps {
  state: JarvisState;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ArcReactor({ state, onClick, size = 'md' }: ArcReactorProps) {
  const [imgLoaded, setImgLoaded] = useState(true);

  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-52 h-52 sm:w-60 sm:h-60',
    lg: 'w-64 h-64 sm:w-80 sm:h-80',
  }[size];

  const stateColors = {
    idle: {
      glow: 'shadow-[0_0_50px_rgba(245,158,11,0.45)]',
      border: 'border-amber-500/50',
      ring: 'border-amber-400',
      core: 'from-amber-500/40 via-orange-500/30 to-amber-900/40',
      text: 'text-amber-400',
      label: 'JARVIS ONLINE',
    },
    listening: {
      glow: 'shadow-[0_0_70px_rgba(239,68,68,0.65)]',
      border: 'border-red-500/70',
      ring: 'border-red-400',
      core: 'from-red-500/50 via-amber-600/40 to-red-950/50',
      text: 'text-red-400',
      label: 'SŁUCHAM...',
    },
    processing: {
      glow: 'shadow-[0_0_65px_rgba(168,85,247,0.6)]',
      border: 'border-purple-500/70',
      ring: 'border-purple-400',
      core: 'from-purple-500/50 via-indigo-600/40 to-purple-950/50',
      text: 'text-purple-400',
      label: 'PRZETWARZANIE',
    },
    speaking: {
      glow: 'shadow-[0_0_70px_rgba(34,197,94,0.6)]',
      border: 'border-emerald-500/70',
      ring: 'border-emerald-400',
      core: 'from-emerald-500/50 via-teal-600/40 to-emerald-950/50',
      text: 'text-emerald-400',
      label: 'ODPOWIADAM',
    },
    learning: {
      glow: 'shadow-[0_0_65px_rgba(234,179,8,0.6)]',
      border: 'border-amber-400/70',
      ring: 'border-amber-300',
      core: 'from-amber-400/50 via-yellow-500/40 to-amber-950/50',
      text: 'text-amber-300',
      label: 'UCZENIE PAMIĘCI',
    },
    offline: {
      glow: 'shadow-[0_0_20px_rgba(100,116,139,0.2)]',
      border: 'border-slate-700',
      ring: 'border-slate-600',
      core: 'from-slate-700/30 to-slate-900/30',
      text: 'text-slate-500',
      label: 'STANDBY / OFFLINE',
    },
  }[state];

  return (
    <div
      id="jarvis-arc-reactor"
      onClick={onClick}
      className={`relative ${sizeClasses} mx-auto flex items-center justify-center cursor-pointer select-none group transition-transform duration-300 hover:scale-105`}
      title="Kliknij, aby aktywować lub przełączyć asystenta głosowego"
    >
      {/* Ambient outer aura glow */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 ${stateColors.glow} opacity-90`}
      />

      {/* Rotating outer segmented ring with tech marks */}
      <div
        className={`absolute inset-1 rounded-full border border-dashed ${stateColors.border} animate-[spin_30s_linear_infinite] opacity-80`}
      />

      {/* Counter-rotating dotted telemetry ring */}
      <div
        className={`absolute inset-3 sm:inset-4 rounded-full border border-dotted ${stateColors.border} animate-[spin_18s_linear_infinite_reverse] opacity-70`}
      />

      {/* Outer metallic HUD chassis */}
      <div className="absolute inset-5 sm:inset-6 rounded-full bg-slate-950/95 border border-amber-500/30 flex items-center justify-center shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Radial tick marks */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-40 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 -ml-[1px] w-[2px] h-3.5 bg-amber-400/80 origin-bottom"
              style={{ transform: `rotate(${i * 30}deg) translateY(2px)` }}
            />
          ))}
        </div>

        {/* Dynamic inner spinning ring with notches */}
        <div
          className={`absolute inset-2 sm:inset-3 rounded-full border-2 ${stateColors.ring} border-t-transparent border-b-transparent animate-[spin_6s_linear_infinite] opacity-75`}
        />

        {/* Second inner pulsing ring */}
        <div
          className={`absolute inset-5 sm:inset-6 rounded-full border border-amber-400/50 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] ${
            state === 'listening' ? 'opacity-95 border-red-400' : 'opacity-30'
          }`}
        />

        {/* Central Holographic Matrix Sphere Core */}
        <div
          className={`relative w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr ${stateColors.core} flex flex-col items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.6)] transition-all duration-500 overflow-hidden border border-amber-400/40`}
        >
          {imgLoaded ? (
            <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {/* Hologram spherical image */}
              <img
                src={jarvisCoreImg}
                alt="JARVIS Holographic Neural Core"
                className={`w-full h-full object-cover object-center scale-105 rounded-full transition-transform duration-700 group-hover:scale-110 ${
                  state === 'listening'
                    ? 'hue-rotate-[320deg] brightness-125 saturate-150 animate-pulse'
                    : state === 'speaking'
                    ? 'hue-rotate-[90deg] brightness-125'
                    : state === 'processing'
                    ? 'hue-rotate-[240deg] brightness-110'
                    : 'animate-[spin_40s_linear_infinite]'
                }`}
                onError={() => setImgLoaded(false)}
                referrerPolicy="no-referrer"
              />

              {/* Radial gradient mask overlay for holographic blending */}
              <div className="absolute inset-0 rounded-full bg-radial from-transparent via-transparent to-black/80 pointer-events-none" />

              {/* Central Glowing HUD text badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="px-2 py-0.5 rounded-full bg-black/60 border border-amber-400/40 backdrop-blur-xs shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                  <span className="font-['Orbitron'] font-bold text-[10px] sm:text-xs tracking-widest text-amber-200 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]">
                    JARVIS
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-950/80 border border-amber-400/50 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <span className="font-['Orbitron'] font-bold text-xs sm:text-sm tracking-wider text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                JARVIS
              </span>
            </div>
          )}

          {/* Dynamic state pulse overlay */}
          {state === 'listening' && (
            <div className="absolute inset-0 rounded-full bg-red-500/25 animate-pulse pointer-events-none" />
          )}
          {state === 'speaking' && (
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-pulse pointer-events-none" />
          )}
        </div>
      </div>

      {/* Floating status label at bottom */}
      <div className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/95 border border-amber-500/40 shadow-lg">
          <span
            className={`w-2 h-2 rounded-full ${
              state === 'idle'
                ? 'bg-amber-400 animate-pulse'
                : state === 'listening'
                ? 'bg-red-500 animate-ping'
                : state === 'speaking'
                ? 'bg-emerald-400 animate-pulse'
                : state === 'processing'
                ? 'bg-purple-400 animate-bounce'
                : 'bg-amber-400'
            }`}
          />
          <span className={`font-['Orbitron'] text-[10px] sm:text-xs font-semibold tracking-wider ${stateColors.text}`}>
            {stateColors.label}
          </span>
        </div>
      </div>
    </div>
  );
}
