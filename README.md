# 🇬🇧 English Flashcards B1/B2 

## Nowoczesna aplikacja do nauki angielskiego poziom B1/B2

Profesjonalna aplikacja webowa do nauki języka angielskiego z 1600+ słowami w 32 kategoriach, quizami i zaawansowanymi funkcjami.

![English Flashcards Banner](https://img.shields.io/badge/English-B1%2FB2-blue?style=for-the-badge&logo=education)
![Version](https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## 📋 Spis treści

- [✨ Funkcje](#-funkcje)
- [🚀 Szybki start](#-szybki-start)
- [📁 Struktura projektu](#-struktura-projektu)
- [🎯 Sposób użytkowania](#-sposób-użytkowania)
- [🛠️ Funkcje zaawansowane](#️-funkcje-zaawansowane)
- [📱 Responsywność](#-responsywność)
- [🔧 Konfiguracja](#-konfiguracja)
- [📊 Kategorie słownictwa](#-kategorie-słownictwa)
- [🎓 System quizów](#-system-quizów)
- [💾 Przechowywanie danych](#-przechowywanie-danych)
- [🎨 Personalizacja](#-personalizacja)
- [🔍 Debugowanie](#-debugowanie)
- [🤝 Wsparcie](#-wsparcie)

---

## ✨ Funkcje

### 🎯 Podstawowe funkcje
- **1600+ słów** w 32 tematycznych kategoriach
- **Tryb fiszek** z animowanymi kartami 3D
- **Tryb przykładów zdań** do nauki w kontekście
- **System quizów** z wieloma poziomami trudności
- **Audio z wymową** (Text-to-Speech + API zewnętrzne)
- **Obrazki do słów** (upload i zarządzanie)

### 🧠 Zaawansowane funkcje
- **Inteligentny system postępu** ze statystykami
- **Adaptacyjne quizy** dostosowujące się do użytkownika
- **Ulubione słowa** i oznaczanie trudności
- **Export/Import danych** z backup'ami
- **Tryb offline** (PWA ready)
- **Ciemny/jasny motyw** + tryb automatyczny

### 📊 Analityka i postęp
- **Szczegółowe statystyki** nauki
- **Pasek postępu** dla każdej kategorii
- **System nagród** i osiągnięć
- **Analiza błędów** w quizach
- **Śledzenie czasu nauki**

### 🎨 Interfejs użytkownika
- **Nowoczesny design** z Glass Morphism
- **Płynne animacje** i przejścia
- **Responsywny layout** (mobile-first)
- **Dostępność** (a11y compliance)
- **Intuicyjna nawigacja**

---

## 🚀 Szybki start

### Dla użytkowników końcowych

1. **Pobierz pliki aplikacji** na swój komputer
2. **Otwórz plik `index.html`** w przeglądarce internetowej
3. **Gotowe!** Aplikacja działa lokalnie bez instalacji

### Wymagania systemowe
- **Przeglądarka:** Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **JavaScript:** Musi być włączony
- **Miejsce na dysku:** ~50MB dla pełnych danych
- **Połączenie internetowe:** Opcjonalne (dla audio z API)

### Pierwsza konfiguracja

1. **Wybierz kategorię** z dostępnych 32 opcji
2. **Ustaw preferencje** w menu ustawień (⚙️)
3. **Rozpocznij naukę** od trybu fiszek
4. **Wypróbuj quizy** po opanowaniu kategorii

---

## 📁 Struktura projektu

```
english-flashcards-b1-b2/
├── 📄 index.html                 # Główny plik aplikacji
├── 📄 README.md                  # Ta instrukcja
├── 📄 LICENSE                    # Licencja MIT
│
├── 📁 css/                       # Style CSS
│   ├── 📄 main.css               # Główne style z CSS Variables
│   ├── 📄 themes.css             # Motywy kolorystyczne
│   ├── 📄 components.css         # Style komponentów
│   └── 📄 responsive.css         # Media queries
│
├── 📁 js/                        # Kod JavaScript
│   ├── 📄 app.js                 # Główna aplikacja
│   ├── 📁 modules/               # Moduły aplikacji
│   │   ├── 📄 flashcard-manager.js
│   │   ├── 📄 quiz-manager.js
│   │   ├── 📄 audio-manager.js
│   │   ├── 📄 image-manager.js
│   │   ├── 📄 progress-manager.js
│   │   ├── 📄 theme-manager.js
│   │   └── 📄 data-loader.js
│   ├── 📁 utils/                 # Narzędzia pomocnicze
│   │   ├── 📄 utils.js
│   │   ├── 📄 notification-manager.js
│   │   └── 📄 storage-manager.js
│   └── 📁 config/                # Konfiguracja
│       └── 📄 constants.js
│
├── 📁 data/                      # Dane aplikacji
│   ├── 📄 vocabulary.json        # Kompletne słownictwo (1600+ słów)
│   └── 📄 categories.json        # Definicje kategorii
│
├── 📁 assets/                    # Zasoby statyczne
│   ├── 📁 icons/                 # Ikony aplikacji
│   ├── 📁 images/                # Obrazki
│   └── 📁 fonts/                 # Czcionki (opcjonalne)
│
└── 📁 docs/                      # Dokumentacja
    ├── 📄 user-manual.md         # Szczegółowa instrukcja
    └── 📄 developer-guide.md     # Przewodnik dla deweloperów
```

---

## 🎯 Sposób użytkowania

### 🃏 Tryb fiszek

1. **Wybierz kategorię** z dostępnych opcji
2. **Kliknij kartę** lub naciśnij spację, aby ją obrócić
3. **Nawiguj** strzałkami lub przyciskami ← / →
4. **Dodaj obrazek** klikając ikonę 📷
5. **Posłuchaj wymowy** przyciskiem 🔊

**Skróty klawiszowe:**
- `Spacja` - obróć kartę
- `←` - poprzednia karta
- `→` - następna karta
- `Esc` - zamknij modalne okna

### 🎯 Tryb quizów

#### Quizy kategorii (15 pytań, zalicz 12)
1. **Wybierz kategorię** do quizu
2. **Odpowiadaj na pytania** wybierając lub wpisując odpowiedzi
3. **Otrzymaj feedback** po każdej odpowiedzi
4. **Zobacz wyniki** i analizę błędów

#### Quiz losowy (20 pytań)
- Zawsze dostępny
- Słowa z wszystkich kategorii
- Zmienne poziomy trudności

#### Quiz trudnych słów (15 pytań)
- Odblokowany po 5 ukończonych quizach
- Słowa z najgorszymi wynikami
- Pomaga skupić się na problemach

#### Quiz końcowy (50 pytań, zalicz 42)
- Odblokowany po ukończeniu 75% kategorii
- Kompleksowy test wiedzy
- Różne typy pytań

### 💬 Tryb przykładów zdań

1. **Przód karty:** Angielskie zdanie z podświetlonym słowem
2. **Tył karty:** Polskie tłumaczenie + szczegóły słowa
3. **Kontekst:** Pomaga zrozumieć użycie w praktyce

---

## 🛠️ Funkcje zaawansowane

### 📊 System statystyk

**Globalne statystyki:**
- Łączna liczba przejrzanych kart
- Dni nauki z rzędu (streak)
- Średni wynik quizów
- Ulubiona kategoria
- Procent ukończenia

**Statystyki kategorii:**
- Postęp dla każdej kategorii
- Czas ostatniego dostępu
- Liczba ukończonych quizów
- Najgorsze słowa

### 🖼️ Zarządzanie obrazkami

**Dodawanie obrazków:**
1. Kliknij przycisk 📷 na karcie
2. Przeciągnij plik lub kliknij, aby wybrać
3. Obrazek zostanie automatycznie przeskalowany
4. Obsługiwane formaty: JPG, PNG, GIF, WebP

**Funkcje:**
- Automatyczna kompresja
- Drag & drop
- Podgląd przed zapisem
- Zarządzanie wszystkimi obrazkami
- Czyszczenie starych plików

### 🎵 System audio

**Opcje audio:**
- Text-to-Speech (wbudowany w przeglądarkę)
- Google Translate TTS (backup)
- Automatyczne odtwarzanie (opcjonalne)
- Regulacja głośności
- Cache audio dla lepszej wydajności

### 📱 Tryb offline (PWA)

**Funkcje offline:**
- Wszystkie dane przechowywane lokalnie
- Działanie bez internetu
- Instalacja jako aplikacja (PWA)
- Synchronizacja po połączeniu

---

## 📱 Responsywność

### 📱 Mobile (do 768px)
- Optymalizowany układ dla telefonów
- Dotykowe gesty
- Większe przyciski
- Zoptymalizowane menu

### 🖥️ Tablet (768px - 1024px)
- Dwukolumnowy layout
- Większe karty
- Dotykowa nawigacja

### 🖥️ Desktop (1024px+)
- Pełny interfejs
- Skróty klawiszowe
- Hover effects
- Wielokolumnowy layout

---

## 🔧 Konfiguracja

### ⚙️ Ustawienia aplikacji

**Dostęp:** Kliknij ikonę ⚙️ w górnym pasku

**Opcje audio:**
- ✅ Automatyczne audio przy obróceniu karty
- 🔊 Poziom głośności
- 🗣️ Preferowany głos TTS

**Opcje wyświetlania:**
- 📱 Pokaż fonetykę (transkrypcja IPA)
- 🎨 Motyw kolorystyczny (jasny/ciemny/auto)
- 📏 Rozmiar czcionki

**Opcje quizów:**
- 🎯 Poziom trudności (łatwy/średni/trudny)
- 🔄 Kierunek tłumaczenia (EN→PL, PL→EN, mieszany)
- ⏱️ Limit czasu na odpowiedź

### 💾 Zarządzanie danymi

**Export danych:**
1. Ustawienia → "Eksportuj dane"
2. Zapisz plik JSON na dysku
3. Zawiera: postęp, ustawienia, obrazki

**Import danych:**
1. Ustawienia → "Importuj dane"
2. Wybierz plik JSON
3. Potwierdź zastąpienie danych

**Reset danych:**
- ⚠️ Usuwa wszystkie dane lokalnie
- Przywraca ustawienia domyślne
- Nie da się cofnąć!

---

## 📊 Kategorie słownictwa

### 👤 Wygląd i cechy osobowe
1. **Build and Appearance** - Budowa ciała i wygląd (50 słów)
2. **Personality** - Cechy charakteru (50 słów)
3. **Age** - Wiek i okresy życia (50 słów)

### 👔 Ubrania i styl
4. **Clothes** - Ubrania i dodatki (50 słów)

### 😊 Emocje i komunikacja
5. **Feelings and Emotions** - Uczucia i emocje (50 słów)
6. **Body Language and Gestures** - Mowa ciała (50 słów)

### 👨‍👩‍👧‍👦 Relacje społeczne
7. **Family** - Rodzina (50 słów)
8. **Friends and Relations** - Przyjaciele i znajomi (50 słów)
9. **Celebrations and Special Occasions** - Święta (50 słów)

### 🏠 Dom i życie codzienne
10. **Housing and Living** - Mieszkanie (50 słów)
11. **Problems Around the House** - Problemy domowe (50 słów)
12. **In the House** - Wnętrza domu (50 słów)
13. **Daily Activities** - Codzienne czynności (50 słów)

### 🎯 Hobby i rozrywka
14. **Hobbies and Leisure** - Hobby i czas wolny (50 słów)

### 🛍️ Zakupy i jedzenie
15. **Shopping** - Zakupy (50 słów)
16. **Talking About Food** - Rozmowy o jedzeniu (50 słów)
17. **Food Preparation** - Przygotowywanie jedzenia (50 słów)
18. **Eating In** - Jedzenie w domu (50 słów)
19. **Eating Out** - Restauracje (50 słów)
20. **Drinking** - Napoje (50 słów)

### 🚗 Transport i podróże
21. **On the Road** - Na drodze (50 słów)
22. **Driving** - Prowadzenie pojazdu (50 słów)
23. **Traveling and Means of Transport** - Podróżowanie (50 słów)
24. **Holidays** - Wakacje (50 słów)

### 🏥 Zdrowie
25. **Health Problems** - Problemy zdrowotne (50 słów)
26. **At the Doctor's** - U lekarza (50 słów)
27. **In Hospital** - W szpitalu (50 słów)

### 🎓 Edukacja i praca
28. **Education** - Edukacja (50 słów)
29. **Looking for a Job** - Poszukiwanie pracy (50 słów)
30. **Work and Career** - Praca i kariera (50 słów)

### 📺 Media i rozrywka
31. **Film and Cinema** - Film i kino (50 słów)
32. **Books** - Książki (50 słów)
33. **Music** - Muzyka (50 słów)
34. **Television** - Telewizja (50 słów)
35. **Computers and the Internet** - Komputery (50 słów)
36. **Newspapers and Magazines** - Prasa (50 słów)

### 🌍 Świat przyrody
37. **The Weather** - Pogoda (50 słów)
38. **Natural World** - Świat przyrody (50 słów)

---

## 🎓 System quizów

### 📝 Typy pytań

**1. Wybór wielokrotny (Multiple Choice)**
- 4 opcje do wyboru
- Jedna poprawna odpowiedź
- Automatyczne przejście po wyborze
- Najczęściej używany typ

**2. Wpisywanie odpowiedzi (Text Input)**
- Wpisanie tłumaczenia słowa
- Tolerancja na małe błędy pisowni
- Sprawdzanie synonimów
- Bardziej wymagający

**3. Tłumaczenie zdań (Sentence Translation)**
- Tłumaczenie całego zdania
- Elastyczne sprawdzanie poprawności
- Ocena kontekstu
- Tylko w trudniejszych quizach

### 🎯 Poziomy trudności

**Łatwy:**
- 80% pytań wielokrotnych
- 20% wpisywania
- Podstawowe słownictwo
- Więcej czasu na odpowiedź

**Średni:**
- 60% pytań wielokrotnych  
- 40% wpisywania
- Mieszane słownictwo
- Standardowy czas

**Trudny:**
- 40% pytań wielokrotnych
- 40% wpisywania
- 20% tłumaczenia zdań
- Mniej czasu, trudniejsze słowa

### 📊 System punktacji

**Kategorie (15 pytań):**
- Próg zaliczenia: 12/15 (80%)
- Maksymalnie 3 błędy
- Można powtarzać bez limitu

**Quiz losowy (20 pytań):**
- Próg zaliczenia: 14/20 (70%)
- Różne kategorie
- Adaptacyjny poziom

**Trudne słowa (15 pytań):**
- Próg zaliczenia: 9/15 (60%)
- Słowa z najgorszymi wynikami
- Wymaga minimum 5 ukończonych quizów

**Quiz końcowy (50 pytań):**
- Próg zaliczenia: 42/50 (84%)
- Wymaga 75% ukończonych kategorii
- Limit czasu: 60 minut

---

## 💾 Przechowywanie danych

### 🗄️ LocalStorage

**Dane użytkownika:**
```javascript
// Postęp nauki
'english-flashcards-progress'

// Wyniki quizów  
'english-flashcards-quiz-results'

// Ustawienia aplikacji
'english-flashcards-settings'

// Stan aplikacji
'english-flashcards-state'

// Obrazki użytkownika
'english-flashcards-images'

// Ulubione słowa
'english-flashcards-bookmarks'

// Poziomy trudności
'english-flashcards-difficulty'
```

### 📊 Struktura danych

**Przykład postępu:**
```json
{
  "studiedCards": ["build_and_appearance-0", "build_and_appearance-1"],
  "studyDates": ["2025-01-22", "2025-01-23"],
  "categoryStats": {
    "build_and_appearance": {
      "studied": 25,
      "total": 50,
      "lastAccess": "2025-01-22T10:30:00Z"
    }
  },
  "version": "1.0.0"
}
```

### 🔒 Bezpieczeństwo

- Wszystkie dane przechowywane lokalnie
- Brak wysyłania danych na serwery
- Opcjonalny eksport/import
- Szyfrowanie nie jest wymagane (dane niekrytyczne)

---

## 🎨 Personalizacja

### 🌈 Motywy kolorystyczne

**Jasny motyw:**
- Białe tło z gradientami
- Ciemny tekst
- Kolorowe akcenty
- Optymalizowany na dzień

**Ciemny motyw:**
- Ciemne tło
- Jasny tekst  
- Przytłumione kolory
- Oszczędza baterię

**Automatyczny:**
- Podąża za ustawieniami systemu
- Przełącza się o wschodzie/zachodzie
- Dostosowuje się do preferencji użytkownika

### 🖼️ Dostosowywanie

**Rozmiary fontów:**
- Mały, średni, duży
- Dynamiczne skalowanie
- Zachowanie proporcji

**Kolory akcentów:**
- Niebieski (domyślny)
- Zielony, czerwony, fioletowy
- Dostosowanie do preferencji

**Animacje:**
- Pełne animacje (domyślne)
- Ograniczone animacje
- Bez animacji (accessibility)

---

## 🔍 Debugowanie

### 🐛 Częste problemy

**Aplikacja nie ładuje się:**
1. Sprawdź czy JavaScript jest włączony
2. Otwórz konsolę deweloperską (F12)
3. Sprawdź błędy w konsoli
4. Upewnij się, że wszystkie pliki są present

**Brak audio:**
1. Sprawdź czy przeglądarka obsługuje Web Speech API
2. Sprawdź połączenie internetowe (dla external API)
3. Sprawdź ustawienia audio w aplikacji
4. Spróbuj w innej przeglądarce

**Problemy z obrazkami:**
1. Sprawdź format pliku (JPG, PNG, GIF, WebP)
2. Sprawdź rozmiar pliku (max 5MB)
3. Wyczyść dane aplikacji i spróbuj ponownie
4. Sprawdź dostępną przestrzeń w localStorage

**Quizy nie działają:**
1. Sprawdź czy dane słownictwa się załadowały
2. Sprawdź console na błędy JavaScript
3. Zresetuj postęp quiz w ustawieniach
4. Przeładuj aplikację

### 🛠️ Narzędzia deweloperskie

**Konsola przeglądarki (F12):**
```javascript
// Sprawdź stan aplikacji
console.log(window.englishFlashcardsApp.state);

// Sprawdź postęp
console.log(localStorage.getItem('english-flashcards-progress'));

// Wyczyść dane
localStorage.clear();

// Sprawdź loaded vocabulary
console.log(window.englishFlashcardsApp.state.vocabulary);
```

**Useful commands:**
```javascript
// Force theme change
window.englishFlashcardsApp.managers.theme.setTheme('dark');

// Show notification
NotificationManager.show('Test message', 'success');

// Clear all quiz results
localStorage.removeItem('english-flashcards-quiz-results');
```

---

## 🤝 Wsparcie

### 📞 Kontakt i pomoc

**Problemy techniczne:**
- Sprawdź sekcję [Debugowanie](#-debugowanie)
- Otwórz issue na GitHubie
- Wyślij email z opisem problemu

**Propozycje usprawnień:**
- Opisz dokładnie czego potrzebujesz
- Wyjaśnij case użycia
- Załącz screenshoty jeśli to pomoże

**Raportowanie błędów:**
1. Opisz kroki reprodukcji
2. Podaj szczegóły przeglądarki/systemu
3. Załącz screenshot konsoli (F12)
4. Opisz oczekiwane vs rzeczywiste zachowanie

### 🔄 Aktualizacje

**Sprawdzanie wersji:**
- Aktualna wersja: v1.0.0
- Data wydania: 2025-01-22
- Sprawdź metadane w vocabulary.json

**Instalacja aktualizacji:**
1. Pobierz nową wersję
2. Wykonaj backup danych (Export)
3. Zastąp stare pliki nowymi
4. Zaimportuj dane jeśli potrzeba

### 📚 Dodatkowe zasoby

**Nauka języka angielskiego:**
- [Cambridge English Online](https://www.cambridge.org/english/)
- [BBC Learning English](https://www.bbc.co.uk/learningenglish/)
- [British Council](https://learnenglish.britishcouncil.org/)

**Dodatkowe słownictwo:**
- Oxford 3000 Word List
- CEFR B1/B2 Vocabulary Lists
- Academic Word List (AWL)

---

## 📄 Licencja

Projekt udostępniony na licencji **MIT License**.

```
Copyright (c) 2025 English Flashcards B1/B2

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🎉 Gotowe do nauki!

**Gratulacje!** Masz teraz dostęp do kompletnej aplikacji do nauki angielskiego B1/B2. 

**Następne kroki:**
1. ✅ Otwórz `index.html` w przeglądarce
2. ✅ Wybierz pierwszą kategorię
3. ✅ Zacznij od trybu fiszek
4. ✅ Przetestuj quizy
5. ✅ Ustaw preferencje w ustawieniach

**Powodzenia w nauce języka angielskiego!** 🇬🇧📚✨

---

*Ostatnia aktualizacja: 22 czerwca 2025*