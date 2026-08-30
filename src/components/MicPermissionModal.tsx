import React, { useState } from 'react';
import { Mic, ShieldAlert, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { speechService } from '../services/speech';
import { soundFx } from '../services/audio';

interface MicPermissionModalProps {
  isOpen: boolean;
  onGranted: () => void;
  onClose: () => void;
}

export function MicPermissionModal({ isOpen, onGranted, onClose }: MicPermissionModalProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'denied'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequest = async () => {
    setStatus('requesting');
    setErrorMsg(null);
    soundFx.playProcessing();

    try {
      const granted = await speechService.requestMicrophonePermission();
      if (granted) {
        setStatus('idle');
        soundFx.playSuccess();
        onGranted();
      } else {
        setStatus('denied');
        soundFx.playBeep();
        setErrorMsg(
          'Dostęp do mikrofonu został zablokowany lub odrzucony w przeglądarce. Zezwól na mikrofon w ustawieniach strony (ikona kłódki przy pasku adresu URL).'
        );
      }
    } catch (err: any) {
      setStatus('denied');
      setErrorMsg(err?.message || 'Wystąpił błąd podczas autoryzacji mikrofonu.');
    }
  };

  return (
    <div
      id="mic-permission-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Futuristic glowing top bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-['Rajdhani'] uppercase tracking-wide">
              Wymagany dostęp do mikrofonu
            </h3>
            <p className="text-xs text-cyan-400 font-mono">JARVIS AUDIO PROTOCOL // AUTHORIZATION</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          Przed rozpoczęciem rozmowy głosowej z asystentem Jarvis, musisz zezwolić przeglądarce na dostęp do Twojego mikrofonu.
        </p>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 transition-all cursor-pointer"
          >
            Anuluj
          </button>
          <button
            id="btn-confirm-mic-permission"
            type="button"
            onClick={handleRequest}
            disabled={status === 'requesting'}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Mic className="w-4 h-4" />
            <span>{status === 'requesting' ? 'Uzyskiwanie zgody...' : 'Zezwól na mikrofon i rozmawiaj'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
