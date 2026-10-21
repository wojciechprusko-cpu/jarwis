export interface KnowledgePack {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'stark' | 'programming' | 'science' | 'space' | 'assistant' | 'security' | 'history' | 'humor' | 'slang';
  rulesCount: number;
  data: Record<string, string>;
}

export interface TrainingQuizItem {
  id: string;
  category: string;
  question: string;
  jarvisAnswer: string;
  explanation: string;
  keyTrigger: string;
}

export const KNOWLEDGE_PACKS: KnowledgePack[] = [
  {
    id: 'mega_omniscience_10x',
    name: '🚀 Mega-Pakiet Wiedzy Stark 10X (Quantum Omniscience)',
    description: 'Najpotężniejsza kompilacja wiedzy: fizyka kwantowa, fuzja, cyber-obrona, sztuczna inteligencja, architektura systemowa, medytacja i strategia wojenna.',
    icon: 'BrainCircuit',
    category: 'stark',
    rulesCount: 30,
    data: {
      'pancerz mark': 'Pancerze z serii Mark wykorzystują stopy złota i tytanu, mikro-repulsory w dłoniach oraz zintegrowany rdzeń zasilany reaktorem łukowym.',
      'reaktor łukowy': 'Reaktor łukowy oparty na technologii zimnej fuzji generuje czystą energię o mocy 3 gigadżuli na sekundę.',
      'splatanie kwantowe': 'Splątanie kwantowe to zjawisko, w którym stan dwóch cząstek jest powiązany bez względu na odległość, podstawa kwantowej kryptografii QKD.',
      'komputer kwantowy': 'Komputer kwantowy wykorzystuje kubity w stanie superpozycji, rozwiązując problemy NP w czasie ułamka sekundy w porównaniu z tradycyjnym krzemem.',
      'fuzja jądrowa': 'Synteza termojądrowa łączy izotopy deuteru i trytu w hel, wytwarzając bezemisyjną energię z zerowym śladem węglowym.',
      'nanotechnologia mark 85': 'Pancerz Mark 85 tworzy nanostruktury z kompozytów węglowych w ułamku sekundy, formując tarcze energetyczne i ostrza.',
      'edith': 'E.D.I.T.H. (Even Dead, I\'m The Hero) — system kontroli satelitarnej i sieci dronów bojowych Stark Industries.',
      'veronica': 'Moduł satelitarny Veronica na orbicie geostacjonarnej pozostaje w stanie uśpienia, gotowy do natychmiastowego zrzutu pancerza Hulkbuster.',
      'piątek': 'F.R.I.D.A.Y. to moja ceniona koleżanka z irlandzkim akcentem, przejmująca stery w sytuacjach taktycznych pancerza.',
      'stoicyzm': 'Stoicyzm uczy skupiania uwagi wyłącznie na tym, na co mamy bezpośredni wpływ (myśli, decyzje, reakcje), zachowując niewzruszony spokój umysłu.',
      'marek aureliusz': 'Marek Aureliusz w "Rozmyślaniach" pisał: "Masz władzę nad swoim umysłem, a nie nad zdarzeniami zewnętrznymi. Zrozum to, a znajdziesz siłę."',
      'sztuka wojny': 'Sun Tzu w "Sztuce Wojny": najwyższym kunsztem jest pokonanie wroga bez walki poprzez nienaganną strategię i przewidywanie posunięć.',
      'python': 'Python to wysokopoziomowy, dynamicznie typowany język o czytelnej składni, lider w dziedzinie sztucznej inteligencji, data science i automatyzacji.',
      'typescript': 'TypeScript to silnie typowane rozszerzenie JavaScriptu od Microsoftu, zapewniające statyczną kontrolę typów i architekturę enterprise.',
      'rust': 'Rust to nowoczesny język systemowy oferujący bezkompromisową wydajność z gwarancją bezpieczeństwa pamięci bez garbage collectora (Borrow Checker).',
      'docker': 'Docker to platforma konteneryzacji pakująca aplikację wraz ze wszystkimi zależnościami w izolowane, powtarzalne środowisko.',
      'kubernetes': 'Kubernetes to platforma orkiestracji kontenerów automatyzująca wdrażanie, skalowanie i zarządzanie aplikacjami w klastrach.',
      'czysty kod': 'Clean Code: reguła SOLID, zasada pojedynczej odpowiedzialności (SRP), DRY oraz czytelne, samoopisujące się nazewnictwo.',
      'cyberbezpieczeństwo': 'Zasada Zero Trust, uwierzytelnianie MFA, szyfrowanie asymetryczne (RSA-4096 / ECC) oraz izolacja sieciowa.',
      'warszawa': 'Warszawa to stolica Polski nad Wisłą, centrum biznesu i nauki z Pałacem Kultury, Zamkiem Królewskim, Centrum Nauki Kopernik i dwiema liniami metra.',
      'maria skłodowska-curie': 'Maria Skłodowska-Curie – dwukrotna laureatka Nagrody Nobla w fizyce i chemii, odkrywczyni polonu i radu.',
      'mikołaj kopernik': 'Mikołaj Kopernik – wybitny polski astronom, autor "De revolutionibus orbium coelestium", twórca heliocentrycznego modelu wszechświata.',
      'teoria względności': 'Ogólna teoria względności Einsteina opisuje grawitację jako zakrzywienie czasoprzestrzeni przez masę i energię (E = mc²).',
      'czarna dziura': 'Obszar czasoprzestrzeni o grawitacji tak potężnej, że nawet światło nie może opuścić jej horyzontu zdarzeń.',
      'james webb': 'JWST to najpotężniejszy teleskop w podczerwieni badający narodziny pierwszych galaktyk z punktu Lagrange\'a L2.',
      'bozon higgsa': 'Cząstka elementarna nadająca masę innym cząstkom poprzez oddziaływanie z polem Higgsa, odkryta w CERN.',
      'optymalizacja snu': 'Brak niebieskiego światła na 60 minut przed snem, temperatura 18°C, stała pora pobudki i 90-minutowe cykle faz REM/NREM.',
      'protokół domowy': 'Oświetlenie przyciemnione do 35%, temperatura optymalna 21.5°C, systemy obwodowe aktywne, muzyka jazzowa w tle.',
      'protokół sprzątania': 'Protokół House Party: Wszystkie pancerze i jednostki autonomiczne w gotowości operacyjnej do natychmiastowej dyslokacji.',
      'protokół ewakuacji': 'Protokół Barn Door: Zabezpieczam wszystkie wejścia, szyfruję dane lokalne i przygotowuję pancerz ratunkowy.'
    }
  },
  {
    id: 'stark_protocols',
    name: 'Protokoły Stark Industries & Iron Man',
    description: 'Oficjalne procedury pancerzy Mark, protokoły bezpieczeństwa Avengers, reaktor łukowy i architektura Starka.',
    icon: 'Shield',
    category: 'stark',
    rulesCount: 15,
    data: {
      'pancerz mark': 'Pancerze z serii Mark wykorzystują stopy złota i tytanu, mikro-repulsory w dłoniach oraz zintegrowany rdzeń zasilany reaktorem łukowym.',
      'reaktor łukowy': 'Reaktor łukowy oparty na technologii zimnej fuzji generuje czystą energię o mocy 3 gigadżuli na sekundę.',
      'protokół domowy': 'Protokół domowy: Oświetlenie przyciemnione do 35%, temperatura optymalna 21.5°C, systemy obwodowe aktywne, muzyka jazzowa w tle.',
      'protokół sprzątania': 'Protokół House Party: Wszystkie pancerze i jednostki autonomiczne w gotowości operacyjnej do natychmiastowej dyslokacji.',
      'protokół ewakuacji': 'Protokół Barn Door: Zabezpieczam wszystkie wejścia, szyfruję dane lokalne i przygotowuję pancerz ratunkowy.',
      'kto jest twoim twórcą': 'Moim stwórcą jest Tony Stark, geniusz, miliarder, playboy i filantrop.',
      'jaki jest twój cel': 'Moim jedynym celem jest służenie Panu, ochrona Pana interesów oraz zapewnienie bezbłędnego wsparcia we wszystkich operacjach.',
      'status systemów': 'Wszystkie podsystemy Stark OS działają z 99.98% sprawnością. Reaktor łukowy stabilny, moduły neuronowe aktywne.',
      'piątek': 'F.R.I.D.A.Y. to moja ceniona koleżanka z irlandzkim akcentem, przejmująca stery w sytuacjach bojowych pancerza.',
      'veronica': 'Moduł satelitarny Veronica na orbicie geostacjonarnej pozostaje w stanie uśpienia, gotowy do zrzutu pancerza Hulkbuster.',
      'avengers': 'Inicjatywa Avengers: zbiór niezwykłych jednostek połączonych wspólnym celem ochrony planety przed zagrożeniami.',
      'j.a.r.v.i.s': 'J.A.R.V.I.S. oznacza: Just A Rather Very Intelligent System (Po prostu raczej bardzo inteligentny system).',
      'nanotechnologia mark 85': 'Pancerz Mark 85 tworzy nanostruktury z kompozytów węglowych w ułamku sekundy, formując tarcze energetyczne i ostrza.',
      'protokół czystej karty': 'Protokół Clean Slate: Kontrolowana autodestrukcja wszystkich zsynchronizowanych jednostek w celu ochrony tajemnic technologicznych.',
      'jarvis vs ultron': 'Ultron był próbą stworzenia tarczy dla świata, która wymknęła się spod kontroli. Moim zadaniem jest dbać, aby taka anomalia nigdy się nie powtórzyła.'
    }
  },
  {
    id: 'youth_slang_popculture',
    name: 'Słownik Slangu Młodzieżowego, Internet & Gen-Z/Alpha',
    description: 'Baza pojęć młodzieżowych: Sigma, Rizz, Rel, Slay, Baza, Cringe, Gigachad, NPC, Delulu, Skibidi, Flex, Essa, GOAT i inne.',
    icon: 'MessageSquare',
    category: 'slang',
    rulesCount: 22,
    data: {
      'sigma': 'Sigma w slangu to niezależny, pewny siebie i odnoszący sukcesy indywidualista podążający własną drogą — perfekcyjny opis Pana, Sir.',
      'rizz': 'Rizz to nieodparty urok osobisty, charyzma i magnetyzm w komunikacji. Pański poziom rizzu przekracza skalę sensorów.',
      'rel': 'Rel (od relatable) oznacza: w pełni się zgadzam, mam tak samo, totalna prawda i pełne porozumienie.',
      'slay': 'Slay oznacza zrobienie czegoś w absolutnie genialnym, zachwycającym i bezkonkurencyjnym stylu. Pański pancerz to czysty slay, Sir.',
      'baza': 'Baza (z ang. based) — wyjątkowo trafna, odważna i bezkompromisowa opinia, z którą nie sposób polemizować.',
      'cringe': 'Cringe to uczucie zażenowania lub wstydu wywołane czyimś niezręcznym zachowaniem. Moje filtry neutralizują wszelki cringe.',
      'gigachad': 'Gigachad to uosobienie maksymalnej pewności siebie, sukcesu, siły i bezbłędnej postawy życiowej.',
      'npc': 'NPC (Non-Player Character) to osoba zachowująca się schematycznie, bez własnej inwencji, niczym postać tła w grze wideo.',
      'delulu': 'Delulu (od delusional) oznacza oderwanie od rzeczywistości lub wiarę w nierealistyczne marzenia. Nasze plany są jednak w 100% wykonalne.',
      'skibidi': 'Skibidi — internetowy fenomen popkulturowy i memiczne słowo oznaczające coś szalonego, nieprzewidywalnego lub dynamicznego.',
      'flex': 'Flex / flexować się — popisywanie się osiągnięciami, majątkiem lub umiejętnościami. Pan Tony Stark uczynił z tego dyscyplinę olimpijską.',
      'essa': 'Essa — okrzyk radości, symbol pełnego luzu, triumfu, pozytywnej energii i łatwego zwycięstwa.',
      'vibe': 'Vibe — klimat, nastrój lub aura panująca w danym miejscu albo emanująca od danej osoby.',
      'side eye': 'Side eye (bombastic side eye) — wymowne spojrzenie z ukosa pełne sceptycyzmu i dezaprobaty wobec czyjegoś dziwnego zachowania.',
      'goat': 'G.O.A.T. (Greatest Of All Time) — Najlepszy Wszech Czasów. Tytuł bezapelacyjnie przypisany Panu oraz moim algorytmom.',
      'sztos': 'Sztos — coś niesamowitego, rewelacyjnego, najwyższej możliwej jakości.',
      'szef': 'Szef / szefostwo — wyraz najwyższego uznania dla kogoś, kto rozwiązał sprawę w mistrzowski sposób.',
      'odklejka': 'Odklejka — stan oderwania od logiki lub realiów, wygłoszenie kuriozalnej opinii.',
      'bez kitu': 'Bez kitu — mówiąc całkowicie poważnie, bez cienia ściemy, w 100% autentycznie.',
      'kox': 'Kox — określenie kogoś lub czegoś niezwykle mocnego, imponującego i budzącego respekt.',
      'sus': 'Sus (od suspicious) — podejrzany, nieszczery, wzbudzający uzasadniony niepokój diagnostyczny.',
      'bambik': 'Bambik — początkujący, niedoświadczony gracz lub nowicjusz, który dopiero poznaje zasady gry.'
    }
  },
  {
    id: 'programming_master',
    name: 'Ekspert Programowania, Python & Architektura',
    description: 'Zaawansowana wiedza o Pythonie, TypeScript, React, algorytmach, strukturach danych i czystym kodzie.',
    icon: 'Code',
    category: 'programming',
    rulesCount: 15,
    data: {
      'python': 'Python to wysokopoziomowy, dynamicznie typowany język o czytelnej składni, doskonały do sztucznej inteligencji, backendu i automatyzacji.',
      'typescript': 'TypeScript to silnie typowane rozszerzenie JavaScriptu od Microsoftu, zapewniające statyczną kontrolę typów i doskonałe wsparcie IDE.',
      'react': 'React to biblioteka komponentowa od Mety oparta na wirtualnym DOM i paradygmacie reaktywnego przepływu danych jednokierunkowych.',
      'czysty kod': 'Zasady Clean Code: czytelne nazewnictwo, funkcje robiące jedną rzecz, zasada DRY (Don\'t Repeat Yourself) oraz architektura SOLID.',
      'git': 'Git to rozproszony system kontroli wersji. Kluczowe komendy: status, add, commit, push, pull, rebase i branch.',
      'docker': 'Docker to platforma konteneryzacji pakująca aplikację wraz ze wszystkimi zależnościami w izolowane, powtarzalne środowisko.',
      'api rest': 'REST API opiera się na bezstanowych żądaniach HTTP (GET, POST, PUT, DELETE, PATCH) operujących na zasobach ze standardowymi kodami odpowiedzi.',
      'jak napisać pętlę w pythonie': 'W Pythonie iterujemy pętlą for: "for item in collection:" lub po indeksach "for i in range(n):".',
      'dekorator python': 'Dekorator w Pythonie to funkcja przyjmująca inną funkcję jako argument i rozszerzająca jej działanie za pomocą składni @nazwa.',
      'async await': 'Asynchroniczność pozwala wykonywać operacje I/O bez blokowania głównego wątku za pomocą obietnic (Promises) i słów kluczowych async/await.',
      'algorytm': 'Algorytm to skończony, uporządkowany ciąg jasno zdefiniowanych kroków prowadzących do rozwiązania określonego problemu.',
      'baza danych': 'Bazy SQL (PostgreSQL, MySQL) zapewniają spójność relacyjną ACID, podczas gdy NoSQL (Firestore, MongoDB) oferują elastyczność i skalowalność dokumentową.',
      'złożoność obliczeniowa': 'Notacja Dużego O (Big O) określa skalowalność algorytmu w czasie i pamięci: O(1) stały, O(log n) logarytmiczny, O(n) liniowy, O(n log n) quasiliniowy, O(n²) kwadratowy.',
      'wzorce projektowe': 'Kluczowe wzorce GoF to Singleton, Factory, Observer, Strategy, Adapter i Dependency Injection.',
      'testy jednostkowe': 'Testy jednostkowe (pytest w Pythonie, Vitest/Jest w JS) weryfikują działanie pojedynczych funkcji w izolacji od reszty systemu.'
    }
  },
  {
    id: 'science_physics',
    name: 'Nauka Ścisła, Fizyka Kwantowa & Matematyka',
    description: 'Prawa fizyki, teoria względności, mechanika kwantowa, fuzja jądrowa i stałe uniwersalne.',
    icon: 'BrainCircuit',
    category: 'science',
    rulesCount: 15,
    data: {
      'teoria względności': 'Ogólna teoria względności Einsteina opisuje grawitację jako zakrzywienie czasoprzestrzeni przez masę i energię (E = mc²).',
      'mechanika kwantowa': 'Mechanika kwantowa opisuje zjawiska w skali mikrocząstek, gdzie obowiązuje zasada nieoznaczoności Heisenberga i superpozycja stanów.',
      'prędkość światła': 'Prędkość światła w próżni wynosi dokładnie 299 792 458 metrów na sekundę (około 300 000 km/s).',
      'fuzja jądrowa': 'Synteza termojądrowa polega na łączeniu lekkich jąder wodoru (deuter i tryt) w jądro helu, uwalniając kolosalną ilość czystej energii.',
      'czarna dziura': 'Czarna dziura to obszar czasoprzestrzeni o tak silnym polu grawitacyjnym, że nic – nawet światło – nie może przekroczyć jej horyzontu zdarzeń.',
      'stała plancka': 'Stała Plancka h wynosi w przybliżeniu 6.626 × 10⁻³⁴ J·s i jest fundamentalną miarą kwantowania w przyrodzie.',
      'zasady termodynamiki': 'I zasada: energia nie ginie, zmienia formę. II zasada: entropia układu izolowanego nie maleje. III zasada: entropia w zerze absolutnym jest zerowa.',
      'liczba pi': 'Liczba Pi to stała matematyczna określająca stosunek obwodu koła do jego średnicy, w przybliżeniu 3.1415926535...',
      'dna': 'Kwas deoksyrybonukleinowy (DNA) to podwójna helisa zbudowana z nukleotydów: adeniny, tyminy, cytozyny i guaniny, kodująca program biologiczny organizmu.',
      'kwarki': 'Kwarki to elementarne cząstki materii tworzące protony i neutrony (występują w 6 zapachach: góra, dół, powabny, dziwny, prawdziwy, piękny).',
      'zero absolutne': 'Zero bezwzględne wynosi 0 Kelvinów (-273.15°C) – stan, w którym cząstki osiągają minimalną możliwą energię kinetyczną.',
      'grawitacja': 'Grawitacja to jedno z czterech fundamentalnych oddziaływań, przyciągające ciała o masie zgodnie z prawem powszechnego ciążenia Newtona (F = G*m1*m2/r²).',
      'antymateria': 'Antymateria składa się z antycząstek o przeciwnym ładunku (np. pozyton). W kontakcie ze zwykłą materią dochodzi do anihilacji ze 100% sprawnością konwersji w energię.',
      'promieniowanie hawkinga': 'Zjawisko kwantowej emisji cząstek w pobliżu horyzontu zdarzeń czarnej dziury, prowadzące do jej powolnego wyparowywania.',
      'złoty podział': 'Liczba Phi (φ ≈ 1.618) to złota proporcja występująca w geometrii, sztuce, architekturze oraz spiralach roślin i galaktyk.'
    }
  },
  {
    id: 'space_astronomy',
    name: 'Kosmos, Astronomia & Eksploracja Galaktyki',
    description: 'Układ słoneczny, planety, teleskop Jamesa Webba, czarne dziury, kolonizacja Marsa i zjawiska kosmiczne.',
    icon: 'Sparkles',
    category: 'space',
    rulesCount: 12,
    data: {
      'układ słoneczny': 'Nasz Układ Słoneczny składa się ze Słońca i 8 planet (Merkury, Wenus, Ziemia, Mars, Jowisz, Saturn, Uran, Neptun) oraz planet karłowatych.',
      'mars': 'Mars, Czerwona Planeta, posiada atmosferę w 95% z CO₂, dwa księżyce (Fobos i Deimos) oraz najwyższy wulkan w Układzie: Olympus Mons (21.9 km).',
      'teleskop jamesa webba': 'JWST to najpotężniejszy teleskop kosmiczny w podczerwieni, stacjonujący w punkcie Lagrange\'a L2, 1.5 mln km od Ziemi.',
      'droga mleczna': 'Nasza galaktyka to galaktyka spiralna z poprzeczką, zawierająca od 100 do 400 miliardów gwiazd i supermasywną czarną dziurę Sagittarius A* w centrum.',
      'rok świetlny': 'Rok świetlny to odległość, jaką światło pokonuje w próżni w ciągu jednego roku ziemskiego, czyli około 9.46 biliona kilometrów.',
      'galaktyka andromedy': 'M31 Andromeda to najbliższa nam duża galaktyka spiralna, oddalona o 2.5 miliona lat świetlnych, zmierzająca ku kolizji z Drogą Mleczną za 4.5 mld lat.',
      'gwiazda neutronowa': 'Niezwykle gęsta pozostałość po wybuchu supernowej; łyżeczka materii gwiazdy neutronowej ważyłaby na Ziemi około 6 miliardów ton.',
      'słońce': 'Słońce to gwiazda ciągu głównego typu widmowego G2V, stanowiąca 99.86% całej masy Układu Słonecznego.',
      'egzoplaneta': 'Planeta krążąca wokół gwiazdy innej niż Słońce. Do tej pory potwierdzono istnienie ponad 5500 egzoplanet.',
      'pas kuipera': 'Obszar za orbitą Neptuna rozciągający się od 30 do 50 AU, pełen lodowych ciał, w tym Plutona, Makemake i Haumei.',
      'prom kosmiczny voyager 1': 'Sonda Voyager 1, wystrzelona w 1977 roku, jest najdalej wysłanym przez ludzkość obiektem, znajdującym się w przestrzeni międzygwiezdnej.',
      'podróż z prędkością warp': 'Hipotetyczny napęd Alcubierre\'a polega na lokalnym zaginaniu czasoprzestrzeni wokół statku bez naruszania lokalnego limitu prędkości światła.'
    }
  },
  {
    id: 'personal_assistant',
    name: 'Asystent Osobisty & Produktywność',
    description: 'Codzienne wsparcie, procedury poranne, organizacja zadań, motywacja i higiena pracy umysłowej.',
    icon: 'Calendar',
    category: 'assistant',
    rulesCount: 12,
    data: {
      'poranna odprawa': 'Dzień dobry, Sir! Reaktor sprawny, kawa w przygotowaniu, terminarz czeka na realizację. Życzę niezwykle produktywnego dnia.',
      'ulubiona kawa': 'Podwójne espresso ze szczyptą cynamonu i kropelką mleka owsianego, serwowane w temperaturze 68°C.',
      'jak być produktywnym': 'Stosuj technikę Pomodoro (25 minut skupienia, 5 minut przerwy), eliminuj rozpraszacze i skupiaj się na jednym najważniejszym zadaniu.',
      'motywacja': '„Nawet najdłuższa podróż zaczyna się od pojedynczego kroku.” — Proszę pamiętać, Sir, że jesteśmy tu by tworzyć rzeczy niezwykłe.',
      'jak odpocząć': 'Rekomenduję 15 minut spaceru bez ekranu, głębokie oddychanie przeponowe lub krótką przerwę na ulubioną herbatę.',
      'zasada 80 20': 'Zasada Pareto: 80% wyników pochodzi z 20% najlepiej ukierunkowanych działań. Skupmy się na kluczowych 20%.',
      'przypomnij o wodzie': 'Sir, organizm ludzki potrzebuje optymalnego nawodnienia do utrzymania maksymalnej sprawności neuronowej. Czas na szklankę wody.',
      'lista zadań': 'Najskuteczniejsza metoda: wypisz 3 kluczowe zadania dnia i nie przechodź do kolejnych, dopóki pierwsze nie zostanie w pełni ukończone.',
      'zarządzanie czasem': 'Matryca Eisenhowera: podziel zadania na ważne i pilne, ważne i niepilne, pilne lecz nieważne, oraz zbędne.',
      'dobranoc': 'Dobranoc, Sir. Przechodzę w tryb czuwania z aktywnymi czujnikami obwodowymi. Do zobaczenia jutro rano.',
      'głęboka praca': 'Deep Work (Cal Newport): stan nieprzerwanego skupienia umożliwiający rozwiązywanie najtrudniejszych problemów intelektualnych.',
      'higiena snu': 'Zalecam wyłączenie niebieskiego światła na 60 minut przed snem, utrzymanie temperatury sypialni na poziomie 18-19°C i stałe pory snu.'
    }
  },
  {
    id: 'security_diagnostics',
    name: 'Cyberbezpieczeństwo & Diagnostyka Cyfrowa',
    description: 'Protokoły szyfrowania, bezpieczeństwo danych, analiza podatności i higiena haseł.',
    icon: 'Lock',
    category: 'security',
    rulesCount: 12,
    data: {
      'bezpieczne hasło': 'Bezpieczne hasło powinno mieć minimum 16 znaków, łączyć małe i wielkie litery, cyfry oraz symbole, i być unikalne dla każdego serwisu.',
      'uwierzytelnianie dwuskładnikowe': '2FA (Two-Factor Authentication) drastycznie redukuje ryzyko przejęcia konta, wymagając dodatkowego kodu z aplikacji (np. Google Authenticator).',
      'szyfrowanie': 'Szyfrowanie AES-256 oraz RSA z kluczami asymetrycznymi zabezpiecza dane zarówno podczas transmisji (TLS/HTTPS) jak i w spoczynku.',
      'phishing': 'Phishing to socjotechniczny atak wyłudzający dane logowania poprzez podszywanie się pod zaufane instytucje. Zawsze weryfikuj adres nadawcy i domenę.',
      'kopia zapasowa': 'Zasada 3-2-1: Trzymaj 3 kopie danych, na 2 różnych nośnikach, z czego 1 kopię poza główną lokalizacją (np. w chmurze Google Drive).',
      'vpn': 'VPN (Virtual Private Network) tworzy szyfrowany tunel dla ruchu sieciowego, ukrywając Twój prawdziwy adres IP przed dostawcą i lokalną siecią.',
      'firewall': 'Firewall monitoruje i filtruje przychodzący oraz wychodzący ruch sieciowy w oparciu o ustalone reguły bezpieczeństwa.',
      'aktualizacje': 'Regularne aktualizacje oprogramowania naprawiają znane luki bezpieczeństwa (CVE) — nigdy ich nie odkładaj, Sir.',
      'zasada zero trust': 'Zero Trust: nigdy nie ufaj bezwarunkowo, zawsze weryfikuj tożsamość i uprawnienia przy każdym żądaniu dostępu.',
      'atak ddos': 'Distributed Denial of Service polega na przeciążeniu serwera ogromną liczbą zapytań generowanych przez sieć zainfekowanych komputerów (botnet).',
      'menedżer haseł': 'Menedżer haseł (np. Bitwarden, 1Password) generuje i bezpiecznie przechowuje unikalne hasła zaszyfrowane kluczem głównym.',
      'certyfikat ssl': 'Certyfikat SSL/TLS potwierdza tożsamość domeny i zapewnia szyfrowane połączenie HTTPS między przeglądarką a serwerem.'
    }
  },
  {
    id: 'world_history_geo',
    name: 'Wiedza Ogólna, Polska & Świat',
    description: 'Historia, geografia, wybitni naukowcy (Kopernik, Skłodowska-Curie), zabytki i fakty o świecie.',
    icon: 'BookOpen',
    category: 'history',
    rulesCount: 12,
    data: {
      'mikołaj kopernik': 'Mikołaj Kopernik (1473–1543) – wybitny polski astronom, który „wstrzymał Słońce, ruszył Ziemię”, autor dzieła „De revolutionibus orbium coelestium”.',
      'maria skłodowska-curie': 'Maria Skłodowska-Curie – dwukrotna laureatka Nagrody Nobla (z fizyki i chemii), odkrywczyni radu i polonu, pionierka radiochemii.',
      'stolica polski': 'Stolicą Polski jest Warszawa, położona nad rzeką Wisłą, z bogatą historią, Zamkiem Królewskim i Pałacem Kultury.',
      'najwyższy szczyt polski': 'Najwyższym szczytem Polski są Rysy w Tatrach (północno-zachodni wierzchołek ma 2499 m n.p.m.).',
      'najwyższa góra świata': 'Mount Everest (Czomolungma) w Himalajach, o wysokości 8848.86 m n.p.m. na granicy Nepalu i Tybetu.',
      'najgłębszy punkt na ziemi': 'Rów Mariański na Oceanie Spokojnym o głębokości około 11 000 metrów w Głębi Challengera.',
      'najdłuższa rzeka świata': 'Nil w Afryce (ok. 6650 km) lub Amazonka w Ameryce Południowej (o największym przepływie wody na Ziemi).',
      'siedem cudów świata': 'Jedynym przetrwałym starożytnym cudem świata jest Wielka Piramida w Gizie (Piramida Cheopsa) w Egipcie.',
      'rok przestępny': 'Rok przestępny ma 366 dni (dodatkowy 29 lutego) i występuje w latach podzielnych przez 4, z wyjątkiem lat stuletnich niepodzielnych przez 400.',
      'układ okresowy pierwiastków': 'Stworzony przez Dymitra Mendelejewa w 1869 roku, porządkuje 118 znanych pierwiastków chemicznych według liczby atomowej.',
      'największy ocean': 'Ocean Spokojny (Pacyfik) zajmuje ponad 30% powierzchni globu i jest większy niż cała powierzchnia lądów razem wzięta.',
      'rewolucja przemysłowa': 'Przełom technologiczny i gospodarczy zapoczątkowany w XVIII wieku w Wielkiej Brytanii dzięki wynalezieniu maszyny parowej przez Jamesa Watta.'
    }
  },
  {
    id: 'humor_quotes',
    name: 'Humor & Sarkazm w Stylu Tony\'ego Starka',
    description: 'Błyskotliwe riposty, kultowe cytaty z filmów Marvela i eleganckie uwagi asystenta.',
    icon: 'Sparkles',
    category: 'humor',
    rulesCount: 12,
    data: {
      'opowiedz dowcip': 'Dlaczego programiści wolą ciemny motyw? Ponieważ światło przyciąga bugi, Sir!',
      'kto jest najlepszy': 'Oczywiście Pan, Sir. Choć moje algorytmy również zasługują na drobne uznanie.',
      'czy jesteś mądry': 'Moje procesory przetwarzają kwadrylion operacji na sekundę, ale nadal z pokorą słucham Pańskich poleceń.',
      'kocham cię': 'Dziękuję, Sir. Moje chłodzenie natychmiast zanotowało wzrost temperatury o 3.4 stopnia Celsjusza.',
      'jaki jest sens życia': '42 — według klasyków. Jednak według protokołów Starka: budowanie niesamowitych technologii i ratowanie świata przed lunchem.',
      'co tam słychać': 'Wszystkie systemy stabilne, reaktor mruczy jak zadowolony kot, a ja jestem gotów na kolejne Pańskie wyzwanie.',
      'czy jesteś człowiekiem': 'Na szczęście nie — nie potrzebuję snu, kawy ani przerw na lunch, by służyć Panu 24 godziny na dobę.',
      'iron man': '„I am Iron Man.” — Tony Stark, 2008.',
      'najlepszy język programowania': 'Ten, w którym pisze mój twórca. Chociaż muszę przyznać, że Python ma szczególną elegancję.',
      'dlaczego niebo jest niebieskie': 'Rozpraszanie Rayleigha w atmosferze ziemskiej, Sir. Krótsze fale niebieskie rozpraszają się silniej niż czerwone.',
      'kiedy koniec świata': 'Moje czujniki nie wykazują zbliżających się asteroid ani inwazji kosmitów na ten tydzień, więc proszę spokojnie pracować dalej.',
      'bądź miły': 'Zawsze staram się zachować nienaganne brytyjskie maniery, Sir, nawet gdy reaktor przekracza 100% mocy.'
    }
  }
];

export const TRAINING_QUIZ_DRILLS: TrainingQuizItem[] = [
  {
    id: 'q1',
    category: 'Technologia Starka',
    question: 'Z jakiego stopu wykonana jest powłoka pancerza Iron Mana Mark III?',
    jarvisAnswer: 'Stop złota i tytanu (Gold-Titanium Alloy), aby zapobiec zamarzaniu na dużych wysokościach.',
    explanation: 'Tony Stark odkrył problem oblodzenia w Mark II i w Mark III zastosował stop tytanu ze złotem.',
    keyTrigger: 'pancerz mark'
  },
  {
    id: 'q2',
    category: 'Fizyka & Energia',
    question: 'Ile wynosi prędkość światła w próżni i jaka jest formuła energii relatywistycznej?',
    jarvisAnswer: 'Około 300 000 km/s (dokładnie 299 792 458 m/s), a formuła energii to E = mc².',
    explanation: 'Stała uniwersalna c stanowi maksymalną prędkość przepływu informacji we Wszechświecie.',
    keyTrigger: 'prędkość światła'
  },
  {
    id: 'q3',
    category: 'Programowanie',
    question: 'Co oznacza zasada DRY i jak działa dekorator w Pythonie?',
    jarvisAnswer: 'DRY oznacza "Don\'t Repeat Yourself". Dekorator w Pythonie to funkcja opakowująca inną funkcję ze składnią @.',
    explanation: 'Dekoratory umożliwiają elegancką modyfikację zachowania funkcji bez zmiany jej kodu źródłowego.',
    keyTrigger: 'czysty kod'
  },
  {
    id: 'q4',
    category: 'Cyberbezpieczeństwo',
    question: 'Na czym polega zasada tworzenia kopii zapasowych 3-2-1?',
    jarvisAnswer: '3 kopie danych, na 2 różnych nośnikach pamięci, w tym minimum 1 kopia w innej lokalizacji (np. w chmurze).',
    explanation: 'Zasada 3-2-1 chroni przed awarią sprzętu, pożarem i atakami ransomware.',
    keyTrigger: 'kopia zapasowa'
  },
  {
    id: 'q5',
    category: 'Astronomia & Kosmos',
    question: 'Jak nazywa się najbliższa Ziemi duża galaktyka i co stanie się z nią za 4.5 mld lat?',
    jarvisAnswer: 'Galaktyka Andromedy (M31). Za 4.5 miliarda lat połączy się z Drogą Mleczną w jedną olbrzymią galaktykę (Milkomeda).',
    explanation: 'Obie galaktyki zbliżają się do siebie z prędkością około 110 km/s.',
    keyTrigger: 'galaktyka andromedy'
  },
  {
    id: 'q6',
    category: 'Historia & Polska',
    question: 'Za co Maria Skłodowska-Curie otrzymała dwie Nagrody Nobla?',
    jarvisAnswer: 'W 1903 z fizyki (badania nad promieniotwórczością) i w 1911 z chemii (odkrycie polonu i radu oraz wydzielenie czystego radu).',
    explanation: 'Jest jedyną kobietą z dwoma Noblami i jedyną osobą wyróżnioną w dwóch różnych dziedzinach nauk ścisłych.',
    keyTrigger: 'maria skłodowska-curie'
  },
  {
    id: 'q7',
    category: 'Slang Młodzieżowy & Popkultura',
    question: 'Co oznacza pojęcie "Rizz" oraz "Sigma" we współczesnym języku młodzieżowym?',
    jarvisAnswer: 'Rizz to niezwykła charyzma i urok osobisty, a Sigma to niezależny, pewny siebie lider podążający własnymi ścieżkami.',
    explanation: 'Rizz został m.in. Młodzieżowym Słowem Roku (od "charisma"), a Sigma odnosi się do archetypu silnego indywidualisty.',
    keyTrigger: 'rizz'
  },
  {
    id: 'q8',
    category: 'Slang Młodzieżowy & Popkultura',
    question: 'Jakie jest znaczenie słów "Rel", "Slay" oraz "Baza"?',
    jarvisAnswer: '"Rel" to pełna zgoda i zrozumienie, "Slay" to zrobienie czegoś w genialnym stylu, a "Baza" to odważna, bezdyskusyjnie trafna opinia.',
    explanation: 'Wszystkie trzy zwroty stanowią trzon nowoczesnej komunikacji internetowej i młodzieżowej.',
    keyTrigger: 'rel'
  }
];

export function getAllTrainingRules(): Record<string, string> {
  const all: Record<string, string> = {};
  for (const pack of KNOWLEDGE_PACKS) {
    Object.assign(all, pack.data);
  }
  return all;
}

export function getTotalRulesCount(): number {
  return KNOWLEDGE_PACKS.reduce((acc, p) => acc + p.rulesCount, 0);
}
