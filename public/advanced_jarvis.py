"""
================================================================================
           J.A.R.V.I.S. OS MASTER CONTROLLER (v4.0 - TURBO 10X)
       PEŁNA KONTROLA NAD EKRANEM, KUSOREM MYSZKI, KLAWIATURĄ I GŁOSEM
================================================================================
Wymagania:
  pip install pyautogui keyboard pynput mss pillow opencv-python pyttsx3 SpeechRecognition requests

Bezpieczeństwo (Failsafe):
  Przesunięcie kursora myszy w dowolny róg ekranu (0,0) natychmiast przerywa działanie.
================================================================================
"""

import os
import sys
import time
import json
import math
import shutil
import datetime
import threading
import subprocess
import urllib.request
import urllib.parse

# Opcjonalne biblioteki systemowe z automatycznym fallbackiem
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
    from PIL import Image, ImageGrab
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


class JarvisOSController:
    def __init__(self, memory_file="jarvis_memory.json", conversations_file="jarvis_conversations.json", permanent_file="jarvis_permanent_notes.json", server_url="http://localhost:3000"):
        self.memory_file = memory_file
        self.conversations_file = conversations_file
        self.permanent_file = permanent_file
        self.server_url = server_url
        self.user_title = "Sir"
        self.is_listening = False
        self.memory = {}
        self.conversations = []
        self.permanent_insights = []
        
        # Inicjalizacja syntezatora głosu
        self.tts_engine = None
        if HAS_TTS:
            try:
                self.tts_engine = pyttsx3.init()
                self.tts_engine.setProperty('rate', 175)
                self.tts_engine.setProperty('volume', 1.0)
                voices = self.tts_engine.getProperty('voices')
                for voice in voices:
                    if "polish" in voice.name.lower() or "pl" in voice.id.lower():
                        self.tts_engine.setProperty('voice', voice.id)
                        break
            except Exception as e:
                print(f"[TTS Init Warning]: {e}")

        self.load_memory()
        self.load_conversations_and_prune()
        self.load_permanent_insights()
        
        print(f"[JARVIS OS]: Zainicjalizowano rdzeń. Pamięć: {len(self.memory)} reguł.")
        print(f"[JARVIS OS]: Pamięć rozmów (14 dni): {len(self.conversations)} wpisów.")
        print(f"[JARVIS OS]: Trwałe wskazówki & ważne rzeczy: {len(self.permanent_insights)} wpisów.")
        print(f"[JARVIS OS]: PyAutoGUI (Mysz/Klawiatura): {'AKTYWNY' if HAS_PYAUTOGUI else 'BRAK (pip install pyautogui)'}")
        print(f"[JARVIS OS]: Keyboard Hooks: {'AKTYWNE' if HAS_KEYBOARD else 'BRAK (pip install keyboard)'}")
        print(f"[JARVIS OS]: Voice Engine: {'AKTYWNY' if (HAS_TTS and HAS_SPEECH) else 'TRYB TEKSTOWY'}")

    # --------------------------------------------------------------------------
    # ZARZĄDZANIE PAMIĘCIĄ (14 DNI RETENCJI + TRWAŁE WSKAZÓWKI)
    # --------------------------------------------------------------------------
    def load_memory(self):
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    self.memory = json.load(f)
            except Exception as e:
                print(f"[Memory Load Error]: {e}")
        else:
            self.memory = {
                "status": "Wszystkie systemy Stark OS działają ze sprawnością 99.98% w trybie Turbo 10X.",
                "twórca": "Moim twórcą jest geniusz, miliarder i inżynier Tony Stark.",
                "pancerz mark": "Pancerz Mark 85 wyposażony w nanotechnologię i reaktor łukowy jest gotowy do dyslokacji."
            }
            self.save_memory_file()

    def save_memory_file(self):
        try:
            with open(self.memory_file, 'w', encoding='utf-8') as f:
                json.dump(self.memory, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Memory Save Error]: {e}")

    def load_conversations_and_prune(self):
        """Ładuje i automatycznie usuwa wpisy starsze niż 14 dni (2 tygodnie)."""
        retention_days = 14
        now = datetime.datetime.now()
        if os.path.exists(self.conversations_file):
            try:
                with open(self.conversations_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    valid = []
                    for item in data:
                        iso_str = item.get("isoTimestamp")
                        if iso_str:
                            try:
                                dt = datetime.datetime.fromisoformat(iso_str.replace("Z", "+00:00")).replace(tzinfo=None)
                                if (now - dt).days <= retention_days:
                                    valid.append(item)
                            except Exception:
                                valid.append(item)
                        else:
                            valid.append(item)
                    self.conversations = valid
                    if len(valid) != len(data):
                        self.save_conversations_file()
            except Exception as e:
                print(f"[Conversations Load Error]: {e}")
                self.conversations = []
        else:
            self.conversations = []
            self.save_conversations_file()

    def save_conversations_file(self):
        try:
            with open(self.conversations_file, 'w', encoding='utf-8') as f:
                json.dump(self.conversations, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Conversations Save Error]: {e}")

    def log_conversation(self, sender, text):
        now = datetime.datetime.now()
        entry = {
            "id": f"conv-{int(time.time()*1000)}",
            "sender": sender,
            "text": text,
            "timestamp": now.strftime("%H:%M:%S"),
            "isoTimestamp": now.isoformat(),
            "expiresAt": (now + datetime.timedelta(days=14)).isoformat()
        }
        self.conversations.append(entry)
        self.save_conversations_file()

    def load_permanent_insights(self):
        """Ładuje wskazówki i ważne ustalenia, które zostają w pamięci NA STAŁE."""
        if os.path.exists(self.permanent_file):
            try:
                with open(self.permanent_file, 'r', encoding='utf-8') as f:
                    self.permanent_insights = json.load(f)
            except Exception as e:
                print(f"[Permanent Notes Load Error]: {e}")
                self.permanent_insights = []
        else:
            self.permanent_insights = [
                {
                    "id": "tip-1",
                    "title": "Optymalizacja kodu i architektury",
                    "content": "Stosuj zasadę KISS i Single Responsibility. Profiluj wąskie gardła przed optymalizacją.",
                    "type": "tip",
                    "createdAt": datetime.datetime.now().isoformat(),
                    "isPermanent": True,
                    "category": "Programowanie"
                },
                {
                    "id": "tip-2",
                    "title": "Technika Pomodoro",
                    "content": "25 minut pracy w skupieniu, 5 minut przerwy. Po 4 cyklach długa regeneracja.",
                    "type": "tip",
                    "createdAt": datetime.datetime.now().isoformat(),
                    "isPermanent": True,
                    "category": "Produktywność"
                }
            ]
            self.save_permanent_insights_file()

    def save_permanent_insights_file(self):
        try:
            with open(self.permanent_file, 'w', encoding='utf-8') as f:
                json.dump(self.permanent_insights, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Permanent Notes Save Error]: {e}")

    def add_permanent_tip(self, title, content, insight_type="tip", category="Ogólne"):
        insight = {
            "id": f"insight-{int(time.time()*1000)}",
            "title": title,
            "content": content,
            "type": insight_type,
            "createdAt": datetime.datetime.now().isoformat(),
            "isPermanent": True,
            "category": category
        }
        self.permanent_insights.insert(0, insight)
        self.save_permanent_insights_file()
        self.speak(f"Zapisałem trwałą wskazówkę: '{title}', która nigdy nie wygaśnie.")

    def learn(self, key, value):
        self.memory[key.lower().strip()] = value.strip()
        self.save_memory_file()
        self.speak(f"Zapamiętałem procedurę dla '{key}', {self.user_title}.")

    # --------------------------------------------------------------------------
    # SYNTEZA I ROZPOZNAWANIE MOWY
    # --------------------------------------------------------------------------
    def speak(self, text):
        """Wypowiada tekst głosem Jarvisa oraz drukuje w konsoli."""
        print(f"\n[JARVIS]: {text}")
        if self.tts_engine:
            try:
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
            except Exception as e:
                print(f"[TTS Error]: {e}")

    def listen_voice(self):
        """Nasłuchuje polecenia głosowego z mikrofonu."""
        if not HAS_SPEECH:
            return input("\nTy (tekst) > ")
        
        r = sr.Recognizer()
        with sr.Microphone() as source:
            print("\n[JARVIS NASŁUCHUJE...] (mów do mikrofonu)")
            r.adjust_for_ambient_noise(source, duration=0.5)
            try:
                audio = r.listen(source, timeout=6, phrase_time_limit=8)
                text = r.recognize_google(audio, language="pl-PL")
                print(f"Ty (głos) > {text}")
                return text
            except sr.WaitTimeoutError:
                return ""
            except sr.UnknownValueError:
                return ""
            except Exception as e:
                print(f"[Voice Error]: {e}")
                return input("\nTy (fallback) > ")

    # --------------------------------------------------------------------------
    # KONTROLA KURSORA MYSZY (MOUSE CONTROL)
    # --------------------------------------------------------------------------
    def mouse_move(self, x, y, duration=0.2):
        """Płynnie przesuwa kursor myszy na współrzędne (x, y)."""
        if not HAS_PYAUTOGUI:
            self.speak("Moduł PyAutoGUI nie jest zainstalowany.")
            return
        sw, sh = pyautogui.size()
        target_x = max(0, min(sw - 1, int(x)))
        target_y = max(0, min(sh - 1, int(y)))
        pyautogui.moveTo(target_x, target_y, duration=duration)

    def mouse_click(self, button='left', clicks=1):
        """Klika myszką (left, right, middle, double)."""
        if not HAS_PYAUTOGUI:
            return
        pyautogui.click(button=button, clicks=clicks)

    def mouse_drag(self, start_x, start_y, end_x, end_y, duration=0.4):
        """Przeciąga obiekt z punktu A do punktu B."""
        if not HAS_PYAUTOGUI:
            return
        pyautogui.moveTo(start_x, start_y)
        pyautogui.dragTo(end_x, end_y, duration=duration, button='left')

    def mouse_scroll(self, clicks):
        """Przewija ekran (dodatnie w górę, ujemne w dół)."""
        if not HAS_PYAUTOGUI:
            return
        pyautogui.scroll(clicks)

    def mouse_center(self):
        """Ustawia kursor na środku ekranu."""
        if not HAS_PYAUTOGUI:
            return
        sw, sh = pyautogui.size()
        pyautogui.moveTo(sw // 2, sh // 2, duration=0.2)

    # --------------------------------------------------------------------------
    # KONTROLA KLAWIATURY I SKRÓTÓW SYSTEMOWYCH
    # --------------------------------------------------------------------------
    def keyboard_type(self, text, interval=0.02):
        """Wpisuje dowolny tekst za pomocą klawiatury."""
        if not HAS_PYAUTOGUI:
            return
        # Użycie schowka dla znaków polskich i Unicode
        if any(ord(c) > 127 for c in text):
            self.paste_text(text)
        else:
            pyautogui.write(text, interval=interval)

    def paste_text(self, text):
        """Wkleja tekst przez schowek systemowy."""
        try:
            import tkinter as tk
            r = tk.Tk()
            r.withdraw()
            r.clipboard_clear()
            r.clipboard_append(text)
            r.update()
            r.destroy()
            time.sleep(0.05)
            self.hotkey('ctrl', 'v')
        except Exception:
            if HAS_PYAUTOGUI:
                pyautogui.write(text)

    def press_key(self, key_name):
        """Naciska i puszcza pojedynczy klawisz (np. 'enter', 'esc', 'space', 'tab')."""
        if HAS_PYAUTOGUI:
            pyautogui.press(key_name)

    def hotkey(self, *keys):
        """Wykonuje kombinację klawiszy, np. hotkey('ctrl', 'c') lub hotkey('win', 'd')."""
        if HAS_PYAUTOGUI:
            pyautogui.hotkey(*keys)

    # --------------------------------------------------------------------------
    # WIDZENIE I ANALIZA EKRANU (SCREEN VISION)
    # --------------------------------------------------------------------------
    def take_screenshot(self, filename="jarvis_screen_capture.png"):
        """Wykonuje zrzut całego ekranu."""
        if HAS_PIL:
            screenshot = ImageGrab.grab()
            screenshot.save(filename)
            return filename
        elif HAS_PYAUTOGUI:
            pyautogui.screenshot(filename)
            return filename
        return None

    def get_screen_size(self):
        """Zwraca rozdzielczość ekranu (szerokość, wysokość)."""
        if HAS_PYAUTOGUI:
            return pyautogui.size()
        return (1920, 1080)

    # --------------------------------------------------------------------------
    # SKRÓTY SYSTEMOWE I APLIKACJE
    # --------------------------------------------------------------------------
    def system_action(self, action_name):
        """Wykonuje zaawansowane akcje systemowe Windows / Linux / macOS."""
        action = action_name.lower()
        if "pulpit" in action or "pokaz pulpit" in action:
            self.hotkey('win', 'd')
            self.speak("Pulpit odsłonięty, Sir.")
        elif "zamknij okno" in action or "zamknij program" in action:
            self.hotkey('alt', 'f4')
            self.speak("Bieżące okno zostało zamknięte.")
        elif "przełącz" in action or "zmień okno" in action:
            self.hotkey('alt', 'tab')
            self.speak("Przełączam okno aplikacji.")
        elif "nowa karta" in action:
            self.hotkey('ctrl', 't')
            self.speak("Otwarto nową kartę przeglądarki.")
        elif "zamknij karte" in action:
            self.hotkey('ctrl', 'w')
            self.speak("Karta zamknięta.")
        elif "odśwież" in action or "odswiez" in action:
            self.press_key('f5')
            self.speak("Strona odświeżona.")
        elif "kopiuj" in action:
            self.hotkey('ctrl', 'c')
            self.speak("Skopiowano do schowka.")
        elif "wklej" in action:
            self.hotkey('ctrl', 'v')
            self.speak("Wklejono zawartość.")
        elif "zaznacz wszystko" in action:
            self.hotkey('ctrl', 'a')
            self.speak("Zaznaczono cały tekst.")
        elif "menedżer zadań" in action:
            self.hotkey('ctrl', 'shift', 'esc')
            self.speak("Uruchamiam Menedżer Zadań.")
        elif "zablokuj" in action:
            self.hotkey('win', 'l')
            self.speak("Stacja robocza zablokowana. Do zobaczenia, Sir.")
        elif "głośniej" in action or "glosniej" in action:
            for _ in range(5):
                self.press_key('volumeup')
            self.speak("Zwiększyłem głośność.")
        elif "ciszej" in action:
            for _ in range(5):
                self.press_key('volumedown')
            self.speak("Zmniejszyłem głośność.")
        elif "wycisz" in action:
            self.press_key('volumemute')
            self.speak("Dźwięk wyciszony.")
        elif "odtwarzaj" in action or "pauza" in action or "zatrzymaj muzyke" in action:
            self.press_key('playpause')
            self.speak("Przełączyłem stan odtwarzacza multimediów.")

    def open_app(self, app_name):
        """Otwiera program lub stronę WWW."""
        name = app_name.lower().strip()
        if "notatnik" in name or "notepad" in name:
            subprocess.Popen("notepad.exe" if sys.platform == "win32" else "gedit")
            self.speak("Otwieram Notatnik, Sir.")
        elif "kalkulator" in name or "calc" in name:
            subprocess.Popen("calc.exe" if sys.platform == "win32" else "gnome-calculator")
            self.speak("Kalkulator jest gotowy.")
        elif "przeglądarka" in name or "chrome" in name or "google" in name:
            import webbrowser
            webbrowser.open("https://www.google.com")
            self.speak("Otwieram przeglądarkę.")
        elif "youtube" in name:
            import webbrowser
            webbrowser.open("https://www.youtube.com")
            self.speak("Uruchamiam serwis YouTube.")
        elif "spotify" in name:
            subprocess.Popen("start spotify:" if sys.platform == "win32" else "spotify", shell=True)
            self.speak("Uruchamiam odtwarzacz Spotify.")
        else:
            # Próba otwarcia przez menu Start
            if HAS_PYAUTOGUI:
                pyautogui.press('win')
                time.sleep(0.3)
                self.keyboard_type(name)
                time.sleep(0.3)
                pyautogui.press('enter')
                self.speak(f"Szukam i uruchamiam aplikację: {app_name}")

    # --------------------------------------------------------------------------
    # GŁÓWNY INTERPRETER ROZKAZÓW
    # --------------------------------------------------------------------------
    def process_command(self, cmd):
        if not cmd:
            return True
            
        cmd_clean = cmd.strip()
        lower = cmd_clean.lower()

        # Rejestracja wypowiedzi w 14-dniowej pamięci
        self.log_conversation("user", cmd_clean)

        # Wyjście z programu
        if lower in ["wyjście", "exit", "quit", "wyłącz się", "koniec", "papa"]:
            self.speak(f"Zamykam protokoły Jarvis OS. Dobrego dnia, {self.user_title}.")
            self.log_conversation("jarvis", f"Zamykam protokoły Jarvis OS. Dobrego dnia, {self.user_title}.")
            return False

        # Trwałe wskazówki i ważne rzeczy (NA STAŁE)
        if lower.startswith("zapisz wskazówkę") or lower.startswith("zapisz wskazowke") or lower.startswith("dodaj wskazówkę") or lower.startswith("wskazówka:"):
            raw = cmd_clean.replace("zapisz wskazówkę", "").replace("zapisz wskazowke", "").replace("dodaj wskazówkę", "").replace("wskazówka:", "").strip()
            if "=" in raw:
                title, content = raw.split("=", 1)
                self.add_permanent_tip(title.strip(), content.strip(), "tip", "Wskazówki")
            else:
                self.add_permanent_tip("Wskazówka", raw, "tip", "Wskazówki")
            return True

        if "pokaż wskazówki" in lower or "pokaz wskazowki" in lower or "stałe wskazówki" in lower or "baza wskazówek" in lower:
            tips = [p for p in self.permanent_insights if p.get("type") == "tip"]
            msg = f"Oto Twoje trwałe wskazówki ({len(tips)} wpisów), {self.user_title}:\n"
            for idx, t in enumerate(tips[:5], 1):
                msg += f" {idx}. [{t.get('title')}]: {t.get('content')}\n"
            self.speak(msg)
            self.log_conversation("jarvis", msg)
            return True

        if "co mówiłem" in lower or "co mowilem" in lower or "historia rozmów" in lower or "pamięć 14 dni" in lower or "2 tygodnie" in lower:
            user_entries = [c for c in self.conversations if c.get("sender") == "user"][-5:]
            msg = f"W buforze 14-dniowym mam {len(self.conversations)} wypowiedzi i pytań z 2 tygodni, {self.user_title}.\nOstatnie zapytania:\n"
            for idx, c in enumerate(user_entries, 1):
                msg += f" {idx}. [{c.get('timestamp')}]: {c.get('text')}\n"
            self.speak(msg)
            self.log_conversation("jarvis", msg)
            return True

        # Uczenie się słownika: ucz się [klucz] = [wartość] lub zapamiętaj że [klucz] = [wartość]
        if "ucz się" in lower or "zapamiętaj że" in lower or "zapamietaj ze" in lower:
            raw = lower.replace("ucz się", "").replace("zapamiętaj że", "").replace("zapamietaj ze", "")
            if "=" in raw:
                parts = raw.split("=")
                k = parts[0].strip()
                v = "=".join(parts[1:]).strip()
                self.learn(k, v)
                return True

        # Sterowanie myszą: przesuń mysz na środek, kliknij, przewiń
        if "mysz na środek" in lower or "kursor na srodek" in lower:
            self.mouse_center()
            self.speak("Kursor ustawiony w centrum ekranu.")
            return True

        if "kliknij dwa razy" in lower or "dwuklik" in lower:
            self.mouse_click('left', 2)
            self.speak("Wykonano podwójne kliknięcie.")
            return True

        if "prawy przycisk" in lower or "prawoklik" in lower:
            self.mouse_click('right', 1)
            self.speak("Otwarto menu kontekstowe.")
            return True

        if "kliknij" in lower:
            self.mouse_click('left', 1)
            self.speak("Kliknięcie wykonane.")
            return True

        if "przewiń w dół" in lower or "przewin w dol" in lower or "scroll w dół" in lower:
            self.mouse_scroll(-600)
            self.speak("Przewinięto w dół.")
            return True

        if "przewiń w górę" in lower or "przewin w gore" in lower or "scroll w górę" in lower:
            self.mouse_scroll(600)
            self.speak("Przewinięto w górę.")
            return True

        # Pisanie tekstu: napisz [tekst], wpisz [tekst]
        if lower.startswith("napisz ") or lower.startswith("wpisz "):
            txt_to_type = cmd_clean[7:].strip()
            self.keyboard_type(txt_to_type)
            self.speak("Wpisałem podyktowany tekst, Sir.")
            return True

        # Zrzut ekranu / Widzenie
        if "zrób zrzut ekranu" in lower or "screenshot" in lower or "zrzut ekranu" in lower:
            fname = self.take_screenshot()
            self.speak(f"Zrzut ekranu został zapisany do pliku {fname}, Sir.")
            return True

        # Uruchamianie programów
        if lower.startswith("otwórz ") or lower.startswith("uruchom "):
            app_query = cmd_clean[7:].strip()
            self.open_app(app_query)
            return True

        # Akcje systemowe: pulpit, zamknij, alt+tab, głośniej itp.
        system_keywords = [
            "pulpit", "zamknij okno", "zamknij program", "przełącz", "zmień okno", 
            "nowa karta", "zamknij karte", "odśwież", "kopiuj", "wklej", 
            "zaznacz wszystko", "menedżer zadań", "zablokuj", "głośniej", 
            "ciszej", "wycisz", "odtwarzaj", "pauza"
        ]
        for kw in system_keywords:
            if kw in lower:
                self.system_action(kw)
                return True

        # Sprawdzenie pamięci lokalnej
        for k, v in self.memory.items():
            if k.lower() in lower:
                self.speak(f"{v} ({self.user_title})")
                return True

        # Domyślna odpowiedź
        self.speak(f"Przyjąłem polecenie: '{cmd_clean}', {self.user_title}. Wykonuję analizę Stark OS.")
        return True

    # --------------------------------------------------------------------------
    # GŁÓWNA PĘTLA DZIAŁANIA (CLI & VOICE LOOP)
    # --------------------------------------------------------------------------
    def run(self):
        self.speak("System J.A.R.V.I.S. OS Master Controller został aktywowany. Czekam na dyspozycje.")
        print("\n=======================================================")
        print(" [POMOC KLAWISZOWA]:")
        print("  - Wpisz 'otwórz kalkulator / notatnik / chrome / youtube'")
        print("  - Wpisz 'napisz [dowolny tekst]' aby Jarvis wpisał go klawiaturą")
        print("  - Wpisz 'kliknij', 'prawoklik', 'przewiń w dół'")
        print("  - Wpisz 'pulpit', 'zamknij okno', 'głośniej', 'screenshot'")
        print("  - Wpisz 'ucz się [klucz] = [wartość]' aby dodać nową wiedzę")
        print("  - Wpisz 'wyjście' aby zamknąć program")
        print("=======================================================\n")

        while True:
            try:
                user_cmd = input("\nJarvis CLI > ")
                if not self.process_command(user_cmd):
                    break
            except KeyboardInterrupt:
                print("\n[JARVIS]: Zatrzymano na żądanie użytkownika.")
                break
            except Exception as e:
                print(f"[JARVIS Error]: {e}")


if __name__ == "__main__":
    controller = JarvisOSController()
    controller.run()
