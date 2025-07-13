/**
 * POPRAWIONY SentenceFlashcardManager - sentence-flashcard-manager.js
 * Integracja z głównym systemem wyświetlania kart
 */

import FlashcardTemplates from '../flashcard/templates.js';
import DOMHelper from '../flashcard/dom-helper.js';
import SentenceSearch from './sentence-search.js';

class SentenceFlashcardManager {
    constructor() {
        this.vocabulary = null;
        this.sentenceWords = []; // Słowa z przykładami zdań
        this.originalSentenceWords = [];
        this.currentWordIndex = 0;
        this.currentSentenceIndex = 0;
        this.currentWord = null;
        this.currentSentence = null;
        this.isFlipped = false;
        
        // Managery
        this.audioManager = null;
        this.progressManager = null;
        this.imageManager = null;

        this.searchInstance = new SentenceSearch();
        this.isSearchActive = false;
        this.currentSearchTerm = '';
        
        // 🎯 ZMIANA: Użyj głównych kontenerów aplikacji zamiast tworzenia własnych
        this.frontContainer = null;
        this.backContainer = null;
        
        // Ustawienia
        this.settings = {
            autoPlayAudio: false,
            showPhonetics: true,
            highlightMainWord: true,
            showContext: true
        };
        
        console.log('🎯 SentenceFlashcardManager zainicjalizowany');
    }

    /**
     * 🚀 Inicjalizacja managera z aktualizacją progress bara na końcu
     */
    async init(vocabulary, managers = {}) {
        try {
            console.log('🎯 Inicjalizowanie SentenceFlashcardManager...');
            
            this.vocabulary = vocabulary;
            this.audioManager = managers.audio;
            this.progressManager = managers.progress;
            this.imageManager = managers.image;
            
            // Użyj głównych kontenerów aplikacji
            this.setupMainContainers();
            
            // Przefiltruj słowa z przykładami zdań
            this.filterWordsWithSentences();
            
            // Zapisz oryginalną listę słów dla wyszukiwarki
            this.originalSentenceWords = [...this.sentenceWords];
            console.log(`📋 Zapisano ${this.originalSentenceWords.length} słów jako backup dla wyszukiwarki`);
            
            // Inicjalizacja wyszukiwarki (bez UI - UI tworzone osobno)
            this.initializeSearch();
            
            // Załaduj pierwsze słowo jeśli są dostępne
            if (this.sentenceWords.length > 0) {
                this.loadWord(0);
                
                // 🎯 WYWOŁANIE: Aktualizuj progress bar po inicjalizacji
                this.updateProgressBar();
            } else {
                console.warn('⚠️ Brak słów z przykładami zdań');
                return false;
            }
            
            console.log(`✅ SentenceFlashcardManager zainicjalizowany - ${this.sentenceWords.length} słów z przykładami`);
            return true;
            
        } catch (error) {
            console.error('❌ Błąd inicjalizacji SentenceFlashcardManager:', error);
            return false;
        }
    }

    /**
     * 🎯 NOWE: Konfiguracja głównych kontenerów aplikacji
     */
    setupMainContainers() {
        this.frontContainer = document.getElementById('card-front');
        this.backContainer = document.getElementById('card-back');
        
        if (!this.frontContainer || !this.backContainer) {
            console.error('❌ Nie znaleziono głównych kontenerów kart aplikacji');
            throw new Error('Brak głównych kontenerów kart');
        }
        
        console.log('✅ Skonfigurowano główne kontenery aplikacji dla trybu zdaniowego');
    }

    /**
     * 🔍 Filtrowanie słów z przykładami zdań
     */
    filterWordsWithSentences() {
        this.sentenceWords = [];
        
        if (!this.vocabulary?.categories) {
            console.warn('⚠️ Brak danych słownictwa');
            return;
        }
        
        Object.values(this.vocabulary.categories).forEach(category => {
            if (category.words) {
                category.words.forEach(word => {
                    // 🎯 POPRAWKA: Sprawdź różne formaty przykładów
                    let examples = [];
                    
                    // Format 1: examples jako array obiektów
                    if (word.examples && Array.isArray(word.examples) && word.examples.length > 0) {
                        examples = word.examples;
                    }
                    // Format 2: examples jako pojedynczy obiekt
                    else if (word.examples && typeof word.examples === 'object' && word.examples.english) {
                        examples = [word.examples];
                    }
                    
                    // Dodaj słowa z przykładami
                    if (examples.length > 0) {
                        examples.forEach((example, index) => {
                            this.sentenceWords.push({
                                ...word,
                                sentenceData: example,
                                sentenceIndex: index,
                                totalSentences: examples.length,
                                categoryName: category.name,
                                wordKey: `${word.english}_${index}`
                            });
                        });
                    }
                });
            }
        });
        
        console.log(`🔍 Znaleziono ${this.sentenceWords.length} zdań do nauki`);
        
        // 🎯 Debug: Pokaż przykłady znalezionych zdań
        if (this.sentenceWords.length > 0) {
            console.log('📋 Przykłady znalezionych zdań:');
            this.sentenceWords.slice(0, 3).forEach((word, i) => {
                console.log(`  ${i + 1}. "${word.sentenceData.english}" → "${word.sentenceData.polish}"`);
            });
        }
    }

    /**
     * 📚 Ładowanie słowa z opcjonalną aktualizacją progress bara
     */
    loadWord(index, updateProgress = false) {
        if (index < 0 || index >= this.sentenceWords.length) {
            console.warn('⚠️ Nieprawidłowy indeks słowa:', index);
            return false;
        }
        
        this.currentWordIndex = index;
        this.currentWord = this.sentenceWords[index];
        this.currentSentence = this.currentWord.sentenceData;
        this.isFlipped = false;
        
        console.log(`📚 Ładowanie zdania: "${this.currentSentence.english}"`);
        
        // Renderuj do głównych kontenerów aplikacji
        this.renderToMainContainers();
        
        // 🎯 OPCJONALNE WYWOŁANIE: Aktualizuj progress bar jeśli requested
        if (updateProgress) {
            this.updateProgressBar();
        }
        
        return true;
    }

    // ========================================
    // NOWE METODY WYSZUKIWARKI
    // ========================================

    /**
     * 🔍 Inicjalizacja wyszukiwarki zdań
     */
    initializeSearch() {
        console.log('🔍 Inicjalizuję wyszukiwarkę zdań...');
        
        // Tworzenie UI zostanie wywołane osobno przez app.js
        // Tutaj tylko przygotowujemy dane
        
        console.log('✅ Wyszukiwarka zdań zainicjalizowana (bez UI)');
    }

    /**
     * 🔍 Tworzenie UI wyszukiwarki jako osobny element NAD fiszką
     * ZMIANA: Dodano lepsze bindowanie event listenerów dla przycisku X
     */
    createSearchUI() {
        console.log('🔍 Tworzę UI wyszukiwarki nad fiszką...');
        
        // Usuń istniejącą wyszukiwarkę jeśli istnieje
        this.removeSearchUI();
        
        // Znajdź kontener fiszki
        const flashcardContainer = document.getElementById('flashcard-container');
        if (!flashcardContainer) {
            console.error('❌ Nie znaleziono kontenera fiszki');
            return false;
        }
        
        // Utwórz kontener wyszukiwarki
        const searchContainer = document.createElement('div');
        searchContainer.id = 'sentence-search-ui';
        searchContainer.className = 'sentence-search-container';
        searchContainer.innerHTML = this.renderSearchInput();
        
        // Wstaw PRZED kontenerem fiszki
        flashcardContainer.parentNode.insertBefore(searchContainer, flashcardContainer);
        
        // Podłącz event listenery z obsługą przycisku X
        setTimeout(() => {
            const searchInput = document.getElementById('sentence-search-input');
            if (searchInput) {
                this.attachSearchListener(searchInput);
                
                // Ustaw początkową widoczność przycisku X
                this.updateClearButtonVisibility(this.currentSearchTerm.length > 0);
                
                console.log('✅ Wyszukiwarka zdań utworzona nad fiszką z przyciskiem X');
            }
        }, 0);
        
        return true;
    }

    /**
     * 🗑️ Usuwanie UI wyszukiwarki
     * POPRAWKA: Lepsze czyszczenie globalnych referencji
     */
    removeSearchUI() {
        const existingSearch = document.getElementById('sentence-search-ui');
        if (existingSearch) {
            existingSearch.remove();
            console.log('🗑️ Usunięto istniejącą wyszukiwarkę');
        }
        
        // Wyczyść globalną funkcję clearSearchInput
        if (window.clearSearchInput) {
            delete window.clearSearchInput;
            console.log('🗑️ Usunięto globalną funkcję clearSearchInput');
        }
    }


    /**
     * 🔍 Setup event listenera dla wyszukiwania
     */
    setupSearchEventListener() {
        // Event listener będzie dodany po wyrenderowaniu search input w UI
        // Sprawdź czy element już istnieje
        const searchInput = document.getElementById('sentence-search-input');
        if (searchInput) {
            this.attachSearchListener(searchInput);
        }
    }

    /**
     * 🔍 Dodanie event listenera do search input
     * POPRAWKA: Lepsze zarządzanie globalną funkcją clearSearchInput
     */
    attachSearchListener(searchInput) {
        if (!searchInput) return;
        
        // Usuń stary listener jeśli istnieje
        if (searchInput._sentenceSearchHandler) {
            searchInput.removeEventListener('input', searchInput._sentenceSearchHandler);
        }
        
        // Przechowaj referencję do instancji dla globalnej funkcji
        const managerInstance = this;
        
        // Dodaj nowy listener z debounce
        searchInput._sentenceSearchHandler = (e) => {
            const searchTerm = e.target.value;
            
            // Aktualizuj widoczność przycisku X
            managerInstance.updateClearButtonVisibility(searchTerm.length > 0);
            
            // Wykonaj wyszukiwanie
            managerInstance.performSearch(searchTerm);
        };
        
        // Event listener dla input
        searchInput.addEventListener('input', searchInput._sentenceSearchHandler);
        
        // Event listener dla focusa - pokaż przycisk X jeśli jest tekst
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length > 0) {
                managerInstance.updateClearButtonVisibility(true);
            }
        });
        
        // Ustaw globalną funkcję clearSearchInput wskazującą na tę instancję
        window.clearSearchInput = () => {
            managerInstance.clearSearchInput();
        };
        
        console.log('🔍 Event listener wyszukiwarki zdań podłączony z globalna funkcją clearSearchInput');
    }

    /**
     * 🔍 Wykonanie wyszukiwania z debounce
     */
    performSearch(searchTerm) {
        this.currentSearchTerm = searchTerm.trim();
        this.isSearchActive = this.currentSearchTerm.length > 0;
        
        // Użyj wyszukiwarki z debounce
        this.searchInstance.search(
            searchTerm,
            this.originalSentenceWords, // Zawsze przeszukuj pełną listę
            (results, term) => this.handleSearchResults(results, term),
            300 // 300ms debounce jak w bookmarks
        );
    }

    /**
     * 🔍 Obsługa wyników wyszukiwania
     * ZMIANA: Dodano ukrywanie/pokazywanie komunikatów i fiszki
     */
    handleSearchResults(results, searchTerm) {
        console.log(`🔍 Otrzymano ${results.length} wyników dla: "${searchTerm}"`);
        
        // Aktualizuj listę słów
        this.sentenceWords = results;
        
        // Reset indeksu i załaduj pierwsze słowo jeśli są wyniki
        if (this.sentenceWords.length > 0) {
            // 🎯 NOWE: Ukryj komunikaty o braku wyników i pokaż fiszkę
            this.hideNoResultsMessage();
            this.showFlashcardAndHideMainMessage();
            
            this.currentWordIndex = 0;
            this.loadWord(0);
            
            // Aktualizuj licznik wyników w UI
            this.updateSearchResultsCounter(results.length, searchTerm);
        } else {
            // Brak wyników - ukryj fiszkę i pokaż komunikaty
            this.showNoResultsMessage(searchTerm);
        }
        
        // Aktualizuj progress bar po wyszukiwaniu
        this.updateProgressBar();
    }


    /**
     * 🔍 Ukryj komunikat o braku wyników i pokaż fiszkę
     * NOWA FUNKCJA: Przywraca normalny widok fiszki i usuwa komunikaty
     */
    hideNoResultsMessage() {
        // 1. Usuń komunikat pod wyszukiwarką
        const searchContainer = document.getElementById('sentence-search-ui');
        if (searchContainer) {
            const messageContainer = searchContainer.querySelector('.search-message-container');
            if (messageContainer) {
                messageContainer.remove();
                console.log('🗑️ Usunięto komunikat pod wyszukiwarką');
            }
        }
        
        // 2. Ukryj główny komunikat i pokaż fiszkę
        this.showFlashcardAndHideMainMessage();
    }

    /**
    * 🔍 Pokaż fiszkę i ukryj główny komunikat
    * NOWA FUNKCJA: Przywraca widoczność fiszki i ukrywa komunikat zastępujący
    */
    showFlashcardAndHideMainMessage() {
        // 1. Pokaż kontener fiszki
        const flashcardContainer = document.getElementById('flashcard-container');
        if (flashcardContainer) {
            flashcardContainer.style.display = 'block';
            console.log('👁️ Pokazano kontener fiszki');
        }
        
        // 2. Ukryj główny komunikat
        const noResultsContainer = document.getElementById('sentence-no-results-main');
        if (noResultsContainer) {
            noResultsContainer.style.display = 'none';
            console.log('🙈 Ukryto główny komunikat');
        }
    }

    /**
     * 🔍 Aktualizacja licznika wyników wyszukiwania
     */
    updateSearchResultsCounter(count, searchTerm) {
        const counterEl = document.getElementById('sentence-search-results-counter');
        if (counterEl) {
            if (searchTerm.trim().length === 0) {
                counterEl.textContent = `Wszystkie zdania: ${count}`;
                counterEl.className = 'search-results-counter';
            } else {
                counterEl.textContent = `Znaleziono: ${count} zdań`;
                counterEl.className = count > 0 ? 'search-results-counter has-results' : 'search-results-counter no-results';
            }
        }
    }

    /**
     * 🔍 Pokaż komunikat braku wyników - fiszka ZNIKA, komunikat na jej miejscu
     * NOWA FUNKCJA: Implementuje dwupoziomowe komunikaty (pod wyszukiwarką + zamiast fiszki)
     */
    showNoResultsMessage(searchTerm) {
        console.log(`❌ Brak wyników dla: "${searchTerm}"`);
        
        // 1. Aktualizuj licznik wyników na "no-results"
        this.updateSearchResultsCounter(0, searchTerm);
        
        // 2. Dodaj mały komunikat POD WYSZUKIWARKĄ
        this.addSearchMessage(searchTerm);
        
        // 3. UKRYJ FISZKĘ i pokaż komunikat NA JEJ MIEJSCU
        this.hideFlashcardAndShowMainMessage(searchTerm);
        
        console.log('✅ Komunikat o braku wyników: pod wyszukiwarką + na miejscu fiszki');
    }

    /**
     * 🔍 Dodaj mały komunikat pod wyszukiwarką
     * NOWA FUNKCJA: Tworzy subtelny komunikat pod paskiem wyszukiwania
     */
    addSearchMessage(searchTerm) {
        const searchContainer = document.getElementById('sentence-search-ui');
        if (!searchContainer) {
            console.error('❌ Nie znaleziono kontenera wyszukiwarki');
            return;
        }
        
        // Usuń poprzedni komunikat jeśli istnieje
        const existingMessage = searchContainer.querySelector('.search-message-container');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Utwórz mały komunikat
        const messageContainer = document.createElement('div');
        messageContainer.className = 'search-message-container';
        messageContainer.innerHTML = `
            <div class="search-no-results-info">
                🔍 Brak wyników dla: "<strong>${searchTerm}</strong>" 
                <button class="btn-link search-clear-link" onclick="document.getElementById('sentence-search-input').value=''; document.getElementById('sentence-search-input').dispatchEvent(new Event('input'))" title="Wyczyść wyszukiwanie">
                    Wyczyść
                </button>
            </div>
        `;
        
        // Dodaj do kontenera wyszukiwarki
        searchContainer.appendChild(messageContainer);
    }

    /**
     * 🔍 Ukryj fiszkę i pokaż główny komunikat na jej miejscu
     * NOWA FUNKCJA: Ukrywa kontener fiszki i pokazuje duży komunikat z sugestiami
     */
    hideFlashcardAndShowMainMessage(searchTerm) {
        // 1. Ukryj kontener fiszki
        const flashcardContainer = document.getElementById('flashcard-container');
        if (flashcardContainer) {
            flashcardContainer.style.display = 'none';
            console.log('🙈 Ukryto kontener fiszki');
        }
        
        // 2. Znajdź lub utwórz kontener dla komunikatu głównego
        let noResultsContainer = document.getElementById('sentence-no-results-main');
        if (!noResultsContainer) {
            noResultsContainer = document.createElement('div');
            noResultsContainer.id = 'sentence-no-results-main';
            noResultsContainer.className = 'sentence-no-results-main';
            
            // Wstaw tam gdzie była fiszka
            if (flashcardContainer && flashcardContainer.parentNode) {
                flashcardContainer.parentNode.insertBefore(noResultsContainer, flashcardContainer.nextSibling);
            }
        }
        
        // 3. Pokaż główny komunikat
        noResultsContainer.style.display = 'block';
        noResultsContainer.innerHTML = `
            <div class="no-results-main-content">
                <div class="no-results-icon">🔍</div>
                <div class="search-term-display">"${searchTerm}"</div>
                <h2>Brak wyników wyszukiwania</h2>
                <p>Nie znaleziono zdań pasujących do zapytania:</p>
                
                
                <div class="search-suggestions">
                    <h3>💡 Spróbuj:</h3>
                    <ul>
                        <li>Sprawdzić pisownię</li>
                        <li>Użyć krótszych słów kluczowych</li>
                        <li>Wyszukać w języku polskim lub angielskim</li>
                        <li>Spróbować podobnych słów</li>
                    </ul>
                </div>
                
                <div class="no-results-actions">
                    <button class="btn primary search-clear-main-btn" onclick="document.getElementById('sentence-search-input').value=''; document.getElementById('sentence-search-input').dispatchEvent(new Event('input'))" title="Wyczyść wyszukiwanie i wróć do wszystkich zdań">
                        <span class="icon">🧹</span>
                        Wyczyść wyszukiwanie
                    </button>
                    <button class="btn secondary" onclick="window.englishFlashcardsApp.switchMode('flashcards')" title="Przełącz na tryb fiszek słownych">
                        <span class="icon">📚</span>
                        Wróć do fiszek słownych
                    </button>
                </div>
            </div>
        `;
        
        console.log('📋 Pokazano główny komunikat na miejscu fiszki');
    }

    /**
     * 🎯 Aktualizacja progress bara z głównej aplikacji
     */
    updateProgressBar() {
        // Dostęp do głównej aplikacji
        if (window.englishFlashcardsApp && typeof window.englishFlashcardsApp.updateProgress === 'function') {
            window.englishFlashcardsApp.updateProgress();
            console.log(`📊 Progress bar zaktualizowany: ${this.currentWordIndex + 1}/${this.sentenceWords.length}`);
        } else {
            console.warn('⚠️ Nie można zaktualizować progress bara - brak dostępu do głównej aplikacji');
        }
    }

    /**
     * 🧹 Czyszczenie pola input wyszukiwania
     * POPRAWKA: Dodane sprawdzanie istnienia elementów przed manipulacją
     */
    clearSearchInput() {
        console.log('🧹 Czyszczenie pola input przez przycisk X...');
        
        // Znajdź input wyszukiwania
        const searchInput = document.getElementById('sentence-search-input');
        if (!searchInput) {
            console.error('❌ Nie znaleziono pola input wyszukiwania');
            return;
        }
        
        // Wyczyść wartość input
        searchInput.value = '';
        
        // Ukryj przycisk X
        this.updateClearButtonVisibility(false);
        
        // Wywołaj event input aby uruchomić wyszukiwanie (pusty termin)
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true
        });
        searchInput.dispatchEvent(inputEvent);
        
        // Ustaw focus z powrotem na input (z małym opóźnieniem)
        setTimeout(() => {
            if (searchInput && document.contains(searchInput)) {
                searchInput.focus();
            }
        }, 100);
        
        console.log('✅ Pole input wyczyszczone przez przycisk X');
    }



    /**
     * 🎯 NOWE: Renderowanie do głównych kontenerów aplikacji
     */
    renderToMainContainers() {
        if (!this.frontContainer || !this.backContainer || !this.currentWord) {
            console.error('❌ Brak kontenerów lub danych do renderowania');
            return;
        }
        
        console.log(`🎯 Renderuję zdanie: "${this.currentSentence.english}"`);
        
        // 🧹 POPRAWKA: Bardziej kompleksowe czyszczenie
        console.log('🧹 Rozpoczynam kompleksowe czyszczenie...');
        
        // 1. Usuń wszystkie event listenery audio z całego dokumentu (jeśli są związane z tym managerem)
        const allAudioButtons = document.querySelectorAll('.audio-btn[data-audio-type]');
        allAudioButtons.forEach(btn => {
            if (btn._clickHandler) {
                btn.removeEventListener('click', btn._clickHandler);
                delete btn._clickHandler;
                console.log(`🗑️ Usunięto event listener z przycisku: ${btn.id}`);
            }
        });
        
        // 2. Wyczyść kontenery
        DOMHelper.clearContainer(this.frontContainer);
        DOMHelper.clearContainer(this.backContainer);
        console.log('🧹 Wyczyszczono kontenery');
        
        // 3. Dodaj klasę trybu zdaniowego
        const flashcardContainer = document.getElementById('flashcard-container');
        if (flashcardContainer) {
            flashcardContainer.classList.add('sentence-mode');
        }
        
        try {
            // 4. Zbuduj zawartość
            
            this.buildSentenceFront(this.frontContainer);
            this.buildSentenceBack(this.backContainer);
            
            // 5. Reset flip state
            const flashcard = document.getElementById('flashcard');
            if (flashcard) {
                flashcard.classList.remove('flipped');
            }
            
            console.log(`✅ Zdanie wyrenderowane pomyślnie z czystymi przyciskami`);
            
            // 6. DEBUGOWANIE: Policz ile przycisków audio jest teraz w DOM
            const currentAudioButtons = document.querySelectorAll('.audio-btn');
            console.log(`📊 Aktualna liczba przycisków audio w DOM: ${currentAudioButtons.length}`);
            
        } catch (error) {
            console.error('❌ Błąd renderowania zdania:', error);
            this.frontContainer.innerHTML = `
                <div class="error-message">
                    <h3>❌ Błąd ładowania zdania</h3>
                    <p>Nie można wyświetlić bieżącego zdania.</p>
                    <button onclick="window.englishFlashcardsApp.switchMode('flashcards')">
                        Wróć do fiszek
                    </button>
                </div>
            `;
        }
    }

    // ===== POPRAWKA 4: buildSentenceFront() - bez zakładek i trudności =====
    buildSentenceFront(container) {
        // 1. Nagłówek z trybem zdaniowym
        const headerEl = DOMHelper.createElement('div', 'sentence-mode-header');
        headerEl.innerHTML = `
            <div class="sentence-mode-indicator">
                <span class="icon">💬</span>
                <span class="text">Fiszka zdaniowa</span>
            </div>
            <div class="word-focus">
                Skupiamy się na słowie: <strong>${this.currentWord.english}</strong>
            </div>
        `;
        container.appendChild(headerEl);
        
        // 2. Główne zdanie angielskie
        const sentenceEl = DOMHelper.createElement('div', 'main-sentence-display');
        sentenceEl.textContent = this.currentSentence.english;
        container.appendChild(sentenceEl);
        
        // 3. Podświetl główne słowo w zdaniu
        if (this.settings.highlightMainWord) {
            this.highlightWordInSentence(sentenceEl, this.currentWord.english);
        }
        
        // 4. Kontekst i informacje
        const infoEl = DOMHelper.createElement('div', 'sentence-info');
        infoEl.innerHTML = `
            <div class="word-details">
                <span class="word-name">${this.currentWord.english}</span>
                <span class="word-type">[${this.currentWord.type}]</span>
                <span class="pronunciation">${this.currentWord.pronunciation || ''}</span>
            </div>
            <div class="context-info">
                Kontekst: ${this.getSentenceContextLabel()}
            </div>
        `;
        container.appendChild(infoEl);
        
        // 5. Przyciski audio (BEZ AUTO-PLAY)
        this.addAudioButtons(container, 'front');
        
        // 🚫 USUNIĘTE: Przyciski zakładek i trudności (nie są potrzebne w trybie zdaniowym)
        
        // 6. Instrukcja
        const instructionEl = DOMHelper.createElement('div', 'flip-instruction');
        instructionEl.innerHTML = `
            <span class="icon">💡</span>
            <span class="text">Kliknij aby zobaczyć tłumaczenie zdania</span>
        `;
        container.appendChild(instructionEl);
    }

    /**
     * 🏗️ Budowanie tyłu karty zdaniowej
     */
    buildSentenceBack(container) {
        // 1. Polskie tłumaczenie zdania
        const polishSentenceEl = DOMHelper.createElement('div', 'main-translation-display');
        polishSentenceEl.textContent = this.currentSentence.polish;
        container.appendChild(polishSentenceEl);
        
        // 2. Tłumaczenie słowa
        const wordTranslationEl = DOMHelper.createElement('div', 'word-translation');
        wordTranslationEl.innerHTML = `
            <div class="translation-pair">
                <span class="english">${this.currentWord.english}</span>
                <span class="arrow">→</span>
                <span class="polish">${this.currentWord.polish}</span>
            </div>
            <div class="word-meta">
                <span class="type">${this.currentWord.type}</span>
                ${this.currentWord.frequency ? `<span class="frequency">Częstość: ${this.getFrequencyLabel()}</span>` : ''}
            </div>
        `;
        container.appendChild(wordTranslationEl);
        
        // 3. Synonimy i antonimy (jeśli dostępne)
        if (this.currentWord.synonyms?.length > 0 || this.currentWord.antonyms?.length > 0) {
            const relatedEl = DOMHelper.createElement('div', 'related-words');
            
            if (this.currentWord.synonyms?.length > 0) {
                const synonymsEl = DOMHelper.createElement('div', 'synonyms');
                synonymsEl.innerHTML = `<span class="label">Synonimy:</span> <span class="words">${this.currentWord.synonyms.join(', ')}</span>`;
                relatedEl.appendChild(synonymsEl);
            }
            
            if (this.currentWord.antonyms?.length > 0) {
                const antonymsEl = DOMHelper.createElement('div', 'antonyms');
                antonymsEl.innerHTML = `<span class="label">Antonimy:</span> <span class="words">${this.currentWord.antonyms.join(', ')}</span>`;
                relatedEl.appendChild(antonymsEl);
            }
            
            container.appendChild(relatedEl);
        }
        
        // 4. Przyciski audio (BEZ AUTO-PLAY)
        this.addAudioButtons(container, 'back');
        
        // 🚫 USUNIĘTE: Przyciski kontroli (zakładki, trudności) - nie są potrzebne w trybie zdaniowym
        
        // 5. Informacja o pozostałych zdaniach
        if (this.currentWord.totalSentences > 1) {
            const moreExamplesEl = DOMHelper.createElement('div', 'more-examples-info');
            moreExamplesEl.innerHTML = `
                📚 To słowo ma <strong>${this.currentWord.totalSentences}</strong> przykładów zdań.
            `;
            container.appendChild(moreExamplesEl);
        }
    }

    /**
     * 🔍 Renderowanie search input HTML z przyciskiem X
     * POPRAWKA: Zmieniony onclick z this.clearSearchInput() na window.clearSearchInput()
     */
    renderSearchInput() {
        const resultCount = this.sentenceWords.length;
        const totalCount = this.originalSentenceWords.length;
        const hasSearchTerm = this.currentSearchTerm && this.currentSearchTerm.length > 0;
        
        return `
            <div class="search-input-wrapper">
                <input 
                    type="text" 
                    id="sentence-search-input" 
                    class="sentence-search-input" 
                    placeholder="🔍 Szukaj słów i zdań..."
                    value="${this.currentSearchTerm}"
                    autocomplete="off"
                    spellcheck="false"
                >
                <button 
                    class="search-clear-btn ${hasSearchTerm ? 'visible' : 'hidden'}" 
                    onclick="window.clearSearchInput()"
                    title="Wyczyść wyszukiwanie"
                    type="button"
                    aria-label="Wyczyść pole wyszukiwania"
                >
                    ✕
                </button>
            </div>
            <div id="sentence-search-results-counter" class="search-results-counter ${this.isSearchActive ? (resultCount > 0 ? 'has-results' : 'no-results') : ''}">
                ${this.isSearchActive ? `Znaleziono: ${resultCount} zdań` : `Wszystkie zdania: ${totalCount}`}
            </div>
        `;
    }

    /**
     * 🧹 Czyszczenie pola input wyszukiwania
     * NOWA FUNKCJA: Dedykowana funkcja dla przycisku X w input
     */
    clearSearchInput() {
        console.log('🧹 Czyszczenie pola input przez przycisk X...');
        
        // Znajdź input wyszukiwania
        const searchInput = document.getElementById('sentence-search-input');
        if (!searchInput) {
            console.error('❌ Nie znaleziono pola input wyszukiwania');
            return;
        }
        
        // Wyczyść wartość input
        searchInput.value = '';
        
        // Ukryj przycisk X
        this.updateClearButtonVisibility(false);
        
        // Wywołaj event input aby uruchomić wyszukiwanie (pusty termin)
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true
        });
        searchInput.dispatchEvent(inputEvent);
        
        // Ustaw focus z powrotem na input
        searchInput.focus();
        
        console.log('✅ Pole input wyczyszczone przez przycisk X');
    }

    /**
     * 🎯 Aktualizacja widoczności przycisku X
     * POPRAWKA: Dodane sprawdzanie istnienia elementu
     */
    updateClearButtonVisibility(show) {
        const clearBtn = document.querySelector('.search-clear-btn');
        if (!clearBtn) {
            console.warn('⚠️ Nie znaleziono przycisku clear w DOM');
            return;
        }
        
        if (show) {
            clearBtn.classList.remove('hidden');
            clearBtn.classList.add('visible');
            clearBtn.style.display = 'flex';
        } else {
            clearBtn.classList.remove('visible');
            clearBtn.classList.add('hidden');
            clearBtn.style.display = 'none';
        }
    }

    /**
     * 🔊 Dodawanie przycisków audio
     */
    addAudioButtons(container, side) {
        console.log(`🔊 Dodaję przyciski audio na stronie: ${side}`);
        
        // 🧹 POPRAWKA: Bardziej agresywne czyszczenie
        const existingAudioContainers = container.querySelectorAll('.audio-controls');
        existingAudioContainers.forEach(existingContainer => {
            // Usuń event listenery ze WSZYSTKICH starych przycisków
            const oldButtons = existingContainer.querySelectorAll('.audio-btn');
            oldButtons.forEach(btn => {
                if (btn._clickHandler) {
                    btn.removeEventListener('click', btn._clickHandler);
                    delete btn._clickHandler;
                }
                // Usuń wszystkie klasy animacji
                btn.classList.remove('btn-clicked', 'btn-playing', 'click-animation');
            });
            existingContainer.remove();
            console.log('🗑️ Usunięto stary kontener audio');
        });
        
        // 🧹 DODATKOWE CZYSZCZENIE: usuń wszystkie audio przyciski które mogły zostać
        const orphanButtons = container.querySelectorAll('.audio-btn');
        orphanButtons.forEach(btn => {
            if (btn._clickHandler) {
                btn.removeEventListener('click', btn._clickHandler);
                delete btn._clickHandler;
            }
            btn.remove();
            console.log('🗑️ Usunięto osierocony przycisk audio');
        });
        
        const audioContainer = DOMHelper.createElement('div', 'audio-controls');
        audioContainer.setAttribute('data-side', side);
        audioContainer.setAttribute('data-timestamp', Date.now()); // Unikalny identyfikator
        
        if (side === 'front') {
            // 🎯 POPRAWKA: Usuń ikony z labelów - są już w createAudioButton()
            const sentenceAudioBtn = this.createAudioButton(
                this.currentSentence.english, 
                'sentence', 
                'Posłuchaj zdania'  // ✅ BEZ IKONY
            );
            audioContainer.appendChild(sentenceAudioBtn);
            
            const wordAudioBtn = this.createAudioButton(
                this.currentWord.english, 
                'word', 
                'Posłuchaj słowa'  // ✅ BEZ IKONY
            );
            audioContainer.appendChild(wordAudioBtn);
            
        } else {
            // Na tylnej stronie - krótsze etykiety, BEZ IKON
            const sentenceAudioBtn = this.createAudioButton(
                this.currentSentence.english, 
                'sentence', 
                'Posłuchaj zdania'  // ✅ BEZ IKONY
            );

            const wordAudioBtn = this.createAudioButton(
                this.currentWord.english, 
                'word', 
                'Posłuchaj słowa'  // ✅ BEZ IKONY
            );

            audioContainer.appendChild(sentenceAudioBtn);

            audioContainer.appendChild(wordAudioBtn);
            
        }
        
        container.appendChild(audioContainer);
        console.log(`✅ Dodano ${audioContainer.children.length} przycisków audio na stronie: ${side}`);
    }

    /**
     * 🔊 Tworzenie przycisku audio
     */
    createAudioButton(text, type, label) {
        // Unikalne ID dla każdego przycisku
        const uniqueId = `audio-btn-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const audioClasses = type === 'sentence' 
            ? 'audio-btn sentence-audio-btn'  // ✅ Zgodne z AudioManager
            : 'audio-btn word-audio-btn';     // ✅ Zgodne z AudioManager

        const button = DOMHelper.createElement('button', audioClasses);
        button.id = uniqueId;
        button.setAttribute('data-audio-type', type);
        button.setAttribute('data-audio-text', text);
        
        // 🎯 POPRAWKA: Pojedyncza ikona - tylko w audio-icon span
        const iconEmoji = type === 'sentence' ? '🎵' : '🔊';
        
        button.innerHTML = `
            <span class="audio-icon">${iconEmoji}</span>
            <span class="audio-text" data-original-text="${label}">${label}</span>
        `;
        
        // Event listener z izolacją
        const clickHandler = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`🔊 Kliknięto przycisk audio: ${type} - "${text}"`);
            
            if (!this.audioManager) {
                console.warn('⚠️ AudioManager nie jest dostępny');
                return;
            }
            
            try {
                // Animacja tylko dla tego przycisku
                this.animateSpecificButton(button);
                
                // Odtwórz audio
                const buttonSelector = `#${uniqueId}`;
                await this.audioManager.playAudio(text, {}, buttonSelector);
                
                console.log(`✅ Audio odtworzone: ${type} - "${text}"`);
                
            } catch (error) {
                console.error('❌ Błąd odtwarzania audio:', error);
            }
        };
        
        button.addEventListener('click', clickHandler);
        button._clickHandler = clickHandler;
        
        console.log(`🔧 Utworzono przycisk audio: ${type} - "${label}" (ID: ${uniqueId})`);
        return button;
    }

    animateSpecificButton(button) {
        if (!button) return;
        
        console.log(`🎨 Animuję przycisk: ${button.id}`);
        
        // Usuń poprzednie animacje z TEGO przycisku
        button.classList.remove('btn-clicked', 'btn-playing');
        
        // Dodaj klasę animacji
        button.classList.add('btn-clicked');
        
        // 🎯 POPRAWKA: Bardziej precyzyjne zarządzanie tekstem
        const textSpan = button.querySelector('.audio-text');
        const originalText = textSpan?.getAttribute('data-original-text');
        
        if (textSpan && originalText) {
            // Zachowaj oryginalny tekst i pokaż status
            textSpan.textContent = 'Odtwarzanie...';
            button.classList.add('btn-playing');
            
            console.log(`📝 Zmieniono tekst z "${originalText}" na "Odtwarzanie..."`);
            
            // Przywróć oryginalny tekst po animacji
            setTimeout(() => {
                button.classList.remove('btn-clicked', 'btn-playing');
                
                if (textSpan && originalText) {
                    textSpan.textContent = originalText;
                    console.log(`📝 Przywrócono oryginalny tekst: "${originalText}"`);
                }
            }, 1500);
        }
    }

    // ===== POPRAWKA 3: flipCard() - usuń automatyczne audio =====
    flipCard() {
        const flashcard = document.getElementById('flashcard');
        if (!flashcard) {
            console.warn('⚠️ Nie znaleziono głównej karty do obrócenia');
            return;
        }
        
        this.isFlipped = !this.isFlipped;
        
        if (this.isFlipped) {
            flashcard.classList.add('flipped');
        } else {
            flashcard.classList.remove('flipped');
        }
        
        console.log(`🔄 Karta zdaniowa ${this.isFlipped ? 'obrócona' : 'z powrotem'}`);
        
        // 🔇 USUNIĘTE: Automatyczne audio po obróceniu karty
        // Auto-play audio zostało usunięte - teraz tylko przyciski
    }

    /**
     * ➡️ Następne zdanie
     */
    nextSentence() {
        if (this.currentWordIndex < this.sentenceWords.length - 1) {
            this.loadWord(this.currentWordIndex + 1);
            
            // 🎯 WYWOŁANIE: Aktualizuj progress bar po przejściu do następnego zdania
            this.updateProgressBar();
            
            return true;
        } else {
            console.log('📝 Koniec zdań');
            return false;
        }
    }

    /**
     * ⬅️ Poprzednie zdanie
     */
    previousSentence() {
        if (this.currentWordIndex > 0) {
            this.loadWord(this.currentWordIndex - 1);
            
            // 🎯 WYWOŁANIE: Aktualizuj progress bar po przejściu do poprzedniego zdania
            this.updateProgressBar();
            
            return true;
        } else {
            console.log('📝 To jest pierwsze zdanie');
            return false;
        }
    }

  
    /**
     * 🎨 Podświetlenie słowa w zdaniu
     */
    highlightWordInSentence(element, word) {
        const text = element.textContent;
        const regex = new RegExp(`\\b(${word})\\b`, 'gi');
        const highlightedText = text.replace(regex, '<mark class="highlighted-word">$1</mark>');
        element.innerHTML = highlightedText;
    }

    /**
     * 🏷️ Pomocnicze metody do etykiet
     */
    getSentenceContextLabel() {
        const context = this.currentSentence.context;
        const contextLabels = {
            'appearance': 'Wygląd',
            'nature': 'Przyroda',
            'social': 'Sytuacje społeczne',
            'work': 'Praca',
            'family': 'Rodzina',
            'music': 'Muzyka',
            'architecture': 'Architektura',
            'celebration': 'Święta'
        };
        return contextLabels[context] || context || 'Ogólny';
    }

    getFrequencyLabel() {
        const labels = { high: 'Wysoka', medium: 'Średnia', low: 'Niska' };
        return labels[this.currentWord.frequency] || 'Nieznana';
    }

    isReady() {
        const isReady = this.vocabulary && 
            this.sentenceWords && 
            this.sentenceWords.length > 0 && 
            this.frontContainer && 
            this.backContainer;
        
        // 🔍 DEBUGOWANIE: Sprawdź stan przycisków gdy sprawdzamy gotowość
        if (isReady) {
            const audioButtons = document.querySelectorAll('.audio-btn');
            console.log(`🎯 SentenceManager ready. Przyciski audio w DOM: ${audioButtons.length}`);
        }
        
        return isReady;
    }

    /**
     * 📊 Statystyki modułu z informacjami o wyszukiwaniu i progress
     */
    getStats() {
        return {
            // 🎯 WAŻNE: Używamy przefiltrowanej długości dla progress bara!
            totalSentences: this.sentenceWords.length,
            originalTotalSentences: this.originalSentenceWords.length,
            currentIndex: this.currentWordIndex,
            currentWord: this.currentWord?.english || null,
            currentSentence: this.currentSentence?.english || null,
            isFlipped: this.isFlipped,
            uniqueWords: [...new Set(this.sentenceWords.map(w => w.english))].length,
            isReady: this.isReady(),
            hasData: !!this.vocabulary,
            // Informacje o wyszukiwarce
            searchActive: this.isSearchActive,
            searchTerm: this.currentSearchTerm,
            searchResults: this.sentenceWords.length,
            // Progress info dla debugowania
            progressInfo: {
                current: this.currentWordIndex + 1,
                total: this.sentenceWords.length,
                percent: this.sentenceWords.length > 0 ? Math.round(((this.currentWordIndex + 1) / this.sentenceWords.length) * 100) : 0
            }
        };
    }

    resetToFirstCard() {
        console.log('🔄 Resetuję tryb zdaniowy do pierwszej karty...');
        
        if (this.sentenceWords && this.sentenceWords.length > 0) {
            this.loadWord(0);
            console.log('✅ Zresetowano do pierwszej karty zdaniowej');
            return true;
        } else {
            console.warn('⚠️ Brak kart zdaniowych do resetu');
            return false;
        }
    }

    /**
     * 🧹 Czyszczenie managera zdaniowego
     * POPRAWKA: Dodane czyszczenie globalnych referencji
     */
    cleanup() {
        console.log('🧹 Czyszczenie SentenceFlashcardManager...');
        
        // Usuń UI wyszukiwarki (automatycznie czyści globalne funkcje)
        this.removeSearchUI();
        
        // Ukryj główny komunikat i pokaż fiszkę
        this.showFlashcardAndHideMainMessage();
        
        // Wyczyść wyszukiwarkę
        if (this.searchInstance) {
            this.searchInstance.clear();
        }
        
        // Reset stanu wyszukiwania
        this.isSearchActive = false;
        this.currentSearchTerm = '';
        this.sentenceWords = [...this.originalSentenceWords];
        
        // Usuń klasę sentence-mode z kontenera
        const flashcardContainer = document.getElementById('flashcard-container');
        if (flashcardContainer) {
            flashcardContainer.classList.remove('sentence-mode');
        }
        
        // Reset właściwości
        this.currentWordIndex = 0;
        this.currentWord = null;
        this.currentSentence = null;
        this.isFlipped = false;
        
        console.log('✅ SentenceFlashcardManager wyczyszczony');
    }

    // ===== POPRAWKA 6: NOWA METODA - debugAudioButtons() =====
    debugAudioButtons() {
        console.group('🔍 Debug przycisków audio');
        
        const allButtons = document.querySelectorAll('.audio-btn');
        console.log(`📊 Łączna liczba przycisków audio: ${allButtons.length}`);
        
        allButtons.forEach((btn, index) => {
            console.log(`Przycisk ${index + 1}:`, {
                id: btn.id,
                type: btn.getAttribute('data-audio-type'),
                hasHandler: !!btn._clickHandler,
                classes: Array.from(btn.classList).join(', '),
                text: btn.querySelector('.audio-text')?.textContent
            });
        });
        
        const audioContainers = document.querySelectorAll('.audio-controls');
        console.log(`📦 Kontenery audio: ${audioContainers.length}`);
        
        audioContainers.forEach((container, index) => {
            const buttonsInContainer = container.querySelectorAll('.audio-btn');
            console.log(`Kontener ${index + 1}: ${buttonsInContainer.length} przycisków, side: ${container.getAttribute('data-side')}`);
        });
        
        console.groupEnd();
    }
}

// 🎯 EXPORT
export default SentenceFlashcardManager;