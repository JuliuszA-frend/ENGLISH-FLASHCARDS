/**
 * FlashcardManager - Menedżer fiszek
 * Odpowiada za wyświetlanie i zarządzanie fiszkami
 */

class FlashcardManager {
    constructor() {
        this.vocabulary = null;
        this.currentWord = null;
        this.showPhonetics = true;
        this.imageManager = null;
        this.audioManager = null;
    }

    /**
     * Ustawienie danych słownictwa
     */
    setVocabulary(vocabulary) {
        this.vocabulary = vocabulary;
    }

    /**
     * Ustawienie menedżerów pomocniczych
     */
    setManagers(imageManager, audioManager) {
        this.imageManager = imageManager;
        this.audioManager = audioManager;
    }

    /**
     * Ustawienie czy pokazywać fonetykę
     */
    setShowPhonetics(show) {
        this.showPhonetics = show;
        if (this.currentWord) {
            this.updatePhoneticDisplay();
        }
    }

    /**
 * Wyświetlenie słowa na karcie - ZAKTUALIZOWANA WERSJA
 */
    displayWord(word, mode = 'flashcards') {
        this.currentWord = word;
        
        console.log(`📱 Wyświetlam słowo: ${word.english} (${mode})`);
        
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
     * Wyświetlenie standardowej fiszki
     */
    displayFlashcard(word) {
        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');

        if (!cardFront || !cardBack) return;

        // Wyczyść poprzednią zawartość
        cardFront.innerHTML = '';
        cardBack.innerHTML = '';

        // Przód karty (angielski)
        this.buildCardFront(cardFront, word);

        // Tył karty (polski + szczegóły)
        this.buildCardBack(cardBack, word);
    }

    /**
     * Wyświetlenie karty z przykładami zdań
     */
    displaySentenceCard(word) {
        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');

        if (!cardFront || !cardBack) return;

        cardFront.innerHTML = '';
        cardBack.innerHTML = '';

        // Przód - angielskie zdanie
        this.buildSentenceFront(cardFront, word);

        // Tył - polskie tłumaczenie + szczegóły
        this.buildSentenceBack(cardBack, word);
    }

    /**
     * Budowanie przodu standardowej karty
     */
    buildCardFront(container, word) {
        // Obrazek jeśli dostępny
        this.addImageSection(container, word);

        // Typ słowa
        if (word.type) {
            const typeEl = this.createElement('div', 'word-type', word.type);
            typeEl.classList.add(this.getTypeClass(word.type));
            container.appendChild(typeEl);
        }

        // Główne angielskie słowo
        const englishEl = this.createElement('div', 'english-word', word.english);
        container.appendChild(englishEl);

        // Poziom trudności
        if (word.difficulty) {
            const difficultyEl = this.createElement('div', 'difficulty-badge');
            difficultyEl.classList.add(`difficulty-${word.difficulty}`);
            difficultyEl.textContent = this.getDifficultyLabel(word.difficulty);
            container.appendChild(difficultyEl);
        }

        // Częstotliwość użycia
        if (word.frequency) {
            const frequencyEl = this.createElement('div', 'frequency-badge');
            frequencyEl.classList.add(`frequency-${word.frequency}`);
            frequencyEl.textContent = this.getFrequencyLabel(word.frequency);
            container.appendChild(frequencyEl);
        }
    }

    /**
     * Budowanie tyłu standardowej karty
     */
    buildCardBack(container, word) {
        // Polskie tłumaczenie
        const polishEl = this.createElement('div', 'polish-translation', word.polish);
        container.appendChild(polishEl);

        // Wymowa
        if (word.pronunciation) {
            const pronunciationEl = this.createElement('div', 'pronunciation', word.pronunciation);
            container.appendChild(pronunciationEl);
        }

        // Fonetyka (jeśli włączona)
        if (this.showPhonetics && word.phonetic) {
            const phoneticEl = this.createElement('div', 'phonetic', word.phonetic);
            container.appendChild(phoneticEl);
        }

        // Przykład zdania
        if (word.examples) {
            this.addExampleSection(container, word.examples);
        }

        // Synonimy i antonimy
        this.addRelatedWords(container, word);

        // Przycisk audio
        if (word.english) {
            this.addAudioButton(container, word.english);
        }

        // Dodatkowe kontrolki
        this.addWordControls(container, word);
    }

    /**
     * Budowanie przodu karty zdaniowej
     */
    buildSentenceFront(container, word) {
        if (!word.examples) return;

        // Nagłówek
        const headerEl = this.createElement('div', 'sentence-header', 'Przykład użycia:');
        container.appendChild(headerEl);

        // Angielskie zdanie
        const sentenceEl = this.createElement('div', 'sentence-english', word.examples.english);
        container.appendChild(sentenceEl);

        // Podświetlenie głównego słowa w zdaniu
        this.highlightWordInSentence(sentenceEl, word.english);

        // Słowo w kontekście
        const contextEl = this.createElement('div', 'word-context');
        contextEl.innerHTML = `Słowo: <strong>${word.english}</strong> → <strong>${word.polish}</strong>`;
        container.appendChild(contextEl);
    }

    /**
     * Budowanie tyłu karty zdaniowej
     */
    buildSentenceBack(container, word) {
        if (!word.examples) return;

        // Polskie tłumaczenie zdania
        const polishSentenceEl = this.createElement('div', 'sentence-polish', word.examples.polish);
        container.appendChild(polishSentenceEl);

        // Szczegóły słowa
        const detailsEl = this.createElement('div', 'word-details');
        
        const wordInfoEl = this.createElement('div', 'word-info');
        wordInfoEl.innerHTML = `
            <div class="detail-item">
                <span class="label">Słowo:</span>
                <span class="value">${word.english} → ${word.polish}</span>
            </div>
        `;

        if (word.type) {
            const typeItem = this.createElement('div', 'detail-item');
            typeItem.innerHTML = `
                <span class="label">Typ:</span>
                <span class="value">${word.type}</span>
            `;
            wordInfoEl.appendChild(typeItem);
        }

        if (word.pronunciation) {
            const pronItem = this.createElement('div', 'detail-item');
            pronItem.innerHTML = `
                <span class="label">Wymowa:</span>
                <span class="value">${word.pronunciation}</span>
            `;
            wordInfoEl.appendChild(pronItem);
        }

        detailsEl.appendChild(wordInfoEl);
        container.appendChild(detailsEl);

        // Przycisk audio
        if (word.english) {
            this.addAudioButton(container, word.english);
        }
    }

    /**
     * Dodawanie sekcji obrazka
     */
    addImageSection(container, word) {
        if (!this.imageManager) return;

        const wordId = this.getWordId(word);
        const savedImage = this.imageManager.getImage(wordId);

        if (savedImage) {
            const imageEl = this.createElement('img', 'word-image');
            imageEl.src = savedImage;
            imageEl.alt = `Obrazek dla: ${word.polish}`;
            imageEl.loading = 'lazy';
            
            // Dodaj kontrolki obrazka
            const imageWrapper = this.createElement('div', 'image-wrapper');
            imageWrapper.appendChild(imageEl);
            
            const controls = this.createImageControls(wordId, word);
            imageWrapper.appendChild(controls);
            
            container.appendChild(imageWrapper);
        } else {
            // Przycisk dodawania obrazka
            const addImageBtn = this.createElement('button', 'add-image-btn');
            addImageBtn.innerHTML = `
                <span class="icon">📷</span>
                <span class="text">Dodaj obrazek</span>
            `;
            addImageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openImageManager(wordId, word);
            });
            container.appendChild(addImageBtn);
        }
    }

    addExampleSection(container, examples) {
        const exampleEl = this.createElement('div', 'example-sentence');
        
        const englishEl = this.createElement('div', 'sentence-english', examples.english);
        const polishEl = this.createElement('div', 'sentence-polish', examples.polish);
        
        exampleEl.appendChild(englishEl);
        exampleEl.appendChild(polishEl);
        
        // ZAKTUALIZOWANY przycisk audio dla zdania
        if (examples.english) {
            const sentenceAudioBtn = this.createElement('button', 'sentence-audio-btn');
            sentenceAudioBtn.innerHTML = `
                <span class="icon">🎵</span>
                <span class="text">Posłuchaj zdania</span>
            `;
            
            sentenceAudioBtn.setAttribute('data-audio-text', examples.english);
            sentenceAudioBtn.setAttribute('data-audio-type', 'sentence');
            
            sentenceAudioBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                console.log(`🎵 Kliknięto przycisk audio dla zdania: "${examples.english}"`);
                
                if (this.audioManager) {
                    // Przekaż selektor konkretnego przycisku
                    const success = await this.audioManager.playAudio(examples.english, { rate: 0.8 }, '.sentence-audio-btn');
                    if (!success) {
                        console.error('❌ Nie udało się odtworzyć audio zdania');
                    }
                }
            });
            
            exampleEl.appendChild(sentenceAudioBtn);
        }
        
        container.appendChild(exampleEl);
    }

    /**
     * Dodawanie powiązanych słów (synonimy, antonimy)
     */
    addRelatedWords(container, word) {
        if (!word.synonyms && !word.antonyms) return;

        const relatedEl = this.createElement('div', 'related-words');

        if (word.synonyms && word.synonyms.length > 0) {
            const synonymsEl = this.createElement('div', 'synonyms');
            synonymsEl.innerHTML = `
                <span class="label">Synonimy:</span>
                <span class="words">${word.synonyms.join(', ')}</span>
            `;
            relatedEl.appendChild(synonymsEl);
        }

        if (word.antonyms && word.antonyms.length > 0) {
            const antonymsEl = this.createElement('div', 'antonyms');
            antonymsEl.innerHTML = `
                <span class="label">Antonimy:</span>
                <span class="words">${word.antonyms.join(', ')}</span>
            `;
            relatedEl.appendChild(antonymsEl);
        }

        container.appendChild(relatedEl);
    }

    /**
 * Dodawanie przycisku audio - ZAKTUALIZOWANA WERSJA
 */
    /**
 * Dodawanie przycisku audio - ZAKTUALIZOWANA WERSJA
 */
    addAudioButton(container, text) {
        const audioBtn = this.createElement('button', 'audio-btn word-audio-btn');
        audioBtn.innerHTML = `
            <span class="icon">🔊</span>
            <span class="text">Posłuchaj słowa</span>
        `;
        
        // Dodaj atrybut dla łatwiejszego debugowania
        audioBtn.setAttribute('data-audio-text', text);
        audioBtn.setAttribute('data-audio-type', 'word');
        
        audioBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            console.log(`🔊 Kliknięto przycisk audio dla słowa: "${text}"`);
            
            if (this.audioManager) {
                // Przekaż selektor konkretnego przycisku
                const success = await this.audioManager.playAudio(text, {}, '.word-audio-btn');
                if (!success) {
                    console.error('❌ Nie udało się odtworzyć audio słowa');
                }
            } else {
                console.error('❌ AudioManager nie jest dostępny');
                
                // Fallback - pokazuj komunikat
                if (window.NotificationManager) {
                    window.NotificationManager.show('AudioManager nie jest zainicjalizowany', 'error');
                }
            }
        });

        container.appendChild(audioBtn);
    }

    /**
     * NOWA METODA: Auto-play audio jeśli włączone
     */
    autoPlayAudio(text) {
        if (this.audioManager && this.audioManager.autoPlay && text) {
            setTimeout(() => {
                this.audioManager.playAudio(text);
            }, 500); // Małe opóźnienie żeby karta się załadowała
        }
    }

    /**
     * NOWA METODA: Test audio dla bieżącego słowa
     */
    async testCurrentWordAudio() {
        if (!this.currentWord || !this.audioManager) {
            console.warn('⚠️ Brak słowa lub AudioManager do testu');
            return false;
        }

        console.log('🧪 Testuję audio dla bieżącego słowa...');
        
        const success = await this.audioManager.playAudio(this.currentWord.english);
        
        if (success) {
            console.log('✅ Test audio pomyślny');
            if (window.NotificationManager) {
                window.NotificationManager.show('Audio działa poprawnie!', 'success');
            }
        } else {
            console.error('❌ Test audio nieudany');
            if (window.NotificationManager) {
                window.NotificationManager.show('Problem z audio. Sprawdź konsole.', 'error');
            }
        }
        
        return success;
    }

    /**
     * NOWA METODA: Toggle auto-play
     */
    toggleAutoPlay() {
        if (this.audioManager) {
            const newState = !this.audioManager.autoPlay;
            this.audioManager.setAutoPlay(newState);
            
            if (window.NotificationManager) {
                window.NotificationManager.show(
                    `Auto-play ${newState ? 'włączone' : 'wyłączone'}`, 
                    'info'
                );
            }
            
            return newState;
        }
        return false;
    }

    /**
     * Dodawanie kontrolek słowa
     */
    addWordControls(container, word) {
        const controlsEl = this.createElement('div', 'word-controls');

        // Przycisk trudności
        const difficultyBtn = this.createElement('button', 'control-btn difficulty-btn');
        difficultyBtn.innerHTML = `
            <span class="icon">⭐</span>
            <span class="text">Trudność</span>
        `;
        difficultyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDifficulty(word);
        });

        // Przycisk ulubionych
        const bookmarkBtn = this.createElement('button', 'control-btn bookmark-btn');
        const isBookmarked = this.isWordBookmarked(word);
        bookmarkBtn.innerHTML = `
            <span class="icon">${isBookmarked ? '🔖' : '🔖'}</span>
            <span class="text">${isBookmarked ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}</span>
        `;
        bookmarkBtn.classList.toggle('active', isBookmarked);
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBookmark(word);
        });

        controlsEl.appendChild(difficultyBtn);
        controlsEl.appendChild(bookmarkBtn);
        container.appendChild(controlsEl);
    }

    /**
     * Tworzenie kontrolek obrazka
     */
    createImageControls(wordId, word) {
        const controls = this.createElement('div', 'image-controls');

        const editBtn = this.createElement('button', 'image-control-btn edit-btn');
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Zmień obrazek';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openImageManager(wordId, word);
        });

        const deleteBtn = this.createElement('button', 'image-control-btn delete-btn');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Usuń obrazek';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteWordImage(wordId);
        });

        controls.appendChild(editBtn);
        controls.appendChild(deleteBtn);
        return controls;
    }

    /**
     * Podświetlanie słowa w zdaniu
     */
    highlightWordInSentence(sentenceElement, word) {
        const text = sentenceElement.textContent;
        const regex = new RegExp(`\\b(${word})\\b`, 'gi');
        const highlightedText = text.replace(regex, '<mark>$1</mark>');
        sentenceElement.innerHTML = highlightedText;
    }

    /**
     * Aktualizacja wyświetlania fonetyki
     */
    updatePhoneticDisplay() {
        const phoneticEl = document.querySelector('.phonetic');
        if (phoneticEl) {
            phoneticEl.style.display = this.showPhonetics ? 'block' : 'none';
        }
    }

    /**
     * Pomocnicze metody
     */
    createElement(tag, className, textContent) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent !== undefined) element.textContent = textContent;
        return element;
    }

    getWordId(word) {
        return `word-${word.id || word.english.toLowerCase().replace(/\s+/g, '-')}`;
    }

    getTypeClass(type) {
        const typeMap = {
            'adjective': 'type-adjective',
            'noun': 'type-noun',
            'verb': 'type-verb',
            'adverb': 'type-adverb'
        };
        return typeMap[type] || 'type-default';
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            'easy': 'Łatwy',
            'medium': 'Średni',
            'hard': 'Trudny'
        };
        return labels[difficulty] || difficulty;
    }

    getFrequencyLabel(frequency) {
        const labels = {
            'high': 'Częste',
            'medium': 'Średnie',
            'low': 'Rzadkie'
        };
        return labels[frequency] || frequency;
    }

    /**
     * Funkcje interakcji
     */
    toggleDifficulty(word) {
        // Implementacja w ProgressManager
        if (window.englishFlashcardsApp && window.englishFlashcardsApp.managers.progress) {
            window.englishFlashcardsApp.managers.progress.toggleWordDifficulty(word);
        }
    }

    toggleBookmark(word) {
        // Implementacja w ProgressManager
        if (window.englishFlashcardsApp && window.englishFlashcardsApp.managers.progress) {
            window.englishFlashcardsApp.managers.progress.toggleWordBookmark(word);
        }
    }

    isWordBookmarked(word) {
        if (window.englishFlashcardsApp && window.englishFlashcardsApp.managers.progress) {
            return window.englishFlashcardsApp.managers.progress.isWordBookmarked(word);
        }
        return false;
    }

    openImageManager(wordId, word) {
        if (this.imageManager) {
            this.imageManager.openManagerForWord(wordId, word);
        }
    }

    deleteWordImage(wordId) {
        if (this.imageManager && confirm('Czy na pewno chcesz usunąć ten obrazek?')) {
            this.imageManager.deleteImage(wordId);
            // Odświeżenie karty
            if (window.englishFlashcardsApp) {
                window.englishFlashcardsApp.updateCard();
            }
            NotificationManager.show('Obrazek został usunięty', 'info');
        }
    }

    /**
     * Czyszczenie zasobów
     */
    cleanup() {
        this.vocabulary = null;
        this.currentWord = null;
        this.imageManager = null;
        this.audioManager = null;
    }
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlashcardManager;
}