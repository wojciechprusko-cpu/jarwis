import React, { useState } from 'react';
import { Code, Copy, Check, Terminal, Download, Monitor, MousePointer, Keyboard, Shield, Zap, Sparkles } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADVANCED_OS_SOURCE = `"""
================================================================================
           J.A.R.V.I.S. OS MASTER CONTROLLER (v4.0 - TURBO 10X)
       PEŁNA KONTROLA NAD EKRANEM, KURSOREM MYSZKI, KLAWIATURĄ I GŁOSEM
================================================================================
Wymagania (zainstaluj w terminalu):
  pip install pyautogui keyboard pynput pillow pyttsx3 SpeechRecognition requests

Failsafe (Zabezpieczenie awaryjne):
  Szybkie przesunięcie kursora myszy do rogu ekranu (0,0) natychmiast przerywa działanie.
================================================================================
"""

import os
import sys
import time
import json
import subprocess
import threading

# Opcjonalne biblioteki automatyzacji z graceful fallback
try:
    import pyautogui
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.05
    HAS_PYAUTOGUI = True
except ImportError:
    HAS_PYAUTOGUI = False

try:
    import keyboard
    HAS_KEYBOARD = True
except ImportError:
    HAS_KEYBOARD = False

try:
    import pyttsx3
    HAS_TTS = True
except ImportError:
    HAS_TTS = False

try:
    import speech_recognition as sr
    HAS_SPEECH = True
except ImportError:
    HAS_SPEECH = False

try:
    from PIL import ImageGrab
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


class JarvisOSController:
    def __init__(self, memory_file="jarvis_memory.json"):
        self.memory_file = memory_file
        self.user_title = "Sir"
        self.memory = {}
        
        # Inicjalizacja syntezatora głosu (polski lektor męski)
        self.tts_engine = None
        if HAS_TTS:
            try:
                self.tts_engine = pyttsx3.init()
                self.tts_engine.setProperty('rate', 175)
                self.tts_engine.setProperty('volume', 1.0)
                for voice in self.tts_engine.getProperty('voices'):
                    if "polish" in voice.name.lower() or "pl" in voice.id.lower():
                        self.tts_engine.setProperty('voice', voice.id)
                        break
            except Exception as e:
                print(f"[TTS Warning]: {e}")

        self.load_memory()
        print(f"\\n=======================================================")
        print(f"  ⚡ J.A.R.V.I.S. OS MASTER CONTROLLER (TURBO 10X)")
        print(f"=======================================================")
        print(f"  • Baza pamięci: {len(self.memory)} reguł zsynchronizowanych")
        print(f"  • Mysz & Klawiatura (PyAutoGUI): {'✅ AKTYWNA' if HAS_PYAUTOGUI else '❌ Brak (pip install pyautogui)'}")
        print(f"  • Przechwytywanie Klawiszy: {'✅ AKTYWNE' if HAS_KEYBOARD else '❌ Brak (pip install keyboard)'}")
        print(f"  • Głos i Synteza Mowy: {'✅ AKTYWNE' if HAS_TTS else '⚠️ Tryb tekstowy'}")
        print(f"=======================================================\\n")

    def speak(self, text):
        """Wypowiada tekst głosem Jarvisa i drukuje w konsoli."""
        print(f"\\n[JARVIS]: {text}")
        if self.tts_engine:
            try:
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
            except Exception as e:
                print(f"[TTS Error]: {e}")

    def load_memory(self):
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    self.memory = json.load(f)
            except Exception:
                self.memory = {}
        if not self.memory:
            self.memory = {
                "status": "Wszystkie systemy Stark OS działają ze sprawnością 99.98% w trybie Turbo 10X.",
                "twórca": "Moim stwórcą jest geniusz, miliarder, inżynier Tony Stark.",
                "pancerz mark": "Pancerz Mark 85 z nanotechnologią i rdzeniem łukowym jest w pełnej gotowości."
            }
            self.save_memory()

    def save_memory(self):
        try:
            with open(self.memory_file, 'w', encoding='utf-8') as f:
                json.dump(self.memory, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Save Error]: {e}")

    def learn(self, key, value):
        self.memory[key.lower().strip()] = value.strip()
        self.save_memory()
        self.speak(f"Zapamiętałem nową regułę dla '{key}', {self.user_title}.")

    # --- KONTROLA KURSOREM MYSZY ---
    def mouse_move(self, x, y, duration=0.2):
        if HAS_PYAUTOGUI:
            sw, sh = pyautogui.size()
            pyautogui.moveTo(max(0, min(sw-1, int(x))), max(0, min(sh-1, int(y))), duration=duration)

    def mouse_click(self, button='left', clicks=1):
        if HAS_PYAUTOGUI:
            pyautogui.click(button=button, clicks=clicks)

    def mouse_scroll(self, amount):
        if HAS_PYAUTOGUI:
            pyautogui.scroll(amount)

    def mouse_center(self):
        if HAS_PYAUTOGUI:
            sw, sh = pyautogui.size()
            pyautogui.moveTo(sw // 2, sh // 2, duration=0.2)

    # --- KONTROLA KLAWIATURĄ & SKRÓTAMI ---
    def keyboard_type(self, text):
        if not HAS_PYAUTOGUI:
            return
        # Bezpieczne wklejanie przez schowek dla znaków diakrytycznych
        try:
            import tkinter as tk
            r = tk.Tk()
            r.withdraw()
            r.clipboard_clear()
            r.clipboard_append(text)
            r.update()
            r.destroy()
            time.sleep(0.05)
            pyautogui.hotkey('ctrl', 'v')
        except Exception:
            pyautogui.write(text)

    def press_key(self, key_name):
        if HAS_PYAUTOGUI:
            pyautogui.press(key_name)

    def hotkey(self, *keys):
        if HAS_PYAUTOGUI:
            pyautogui.hotkey(*keys)

    # --- ZRZUT EKRANU / WIDZENIE ---
    def take_screenshot(self, filename="jarvis_screen.png"):
        if HAS_PIL:
            img = ImageGrab.grab()
            img.save(filename)
            return filename
        elif HAS_PYAUTOGUI:
            pyautogui.screenshot(filename)
            return filename
        return None

    # --- AKCJE SYSTEMOWE I SKRÓTY ---
    def execute_system_action(self, action):
        act = action.lower()
        if "pulpit" in act:
            self.hotkey('win', 'd')
            self.speak("Pulpit odsłonięty.")
        elif "zamknij" in act:
            self.hotkey('alt', 'f4')
            self.speak("Okno zamknięte.")
        elif "przełącz" in act or "zmień okno" in act:
            self.hotkey('alt', 'tab')
            self.speak("Przełączam aplikację.")
        elif "kopiuj" in act:
            self.hotkey('ctrl', 'c')
            self.speak("Skopiowano do schowka.")
        elif "wklej" in act:
            self.hotkey('ctrl', 'v')
            self.speak("Wklejono tekst ze schowka.")
        elif "zaznacz wszystko" in act:
            self.hotkey('ctrl', 'a')
            self.speak("Zaznaczono całość.")
        elif "zablokuj" in act:
            self.hotkey('win', 'l')
            self.speak("Stacja robocza zablokowana.")
        elif "głośniej" in act or "glosniej" in act:
            for _ in range(5): self.press_key('volumeup')
            self.speak("Zwiększono głośność.")
        elif "ciszej" in act:
            for _ in range(5): self.press_key('volumedown')
            self.speak("Zmniejszono głośność.")
        elif "wycisz" in act:
            self.press_key('volumemute')
            self.speak("Dźwięk wyciszony.")
        elif "odtwarzaj" in act or "pauza" in act:
            self.press_key('playpause')
            self.speak("Zmieniono stan odtwarzacza.")

    def open_app(self, name):
        n = name.lower().strip()
        if "notatnik" in n or "notepad" in n:
            subprocess.Popen("notepad.exe" if sys.platform == "win32" else "gedit")
            self.speak("Otwieram Notatnik, Sir.")
        elif "kalkulator" in n or "calc" in n:
            subprocess.Popen("calc.exe" if sys.platform == "win32" else "gnome-calculator")
            self.speak("Kalkulator uruchomiony.")
        elif "youtube" in n:
            import webbrowser
            webbrowser.open("https://www.youtube.com")
            self.speak("Otwieram serwis YouTube.")
        elif "spotify" in n:
            subprocess.Popen("start spotify:" if sys.platform == "win32" else "spotify", shell=True)
            self.speak("Uruchamiam odtwarzacz Spotify.")
        else:
            if HAS_PYAUTOGUI:
                pyautogui.press('win')
                time.sleep(0.3)
                self.keyboard_type(n)
                time.sleep(0.3)
                pyautogui.press('enter')
                self.speak(f"Uruchamiam: {name}")

    def process(self, cmd):
        if not cmd: return True
        c = cmd.strip()
        low = c.lower()

        if low in ["wyjście", "exit", "quit", "wyłącz się", "papa"]:
            self.speak(f"Zamykam protokoły Jarvis OS. Do widzenia, {self.user_title}.")
            return False

        if "ucz się" in low or "zapamiętaj że" in low or "zapamietaj ze" in low:
            raw = low.replace("ucz się", "").replace("zapamiętaj że", "").replace("zapamietaj ze", "")
            if "=" in raw:
                p = raw.split("=")
                self.learn(p[0].strip(), "=".join(p[1:]).strip())
                return True

        if "mysz na środek" in low or "kursor na środek" in low:
            self.mouse_center()
            self.speak("Kursor na środku ekranu.")
            return True

        if "dwuklik" in low or "kliknij dwa razy" in low:
            self.mouse_click('left', 2)
            self.speak("Wykonano dwuklik.")
            return True

        if "prawoklik" in low or "prawy przycisk" in low:
            self.mouse_click('right', 1)
            self.speak("Menu kontekstowe otwarte.")
            return True

        if "kliknij" in low:
            self.mouse_click('left', 1)
            self.speak("Kliknięto.")
            return True

        if "przewiń w dół" in low or "scroll w dół" in low:
            self.mouse_scroll(-600)
            self.speak("Przewinięto w dół.")
            return True

        if "przewiń w górę" in low or "scroll w górę" in low:
            self.mouse_scroll(600)
            self.speak("Przewinięto w górę.")
            return True

        if low.startswith("napisz ") or low.startswith("wpisz "):
            self.keyboard_type(c[7:].strip())
            self.speak("Wpisałem tekst, Sir.")
            return True

        if "zrzut ekranu" in low or "screenshot" in low:
            f = self.take_screenshot()
            self.speak(f"Zrzut zapisany do pliku {f}.")
            return True

        if low.startswith("otwórz ") or low.startswith("uruchom "):
            self.open_app(c[7:].strip())
            return True

        for act in ["pulpit", "zamknij", "przełącz", "kopiuj", "wklej", "zaznacz wszystko", "zablokuj", "głośniej", "ciszej", "wycisz", "odtwarzaj", "pauza"]:
            if act in low:
                self.execute_system_action(act)
                return True

        for k, v in self.memory.items():
            if k.lower() in low:
                self.speak(f"{v} ({self.user_title})")
                return True

        self.speak(f"Przyjąłem: '{c}', {self.user_title}. Wykonuję analizę.")
        return True

    def run(self):
        self.speak("System Jarvis OS Master Controller jest gotowy. Czekam na dyspozycje.")
        while True:
            try:
                cmd = input("\\nJarvis OS > ")
                if not self.process(cmd):
                    break
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"[Error]: {e}")


if __name__ == '__main__':
    controller = JarvisOSController()
    controller.run()
`;

const REQUIREMENTS_TXT = `# Wymagane biblioteki dla pełnej kontroli systemu przez JARVIS:
pyautogui>=0.9.54
keyboard>=0.13.5
pynput>=1.7.6
pillow>=10.0.0
pyttsx3>=2.90
SpeechRecognition>=3.10.0
requests>=2.31.0
`;

export function PythonCodeModal({ isOpen, onClose }: PythonCodeModalProps) {
  const [activeTab, setActiveTab] = useState<'os_master' | 'requirements'>('os_master');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentContent = activeTab === 'os_master' ? ADVANCED_OS_SOURCE : REQUIREMENTS_TXT;
  const currentFileName = activeTab === 'os_master' ? 'advanced_jarvis.py' : 'requirements.txt';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-['Orbitron'] tracking-wide">
                  Zaktualizowany Kod Python: J.A.R.V.I.S. OS Master
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  v4.0 Turbo 10X
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pełna kontrola nad ekranem, kursorem myszy (PyAutoGUI), klawiaturą, zrzutami ekranu i syntezą mowy.
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

        {/* Feature badges row */}
        <div className="px-5 py-2 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
            <MousePointer className="w-3 h-3 text-cyan-400" /> Ruch i Klikanie Myszą
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-500/30 text-blue-300">
            <Keyboard className="w-3 h-3 text-blue-400" /> Pisanie & Skróty Systemowe (Win/Alt/Ctrl)
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-purple-300">
            <Monitor className="w-3 h-3 text-purple-400" /> Zrzuty Ekranu & Wizja
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            <Shield className="w-3 h-3 text-emerald-400" /> Bezpieczny Failsafe (Róg ekranu)
          </span>
        </div>

        {/* Tabs & Toolbar */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('os_master')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'os_master'
                  ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>advanced_jarvis.py (Pełny Agent OS)</span>
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'requirements'
                  ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>requirements.txt (Instalacja)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              {copied ? 'Skopiowano!' : 'Kopiuj kod'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)]"
            >
              <Download className="w-3.5 h-3.5" />
              Pobierz plik ({currentFileName})
            </button>
          </div>
        </div>

        {/* Quick Launch Instruction banner */}
        <div className="px-5 py-2 bg-cyan-950/30 border-b border-cyan-900/40 text-[11px] text-cyan-300 font-mono flex items-center justify-between">
          <span>🚀 Jak uruchomić: <span className="text-white font-bold">pip install -r requirements.txt</span> && <span className="text-white font-bold">python advanced_jarvis.py</span></span>
          <span className="text-slate-400 text-[10px]">Autonomiczny Asystent Pulpitu</span>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950 font-['Fira_Code',monospace] text-xs leading-relaxed text-slate-300 select-text">
          <pre className="overflow-x-auto">
            <code>{currentContent}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Skrypt w 100% zsynchronizowany z bazą wiedzy <code className="text-cyan-400 font-mono">jarvis_memory.json</code>.</span>
          </div>
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

