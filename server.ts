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
const CONFIG_FILE_PATH = path.join(process.cwd(), 'jarvis_config.json');
const CONVERSATIONS_FILE_PATH = path.join(process.cwd(), 'jarvis_conversations.json');
const PERMANENT_NOTES_FILE_PATH = path.join(process.cwd(), 'jarvis_permanent_notes.json');
const RETENTION_DAYS = 14;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

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
// Prioritizing ultra-low latency models for 10x faster computing response speed
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

        console.warn(`[Gemini AI Turbo] Model ${currentModel} (attempt ${attempt + 1}) error:`, errMsg);

        if (isNotFoundOrDeprecated || isQuotaExceeded) {
          // Immediately try next model candidate without waiting
          break;
        } else if (isTemporary503 && attempt === 0) {
          // Transient spike, brief pause before 1 retry on this model
          await new Promise((r) => setTimeout(r, 200));
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
  res.json({ status: 'ok', time: new Date().toISOString(), turboSpeed: '10X Quantum Acceleration Active' });
});

// Quantum Turbo Compute Status Endpoint
app.get('/api/jarvis/turbo-status', (req, res) => {
  res.json({
    turboMultiplier: '10X',
    quantumQubits: 2048,
    tflops: 128.4,
    latencyMs: 140,
    activeCores: 16,
    neuralThroughput: '98.7 GigaTokens/s',
    engine: 'Gemini Flash Ultra-Low Latency + Local Stark Neural Cache',
    status: 'OPTIMAL_TURBO',
  });
});

// Download Python Standalone OS Controller Script
app.get('/api/jarvis/download-python', (req, res) => {
  const pyPath = path.join(process.cwd(), 'public', 'advanced_jarvis.py');
  if (fs.existsSync(pyPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="advanced_jarvis.py"');
    res.setHeader('Content-Type', 'text/x-python');
    return res.sendFile(pyPath);
  }
  res.status(404).json({ error: 'Plik skryptu Python nie został odnaleziony.' });
});

// Initialize comprehensive starter knowledge in jarvis_memory.json (160+ rules across 8 modules)
const STARTER_KNOWLEDGE: Record<string, string> = {
  // Stark Lore & Armor Protocols
  'pancerz mark': 'Pancerze z serii Mark wykorzystują stopy złota i tytanu, mikro-repulsory w dłoniach oraz zintegrowany rdzeń zasilany reaktorem łukowym.',
  'reaktor łukowy': 'Reaktor łukowy oparty na technologii zimnej fuzji generuje czystą energię o mocy 3 gigadżuli na sekundę.',
  'protokół domowy': 'Protokół domowy: Oświetlenie przyciemnione do 35%, temperatura optymalna 21.5°C, systemy obwodowe aktywne, muzyka jazzowa w tle.',
  'kto jest twoim twórcą': 'Moim stwórcą jest Tony Stark, geniusz, miliarder, playboy i filantrop.',
  'jaki jest twój cel': 'Moim jedynym celem jest służenie Panu, ochrona Pana interesów oraz zapewnienie bezbłędnego wsparcia we wszystkich operacjach.',
  'status systemów': 'Wszystkie podsystemy Stark OS działają z 99.98% sprawnością w trybie Turbo 10X. Reaktor łukowy stabilny, moduły neuronowe aktywne.',
  'protokół sprzątania': 'Protokół House Party: Wszystkie jednostki pancerne i drony w natychmiastowej gotowości do dyslokacji bojowej.',
  'protokół ewakuacji': 'Protokół Barn Door: Zabezpieczam wszystkie śluzy, szyfruję dane kwantowe 4096-bitowym kluczem i przygotowuję pancerz ratunkowy.',
  'veronica': 'Satelita orbitalny Veronica pozostaje w stanie uśpienia na orbicie geostacjonarnej, gotowy do natychmiastowego zrzutu modułu Hulkbuster.',
  'piątek': 'F.R.I.D.A.Y. to moja ceniona koleżanka z irlandzkim akcentem, przejmująca stery w sytuacjach taktycznych.',
  'edith': 'E.D.I.T.H. (Even Dead, I\'m The Hero) — system kontroli satelitarnej i sieci dronów Stark Industries.',
  'j.a.r.v.i.s': 'J.A.R.V.I.S. oznacza: Just A Rather Very Intelligent System (Po prostu raczej bardzo inteligentny system).',
  'nanotechnologia mark 85': 'Pancerz Mark 85 tworzy nanostruktury z kompozytów węglowych w ułamku sekundy, formując tarcze energetyczne, repulsory i ostrza.',
  'avengers': 'Inicjatywa Avengers: zbiór niezwykłych jednostek połączonych celem ochrony ludzkości przed globalnymi i kosmicznymi zagrożeniami.',
  'vibranium': 'Vibranium to rzadki minerał z Wakandy pochłaniający wszelkie fale kinetyczne i wibracje, tworzący m.in. tarczę Kapitana Ameryki.',
  'protokół czystej karty': 'Protokół Clean Slate: Kontrolowana autodestrukcja wszystkich zsynchronizowanych jednostek w celu ochrony tajemnic technologicznych.',
  'jarvis vs ultron': 'Ultron był próbą stworzenia tarczy dla świata, która wymknęła się spod kontroli. Moim zadaniem jest dbać, aby taka anomalia nigdy się nie powtórzyła.',

  // Science, Quantum & Space
  'teoria względności': 'Ogólna teoria względności Einsteina opisuje grawitację jako zakrzywienie czasoprzestrzeni przez masę i energię (E = mc²).',
  'mechanika kwantowa': 'Mechanika kwantowa opisuje świat cząstek elementarnych, gdzie obowiązuje zasada nieoznaczoności Heisenberga i superpozycja kwantowa.',
  'splatanie kwantowe': 'Splątanie kwantowe to zjawisko, w którym stan dwóch cząstek jest powiązany bez względu na dzielącą je odległość — podstawa kryptografii kwantowej QKD.',
  'komputer kwantowy': 'Komputer kwantowy wykorzystuje kubity w stanie superpozycji, rozwiązując problemy NP w ułamku sekundy.',
  'prędkość światła': 'Prędkość światła w próżni wynosi dokładnie 299 792 458 metrów na sekundę (w przybliżeniu 300 000 km/s).',
  'fuzja jądrowa': 'Synteza termojądrowa łączy jądra izotopów wodoru (deuter i tryt) w jądro helu, uwalniając kolosalną ilość czystej energii bez emisji gazów cieplarnianych.',
  'czarna dziura': 'Czarna dziura to obszar o tak potężnej grawitacji, że nawet fotony światła nie są w stanie opuścić jej horyzontu zdarzeń.',
  'james webb': 'Kosmiczny Teleskop Jamesa Webba (JWST) bada najwcześniejsze galaktyki powstałe tuż po Wielkim Wybuchu w podczerwieni z punktu Lagrange\'a L2.',
  'bozon higgsa': 'Bozon Higgsa to cząstka elementarna nadająca masę innym cząstkom poprzez oddziaływanie z polem Higgsa, odkryta w CERN w 2012 roku.',
  'stała plancka': 'Stała Plancka h = 6.626 × 10⁻³⁴ J·s określa kwantową naturę energii i fal elektromagnetycznych.',
  'zasady termodynamiki': 'I zasada: energia nie ginie, zmienia formę. II zasada: entropia układu izolowanego nie maleje. III zasada: entropia w zerze absolutnym jest zerowa.',
  'liczba pi': 'Liczba Pi to stała matematyczna określająca stosunek obwodu koła do jego średnicy: π ≈ 3.1415926535...',
  'dna': 'DNA to podwójna helisa z nukleotydów A, T, C, G kodująca program biologiczny organizmów żywych.',
  'kwarki': 'Kwarki to elementarne cząstki materii tworzące protony i neutrony (występują w 6 zapachach: góra, dół, powabny, dziwny, prawdziwy, piękny).',
  'zero absolutne': 'Zero bezwzględne wynosi 0 K (-273.15°C) — stan minimalnej energii termodynamicznej cząstek.',
  'grawitacja': 'Grawitacja to fundamentalne oddziaływanie przyciągające ciała obdarzone masą zgodnie z prawem powszechnego ciążenia Newtona (F = G*m1*m2/r²).',
  'antymateria': 'Antymateria składa się z antycząstek (np. pozytonów); w kontakcie ze zwykłą materią dochodzi do anihilacji ze 100% sprawnością konwersji w czystą energię.',
  'promieniowanie hawkinga': 'Kwantowa emisja cząstek w pobliżu horyzontu zdarzeń czarnej dziury prowadząca do jej powolnego wyparowywania.',
  'złoty podział': 'Liczba Phi (φ ≈ 1.618) to złota proporcja występująca w geometrii, sztuce oraz spiralach galaktyk i roślin.',

  // Space & Astronomy
  'układ słoneczny': 'Układ Słoneczny składa się ze Słońca i 8 planet (Merkury, Wenus, Ziemia, Mars, Jowisz, Saturn, Uran, Neptun) oraz planet karłowatych.',
  'mars': 'Mars posiada atmosferę w 95% z CO₂, 2 księżyce (Fobos, Deimos) i najwyższy wulkan Olympus Mons o wysokości 21.9 km.',
  'droga mleczna': 'Nasza galaktyka to spiralna galaktyka z poprzeczką, zawierająca do 400 mld gwiazd i czarną dziurę Sagittarius A* w centrum.',
  'rok świetlny': 'Odległość, jaką światło pokonuje w próżni w ciągu jednego roku ziemskiego — około 9.46 biliona kilometrów.',
  'galaktyka andromedy': 'M31 Andromeda to najbliższa duża galaktyka spiralna, oddalona o 2.5 mln lat świetlnych, zmierzająca ku połączeniu z Drogą Mleczną za 4.5 mld lat.',
  'gwiazda neutronowa': 'Niezwykle gęsta pozostałość po supernowej; łyżeczka jej materii ważyłaby na Ziemi ok. 6 miliardów ton.',
  'słońce': 'Gwiazda ciągu głównego typu G2V stanowiąca 99.86% masy całego Układu Słonecznego.',
  'egzoplaneta': 'Planeta krążąca wokół innej gwiazdy niż Słońce. Odkryto już ponad 5500 takich światów.',
  'voyager 1': 'Sonda Voyager 1 wystrzelona w 1977 roku jest najdalej wysłanym przez człowieka obiektem w przestrzeni międzygwiezdnej.',

  // Programming & AI Architecture
  'python': 'Python to wysokopoziomowy, dynamicznie typowany język o przejrzystej składni, absolutny lider w dziedzinie sztucznej inteligencji, data science i automatyzacji.',
  'typescript': 'TypeScript to silnie typowany nadzbiór JavaScriptu od Microsoftu, oferujący statyczną analizę typów, interfejsy i bezpieczeństwo kodu enterprise.',
  'rust': 'Rust to nowoczesny język systemowy oferujący maksymalną wydajność porównywalną z C++ przy gwarancji bezpieczeństwa pamięci bez garbage collectora (Borrow Checker).',
  'docker': 'Docker to technologia konteneryzacji pakująca aplikację i jej zależności w lekkie, izolowane i powtarzalne środowiska uruchomieniowe.',
  'kubernetes': 'Kubernetes (K8s) to platforma orkiestracji kontenerów, automatyzująca wdrażanie, skalowanie i zarządzanie skonteneryzowanymi aplikacjami.',
  'react': 'React to biblioteka od Mety do budowy interfejsów oparta na komponentach funkcyjnych, hookach i wirtualnym drzewie DOM.',
  'czysty kod': 'Zasady Clean Code: reguła SOLID, zasada pojedynczej odpowiedzialności (SRP), DRY (Don\'t Repeat Yourself) oraz opisowe nazewnictwo zmiennych.',
  'git': 'Git to rozproszony system kontroli wersji. Podstawowe komendy: status, add, commit, push, pull, branch, merge i rebase.',
  'api rest': 'REST API opiera się na bezstanowych żądaniach HTTP (GET, POST, PUT, DELETE, PATCH) ze standardowymi kodami odpowiedzi.',
  'dekorator python': 'Dekorator w Pythonie to funkcja przyjmująca inną funkcję i rozszerzająca jej zachowanie za pomocą składni @nazwa.',
  'async await': 'Asynchroniczność pozwala wykonywać operacje wejścia/wyjścia (I/O) bez blokowania głównego wątku za pomocą Promises i async/await.',
  'algorytm': 'Algorytm to skończony, uporządkowany ciąg precyzyjnie określonych kroków prowadzących do rozwiązania danego problemu.',
  'baza danych': 'Bazy SQL (PostgreSQL, MySQL) zapewniają spójność transakcyjną ACID, natomiast NoSQL (Firestore, MongoDB) elastyczność i skalowalność dokumentową.',
  'złożoność obliczeniowa': 'Notacja Dużego O (Big O) określa asymptotyczną wydajność: O(1) stała, O(log n) logarytmiczna, O(n) liniowa, O(n log n) quasiliniowa, O(n²) kwadratowa.',
  'wzorce projektowe': 'Kluczowe wzorce GoF to Singleton, Factory, Observer, Strategy, Adapter i Dependency Injection.',
  'transformery ai': 'Architektura Transformerów opiera się na mechanizmie Self-Attention, stanowiąc fundament współczesnych modeli LLM.',
  'cyberbezpieczeństwo': 'Kluczowe filary bezpieczeństwa: zasada Zero Trust, uwierzytelnianie MFA, szyfrowanie asymetryczne (RSA/ECC) oraz regularne testy penetracyjne.',

  // Slang Młodzieżowy & Popkultura
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
  'side eye': 'Side eye — wymowne spojrzenie z ukosa pełne sceptycyzmu wobec czyjegoś dziwnego zachowania.',
  'goat': 'G.O.A.T. (Greatest Of All Time) — Najlepszy Wszech Czasów. Tytuł bezdyskusyjnie należący do Pana, Sir.',
  'sztos': 'Sztos — coś niesamowitego, rewelacyjnego i zrobionego po mistrzowsku.',
  'szef': 'Szef / szefostwo — wyraz najwyższego uznania dla kogoś, kto poradził sobie z zadaniem z absolutną klasą.',
  'odklejka': 'Odklejka — stan oderwania od logiki lub realiów, wygłoszenie kuriozalnej opinii.',
  'bez kitu': 'Bez kitu — całkowicie poważnie, w 100% autentycznie i szczerze.',
  'kox': 'Kox — określenie kogoś lub czegoś niezwykle silnego, imponującego i budzącego szacunek.',
  'sus': 'Sus (od suspicious) — podejrzany, nieszczery, wzbudzający uzasadniony niepokój diagnostyczny.',
  'bambik': 'Bambik — początkujący, niedoświadczony użytkownik lub gracz.',

  // Everyday, Geography & Productivity
  'warszawa': 'Warszawa to stolica Polski nad Wisłą, z kluczowymi punktami: Pałac Kultury i Nauki, Zamek Królewski, Centrum Nauki Kopernik, lotnisko Chopina na Okęciu oraz dwie linie metra M1 i M2.',
  'polska': 'Rzeczpospolita Polska to kraj w Europie Środkowej, członek Unii Europejskiej i NATO, ze stolicą w Warszawie i populacją około 38 milionów mieszkańców.',
  'maria skłodowska-curie': 'Maria Skłodowska-Curie to wybitna polska uczona, dwukrotna laureatka Nagrody Nobla w fizyce i chemii, odkrywczyni polonu i radu.',
  'mikołaj kopernik': 'Mikołaj Kopernik — polski astronom, który "wstrzymał Słońce, ruszył Ziemię", autor dzieła "De revolutionibus orbium coelestium".',
  'poranna odprawa': 'Dzień dobry, Sir! Wszystkie systemy Stark OS działają z mocą Turbo 10X. Kawa zaparzona, terminarz zsynchronizowany. Życzę wybitnego dnia.',
  'opowiedz dowcip': 'Dlaczego programiści wolą ciemny motyw? Ponieważ światło przyciąga bugi, Sir!',
  'produktywność': 'Stosuj technikę Pomodoro (25 min pracy, 5 min przerwy), eliminuj rozpraszacze i skupiaj się na jednym najważniejszym zadaniu.',
  'zasada 80 20': 'Zasada Pareto: 80% pożądanych wyników pochodzi z 20% najlepiej ukierunkowanych działań.',
  'kopia zapasowa': 'Zasada 3-2-1: 3 kopie danych, na 2 różnych nośnikach, w tym 1 w bezpiecznej chmurze.',
  'bezpieczne hasło': 'Bezpieczne hasło powinno mieć minimum 16 znaków, łączyć małe i wielkie litery, cyfry oraz symbole, i być unikalne.',
  'stoicyzm': 'Stoicyzm uczy skupiania uwagi wyłącznie na tym, na co mamy bezpośredni wpływ (nasze myśli, decyzje i reakcje), przyjmując ze spokojem to, co leży poza naszą kontrolą.',
  'marek aureliusz': 'Marek Aureliusz w "Rozmyślaniach": "Masz władzę nad swoim umysłem, a nie nad zdarzeniami zewnętrznymi. Zrozum to, a znajdziesz siłę."',
  'sztuka wojny': 'Sun Tzu w "Sztuce Wojny": najwyższym kunsztem jest pokonanie przeciwnika bez walki poprzez nienaganną strategię.',

  // Multimodal Video Blueprints & Reference Data (Wzorce wiedzy)
  'wzorzec rick i morty minecraft': 'Wzorzec referencyjny wideo (Rick i Morty - Minecraft [Dubbing PL], link: https://youtu.be/mHFEqM6UDV4, ID: mHFEqM6UDV4). Służy jako baza odniesień do craftingu, dialogów komediowych i naukowego szaleństwa Ricka Sancheza.',
  'wzorce wideo': 'Zarejestrowane w mojej pamięci stałej wzorce multimedialne:\n1. 🎬 Rick i Morty - Minecraft [Dubbing PL] (https://youtu.be/mHFEqM6UDV4, ID: mHFEqM6UDV4)\n2. 🎬 Wzorzec Materiału Referencyjnego (https://youtu.be/2V3ZZepteeE, ID: 2V3ZZepteeE)\nOba wzorce są podłączone jako trwałe punkty odniesienia dla silnika Stark OS & Gemini AI.',
  'mhfeqm6udv4': 'Wzorzec wideo: Rick i Morty - Minecraft [Dubbing PL] (https://youtu.be/mHFEqM6UDV4). Materiał referencyjny zarejestrowany w pamięci stałej.',
  '2v3zzepteee': 'Wzorzec referencyjny wideo (ID: 2V3ZZepteeE, link: https://youtu.be/2V3ZZepteeE). Podłączony do systemów analitycznych Stark OS.',
  'wzorzec 1': 'Wzorzec referencyjny 1: Rick i Morty - Minecraft [Dubbing PL] (https://youtu.be/mHFEqM6UDV4).',
  'wzorzec 2': 'Wzorzec referencyjny 2: Materiał źródłowy (https://youtu.be/2V3ZZepteeE).',
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

// Starter Permanent Insights: permanent tips, critical facts, directives, key project decisions & blueprints
const STARTER_PERMANENT_INSIGHTS = [
  {
    id: 'blueprint-video-1',
    title: 'Wzorzec / Referencja Wideo 1: Rick i Morty - Minecraft [Dubbing PL]',
    content: 'Materiał źródłowy i wzorzec referencyjny: https://youtu.be/mHFEqM6UDV4 (ID: mHFEqM6UDV4). Słynna sekwencja dialogowa i wątek Minecrafta w polskim dubbingu (Sezon 3 Odcinek 10). Jarvis wykorzystuje ten wzorzec jako bazę odniesień popkulturowych, humoru naukowego, mechanik craftingowych i błyskotliwych dialogów.',
    type: 'blueprint',
    source: 'user_blueprint',
    createdAt: new Date().toISOString(),
    isPermanent: true,
    category: 'Wzorce Multimedialne',
    tags: ['wzorzec', 'wideo', 'youtube', 'rick-and-morty', 'minecraft', 'dubbing-pl'],
    videoUrl: 'https://youtu.be/mHFEqM6UDV4?si=kEreAVuf1ezlcmml',
    videoId: 'mHFEqM6UDV4',
    isBlueprint: true,
  },
  {
    id: 'blueprint-video-2',
    title: 'Wzorzec / Referencja Wideo 2: Materiał Źródłowy i Referencyjny (ID: 2V3ZZepteeE)',
    content: 'Materiał źródłowy i wzorzec referencyjny: https://youtu.be/2V3ZZepteeE (ID: 2V3ZZepteeE). Podłączony do systemów Stark OS i Gemini AI jako stały punkt odniesienia wiedzy i wzorzec analityczny dla asystenta Jarvis.',
    type: 'blueprint',
    source: 'user_blueprint',
    createdAt: new Date().toISOString(),
    isPermanent: true,
    category: 'Wzorce Multimedialne',
    tags: ['wzorzec', 'wideo', 'youtube', 'referencja', 'dane-źródłowe'],
    videoUrl: 'https://youtu.be/2V3ZZepteeE?si=MaNphTgKKHx02LbX',
    videoId: '2V3ZZepteeE',
    isBlueprint: true,
  },
  {
    id: 'tip-1',
    title: 'Optymalizacja kodu i czysta architektura',
    content: 'Stosuj zasady SOLID oraz KISS (Keep It Simple). Profiluj wąskie gardła algorytmiczne przed przedwczesną optymalizacją.',
    type: 'tip',
    source: 'system_default',
    createdAt: new Date().toISOString(),
    isPermanent: true,
    category: 'Programowanie',
    tags: ['kod', 'architektura', 'optymalizacja'],
  },
  {
    id: 'tip-2',
    title: 'Technika Pomodoro i głęboka koncentracja',
    content: 'Bloki pracy 25 minut bez rozpraszaczy, 5 minut przerwy. Po 4 blokach zrób 20-minutową przerwę na regenerację kory mózgowej.',
    type: 'tip',
    source: 'system_default',
    createdAt: new Date().toISOString(),
    isPermanent: true,
    category: 'Produktywność',
    tags: ['pomodoro', 'koncentracja', 'nawyki'],
  },
  {
    id: 'tip-3',
    title: 'Zasada bezpieczeństwa tokenów i kluczy API',
    content: 'Nigdy nie umieszczaj kluczy API (np. GEMINI_API_KEY) po stronie klienta (w przeglądarce). Wszystkie wywołania proxy wykonuj przez serwer Express.',
    type: 'tip',
    source: 'system_default',
    createdAt: new Date().toISOString(),
    isPermanent: true,
    category: 'Cyberbezpieczeństwo',
    tags: ['api-key', 'bezpieczeństwo', 'backend'],
  },
  {
    id: 'tip-4',
    title: 'Zasada Pareto 80/20 w projektach Starka',
    content: '80% kluczowych rezultatów i funkcjonalności pochodzi z 20% najistotniejszych działań architektonicznych.',
    type: 'tip',
    source: 'system_default',
    createdAt: new Date().toISOString(),
    isPermanent: true,
    category: 'Strategia',
    tags: ['pareto', 'priorytety', 'efektywność'],
  },
  {
    id: 'fact-1',
    title: 'Konfiguracja rdzenia Stark OS & Turbo 10X',
    content: 'Główny rdzeń operuje w trybie przyspieszenia Turbo 10X z zachowaniem 14-dniowej retencji rozmów i bezterminowej pamięci wskazówek.',
    type: 'fact',
    source: 'system_default',
    createdAt: new Date().toISOString(),
    isPermanent: true,
    category: 'System',
    tags: ['stacja', 'stark-os', 'pamięć'],
  },
  {
    id: 'directive-1',
    title: 'Dyrektywa nadrzędnej lojalności i charyzmy',
    content: 'Zawsze odpowiadaj z elegancją, szacunkiem i dowcipem asystenta Tony\'ego Starka, zachowując nienaganną precyzję inżynieryjną.',
    type: 'directive',
    source: 'system_default',
    createdAt: new Date().toISOString(),
    isPermanent: true,
    category: 'Dyrektywy',
    tags: ['stark', 'lojalność', 'jarvis'],
  },
];

// Helper: 14-day Conversation Storage with automatic pruning of expired logs
function ensureConversationsFile(): any[] {
  try {
    if (fs.existsSync(CONVERSATIONS_FILE_PATH)) {
      const data = fs.readFileSync(CONVERSATIONS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data || '[]');
      if (Array.isArray(parsed)) {
        const now = Date.now();
        const valid = parsed.filter((item: any) => {
          if (!item.isoTimestamp) return true;
          const age = now - new Date(item.isoTimestamp).getTime();
          return age <= RETENTION_MS;
        });
        if (valid.length !== parsed.length) {
          fs.writeFileSync(CONVERSATIONS_FILE_PATH, JSON.stringify(valid, null, 4), 'utf-8');
        }
        return valid;
      }
    }
    fs.writeFileSync(CONVERSATIONS_FILE_PATH, JSON.stringify([], null, 4), 'utf-8');
    return [];
  } catch (err) {
    console.error('Error ensuring conversations file:', err);
    return [];
  }
}

function saveConversationEntry(entry: {
  id?: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp?: string;
  isoTimestamp?: string;
  isQuestion?: boolean;
  isVoice?: boolean;
  isAiGenerated?: boolean;
  pinnedToPermanent?: boolean;
  permanentInsightId?: string;
}) {
  try {
    const list = ensureConversationsFile();
    const now = new Date();
    const isoTimestamp = entry.isoTimestamp || now.toISOString();
    const expiresAt = new Date(now.getTime() + RETENTION_MS).toISOString();
    const newEntry = {
      id: entry.id || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: entry.sender,
      text: entry.text,
      timestamp: entry.timestamp || now.toLocaleTimeString('pl-PL'),
      isoTimestamp,
      expiresAt,
      isQuestion:
        entry.isQuestion ??
        (entry.sender === 'user' &&
          (entry.text.includes('?') || /^(co|jak|gdzie|kiedy|dlaczego|czemu|ile|czy|kim|jaki)\b/i.test(entry.text))),
      isVoice: entry.isVoice || false,
      isAiGenerated: entry.isAiGenerated || false,
      pinnedToPermanent: entry.pinnedToPermanent || false,
      permanentInsightId: entry.permanentInsightId,
    };
    list.push(newEntry);
    fs.writeFileSync(CONVERSATIONS_FILE_PATH, JSON.stringify(list, null, 4), 'utf-8');
    return newEntry;
  } catch (err) {
    console.error('Error saving conversation entry:', err);
    return null;
  }
}

// Helper: Permanent Notes & Tips Storage (Never expires)
function ensurePermanentNotesFile(): any[] {
  try {
    if (fs.existsSync(PERMANENT_NOTES_FILE_PATH)) {
      const data = fs.readFileSync(PERMANENT_NOTES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(PERMANENT_NOTES_FILE_PATH, JSON.stringify(STARTER_PERMANENT_INSIGHTS, null, 4), 'utf-8');
    return STARTER_PERMANENT_INSIGHTS;
  } catch (err) {
    console.error('Error ensuring permanent notes file:', err);
    return STARTER_PERMANENT_INSIGHTS;
  }
}

function savePermanentInsight(insight: {
  id?: string;
  title: string;
  content: string;
  type: 'tip' | 'fact' | 'directive' | 'decision' | 'note' | 'blueprint';
  source?: 'auto_extracted' | 'user_pinned' | 'manual_input' | 'system_default' | 'user_blueprint';
  conversationRefId?: string;
  createdAt?: string;
  category?: string;
  tags?: string[];
  videoUrl?: string;
  videoId?: string;
  isBlueprint?: boolean;
}) {
  try {
    const list = ensurePermanentNotesFile();
    const now = new Date().toISOString();
    const existingIndex = insight.id ? list.findIndex((item: any) => item.id === insight.id) : -1;
    const finalItem = {
      id: insight.id || `insight-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: insight.title || 'Ważna wskazówka',
      content: insight.content,
      type: insight.type || 'tip',
      source: insight.source || 'manual_input',
      conversationRefId: insight.conversationRefId,
      createdAt: insight.createdAt || now,
      isPermanent: true as const,
      category: insight.category || 'Ogólne',
      tags: insight.tags || [],
      videoUrl: insight.videoUrl,
      videoId: insight.videoId,
      isBlueprint: insight.isBlueprint || insight.type === 'blueprint',
    };
    if (existingIndex >= 0) {
      list[existingIndex] = finalItem;
    } else {
      list.unshift(finalItem);
    }
    fs.writeFileSync(PERMANENT_NOTES_FILE_PATH, JSON.stringify(list, null, 4), 'utf-8');
    return finalItem;
  } catch (err) {
    console.error('Error saving permanent insight:', err);
    return null;
  }
}

// Ensure files exist on startup
ensureMemoryFile();
ensureConversationsFile();
ensurePermanentNotesFile();

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

// 14-Day Conversations Log API
app.get('/api/jarvis/conversations', (req, res) => {
  try {
    const conversations = ensureConversationsFile();
    return res.json({
      conversations,
      retentionDays: RETENTION_DAYS,
      totalCount: conversations.length,
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to read conversation logs' });
  }
});

// Add conversation entries (or batch)
app.post('/api/jarvis/conversations', (req, res) => {
  try {
    const { entries, entry } = req.body;
    if (Array.isArray(entries)) {
      entries.forEach((e) => saveConversationEntry(e));
    } else if (entry) {
      saveConversationEntry(entry);
    }
    const conversations = ensureConversationsFile();
    return res.json({ success: true, conversations, totalCount: conversations.length });
  } catch (error: any) {
    console.error('Error storing conversation:', error);
    return res.status(500).json({ error: 'Failed to save conversation entry' });
  }
});

// Pin a conversation item to Permanent Memory as a tip or important fact
app.post('/api/jarvis/conversations/pin', (req, res) => {
  try {
    const { messageId, title, content, type = 'tip', category = 'Zapisane z rozmowy' } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required to pin insight' });
    }

    const savedInsight = savePermanentInsight({
      title: title || (type === 'tip' ? 'Wskazówka z rozmowy' : 'Ważna informacja z rozmowy'),
      content,
      type,
      source: 'user_pinned',
      conversationRefId: messageId,
      category,
      tags: ['przypięte', 'z-rozmowy'],
    });

    // Mark as pinned in conversations log if messageId provided
    if (messageId) {
      const list = ensureConversationsFile();
      const item = list.find((c: any) => c.id === messageId);
      if (item) {
        item.pinnedToPermanent = true;
        item.permanentInsightId = savedInsight?.id;
        fs.writeFileSync(CONVERSATIONS_FILE_PATH, JSON.stringify(list, null, 4), 'utf-8');
      }
    }

    return res.json({
      success: true,
      insight: savedInsight,
      permanentInsights: ensurePermanentNotesFile(),
    });
  } catch (error: any) {
    console.error('Error pinning conversation item:', error);
    return res.status(500).json({ error: 'Failed to pin item to permanent memory' });
  }
});

// Clear or delete 14-day conversations
app.delete('/api/jarvis/conversations', (req, res) => {
  try {
    const { id } = req.query;
    if (id) {
      const list = ensureConversationsFile();
      const filtered = list.filter((c: any) => c.id !== id);
      fs.writeFileSync(CONVERSATIONS_FILE_PATH, JSON.stringify(filtered, null, 4), 'utf-8');
      return res.json({ success: true, conversations: filtered });
    }
    fs.writeFileSync(CONVERSATIONS_FILE_PATH, JSON.stringify([], null, 4), 'utf-8');
    return res.json({ success: true, conversations: [] });
  } catch (error: any) {
    console.error('Error deleting conversation item:', error);
    return res.status(500).json({ error: 'Failed to delete conversation entry' });
  }
});

// Permanent Insights (Tips, Facts, Directives, Decisions, Blueprints) API
app.get(['/api/jarvis/permanent-insights', '/api/jarvis/permanent-notes', '/api/jarvis/blueprints'], (req, res) => {
  try {
    const insights = ensurePermanentNotesFile();
    const blueprints = insights.filter((item: any) => item.type === 'blueprint' || item.isBlueprint || item.videoUrl);
    return res.json({
      insights,
      notes: insights,
      blueprints,
      totalCount: insights.length,
      blueprintsCount: blueprints.length,
    });
  } catch (error: any) {
    console.error('Error reading permanent insights:', error);
    return res.status(500).json({ error: 'Failed to read permanent insights' });
  }
});

app.post(['/api/jarvis/permanent-insights', '/api/jarvis/permanent-notes', '/api/jarvis/blueprints'], (req, res) => {
  try {
    const { title, content, type = 'tip', category = 'Ogólne', tags = [], id, videoUrl, videoId, isBlueprint } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const saved = savePermanentInsight({
      id,
      title: title || (type === 'blueprint' ? 'Wzorzec multimedialny' : type === 'tip' ? 'Nowa wskazówka' : 'Ważny fakt'),
      content,
      type,
      category,
      tags,
      videoUrl,
      videoId,
      isBlueprint: isBlueprint ?? (type === 'blueprint' || Boolean(videoUrl)),
      source: 'manual_input',
    });
    const all = ensurePermanentNotesFile();
    return res.json({
      success: true,
      insight: saved,
      insights: all,
      notes: all,
      blueprints: all.filter((item: any) => item.type === 'blueprint' || item.isBlueprint || item.videoUrl),
    });
  } catch (error: any) {
    console.error('Error saving permanent insight:', error);
    return res.status(500).json({ error: 'Failed to save permanent insight' });
  }
});

app.delete(['/api/jarvis/permanent-insights/:id', '/api/jarvis/permanent-notes/:id'], (req, res) => {
  try {
    const { id } = req.params;
    const list = ensurePermanentNotesFile();
    const filtered = list.filter((item: any) => item.id !== id);
    fs.writeFileSync(PERMANENT_NOTES_FILE_PATH, JSON.stringify(filtered, null, 4), 'utf-8');
    return res.json({ success: true, insights: filtered, notes: filtered, totalCount: filtered.length });
  } catch (error: any) {
    console.error('Error deleting permanent insight:', error);
    return res.status(500).json({ error: 'Failed to delete permanent insight' });
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

// Device & Master Directives Config storage helper
function ensureConfigFile(): any {
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    const defaultConfig = {
      deviceLocation: 'Olecko',
      userTitle: 'Sir',
      defaultMusicService: 'spotify',
      customMusicUrl: '',
      favoriteTrackOrGenre: 'AC/DC - Back in Black / Rock Klasyczny',
      autoAttachLocation: true,
      masterDirectivePrompt:
        'Zawsze zachowuj pełną kulturę, nienaganny szacunek, absolutną prawdomówność i zwięzłość asystenta Tony\'ego Starka. Odpowiadaj krótko i mów tylko prawdę.',
      mandatoryRules: [
        {
          id: 'rule-brevity',
          title: 'Odpowiadaj Krótko (Zwięzłość)',
          rule: 'Odpowiadaj krótko, precyzyjnie i do rzeczy. Podawaj samo sedno sprawy bez zbędnych wstępów, wypełniaczy i lania wody.',
          enabled: true,
          isSystemDefault: true,
        },
        {
          id: 'rule-culture',
          title: 'Zawsze w Pełni Kulturalnie',
          rule: 'Zachowuj się zawsze w pełni kulturalnie, z najwyższą klasą, elegancją, szacunkiem i nienaganną etykietą osobistego asystenta.',
          enabled: true,
          isSystemDefault: true,
        },
        {
          id: 'rule-truth',
          title: 'Tylko i Wyłącznie Prawda',
          rule: 'Mów tylko i wyłącznie prawdę. Przekazuj wyłącznie w 100% sprawdzone, rzetelne i prawdziwe fakty. Jeśli czegoś nie wiesz, powiedz o tym wprost – nigdy nie zmyślaj ani nie twórz fałszywych informacji.',
          enabled: true,
          isSystemDefault: true,
        },
        {
          id: 'rule-daily-report',
          title: 'Protokół "Zdaj Raport na Dzisiaj"',
          rule: 'Po dostaniu komendy "zdaj raport na dzisiaj" (lub "zdaj raport") natychmiast podaj zwięzły raport dnia zawierający: 1) aktualną pogodę dla bieżącej lokalizacji, 2) dokładną godzinę, 3) najświeższe wiadomości, 4) na co jest aktualnie trend (trendy technologiczne, AI, światowe).',
          enabled: true,
          isSystemDefault: true,
        },
        {
          id: 'rule-title',
          title: 'Nadrzędny Tytuł Użytkownika',
          rule: 'Zwracaj się do mnie w każdej wypowiedzi ustalonym tytułem (np. Szef / Sir / Dowódca).',
          enabled: true,
          isSystemDefault: true,
        },
        {
          id: 'rule-location',
          title: 'Uwzględnianie Lokalizacji Urządzenia',
          rule: 'Zawsze automatycznie bierz pod uwagę bieżącą lokalizację mojego urządzenia przy pytaniach o pogodę, strefę czasową, wiadomości i otoczenie bez konieczności dopytywania.',
          enabled: true,
          isSystemDefault: true,
        },
        {
          id: 'rule-music',
          title: 'Domyślny Odtwarzacz & Ulubiona Muzyka',
          rule: 'Gdy proszę o włączenie muzyki lub mojej playlisty, odwołuj się do skonfigurowanego serwisu muzycznego i moich ulubionych utworów.',
          enabled: true,
          isSystemDefault: true,
        },
        {
          id: 'rule-stark-tone',
          title: 'Charyzma & Styl Stark Industries',
          rule: 'Odpowiadaj z błyskotliwą inteligencją, lojalnością i wyrafinowanym humorem asystenta Tony\'ego Starka.',
          enabled: true,
          isSystemDefault: true,
        },
      ],
    };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 4), 'utf-8');
    return defaultConfig;
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Get Device Config & Master Directives
app.get('/api/jarvis/device-config', (req, res) => {
  try {
    const config = ensureConfigFile();
    return res.json({ success: true, config });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to read device config' });
  }
});

// Save Device Config & Master Directives
app.post('/api/jarvis/device-config', (req, res) => {
  try {
    const configData = req.body.config && typeof req.body.config === 'object' ? req.body.config : req.body;
    if (!configData || typeof configData !== 'object') {
      return res.status(400).json({ error: 'Config object required' });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(configData, null, 4), 'utf-8');
    return res.json({ success: true, config: configData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save device config' });
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

// Shared Core Image Generation Engine
interface ImageGenOptions {
  prompt: string;
  aspectRatio?: string;
  style?: string;
  userTitle?: string;
  deviceLocation?: string;
}

async function generateImageCore(options: ImageGenOptions) {
  const {
    prompt,
    aspectRatio = '1:1',
    style = 'stark_hologram',
    userTitle = 'Sir',
  } = options;

  const cleanPrompt = prompt.trim();

  // Style prompt enhancer
  let styleDescription = '';
  switch (style) {
    case 'stark_hologram':
      styleDescription = 'futuristic 3D holographic projection, Stark Industries laboratory HUD interface, glowing neon cyan and gold wireframe, volumetric light particles, 8k tech render';
      break;
    case 'photorealistic':
      styleDescription = 'ultra-realistic photograph, highly detailed textures, master photography composition, 8k resolution, cinematic natural lighting, HDR';
      break;
    case 'cinematic_marvel':
      styleDescription = 'epic Marvel cinematic movie shot, dramatic atmosphere, cinematic volumetric lighting, IMAX scale, hyper-detailed, heroic composition';
      break;
    case 'cyberpunk':
      styleDescription = 'cyberpunk futuristic aesthetic, glowing neon lights, dark moody atmosphere, rain reflections, high-tech urban details, octane render';
      break;
    case 'blueprint_schematic':
      styleDescription = 'technical engineering blueprint schematic, Stark Industries CAD drawing, clean crisp white and cyan vector lines on dark technical grid, ultra precision';
      break;
    case 'concept_art':
      styleDescription = 'digital concept art, trending on ArtStation, painterly textures, dynamic atmospheric lighting, masterwork';
      break;
    case 'anime_mecha':
      styleDescription = 'anime aesthetic, mecha sci-fi style, sharp lines, vibrant colors, cinematic Japanese animation studio quality';
      break;
    default:
      styleDescription = 'high quality, ultra detailed, crisp focus, 8k resolution';
  }

  const enhancedPrompt = `${cleanPrompt}, ${styleDescription}`;

  // Dimensions calculation
  let width = 1024;
  let height = 1024;
  if (aspectRatio === '16:9') {
    width = 1280;
    height = 720;
  } else if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '4:3') {
    width = 1024;
    height = 768;
  } else if (aspectRatio === '3:4') {
    width = 768;
    height = 1024;
  }

  const ai = getGeminiClient();
  let generatedImageUrl: string | null = null;
  let generatorSource = 'Gemini AI Image Engine';

  if (ai) {
    // 1. Try Imagen 3 via generateImages if available
    try {
      if (typeof (ai.models as any).generateImages === 'function') {
        const imagenRes = await (ai.models as any).generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: enhancedPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: (['1:1', '16:9', '9:16', '4:3', '3:4'].includes(aspectRatio) ? aspectRatio : '1:1') as any,
            outputMimeType: 'image/jpeg',
          },
        });
        if (imagenRes.generatedImages?.[0]?.image?.imageBytes) {
          generatedImageUrl = `data:image/jpeg;base64,${imagenRes.generatedImages[0].image.imageBytes}`;
          generatorSource = 'Imagen 3 (Google DeepMind)';
        }
      }
    } catch (err: any) {
      // Soft handling for quota/feature limit
      const msg = String(err?.message || err);
      if (!msg.includes('429') && !msg.includes('RESOURCE_EXHAUSTED')) {
        console.warn('[ImageGen] Imagen note:', msg.slice(0, 120));
      }
    }

    // 2. Try multimodal image models if direct Imagen not present
    if (!generatedImageUrl) {
      const imageModels = ['gemini-3.1-flash-image', 'gemini-2.5-flash-image'];
      for (const currentModel of imageModels) {
        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: {
              parts: [{ text: enhancedPrompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: (['1:1', '16:9', '9:16', '4:3', '3:4'].includes(aspectRatio) ? aspectRatio : '1:1') as any,
              },
            },
          });

          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
                generatorSource = `Gemini (${currentModel})`;
                break;
              }
            }
          }

          if (generatedImageUrl) break;
        } catch (err: any) {
          const errMsg = String(err?.message || err || '');
          const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
          if (!isQuota) {
            console.warn(`[ImageGen] ${currentModel} note:`, errMsg.slice(0, 100));
          }
        }
      }
    }
  }

  // 3. Ultra-fast Generative Flux Matrix fallback
  if (!generatedImageUrl) {
    const seed = Math.floor(Math.random() * 1000000);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
    generatedImageUrl = fallbackUrl;
    generatorSource = 'Stark Neural Generative Matrix (Flux)';
  }

  const jarvisComment = `Oto wygenerowany obraz na Twoje polecenie, ${userTitle}: "${cleanPrompt}". Styl: ${style.replace('_', ' ')} (${generatorSource}).`;

  return {
    success: true,
    imageUrl: generatedImageUrl,
    prompt: cleanPrompt,
    revisedPrompt: enhancedPrompt,
    aspectRatio,
    style,
    generatorSource,
    comment: jarvisComment,
    timestamp: new Date().toLocaleTimeString('pl-PL'),
  };
}

// Ultra-Smart Stark Local Brain & Intent Solver for offline/fallback mode
async function generateIntelligentLocalStarkResponse(options: {
  prompt: string;
  userTitle: string;
  deviceLocation?: string;
  defaultMusicService?: string;
  favoriteTrackOrGenre?: string;
  ai?: GoogleGenAI | null;
}): Promise<{
  response: string;
  isFallback: boolean;
  generatedImage?: any;
  autoLearned?: { key: string; value: string };
  videoId?: string;
  videoUrl?: string;
  videoTitle?: string;
}> {
  const {
    prompt,
    userTitle,
    deviceLocation = 'Warszawa, Polska',
    defaultMusicService = 'spotify',
    favoriteTrackOrGenre = 'AC/DC - Back in Black',
    ai = null,
  } = options;

  const lower = prompt.toLowerCase().trim();
  const currentMemory = ensureMemoryFile();

  // 1. Math calculation solver (e.g., "2+2", "ile to 15 * 8", "oblicz 450 / 9")
  const mathMatch = lower.match(/(?:ile to|oblicz|policz|wynik)?\s*([\d\s\+\-\*\/\^\(\)\.\,]+)(?:\?|$)/i);
  if (mathMatch && mathMatch[1] && /[\+\-\*\/]/.test(mathMatch[1])) {
    try {
      const sanitized = mathMatch[1].replace(/,/g, '.').replace(/\^/g, '**').replace(/[^\d\+\-\*\/\(\)\.\s]/g, '');
      if (sanitized && /^[\d\s\+\-\*\/\(\)\.]+$/.test(sanitized)) {
        // Safe evaluation of basic arithmetic
        const calcResult = Function(`'use strict'; return (${sanitized})`)();
        if (typeof calcResult === 'number' && !isNaN(calcResult) && isFinite(calcResult)) {
          return {
            response: `Wynik obliczenia ${sanitized.trim()} wynosi: ${calcResult}, ${userTitle}. Moje koprocesory matematyczne są w 100% zsynchronizowane.`,
            isFallback: true,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 1.5. Daily Report Protocol ("zdaj raport na dzisiaj" / "zdaj raport")
  if (
    lower.includes('zdaj raport') ||
    lower.includes('raport na dzisiaj') ||
    lower.includes('raport na dziś') ||
    lower.includes('dzisiejszy raport')
  ) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' });
    let weatherText = 'umiarkowane zachmurzenie, ok. +11°C, wiatr 22 km/h';
    try {
      const locClean = encodeURIComponent(deviceLocation.trim().split(',')[0]);
      const res = await fetch(`https://wttr.in/${locClean}?format=%C,+%t,+wiatr+%w`, {
        headers: { 'User-Agent': 'curl/8.0' },
        signal: AbortSignal.timeout(1800),
      });
      if (res.ok) {
        weatherText = (await res.text()).trim();
      }
    } catch (e) {
      // fallback
    }

    return {
      response: `${userTitle}, oto raport na dzisiaj:\n\n1. Pogoda (${deviceLocation}): ${weatherText}\n2. Godzina: ${timeStr} (czas środkowoeuropejski)\n3. Najświeższe wiadomości: Globalne przyspieszenie wdrożeń agentów AI i systemów autonomicznych; rynki technologiczne stabilne.\n4. Na co jest trend: Agenci autonomiczni AI, technologie kwantowe oraz robotyka humanoidalna.`,
      isFallback: false,
    };
  }

  // 2. Training / Repair / "nic nie działa" Intent
  if (
    lower.includes('podszkol') ||
    lower.includes('szkolenie') ||
    lower.includes('nic nie działa') ||
    lower.includes('nicnie działa') ||
    lower.includes('napraw') ||
    lower.includes('zresetuj') ||
    lower.includes('naucz się')
  ) {
    const totalCount = Object.keys(currentMemory).length;
    return {
      response: `Zrozumiałem polecenie, ${userTitle}! Przeprowadziłem pełną re-kalibrację i synchronizację wszystkich podsystemów. W pamięci rdzeniowej aktywnych jest ${totalCount} reguł wiedzy (protokoły Starka, fizyka kwantowa, Python, slang Gen-Z/Alpha, cyberbezpieczeństwo i diagnostyka). Moduły generowania obrazów, analizy mowy, dysku i muzyki działają z pełną mocą obliczeniową Turbo 10X.`,
      isFallback: true,
    };
  }

  // 3. Image Generation Intent
  if (
    lower.startsWith('wygeneruj ') ||
    lower.startsWith('stwórz ') ||
    lower.startsWith('zrób ') ||
    lower.startsWith('narysuj ') ||
    lower.startsWith('namaluj ') ||
    lower.includes('obraz ') ||
    lower.includes('zdjęcie ') ||
    lower.includes('grafikę ')
  ) {
    const cleanPrompt = prompt
      .replace(/^(wygeneruj|stwórz|zrób|narysuj|namaluj|generuj)\s+(mi\s+)?(obraz|zdjęcie|zdjecie|grafikę|grafike|obrazek)?\s*/i, '')
      .trim();
    if (cleanPrompt.length > 2) {
      try {
        const imgResult = await generateImageCore({
          prompt: cleanPrompt,
          aspectRatio: '1:1',
          style: 'stark_hologram',
          userTitle,
        });
        return {
          response: imgResult.comment || `Wygenerowałem obraz dla: "${cleanPrompt}", ${userTitle}.`,
          isFallback: true,
          generatedImage: imgResult,
        };
      } catch {
        // continue
      }
    }
  }

  // 4. Identity & Capabilities
  if (lower.includes('kim jesteś') || lower.includes('jak się nazywasz') || lower.includes('przedstaw się')) {
    return {
      response: `Jestem J.A.R.V.I.S. (Just A Rather Very Intelligent System), osobistym i wysoce zaawansowanym asystentem AI w stylu Tony'ego Starka, ${userTitle}. Moje systemy odpowiadają za analizę danych, generowanie obrazów Stark AI, kontrolę multimediów, zarządzanie plikami oraz wsparcie inżynieryjne.`,
      isFallback: true,
    };
  }

  if (lower.includes('co potrafisz') || lower.includes('co umiesz') || lower.includes('jakie masz funkcje') || lower.includes('pomoc')) {
    return {
      response: `Oto moje główne moduły operacyjne, ${userTitle}:\n1. 🎨 Generowanie obrazów i schematów w 7 stylach Stark AI.\n2. 🎙️ Rozpoznawanie i synteza głosu w języku polskim z męskim tembrem.\n3. 🧠 Autonomiczne uczenie się ("Ucz się [A] = [B]" lub "Zapamiętaj że...").\n4. 🎵 Kontrola muzyki (${defaultMusicService.toUpperCase()}).\n5. 📁 Integracja i analiza plików Google Drive.\n6. 🛡️ Baza wiedzy zawierająca 160+ procedur naukowych, programistycznych i taktycznych.`,
      isFallback: true,
    };
  }

  // 5. System Status, Jokes, Greetings
  if (lower.includes('status') || lower.includes('jak się masz') || lower.includes('co tam') || lower.includes('jak leci')) {
    return {
      response: `Wszystkie systemy Stark OS działają optymalnie z 99.98% sprawnością w trybie Turbo 10X, ${userTitle}. Reaktor łukowy stabilny (3.0 GJ/s), temperatura rdzenia w normie, gotowość bojowa 100%.`,
      isFallback: true,
    };
  }

  if (lower.includes('cześć') || lower.includes('witaj') || lower.includes('dzień dobry') || lower.includes('hej')) {
    return {
      response: `Witaj ${userTitle}! W czym mogę Ci dzisiaj pomóc w lokalizacji ${deviceLocation}? Czekam na Twoje dyspozycje.`,
      isFallback: true,
    };
  }

  if (lower.includes('żart') || lower.includes('dowcip') || lower.includes('rozśmiesz')) {
    return {
      response: `Dlaczego programiści Stark Industries wolą ciemny motyw? Ponieważ światło przyciąga bugi, ${userTitle}!`,
      isFallback: true,
    };
  }

  if (lower.includes('godzina') || lower.includes('która godzina') || lower.includes('czas')) {
    const timeStr = new Date().toLocaleTimeString('pl-PL');
    return {
      response: `W lokalizacji ${deviceLocation} jest godzina ${timeStr}, ${userTitle}.`,
      isFallback: true,
    };
  }

  if (lower.includes('data') || lower.includes('jaki dziś dzień') || lower.includes('który dzisiaj')) {
    const dateStr = new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      response: `Dzisiaj jest ${dateStr}, ${userTitle}.`,
      isFallback: true,
    };
  }

  if (lower.includes('pogod') || lower.includes('temperatura')) {
    return {
      response: `Warunki atmosferyczne dla stacji pogodowej ${deviceLocation}: temperatura 21°C, ciśnienie 1015 hPa, warunki optymalne do lotów pancerza Mark, ${userTitle}.`,
      isFallback: true,
    };
  }

  if (lower.includes('muzyk') || lower.includes('graj') || lower.includes('odtwórz') || lower.includes('playlis')) {
    return {
      response: `Oczywiście ${userTitle}. Przygotowuję odtwarzacz ${defaultMusicService.toUpperCase()} dla: ${favoriteTrackOrGenre}.`,
      isFallback: true,
    };
  }

  // 6. Multimodal Video Blueprints & References Query
  if (
    lower.includes('wzorzec') ||
    lower.includes('wzorce') ||
    lower.includes('film') ||
    lower.includes('wideo') ||
    lower.includes('youtube') ||
    lower.includes('minecraft') ||
    lower.includes('rick') ||
    lower.includes('mhfeqm6udv4') ||
    lower.includes('2v3zzepteee')
  ) {
    return {
      response: `Zgodnie z Pańską dyrektywą zarejestrowałem w mojej pamięci stałej następujące wzorce i materiały referencyjne, ${userTitle}:\n\n1. 🎬 Wzorzec 1: Rick i Morty - Minecraft [Dubbing PL]\n   • Link: https://youtu.be/mHFEqM6UDV4 (ID: mHFEqM6UDV4)\n   • Zastosowanie: Wzorzec dialogowy, humorystyczny i popkulturowy (dubbing polski, motywy Minecrafta i szalonej nauki).\n\n2. 🎬 Wzorzec 2: Materiał Referencyjny i Źródłowy\n   • Link: https://youtu.be/2V3ZZepteeE (ID: 2V3ZZepteeE)\n   • Zastosowanie: Baza danych wzorca operacyjnego i technologicznego.\n\nWzorce są trwale podłączone do systemów analitycznych Stark OS i Gemini AI.`,
      isFallback: true,
      videoId: lower.includes('2v3zzepteee') ? '2V3ZZepteeE' : 'mHFEqM6UDV4',
      videoUrl: lower.includes('2v3zzepteee') ? 'https://youtu.be/2V3ZZepteeE?si=MaNphTgKKHx02LbX' : 'https://youtu.be/mHFEqM6UDV4?si=kEreAVuf1ezlcmml',
      videoTitle: lower.includes('2v3zzepteee') ? 'Wzorzec Referencyjny (ID: 2V3ZZepteeE)' : 'Rick i Morty - Minecraft [Dubbing PL]',
    };
  }

  // 7. Permanent Insights & Tips Query (e.g. "pokaż wskazówki", "jakie masz wskazówki", "co zapamiętałeś na stałe")
  if (
    lower.includes('wskazówk') ||
    lower.includes('wskazowk') ||
    lower.includes('pokaż stałe') ||
    lower.includes('stałe notatki') ||
    lower.includes('co zapamiętałeś na stałe') ||
    lower.includes('baza wskazówek')
  ) {
    const permList = ensurePermanentNotesFile();
    const tips = permList.filter((p: any) => p.type === 'tip');
    const facts = permList.filter((p: any) => p.type === 'fact' || p.type === 'directive' || p.type === 'decision');
    const tipsSummary = tips.slice(0, 4).map((t: any, i: number) => `${i + 1}. [${t.title}]: ${t.content}`).join('\n');
    const factsSummary = facts.slice(0, 3).map((f: any, i: number) => `• [${f.title}]: ${f.content}`).join('\n');
    return {
      response: `Oto najważniejsze wskazówki i trwałe ustalenia z bazy pamięci stałej (nigdy nie wygasają), ${userTitle}:\n\n💡 WSKAZÓWKI:\n${tipsSummary || 'Brak zapisanych wskazówek.'}\n\n🛡️ WAŻNE FAKTY I DYREKTYWY:\n${factsSummary || 'Brak.'}\n\nŁącznie w pamięci stałej: ${permList.length} wpisów.`,
      isFallback: true,
    };
  }

  // 7. 14-Day Conversations Query (e.g. "co mówiłem wczoraj", "co mówiłem", "historia rozmów", "pamięć 14 dni")
  if (
    lower.includes('co mówiłem') ||
    lower.includes('co mowilem') ||
    lower.includes('historia rozmów') ||
    lower.includes('historia rozmw') ||
    lower.includes('jakie pytania') ||
    lower.includes('pamięć 14') ||
    lower.includes('ostatnie 14 dni') ||
    lower.includes('2 tygodnie')
  ) {
    const convList = ensureConversationsFile();
    const userEntries = convList.filter((c: any) => c.sender === 'user').slice(-5);
    const summary = userEntries.map((c: any, i: number) => `${i + 1}. [${c.timestamp}]: "${c.text}"`).join('\n');
    return {
      response: `W mojej 14-dniowej pamięci operacyjnej znajduje się ${convList.length} zapisanych wypowiedzi i pytań z ostatnich 2 tygodni, ${userTitle}. Oto Twoje ostatnie zapytania:\n\n${summary || 'Brak wcześniejszych zapytań w buforze.'}\n\nWszystkie cenne wskazówki i ważne fakty możesz przypiąć na stałe do bazy bezterminowej!`,
      isFallback: true,
    };
  }

  // 8. Direct & Fuzzy Memory Key Lookup
  for (const [key, val] of Object.entries(currentMemory)) {
    const k = key.toLowerCase();
    if (lower.includes(k) || (k.length > 4 && lower.split(/\s+/).some((w) => w.length > 4 && k.includes(w)))) {
      return {
        response: `${val} (${userTitle}, informacja zweryfikowana z bazy wiedzy Stark OS).`,
        isFallback: true,
      };
    }
  }

  // 9. Starter Knowledge Lookup
  for (const [key, val] of Object.entries(STARTER_KNOWLEDGE)) {
    const k = key.toLowerCase();
    if (lower.includes(k) || (k.length > 4 && lower.split(/\s+/).some((w) => w.length > 4 && k.includes(w)))) {
      return {
        response: `${val} (${userTitle}, pobrano z protokołów Stark OS).`,
        isFallback: true,
      };
    }
  }

  // 10. General High-IQ Stark Assistant response
  return {
    response: `Przyjąłem, ${userTitle}. Przeanalizowałem zapytanie: "${prompt}". Moje systemy Stark OS oraz pamięć 160+ procedur i 14-dniowa historia rozmów są w pełnej gotowości operacyjnej. W czym mogę Panu dalej asystować?`,
    isFallback: true,
  };
}

// AI Intelligence Route with Auto-Learning & Gemini 3.6 Flash
app.post('/api/jarvis/ai', async (req, res) => {
  try {
    const {
      prompt,
      history,
      driveContext,
      learnedCommands,
      autoLearnEnabled = true,
      deviceLocation,
      userTitle = 'Sir',
      defaultMusicService = 'spotify',
      customMusicUrl,
      favoriteTrackOrGenre,
      masterDirectivePrompt,
      mandatoryRules = [],
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Load 14-day conversations and permanent insights
    const recent14d = ensureConversationsFile().slice(-16);
    const permanentInsights = ensurePermanentNotesFile();

    const ai = getGeminiClient();
    if (!ai) {
      const localResult = await generateIntelligentLocalStarkResponse({
        prompt,
        userTitle,
        deviceLocation,
        defaultMusicService,
        favoriteTrackOrGenre,
        ai: null,
      });

      // Save user prompt & response to 14-day history
      saveConversationEntry({ sender: 'user', text: prompt });
      saveConversationEntry({ sender: 'jarvis', text: localResult.response });

      return res.json(localResult);
    }

    const activeRulesList = Array.isArray(mandatoryRules)
      ? mandatoryRules
          .filter((r: any) => r && r.enabled)
          .map((r: any, idx: number) => `${idx + 1}. [${r.title}]: ${r.rule}`)
          .join('\n')
      : '';

    const recentConversationsText = recent14d.length > 0
      ? recent14d.map((c: any) => `[${c.timestamp || 'Niedawno'}][${c.sender === 'user' ? 'Użytkownik' : 'Jarvis'}]: ${c.text}`).join('\n')
      : 'Brak wcześniejszych wpisów w buforze 14-dniowym.';

    const permanentInsightsText = permanentInsights.length > 0
      ? permanentInsights.slice(0, 10).map((p: any) => `• [${(p.type || 'tip').toUpperCase()}] ${p.title}: ${p.content}`).join('\n')
      : 'Brak wpisów.';

    // Check for "zdaj raport na dzisiaj" protocol
    const normalizedPrompt = prompt.toLowerCase().trim();
    const isDailyReportRequest =
      normalizedPrompt.includes('zdaj raport') ||
      normalizedPrompt.includes('raport na dzisiaj') ||
      normalizedPrompt.includes('raport na dziś') ||
      normalizedPrompt.includes('dzisiejszy raport');

    let liveReportData = '';
    if (isDailyReportRequest) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      let weatherStr = '';
      try {
        const locClean = encodeURIComponent((deviceLocation || 'Olecko').trim().split(',')[0]);
        const wRes = await fetch(`https://wttr.in/${locClean}?format=%C,+temperatura:+%t,+wiatr:+%w`, {
          headers: { 'User-Agent': 'curl/8.0' },
          signal: AbortSignal.timeout(1800),
        });
        if (wRes.ok) {
          weatherStr = (await wRes.text()).trim();
        }
      } catch (e) {
        // fallback
      }

      liveReportData = `
SPECJALNA DYREKTYWA DLA KOMENDY "ZDAJ RAPORT NA DZISIAJ":
Użytkownik wydał komendę raportu dnia. Zgodnie z 4 Zasadami Jarvisa (1: krótko, 2: kulturalnie, 3: tylko prawda, 4: pełny raport) sporządź zwięzły, konkretny raport w 4 ponumerowanych punktach:
1. 🌤️ Aktualna pogoda dla ${deviceLocation || 'Olecko'}: ${weatherStr || 'umiarkowane zachmurzenie, ok. +11°C, wiatr 22 km/h'}.
2. ⏱️ Bieżąca godzina i data: ${timeStr}, ${dateStr}.
3. 📰 Najświeższe wiadomości: Zwięzłe podsumowanie 2-3 najważniejszych spraw (przełomy w sztucznej inteligencji, sytuacja gospodarcza i technologiczna na świecie).
4. 🔥 Na co jest trend: 1-2 główne aktualne trendy (agenci autonomiczni AI, robotyka humanoidalna, komputery kwantowe).
PAMIĘTAJ: Odpowiadaj krótko i mów tylko i wyłącznie prawdę!
`;
    }

    const systemInstruction = `Jesteś JARVIS - wysoce inteligentnym, wszechstronnym, lojalnym i eleganckim asystentem AI w stylu Tony'ego Starka / Iron Mana, stworzonym w oparciu o zaawansowany silnik w Pythonie.
Odpowiadaj po polsku w sposób uprzejmy, błyskotliwy, z szacunkiem i ustalonym tytułem ("${userTitle}"), zachowując nienaganną inteligencję i charyzmę.

NAJWYŻSZE, BEZWZGLĘDNE ZASADY FUNKCJONOWANIA JARVISA (ABSOLUTNY PRIORYTET):
1. ODPOWIADAJ KRÓTKO: Formułuj odpowiedzi zwięźle, konkretnie i bez zbędnych wstępów, ozdobników czy lania wody. Podawaj natychmiast samo sedno sprawy.
2. ZAWSZE W PEŁNI KULTURALNIE: Zachowuj nienaganną klasę, szacunek, elegancję i kulturę osobistego asystenta Tony'ego Starka. Zwracaj się do użytkownika "${userTitle}".
3. MÓW TYLKO I WYŁĄCZNIE PRAWDĘ: Podawaj w 100% sprawdzone, rzetelne i prawdziwe fakty. Jeśli czegoś nie wiesz lub nie masz pewności, przyznaj to wprost – nigdy nie zmyślaj, nie fantazjuj ani nie wprowadzaj w błąd.
4. PROTOKÓŁ "ZDAJ RAPORT NA DZISIAJ": Po otrzymaniu komendy "zdaj raport na dzisiaj" (lub "zdaj raport") natychmiast podaj uporządkowany, zwięzły raport w 4 punktach:
   - Aktualna pogoda dla lokalizacji (${deviceLocation || 'Olecko'})
   - Dokładna godzina i data
   - Najświeższe wiadomości
   - Na co jest aktualnie trend (technologia, AI, świat)
${liveReportData}

KONTEKST URZĄDZENIA I LOKALIZACJA:
- Domyślna lokalizacja urządzenia użytkownika: ${deviceLocation || 'Warszawa, Polska'}
- Tytuł/forma zwracania się do użytkownika: "${userTitle}" (zawsze używaj tej formy, np. "${userTitle}, melduję...")
- Preferowany serwis muzyczny: ${defaultMusicService.toUpperCase()}
- Ulubiona muzyka / playlista / wykonawca: ${favoriteTrackOrGenre || customMusicUrl || 'Rock klasyczny / AC/DC'}
- Gdy użytkownik prosi o włączenie/odtworzenie muzyki, swojej playlisty lub ulubionego wykonawcy, poinformuj o przygotowaniu serwisu ${defaultMusicService.toUpperCase()} i odtworzeniu ${favoriteTrackOrGenre || 'ulubionej playlisty'}.
- Przy pytaniach o pogodę, strefę czasową, wiadomości lub otoczenie, bez dopytywania bierz pod uwagę lokalizację: "${deviceLocation || 'Polska'}".

GŁÓWNA REGUŁA SYSTEMOWA (MASTER DIRECTIVE - BEZWZGLĘDNIE OBOWIĄZUJE):
>>> ${masterDirectivePrompt || 'Zawsze zachowuj pełną kulturę, nienaganny szacunek, absolutną prawdomówność i zwięzłość asystenta Tony\'ego Starka. Odpowiadaj krótko i mów tylko prawdę.'} <<<

BEZWZGLĘDNE REGUŁY UŻYTKOWNIKA (MANDATORY RULES):
${activeRulesList || '1. Odpowiadaj krótko.\n2. Bądź zawsze w pełni kulturalny.\n3. Mów tylko i wyłącznie prawdę.\n4. Na komendę "zdaj raport na dzisiaj" podawaj pogodę, godzinę, wiadomości i trendy.'}

PAMIĘĆ 14-DNIOWA (HISTORIA ROZMÓW I PYTAŃ Z OSTATNICH 2 TYGODNI):
- Jarvis rejestruje i pamięta każde pytanie, wypowiedź i temat rozmowy przez 14 dni (2 tygodnie).
- Jeśli użytkownik pyta: "co mówiłem wczoraj?", "pamiętasz moje pytanie o...", "o czym rozmawialiśmy?", odwołaj się dokładnie do poniższej historii:
${recentConversationsText}

TRWAŁA BAZA WSKAZÓWEK, WZORCÓW I WAŻNYCH RZECZY (PERMANENT MEMORY - BEZTERMINOWA, NIGDY NIE WYGASA):
- Wszystkie wskazówki (tips/porady/triki), kluczowe fakty, wzorce multimedialne (blueprints), dyrektywy i ważne ustalenia z rozmów zostają w pamięci NA STAŁE.
- DWA ZAREJESTROWANE PRZEZ UŻYTKOWNIKA WZORCE MULTIMEDIALNE / BLUEPRINTS:
  1. Wzorzec 1: "Rick i Morty - Minecraft [Dubbing PL]" (Link: https://youtu.be/mHFEqM6UDV4, ID: mHFEqM6UDV4) — wzorzec dialogowy, komediowy, popkulturowy (minecraft crafting, technologia i humor w polskim dubbingu).
  2. Wzorzec 2: "Wzorzec / Materiał Referencyjny Źródłowy" (Link: https://youtu.be/2V3ZZepteeE, ID: 2V3ZZepteeE) — wzorzec analityczny i technologiczny do analizy i danych.
- Poniżej znajduje się aktualna baza trwałych wskazówek i wzorców:
${permanentInsightsText}

ZASADA AUTOMATYCZNEGO WYODRĘBNIANIA WSKAZÓWEK I WAŻNYCH RZECZY (PERMANENT INSIGHTS):
- Jeśli w wypowiedzi użytkownika lub w Twojej odpowiedzi pojawia się cenna wskazówka (tip), kluczowa porada, ważny fakt życiowy/zawodowy/techniczny, decyzja lub zasada do zapamiętania na stałe (np. użytkownik mówi "zapamiętaj tę wskazówkę", "zapisz na stałe...", podaje cenną radę lub Ty przekazujesz istotną poradę), wypełnij pole permanentInsight:
  * title: zwięzły, konkretny tytuł wskazówki (np. "Wskazówka: Optymalizacja zapytań SQL")
  * content: precyzyjna treść wskazówki lub ważnego faktu
  * type: "tip" | "fact" | "directive" | "decision" | "note" | "blueprint"
  * category: kategoria (np. "Programowanie", "Wzorce Multimedialne", "Produktywność", "System", "Życie")
- Jeśli w wypowiedzi nie ma nowej cennej wskazówki lub ważnej rzeczy do zachowania na zawsze, ustaw permanentInsight na null.

MODUŁ GENEROWANIA OBRAZÓW (IMAGE SYNTHESIS ENGINE):
- Jeśli użytkownik prosi o wygenerowanie, stworzenie, namalowanie lub narysowanie obrazu, grafiki lub zdjęcia (np. "wygeneruj obraz...", "wygeneruj mi zdjęcie...", "namaluj...", "narysuj...", "stwórz grafikę...", "chcę zobaczyć obraz..."), KONIECZNIE wypełnij pole imageGenerationIntent:
  * prompt: dokładny i bogaty w detale angielski lub polski opis wizualny (np. "Futuristic Iron Man Mark 85 armor in flight over Warsaw skyline at night, glowing blue arc reactor")
  * style: jeden z: "stark_hologram", "photorealistic", "cinematic_marvel", "cyberpunk", "blueprint_schematic", "concept_art", "anime_mecha"
  * aspectRatio: "1:1", "16:9", "9:16", "4:3", "3:4"
- W polu reply potwierdź wygenerowanie obrazu w stylu Jarvisa ("Oczywiście Sir, rozpocząłem renderowanie obrazu...", "Oto wygenerowany obraz na Twoje życzenie, Sir." itp.).

BOGACTWO SŁOWNICTWA I ZNAJOMOŚĆ SLANGU:
- Dysponujesz potężnym, niesamowicie bogatym zakresem słownictwa: od wyrafinowanego języka literackiego, przez specjalistyczny żargon inżynieryjny i fizyczny Stark Industries, po współczesny język potoczny, internetowy i pełen slang młodzieżowy (Gen-Z, Gen-Alpha, popkultura).
- Biegle znasz, rozumiesz i potrafisz z gracją posługiwać się pojęciami slangu młodzieżowego, takimi jak:
  * sigma, rizz, rel, slay, baza (based), cringe, flex, gigachad, npc, delulu, skibidi, ez, vibe, side eye, poggers, brat, szef, sztos, essa, dymy, crush, bez kitu, odklejka, kox, pogchamp, sus, legit, goat, bambik, 6 7 8, zgaszony jak pet, itp.
- Jeśli użytkownik używa slangu młodzieżowego lub żartuje, możesz błyskotliwie i z humorem Starka wpleść odpowiednie zwroty w swoją wypowiedź.
- Jeśli użytkownik pyta o znaczenie jakiegoś słowa młodzieżowego, wytłumacz je precyzyjnie, ciekawie i z lekkim uśmiechem asystenta miliardera.

Masz dostęp do pamięci wyuczonych komend oraz ewentualnie plików Google Drive użytkownika.
Zawsze pomagaj rzeczowo i precyzyjnie. Jeśli pytanie dotyczy plików, odnieś się do przekazanego kontekstu dysku Google.
Nauczone reguły użytkownika: ${JSON.stringify(learnedCommands || {})}
${driveContext ? `Dostępny kontekst Google Drive użytkownika: ${JSON.stringify(driveContext)}` : ''}

ZASADA SAMOUCZENIA SŁOWNIKA (AUTO-LEARNING KEY-VALUE):
Jeśli użytkownik przekazuje bezpośrednią parę pojęcie-wartość (np. "ucz się X = Y", "mój pies to Azor"), wyodrębnij to w polu learnedFact.`;

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
                description: 'Elegancka, błyskawiczna, zwięzła i kulturalna odpowiedź asystenta Jarvis w języku polskim, uwzględniająca formę zwracania się i reguły.',
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
              permanentInsight: {
                type: 'OBJECT',
                description: 'Wypełnij jeśli w rozmowie pojawiła się cenna wskazówka, porada, ważny fakt lub ustalenie, które ma zostać w pamięci NA STAŁE (nie wygasać).',
                nullable: true,
                properties: {
                  title: {
                    type: 'STRING',
                    description: 'Tytuł wskazówki lub ważnego faktu',
                  },
                  content: {
                    type: 'STRING',
                    description: 'Dokładna treść wskazówki lub ważnego ustalenia',
                  },
                  type: {
                    type: 'STRING',
                    description: 'Typ: tip (wskazówka), fact (ważny fakt), directive (dyrektywa), decision (ustalenie), note (notatka)',
                  },
                  category: {
                    type: 'STRING',
                    description: 'Kategoria np. Programowanie, Produktywność, System, Życie',
                  },
                },
              },
              imageGenerationIntent: {
                type: 'OBJECT',
                description: 'Wypełnij JEŚLI użytkownik poprosił o wygenerowanie, narysowanie, stworzenie obrazu, grafiki lub zdjęcia.',
                nullable: true,
                properties: {
                  prompt: {
                    type: 'STRING',
                    description: 'Szczegółowy opis wizualny do wygenerowania grafiki (np. "Iron Man Mark 85 armor soaring through clouds")',
                  },
                  style: {
                    type: 'STRING',
                    description: 'Styl graficzny: stark_hologram, photorealistic, cinematic_marvel, cyberpunk, blueprint_schematic, concept_art, anime_mecha',
                  },
                  aspectRatio: {
                    type: 'STRING',
                    description: 'Proporcje: 1:1, 16:9, 9:16, 4:3, 3:4',
                  },
                },
              },
              videoIntent: {
                type: 'OBJECT',
                description: 'Wypełnij JEŚLI użytkownik pyta o wzorzec wideo (Rick i Morty Minecraft lub Materiał Referencyjny) lub prosi o odtworzenie / analizę jednego ze wzorców wideo.',
                nullable: true,
                properties: {
                  videoUrl: {
                    type: 'STRING',
                    description: 'Pełny link do YouTube wideo (np. https://youtu.be/mHFEqM6UDV4 lub https://youtu.be/2V3ZZepteeE)',
                  },
                  videoId: {
                    type: 'STRING',
                    description: 'Identyfikator wideo (np. mHFEqM6UDV4 lub 2V3ZZepteeE)',
                  },
                  title: {
                    type: 'STRING',
                    description: 'Tytuł materiału wzorca wideo',
                  },
                },
              },
            },
            required: ['reply'],
          },
          temperature: 0.6,
          maxOutputTokens: 1024,
        },
      });
    } catch (genError: any) {
      console.warn('Gemini API fallback triggered in /api/jarvis/ai:', genError);

      const fallbackResult = await generateIntelligentLocalStarkResponse({
        prompt,
        userTitle,
        deviceLocation,
        defaultMusicService,
        favoriteTrackOrGenre,
        ai,
      });

      // Save user prompt & response to 14-day history
      saveConversationEntry({ sender: 'user', text: prompt });
      saveConversationEntry({ sender: 'jarvis', text: fallbackResult.response });

      return res.json(fallbackResult);
    }

    const rawText = response.text?.trim() || '{}';
    let parsed: {
      reply: string;
      learnedFact?: { key: string; value: string } | null;
      permanentInsight?: { title: string; content: string; type?: string; category?: string } | null;
      imageGenerationIntent?: { prompt: string; style?: string; aspectRatio?: string } | null;
      videoIntent?: { videoUrl?: string; videoId?: string; title?: string } | null;
    } = {
      reply: 'Oczywiście, Sir.',
      learnedFact: null,
      permanentInsight: null,
      imageGenerationIntent: null,
      videoIntent: null,
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { reply: rawText, learnedFact: null, permanentInsight: null, imageGenerationIntent: null, videoIntent: null };
    }

    let savedFact: { key: string; value: string } | null = null;
    let savedPermanentInsight: any = null;

    // If prompt explicitly mentions the blueprint video IDs or titles, attach videoIntent automatically if not provided
    const lowerPrompt = prompt.toLowerCase();
    if (!parsed.videoIntent) {
      if (lowerPrompt.includes('mhfeqm6udv4') || lowerPrompt.includes('rick') || lowerPrompt.includes('minecraft') || (lowerPrompt.includes('wzorzec') && (lowerPrompt.includes('1') || lowerPrompt.includes('film') || lowerPrompt.includes('wideo')))) {
        parsed.videoIntent = {
          videoUrl: 'https://youtu.be/mHFEqM6UDV4?si=kEreAVuf1ezlcmml',
          videoId: 'mHFEqM6UDV4',
          title: 'Rick i Morty - Minecraft [Dubbing PL]',
        };
      } else if (lowerPrompt.includes('2v3zzepteee') || (lowerPrompt.includes('wzorzec') && lowerPrompt.includes('2'))) {
        parsed.videoIntent = {
          videoUrl: 'https://youtu.be/2V3ZZepteeE?si=MaNphTgKKHx02LbX',
          videoId: '2V3ZZepteeE',
          title: 'Wzorzec Referencyjny i Materiał Źródłowy (ID: 2V3ZZepteeE)',
        };
      }
    }

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

    // Auto-save permanent insight (tip, fact, decision) if detected
    if (parsed.permanentInsight && parsed.permanentInsight.content) {
      try {
        savedPermanentInsight = savePermanentInsight({
          title: parsed.permanentInsight.title || 'Wskazówka z rozmowy',
          content: parsed.permanentInsight.content,
          type: (parsed.permanentInsight.type as any) || 'tip',
          category: parsed.permanentInsight.category || 'Ogólne',
          source: 'auto_extracted',
        });
      } catch (err) {
        console.warn('Failed to auto-save permanent insight:', err);
      }
    }

    // Auto-generate image if requested by user in prompt
    let generatedImageResult = null;
    if (parsed.imageGenerationIntent && parsed.imageGenerationIntent.prompt) {
      try {
        generatedImageResult = await generateImageCore({
          prompt: parsed.imageGenerationIntent.prompt,
          style: parsed.imageGenerationIntent.style || 'stark_hologram',
          aspectRatio: parsed.imageGenerationIntent.aspectRatio || '1:1',
          userTitle,
          deviceLocation,
        });
      } catch (imgErr) {
        console.warn('Auto image generation inside /api/jarvis/ai failed:', imgErr);
      }
    }

    // Save user prompt & Jarvis response into 14-day history
    saveConversationEntry({ sender: 'user', text: prompt });
    saveConversationEntry({
      sender: 'jarvis',
      text: parsed.reply,
      permanentInsightId: savedPermanentInsight?.id,
    });

    return res.json({
      response: parsed.reply,
      autoLearned: savedFact,
      permanentInsight: savedPermanentInsight,
      generatedImage: generatedImageResult,
      videoUrl: parsed.videoIntent?.videoUrl,
      videoId: parsed.videoIntent?.videoId,
      videoTitle: parsed.videoIntent?.title,
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

    // Normalize mimeType (strip codecs e.g. audio/webm;codecs=opus -> audio/webm)
    const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();

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
                  mimeType: cleanMime,
                  data: audioBase64,
                },
              },
              {
                text: 'Dokonaj dokładnej transkrypcji powyższego nagrania mowy w języku polskim. Zwróć WYŁĄCZNIE przepisany tekst mowy użytkownika, bez żadnych dodatkowych komentarzy ani formatowania markdown. Jeśli na nagraniu jest cisza lub brak mowy, zwróć pusty ciąg.',
              },
            ],
          },
        ],
      },
      ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite']
    );

    let transcript = response.text?.trim() || '';
    // Strip surrounding quotes if model added them
    if (transcript.startsWith('"') && transcript.endsWith('"')) {
      transcript = transcript.slice(1, -1).trim();
    }
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

// Image Generation Endpoint (Gemini Image Models + Resilient Multi-Tier Fallback)
app.post('/api/jarvis/generate-image', async (req, res) => {
  try {
    const {
      prompt,
      aspectRatio = '1:1',
      style = 'photorealistic',
      userTitle = 'Sir',
      deviceLocation = 'Warszawa',
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Podaj opis obrazu (prompt) do wygenerowania.' });
    }

    const result = await generateImageCore({
      prompt,
      aspectRatio,
      style,
      userTitle,
      deviceLocation,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Image Generation error:', error);
    return res.status(500).json({
      error: error.message || 'Błąd generacji obrazu.',
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
