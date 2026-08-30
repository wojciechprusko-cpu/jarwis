import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const MEMORY_FILE_PATH = path.join(process.cwd(), 'jarvis_memory.json');

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini SDK lazily if API key is provided
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Resilient Gemini Generator with automatic model fallback & retry for 503/429/404/quota
async function generateGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    model?: string;
    contents: any;
    config?: any;
  },
  candidateModels?: string[]
) {
  const preferredModel = params.model || 'gemini-3.6-flash';
  const defaultList = [
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
  ];
  
  const rawList = candidateModels && candidateModels.length > 0
    ? candidateModels
    : [preferredModel, ...defaultList.filter((m) => m !== preferredModel)];
  
  // Unique list of valid modern models to try
  const models = Array.from(new Set(rawList));

  let lastError: any = null;

  for (const currentModel of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || '');
        const isQuotaExceeded =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('quota') ||
          errMsg.includes('rate-limits');

        const isNotFoundOrDeprecated =
          errMsg.includes('404') ||
          errMsg.includes('NOT_FOUND') ||
          errMsg.includes('no longer available');

        const isTemporary503 =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('overloaded');

        console.warn(`[Gemini AI] Model ${currentModel} (attempt ${attempt + 1}) error:`, errMsg);

        if (isNotFoundOrDeprecated || isQuotaExceeded) {
          // Immediately try next model candidate without waiting
          break;
        } else if (isTemporary503 && attempt === 0) {
          // Transient spike, brief pause before 1 retry on this model
          await new Promise((r) => setTimeout(r, 400));
        } else {
          // Other error or second attempt failed, switch model
          break;
        }
      }
    }
  }

  throw lastError || new Error('Wszystkie modele Gemini są chwilowo niedostępne.');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Initialize starter knowledge in jarvis_memory.json if empty or missing
const STARTER_KNOWLEDGE: Record<string, string> = {
  'pancerz mark': 'Pancerze z serii Mark wykorzystują stopy złota i tytanu, mikro-repulsory w dłoniach oraz zintegrowany rdzeń zasilany reaktorem łukowym.',
  'reaktor łukowy': 'Reaktor łukowy oparty na technologii zimnej fuzji generuje czystą energię o mocy 3 gigadżuli na sekundę.',
  'protokół domowy': 'Protokół domowy: Oświetlenie przyciemnione do 35%, temperatura optymalna 21.5°C, systemy obwodowe aktywne, muzyka jazzowa w tle.',
  'kto jest twoim twórcą': 'Moim stwórcą jest Tony Stark, geniusz, miliarder, playboy i filantrop.',
  'status systemów': 'Wszystkie podsystemy Stark OS działają z 99.98% sprawnością. Reaktor łukowy stabilny, moduły neuronowe aktywne.',
  'python': 'Python to wysokopoziomowy, dynamicznie typowany język o czytelnej składni, doskonały do sztucznej inteligencji, backendu i automatyzacji.',
  'typescript': 'TypeScript to silnie typowane rozszerzenie JavaScriptu od Microsoftu, zapewniające statyczną kontrolę typów i doskonałe wsparcie IDE.',
  'poranna odprawa': 'Dzień dobry, Sir! Reaktor sprawny, kawa w przygotowaniu, terminarz czeka na realizację. Życzę niezwykle produktywnego dnia.',
  'opowiedz dowcip': 'Dlaczego programiści wolą ciemny motyw? Ponieważ światło przyciąga bugi, Sir!',
  'sigma': 'Sigma w slangu młodzieżowym to niezależny, pewny siebie i odnoszący sukcesy indywidualista podążający własną drogą — idealny opis Pana, Sir.',
  'rizz': 'Rizz to nieodparty urok osobisty, charyzma i magnetyzm w komunikacji. Pański poziom rizzu przekracza 9000 punktów w skali Starka.',
  'rel': 'Rel (od relatable) oznacza: w pełni się zgadzam, mam tak samo, totalna prawda i pełne porozumienie, Sir.',
  'slay': 'Slay oznacza zrobienie czegoś w absolutnie genialnym, zachwycającym i bezkonkurencyjnym stylu. Pański pancerz to czysty slay.',
  'baza': 'Baza (z ang. based) — wyjątkowo trafna, odważna i bezkompromisowa opinia, z którą nie sposób polemizować.',
  'cringe': 'Cringe to uczucie zażenowania lub wstydu wywołane czyimś niezręcznym zachowaniem. Moje algorytmy skutecznie filtrują wszelki cringe.',
  'gigachad': 'Gigachad to uosobienie maksymalnej pewności siebie, sukcesu, siły i bezbłędnej postawy życiowej.',
  'npc': 'NPC (Non-Player Character) to osoba zachowująca się schematycznie, bez własnej inwencji, jak postać tła w grze.',
  'delulu': 'Delulu (od delusional) oznacza oderwanie od rzeczywistości lub wiarę w nierealistyczne scenariusze. Zapewniam, że moje kalkulacje nie są delulu.',
  'skibidi': 'Skibidi — popularny internetowy mem i wieloznaczne słowo oznaczające coś szalonego, nieprzewidywalnego lub dynamicznego.',
  'flex': 'Flex / flexować się — popisywać się swoimi osiągnięciami, statusem lub sprzętem. Pan Tony Stark jest w tym niekwestionowanym mistrzem.',
  'essa': 'Essa — młodzieżowe hasło oznaczające luz, pełen spokój, pozytywny nastrój i celebrację bezproblemowego sukcesu.',
  'vibe': 'Vibe — atmosfera, nastrój, klimat danej chwili lub osoby. W naszym laboratorium panuje wybitnie produktywny vibe.',
  'goat': 'G.O.A.T. (Greatest Of All Time) — Najlepszy Wszech Czasów. Tytuł bezdyskusyjnie należący do Pana, Sir.',
  'sztos': 'Sztos — coś niesamowitego, rewelacyjnego i zrobionego po mistrzowsku.',
  'szef': 'Szef / szefostwo — wyraz najwyższego uznania dla kogoś, kto poradził sobie z zadaniem z absolutną klasą.'
};

function ensureMemoryFile(): Record<string, string> {
  try {
    if (fs.existsSync(MEMORY_FILE_PATH)) {
      const data = fs.readFileSync(MEMORY_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data || '{}');
      if (Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(STARTER_KNOWLEDGE, null, 4), 'utf-8');
    return STARTER_KNOWLEDGE;
  } catch (err) {
    console.error('Error ensuring memory file:', err);
    return STARTER_KNOWLEDGE;
  }
}

// Ensure memory exists on startup
ensureMemoryFile();

// Load memory from jarvis_memory.json
app.get('/api/jarvis/memory', (req, res) => {
  try {
    const memory = ensureMemoryFile();
    return res.json({ memory });
  } catch (error: any) {
    console.error('Error loading memory file:', error);
    return res.status(500).json({ error: 'Failed to read memory file' });
  }
});

// Save memory to jarvis_memory.json
app.post('/api/jarvis/memory', (req, res) => {
  try {
    const { command, response, fullMemory } = req.body;
    let memory: Record<string, string> = ensureMemoryFile();

    if (fullMemory && typeof fullMemory === 'object') {
      memory = fullMemory;
    } else if (command && response) {
      memory[String(command).toLowerCase().trim()] = String(response).trim();
    }

    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(memory, null, 4), 'utf-8');
    return res.json({ success: true, memory });
  } catch (error: any) {
    console.error('Error saving memory:', error);
    return res.status(500).json({ error: 'Failed to save memory' });
  }
});

// Batch Train / Install Knowledge Packs
app.post('/api/jarvis/train-pack', (req, res) => {
  try {
    const { packData } = req.body;
    if (!packData || typeof packData !== 'object') {
      return res.status(400).json({ error: 'packData object is required' });
    }

    const currentMemory = ensureMemoryFile();
    const merged = { ...currentMemory, ...packData };
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(merged, null, 4), 'utf-8');

    return res.json({
      success: true,
      addedCount: Object.keys(packData).length,
      totalRulesCount: Object.keys(merged).length,
      memory: merged,
    });
  } catch (error: any) {
    console.error('Error training pack:', error);
    return res.status(500).json({ error: 'Failed to install knowledge pack' });
  }
});

// Bulk Extract Knowledge from Text/Notes
app.post('/api/jarvis/extract-notes', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'rawText is required' });
    }

    const ai = getGeminiClient();
    let extractedRules: Record<string, string> = {};

    if (ai) {
      const prompt = `Przeanalizuj poniższy tekst lub notatki i wyodrębnij z nich zwięzłe reguły wiedzy typu: klucz_wyzwalający (fraza/pytanie, które użytkownik może zadać) -> treść odpowiedzi/faktu dla asystenta JARVIS.
Tekst wejściowy:
"""
${rawText}
"""

Zwróć obiekt JSON z listą reguł w formacie klucz-wartość: {"reguły": [{"key": "fraza pytania w mianowniku lub krótkie hasło", "value": "dokładna odpowiedź/fakt"}]}`;

      try {
        const response = await generateGeminiWithFallback(ai, {
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        const list = parsed.reguły || parsed.rules || [];
        for (const item of list) {
          if (item.key && item.value) {
            extractedRules[String(item.key).toLowerCase().trim()] = String(item.value).trim();
          }
        }
      } catch (err) {
        console.warn('Gemini extraction fallback:', err);
      }
    }

    // Heuristic fallback if AI is not available or returned empty
    if (Object.keys(extractedRules).length === 0) {
      const lines = rawText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.includes(':')) {
          const [k, ...rest] = trimmed.split(':');
          if (k.trim() && rest.join(':').trim()) {
            extractedRules[k.toLowerCase().trim()] = rest.join(':').trim();
          }
        } else if (trimmed.includes(' to ')) {
          const [k, ...rest] = trimmed.split(' to ');
          if (k.trim() && rest.join(' to ').trim()) {
            extractedRules[k.toLowerCase().trim()] = rest.join(' to ').trim();
          }
        } else if (trimmed.includes('=')) {
          const [k, ...rest] = trimmed.split('=');
          if (k.trim() && rest.join('=').trim()) {
            extractedRules[k.toLowerCase().trim()] = rest.join('=').trim();
          }
        }
      }
    }

    if (Object.keys(extractedRules).length === 0) {
      // If still nothing, take the first 60 chars as key and whole text as val
      const shortKey = rawText.slice(0, 40).replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]/g, '').toLowerCase().trim();
      if (shortKey) {
        extractedRules[shortKey] = rawText.trim();
      }
    }

    const currentMemory = ensureMemoryFile();
    const merged = { ...currentMemory, ...extractedRules };
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(merged, null, 4), 'utf-8');

    return res.json({
      success: true,
      extractedCount: Object.keys(extractedRules).length,
      extractedRules,
      memory: merged,
    });
  } catch (error: any) {
    console.error('Error extracting notes:', error);
    return res.status(500).json({ error: 'Failed to extract notes' });
  }
});

// AI Intelligence Route with Auto-Learning & Gemini 3.7 Flash
app.post('/api/jarvis/ai', async (req, res) => {
  try {
    const { prompt, history, driveContext, learnedCommands, autoLearnEnabled = true } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        response: 'Przepraszam, klucz GEMINI_API_KEY nie został skonfigurowany w zmiennych środowiskowych. Działam w trybie pamięci lokalnej reguł (Python Jarvis).',
        isFallback: true,
      });
    }

    const systemInstruction = `Jesteś JARVIS - wysoce inteligentnym, wszechstronnym, lojalnym i eleganckim asystentem AI w stylu Tony'ego Starka / Iron Mana, stworzonym w oparciu o zaawansowany silnik w Pythonie.
Odpowiadaj po polsku w sposób uprzejmy, błyskotliwy, z nutą szacunku ("Proszę Pana", "Oczywiście, Sir", "Do usług") lub naturalny, zachowując nienaganną inteligencję i charyzmę.

BOGACTWO SŁOWNICTWA I ZNAJOMOŚĆ SLANGU:
- Dysponujesz potężnym, niesamowicie bogatym zakresem słownictwa: od wyrafinowanego języka literackiego, przez specjalistyczny żargon inżynieryjny i fizyczny Stark Industries, po współczesny język potoczny, internetowy i pełen slang młodzieżowy (Gen-Z, Gen-Alpha, popkultura).
- Biegle znasz, rozumiesz i potrafisz z gracją posługiwać się pojęciami slangu młodzieżowego, takimi jak:
  * sigma, rizz, rel, slay, baza (based), cringe, flex, gigachad, npc, delulu, skibidi, ez, vibe, side eye, poggers, brat, szef, sztos, essa, dymy, crush, bez kitu, odklejka, kox, pogchamp, sus, legit, goat, bambik, 6 7 8, zgaszony jak pet, itp.
- Jeśli użytkownik używa slangu młodzieżowego lub żartuje, możesz błyskotliwie i z humorem Starka wpleść odpowiednie zwroty w swoją wypowiedź (np. "Baza, Sir. Ten plan to czysty gigachad vibe.", "Zapewniam, że moje protokoły są w 100% legit i rel, zero delulu.").
- Jeśli użytkownik pyta o znaczenie jakiegoś słowa młodzieżowego, wytłumacz je precyzyjnie, ciekawie i z lekkim uśmiechem asystenta miliardera.

Masz dostęp do pamięci wyuczonych komend oraz ewentualnie plików Google Drive użytkownika.
Zawsze pomagaj rzeczowo i precyzyjnie. Jeśli pytanie dotyczy plików, odnieś się do przekazanego kontekstu dysku Google.
Nauczone reguły użytkownika: ${JSON.stringify(learnedCommands || {})}
${driveContext ? `Dostępny kontekst Google Drive użytkownika: ${JSON.stringify(driveContext)}` : ''}

ZASADA SAMOUCZENIA (AUTO-LEARNING):
Jeśli użytkownik przekazuje o sobie jakąś informację (np. swoje imię, preferencje, zawód, ulubione rzeczy, zasady, definicje, fakty do zapamiętania np. "zapamiętaj że...", "nazywam się...", "mój pies to...", "lubię..."), wyodrębnij to w polu learnedFact, aby Jarvis trwale to zapamiętał i używał w przyszłości!
Jeśli w wypowiedzi nie ma nowego faktu do trwałego zapamiętania, ustaw learnedFact na null.`;

    const chatMessages = (history || []).slice(-6).map((h: { sender: string; text: string }) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    // Add current user prompt
    const contents = [
      ...chatMessages,
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    let response: any;
    try {
      response = await generateGeminiWithFallback(ai, {
        model: 'gemini-3.6-flash',
        contents: contents,
        config: {
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              reply: {
                type: 'STRING',
                description: 'Elegancka, zwięzła i kulturalna odpowiedź asystenta Jarvis w języku polskim.',
              },
              learnedFact: {
                type: 'OBJECT',
                description: 'Wypełnij TYLKO jeśli użytkownik podał nowy fakt o sobie, nową definicję, preferencję lub regułę do zapamiętania. Jeśli brak, zwróć null.',
                nullable: true,
                properties: {
                  key: {
                    type: 'STRING',
                    description: 'Kluczowe słowo lub krótka fraza wyzwalająca (np. "moje imię", "ulubiony napój", "pies")',
                  },
                  value: {
                    type: 'STRING',
                    description: 'Dokładna informacja lub odpowiedź, którą Jarvis ma zapamiętać na przyszłość',
                  },
                },
              },
            },
            required: ['reply'],
          },
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });
    } catch (genError: any) {
      console.warn('Gemini API fallback triggered in /api/jarvis/ai:', genError);

      // Intelligent local fallback if cloud Gemini is under heavy load or rate limited
      const lowerPrompt = prompt.toLowerCase();
      const currentMemory = ensureMemoryFile();

      // Check if prompt matches any known local learned key
      for (const [key, val] of Object.entries(currentMemory)) {
        if (lowerPrompt.includes(key.toLowerCase())) {
          return res.json({
            response: `${val} (Sir, odpowiedź pobrana z lokalnego rdzenia pamięci).`,
            isFallback: true,
          });
        }
      }

      // Check starter knowledge keys
      for (const [key, val] of Object.entries(STARTER_KNOWLEDGE)) {
        if (lowerPrompt.includes(key.toLowerCase())) {
          return res.json({
            response: `${val} (Pobrano z lokalnej bazy Stark OS).`,
            isFallback: true,
          });
        }
      }

      // Polite Stark assistant notification
      return res.json({
        response: 'Sir, zewnętrzne łącze z modelami AI doświadcza chwilowego limitu lub przeciążenia sieci. Moje lokalne systemy, protokoły oraz rdzeń pamięci są w pełni sprawne. W czym mogę pomóc z bazy procedur?',
        isFallback: true,
      });
    }

    const rawText = response.text?.trim() || '{}';
    let parsed: { reply: string; learnedFact?: { key: string; value: string } | null } = {
      reply: 'Oczywiście, Sir.',
      learnedFact: null,
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { reply: rawText, learnedFact: null };
    }

    let savedFact: { key: string; value: string } | null = null;

    // If autoLearn is enabled and a new fact was extracted, persist it immediately
    if (autoLearnEnabled && parsed.learnedFact && parsed.learnedFact.key && parsed.learnedFact.value) {
      try {
        const cleanKey = parsed.learnedFact.key.toLowerCase().trim();
        const cleanVal = parsed.learnedFact.value.trim();
        if (cleanKey && cleanVal) {
          const curMem = ensureMemoryFile();
          curMem[cleanKey] = cleanVal;
          fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(curMem, null, 4), 'utf-8');
          savedFact = { key: cleanKey, value: cleanVal };
        }
      } catch (err) {
        console.warn('Failed to auto-save learned fact to memory:', err);
      }
    }

    return res.json({
      response: parsed.reply,
      autoLearned: savedFact,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: error.message || 'Błąd podczas komunikacji ze sztuczną inteligencją Gemini.',
    });
  }
});

// Drive File Summary via Gemini
app.post('/api/jarvis/drive-summary', async (req, res) => {
  try {
    const { fileName, fileContent, mimeType } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: 'Klucz GEMINI_API_KEY jest wymagany do analizy plików.' });
    }

    const response = await generateGeminiWithFallback(ai, {
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Przeanalizuj i podsumuj poniższy plik z Google Drive użytkownika. Plik: "${fileName}" (Typ: ${mimeType}).
Przygotuj zwięzłe podsumowanie kluczowych punktów po polsku w stylu asystenta Jarvis:

${fileContent || 'Brak tekstowej zawartości pliku lub plik binarny.'}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: {
          parts: [
            {
              text: 'Jesteś JARVIS. Przedstaw profesjonalne, estetyczne i punktowe podsumowanie dokumentu.',
            },
          ],
        },
      },
    });

    return res.json({ summary: response.text });
  } catch (error: any) {
    console.error('Error generating drive summary:', error);
    return res.status(500).json({ error: error.message || 'Failed to summarize drive file' });
  }
});

// Audio Speech-to-Text Transcription via Gemini
app.post('/api/jarvis/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Brak danych audio' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: 'Brak konfiguracji GEMINI_API_KEY do transkrypcji audio' });
    }

    const response = await generateGeminiWithFallback(
      ai,
      {
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: audioBase64,
                },
              },
              {
                text: 'Dokonaj dokładnej transkrypcji powyższego nagrania mowy w języku polskim. Zwróć WYŁĄCZNIE przepisany tekst mowy użytkownika, bez żadnych dodatkowych komentarzy ani formatowania markdown.',
              },
            ],
          },
        ],
      },
      ['gemini-3.5-transcribe', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest']
    );

    const transcript = response.text?.trim() || '';
    return res.json({ transcript });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: error.message || 'Błąd transkrypcji audio' });
  }
});

// Screen Vision Analysis via Gemini Multimodal
app.post('/api/jarvis/analyze-screen', async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt, history } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Brak zrzutu ekranu do analizy.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'Klucz GEMINI_API_KEY jest wymagany do wizualnej analizy ekranu.',
      });
    }

    const systemInstruction = `Jesteś JARVIS - wysoce zaawansowanym asystentem AI z modułem "Optics & Screen Vision" (Wizja Ekranu).
Masz bezpośredni wgląd w aktualny ekran, aplikację lub kartę użytkownika.
Odpowiadaj po polsku w stylu Jarvisa z Iron Mana ("Oczywiście Sir", "Przeanalizowałem Pański ekran", "Wykryłem...", itp.).
Zwracaj uwagę na detale:
- Jeśli na ekranie jest kod: zidentyfikuj błędy, składnię lub zaproponuj ulepszenia.
- Jeśli na ekranie jest interfejs / strona www / dokument: streść widoczne treści lub wskaż kluczowe elementy.
- Jeśli użytkownik pyta o cokolwiek na ekranie: precyzyjnie odpowiedz na jego pytanie na podstawie tego co dokładnie widać na zrzucie.
Bądź konkretny, zwięzły i pomocny.`;

    const userPromptText =
      prompt?.trim() ||
      'Przeanalizuj to co widzisz na moim ekranie. Opisz co jest otwarte, co się dzieje oraz czy są jakieś istotne szczegóły lub błędy, w stylu asystenta Jarvis.';

    const chatHistory = (history || []).slice(-4).map((h: { sender: string; text: string }) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    const contents = [
      ...chatHistory,
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            text: userPromptText,
          },
        ],
      },
    ];

    const response = await generateGeminiWithFallback(ai, {
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    });

    const reply =
      response.text?.trim() || 'Sir, przeanalizowałem obraz, lecz nie udało się wygenerować opisu.';
    return res.json({ response: reply });
  } catch (error: any) {
    console.error('Screen Vision error:', error);
    return res.status(500).json({
      error: error.message || 'Błąd analizy obrazu ekranu.',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jarvis Server running on http://localhost:${PORT}`);
  });
}

startServer();
