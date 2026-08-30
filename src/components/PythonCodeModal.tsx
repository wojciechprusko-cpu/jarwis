import React, { useState } from 'react';
import { Code, Copy, Check, Terminal, Download } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PYTHON_SOURCE = `import json
import datetime
import os

class AdvancedJarvis:
    def __init__(self, memory_file='jarvis_memory.json'):
        self.memory_file = memory_file
        # Podstawowe komendy i ich odpowiedzi lub funkcje
        self.commands = {
            'cześć': 'Witaj! W czym mogę Ci dzisiaj pomóc?',
            'godzina': self.get_time,
            'data': self.get_date,
            'kto cię stworzył': 'Zostałem stworzony jako prosty model AI w Pythonie.'
        }
        self.load_memory()

    def get_time(self):
        return f"Jest godzina {datetime.datetime.now().strftime('%H:%M:%S')}."

    def get_date(self):
        return f"Dzisiaj jest {datetime.datetime.now().strftime('%d.%m.%Y')}."

    def load_memory(self):
        """Wczytuje nauczone komendy z pliku JSON, jeśli istnieje."""
        if os.path.exists(self.memory_file):
            with open(self.memory_file, 'r', encoding='utf-8') as f:
                learned = json.load(f)
                self.commands.update(learned)

    def save_memory(self, command, response):
        """Zapisuje nową komendę do pliku JSON, by pamiętać ją na przyszłość."""
        learned = {}
        if os.path.exists(self.memory_file):
            with open(self.memory_file, 'r', encoding='utf-8') as f:
                learned = json.load(f)
        
        learned[command.lower()] = response
        with open(self.memory_file, 'w', encoding='utf-8') as f:
            json.dump(learned, f, ensure_ascii=False, indent=4)

    def respond(self, message):
        message = message.lower().strip()
        
        # Sprawdza, czy któraś komenda jest zawarta w wiadomości
        for key in self.commands:
            if key in message:
                result = self.commands[key]
                # Jeśli odpowiedź to funkcja, wywołaj ją
                return result() if callable(result) else result
        
        return 'Nie wiem co powiedzieć. Naucz mnie wpisując: ucz się [komenda] = [odpowiedź]'

    def chat(self):
        print("--- Jarvis System Aktywny ---")
        print("Komendy specjalne: 'wyjście', 'ucz się [komenda] = [odpowiedź]'")
        
        while True:
            user_input = input('Ty > ')
            
            if user_input.lower() in ['wyjście', 'exit', 'papa']:
                print('Jarvis: System wyłączony. Do widzenia, Proszę Pana.')
                break
            
            elif 'ucz się' in user_input.lower():
                try:
                    # Format: ucz się komenda = odpowiedź
                    parts = user_input.replace('ucz się', '').split('=')
                    cmd = parts[0].strip().lower()
                    resp = parts[1].strip()
                    self.commands[cmd] = resp
                    self.save_memory(cmd, resp)
                    print(f'Jarvis: Zrozumiałem. Od teraz na "{cmd}" odpowiadam: "{resp}"')
                except IndexError:
                    print('Jarvis: Użyj formatu: ucz się [komenda] = [odpowiedź]')
            
            else:
                response = self.respond(user_input)
                print(f'Jarvis: {response}')

if __name__ == '__main__':
    jarvis = AdvancedJarvis()
    jarvis.chat()
`;

export function PythonCodeModal({ isOpen, onClose }: PythonCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_SOURCE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_SOURCE], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'advanced_jarvis.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-['Orbitron']">
                Kod Źródłowy Python (advanced_jarvis.py)
              </h2>
              <p className="text-xs text-slate-400">
                Oryginalna implementacja z obsługą pamięci JSON i komendami dynamicznymi.
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

        {/* Toolbar */}
        <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Uruchom lokalnie: <code className="text-cyan-300">python3 advanced_jarvis.py</code></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Skopiowano!' : 'Kopiuj kod'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Pobierz .py
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-['Fira_Code'] text-xs leading-relaxed text-slate-300">
          <pre className="overflow-x-auto">
            <code>{PYTHON_SOURCE}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
