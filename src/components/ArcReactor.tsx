import { JarvisState } from '../types';

interface ArcReactorProps {
  state: JarvisState;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ArcReactor({ state, onClick, size = 'md' }: ArcReactorProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-44 h-44 sm:w-52 sm:h-52',
    lg: 'w-60 h-60 sm:w-72 sm:h-72',
  }[size];

  const stateColors = {
    idle: {
      glow: 'shadow-[0_0_50px_rgba(6,182,212,0.35)]',
      border: 'border-cyan-500/40',
      ring: 'border-cyan-400',
      core: 'from-cyan-400 to-blue-600',
      text: 'text-cyan-400',
      label: 'SYSTEM ONLINE',
    },
    listening: {
      glow: 'shadow-[0_0_70px_rgba(239,68,68,0.6)]',
      border: 'border-red-500/60',
      ring: 'border-red-400',
      core: 'from-red-500 to-amber-600',
      text: 'text-red-400',
      label: 'SŁUCHAM...',
    },
    processing: {
      glow: 'shadow-[0_0_60px_rgba(168,85,247,0.5)]',
      border: 'border-purple-500/60',
      ring: 'border-purple-400',
      core: 'from-purple-400 to-indigo-600',
      text: 'text-purple-400',
      label: 'PRZETWARZANIE',
    },
    speaking: {
      glow: 'shadow-[0_0_65px_rgba(34,197,94,0.55)]',
      border: 'border-emerald-500/60',
      ring: 'border-emerald-400',
      core: 'from-emerald-400 to-teal-600',
      text: 'text-emerald-400',
      label: 'ODPOWIADAM',
    },
    learning: {
      glow: 'shadow-[0_0_60px_rgba(234,179,8,0.55)]',
      border: 'border-amber-500/60',
      ring: 'border-amber-400',
      core: 'from-amber-400 to-orange-600',
      text: 'text-amber-400',
      label: 'UCZENIE PAMIĘCI',
    },
    offline: {
      glow: 'shadow-[0_0_20px_rgba(100,116,139,0.2)]',
      border: 'border-slate-700',
      ring: 'border-slate-600',
      core: 'from-slate-700 to-slate-900',
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

      {/* Rotating outer segmented ring */}
      <div
        className={`absolute inset-1 rounded-full border border-dashed ${stateColors.border} animate-[spin_20s_linear_infinite] opacity-70`}
      />

      {/* Counter-rotating segmented ring */}
      <div
        className={`absolute inset-3.5 rounded-full border border-dotted ${stateColors.border} animate-[spin_12s_linear_infinite_reverse] opacity-60`}
      />

      {/* Outer metallic HUD chassis */}
      <div className="absolute inset-5 rounded-full bg-slate-950/90 border border-slate-800 flex items-center justify-center shadow-inner backdrop-blur-md">
        {/* Radial tick marks */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 -ml-[1px] w-[2px] h-3 bg-cyan-400 origin-bottom"
              style={{ transform: `rotate(${i * 30}deg) translateY(2px)` }}
            />
          ))}
        </div>

        {/* Dynamic inner spinning ring with notches */}
        <div
          className={`absolute inset-3 rounded-full border-2 ${stateColors.ring} border-t-transparent border-b-transparent animate-[spin_4s_linear_infinite]`}
        />

        {/* Second inner glowing ring */}
        <div
          className={`absolute inset-6 rounded-full border border-cyan-400/40 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] ${
            state === 'listening' ? 'opacity-90' : 'opacity-20'
          }`}
        />

        {/* Central Core */}
        <div
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr ${stateColors.core} flex flex-col items-center justify-center shadow-lg transition-all duration-500`}
        >
          {/* Inner core pattern */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-950/80 border border-white/30 flex items-center justify-center backdrop-blur-sm shadow-inner">
            <span className="font-['Orbitron'] font-bold text-xs sm:text-sm tracking-wider text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
              JARVIS
            </span>
          </div>

          {/* Pulsing light sweep */}
          {state === 'listening' && (
            <div className="absolute inset-0 rounded-full bg-red-400/30 animate-pulse" />
          )}
        </div>
      </div>

      {/* Floating status label at bottom */}
      <div className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-md">
          <span
            className={`w-2 h-2 rounded-full ${
              state === 'idle'
                ? 'bg-cyan-400 animate-pulse'
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
