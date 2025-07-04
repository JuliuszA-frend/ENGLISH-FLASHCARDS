/**
 * FlashcardManager - POPRAWKA WIZUALNEJ AKTUALIZACJI PRZYCISKU TRUDNOŚCI
 * Główna zmiana: dodano animację i natychmiastową aktualizację przycisku
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
        const currentDifficulty = this.getWordDifficulty(word);
        if (currentDifficulty) {
            const difficultyEl = this.createElement('div', 'difficulty-badge');
            difficultyEl.classList.add(`difficulty-${currentDifficulty}`);
            difficultyEl.textContent = this.getDifficultyLabel(currentDifficulty);
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
     * ✨ NAPRAWIONE: Dodawanie kontrolek słowa z pełną obsługą trudności
     */
    addWordControls(container, word) {
        const controlsEl = this.createElement('div', 'word-controls');

        // ⭐ NAPRAWIONY przycisk trudności - z pełną obsługą
        const difficultyBtn = this.createElement('button', 'control-btn difficulty-btn');
        
        // 📊 Pobierz aktualny poziom trudności
        const currentDifficulty = this.getWordDifficulty(word);
        
        // 🎨 Ustaw wygląd przycisku na podstawie aktualnej trudności
        this.updateDifficultyButton(difficultyBtn, currentDifficulty);
        
        // 🔧 NAPRAWIONY event listener z pełną obsługą
        difficultyBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Zatrzymaj propagację by nie obracać karty
            console.log(`⭐ Kliknięto przycisk trudności dla słowa: ${word.english}`);
            
            // ✨ NOWE: Dodaj animację kliknięcia
            this.addClickAnimation(difficultyBtn);
            
            // 📝 Toggle difficulty i otrzymaj nowy poziom
            const newDifficulty = this.toggleDifficulty(word);
            
            // 🎨 Natychmiast zaktualizuj wizualnie przycisk z animacją
            setTimeout(() => {
                this.updateDifficultyButton(difficultyBtn, newDifficulty);
                this.addChangeAnimation(difficultyBtn);
                
                // ✨ NOWE: Aktualizuj również badge na przodzie karty
                this.updateDifficultyBadge(word);
            }, 100);
            
            // 📢 Pokaż powiadomienie użytkownikowi
            this.showDifficultyNotification(word, newDifficulty);
            
            console.log(`✅ Trudność zmieniona na: ${newDifficulty} dla słowa: ${word.english}`);
        });

        // ✅ NAPRAWIONY przycisk ulubionych
        const bookmarkBtn = this.createElement('button', 'control-btn bookmark-btn');
        
        // 📊 Sprawdź aktualny stan bookmark
        const isBookmarked = this.isWordBookmarked(word);
        
        // 🎨 Uaktualnij ikonę i tekst na podstawie stanu
        this.updateBookmarkButton(bookmarkBtn, isBookmarked);
        
        // 🔧 NAPRAWIONY event listener
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Zatrzymaj propagację by nie obracać karty
            console.log(`🔖 Kliknięto bookmark dla słowa: ${word.english}`);
            
            // ✨ NOWE: Dodaj animację kliknięcia
            this.addClickAnimation(bookmarkBtn);
            
            // 📝 Toggle bookmark i otrzymaj nowy stan
            const newState = this.toggleBookmark(word);
            
            // 🎨 Natychmiast zaktualizuj wizualnie przycisk
            setTimeout(() => {
                this.updateBookmarkButton(bookmarkBtn, newState);
                this.addChangeAnimation(bookmarkBtn);
            }, 100);
            
            // 📢 Pokaż powiadomienie użytkownikowi
            this.showBookmarkNotification(word, newState);
            
            // 📊 Zaktualizuj statystyki w aplikacji
            if (window.englishFlashcardsApp) {
                window.englishFlashcardsApp.updateStats();
            }
            
            console.log(`✅ Bookmark ${newState ? 'dodany' : 'usunięty'} dla słowa: ${word.english}`);
        });

        // 📎 Dodaj przyciski do kontenera
        controlsEl.appendChild(difficultyBtn);
        controlsEl.appendChild(bookmarkBtn);
        container.appendChild(controlsEl);
    }

    /**
     * ✨ NOWA METODA: Animacja kliknięcia
     */
    addClickAnimation(button) {
        // Usuń poprzednie animacje
        button.classList.remove('click-animation', 'change-animation');
        
        // Dodaj animację kliknięcia
        button.classList.add('click-animation');
        
        // Usuń animację po zakończeniu
        setTimeout(() => {
            button.classList.remove('click-animation');
        }, 200);
    }

    /**
     * ✨ NOWA METODA: Animacja zmiany
     */
    addChangeAnimation(button) {
        // Dodaj animację zmiany
        button.classList.add('change-animation');
        
        // Usuń animację po zakończeniu
        setTimeout(() => {
            button.classList.remove('change-animation');
        }, 600);
    }

    /**
     * ✨ NOWA METODA: Pobranie aktualnego poziomu trudności słowa
     */
    getWordDifficulty(word) {
        // Najpierw sprawdź ProgressManager (aktualny stan)
        if (window.englishFlashcardsApp && window.englishFlashcardsApp.managers.progress) {
            try {
                const currentDifficulty = window.englishFlashcardsApp.managers.progress.getWordDifficulty(word);
                return currentDifficulty;
            } catch (error) {
                console.warn('⚠️ Błąd pobierania trudności z ProgressManager:', error);
            }
        }
        
        // Fallback - oryginalna trudność słowa
        return word.difficulty || 'medium';
    }

    /**
     * ✨ NOWA METODA: Aktualizacja wyglądu przycisku trudności z animacją
     */
    updateDifficultyButton(button, difficulty) {
        // 🎨 Różne ikony i kolory dla różnych poziomów trudności
        const difficultyConfig = {
            'easy': { icon: '⭐', text: 'Łatwe', class: 'easy' },
            'medium': { icon: '⭐⭐', text: 'Średnie', class: 'medium' },
            'hard': { icon: '⭐⭐⭐', text: 'Trudne', class: 'hard' }
        };
        
        const config = difficultyConfig[difficulty] || difficultyConfig['medium'];
        
        // 📝 Aktualizuj zawartość przycisku z płynną animacją
        const currentIcon = button.querySelector('.icon');
        const currentText = button.querySelector('.text');
        
        if (currentIcon && currentText) {
            // Animacja zmiany zawartości
            button.style.transform = 'scale(0.95)';
            button.style.opacity = '0.7';
            
            setTimeout(() => {
                currentIcon.textContent = config.icon;
                currentText.textContent = config.text;
                
                // 🎭 Aktualizuj klasy CSS dla stylowania
                button.classList.remove('easy', 'medium', 'hard');
                button.classList.add(config.class);
                
                // Przywróć normalny wygląd
                button.style.transform = 'scale(1)';
                button.style.opacity = '1';
            }, 150);
        } else {
            // Fallback - ustaw zawartość bezpośrednio
            button.innerHTML = `
                <span class="icon">${config.icon}</span>
                <span class="text">${config.text}</span>
            `;
            
            // 🎭 Aktualizuj klasy CSS dla stylowania
            button.classList.remove('easy', 'medium', 'hard');
            button.classList.add(config.class);
        }
        
        // ♿ Accessibility - screen readers
        button.setAttribute('aria-label', `Poziom trudności: ${config.text}`);
        button.setAttribute('title', `Poziom trudności: ${config.text}. Kliknij aby zmienić.`);
        
        console.log(`🎨 Zaktualizowano przycisk trudności: ${difficulty} (${config.text})`);
    }

    /**
     * ✨ NOWA METODA: Powiadomienia o zmianie trudności
     */
    showDifficultyNotification(word, newDifficulty) {
        // 📢 Sprawdź czy NotificationManager jest dostępny
        if (window.NotificationManager) {
            const difficultyLabels = {
                'easy': 'Łatwe',
                'medium': 'Średnie', 
                'hard': 'Trudne'
            };
            
            const label = difficultyLabels[newDifficulty] || newDifficulty;
            const icon = {
                'easy': '⭐',
                'medium': '⭐⭐', 
                'hard': '⭐⭐⭐'
            }[newDifficulty] || '⭐';
            
            const message = `${icon} "${word.english}" → ${label}`;
            
            // 🎯 Pokaż powiadomienie przez 2 sekundy
            window.NotificationManager.show(message, 'info', 2000);
        }
    }

    /**
     * ✅ POPRAWIONA METODA: toggleDifficulty()
     * Dodaj aktualizację UI quizów po zmianie trudności
     */

    // ZASTĄP w flashcard-manager.js metodę toggleDifficulty():
    toggleDifficulty(word) {
        // 🛡️ Sprawdź czy ProgressManager jest dostępny
        if (!window.englishFlashcardsApp || !window.englishFlashcardsApp.managers.progress) {
            console.error('❌ ProgressManager nie jest dostępny');
            if (window.NotificationManager) {
                window.NotificationManager.show('Błąd: Nie można zmienić trudności', 'error');
            }
            return this.getWordDifficulty(word); // Zwróć aktualną trudność
        }
        
        try {
            // 📊 Zapisz stan przed zmianą (dla porównania)
            const oldDifficulty = this.getWordDifficulty(word);
            
            // ✅ Wywołaj toggle w ProgressManager i otrzymaj nowy poziom
            const newDifficulty = window.englishFlashcardsApp.managers.progress.toggleWordDifficulty(word);
            
            console.log(`🔄 Toggle difficulty: ${word.english} → ${oldDifficulty} → ${newDifficulty}`);
            
            // ✅ NOWE: Aktualizuj UI quizów trudności po zmianie
            if (window.englishFlashcardsApp.updateDifficultyQuizUI) {
                console.log('🎨 Aktualizuję UI quizów trudności...');
                window.englishFlashcardsApp.updateDifficultyQuizUI();
            } else {
                console.warn('⚠️ Metoda updateDifficultyQuizUI nie jest dostępna');
            }
            
            // ✅ NOWE: Wyślij event globalny o zmianie trudności
            document.dispatchEvent(new CustomEvent('wordDifficultyChanged', {
                detail: { 
                    word: word, 
                    oldDifficulty: oldDifficulty,
                    newDifficulty: newDifficulty,
                    wordKey: window.englishFlashcardsApp.managers.progress.getWordKey(word)
                }
            }));
            
            console.log(`📢 Event wordDifficultyChanged wysłany dla: ${word.english}`);
            
            return newDifficulty;
            
        } catch (error) {
            console.error('❌ Błąd podczas toggle difficulty:', error);
            
            if (window.NotificationManager) {
                window.NotificationManager.show('Błąd podczas zmiany trudności', 'error');
            }
            
            return this.getWordDifficulty(word); // Zwróć aktualną trudność jako fallback
        }
    }

    /**
     * ✨ NOWA METODA: Odświeżenie stanu przycisku trudności (do użycia zewnętrznego)
     */
    refreshDifficultyState(word) {
        const difficultyBtn = document.querySelector('.difficulty-btn');
        if (difficultyBtn && word) {
            const currentDifficulty = this.getWordDifficulty(word);
            this.updateDifficultyButton(difficultyBtn, currentDifficulty);
        }
    }

    updateBookmarkButton(button, isBookmarked) {
        // 🎨 Różne ikony dla różnych stanów
        const icon = isBookmarked ? '🔖' : '⚪'; // Wypełniona vs pusta ikona
        const text = isBookmarked ? 'Usuń z trybu powtórki' : 'Dodaj do powtórek';
        const className = isBookmarked ? 'bookmarked' : 'not-bookmarked';
        
        // 📝 Aktualizuj zawartość przycisku
        button.innerHTML = `
            <span class="icon">${icon}</span>
            <span class="text">${text}</span>
        `;
        
        // 🎭 Dodaj/usuń klasę CSS dla stylowania
        button.classList.toggle('active', isBookmarked);
        button.classList.toggle('bookmarked', isBookmarked);
        
        // ♿ Accessibility - screen readers
        button.setAttribute('aria-pressed', isBookmarked);
        button.setAttribute('title', text);
    }

    /**
     * ✨ NOWA METODA: Powiadomienia o zmianie stanu bookmark
     */
    showBookmarkNotification(word, isBookmarked) {
        // 📢 Sprawdź czy NotificationManager jest dostępny
        if (window.NotificationManager) {
            const message = isBookmarked 
                ? `"${word.english}" dodane do powtórek 🔖`
                : `"${word.english}" usunięte z powtórek ⚪`;
            
            const type = isBookmarked ? 'success' : 'info';
            
            // 🎯 Pokaż powiadomienie przez 3 sekundy
            window.NotificationManager.show(message, type, 3000);
        }
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

    toggleBookmark(word) {
        // 🛡️ Sprawdź czy ProgressManager jest dostępny
        if (!window.englishFlashcardsApp || !window.englishFlashcardsApp.managers.progress) {
            console.error('❌ ProgressManager nie jest dostępny');
            if (window.NotificationManager) {
                window.NotificationManager.show('Błąd: Nie można zapisać do powtórki', 'error');
            }
            return false;
        }
        
        try {
            // ✅ NOWE: Sprawdź stan przed usunięciem/dodaniem
            const wasInBookmarksMode = window.englishFlashcardsApp.state?.bookmarksOnlyMode || false;
            const bookmarksCountBefore = window.englishFlashcardsApp.managers.progress.getAllBookmarkedWords().length;
            const isCurrentlyBookmarked = window.englishFlashcardsApp.managers.progress.isWordBookmarked(word);
            
            console.log(`🔖 Stan przed toggle: tryb=${wasInBookmarksMode}, liczba=${bookmarksCountBefore}, będzie_usunięte=${isCurrentlyBookmarked}`);
            
            // Sprawdź czy usuwamy ostatnie słowo w trybie powtórki
            const willBeLastBookmark = isCurrentlyBookmarked && bookmarksCountBefore === 1;
            
            // 📝 Wywołaj toggle w ProgressManager
            const newState = window.englishFlashcardsApp.managers.progress.toggleWordBookmark(word);
            
            console.log(`🔄 Toggle bookmark: ${word.english} → ${newState ? 'dodany' : 'usunięty'}`);
            
            // ✅ NOWE: Wyjdź z trybu powtórki jeśli usunięto ostatnie słowo
            if (wasInBookmarksMode && willBeLastBookmark && !newState) {
                console.log('🚪 To było ostatnie słowo w trybie powtórki - wychodzimy z trybu');
                
                // Wyjdź z trybu powtórki
                if (window.englishFlashcardsApp.exitBookmarksOnlyMode) {
                    window.englishFlashcardsApp.exitBookmarksOnlyMode();
                    
                    // Pokaż powiadomienie z opóźnieniem
                    setTimeout(() => {
                        if (window.NotificationManager) {
                            window.NotificationManager.show(
                                '🚪 Wyszedłeś z trybu powtórki - brak słów do nauki', 
                                'info', 
                                4000
                            );
                        }
                    }, 800);
                } else {
                    console.error('❌ Metoda exitBookmarksOnlyMode nie jest dostępna');
                }
            }
            
            return newState;
            
        } catch (error) {
            console.error('❌ Błąd podczas toggle bookmark:', error);
            
            if (window.NotificationManager) {
                window.NotificationManager.show('Błąd podczas zapisywania powtórki', 'error');
            }
            
            return false;
        }
    }

    isWordBookmarked(word) {
        // 🛡️ Sprawdź czy ProgressManager jest dostępny
        if (!window.englishFlashcardsApp || !window.englishFlashcardsApp.managers.progress) {
            console.warn('⚠️ ProgressManager nie jest dostępny');
            return false;
        }
        
        try {
            const isBookmarked = window.englishFlashcardsApp.managers.progress.isWordBookmarked(word);
            console.log(`🔍 Sprawdzam bookmark dla ${word.english}: ${isBookmarked}`);
            return isBookmarked;
            
        } catch (error) {
            console.error('❌ Błąd podczas sprawdzania bookmark:', error);
            return false;
        }
    }

    refreshBookmarkState(word) {
        const bookmarkBtn = document.querySelector('.bookmark-btn');
        if (bookmarkBtn && word) {
            const isBookmarked = this.isWordBookmarked(word);
            this.updateBookmarkButton(bookmarkBtn, isBookmarked);
        }
    }


    updateDifficultyBadge(word) {
        const difficultyBadge = document.querySelector('.difficulty-badge');
        if (!difficultyBadge || !word) return;
        
        // 📊 Pobierz aktualną trudność
        const currentDifficulty = this.getWordDifficulty(word);
        
        // 🎨 Aktualizuj klasy CSS
        difficultyBadge.className = 'difficulty-badge'; // Reset klas
        difficultyBadge.classList.add(`difficulty-${currentDifficulty}`);
        
        // 📝 Aktualizuj tekst
        difficultyBadge.textContent = this.getDifficultyLabel(currentDifficulty);
        
        // ✨ Dodaj efekt wizualny zmiany
        difficultyBadge.style.transform = 'scale(1.1)';
        difficultyBadge.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            difficultyBadge.style.transform = 'scale(1)';
        }, 300);
        
        console.log(`🎨 Zaktualizowano badge trudności na przodzie: ${currentDifficulty}`);
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