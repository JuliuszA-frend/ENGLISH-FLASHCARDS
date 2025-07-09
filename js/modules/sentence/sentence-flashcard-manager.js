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
            autoPlayAudio: false,
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
        
        // Renderuj do głównych kontenerów aplikacji
        this.renderToMainContainers();
        
        // 🔇 USUNIĘTE: Automatyczne audio - teraz tylko przyciski
        // Auto-play audio zostało usunięte
        
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
            const wordAudioBtn = this.createAudioButton(
                this.currentWord.english, 
                'word', 
                'Słowo'  // ✅ BEZ IKONY
            );
            audioContainer.appendChild(wordAudioBtn);
            
            const sentenceAudioBtn = this.createAudioButton(
                this.currentSentence.english, 
                'sentence', 
                'Zdanie'  // ✅ BEZ IKONY
            );
            audioContainer.appendChild(sentenceAudioBtn);
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
        
        const button = DOMHelper.createElement('button', `audio-btn ${type}-audio`);
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
                await this.audioManager.playAudio(text);
                
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
     * 📊 Statystyki modułu
     */
    getStats() {
        return {
            totalSentences: this.sentenceWords.length,
            currentIndex: this.currentWordIndex,
            currentWord: this.currentWord?.english || null,
            currentSentence: this.currentSentence?.english || null,
            isFlipped: this.isFlipped,
            uniqueWords: [...new Set(this.sentenceWords.map(w => w.english))].length,
            isReady: this.isReady(),
            hasData: !!(this.vocabulary && this.sentenceWords.length > 0)
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
     * 🧹 Czyszczenie zasobów
     */
    cleanup() {
        console.log('🧹 SentenceFlashcardManager cleanup...');
        
        // 🧹 POPRAWKA: Dokładniejsze czyszczenie wszystkich event listenerów audio
        console.log('🧹 Czyszczę wszystkie event listenery audio...');
        
        // Znajdź wszystkie przyciski audio (nie tylko w kontenerach)
        const allAudioButtons = document.querySelectorAll('.audio-btn');
        let cleanedCount = 0;
        
        allAudioButtons.forEach(btn => {
            if (btn._clickHandler) {
                btn.removeEventListener('click', btn._clickHandler);
                delete btn._clickHandler;
                cleanedCount++;
            }
            
            // Usuń wszystkie klasy animacji
            btn.classList.remove('btn-clicked', 'btn-playing', 'click-animation');
        });
        
        console.log(`🗑️ Wyczyszczono ${cleanedCount} event listenerów audio`);
        
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
        
        // Zachowaj dane dla ponownego użycia ale wyczyść stan
        this.currentWord = null;
        this.currentSentence = null;
        this.isFlipped = false;
        
        // DEBUGOWANIE: Sprawdź czy wszystkie przyciski zostały wyczyszczone
        const remainingButtons = document.querySelectorAll('.audio-btn');
        console.log(`📊 Pozostałe przyciski audio po cleanup: ${remainingButtons.length}`);
        
        console.log('✅ SentenceFlashcardManager wyczyszczony (kompletnie)');
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