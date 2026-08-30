import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Zap,
  CheckCircle2,
  BookOpen,
  Shield,
  Code,
  Calendar,
  Lock,
  BrainCircuit,
  ArrowRight,
  X,
  RefreshCw,
  Plus,
  Award,
  FileText,
  HelpCircle,
  TrendingUp,
  Volume2,
  ChevronRight,
  Check,
  MessageSquare,
  Flame
} from 'lucide-react';
import {
  KNOWLEDGE_PACKS,
  KnowledgePack,
  TRAINING_QUIZ_DRILLS,
  TrainingQuizItem,
  getAllTrainingRules,
  getTotalRulesCount
} from '../data/trainingData';
import { soundFx } from '../services/audio';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnedCommandsCount: number;
  onApplyKnowledgePack: (packData: Record<string, string>, packName: string) => Promise<void>;
  autoLearnEnabled: boolean;
  onToggleAutoLearn: () => void;
  onSpeak?: (text: string) => void;
}

export function TrainingModal({
  isOpen,
  onClose,
  learnedCommandsCount,
  onApplyKnowledgePack,
  autoLearnEnabled,
  onToggleAutoLearn,
  onSpeak,
}: TrainingModalProps) {
  const [activeTab, setActiveTab] = useState<'packs' | 'quiz' | 'custom_text'>('packs');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [successPackId, setSuccessPackId] = useState<string | null>(null);
  const [isTrainingAll, setIsTrainingAll] = useState(false);

  // Quiz / Academy State
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizXp, setQuizXp] = useState(150);
  const [testedQuestions, setTestedQuestions] = useState<Record<string, boolean>>({});
  const [isAnswering, setIsAnswering] = useState(false);
  const [showJarvisAnswer, setShowJarvisAnswer] = useState(false);

  // Text Notes Extractor State
  const [customText, setCustomText] = useState('');
  const [isExtractingNotes, setIsExtractingNotes] = useState(false);
  const [extractedFeedback, setExtractedFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate Level based on Memory + Quiz XP
  const totalXp = (learnedCommandsCount * 15) + quizXp;
  const currentLevel = Math.min(10, Math.floor(totalXp / 100) + 1);
  const getLevelTitle = (lvl: number) => {
    if (lvl >= 10) return 'OMNI-JARVIS STARK CORE (MISTRZ)';
    if (lvl >= 8) return 'JARVIS NEURAL TITANIUM v8.0';
    if (lvl >= 6) return 'JARVIS TACTICAL ADVANCED v6.0';
    if (lvl >= 4) return 'JARVIS COGNITIVE MARK IV';
    if (lvl >= 2) return 'JARVIS PROTOKÓŁ MARK II';
    return 'JARVIS PROTOTYP MARK I';
  };

  const handleInstallPack = async (pack: KnowledgePack) => {
    setInstallingId(pack.id);
    soundFx.playProcessing();
    try {
      await onApplyKnowledgePack(pack.data, pack.name);
      soundFx.playSuccess();
      setSuccessPackId(pack.id);
      setQuizXp((prev) => prev + 50);
      setTimeout(() => setSuccessPackId(null), 3000);
    } finally {
      setInstallingId(null);
    }
  };

  const handleInstallAll = async () => {
    setIsTrainingAll(true);
    soundFx.playProcessing();
    try {
      const allRules = getAllTrainingRules();
      await onApplyKnowledgePack(allRules, 'Kompletny Pakiet Wiedzy Jarvisa (8 Mega Pakietów)');
      soundFx.playSuccess();
      setSuccessPackId('all');
      setQuizXp((prev) => prev + 300);
      setTimeout(() => setSuccessPackId(null), 3000);
    } finally {
      setIsTrainingAll(false);
    }
  };

  const handleExtractCustomNotes = async () => {
    if (!customText.trim()) return;
    setIsExtractingNotes(true);
    soundFx.playProcessing();
    try {
      const res = await fetch('/api/jarvis/extract-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: customText }),
      });
      const data = await res.json();
      if (data.success && data.extractedRules) {
        soundFx.playSuccess();
        await onApplyKnowledgePack(data.extractedRules, 'Własne Notatki i Fakty Użytkownika');
        setExtractedFeedback(`Pomyślnie wyodrębniono i zapamiętano ${data.extractedCount} nowych reguł wiedzy!`);
        setQuizXp((prev) => prev + (data.extractedCount * 25));
        setCustomText('');
      } else {
        setExtractedFeedback('Nie udało się wyodrębnić reguł z podanego tekstu.');
      }
    } catch (err) {
      soundFx.playAlert();
      setExtractedFeedback('Wystąpił błąd podczas analizy notatek.');
    } finally {
      setIsExtractingNotes(false);
      setTimeout(() => setExtractedFeedback(null), 5000);
    }
  };

  const handleTestDrill = (drill: TrainingQuizItem) => {
    setShowJarvisAnswer(true);
    soundFx.playProcessing();
    if (!testedQuestions[drill.id]) {
      setTestedQuestions((prev) => ({ ...prev, [drill.id]: true }));
      setQuizXp((prev) => prev + 40);
      soundFx.playSuccess();
    }
    if (onSpeak) {
      onSpeak(drill.jarvisAnswer);
    }
  };

  const getPackIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'Code':
        return <Code className="w-5 h-5 text-emerald-400" />;
      case 'BrainCircuit':
        return <BrainCircuit className="w-5 h-5 text-purple-400" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'Lock':
        return <Lock className="w-5 h-5 text-rose-400" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-blue-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5 text-fuchsia-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-5 h-5 text-pink-400" />;
    }
  };

  return (
    <div
      id="training-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/95 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 font-['Orbitron'] tracking-wide">
                  Akademia & Centrum Szkolenia Jarvisa
                </h2>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-sm">
                  NEURAL DRILL v4.2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Podszkol Jarvisa pakietami wiedzy, przeprowadź interaktywny quiz egzaminacyjny lub wgraj własne notatki.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level & XP Progression Bar */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-['Orbitron'] flex items-center gap-2">
                <span>POZIOM INTELIGENCJI NEURONOWEJ:</span>
                <strong className="text-amber-300 font-bold">LVL {currentLevel}/10</strong>
              </div>
              <div className="text-sm font-bold text-slate-200 font-['Orbitron'] tracking-wide">
                {getLevelTitle(currentLevel)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-mono">Baza wiedzy: <strong className="text-cyan-400">{learnedCommandsCount}</strong> reguł</div>
              <div className="text-[11px] text-purple-400 font-mono font-semibold">XP Inteligencji: {totalXp} pkt</div>
            </div>
            <div className="w-24 sm:w-32 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalXp % 100) || 15)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 bg-slate-950/40 border-b border-slate-800 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('packs')}
            className={`px-4 py-2.5 text-xs font-bold font-['Orbitron'] uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'packs'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Pakiety Wiedzy (105+ Reguł)</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2.5 text-xs font-bold font-['Orbitron'] uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'quiz'
                ? 'border-purple-400 text-purple-300 bg-purple-950/30 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Sesja Treningowa (Quiz & Egzamin)</span>
          </button>

          <button
            onClick={() => setActiveTab('custom_text')}
            className={`px-4 py-2.5 text-xs font-bold font-['Orbitron'] uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'custom_text'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Wgraj Notatki / Własną Wiedzę</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: KNOWLEDGE PACKAGES */}
          {activeTab === 'packs' && (
            <div className="space-y-6 animate-fade-in">
              {/* Auto-Learning Autonomous Switch Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 mt-0.5">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100 font-['Orbitron']">
                        Autonomiczne Samouczenie (Ciągła Ekstrakcja z Rozmowy)
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          autoLearnEnabled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {autoLearnEnabled ? 'AKTYWNE' : 'WYŁĄCZONE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Jarvis automatycznie analizuje każdą rozmowę i natychmiast trwale zapamiętuje fakty o Tobie, Twoje preferencje, zasady i polecenia w pliku <code className="text-cyan-300">jarvis_memory.json</code>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleAutoLearn}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md ${
                    autoLearnEnabled
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {autoLearnEnabled ? 'Wyłącz Auto-Naukę' : 'Włącz Auto-Naukę'}
                </button>
              </div>

              {/* Master Train All Button */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-purple-950/70 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm font-['Orbitron'] mb-1">
                    <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>KOMPLEKSOWE PODSZKOLENIE JARVISA (9 MEGA PAKIETÓW)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Wgrywa natychmiast wszystkie 9 pakietów: Protokoły Starka, Slang Młodzieżowy & Popkulturę, Python & Kod, Fizykę Kwantową, Kosmos, Asystenta, Cyberbezpieczeństwo, Historię i Humor.
                  </p>
                </div>
                <button
                  id="btn-train-all-packs"
                  onClick={handleInstallAll}
                  disabled={isTrainingAll}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 hover:from-cyan-300 hover:to-cyan-200 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isTrainingAll ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Wgrywanie 105+ reguł...</span>
                    </>
                  ) : successPackId === 'all' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                      <span>Wytrenowano Kompletnie!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Podszkol Kompletnie ({getTotalRulesCount()} Reguł)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Individual Knowledge Packages Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-['Orbitron']">
                    Dostępne Pakiety Wiedzy Specjalistycznej:
                  </h3>
                  <span className="text-xs text-slate-400">
                    Baza pamięci: <strong className="text-cyan-400 font-mono">{learnedCommandsCount}</strong> procedur
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {KNOWLEDGE_PACKS.map((pack) => {
                    const isInstalling = installingId === pack.id;
                    const isSuccess = successPackId === pack.id;

                    return (
                      <div
                        key={pack.id}
                        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-sm"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-slate-800/90 border border-slate-700 shrink-0">
                                {getPackIcon(pack.icon)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                                  {pack.name}
                                </h4>
                                <span className="text-[10px] text-cyan-400 font-mono">
                                  +{pack.rulesCount} zaawansowanych procedur
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            {pack.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                          <span className="text-[10px] text-slate-500 uppercase font-mono">
                            Kategoria: {pack.category}
                          </span>
                          <button
                            onClick={() => handleInstallPack(pack)}
                            disabled={isInstalling}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSuccess
                                ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {isInstalling ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Wgrywanie...</span>
                              </>
                            ) : isSuccess ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Wgrano!</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Wgraj Pakiet</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE QUIZ & TRAINING DRILLS */}
          {activeTab === 'quiz' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-200 font-['Orbitron']">
                    Interaktywny Trening Egzaminacyjny Jarvisa
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Sprawdź wiedzę Jarvisa z kluczowych dziedzin lub przećwicz z nim konkretne scenariusze. Każde przetestowane pytanie zwiększa jego poziom doświadczenia (+40 XP).
                  </p>
                </div>
              </div>

              {/* Active Quiz Drill Card */}
              {(() => {
                const drill = TRAINING_QUIZ_DRILLS[currentQuizIndex];
                const isTested = testedQuestions[drill.id];

                return (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                          {drill.category}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Pytanie {currentQuizIndex + 1} z {TRAINING_QUIZ_DRILLS.length}
                        </span>
                      </div>
                      {isTested && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                          <Check className="w-3.5 h-3.5" /> Przetestowano (+40 XP)
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-100 font-['Orbitron']">
                        "{drill.question}"
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Słowo wyzwalające regułę: <code className="text-cyan-300 font-mono">{drill.keyTrigger}</code>
                      </p>
                    </div>

                    {showJarvisAnswer ? (
                      <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 font-['Orbitron'] flex items-center gap-1.5">
                            <BrainCircuit className="w-4 h-4" /> ODPOWIEDŹ JARVISA:
                          </span>
                          {onSpeak && (
                            <button
                              onClick={() => onSpeak(drill.jarvisAnswer)}
                              className="p-1 rounded bg-slate-800 text-cyan-400 hover:text-cyan-200 text-xs flex items-center gap-1 cursor-pointer"
                              title="Odtwórz głosowo"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Odtwórz</span>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed font-sans">
                          {drill.jarvisAnswer}
                        </p>
                        <div className="text-xs text-slate-400 pt-1 border-t border-slate-800">
                          <strong className="text-slate-300">Wyjaśnienie:</strong> {drill.explanation}
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        <button
                          onClick={() => handleTestDrill(drill)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Odpytaj Jarvisa i Sprawdź Odpowiedź</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => {
                          setShowJarvisAnswer(false);
                          setCurrentQuizIndex((prev) => (prev > 0 ? prev - 1 : TRAINING_QUIZ_DRILLS.length - 1));
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
                      >
                        Poprzednie Pytanie
                      </button>

                      <div className="flex items-center gap-1.5">
                        {TRAINING_QUIZ_DRILLS.map((q, idx) => (
                          <button
                            key={q.id}
                            onClick={() => {
                              setShowJarvisAnswer(false);
                              setCurrentQuizIndex(idx);
                            }}
                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                              idx === currentQuizIndex
                                ? 'bg-cyan-400 scale-125'
                                : testedQuestions[q.id]
                                ? 'bg-emerald-400'
                                : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setShowJarvisAnswer(false);
                          setCurrentQuizIndex((prev) => (prev < TRAINING_QUIZ_DRILLS.length - 1 ? prev + 1 : 0));
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs text-slate-950 font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Następne</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: CUSTOM TEXT & NOTES INGESTION */}
          {activeTab === 'custom_text' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-200 font-['Orbitron']">
                    Szybka Ekstrakcja Wiedzy z Notatek i Artykułów
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Wklej dowolny fragment tekstu, notatki ze spotkania, swoje nawyki lub informacje o projektach. Silnik AI Jarvisa automatycznie wyodrębni kluczowe fakty i doda je do trwałej pamięci <code className="text-amber-300 font-mono">jarvis_memory.json</code>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-['Orbitron']">
                  Treść Notatek do Nauczenia:
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Przykład:&#10;Mój pies to labrador o imieniu Baks.&#10;Mój ulubiony edytor to VS Code.&#10;Pracuję nad projektem Smart Home Stark.&#10;W każdy piątek o 15:00 mamy podsumowanie sprintu."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-200 text-sm font-sans placeholder-slate-500 resize-none"
                />
              </div>

              {extractedFeedback && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{extractedFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Wskazówka: Możesz używać naturalnego języka polskiego lub formatu klucz: wartość.
                </span>
                <button
                  onClick={handleExtractCustomNotes}
                  disabled={isExtractingNotes || !customText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExtractingNotes ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analizowanie i zapamiętywanie...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Wytrenuj Jarvisa z Tych Notatek</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Komendy głosowe: <strong className="text-cyan-300">"Podszkol się"</strong>, <strong className="text-cyan-300">"Zapamiętaj że..."</strong>, <strong className="text-cyan-300">"Co pamiętasz?"</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
