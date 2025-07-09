/**
 * FlashcardRenderer - Główny renderer fiszek
 * Łączy wszystkie moduły i renderuje karty w różnych trybach
 * UŻYWA: FlashcardTemplates, DOMHelper, ImageHandler, AudioHandler, Controls
 */

// 🎯 IMPORT wszystkich potrzebnych modułów
import FlashcardTemplates from './templates.js';
import DOMHelper from './dom-helper.js';
import FlashcardImageHandler from './image-handler.js';
import FlashcardAudioHandler from './audio-handler.js';
import FlashcardControls from './controls.js';

class FlashcardRenderer {
    constructor() {
        this.vocabulary = null;
        this.currentWord = null;
        this.showPhonetics = true;
        
        // Inicjalizacja handler'ów (będą skonfigurowane przez setManagers)
        this.imageHandler = null;
        this.audioHandler = null;
        this.controls = new FlashcardControls();
    }

    /**
     * 🔧 Ustawienie słownictwa
     */
    setVocabulary(vocabulary) {
        this.vocabulary = vocabulary;
        console.log('📚 FlashcardRenderer otrzymał słownictwo');
    }

    /**
     * 🔧 Ustawienie menedżerów zewnętrznych (image, audio, progress)
     */
    setManagers(imageManager, audioManager, progressManager) {
        // Konfiguruj handlery z menedżerami
        this.imageHandler = new FlashcardImageHandler(imageManager);
        this.audioHandler = new FlashcardAudioHandler(audioManager);
        this.controls.setProgressManager(progressManager);
        
        console.log('🔧 FlashcardRenderer skonfigurowany z menedżerami');
    }

    /**
     * 🔧 Ustawienie czy pokazywać fonetykę
     */
    setShowPhonetics(show) {
        this.showPhonetics = show;
        if (this.currentWord) {
            this.updatePhoneticDisplay();
        }
    }

    /**
     * 📱 GŁÓWNA METODA - Wyświetlenie słowa na karcie
     */
    displayWord(word, mode = 'flashcards') {
        this.currentWord = word;
        
        console.log(`📱 FlashcardRenderer wyświetla słowo: ${word.english} (${mode})`);
        
        switch (mode) {
            case 'flashcards':
                this.displayFlashcard(word);
                break;
            case 'sentences':
                this.displaySentenceCard(word);
                break;
            default:
                this.displayFlashcard(word);
        }
    }

    /**
     * 🎯 Renderowanie standardowej fiszki
     */
    displayFlashcard(word) {
        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');

        if (!cardFront || !cardBack) {
            console.error('❌ Nie znaleziono elementów karty');
            return;
        }

        // Wyczyść poprzednią zawartość
        DOMHelper.clearContainer(cardFront);
        DOMHelper.clearContainer(cardBack);

        // Zbuduj przód i tył karty
        this.buildCardFront(cardFront, word);
        this.buildCardBack(cardBack, word);
    }

    /**
     * 🎯 Renderowanie karty z przykładami zdań
     */
    displaySentenceCard(word) {
        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');

        if (!cardFront || !cardBack) {
            console.error('❌ Nie znaleziono elementów karty');
            return;
        }

        DOMHelper.clearContainer(cardFront);
        DOMHelper.clearContainer(cardBack);

        this.buildSentenceFront(cardFront, word);
        this.buildSentenceBack(cardBack, word);
    }

    /**
     * 🏗️ Budowanie przodu standardowej karty
     */
    buildCardFront(container, word) {
        // 1. Obrazek (jeśli dostępny)
        if (this.imageHandler) {
            this.imageHandler.addImageSection(container, word);
        }

        // 2. Typ słowa
        if (word.type) {
            const typeEl = DOMHelper.createElementFromHTML(
                FlashcardTemplates.getWordTypeElement(word.type)
            );
            container.appendChild(typeEl);
        }

        // 3. Główne angielskie słowo
        const englishEl = DOMHelper.createElement('div', 'english-word', word.english);
        container.appendChild(englishEl);

        // 4. Badge trudności
        const currentDifficulty = this.controls.getWordDifficulty(word);
        if (currentDifficulty) {
            const difficultyEl = DOMHelper.createElementFromHTML(
                FlashcardTemplates.getDifficultyBadge(currentDifficulty)
            );
            container.appendChild(difficultyEl);
        }

        // 5. Badge częstotliwości
        if (word.frequency) {
            const frequencyEl = DOMHelper.createElementFromHTML(
                FlashcardTemplates.getFrequencyBadge(word.frequency)
            );
            container.appendChild(frequencyEl);
        }
    }

    /**
     * 🏗️ Budowanie tyłu standardowej karty
     */
    buildCardBack(container, word) {
        // 1. Polskie tłumaczenie
        const polishEl = DOMHelper.createElement('div', 'polish-translation', word.polish);
        container.appendChild(polishEl);

        // 2. Wymowa
        if (word.pronunciation) {
            const pronunciationEl = DOMHelper.createElement('div', 'pronunciation', word.pronunciation);
            container.appendChild(pronunciationEl);
        }

        // 3. Fonetyka (jeśli włączona)
        if (this.showPhonetics && word.phonetic) {
            const phoneticEl = DOMHelper.createElement('div', 'phonetic', word.phonetic);
            container.appendChild(phoneticEl);
        }

        // 4. Przykład zdania
        if (word.examples) {
            const exampleData = this.getExampleData(word.examples);
            if (exampleData) {
                this.addExampleSection(container, exampleData);
            }
        }

        // 5. Synonimy i antonimy
        if (word.synonyms || word.antonyms) {
            const relatedWordsEl = DOMHelper.createElementFromHTML(
                FlashcardTemplates.getRelatedWordsSection(word)
            );
            container.appendChild(relatedWordsEl);
        }

        // 6. Przycisk audio
        if (word.english && this.audioHandler) {
            this.audioHandler.addAudioButton(container, word.english, 'word');
        }

        // 7. Kontrolki słowa (trudność, bookmark)
        if (this.controls) {
            this.controls.addWordControls(container, word);
        }
    }

    /**
     * 🏗️ Budowanie przodu karty zdaniowej
     */
    buildSentenceFront(container, word) {
        if (!word.examples) {
            console.warn('⚠️ Słowo nie ma przykładów zdań');
            return;
        }

        // 1. Nagłówek
        const headerEl = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getSentenceHeader()
        );
        container.appendChild(headerEl);

        // 2. Angielskie zdanie
        const sentenceEl = DOMHelper.createElement('div', 'sentence-english', word.examples.english);
        container.appendChild(sentenceEl);

        // 3. Podświetl główne słowo w zdaniu
        DOMHelper.highlightWordInSentence(sentenceEl, word.english);

        // 4. Kontekst słowa
        const contextEl = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getWordContext(word)
        );
        container.appendChild(contextEl);
    }

    /**
     * 🏗️ Budowanie tyłu karty zdaniowej
     */
    buildSentenceBack(container, word) {
        if (!word.examples) {
            console.warn('⚠️ Słowo nie ma przykładów zdań');
            return;
        }

        // 1. Polskie tłumaczenie zdania
        const polishSentenceEl = DOMHelper.createElement('div', 'sentence-polish', word.examples.polish);
        container.appendChild(polishSentenceEl);

        // 2. Szczegóły słowa
        const detailsEl = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getWordDetails(word)
        );
        container.appendChild(detailsEl);

        // 3. Przycisk audio dla słowa
        if (word.english && this.audioHandler) {
            this.audioHandler.addAudioButton(container, word.english, 'word');
        }
    }

    /**
     * 🔧 Pomocnicza metoda - Pobieranie danych przykładu (kompatybilność z nową i starą strukturą)
     */
    getExampleData(examples) {
        if (!examples) {
            return null;
        }

        // Jeśli examples to tablica (nowa struktura)
        if (Array.isArray(examples)) {
            if (examples.length === 0) {
                console.warn('⚠️ Tablica examples jest pusta');
                return null;
            }
            
            // Wybierz pierwszy przykład (lub można losowy)
            const firstExample = examples[0];
            console.log(`📝 Wybrano pierwszy przykład z ${examples.length} dostępnych: "${firstExample.english}"`);
            
            return {
                english: firstExample.english,
                polish: firstExample.polish,
                id: firstExample.id,
                context: firstExample.context,
                difficulty: firstExample.difficulty
            };
        }
        
        // Jeśli examples to obiekt (stara struktura)
        if (examples.english && examples.polish) {
            console.log('📝 Używam starą strukturę examples (obiekt)');
            return {
                english: examples.english,
                polish: examples.polish
            };
        }
        
        console.warn('⚠️ Nierozpoznana struktura examples:', examples);
        return null;
    }

    /**
     * 📝 Dodawanie sekcji przykładu zdania (dla standardowej karty)
     */
    addExampleSection(container, examples) {
        // Kontener dla przykładu
        const exampleEl = DOMHelper.createElement('div', 'example-sentence');
        
        // Angielskie i polskie zdanie
        const exampleHTML = FlashcardTemplates.getExampleSection(examples);
        exampleEl.innerHTML = exampleHTML;
        
        // Przycisk audio dla zdania
        if (examples.english && this.audioHandler) {
            this.audioHandler.addAudioButton(exampleEl, examples.english, 'sentence');
        }
        
        container.appendChild(exampleEl);
    }

    /**
     * 🔄 Aktualizacja wyświetlania fonetyki
     */
    updatePhoneticDisplay() {
        const phoneticEl = document.querySelector('.phonetic');
        if (phoneticEl) {
            phoneticEl.style.display = this.showPhonetics ? 'block' : 'none';
        }
    }

    /**
     * 🔊 Auto-play audio jeśli włączone
     */
    autoPlayAudio(text) {
        if (this.audioHandler) {
            this.audioHandler.autoPlayAudio(text);
        }
    }

    /**
     * 🧪 Test audio dla bieżącego słowa
     */
    async testCurrentWordAudio() {
        if (this.audioHandler && this.currentWord) {
            return await this.audioHandler.testCurrentWordAudio(this.currentWord);
        }
        return false;
    }

    /**
     * 🔄 Toggle auto-play
     */
    toggleAutoPlay() {
        if (this.audioHandler) {
            return this.audioHandler.toggleAutoPlay();
        }
        return false;
    }

    /**
     * 🔄 Odświeżenie stanu przycisków (po zmianach zewnętrznych)
     */
    refreshButtonStates(word) {
        if (this.controls && word) {
            this.controls.refreshDifficultyState(word);
            this.controls.refreshBookmarkState(word);
        }
    }

    /**
     * 🧹 Czyszczenie zasobów
     */
    cleanup() {
        this.vocabulary = null;
        this.currentWord = null;
        this.imageHandler = null;
        this.audioHandler = null;
        this.controls = null;
        
        console.log('🧹 FlashcardRenderer wyczyszczony');
    }
}

// 🎯 EXPORT
export default FlashcardRenderer;