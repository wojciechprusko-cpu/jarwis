import React, { useState } from 'react';
import { BookOpen, Search, Plus, Trash2, Download, Upload, Sparkles, Check, Edit2, ShieldAlert, GraduationCap, Zap } from 'lucide-react';

interface MemoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  learnedCommands: Record<string, string>;
  onSaveCommand: (cmd: string, resp: string) => void;
  onDeleteCommand: (cmd: string) => void;
  onImportMemory: (memory: Record<string, string>) => void;
  onExportMemory: () => void;
  onOpenTraining?: () => void;
}

export function MemoryManager({
  isOpen,
  onClose,
  learnedCommands,
  onSaveCommand,
  onDeleteCommand,
  onImportMemory,
  onExportMemory,
  onOpenTraining,
}: MemoryManagerProps) {
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const defaultCommands = [
    { key: 'cześć', val: 'Witaj! W czym mogę Ci dzisiaj pomóc?', type: 'wbudowana' },
    { key: 'godzina', val: 'Zwraca bieżący czas systemowy (np. Jest godzina 14:32:10.)', type: 'dynamiczna funkcja' },
    { key: 'data', val: 'Zwraca bieżącą datę (np. Dzisiaj jest 30.08.2026.)', type: 'dynamiczna funkcja' },
    { key: 'kto cię stworzył', val: 'Zostałem stworzony jako prosty model AI w Pythonie.', type: 'wbudowana' },
  ];

  const learnedEntries = Object.entries(learnedCommands);
  const filteredLearned = learnedEntries.filter(
    ([k, v]) =>
      k.toLowerCase().includes(search.toLowerCase()) ||
      v.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartEdit = (key: string, val: string) => {
    setEditingKey(key);
    setEditValue(val);
  };

  const handleSaveEdit = (key: string) => {
    if (editValue.trim()) {
      onSaveCommand(key, editValue.trim());
    }
    setEditingKey(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    onSaveCommand(newKey.trim().toLowerCase(), newValue.trim());
    setNewKey('');
    setNewValue('');
    setShowAddForm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (typeof json === 'object' && json !== null) {
          onImportMemory(json);
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 2000);
        }
      } catch (err) {
        alert('Błąd odczytu pliku JSON: ' + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-['Orbitron']">
                Baza Pamięci Jarvisa (jarvis_memory.json)
              </h2>
              <p className="text-xs text-slate-400">
                Wszystkie reguły i wyuczone schematy odpowiedzi asystenta.
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
        <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtruj komendy i odpowiedzi..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {onOpenTraining && (
              <button
                onClick={onOpenTraining}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 hover:from-cyan-500/40 hover:to-purple-500/40 border border-cyan-400/50 text-cyan-200 text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
                title="Otwórz centrum szkolenia z pakietami wiedzy Starka, Pythona i Cyberbezpieczeństwa"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Podszkol Jarvisa</span>
              </button>
            )}

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Dodaj regułę
            </button>

            <button
              onClick={onExportMemory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-colors"
              title="Pobierz plik jarvis_memory.json"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Eksportuj JSON
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importuj</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {importSuccess && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Pomyślnie zaimportowano plik pamięci JSON!</span>
          </div>
        )}

        {/* Add Form Accordion */}
        {showAddForm && (
          <form
            onSubmit={handleAddNew}
            className="p-4 bg-slate-800/90 border-b border-amber-500/30 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold font-['Orbitron']">
              <span>NOWA KOMENDA</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Komenda (np. hasło alarmu)"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                required
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Odpowiedź Jarvisa (np. Kod alarmu to 7890)"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Zapisz
              </button>
            </div>
          </form>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Default built-in commands section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 font-['Orbitron'] mb-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              KOMENDY PODSTAWOWE (Z kodu Python):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {defaultCommands.map((dc) => (
                <div
                  key={dc.key}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['Fira_Code'] text-xs font-bold text-cyan-300">
                      "{dc.key}"
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                      {dc.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{dc.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* User learned commands section */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 font-['Orbitron'] mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                KOMENDY WYUCZONE ({learnedEntries.length}):
              </span>
              <span className="text-[11px] text-slate-400 font-sans font-normal">
                Format: <code className="text-amber-300">ucz się [komenda] = [odpowiedź]</code>
              </span>
            </h3>

            {learnedEntries.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-800/30 border border-dashed border-slate-700 text-slate-400 text-xs">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-amber-500/60" />
                <p className="font-semibold text-slate-300">Baza nauczonych komend jest pusta.</p>
                <p className="mt-1">
                  Wpisz w terminalu <code className="text-amber-300">ucz się pogoda = Sprawdź prognozę</code> lub kliknij "Dodaj regułę" powyżej.
                </p>
              </div>
            ) : filteredLearned.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                Brak wyników dla wyszukiwania "{search}".
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLearned.map(([key, val]) => (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-['Fira_Code'] text-xs font-bold text-amber-300">
                          "{key}"
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">➜</span>
                      </div>

                      {editingKey === key ? (
                        <div className="flex items-center gap-2 mt-1.5">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-2 py-1 rounded bg-slate-900 border border-amber-500 text-slate-100 text-xs focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(key)}
                            className="px-2.5 py-1 rounded bg-amber-600 text-slate-950 font-bold text-xs"
                          >
                            Zapisz
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs"
                          >
                            Anuluj
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-200 mt-1 whitespace-pre-wrap">{val}</p>
                      )}
                    </div>

                    {editingKey !== key && (
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleStartEdit(key, val)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-700 transition-colors"
                          title="Edytuj odpowiedź"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCommand(key)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                          title="Usuń z pamięci"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Pamięć jest automatycznie zapisywana lokalnie oraz w pliku pamięci.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
