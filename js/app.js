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
            settings: this.loadSettings()
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
     * Inicjalizacja menedżerów
     */
    async initializeManagers() {
        // Inicjalizacja motywów
        this.managers.theme = new ThemeManager();
        this.managers.theme.init();

        // Ładowanie danych
        this.managers.dataLoader = new DataLoader();
        
        // Menedżer postępu
        this.managers.progress = new ProgressManager();
        
        // Menedżer audio
        this.managers.audio = new AudioManager();
        
        // Menedżer obrazków
        this.managers.image = new ImageManager();
        
        // Menedżer fiszek
        this.managers.flashcard = new FlashcardManager();
        
        // Menedżer quizów
        this.managers.quiz = new QuizManager();
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

        // Quiz events
        this.setupQuizEventListeners();

        // Settings actions
        this.addEventListeners([
            ['export-data', 'click', () => this.exportData()],
            ['import-data', 'click', () => this.importData()],
            ['reset-all-data', 'click', () => this.resetAllData()]
        ]);
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
            const progress = this.managers.progress.getCategoryProgress(key);
            const progressPercent = Math.round((progress.studied / progress.total) * 100);
            
            html += `
                <div class="category-card ${this.state.currentCategory === key ? 'active' : ''}" 
                     data-category="${key}">
                    <div class="category-icon">${category.icon}</div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-description">${category.description}</div>
                    <div class="category-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="progress-text">${progress.studied}/${progress.total}</span>
                    </div>
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
        if (!this.state.currentCategory || !this.state.vocabulary) return;

        const category = this.state.vocabulary.categories[this.state.currentCategory];
        const word = category.words[this.state.currentWordIndex];

        if (!word) return;

        this.managers.flashcard.displayWord(word, this.state.currentMode);
        this.resetCardFlip();
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
            this.managers.progress.markWordAsStudied(
                this.state.currentCategory, 
                this.state.currentWordIndex
            );
            this.updateStats();
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
     * Poprzednia karta
     */
    previousCard() {
        if (this.state.currentWordIndex > 0) {
            this.state.currentWordIndex--;
            this.updateCard();
            this.updateProgress();
            this.saveState();
        } else {
            NotificationManager.show('To jest pierwsza karta w kategorii', 'info');
        }
    }

    /**
     * Następna karta
     */
    nextCard() {
        const category = this.state.vocabulary.categories[this.state.currentCategory];
        if (this.state.currentWordIndex < category.words.length - 1) {
            this.state.currentWordIndex++;
            this.updateCard();
            this.updateProgress();
            this.saveState();
        } else {
            NotificationManager.show('To jest ostatnia karta w kategorii', 'info');
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
     * Aktualizacja postępu
     */
    updateProgress() {
        const category = this.state.vocabulary.categories[this.state.currentCategory];
        if (!category) return;

        const currentCardEl = document.getElementById('current-card');
        const totalCardsEl = document.getElementById('total-cards');
        const progressFillEl = document.getElementById('progress-fill');
        const currentCategoryEl = document.getElementById('current-category');

        if (currentCardEl) currentCardEl.textContent = this.state.currentWordIndex + 1;
        if (totalCardsEl) totalCardsEl.textContent = category.words.length;
        if (currentCategoryEl) currentCategoryEl.textContent = category.name;

        if (progressFillEl) {
            const progressPercent = ((this.state.currentWordIndex + 1) / category.words.length) * 100;
            progressFillEl.style.width = `${progressPercent}%`;
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
                    this.flipCard();
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
     * Ładowanie ustawień
     */
    loadSettings() {
        const defaultSettings = {
            autoAudio: false,
            showPhonetics: true,
            quizDifficulty: 'medium',
            quizLanguage: 'en-pl',
            theme: 'auto'
        };

        try {
            const saved = localStorage.getItem('english-flashcards-settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.warn('Błąd ładowania ustawień:', error);
            return defaultSettings;
        }
    }

    /**
     * Zapisywanie ustawień
     */
    saveSettings() {
        try {
            localStorage.setItem('english-flashcards-settings', JSON.stringify(this.state.settings));
        } catch (error) {
            console.error('Błąd zapisywania ustawień:', error);
        }
    }

    /**
     * Aktualizacja ustawienia
     */
    updateSetting(key, value) {
        this.state.settings[key] = value;
        this.saveSettings();
        this.applySettings();
        
        NotificationManager.show('Ustawienie zostało zaktualizowane', 'success');
    }

    /**
     * Zastosowanie ustawień
     */
    applySettings() {
        // Zastosowanie ustawień do UI
        const settings = this.state.settings;

        // Checkboxy
        this.setCheckboxValue('auto-audio', settings.autoAudio);
        this.setCheckboxValue('show-phonetics', settings.showPhonetics);

        // Selecty
        this.setSelectValue('quiz-difficulty', settings.quizDifficulty);
        this.setSelectValue('quiz-language', settings.quizLanguage);

        // Zastosowanie do menedżerów
        this.managers.audio.setAutoPlay(settings.autoAudio);
        this.managers.flashcard.setShowPhonetics(settings.showPhonetics);
        this.managers.quiz.setDifficulty(settings.quizDifficulty);
        this.managers.quiz.setLanguage(settings.quizLanguage);
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