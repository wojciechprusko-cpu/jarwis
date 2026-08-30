import React, { useState } from 'react';
import { BookOpen, Sparkles, Check, HelpCircle, Zap, GraduationCap } from 'lucide-react';

interface TeachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeach: (command: string, response: string) => void;
  onOpenTraining?: () => void;
}

export function TeachModal({ isOpen, onClose, onTeach, onOpenTraining }: TeachModalProps) {
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !response.trim()) return;

    onTeach(command.trim().toLowerCase(), response.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setCommand('');
      setResponse('');
      onClose();
    }, 1000);
  };

  const samplePresets = [
    { cmd: 'jaka jest pogoda', resp: 'Najlepiej spojrzeć przez okno lub zapytać o prognozę meteo!' },
    { cmd: 'ulubiony film', resp: 'Oczywiście Iron Man (2008) oraz Avengers!' },
    { cmd: 'kto jest szefem', resp: 'Oczywiście Pan, Sir.' },
    { cmd: 'protokół domowy', resp: 'Światła przyciemnione do 40%, temperatura optymalna 21.5°C.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-['Orbitron']">
                Naucz Jarvisa nowej reguły
              </h2>
              <p className="text-xs text-slate-400">
                Składnia Python: <code className="text-amber-400">ucz się [komenda] = [odpowiedź]</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Training Packs Quick Callout */}
        {onOpenTraining && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-gradient-to-r from-cyan-950/70 to-purple-950/70 border border-cyan-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-cyan-200">
              <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Chcesz wgrać gotowe pakiety wiedzy lub włączyć samouczenie?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTraining();
              }}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Zap className="w-3 h-3" />
              <span>Podszkol</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-['Orbitron']">
              1. GDY UŻYTKOWNIK POWIE / WPISZE (Komenda):
            </label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="np. ulubiony napój, hasło do wi-fi, protokół wieczorny"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-medium placeholder:text-slate-600"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-['Orbitron']">
              2. JARVIS MA ODPOWIEDZIEĆ (Odpowiedź):
            </label>
            <textarea
              rows={3}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="np. Twoim ulubionym napojem jest czarna kawa ze szczyptą cynamonu."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-medium placeholder:text-slate-600"
              required
            />
          </div>

          {/* Syntax preview */}
          {command && response && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
              <span className="font-bold block text-amber-400 font-['Orbitron'] mb-1">PODGLĄD SKŁADNI:</span>
              <code>ucz się {command.toLowerCase()} = {response}</code>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Przykłady do szybkiego wypróbowania:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePresets.map((p) => (
                <button
                  type="button"
                  key={p.cmd}
                  onClick={() => {
                    setCommand(p.cmd);
                    setResponse(p.resp);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
                >
                  "{p.cmd}"
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={!command.trim() || !response.trim() || isSaved}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {isSaved ? 'Zapamiętano!' : 'Zapisz w pamięci'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
