/**
 * English Flashcards B1/B2 - Main Application
 * Główna aplikacja do nauki angielskiego
 * 
 * @version 1.0.0
 * @author English Learning App
 */

class EnglishFlashcardsApp {
    constructor() {
        this.state = {
            currentMode: 'flashcards',
            currentCategory: null,
            currentWordIndex: 0,
            isFlipped: false,
            isLoading: true,
            vocabulary: null,
            categories: null,
            settings: null,
            bookmarksOnlyMode: false, // ✨ NOWE: Stan trybu ulubionych
            bookmarkedWordsQueue: [], // ✨ NOWE: Kolejka ulubionych słów do nauki
            bookmarksQueueIndex: 0,   // ✨ NOWE: Indeks w kolejce ulubionych
            bookmarksController: null
        };

        this.managers = {};
        this.eventListeners = new Map();
        
        this.init();
    }

    /**
     * Inicjalizacja aplikacji
     */
    async init() {
        try {
            this.showLoadingScreen(true);
            await this.initializeManagers();
            await this.loadData();
            this.state.settings = this.loadSettings();
            this.setupEventListeners();
            this.initializeUI();
            this.showLoadingScreen(false);
            this.showWelcomeMessage();
        } catch (error) {
            console.error('Błąd inicjalizacji aplikacji:', error);
            NotificationManager.show('Błąd podczas ładowania aplikacji', 'error');
        }
    }

    /**
     * Inicjalizacja menedżerów - POPRAWIONA WERSJA
     */
    async initializeManagers() {
        // ThemeManager - sprawdź czy już istnieje instancja, jeśli nie - utwórz
        if (window.themeManagerInstance) {
            this.managers.theme = window.themeManagerInstance;
            console.log('✅ Używam istniejącej instancji ThemeManager');
        } else {
            this.managers.theme = new ThemeManager();
            this.managers.theme.init();
            console.log('✅ Utworzono nową instancję ThemeManager');
        }

        // Ładowanie danych
        this.managers.dataLoader = new DataLoader();
        
        // Menedżer postępu
        this.managers.progress = new ProgressManager();
        
        // AUDIO MANAGER - WAŻNE: inicjalizuj przed FlashcardManager
        console.log('🔊 Inicjalizuję AudioManager...');
        this.managers.audio = new AudioManager();

        // Test audio po inicjalizacji
        setTimeout(async () => {
            const testResults = await this.managers.audio.testAudio();
            console.log('🧪 Wyniki testów audio:', testResults);
            
            const workingMethods = Object.entries(testResults)
                .filter(([_, works]) => works)
                .map(([method, _]) => method);
                
            if (workingMethods.length > 0) {
                console.log(`✅ Działające metody audio: ${workingMethods.join(', ')}`);
            } else {
                console.warn('⚠️ Żadna metoda audio nie działa - sprawdź ustawienia przeglądarki');
            }
        }, 2000);
        
        // Menedżer obrazków
        this.managers.image = new ImageManager();
        
        // Menedżer fiszek
        this.managers.flashcard = new FlashcardManager();
        this.managers.flashcard.setManagers(this.managers.image, this.managers.audio);
        
        // Menedżer quizów
        this.managers.quiz = new QuizManager();
        
        console.log('🔖 Inicjalizuję BookmarksController...');

        // Sprawdź czy BookmarksController jest dostępny
        if (typeof BookmarksController !== 'undefined') {
            this.bookmarksController = new BookmarksController(this);
            console.log('✅ BookmarksController zainicjalizowany');
        } else {
            console.warn('⚠️ BookmarksController nie jest dostępny');
        }
        console.log('✅ Wszystkie menedżery zainicjalizowane');

        
    }

    /**
     * Ładowanie danych słownictwa
     */
    async loadData() {
        try {
            this.updateLoadingMessage('Ładowanie słownictwa...');
            this.state.vocabulary = await this.managers.dataLoader.loadVocabulary();
            
            this.updateLoadingMessage('Ładowanie kategorii...');
            this.state.categories = await this.managers.dataLoader.loadCategories();
            
            // Ustawienie domyślnej kategorii
            const firstCategory = Object.keys(this.state.vocabulary.categories)[0];
            this.state.currentCategory = firstCategory;
            
            this.updateLoadingMessage('Inicjalizacja menedżerów...');
            
            // Przekazanie danych do menedżerów
            this.managers.flashcard.setVocabulary(this.state.vocabulary);
            this.managers.quiz.setVocabulary(this.state.vocabulary);
            this.managers.progress.setVocabulary(this.state.vocabulary);
            
        } catch (error) {
            console.error('Błąd ładowania danych:', error);
            throw new Error('Nie udało się załadować danych słownictwa');
        }
    }

    /**
     * Konfiguracja nasłuchiwaczy zdarzeń
     */
    setupEventListeners() {
        // Mode switching
        this.addEventListeners([
            ['flashcards-mode', 'click', () => this.switchMode('flashcards')],
            ['quiz-mode', 'click', () => this.switchMode('quiz')],
            ['sentences-mode', 'click', () => this.switchMode('sentences')]
        ]);

        // Navigation
        this.addEventListeners([
            ['prev-btn', 'click', () => this.previousCard()],
            ['next-btn', 'click', () => this.nextCard()],
            ['flip-btn', 'click', () => this.flipCard()],
            ['shuffle-btn', 'click', () => this.shuffleCards()],
            ['reset-btn', 'click', () => this.resetCategory()]
        ]);

        // Controls
        this.addEventListeners([
            ['theme-toggle', 'click', () => this.managers.theme.toggle()],
            ['stats-toggle', 'click', () => this.toggleStats()],
            ['settings-toggle', 'click', () => this.toggleSettings()]
        ]);

        // Modal controls
        this.addEventListeners([
            ['settings-close', 'click', () => this.closeModal('settings')],
            ['image-modal-close', 'click', () => this.closeModal('image')],
            ['modal-overlay', 'click', (e) => this.handleModalOverlayClick(e)]
        ]);

        // Settings
        this.addEventListeners([
            ['auto-audio', 'change', (e) => this.updateSetting('autoAudio', e.target.checked)],
            ['show-phonetics', 'change', (e) => this.updateSetting('showPhonetics', e.target.checked)],
            ['quiz-difficulty', 'change', (e) => this.updateSetting('quizDifficulty', e.target.value)],
            ['quiz-language', 'change', (e) => this.updateSetting('quizLanguage', e.target.value)]
        ]);

        // Search
        this.addEventListener('category-search', 'input', 
            Utils.debounce((e) => this.filterCategories(e.target.value), 300)
        );

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Card interactions
        this.addEventListener('flashcard', 'click', (e) => this.handleCardClick(e));

        this.addEventListener('bookmarks-toggle', 'click', () => this.openBookmarks());

        // Quiz events
        this.setupQuizEventListeners();

        this.setupBookmarksEventListeners();

        const bookmarksModeToggle = document.getElementById('bookmarks-mode-toggle');
        if (bookmarksModeToggle) {
            bookmarksModeToggle.addEventListener('click', () => {
                if (this.state.bookmarksOnlyMode) {
                    this.exitBookmarksOnlyMode();
                } else {
                    this.startBookmarksOnlyMode();
                }
            });
        }

        // Settings actions
        this.addEventListeners([
            ['export-data', 'click', () => this.exportData()],
            ['import-data', 'click', () => this.importData()],
            ['reset-all-data', 'click', () => this.resetAllData()]
        ]);

        this.setupAudioListeners();
    }

    /**
     * Konfiguracja nasłuchiwaczy quizów
     */
    setupQuizEventListeners() {
        // Quiz navigation
        this.addEventListeners([
            ['quiz-submit-btn', 'click', () => this.submitQuizAnswer()],
            ['sentence-submit-btn', 'click', () => this.submitSentenceAnswer()],
            ['quiz-next-btn', 'click', () => this.nextQuizQuestion()],
            ['quiz-retry-btn', 'click', () => this.retryQuiz()],
            ['quiz-continue-btn', 'click', () => this.continueAfterQuiz()]
        ]);

        // Quiz input handling
        this.addEventListener('quiz-answer-input', 'keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('quiz-submit-btn').disabled) {
                this.submitQuizAnswer();
            }
        });

        this.addEventListener('sentence-answer', 'keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.submitSentenceAnswer();
            }
        });

        // Special quiz buttons
        this.addEventListeners([
            ['random-quiz-btn', 'click', () => this.startRandomQuiz()],
            ['difficult-words-quiz', 'click', () => this.startDifficultWordsQuiz()],
            ['final-quiz-btn', 'click', () => this.startFinalQuiz()]
        ]);
    }

    /**
     * Pomocnicza metoda do dodawania nasłuchiwaczy
     */
    addEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
            
            // Przechowywanie referencji do późniejszego czyszczenia
            if (!this.eventListeners.has(elementId)) {
                this.eventListeners.set(elementId, []);
            }
            this.eventListeners.get(elementId).push({ event, handler });
        }
    }

    setupBookmarksEventListeners() {
        console.log('🔖 Konfigurowanie event listeners dla bookmarks...');
        
        // 📝 Przycisk otwierania modala ulubionych w header
        this.addEventListener('bookmarks-toggle', 'click', () => this.openBookmarks());
        
        // 📝 Przycisk "Ulubione" w statystykach
        this.addEventListener('bookmarks-stats-btn', 'click', () => this.openBookmarks());
        
        // 🔄 Event listener dla aktualizacji bookmarks
        document.addEventListener('bookmarkChanged', (e) => {
            console.log('🔄 Bookmark changed event:', e.detail);
            this.handleBookmarkChange(e.detail);
        });
        
        // 📊 Event listener dla odświeżenia statystyk po zmianie bookmarks
        document.addEventListener('bookmarksUpdated', () => {
            console.log('📊 Bookmarks updated - odświeżam statystyki');
            this.updateStats();
            this.updateBookmarksCount();
        });
    }

    /**
     * Dodawanie wielu nasłuchiwaczy
     */
    addEventListeners(listeners) {
        listeners.forEach(([elementId, event, handler]) => {
            this.addEventListener(elementId, event, handler);
        });
    }

    /**
     * Inicjalizacja interfejsu użytkownika
     */
    initializeUI() {
        this.renderCategories();
        this.renderCategoryQuizzes();
        this.updateModeDisplay();
        this.updateCard();
        this.updateProgress();
        this.updateStats();
        this.applySettings();
        this.initializeBookmarksUI();
    }

    /**
     * ✨ NOWA METODA: Inicjalizacja UI bookmarks
     */
    initializeBookmarksUI() {
        console.log('🔖 Inicjalizuję UI bookmarks...');
        
        // 📊 Aktualizuj licznik bookmarks
        this.updateBookmarksCount();
        
        // 🎨 Dodaj wskaźnik trybu ulubionych jeśli aktywny
        if (this.state.bookmarksOnlyMode) {
            this.showBookmarksOnlyModeIndicator();
        }
        
        console.log('✅ UI bookmarks zainicjalizowane');
    }

    /**
     * 🎯 Pokazanie wskaźnika trybu ulubionych
     */
    showBookmarksOnlyModeIndicator() {
        // 📝 Dodaj wskaźnik do UI że jesteśmy w trybie ulubionych
        const indicator = document.createElement('div');
        indicator.id = 'bookmarks-mode-indicator';
        indicator.className = 'mode-indicator';
        indicator.innerHTML = `
            <span class="icon">🔖</span>
            <span class="text">Tryb ulubionych</span>
            <button class="close-btn" onclick="window.englishFlashcardsApp.exitBookmarksOnlyMode()">&times;</button>
        `;
        
        // 📍 Wstaw na górze aplikacji
        const header = document.querySelector('.app-header');
        if (header) {
            header.appendChild(indicator);
        }
    }

    /**
     * Renderowanie kategorii
     */
    renderCategories() {
        const grid = document.getElementById('category-grid');
        if (!grid || !this.state.vocabulary) return;

        const categories = this.state.vocabulary.categories;
        let html = '';

        Object.entries(categories).forEach(([key, category]) => {
            // ✅ POPRAWKA: Używaj managers.progress zamiast bezpośredniego dostępu
            const progress = this.managers.progress.getCategoryProgress(key);
            const progressPercent = Math.round((progress.studied / progress.total) * 100);
            
            // ✅ NOWE: Sprawdzenie czy kategoria ma słowa
            const hasWords = category.words && Array.isArray(category.words) && category.words.length > 0;
            const wordCount = hasWords ? category.words.length : 0;
            
            // ✅ NOWE: Logowanie dla debugowania
            console.log(`🎯 Renderuję kategorię ${key}:`, {
                name: category.name,
                wordCount: wordCount,
                progress: progress,
                progressPercent: progressPercent
            });
            
            html += `
                <div class="category-card ${this.state.currentCategory === key ? 'active' : ''}" 
                    data-category="${key}">
                    <div class="category-icon">${category.icon || '📚'}</div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-description">${category.description || 'Brak opisu'}</div>
                    <div class="category-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%; background: ${progressPercent === 100 ? '#22c55e' : '#3b82f6'}; transition: width 0.3s ease;"></div>
                        </div>
                        <span class="progress-text">${progress.studied}/${progress.total}</span>
                        ${progressPercent === 100 ? '<span class="completed-badge">✅</span>' : ''}
                    </div>
                    ${!hasWords ? '<div class="no-words-warning">⚠️ Brak słów</div>' : ''}
                </div>
            `;
        });

        grid.innerHTML = html;

        // Dodanie nasłuchiwaczy do kart kategorii
        grid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.switchCategory(category);
            });
        });
        
        // ✅ NOWE: Aktualizuj statystyki po renderowaniu
        this.updateCategoryStatistics();
    }

    /**
     * Renderowanie quizów kategorii
     */
    renderCategoryQuizzes() {
        const grid = document.getElementById('category-quiz-grid');
        if (!grid || !this.state.vocabulary) return;

        const categories = this.state.vocabulary.categories;
        let html = '';

        Object.entries(categories).forEach(([key, category]) => {
            const quizResults = this.managers.quiz.getCategoryResults(key);
            const isCompleted = quizResults && quizResults.passed;
            const statusText = quizResults 
                ? `${quizResults.score}/${quizResults.total} (${quizResults.percentage}%)`
                : 'Nie ukończony';

            html += `
                <div class="quiz-card ${isCompleted ? 'completed' : ''}" data-quiz="${key}">
                    <div class="quiz-icon">${category.icon}</div>
                    <div class="quiz-name">${category.name}</div>
                    <div class="quiz-description">15 pytań, zalicz 12</div>
                    <div class="quiz-status">${statusText}</div>
                    ${isCompleted ? '<div class="completion-badge">✅</div>' : ''}
                </div>
            `;
        });

        grid.innerHTML = html;

        // Dodanie nasłuchiwaczy
        grid.querySelectorAll('.quiz-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.quiz;
                this.startCategoryQuiz(category);
            });
        });
    }

    /**
     * Przełączanie trybu aplikacji
     */
    switchMode(mode) {
        if (this.state.currentMode === mode) return;

        this.state.currentMode = mode;
        this.updateModeDisplay();
        this.saveState();

        NotificationManager.show(`Przełączono na tryb: ${this.getModeDisplayName(mode)}`, 'info');
    }

    /**
     * Aktualizacja wyświetlania trybu
     */
    updateModeDisplay() {
        // Aktualizacja przycisków trybu
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.state.currentMode);
        });

        // Pokazywanie/ukrywanie sekcji
        const elements = {
            'category-selector': this.state.currentMode === 'flashcards' || this.state.currentMode === 'sentences',
            'quiz-selector': this.state.currentMode === 'quiz',
            'flashcard-container': this.state.currentMode === 'flashcards' || this.state.currentMode === 'sentences',
            'navigation-controls': this.state.currentMode === 'flashcards' || this.state.currentMode === 'sentences',
            'progress-display': this.state.currentMode === 'flashcards' || this.state.currentMode === 'sentences'
        };

        Object.entries(elements).forEach(([id, show]) => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = show ? 'block' : 'none';
            }
        });

        // Ukrywanie kontenerów quizu
        ['quiz-container', 'quiz-results'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }

    /**
     * Przełączanie kategorii
     */
    switchCategory(category) {
        if (!this.state.vocabulary.categories[category]) return;

        this.state.currentCategory = category;
        this.state.currentWordIndex = 0;
        this.state.isFlipped = false;

        this.updateCard();
        this.updateProgress();
        this.renderCategories(); // Odświeżenie aktywnej kategorii
        this.saveState();

        const categoryName = this.state.vocabulary.categories[category].name;
        NotificationManager.show(`Przełączono na kategorię: ${categoryName}`, 'info');
    }

    /**
     * Aktualizacja karty
     */
    updateCard() {
        if (!this.state.vocabulary) return;

        let word = null;
        
        // 🔖 Sprawdź czy jesteśmy w trybie ulubionych
        if (this.state.bookmarksOnlyMode && this.state.bookmarkedWordsQueue && this.state.bookmarkedWordsQueue.length > 0) {
            // Pobierz słowo z kolejki ulubionych
            const bookmarkedWord = this.state.bookmarkedWordsQueue[this.state.bookmarksQueueIndex];
            
            if (bookmarkedWord) {
                word = bookmarkedWord;
                // Znajdź oryginalne słowo w słowniku, aby mieć pełne dane (jeśli to konieczne)
                // W tym przypadku `getAllBookmarkedWords` zwraca już pełny obiekt, więc jest OK.
                console.log(`🔖 Tryb ulubionych: wyświetlam słowo ${this.state.bookmarksQueueIndex + 1}/${this.state.bookmarkedWordsQueue.length}: ${word.english}`);
            } else {
                // Jeśli z jakiegoś powodu słowa nie ma, wyjdź z trybu
                console.warn('⚠️ Nie znaleziono słowa w kolejce ulubionych. Wychodzę z trybu.');
                this.exitBookmarksOnlyMode();
                return;
            }
        } else {
            // Standardowy tryb - pobierz z kategorii
            if (!this.state.currentCategory) return;
            
            const category = this.state.vocabulary.categories[this.state.currentCategory];
            if (!category || !category.words || category.words.length === 0) {
                console.warn(`⚠️ Kategoria ${this.state.currentCategory} nie ma słów.`);
                // Można tu wyświetlić jakąś informację na karcie
                return;
            }
            
            word = category.words[this.state.currentWordIndex];
        }

        if (!word) {
            console.warn('⚠️ Nie można znaleźć słowa do wyświetlenia');
            return;
        }

        // Wyświetl słowo
        this.managers.flashcard.displayWord(word, this.state.currentMode);
        this.resetCardFlip();
        
        // Zaktualizuj wskaźniki postępu
        this.updateProgress();
    }

    /**
     * Resetowanie obrotu karty
     */
    resetCardFlip() {
        this.state.isFlipped = false;
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.classList.remove('flipped');
        }
    }

    /**
     * Obracanie karty
     */
    flipCard() {
        this.state.isFlipped = !this.state.isFlipped;
        const flashcard = document.getElementById('flashcard');
        
        if (flashcard) {
            flashcard.classList.toggle('flipped', this.state.isFlipped);
        }

        // Oznaczenie jako przejrzane gdy karta zostanie obrócona
        if (this.state.isFlipped) {
            const wasStudied = this.managers.progress.markWordAsStudied(
                this.state.currentCategory, 
                this.state.currentWordIndex
            );
            
            // ✅ NOWE: Odśwież progress tylko jeśli słowo było nowe
            if (wasStudied) {
                this.refreshCategoryProgress(this.state.currentCategory);
                this.updateStats();
            }
        }

        // Automatyczne audio jeśli włączone
        if (this.state.settings.autoAudio && this.state.isFlipped) {
            const category = this.state.vocabulary.categories[this.state.currentCategory];
            const word = category.words[this.state.currentWordIndex];
            if (word && word.audio) {
                this.managers.audio.playAudio(word.english);
            }
        }
    }

    /**
     * ✅ NOWA METODA: Aktualizacja statystyk kategorii
     */
    updateCategoryStatistics() {
        if (!this.managers.progress || !this.state.vocabulary) return;
        
        // Aktualizuj wszystkie statystyki kategorii
        this.managers.progress.updateAllCategoryStats();
        
        console.log('📊 Statystyki kategorii zaktualizowane');
    }

    /**
     * ✅ NOWA METODA: Odświeżenie pojedynczej kategorii
     */
    refreshCategoryProgress(categoryKey) {
        if (!this.managers.progress) return;
        
        const progress = this.managers.progress.getCategoryProgress(categoryKey);
        const categoryCard = document.querySelector(`[data-category="${categoryKey}"]`);
        
        if (categoryCard) {
            const progressFill = categoryCard.querySelector('.progress-fill');
            const progressText = categoryCard.querySelector('.progress-text');
            const progressPercent = Math.round((progress.studied / progress.total) * 100);
            
            if (progressFill) {
                progressFill.style.width = `${progressPercent}%`;
                progressFill.style.background = progressPercent === 100 ? '#22c55e' : '#3b82f6';
            }
            
            if (progressText) {
                progressText.textContent = `${progress.studied}/${progress.total}`;
            }
            
            // Dodaj badge dla ukończonych kategorii
            const existingBadge = categoryCard.querySelector('.completed-badge');
            if (progressPercent === 100 && !existingBadge) {
                const badge = document.createElement('span');
                badge.className = 'completed-badge';
                badge.textContent = '✅';
                categoryCard.querySelector('.category-progress').appendChild(badge);
            } else if (progressPercent < 100 && existingBadge) {
                existingBadge.remove();
            }
            
            console.log(`🔄 Odświeżono progress kategorii ${categoryKey}: ${progress.studied}/${progress.total}`);
        }
    }

    /**
     * Następna karta
     */
    /**
 * 🔖 POPRAWKI DLA TRYBU ULUBIONYCH - Dodaj do app.js
 * Te metody zastąpią istniejące w Twojej aplikacji
 */

    /**
     * ✅ POPRAWIONA METODA: updateCard() z obsługą trybu ulubionych
     */
    updateCard() {
        if (!this.state.vocabulary) return;

        let word = null;
        
        // 🔖 Sprawdź czy jesteśmy w trybie ulubionych
        if (this.state.bookmarksOnlyMode && this.state.bookmarkedWordsQueue) {
            // Pobierz słowo z kolejki ulubionych
            const currentBookmarkIndex = this.state.bookmarksQueueIndex || 0;
            const bookmarkedWord = this.state.bookmarkedWordsQueue[currentBookmarkIndex];
            
            if (bookmarkedWord) {
                word = bookmarkedWord;
                console.log(`🔖 Tryb ulubionych: wyświetlam słowo ${currentBookmarkIndex + 1}/${this.state.bookmarkedWordsQueue.length}: ${word.english}`);
            }
        } else {
            // Standardowy tryb - pobierz z kategorii
            if (!this.state.currentCategory) return;
            
            const category = this.state.vocabulary.categories[this.state.currentCategory];
            if (!category || !category.words) return;
            
            word = category.words[this.state.currentWordIndex];
        }

        if (!word) {
            console.warn('⚠️ Nie można znaleźć słowa do wyświetlenia');
            return;
        }

        // Wyświetl słowo
        this.managers.flashcard.displayWord(word, this.state.currentMode);
        this.resetCardFlip();
        
        // Odśwież progress tylko w trybie standardowym
        if (!this.state.bookmarksOnlyMode) {
            this.refreshCategoryProgress(this.state.currentCategory);
        }
        
        // Zaktualizuj wskaźniki postępu
        this.updateProgress();
    }

    /**
     * ✅ POPRAWIONA METODA: updateProgress() z obsługą trybu ulubionych
     */
    updateProgress() {
        let currentIndex, totalCount, categoryName;
        
        // 🔖 Tryb ulubionych
        if (this.state.bookmarksOnlyMode && this.state.bookmarkedWordsQueue) {
            currentIndex = (this.state.bookmarksQueueIndex || 0) + 1;
            totalCount = this.state.bookmarkedWordsQueue.length;
            categoryName = `Ulubione słowa (${totalCount})`;
            
            console.log(`📊 Progress w trybie ulubionych: ${currentIndex}/${totalCount}`);
        } else {
            // Standardowy tryb
            const category = this.state.vocabulary?.categories[this.state.currentCategory];
            if (!category) return;
            
            currentIndex = this.state.currentWordIndex + 1;
            totalCount = category.words.length;
            categoryName = category.name;
        }

        // Aktualizuj elementy UI
        const currentCardEl = document.getElementById('current-card');
        const totalCardsEl = document.getElementById('total-cards');
        const progressFillEl = document.getElementById('progress-fill');
        const currentCategoryEl = document.getElementById('current-category');

        if (currentCardEl) currentCardEl.textContent = currentIndex;
        if (totalCardsEl) totalCardsEl.textContent = totalCount;
        if (currentCategoryEl) currentCategoryEl.textContent = categoryName;

        if (progressFillEl) {
            const progressPercent = (currentIndex / totalCount) * 100;
            progressFillEl.style.width = `${progressPercent}%`;
            
            // 🔖 Różne kolory dla trybu ulubionych
            if (this.state.bookmarksOnlyMode) {
                progressFillEl.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)'; // Złoty
            } else {
                progressFillEl.style.background = ''; // Domyślny
            }
        }
    }

/**
 * ✅ POPRAWIONA METODA: nextCard() z lepszą obsługą ulubionych
 */
    nextCard() {
        // 🔖 Sprawdź tryb ulubionych
        if (this.state.bookmarksOnlyMode) {
            if (this.state.bookmarksQueueIndex < this.state.bookmarkedWordsQueue.length - 1) {
                this.state.bookmarksQueueIndex++;
                this.updateCard();
            } else {
                NotificationManager.show('To ostatnie ulubione słowo!', 'info');
                if (confirm('Przejrzałeś wszystkie ulubione. Chcesz zacząć od nowa?')) {
                    this.state.bookmarksQueueIndex = 0;
                    this.updateCard();
                } else {
                    this.exitBookmarksOnlyMode();
                }
            }
            return;
        }
        
        // Standardowa logika
        const category = this.state.vocabulary.categories[this.state.currentCategory];
        if (this.state.currentWordIndex < category.words.length - 1) {
            this.state.currentWordIndex++;
            this.updateCard();
            this.saveState();
        } else {
            NotificationManager.show('To jest ostatnia karta w kategorii', 'info');
        }
    }

    /**
     * ✅ POPRAWIONA METODA: previousCard() z obsługą ulubionych
     */
    previousCard() {
        // 🔖 Sprawdź tryb ulubionych
        if (this.state.bookmarksOnlyMode) {
            if (this.state.bookmarksQueueIndex > 0) {
                this.state.bookmarksQueueIndex--;
                this.updateCard();
            } else {
                NotificationManager.show('To pierwsze ulubione słowo!', 'info');
            }
            return;
        }
        
        // Standardowa logika
        if (this.state.currentWordIndex > 0) {
            this.state.currentWordIndex--;
            this.updateCard();
            this.saveState();
        } else {
            NotificationManager.show('To jest pierwsza karta w kategorii', 'info');
        }
    }

    /**
     * Mieszanie kart
     */
    shuffleCards() {
        const category = this.state.vocabulary.categories[this.state.currentCategory];
        category.words = Utils.shuffle(category.words);
        this.state.currentWordIndex = 0;
        this.updateCard();
        this.updateProgress();
        
        NotificationManager.show('Karty zostały wymieszane', 'info');
    }

    /**
     * Reset kategorii
     */
    resetCategory() {
        if (confirm('Czy na pewno chcesz zresetować postęp tej kategorii?')) {
            this.managers.progress.resetCategory(this.state.currentCategory);
            this.state.currentWordIndex = 0;
            this.updateCard();
            this.updateProgress();
            this.updateStats();
            
            NotificationManager.show('Postęp kategorii został zresetowany', 'info');
        }
    }

    /**
     * 🔖 Otwarcie modala ulubionych
     */
    openBookmarks() {
        console.log('🔖 Otwieranie ulubionych słów...');
        
        if (!this.bookmarksController) {
            // 🔧 Inicjalizuj jeśli jeszcze nie istnieje
            if (typeof BookmarksController !== 'undefined') {
                this.bookmarksController = new BookmarksController(this);
            } else {
                console.error('❌ BookmarksController nie jest dostępny');
                NotificationManager.show('Nie można otworzyć ulubionych - brak modułu', 'error');
                return;
            }
        }
        
        // 📂 Otwórz modal
        this.bookmarksController.openModal();
        
        // 📊 Zapisz w statystykach że użytkownik otworzył ulubione
        this.trackBookmarksUsage();
    }

    /**
     * 🔄 Aktualizacja licznika ulubionych w statystykach
     */
     updateBookmarksInStats() {
         if (this.managers.progress) {
             const stats = this.managers.progress.getBookmarkStats();
             const bookmarksCountEl = document.getElementById('total-bookmarks-stat');
             if (bookmarksCountEl) {
                 bookmarksCountEl.textContent = stats.totalBookmarks;
             }
         }
     }

    updateBookmarksModeUI(isActive) {
        const navigationControls = document.getElementById('navigation-controls');
        const toggleButton = document.getElementById('bookmarks-mode-toggle');
        const body = document.body;

        if (isActive) {
            navigationControls.classList.add('bookmarks-mode');
            toggleButton.classList.add('active');
            toggleButton.querySelector('.text').textContent = 'Wyjdź z trybu';
            toggleButton.querySelector('.icon').textContent = '❌';
            body.classList.add('bookmarks-only-mode');
        } else {
            navigationControls.classList.remove('bookmarks-mode');
            toggleButton.classList.remove('active');
            toggleButton.querySelector('.text').textContent = 'Tryb ulubionych';
            toggleButton.querySelector('.icon').textContent = '🔖';
            body.classList.remove('bookmarks-only-mode');
        }
    }

    updateBookmarksCount() {
        if (!this.managers.progress) return;
        
        try {
            const stats = this.managers.progress.getBookmarkStats();
            
            // 🏷️ Aktualizuj licznik w header (jeśli istnieje)
            const headerBadge = document.querySelector('#bookmarks-toggle .count-badge');
            if (headerBadge) {
                headerBadge.textContent = stats.totalBookmarks;
                headerBadge.style.display = stats.totalBookmarks > 0 ? 'inline' : 'none';
            }
            
            // 📊 Aktualizuj w statystykach
            const statElement = document.getElementById('total-bookmarks-stat');
            if (statElement) {
                statElement.textContent = stats.totalBookmarks;
            }
            
            console.log(`📊 Zaktualizowano licznik bookmarks: ${stats.totalBookmarks}`);
            
        } catch (error) {
            console.error('❌ Błąd aktualizacji licznika bookmarks:', error);
        }
    }

    handleBookmarkChange(detail) {
        const { word, isBookmarked, wordKey } = detail;
        
        console.log(`🔄 Handling bookmark change: ${wordKey} → ${isBookmarked ? 'added' : 'removed'}`);
        
        // 🎨 Aktualizuj wizualny stan przycisku bookmark na bieżącej karcie
        if (this.managers.flashcard && this.managers.flashcard.currentWord === word) {
            this.managers.flashcard.refreshBookmarkState(word);
        }
        
        // 📊 Aktualizuj liczniki
        this.updateBookmarksCount();
        
        // 🔄 Odśwież modal bookmarks jeśli jest otwarty
        if (this.bookmarksController && this.bookmarksController.isModalOpen()) {
            this.bookmarksController.loadBookmarksData();
        }
    }

    /**
     * 📊 Śledzenie użycia bookmarks (analytics)
     */
    trackBookmarksUsage() {
        try {
            // 📈 Zapisz że użytkownik otworzył ulubione
            const usage = JSON.parse(localStorage.getItem('bookmarks-usage') || '{}');
            usage.modalOpened = (usage.modalOpened || 0) + 1;
            usage.lastOpened = new Date().toISOString();
            localStorage.setItem('bookmarks-usage', JSON.stringify(usage));
            
            console.log('📈 Zarejestrowano użycie modala bookmarks');
        } catch (error) {
            console.warn('⚠️ Błąd śledzenia użycia bookmarks:', error);
        }
    }

    /**
     * 🎯 Tryb nauki tylko ulubionych słów
     */
    /**
     * 🎯 Rozpoczęcie nauki tylko ulubionych słów
     */
    startBookmarksOnlyMode() {
        console.log('🎯 Rozpoczynam tryb nauki tylko ulubionych...');
        
        if (!this.managers.progress) {
            NotificationManager.show('Nie można uruchomić trybu ulubionych', 'error');
            return false;
        }
        
        const bookmarkedWords = this.managers.progress.getAllBookmarkedWords();
        
        if (bookmarkedWords.length === 0) {
            NotificationManager.show('Brak ulubionych słów do nauki', 'info');
            return false;
        }
        
        // 🎲 Wymieszaj ulubione słowa dla lepszego efektu nauki
        const shuffledBookmarks = Utils.shuffle(bookmarkedWords);
        
        // 💾 Zapisz stan trybu ulubionych
        this.state.bookmarksOnlyMode = true;
        this.state.bookmarkedWordsQueue = shuffledBookmarks;
        this.state.bookmarksQueueIndex = 0;
        
        // 🎯 Przejdź do pierwszego ulubionego słowa
        this.updateCard();
        
        // 🎨 Zaktualizuj UI
        this.updateBookmarksModeUI(true);
        
        NotificationManager.show(
            `🔖 Tryb ulubionych: ${bookmarkedWords.length} słów`, 
            'success', 
            4000
        );
        
        console.log(`✅ Uruchomiono tryb ulubionych z ${bookmarkedWords.length} słowami`);
        this.closeModal('bookmarks'); // Zamknij modal, jeśli był otwarty
        return true;
    }


    /**
     * 🔄 Wyjście z trybu nauki tylko ulubionych
     */
    
    /**
     * 🔄 Wyjście z trybu nauki tylko ulubionych
     */
    exitBookmarksOnlyMode() {
        console.log('🔄 Wychodzę z trybu nauki ulubionych...');
        
        // 🗑️ Wyczyść stan trybu ulubionych
        this.state.bookmarksOnlyMode = false;
        this.state.bookmarkedWordsQueue = null;
        this.state.bookmarksQueueIndex = 0;
        
        // 🎨 Zaktualizuj UI
        this.updateBookmarksModeUI(false);
        
        // 🔄 Odśwież kartę (wróci do normalnego trybu)
        this.updateCard();
        
        NotificationManager.show('Zakończono tryb ulubionych', 'info');
    }

    /**
     * ➡️ Następne słowo w trybie ulubionych
     */
    nextBookmarkedWord() {
        if (!this.state.bookmarksOnlyMode || !this.state.bookmarkedWordsQueue) {
            console.warn('⚠️ Nie jesteśmy w trybie ulubionych');
            return;
        }
        
        // Przejdź do następnego słowa
        this.state.bookmarksQueueIndex++;
        
        if (this.state.bookmarksQueueIndex >= this.state.bookmarkedWordsQueue.length) {
            // 🔄 Koniec listy - zaproponuj powtórkę
            if (confirm('Przejrzałeś wszystkie ulubione słowa! Czy chcesz rozpocząć od nowa?')) {
                this.state.bookmarksQueueIndex = 0;
            } else {
                this.exitBookmarksOnlyMode();
                return;
            }
        }
        
        // 🔄 Aktualizuj kartę
        this.updateCard();
        
        // 📊 Pokaż progress
        const remaining = this.state.bookmarkedWordsQueue.length - this.state.bookmarksQueueIndex - 1;
        console.log(`📖 Ulubione: pozostało ${remaining} słów`);
    }

    /**
     * ⬅️ Poprzednie słowo w trybie ulubionych
     */
    previousBookmarkedWord() {
        if (!this.state.bookmarksOnlyMode || !this.state.bookmarkedWordsQueue) {
            console.warn('⚠️ Nie jesteśmy w trybie ulubionych');
            return;
        }
        
        if (this.state.bookmarksQueueIndex > 0) {
            this.state.bookmarksQueueIndex--;
            this.updateCard();
        } else {
            if (window.NotificationManager) {
                window.NotificationManager.show('To pierwsze ulubione słowo', 'info');
            }
        }
    }

    updateBookmarksModeUI() {
        // 🎨 Aktualizuj przycisk toggle w navigation
        const bookmarksModeBtn = document.getElementById('bookmarks-mode-toggle');
        if (bookmarksModeBtn) {
            const btnText = bookmarksModeBtn.querySelector('.text');
            const btnIcon = bookmarksModeBtn.querySelector('.icon');
            
            if (this.state.bookmarksOnlyMode) {
                if (btnText) btnText.textContent = 'Wyjdź z trybu';
                if (btnIcon) btnIcon.textContent = '🔙';
                bookmarksModeBtn.classList.add('active');
                bookmarksModeBtn.title = 'Wyjdź z trybu ulubionych';
            } else {
                if (btnText) btnText.textContent = 'Tryb ulubionych';
                if (btnIcon) btnIcon.textContent = '🔖';
                bookmarksModeBtn.classList.remove('active');
                bookmarksModeBtn.title = 'Przełącz na tryb ulubionych';
            }
        }
        
        // 🎨 Aktualizuj navigation controls
        const navigationControls = document.getElementById('navigation-controls');
        if (navigationControls) {
            navigationControls.classList.toggle('bookmarks-mode', this.state.bookmarksOnlyMode);
        }
        
        // 🎨 Dodaj/usuń klasę z body dla stylowania
        document.body.classList.toggle('bookmarks-only-mode', this.state.bookmarksOnlyMode);
    }

    /**
     * ✅ NOWA METODA: Pokazanie wskaźnika trybu ulubionych
    */
    showBookmarksOnlyModeIndicator() {
        // Usuń poprzedni wskaźnik jeśli istnieje
        this.hideBookmarksOnlyModeIndicator();
        
        const indicator = document.createElement('div');
        indicator.id = 'bookmarks-mode-indicator';
        indicator.className = 'mode-indicator bookmarks-indicator';
        indicator.innerHTML = `
            <div class="indicator-content">
                <span class="icon">🔖</span>
                <span class="text">Tryb ulubionych</span>
                <span class="count">${this.state.bookmarkedWordsQueue?.length || 0} słów</span>
                <button class="close-btn" onclick="window.englishFlashcardsApp.exitBookmarksOnlyMode()" title="Wyjdź z trybu">×</button>
            </div>
        `;
        
        // Dodaj na górze aplikacji
        const header = document.querySelector('.app-header');
        if (header) {
            header.appendChild(indicator);
        }
    }

    /**
     * ✅ NOWA METODA: Ukrycie wskaźnika trybu ulubionych  
     */
    hideBookmarksOnlyModeIndicator() {
        const indicator = document.getElementById('bookmarks-mode-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * ✅ POMOCNICZA METODA: Mieszanie tablicy
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * Aktualizacja postępu
     */
    updateProgress() {
        let currentIndex, totalCount, categoryName, progressPercent;

        // 🔖 Tryb ulubionych
        if (this.state.bookmarksOnlyMode && this.state.bookmarkedWordsQueue) {
            currentIndex = this.state.bookmarksQueueIndex + 1;
            totalCount = this.state.bookmarkedWordsQueue.length;
            categoryName = `🔖 Tryb ulubionych`;
        } else {
            // Standardowy tryb
            const category = this.state.vocabulary?.categories[this.state.currentCategory];
            if (!category || !category.words || category.words.length === 0) return;
            
            currentIndex = this.state.currentWordIndex + 1;
            totalCount = category.words.length;
            categoryName = category.name;
        }

        progressPercent = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0;

        // Aktualizuj elementy UI
        document.getElementById('current-card').textContent = currentIndex;
        document.getElementById('total-cards').textContent = totalCount;
        document.getElementById('current-category').textContent = categoryName;

        const progressFillEl = document.getElementById('progress-fill');
        progressFillEl.style.width = `${progressPercent}%`;

        // 🔖 Różne kolory dla trybu ulubionych
        if (this.state.bookmarksOnlyMode) {
            progressFillEl.style.background = 'var(--gradient-accent, linear-gradient(90deg, #f59e0b, #fbbf24))';
        } else {
            progressFillEl.style.background = ''; // Usuń styl, aby wrócić do domyślnego z CSS
        }
    }


    /**
     * Aktualizacja statystyk
     */
    updateStats() {
        const stats = this.managers.progress.getOverallStats();
        const quizStats = this.managers.quiz.getOverallStats();

        // Aktualizacja elementów statystyk
        this.updateStatElement('total-studied', stats.totalStudied);
        this.updateStatElement('study-streak', stats.studyStreak);
        this.updateStatElement('quiz-score', `${quizStats.averageScore}%`);
        this.updateStatElement('favorite-category', stats.favoriteCategory || 'Brak');
        this.updateStatElement('total-words', this.state.vocabulary.metadata.totalWords + '+');
        this.updateStatElement('completed-categories', `${quizStats.completedCategories}/${this.state.vocabulary.metadata.totalCategories}`);
        // ✨ NOWE: Aktualizuj statystyki bookmarks
        this.updateBookmarksCount();
        
        // 📊 Dodaj statystyki bookmarks do głównego panelu
        if (this.managers.progress) {
            const bookmarkStats = this.managers.progress.getBookmarkStats();
            
            // 🔖 Aktualizuj element z ulubionymi jeśli istnieje
            const favoriteWordsEl = document.getElementById('favorite-words-count');
            if (favoriteWordsEl) {
                favoriteWordsEl.textContent = bookmarkStats.totalBookmarks;
            }
            
            // 🏆 Najczęściej ulubiona kategoria
            const topBookmarkCategoryEl = document.getElementById('top-bookmark-category');
            if (topBookmarkCategoryEl && bookmarkStats.topCategory) {
                topBookmarkCategoryEl.textContent = bookmarkStats.topCategory.name;
            }
        }
    
        // Aktualizacja paska postępu kart
        const cardsProgressEl = document.getElementById('cards-progress');
        if (cardsProgressEl) {
            const totalWords = this.state.vocabulary.metadata.totalWords;
            const progressPercent = (stats.totalStudied / totalWords) * 100;
            cardsProgressEl.style.width = `${progressPercent}%`;
        }
    }

    /**
     * Pomocnicza metoda aktualizacji statystyk
     */
    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    /**
     * Przełączanie panelu statystyk
     */
    toggleStats() {
        const panel = document.getElementById('stats-panel');
        if (panel) {
            panel.classList.toggle('visible');
            if (panel.classList.contains('visible')) {
                this.updateStats();
            }
        }
    }

    /**
     * Przełączanie ustawień
     */
    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        const overlay = document.getElementById('modal-overlay');
        
        if (modal && overlay) {
            overlay.classList.add('visible');
            modal.classList.add('visible');
        }
    }

    /**
     * Zamykanie modali
     */
    closeModal(type) {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById(`${type}-modal`);
        
        if (overlay && modal) {
            overlay.classList.remove('visible');
            modal.classList.remove('visible');
        }
    }

    /**
     * Obsługa kliknięcia w overlay modala
     */
    handleModalOverlayClick(e) {
        if (e.target.id === 'modal-overlay') {
            const visibleModal = document.querySelector('.modal.visible');
            if (visibleModal) {
                const modalType = visibleModal.id.replace('-modal', '');
                this.closeModal(modalType);
            }
        }
    }

    /**
     * Obsługa klawiatury
     */
    handleKeyboard(e) {
    // Sprawdzenie czy focus jest na input/textarea
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                if (this.state.currentMode === 'flashcards') {
                    // ✅ DODAJ: Sprawdź czy Shift jest wciśnięty
                    if (e.shiftKey) {
                        this.playCurrentSentenceAudio();
                    } else {
                        // Jeśli zwykła spacja, sprawdź czy to flip czy audio
                        if (this.state.isFlipped) {
                            this.playCurrentWordAudio();
                        } else {
                            this.flipCard();
                        }
                    }
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (this.state.currentMode === 'flashcards') {
                    this.previousCard();
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (this.state.currentMode === 'flashcards') {
                    this.nextCard();
                }
                break;
            case 'Escape':
                // Zamknięcie otwartych modali
                const visibleModal = document.querySelector('.modal.visible');
                if (visibleModal) {
                    const modalType = visibleModal.id.replace('-modal', '');
                    this.closeModal(modalType);
                }
                break;
            // ✅ DODAJ: Nowe skróty klawiszowe
            case 'KeyA':
                if (e.ctrlKey || e.metaKey) return; // Nie przeszkadzaj Ctrl+A
                e.preventDefault();
                this.playCurrentWordAudio();
                break;
            case 'KeyS':
                if (e.ctrlKey || e.metaKey) return; // Nie przeszkadzaj Ctrl+S
                e.preventDefault();
                this.playCurrentSentenceAudio();
                break;
        }
    }

    /**
     * Obsługa kliknięcia w kartę
     */
    handleCardClick(e) {
        // Sprawdzenie czy kliknięto w przycisk lub kontrolkę
        if (e.target.closest('button') || e.target.closest('.card-controls')) {
            return;
        }
        
        this.flipCard();
    }

    /**
     * Filtrowanie kategorii
     */
    filterCategories(searchTerm) {
        const cards = document.querySelectorAll('.category-card');
        const term = searchTerm.toLowerCase();

        cards.forEach(card => {
            const name = card.querySelector('.category-name').textContent.toLowerCase();
            const description = card.querySelector('.category-description').textContent.toLowerCase();
            const matches = name.includes(term) || description.includes(term);
            
            card.style.display = matches ? 'block' : 'none';
        });
    }

    /**
 * Zastosowanie ustawień do menedżerów - BEZPIECZNA WERSJA
 */
    applySettings(settings) {
        console.log('🔧 Stosowanie ustawień...', settings);

        // ZABEZPIECZENIE: Sprawdź czy managers istnieje
        if (!this.managers) {
            console.warn('⚠️ Menedżery nie są jeszcze zainicjalizowane - pomijam zastosowanie ustawień');
            return;
        }

        // ✅ DODAJ: Zaktualizuj state.settings
        if (settings) {
            this.state.settings = { ...this.state.settings, ...settings };
        }

        // Ustawienia motywu
        if (this.managers.theme && typeof this.managers.theme.setTheme === 'function') {
            try {
                this.managers.theme.setTheme(settings.theme);
                console.log(`🎨 Zastosowano motyw: ${settings.theme}`);
            } catch (error) {
                console.warn('⚠️ Błąd zastosowania motywu:', error);
            }
        } else {
            console.log('⏭️ ThemeManager nie jest dostępny - pomijam ustawienia motywu');
        }

        // Ustawienia audio
        if (this.managers.audio && this.managers.audio.setAutoPlay) {
            try {
                this.managers.audio.setAutoPlay(settings.audioAutoPlay);
                this.managers.audio.setVolume(settings.audioVolume);
                this.managers.audio.setRate(settings.audioRate);
                
                console.log(`🔊 Zastosowane ustawienia audio: autoPlay=${settings.audioAutoPlay}, volume=${settings.audioVolume}, rate=${settings.audioRate}`);
            } catch (error) {
                console.warn('⚠️ Błąd zastosowania ustawień audio:', error);
            }
        } else {
            console.log('⏭️ AudioManager nie jest dostępny - pomijam ustawienia audio');
        }

        // Ustawienia fiszek
        if (this.managers.flashcard && typeof this.managers.flashcard.setShowPhonetics === 'function') {
            try {
                this.managers.flashcard.setShowPhonetics(settings.showPhonetics);
                console.log(`📖 Zastosowano pokazywanie fonetyki: ${settings.showPhonetics}`);
            } catch (error) {
                console.warn('⚠️ Błąd zastosowania ustawień fiszek:', error);
            }
        } else {
            console.log('⏭️ FlashcardManager nie jest dostępny - pomijam ustawienia fiszek');
        }

        // Ustawienia quizów
        if (this.managers.quiz) {
            try {
                if (typeof this.managers.quiz.setDifficulty === 'function') {
                    this.managers.quiz.setDifficulty(settings.quizDifficulty);
                }
                if (typeof this.managers.quiz.setLanguage === 'function') {
                    this.managers.quiz.setLanguage(settings.quizLanguage);
                }
                console.log(`🎯 Zastosowano ustawienia quizów: difficulty=${settings.quizDifficulty}, language=${settings.quizLanguage}`);
            } catch (error) {
                console.warn('⚠️ Błąd zastosowania ustawień quizów:', error);
            }
        } else {
            console.log('⏭️ QuizManager nie jest dostępny - pomijam ustawienia quizów');
        }

        // Zapisz skonsolidowane ustawienia - tylko jeśli wszystko poszło OK
        try {
            this.saveSettings(settings);
        } catch (error) {
            console.warn('⚠️ Błąd zapisywania ustawień:', error);
        }
    }

    /**
     * Zapisywanie ustawień - BEZPIECZNA WERSJA
     */
    saveSettings(settings) {
        if (!settings) {
            console.warn('⚠️ Brak ustawień do zapisania');
            return;
        }

        try {
            // Zapisz główne ustawienia
            localStorage.setItem('english-flashcards-settings', JSON.stringify(settings));
            
            // Zachowaj kompatybilność z poprzednią wersją - zapisz również osobno
            localStorage.setItem('audioAutoPlay', settings.audioAutoPlay.toString());
            localStorage.setItem('audioVolume', settings.audioVolume.toString());
            localStorage.setItem('audioRate', settings.audioRate.toString());
            localStorage.setItem('english-flashcards-theme', settings.theme);
            
            console.log('💾 Ustawienia zapisane pomyślnie');
        } catch (error) {
            console.error('❌ Błąd zapisywania ustawień:', error);
            
            // Fallback - spróbuj zapisać przynajmniej podstawowe ustawienia
            try {
                localStorage.setItem('audioAutoPlay', settings.audioAutoPlay.toString());
                localStorage.setItem('english-flashcards-theme', settings.theme);
                console.log('💾 Zapisano podstawowe ustawienia jako fallback');
            } catch (fallbackError) {
                console.error('💥 Krytyczny błąd zapisu ustawień:', fallbackError);
            }
        }
    }

    /**
     * Ładowanie ustawień - ZAKTUALIZOWANA BEZPIECZNA WERSJA
     */
    loadSettings() {
        console.log('⚙️ Ładuję ustawienia...');
        
        // Domyślne ustawienia
        const defaultSettings = {
            autoAudio: false,
            showPhonetics: true,
            quizDifficulty: 'medium',
            quizLanguage: 'en-pl',
            theme: 'auto',
            // Nowe ustawienia audio
            audioAutoPlay: false,
            audioVolume: 1.0,
            audioRate: 1.0
        };

        let settings = { ...defaultSettings }; // Shallow copy

        try {
            // Załaduj główne ustawienia z localStorage
            const savedSettings = localStorage.getItem('english-flashcards-settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                settings = { ...defaultSettings, ...parsed };
                console.log('📋 Załadowano główne ustawienia z localStorage');
            }

            // Załaduj dodatkowe ustawienia audio (dla kompatybilności wstecznej)
            const audioAutoPlay = localStorage.getItem('audioAutoPlay');
            const audioVolume = localStorage.getItem('audioVolume');
            const audioRate = localStorage.getItem('audioRate');

            if (audioAutoPlay !== null) {
                settings.audioAutoPlay = audioAutoPlay === 'true';
            }
            if (audioVolume !== null) {
                const volume = parseFloat(audioVolume);
                if (!isNaN(volume) && volume >= 0 && volume <= 1) {
                    settings.audioVolume = volume;
                }
            }
            if (audioRate !== null) {
                const rate = parseFloat(audioRate);
                if (!isNaN(rate) && rate >= 0.1 && rate <= 2.0) {
                    settings.audioRate = rate;
                }
            }

        } catch (error) {
            console.warn('⚠️ Błąd ładowania ustawień, używam domyślnych:', error);
            settings = { ...defaultSettings };
        }

        // Zastosuj ustawienia do menedżerów (z zabezpieczeniami)
        this.applySettings(settings);

        // Zwróć ustawienia (opcjonalne - jeśli inne części kodu ich potrzebują)
        return settings;
    }

    /**
     * Aktualizacja pojedynczego ustawienia
     */
    updateSetting(key, value) {
        console.log(`🔧 Aktualizuję ustawienie: ${key} = ${value}`);
        
        try {
            // ✅ POPRAWKA: Zaktualizuj state.settings bezpośrednio
            if (!this.state.settings) {
                this.state.settings = this.loadSettings();
            }
            
            this.state.settings[key] = value;
            
            // Zastosuj i zapisz
            this.applySettings(this.state.settings);
            
            return true;
        } catch (error) {
            console.error(`❌ Błąd aktualizacji ustawienia ${key}:`, error);
            return false;
        }
    }

    /**
     * Reset ustawień do domyślnych
     */
    resetSettings() {
        console.log('🔄 Resetuję ustawienia do domyślnych...');
        
        try {
            // Usuń wszystkie ustawienia z localStorage
            localStorage.removeItem('english-flashcards-settings');
            localStorage.removeItem('audioAutoPlay');
            localStorage.removeItem('audioVolume');
            localStorage.removeItem('audioRate');
            localStorage.removeItem('english-flashcards-theme');
            
            // Załaduj i zastosuj domyślne ustawienia
            const defaultSettings = this.loadSettings();
            this.applySettings(defaultSettings);
            
            if (this.managers.notification) {
                this.managers.notification.show('Ustawienia zresetowane do domyślnych', 'info');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Błąd resetowania ustawień:', error);
            return false;
        }
    }

    /**
     * Pomocnicze metody dla ustawień
     */
    setCheckboxValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.checked = value;
    }

    setSelectValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }

    /**
     * Zapisywanie stanu aplikacji
     */
    saveState() {
        const state = {
            currentMode: this.state.currentMode,
            currentCategory: this.state.currentCategory,
            currentWordIndex: this.state.currentWordIndex,
            lastAccess: new Date().toISOString()
        };

        try {
            localStorage.setItem('english-flashcards-state', JSON.stringify(state));
        } catch (error) {
            console.error('Błąd zapisywania stanu:', error);
        }
    }

    /**
     * Ładowanie stanu aplikacji
     */
    loadState() {
        try {
            const saved = localStorage.getItem('english-flashcards-state');
            if (saved) {
                const state = JSON.parse(saved);
                
                if (this.state.vocabulary && this.state.vocabulary.categories[state.currentCategory]) {
                    this.state.currentMode = state.currentMode || 'flashcards';
                    this.state.currentCategory = state.currentCategory;
                    this.state.currentWordIndex = state.currentWordIndex || 0;
                }
            }
        } catch (error) {
            console.warn('Błąd ładowania stanu:', error);
        }
    }

    /**
     * Eksport danych
     */
    exportData() {
        try {
            const data = {
                settings: this.state.settings,
                progress: this.managers.progress.exportData(),
                quizResults: this.managers.quiz.exportData(),
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], 
                { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `english-flashcards-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            NotificationManager.show('Dane zostały wyeksportowane', 'success');
        } catch (error) {
            console.error('Błąd eksportu:', error);
            NotificationManager.show('Błąd podczas eksportu danych', 'error');
        }
    }

    /**
     * Import danych
     */
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (data.version && data.settings && data.progress) {
                    if (confirm('Czy na pewno chcesz zaimportować dane? Obecny postęp zostanie zastąpiony.')) {
                        this.state.settings = { ...this.state.settings, ...data.settings };
                        this.managers.progress.importData(data.progress);
                        this.managers.quiz.importData(data.quizResults);
                        
                        this.saveSettings();
                        this.applySettings();
                        this.updateStats();
                        this.updateProgress();

                        NotificationManager.show('Dane zostały zaimportowane', 'success');
                    }
                } else {
                    NotificationManager.show('Nieprawidłowy format pliku', 'error');
                }
            } catch (error) {
                console.error('Błąd importu:', error);
                NotificationManager.show('Błąd podczas importu danych', 'error');
            }
        };

        input.click();
    }

    /**
     * Reset wszystkich danych
     */
    resetAllData() {
        if (confirm('Czy na pewno chcesz zresetować wszystkie dane? Ta operacja jest nieodwracalna.')) {
            if (confirm('Ostatnie ostrzeżenie! Wszystkie dane zostaną usunięte.')) {
                try {
                    // Czyszczenie localStorage
                    const keysToRemove = [
                        'english-flashcards-settings',
                        'english-flashcards-state',
                        'english-flashcards-progress',
                        'english-flashcards-quiz-results',
                        'english-flashcards-images'
                    ];

                    keysToRemove.forEach(key => localStorage.removeItem(key));

                    // Reset menedżerów
                    this.managers.progress.reset();
                    this.managers.quiz.reset();
                    this.managers.image.reset();

                    // Reset stanu aplikacji
                    this.state.settings = this.loadSettings();
                    this.state.currentWordIndex = 0;

                    // Odświeżenie UI
                    this.applySettings();
                    this.updateStats();
                    this.updateProgress();
                    this.renderCategories();
                    this.renderCategoryQuizzes();

                    NotificationManager.show('Wszystkie dane zostały zresetowane', 'info');
                } catch (error) {
                    console.error('Błąd resetowania:', error);
                    NotificationManager.show('Błąd podczas resetowania danych', 'error');
                }
            }
        }
    }

    /**
     * Metody quizów - placeholder dla implementacji w QuizManager
     */
    startCategoryQuiz(category) {
        this.managers.quiz.startCategoryQuiz(category, this);
    }

    startRandomQuiz() {
        this.managers.quiz.startRandomQuiz(this);
    }

    startDifficultWordsQuiz() {
        this.managers.quiz.startDifficultWordsQuiz(this);
    }

    startFinalQuiz() {
        this.managers.quiz.startFinalQuiz(this);
    }

    submitQuizAnswer() {
        this.managers.quiz.submitAnswer(this);
    }

    submitSentenceAnswer() {
        this.managers.quiz.submitSentenceAnswer(this);
    }

    nextQuizQuestion() {
        this.managers.quiz.nextQuestion(this);
    }

    retryQuiz() {
        this.managers.quiz.retryCurrentQuiz(this);
    }

    continueAfterQuiz() {
        this.managers.quiz.continueAfterQuiz(this);
    }

    /**
     * Pomocnicze metody UI
     */
    showLoadingScreen(show) {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen && app) {
            if (show) {
                loadingScreen.style.display = 'flex';
                app.style.display = 'none';
                document.body.classList.add('loading');
            } else {
                loadingScreen.style.display = 'none';
                app.style.display = 'block';
                document.body.classList.remove('loading');
            }
        }
    }

    updateLoadingMessage(message) {
        const messageEl = document.querySelector('.loading-screen p');
        if (messageEl) messageEl.textContent = message;
    }

    getModeDisplayName(mode) {
        const names = {
            'flashcards': 'Fiszki',
            'quiz': 'Quizy',
            'sentences': 'Przykłady zdań'
        };
        return names[mode] || mode;
    }

    showWelcomeMessage() {
        setTimeout(() => {
            NotificationManager.show(
                '🇬🇧 Witaj w aplikacji English Flashcards B1/B2! 1600+ słów w 32 kategoriach. Wybierz tryb nauki i zacznij przygodę z angielskim!',
                'success',
                5000
            );
        }, 1000);
    }

    /**
     * Czyszczenie zasobów przed zamknięciem
     */
    cleanup() {
        // Czyszczenie nasłuchiwaczy zdarzeń
        this.eventListeners.forEach((listeners, elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
                listeners.forEach(({ event, handler }) => {
                    element.removeEventListener(event, handler);
                });
            }
        });
        this.eventListeners.clear();

        // Czyszczenie menedżerów
        Object.values(this.managers).forEach(manager => {
            if (manager && typeof manager.cleanup === 'function') {
                manager.cleanup();
            }
        });

        // ✨ NOWE: Cleanup bookmarks controller
        if (this.bookmarksController) {
            // BookmarksController nie ma jeszcze metody cleanup, ale gdyby miał:
            // this.bookmarksController.cleanup();
            this.bookmarksController = null;
        }
        
        // 🗑️ Usuń wskaźnik trybu ulubionych
        const indicator = document.getElementById('bookmarks-mode-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 3. NOWA METODA: setupAudioListeners()
    setupAudioListeners() {
        console.log('🔊 Konfigurowanie audio listenerów...');

        // Global audio test button (dodaj w dev tools)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.addAudioTestButton();
        }

        // Audio settings listeners
        document.addEventListener('audioSettingsChanged', (e) => {
            if (this.managers.audio) {
                const { volume, rate, autoPlay } = e.detail;
                
                if (volume !== undefined) this.managers.audio.setVolume(volume);
                if (rate !== undefined) this.managers.audio.setRate(rate);
                if (autoPlay !== undefined) this.managers.audio.setAutoPlay(autoPlay);
            }
        });

        // Keyboard shortcut dla audio (spacja)
        document.addEventListener('keydown', (e) => {
            // Spacja = odtwórz audio bieżącego słowa
            if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
                e.preventDefault();
                this.playCurrentWordAudio();
            }
            
            // Shift + Spacja = odtwórz zdanie przykładowe
            if (e.code === 'Space' && e.shiftKey && !e.target.matches('input, textarea, button')) {
                e.preventDefault();
                this.playCurrentSentenceAudio();
            }
        });
    }

    // 4. NOWA METODA: playCurrentWordAudio()
    async playCurrentWordAudio() {
        // ✅ POPRAWKA: użyj this.state.currentMode zamiast this.currentMode
        if (this.state.currentMode === 'flashcards' && this.managers.flashcard && this.managers.flashcard.currentWord) {
            const word = this.managers.flashcard.currentWord;
            console.log(`⌨️ Keyboard shortcut: odtwarzam "${word.english}"`);
            
            if (this.managers.audio) {
                await this.managers.audio.playAudio(word.english);
            }
        }
    }

    // 5. NOWA METODA: playCurrentSentenceAudio()
    async playCurrentSentenceAudio() {
    // ✅ POPRAWKA: użyj this.state.currentMode
        if (this.state.currentMode === 'flashcards' && this.managers.flashcard && this.managers.flashcard.currentWord) {
            const word = this.managers.flashcard.currentWord;
            
            if (word.examples && word.examples.english) {
                console.log(`⌨️ Keyboard shortcut: odtwarzam zdanie "${word.examples.english}"`);
                
                if (this.managers.audio) {
                    await this.managers.audio.playSentence(word.examples.english, word.examples.polish);
                }
            } else {
                console.log('⚠️ Brak zdania przykładowego dla tego słowa');
                if (NotificationManager) {  // ✅ POPRAWKA: użyj NotificationManager zamiast this.managers.notification
                    NotificationManager.show('To słowo nie ma zdania przykładowego', 'info');
                }
            }
        }
    }

    // 6. NOWA METODA: addAudioTestButton() - tylko dla developmentu
    addAudioTestButton() {
        const testBtn = document.createElement('button');
        testBtn.innerHTML = '🧪 Test Audio';
        testBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            padding: 10px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        testBtn.addEventListener('click', async () => {
            if (this.managers.audio) {
                console.log('🧪 Rozpoczynam test audio...');
                await this.managers.audio.testAudio();
            }
        });
        
        document.body.appendChild(testBtn);
        console.log('🧪 Przycisk test audio dodany (dev mode)');
    }

    displayWord(word) {
        if (!word) return;

        // ✅ POPRAWKA: Dodaj currentWord do state
        this.state.currentWord = word;  
        console.log(`📱 Wyświetlam słowo: ${word.english}`);

        // Wyświetl słowo
        if (this.managers.flashcard) {
            this.managers.flashcard.displayWord(word, this.state.currentMode);  // ✅ POPRAWKA: użyj this.state.currentMode
            
            // NOWE: Auto-play jeśli włączone
            if (this.managers.audio && this.managers.audio.autoPlay) {
                setTimeout(() => {
                    this.managers.audio.playAudio(word.english);
                }, 800); // Opóźnienie żeby karta się załadowała
            }
        }

        // Zapisz postęp
        if (this.managers.progress && this.state.currentCategory && this.state.currentWordIndex !== -1) {  // ✅ POPRAWKA: użyj this.state
            this.managers.progress.markWordAsStudied(
                this.state.currentCategory, 
                this.state.currentWordIndex, 
                word.id
            );
        }

        // Aktualizuj progress display
        this.updateProgress();  // ✅ POPRAWKA: użyj updateProgress() zamiast updateProgressDisplay()
    }

    // 8. NOWA METODA: toggleAutoPlay() - dla ustawień
    toggleAutoPlay() {
        if (this.managers.audio) {
            const newState = !this.managers.audio.autoPlay;
            
            // ✅ POPRAWKA: Użyj updateSetting zamiast bezpośredniego zapisu
            this.updateSetting('audioAutoPlay', newState);
            
            console.log(`🔄 Auto-play ${newState ? 'włączony' : 'wyłączony'}`);
            
            if (NotificationManager) {  // ✅ POPRAWKA: użyj NotificationManager
                NotificationManager.show(
                    `Auto-play ${newState ? 'włączony' : 'wyłączony'}`, 
                    'info'
                );
            }
            
            return newState;
        }
        return false;
    }

}

// Inicjalizacja aplikacji po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    window.englishFlashcardsApp = new EnglishFlashcardsApp();
});

// Cleanup przed zamknięciem strony
window.addEventListener('beforeunload', () => {
    if (window.englishFlashcardsApp) {
        window.englishFlashcardsApp.cleanup();
    }
});

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnglishFlashcardsApp;
}