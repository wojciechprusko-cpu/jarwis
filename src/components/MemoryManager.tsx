import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Check,
  Edit2,
  Zap,
  Clock,
  Pin,
  Lightbulb,
  ShieldCheck,
  Filter,
  MessageSquare,
  AlertCircle,
  Copy,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ConversationEntry, PermanentInsight } from '../types';

interface MemoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  learnedCommands: Record<string, string>;
  onSaveCommand: (cmd: string, resp: string) => void;
  onDeleteCommand: (cmd: string) => void;
  onImportMemory: (memory: Record<string, string>) => void;
  onExportMemory: () => void;
  onOpenTraining?: () => void;
  onMemoryChanged?: () => void;
}

type MemoryTab = 'permanent' | 'conversations' | 'rules';

export function MemoryManager({
  isOpen,
  onClose,
  learnedCommands,
  onSaveCommand,
  onDeleteCommand,
  onImportMemory,
  onExportMemory,
  onOpenTraining,
  onMemoryChanged,
}: MemoryManagerProps) {
  const [activeTab, setActiveTab] = useState<MemoryTab>('permanent');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- TAB 1: PERMANENT INSIGHTS STATE ---
  const [permanentInsights, setPermanentInsights] = useState<PermanentInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddInsightForm, setShowAddInsightForm] = useState(false);
  const [newInsightTitle, setNewInsightTitle] = useState('');
  const [newInsightContent, setNewInsightContent] = useState('');
  const [newInsightType, setNewInsightType] = useState<'tip' | 'fact' | 'directive' | 'note'>('tip');
  const [newInsightCategory, setNewInsightCategory] = useState('Programowanie');

  // --- TAB 2: 14-DAY CONVERSATIONS STATE ---
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationFilter, setConversationFilter] = useState<'all' | 'user' | 'jarvis'>('all');
  const [isPinningId, setIsPinningId] = useState<string | null>(null);

  // --- TAB 3: KEY-VALUE RULES STATE ---
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Fetch permanent notes & conversations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPermanentNotes();
      fetchConversations();
    }
  }, [isOpen]);

  const fetchPermanentNotes = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetch('/api/jarvis/permanent-notes');
      const data = await res.json();
      if (Array.isArray(data.notes)) {
        setPermanentInsights(data.notes);
      }
    } catch (e) {
      console.warn('Failed to fetch permanent notes:', e);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const res = await fetch('/api/jarvis/conversations');
      const data = await res.json();
      if (Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.warn('Failed to fetch conversations:', e);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  if (!isOpen) return null;

  // --- ACTIONS: PERMANENT INSIGHTS ---
  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInsightTitle.trim() || !newInsightContent.trim()) return;

    try {
      const res = await fetch('/api/jarvis/permanent-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newInsightTitle.trim(),
          content: newInsightContent.trim(),
          type: newInsightType,
          category: newInsightCategory.trim() || 'Wskazówki',
        }),
      });
      const data = await res.json();
      if (data.note) {
        setPermanentInsights((prev) => [data.note, ...prev]);
        setNewInsightTitle('');
        setNewInsightContent('');
        setShowAddInsightForm(false);
        onMemoryChanged?.();
      }
    } catch (e) {
      alert('Błąd podczas zapisywania trwałej wskazówki: ' + e);
    }
  };

  const handleDeleteInsight = async (id: string) => {
    try {
      await fetch(`/api/jarvis/permanent-notes/${id}`, { method: 'DELETE' });
      setPermanentInsights((prev) => prev.filter((item) => item.id !== id));
      onMemoryChanged?.();
    } catch (e) {
      alert('Błąd podczas usuwania: ' + e);
    }
  };

  // --- ACTIONS: 14-DAY CONVERSATIONS ---
  const handlePinConversation = async (entry: ConversationEntry) => {
    setIsPinningId(entry.id);
    try {
      const res = await fetch('/api/jarvis/conversations/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: entry.id,
          title: `Zapis z rozmowy (${entry.timestamp})`,
          content: entry.text,
          category: entry.sender === 'user' ? 'Ważne pytania użytkownika' : 'Wskazówki Jarvisa',
        }),
      });
      const data = await res.json();
      if (data.insight) {
        setPermanentInsights((prev) => [data.insight, ...prev]);
        onMemoryChanged?.();
      }
    } catch (e) {
      alert('Błąd podczas przypinania na stałe: ' + e);
    } finally {
      setIsPinningId(null);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/jarvis/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((item) => item.id !== id));
      onMemoryChanged?.();
    } catch (e) {
      alert('Błąd podczas usuwania wpisu: ' + e);
    }
  };

  const handleClearConversations = async () => {
    if (!window.confirm('Czy na pewno chcesz wyczyścić 14-dniową historię rozmów? Trwałe wskazówki pozostaną nienaruszone.')) return;
    try {
      await fetch('/api/jarvis/conversations', { method: 'DELETE' });
      setConversations([]);
      onMemoryChanged?.();
    } catch (e) {
      alert('Błąd: ' + e);
    }
  };

  // --- ACTIONS: KEY-VALUE RULES ---
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

  const handleAddNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    onSaveCommand(newKey.trim().toLowerCase(), newValue.trim());
    setNewKey('');
    setNewValue('');
    setShowAddRuleForm(false);
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

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to calculate days left for 14-day retention
  const getDaysLeft = (isoTimestamp?: string, expiresAt?: string) => {
    if (expiresAt) {
      const exp = new Date(expiresAt).getTime();
      const diff = exp - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.min(14, days));
    }
    if (isoTimestamp) {
      const created = new Date(isoTimestamp).getTime();
      const diff = created + 14 * 24 * 60 * 60 * 1000 - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.min(14, days));
    }
    return 14;
  };

  // Filtered insights
  const categories = ['all', ...Array.from(new Set(permanentInsights.map((i) => i.category || 'Wskazówki')))];
  const filteredInsights = permanentInsights.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filtered conversations
  const filteredConversations = conversations.filter((item) => {
    const matchesSender = conversationFilter === 'all' || item.sender === conversationFilter;
    const matchesSearch =
      item.text.toLowerCase().includes(search.toLowerCase()) ||
      (item.timestamp && item.timestamp.includes(search));
    return matchesSender && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-['Orbitron']">
                  ARCHITEKTURA PAMIĘCI JARVISA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  STARK DUAL-STORE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                14-dniowa pamięć rozmów i pytań + wieczne wskazówki i ważne fakty.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('permanent');
                setSearch('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'permanent'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Stałe Wskazówki & Ważne Rzeczy ({permanentInsights.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('conversations');
                setSearch('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'conversations'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Rozmowy & Pytania (14 Dni) ({conversations.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('rules');
                setSearch('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Reguły Słownika JSON ({learnedEntries.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'permanent' && (
              <button
                onClick={() => setShowAddInsightForm(!showAddInsightForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Dodaj Wskazówkę
              </button>
            )}

            {activeTab === 'conversations' && (
              <button
                onClick={handleClearConversations}
                disabled={conversations.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Wyczyść historię
              </button>
            )}

            {activeTab === 'rules' && (
              <>
                {onOpenTraining && (
                  <button
                    onClick={onOpenTraining}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 hover:from-cyan-500/40 hover:to-purple-500/40 border border-cyan-400/50 text-cyan-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Szkolenie AI</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAddRuleForm(!showAddRuleForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Dodaj Regułę
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'permanent'
                  ? 'Szukaj w stałych wskazówkach i ważnych ustaleniach...'
                  : activeTab === 'conversations'
                  ? 'Szukaj w wypowiedziach i pytaniach z ostatnich 14 dni...'
                  : 'Filtruj komendy i odpowiedzi w pamięci JSON...'
              }
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {activeTab === 'permanent' && categories.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'Wszystkie' : cat}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              {(['all', 'user', 'jarvis'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setConversationFilter(filterType)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    conversationFilter === filterType
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filterType === 'all' ? 'Wszystkie' : filterType === 'user' ? 'Tylko Twoje' : 'Tylko Jarvisa'}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="flex items-center gap-2">
              <button
                onClick={onExportMemory}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                title="Pobierz plik jarvis_memory.json"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Eksport</span>
              </button>
              <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs cursor-pointer transition-colors">
                <Upload className="w-3 h-3 text-emerald-400" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Add Permanent Insight Form Accordion */}
        {activeTab === 'permanent' && showAddInsightForm && (
          <form
            onSubmit={handleAddInsight}
            className="p-5 bg-gradient-to-r from-amber-950/40 to-slate-900 border-b border-amber-500/30 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold font-['Orbitron']">
              <span className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                NOWA TRWAŁA WSKAZÓWKA / WAŻNY FAKT (ZOSTAJE NA STAŁE)
              </span>
              <button
                type="button"
                onClick={() => setShowAddInsightForm(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newInsightTitle}
                onChange={(e) => setNewInsightTitle(e.target.value)}
                placeholder="Tytuł wskazówki (np. Skrót kompilacji, Zasada bezpieczeństwa)"
                className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                required
              />
              <select
                value={newInsightCategory}
                onChange={(e) => setNewInsightCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Programowanie">Kategoria: Programowanie</option>
                <option value="Produktywność">Kategoria: Produktywność</option>
                <option value="Ważne Ustalenia">Kategoria: Ważne Ustalenia</option>
                <option value="Zasady Osobiste">Kategoria: Zasady Osobiste</option>
                <option value="Bezpieczeństwo">Kategoria: Bezpieczeństwo</option>
                <option value="Ogólne">Kategoria: Ogólne</option>
              </select>
            </div>

            <textarea
              value={newInsightContent}
              onChange={(e) => setNewInsightContent(e.target.value)}
              placeholder="Treść wskazówki lub ważnego faktu (Jarvis będzie pamiętał to bezterminowo przy każdej rozmowie)..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              required
            />

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-amber-300/80 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Nigdy nie wygasa. Automatycznie przekazywana jako wiedza bazowa do Gemini AI.</span>
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Zapisz na stałe
              </button>
            </div>
          </form>
        )}

        {/* Add Rule Form Accordion */}
        {activeTab === 'rules' && showAddRuleForm && (
          <form
            onSubmit={handleAddNewRule}
            className="p-4 bg-slate-800/90 border-b border-purple-500/30 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between text-xs text-purple-300 font-bold font-['Orbitron']">
              <span>NOWA REGUŁA SŁOWNIKA (KLUCZ ➔ ODPOWIEDŹ)</span>
              <button
                type="button"
                onClick={() => setShowAddRuleForm(false)}
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
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                required
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Odpowiedź Jarvisa (np. Kod dostępu to 7741.)"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddRuleForm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Zapisz regułę
              </button>
            </div>
          </form>
        )}

        {/* Content area based on tab */}
        <div className="flex-1 overflow-y-auto p-5 select-text">
          {/* TAB 1: PERMANENT INSIGHTS */}
          {activeTab === 'permanent' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-amber-300">Pamięć Stała (Permanent Memory): </span>
                  Wszystkie wskazówki, wytyczne i ważne informacje w tej sekcji pozostają w pamięci Jarvisa <strong className="text-white">na stałe</strong>. Są automatycznie uwzględniane w każdej odpowiedzi asystenta oraz synchronizowane z modelem AI.
                </div>
              </div>

              {filteredInsights.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p className="text-sm font-semibold text-slate-400">Brak zapisanych stałych wskazówek</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Dodaj nową wskazówkę przyciskiem powyżej lub przypnij dowolną wypowiedź z zakładki "Rozmowy".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold font-mono">
                              {insight.category || 'Wskazówka'}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {insight.createdAt ? new Date(insight.createdAt).toLocaleDateString('pl-PL') : 'Stałe'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyToClipboard(insight.id, `${insight.title}: ${insight.content}`)}
                              className="p-1 rounded text-slate-400 hover:text-cyan-300"
                              title="Kopiuj treść"
                            >
                              {copiedId === insight.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteInsight(insight.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-400"
                              title="Usuń wskazówkę"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-100 mt-2.5">
                          {insight.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed whitespace-pre-wrap">
                          {insight.content}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 text-amber-400/80">
                          <Pin className="w-3 h-3" /> Pamięć trwała
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">Aktywna w Gemini</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 14-DAY CONVERSATIONS */}
          {activeTab === 'conversations' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
                <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-cyan-300">Pamięć Krótkoterminowa (Retencja 14 Dni / 2 Tygodnie): </span>
                  Wszystkie Twoje pytania i wypowiedzi są przechowywane w buforze przez dokładnie 14 dni, po czym automatycznie wygasają. Kliknij przycisk <strong className="text-amber-300">"Przypnij na stałe"</strong> przy dowolnej wiadomości, aby przenieść ją do pamięci trwałej!
                </div>
              </div>

              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30 text-cyan-400" />
                  <p className="text-sm font-semibold text-slate-400">Brak zarejestrowanych rozmów w buforze 14-dniowym</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Każde nowe pytanie lub polecenie wpisane na czacie lub powiedziane głosem trafi tutaj automatycznie.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredConversations.map((entry) => {
                    const daysLeft = getDaysLeft(entry.isoTimestamp, entry.expiresAt);
                    const isUser = entry.sender === 'user';

                    return (
                      <div
                        key={entry.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group ${
                          isUser
                            ? 'bg-slate-800/90 border-slate-700/80 hover:border-cyan-500/40'
                            : 'bg-cyan-950/20 border-cyan-500/20 hover:border-cyan-500/40'
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                isUser ? 'bg-slate-700 text-slate-200' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {isUser ? 'TY' : 'JARVIS'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {entry.timestamp || 'Dzisiaj'}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${
                                daysLeft <= 2
                                  ? 'bg-red-950/60 text-red-300 border-red-500/40'
                                  : daysLeft <= 5
                                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              ⏳ Wygasa za {daysLeft} {daysLeft === 1 ? 'dzień' : 'dni'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-100 font-sans leading-relaxed whitespace-pre-wrap">
                            {entry.text}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handlePinConversation(entry)}
                            disabled={isPinningId === entry.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                            title="Zapisz tę wypowiedź jako trwałą wskazówkę, która nigdy nie wygaśnie"
                          >
                            <Pin className="w-3 h-3" />
                            <span>{isPinningId === entry.id ? 'Zapisuję...' : 'Przypnij na stałe'}</span>
                          </button>

                          <button
                            onClick={() => copyToClipboard(entry.id, entry.text)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="Kopiuj treść"
                          >
                            {copiedId === entry.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleDeleteConversation(entry.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                            title="Usuń wpis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KEY-VALUE RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
                <Zap className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-purple-300">Słownik Reguł i Odpowiedzi (`jarvis_memory.json`): </span>
                  Baza reguł natychmiastowych z zerowym czasem opóźnienia. Jeśli użytkownik powie lub napisze zdefiniowaną frazę, Jarvis odpowie natychmiast według podanego szablonu.
                </div>
              </div>

              {filteredLearned.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Zap className="w-12 h-12 mx-auto mb-2 opacity-30 text-purple-400" />
                  <p className="text-sm font-semibold text-slate-400">Brak zdefiniowanych reguł słownika</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Użyj przycisku "Dodaj Regułę" lub otwórz Centrum Szkolenia AI.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLearned.map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between gap-3 group transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-300 font-mono">
                            "{key}"
                          </span>
                          <span className="text-slate-500 text-xs">➔</span>
                        </div>
                        {editingKey === key ? (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-purple-500 text-slate-100 text-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(key)}
                              className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-300 mt-1 truncate">{val}</p>
                        )}
                      </div>

                      {editingKey !== key && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(key, val)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-700 transition-colors"
                            title="Edytuj odpowiedź"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteCommand(key)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                            title="Usuń ze słownika"
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>
              Automatyczna synchronizacja Stark OS. Retencja rozmów: <strong className="text-cyan-300 font-mono">14 dni</strong>, Wskazówki: <strong className="text-amber-300 font-mono">Trwałe (Never expire)</strong>.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
