/**
 * POPRAWIONY SentenceFlashcardManager - sentence-flashcard-manager.js
 * Integracja z głównym systemem wyświetlania kart
 */

import FlashcardTemplates from '../flashcard/templates.js';
import DOMHelper from '../flashcard/dom-helper.js';

class SentenceFlashcardManager {
    constructor() {
        this.vocabulary = null;
        this.sentenceWords = []; // Słowa z przykładami zdań
        this.currentWordIndex = 0;
        this.currentSentenceIndex = 0;
        this.currentWord = null;
        this.currentSentence = null;
        this.isFlipped = false;
        
        // Managery
        this.audioManager = null;
        this.progressManager = null;
        this.imageManager = null;
        
        // 🎯 ZMIANA: Użyj głównych kontenerów aplikacji zamiast tworzenia własnych
        this.frontContainer = null;
        this.backContainer = null;
        
        // Ustawienia
        this.settings = {
            autoPlayAudio: true,
            showPhonetics: true,
            highlightMainWord: true,
            showContext: true
        };
        
        console.log('🎯 SentenceFlashcardManager zainicjalizowany');
    }

    /**
     * 🚀 Inicjalizacja managera
     */
    async init(vocabulary, managers = {}) {
        try {
            console.log('🎯 Inicjalizowanie SentenceFlashcardManager...');
            
            this.vocabulary = vocabulary;
            this.audioManager = managers.audio;
            this.progressManager = managers.progress;
            this.imageManager = managers.image;
            
            // 🎯 ZMIANA: Użyj głównych kontenerów aplikacji
            this.setupMainContainers();
            
            // Przefiltruj słowa z przykładami zdań
            this.filterWordsWithSentences();
            
            // Załaduj pierwsze słowo jeśli są dostępne
            if (this.sentenceWords.length > 0) {
                this.loadWord(0);
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
     * 📚 Ładowanie konkretnego słowa
     */
    loadWord(index) {
        if (index < 0 || index >= this.sentenceWords.length) {
            console.warn('⚠️ Nieprawidłowy indeks słowa:', index);
            return false;
        }
        
        this.currentWordIndex = index;
        this.currentWord = this.sentenceWords[index];
        this.currentSentence = this.currentWord.sentenceData;
        this.isFlipped = false;
        
        console.log(`📚 Ładowanie zdania: "${this.currentSentence.english}"`);
        
        // 🎯 ZMIANA: Renderuj do głównych kontenerów aplikacji
        this.renderToMainContainers();
        
        // Auto-play audio jeśli włączone
        if (this.settings.autoPlayAudio && this.audioManager) {
            setTimeout(() => {
                this.audioManager.playAudio(this.currentSentence.english);
            }, 500);
        }
        
        return true;
    }

    /**
     * 🎯 NOWE: Renderowanie do głównych kontenerów aplikacji
     */
    renderToMainContainers() {
        if (!this.frontContainer || !this.backContainer || !this.currentWord) {
            console.error('❌ Brak kontenerów lub danych do renderowania');
            return;
        }
        
        // Wyczyść kontenery
        DOMHelper.clearContainer(this.frontContainer);
        DOMHelper.clearContainer(this.backContainer);
        
        // 🎯 Dodaj klasę trybu zdaniowego do głównego kontenera
        const flashcardContainer = document.getElementById('flashcard-container');
        if (flashcardContainer) {
            flashcardContainer.classList.add('sentence-mode');
        }
        
        // Zbuduj zawartość
        this.buildSentenceFront(this.frontContainer);
        this.buildSentenceBack(this.backContainer);
        
        // Reset flip state
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.classList.remove('flipped');
        }
        
        console.log(`✅ Zdanie wyrenderowane do głównych kontenerów: "${this.currentSentence.english}"`);
    }

    /**
     * 🏗️ Budowanie przodu karty zdaniowej
     */
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
        
        // 5. Przyciski audio
        this.addAudioButtons(container, 'front');
        
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
        
        // 4. Przyciski audio
        this.addAudioButtons(container, 'back');
        
        // 5. Kontrolki słowa (bookmark, trudność)
        this.addWordControls(container);
        
        // 6. Informacja o pozostałych zdaniach
        if (this.currentWord.totalSentences > 1) {
            const moreExamplesEl = DOMHelper.createElement('div', 'more-examples-info');
            moreExamplesEl.innerHTML = `
                📚 To słowo ma <strong>${this.currentWord.totalSentences}</strong> przykładów zdań.
            `;
            container.appendChild(moreExamplesEl);
        }
    }

    /**
     * 🔊 Dodawanie przycisków audio
     */
    addAudioButtons(container, side) {
        const audioContainer = DOMHelper.createElement('div', 'audio-controls');
        
        if (side === 'front') {
            // Przycisk dla zdania
            const sentenceAudioBtn = this.createAudioButton(
                this.currentSentence.english, 
                'sentence', 
                '🎵 Posłuchaj zdania'
            );
            audioContainer.appendChild(sentenceAudioBtn);
            
            // Przycisk dla słowa
            const wordAudioBtn = this.createAudioButton(
                this.currentWord.english, 
                'word', 
                '🔊 Posłuchaj słowa'
            );
            audioContainer.appendChild(wordAudioBtn);
            
        } else {
            // Na tylnej stronie - tłumaczenie
            const wordAudioBtn = this.createAudioButton(
                this.currentWord.english, 
                'word', 
                '🔊 Słowo'
            );
            audioContainer.appendChild(wordAudioBtn);
            
            const sentenceAudioBtn = this.createAudioButton(
                this.currentSentence.english, 
                'sentence', 
                '🎵 Zdanie'
            );
            audioContainer.appendChild(sentenceAudioBtn);
        }
        
        container.appendChild(audioContainer);
    }

    /**
     * 🔊 Tworzenie przycisku audio
     */
    createAudioButton(text, type, label) {
        const button = DOMHelper.createElement('button', `audio-btn ${type}-audio`);
        button.innerHTML = `<span class="text">${label}</span>`;
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.audioManager) {
                this.audioManager.playAudio(text);
                
                // Animacja kliknięcia
                DOMHelper.addClickAnimation(button);
            }
        });
        
        return button;
    }

    /**
     * 🎛️ Dodawanie kontrolek słowa
     */
    addWordControls(container) {
        const controlsEl = DOMHelper.createElement('div', 'word-controls');
        
        // Przycisk bookmark
        const isBookmarked = this.isWordBookmarked();
        const bookmarkBtn = DOMHelper.createElement('button', 
            `control-btn bookmark-btn ${isBookmarked ? 'bookmarked' : 'not-bookmarked'}`
        );
        bookmarkBtn.innerHTML = `
            <span class="icon">${isBookmarked ? '🔖' : '⚪'}</span>
            <span class="text">${isBookmarked ? 'Usuń z powtórek' : 'Dodaj do powtórek'}</span>
        `;
        
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBookmark();
        });
        
        controlsEl.appendChild(bookmarkBtn);
        container.appendChild(controlsEl);
    }

    /**
     * 🔄 Obracanie karty - integracja z główną aplikacją
     */
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
        
        // Auto-play audio jeśli włączone i karta obrócona
        if (this.isFlipped && this.settings.autoPlayAudio && this.audioManager) {
            setTimeout(() => {
                this.audioManager.playAudio(this.currentWord.english);
            }, 300);
        }
    }

    /**
     * ➡️ Następne zdanie
     */
    nextSentence() {
        if (this.currentWordIndex < this.sentenceWords.length - 1) {
            this.loadWord(this.currentWordIndex + 1);
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
            return true;
        } else {
            console.log('📝 To jest pierwsze zdanie');
            return false;
        }
    }

    /**
     * 🔖 Toggle bookmark dla słowa
     */
    toggleBookmark() {
        // Sprawdź, czy progressManager i jego sub-moduł zakładek są dostępne
        if (!this.progressManager || !this.progressManager.bookmarks) {
            console.warn('⚠️ BookmarksManager nie jest dostępny w ProgressManager');
            return;
        }
        
        // Wywołaj metodę `toggleBookmark` z sub-menedżera, przekazując cały obiekt `currentWord`.
        // BookmarksManager sam zarządzi kluczem i stanem.
        // Chociaż logika BookmarksManager jest stworzona dla słów, a nie zdań,
        // to wywołanie zapobiegnie błędowi i umożliwi działanie funkcji.
        this.progressManager.bookmarks.toggleBookmark(this.currentWord);
        
        console.log(`🔖 Przełączono bookmark dla: ${this.currentWord.english}`);
        
        // Odśwież UI, aby pokazać zmianę statusu zakładki
        this.renderToMainContainers();
    }

    /**
     * 🔍 Sprawdzenie czy słowo jest w bookmarkach
     */
    isWordBookmarked() {
        // Sprawdź, czy progressManager i jego sub-moduł zakładek są dostępne
        if (!this.progressManager || !this.progressManager.bookmarks) {
            console.warn('⚠️ BookmarksManager nie jest dostępny w ProgressManager');
            return false;
        }
        
        // Wywołaj poprawną metodę z sub-menedżera, przekazując obiekt `currentWord`.
        return this.progressManager.bookmarks.isBookmarked(this.currentWord);
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

    /**
     * 📊 Statystyki modułu
     */
    getStats() {
        return {
            totalSentences: this.sentenceWords.length,
            currentIndex: this.currentWordIndex,
            currentWord: this.currentWord?.english,
            currentSentence: this.currentSentence?.english,
            isFlipped: this.isFlipped,
            uniqueWords: [...new Set(this.sentenceWords.map(w => w.english))].length
        };
    }

    /**
     * 🧹 Czyszczenie zasobów
     */
    cleanup() {
        console.log('🧹 SentenceFlashcardManager cleanup...');
        
        // Usuń klasę trybu zdaniowego z głównego kontenera
        const flashcardContainer = document.getElementById('flashcard-container');
        if (flashcardContainer) {
            flashcardContainer.classList.remove('sentence-mode');
        }
        
        // Wyczyść kontenery
        if (this.frontContainer) {
            DOMHelper.clearContainer(this.frontContainer);
        }
        if (this.backContainer) {
            DOMHelper.clearContainer(this.backContainer);
        }
        
        // Wyczyść referencje
        this.vocabulary = null;
        this.sentenceWords = [];
        this.currentWord = null;
        this.currentSentence = null;
        this.audioManager = null;
        this.progressManager = null;
        this.imageManager = null;
        this.frontContainer = null;
        this.backContainer = null;
        
        console.log('✅ SentenceFlashcardManager wyczyszczony');
    }
}

// 🎯 EXPORT
export default SentenceFlashcardManager;