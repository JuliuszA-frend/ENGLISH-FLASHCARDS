/**
 * English Flashcards B1/B2 - Main Application ES6
 * Główna aplikacja do nauki angielskiego z modularną architekturą
 * 
 * @version 1.0.0
 * @author English Learning App
 */

// ===== ES6 IMPORTS =====
// Core utilities and configuration
import { AppConstants, AppUtils } from './config/constants.js';
import { 
    debounce, 
    shuffle as shuffleArray, 
    formatDate, 
    isMobile,
    generateId,
    delay 
} from './utils/utils.js';
import { getStorageManager, storage } from './utils/storage-manager.js';
import { 
    NotificationManager, 
    showNotification, 
    getNotificationManager 
} from './utils/notification-manager.js';
import { getImageManager, imageUtils } from './utils/image-manager.js';

// Application modules
import { FlashcardManager } from './modules/flashcard/index.js';
import { BookmarksController } from './modules/bookmarks/index.js';
import QuizManager, { 
    createQuizSystem, 
    verifyQuizModules,
    loadQuizManager 
} from './modules/quiz/index.js';
import { ProgressManager } from './modules/progress/index.js';
import { ImageManager } from './modules/image/index.js';
import { createProductionDataLoader } from './modules/data/index.js';
import { ThemeManager } from './modules/theme/index.js';
import { AudioManager } from './modules/audio/index.js';
import { ModuleLoader } from './modules/loader/index.js';
import { SentenceFlashcardManager } from './modules/sentence/index.js';

/**
 * Główna klasa aplikacji English Flashcards
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
            bookmarksOnlyMode: false,
            bookmarkedWordsQueue: [],
            bookmarksQueueIndex: 0,
            bookmarksController: null,
            currentWord: null // ✅ DODANE: stan obecnego słowa
        };
        this.selectedCategories = new Set();
        this.categoryCloseHandler = null;
        this.categoryOverlayHandler = null;
        this.selectAllHandler = null;
        this.deselectAllHandler = null;
        this.cancelSelectionHandler = null;
        this.startMixedHandler = null;
        this.managers = {};
        this.eventListeners = new Map();
        this.sentenceManager = null;
        // ✅ NOWE: Referencje do menedżerów ES6
        this.storageManager = getStorageManager();
        this.notificationManager = getNotificationManager();
        this.imageManager = getImageManager();
        
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
            showNotification('Błąd podczas ładowania aplikacji', 'error');
        }
    }

    /**
     * ✅ ZAKTUALIZOWANA: Inicjalizacja menedżerów z ES6 modules
     */
    async initializeManagers() {
        console.group('🏗️ Inicjalizacja menedżerów aplikacji (ES6 Updated)');
        
        try {
            // 🎨 ThemeManager - ES6 module
            console.log('🎨 Inicjalizuję ThemeManager (ES6)...');
            this.managers.theme = new ThemeManager();
            this.managers.theme.init();
            console.log('✅ ThemeManager (ES6) zainicjalizowany');

            // 📚 Ładowanie danych
            console.log('📚 Inicjalizuję DataLoader...');
            this.managers.dataLoader = createProductionDataLoader();
            
            // 📊 Menedżer postępu
            console.log('📊 Inicjalizuję ProgressManager...');
            this.managers.progress = new ProgressManager();
            
            // 🔊 AUDIO MANAGER - ES6 module
            console.log('🔊 Inicjalizuję AudioManager (ES6)...');
            this.managers.audio = new AudioManager();
            await this.managers.audio.initialize();
            console.log('✅ AudioManager (ES6) zainicjalizowany');
            
            // 🖼️ Menedżer obrazków - używaj ES6 instancji
            console.log('🖼️ Używam ES6 ImageManager...');
            this.managers.image = this.imageManager;
            
            // 📇 Menedżer fiszek
            console.log('📇 Inicjalizuję FlashcardManager...');
            this.managers.flashcard = new FlashcardManager();
            this.managers.flashcard.setManagers(this.managers.image, this.managers.audio, this.managers.progress);
            
            // 💬 SENTENCE MANAGER - dodaj to po inicjalizacji FlashcardManager
            console.log('💬 Inicjalizuję SentenceFlashcardManager...');
            this.managers.sentence = new SentenceFlashcardManager();

            // Przekaż referencje do innych menedżerów
            if (this.managers.sentence.setManagers) {
                this.managers.sentence.setManagers({
                    image: this.managers.image,
                    audio: this.managers.audio,
                    progress: this.managers.progress
                });
            }
            console.log('✅ SentenceFlashcardManager zainicjalizowany');

            // 🎯 Modularny Quiz Manager
            console.log('🎯 Inicjalizuję modularny QuizManager...');
            await this.initializeModularQuizManager();
            
            // 🔖 Modularny Bookmarks Manager
            console.log('🔖 Inicjalizuję modularny BookmarksController...');
            try {
                this.bookmarksController = new BookmarksController(this);
                await this.bookmarksController.init();
                console.log('✅ Modularny BookmarksController zainicjalizowany');
            } catch (error) {
                console.error('❌ Błąd inicjalizacji modularnego BookmarksController:', error);
                this.bookmarksController = this.createMockBookmarksController();
            }
            
            // ✅ NOWE: Przypisz menedżery ES6 do globalnych referencji dla kompatybilności
            this.managers.storage = this.storageManager;
            this.managers.notification = this.notificationManager;
            
            console.log('✅ Wszystkie menedżery zainicjalizowane (ES6 Updated)');
            console.groupEnd();
            
        } catch (error) {
            console.error('❌ Błąd inicjalizacji menedżerów:', error);
            console.groupEnd();
            throw error;
        }
    }
    /**
     * 💬 POPRAWIONA: Inicjalizacja trybu zdaniowego
     */
    async initializeSentenceMode() {
        console.log('💬 Inicjalizuję tryb zdaniowy...');
        
        if (!this.managers.sentence) {
            console.error('❌ SentenceFlashcardManager nie jest dostępny');
            showNotification('Błąd: Tryb zdaniowy niedostępny', 'error');
            return false;
        }

        try {
            // Sprawdź czy już zainicjalizowany
            if (this.managers.sentence.vocabulary) {
                console.log('✅ SentenceFlashcardManager już zainicjalizowany');
                return true;
            }

            // Inicjalizuj manager zdaniowy z danymi
            const success = await this.managers.sentence.init(
                this.state.vocabulary,
                {
                    audio: this.managers.audio,
                    progress: this.managers.progress,
                    image: this.managers.image
                }
            );

            if (success) {
                console.log('✅ Tryb zdaniowy zainicjalizowany pomyślnie');
                return true;
            } else {
                console.error('❌ Błąd inicjalizacji trybu zdaniowego');
                showNotification('Nie udało się zainicjalizować trybu zdaniowego', 'error');
                return false;
            }

        } catch (error) {
            console.error('❌ Błąd inicjalizacji trybu zdaniowego:', error);
            showNotification('Błąd trybu zdaniowego', 'error');
            return false;
        }
    }


    /**
     * 🎯 NOWA METODA: Inicjalizacja modularnego QuizManager
     */
    async initializeModularQuizManager() {
        try {
            console.log('🔄 Ładuję nowoczesny ES6 QuizManager...');
            
            // 🆕 Weryfikuj dostępność modułów ES6
            const verification = verifyQuizModules();
            console.log('📊 Weryfikacja modułów ES6:', verification);
            
            if (!verification.allAvailable) {
                console.error('❌ Brakuje modułów quizu ES6:', verification.missing);
                console.log('🔄 Próbuję użyć fallback QuizManager...');
                this.initializeFallbackQuizManager();
                return;
            }
            
            // 🆕 Utwórz QuizManager z ES6 modules
            console.log('📦 Tworzę ES6 QuizManager...');
            this.managers.quiz = new QuizManager();
            
            // ✅ Sprawdź czy QuizManager został utworzony poprawnie
            if (!this.managers.quiz) {
                throw new Error('QuizManager nie został utworzony');
            }
            
            // 🧪 Test podstawowych metod QuizManager
            const hasRequiredMethods = typeof this.managers.quiz.setVocabulary === 'function' &&
                                    typeof this.managers.quiz.startCategoryQuiz === 'function';
            
            if (!hasRequiredMethods) {
                throw new Error('QuizManager nie ma wymaganych metod');
            }
            
            console.log('✅ ES6 QuizManager załadowany pomyślnie');
            
            // 🎯 Sprawdź czy wszystkie moduły są dostępne (dodatkowa weryfikacja)
            if (typeof window.testQuizSystem === 'function') {
                const systemTest = window.testQuizSystem();
                if (systemTest) {
                    console.log('🎉 Test systemu quizów ES6 - PASSED');
                } else {
                    console.warn('⚠️ Test systemu quizów ES6 - WARNING (ale kontynuuję)');
                }
            }
            
        } catch (error) {
            console.error('❌ Błąd ładowania ES6 QuizManager:', error);
            console.log('🔄 Przełączam na fallback QuizManager...');
            this.initializeFallbackQuizManager();
        }
    }

    /**
     * 💬 Aktualizacja karty zdaniowej
     */
    updateSentenceCard() {
        if (this.state.currentMode !== 'sentences' || !this.managers.sentence) {
            return;
        }

        // SentenceFlashcardManager sam zarządza wyświetlaniem
        // Aktualizuj tylko progress
        this.updateProgress();
    }

    /**
     * 🔄 FALLBACK: Inicjalizacja tradycyjnego QuizManager
     */
    initializeFallbackQuizManager() {
        try {
            console.log('🔄 Inicjalizuję fallback QuizManager...');
            
            // Sprawdź czy stara wersja QuizManager jest dostępna (globalna)
            if (typeof QuizManager !== 'undefined' && QuizManager !== this.managers.quiz?.constructor) {
                console.log('📦 Używam globalnego QuizManager (stara wersja)...');
                this.managers.quiz = new window.QuizManager();
                console.log('✅ Fallback QuizManager (globalny) zainicjalizowany');
            }
            // Sprawdź czy jest dostępna przez loadQuizManager
            else if (typeof loadQuizManager === 'function') {
                console.log('📦 Próbuję załadować przez loadQuizManager...');
                loadQuizManager().then(quizManager => {
                    this.managers.quiz = quizManager;
                    console.log('✅ Fallback QuizManager (loader) zainicjalizowany');
                }).catch(loaderError => {
                    console.error('❌ Błąd loadQuizManager:', loaderError);
                    this.createMockQuizManager();
                });
            }
            // Ostateczny fallback - mock
            else {
                console.error('❌ Brak dostępnej implementacji QuizManager');
                this.createMockQuizManager();
            }
            
        } catch (error) {
            console.error('❌ Błąd inicjalizacji fallback QuizManager:', error);
            this.createMockQuizManager();
        }
    }

    createMockQuizManager() {
        console.warn('🆘 Tworzę mock QuizManager - funkcjonalność ograniczona');
        
        this.managers.quiz = {
            // Podstawowe metody które aplikacja oczekuje
            setVocabulary: (vocabulary) => {
                console.log('🔇 Mock: setVocabulary wywołane');
            },
            
            startCategoryQuiz: (category, app) => {
                console.warn('🔇 Mock: Quiz nie jest dostępny');
                showNotification('Moduł quizów nie jest dostępny', 'error');
                return false;
            },
            
            // Inne wymagane metody
            startRandomQuiz: () => false,
            startBookmarksQuiz: () => false,
            startFinalQuiz: () => false,
            getDifficultyQuizStats: () => null,
            getOverallStats: () => ({ averageScore: 0, completedCategories: 0 }),
            getCategoryResults: () => null,
            loadQuizResults: () => ({}),
            
            // Metody kontroli quizu
            submitAnswer: () => {},
            nextQuestion: () => {},
            cancelQuiz: () => true,
            continueAfterQuiz: () => {},
            retryCurrentQuiz: () => {},
            
            // Export/import
            exportData: () => ({}),
            importData: () => true,
            reset: () => true,
            
            // Informacja o mock
            isMock: true
        };
        
        // Pokaż ostrzeżenie użytkownikowi
        setTimeout(() => {
            showNotification(
                'Moduł quizów nie jest w pełni dostępny. Niektóre funkcje mogą nie działać.', 
                'warning', 
                8000
            );
        }, 3000);
        
        console.log('🆘 Mock QuizManager utworzony');
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
            this.managers.progress.setVocabulary(this.state.vocabulary);
            
            // 🎯 PRZEKAZANIE DANYCH DO MODULARNEGO QUIZ MANAGER
            if (this.managers.quiz && typeof this.managers.quiz.setVocabulary === 'function') {
                this.managers.quiz.setVocabulary(this.state.vocabulary);
                console.log('✅ Słownictwo przekazane do modularnego QuizManager');
            } else {
                console.warn('⚠️ QuizManager nie jest dostępny lub nie ma metody setVocabulary');
            }
            
        } catch (error) {
            console.error('Błąd ładowania danych:', error);
            throw new Error('Nie udało się załadować danych słownictwa');
        }
    }
    
    /**
     * ✅ ZAKTUALIZOWANA: Konfiguracja nasłuchiwaczy zdarzeń z ES6 utilities
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

        // ✅ ZAKTUALIZOWANE: Search z ES6 debounce
        this.addEventListener('category-search', 'input', 
            debounce((e) => this.filterCategories(e.target.value), 300)
        );

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Card interactions
        this.addEventListener('flashcard', 'click', (e) => this.handleCardClick(e));

        this.addEventListener('bookmarks-toggle', 'click', () => this.openBookmarks());

        this.setupDifficultyEventListeners();

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

         // ✨✨✨ POCZĄTEK NOWEGO KODU DO DODANIA ✨✨✨
        // 🎯 PRZYCISKI W PANELU SZYBKIEGO DOSTĘPU
        this.addEventListeners([
            ['study-bookmarks-quick', 'click', () => this.startBookmarksOnlyMode()],
            ['browse-bookmarks-quick', 'click', () => this.openBookmarks()],
            ['quiz-bookmarks-quick', 'click', () => {
                showNotification('Quiz z słownictwa do powtórzenia - wkrótce!', 'info');
            }]
        ]);
        // ✨✨✨ KONIEC NOWEGO KODU DO DODANIA ✨✨✨

        // ✨ NOWY EVENT LISTENER: Odświeżanie UI po zapisaniu wyników quizu
        document.addEventListener('quizResultsSaved', (event) => {
            console.log('🔔 Event: Quiz results saved', event.detail);
            
            // Odśwież renderowanie quizów z opóźnieniem
            setTimeout(() => {
                this.renderCategoryQuizzes();
                this.updateStats();
            }, 100);
        });
        
        // ✨ NOWY EVENT LISTENER: Debug localStorage changes (tylko dev)
        if (window.location.hostname === 'localhost') {
            window.addEventListener('storage', (e) => {
                if (e.key === 'english-flashcards-quiz-results') {
                    console.log('🔔 localStorage quiz results changed:', {
                        key: e.key,
                        oldValue: e.oldValue ? 'existed' : 'null',
                        newValue: e.newValue ? 'exists' : 'null'
                    });
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
        
        // Quiz navigation (zachowaj istniejące)
        this.addEventListeners([
            ['quiz-submit-btn', 'click', () => this.submitQuizAnswer()],
            ['sentence-submit-btn', 'click', () => this.submitSentenceAnswer()],
            ['quiz-next-btn', 'click', () => this.nextQuizQuestion()],
            ['quiz-retry-btn', 'click', () => this.retryQuiz()],
            ['quiz-continue-btn', 'click', () => this.continueAfterQuiz()],
            ['quiz-cancel-btn', 'click', () => this.cancelQuiz()],
            ['hard-words-quiz-btn', 'click', () => this.startHardWordsQuiz()],      // NOWE
            ['easy-words-quiz-btn', 'click', () => this.startEasyWordsQuiz()],      // NOWE  
            ['progressive-quiz-btn', 'click', () => this.startProgressiveQuiz()],   // NOWE
            ['adaptive-quiz-btn', 'click', () => this.startAdaptiveQuiz()]  
        ]);

        // NOWE: Przyciski nowych quizów
        this.addEventListeners([
            ['random-quiz-btn', 'click', () => this.startRandomQuiz()],
            ['bookmarks-quiz-btn', 'click', () => this.startBookmarksQuiz()],
            ['final-quiz-btn', 'click', () => this.startFinalQuiz()],
            ['speed-quiz-btn', 'click', () => this.startSpeedQuiz()],        // NOWE
            ['mixed-quiz-btn', 'click', () => this.startMixedQuiz()]         // NOWE
        ]);

        // Quiz input handling (zachowaj istniejące)
        this.addEventListener('quiz-answer-input', 'keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('quiz-submit-btn').disabled) {
                this.submitQuizAnswer();
            }
        });
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
        this.verifyQuizState();
        this.renderDifficultyQuizStatus();
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

    verifyQuizState() {
        console.group('🔍 Weryfikacja stanu quizów po inicjalizacji');
        
        try {
            // Sprawdź dostępność QuizManager
            const hasQuizManager = !!this.managers.quiz;
            console.log(`📊 QuizManager dostępny: ${hasQuizManager}`);
            
            if (hasQuizManager) {
                // Sprawdź localStorage
                const allResults = this.managers.quiz.loadQuizResults();
                const resultsKeys = Object.keys(allResults);
                console.log(`💾 Klucze w localStorage: [${resultsKeys.join(', ')}]`);
                
                // Sprawdź wyniki dla każdej kategorii
                if (this.state.vocabulary && this.state.vocabulary.categories) {
                    const categories = Object.keys(this.state.vocabulary.categories);
                    const completedCategories = [];
                    
                    categories.forEach(categoryKey => {
                        const result = this.managers.quiz.getCategoryResults(categoryKey);
                        if (result && result.passed) {
                            completedCategories.push({
                                category: categoryKey,
                                score: result.score,
                                total: result.total,
                                percentage: result.percentage
                            });
                        }
                    });
                    
                    console.log(`✅ Ukończone kategorie (${completedCategories.length}):`, completedCategories);
                }
            }
            
            // Sprawdź localStorage bezpośrednio
            const directCheck = localStorage.getItem('english-flashcards-quiz-results');
            if (directCheck) {
                try {
                    const parsed = JSON.parse(directCheck);
                    console.log(`🔑 Bezpośredni dostęp do localStorage (${Object.keys(parsed).length} kluczy):`, Object.keys(parsed));
                } catch (e) {
                    console.error('❌ Błąd parsowania danych z localStorage:', e);
                }
            } else {
                console.log('📭 Brak danych w localStorage dla klucza quiz-results');
            }
            
        } catch (error) {
            console.error('❌ Błąd weryfikacji stanu quizów:', error);
        }
        
        console.groupEnd();
    }

    /**
     * Przerwanie quizu
     */
    cancelQuiz() {
        console.log('🚫 Użytkownik chce przerwać quiz');
        
        if (!this.managers.quiz) {
            showNotification('Moduł quizów nie jest dostępny', 'error');
            return;
        }
        
        try {
            // Sprawdź czy quiz jest aktywny
            if (!this.managers.quiz.currentQuiz) {
                console.warn('⚠️ Brak aktywnego quizu do przerwania');
                showNotification('Brak aktywnego quizu', 'info');
                return;
            }
            
            // Pokaż potwierdzenie
            const currentQuiz = this.managers.quiz.currentQuiz;
            const confirmMessage = `
🚫 Czy na pewno chcesz przerwać quiz "${currentQuiz.categoryName}"?

⚠️ UWAGA: Cały postęp zostanie utracony!
Quiz nie zostanie zapisany.

Czy chcesz kontynuować?`;

            if (confirm(confirmMessage.trim())) {
                console.log('✅ Użytkownik potwierdził przerwanie quizu');
                
                // Przerwij quiz
                const success = this.managers.quiz.cancelQuiz(this);
                
                if (success) {
                    showNotification(
                        `Quiz "${currentQuiz.categoryName}" został przerwany`, 
                        'info', 
                        3000
                    );
                } else {
                    showNotification('Wystąpił błąd podczas przerywania quizu', 'error');
                }
                
                console.log('🔄 Quiz przerwany - powrót do menu');
            } else {
                console.log('❌ Użytkownik anulował przerwanie quizu');
                showNotification('Quiz kontynuowany', 'info', 2000);
            }
            
        } catch (error) {
            console.error('❌ Błąd przerwania quizu:', error);
            showNotification('Błąd przerwania quizu', 'error');
        }
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
     * ✅ ZAKTUALIZOWANA: Renderowanie kategorii z ES6 utilities
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
     * ✅ POPRAWIONA METODA: renderCategoryQuizzes z debuggingiem
     */
    renderCategoryQuizzes() {
        const grid = document.getElementById('category-quiz-grid');
        if (!grid || !this.state.vocabulary) {
            console.warn('⚠️ renderCategoryQuizzes: Brak grid lub vocabulary');
            return;
        }

        const categories = this.state.vocabulary.categories;
        let html = '';
        let completedCount = 0;
        let totalCount = 0;

        console.group('🎯 renderCategoryQuizzes - Renderowanie quizów kategorii');

        Object.entries(categories).forEach(([key, category]) => {
            totalCount++;
            
            // ✅ BEZPIECZNE POBIERANIE WYNIKÓW
            let quizResults = null;
            let isCompleted = false;
            let statusText = 'Nie ukończony';
            
            try {
                if (this.managers.quiz && typeof this.managers.quiz.getCategoryResults === 'function') {
                    quizResults = this.managers.quiz.getCategoryResults(key);
                    isCompleted = quizResults && quizResults.passed;
                    
                    if (quizResults) {
                        statusText = `${quizResults.score}/${quizResults.total} (${quizResults.percentage}%)`;
                        if (isCompleted) completedCount++;
                    }
                    
                    console.log(`📋 Kategoria "${key}": ${isCompleted ? '✅ Zaliczony' : '❌ Nie zaliczony'} - ${statusText}`);
                } else {
                    console.warn(`⚠️ QuizManager nie jest dostępny dla kategorii "${key}"`);
                }
            } catch (error) {
                console.error(`❌ Błąd pobierania wyników dla kategorii "${key}":`, error);
            }

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

        console.log(`📊 Podsumowanie: ${completedCount}/${totalCount} quizów ukończonych`);
        console.groupEnd();

        grid.innerHTML = html;

        // Dodanie nasłuchiwaczy
        grid.querySelectorAll('.quiz-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.quiz;
                this.startCategoryQuiz(category);
            });
        });
        
        // ✨ NOWE: Aktualizuj statystyki po renderowaniu
        this.updateQuizStatistics(completedCount, totalCount);
    }

    /**
     * ✅ NOWA METODA: updateDifficultyQuizUI()
     * Wywoływana gdy trudność słowa się zmieni
     */
    updateDifficultyQuizUI() {
        console.log('🔄 Aktualizuję UI quizów trudności po zmianie...');
        
        // Opóźnij renderowanie żeby dać czas na zapisanie zmian
        setTimeout(() => {
            this.renderDifficultyQuizStatus();
        }, 100);
    }

    /**
     * ✨ NOWA METODA: Aktualizacja statystyk quizów
     */
    updateQuizStatistics(completed, total) {
        try {
            const completedElement = document.getElementById('completed-categories');
            if (completedElement) {
                completedElement.textContent = `${completed}/${total}`;
            }
            
            // Emit event for other components
            document.dispatchEvent(new CustomEvent('quizStatisticsUpdated', {
                detail: { completed, total }
            }));
            
        } catch (error) {
            console.warn('⚠️ Błąd aktualizacji statystyk quizów:', error);
        }
    }

    /**
     * 💬 POPRAWIONA: Przełączanie trybu aplikacji
     */
    switchMode(mode) {
        if (this.state.currentMode === mode) return;

        const previousMode = this.state.currentMode;
        this.state.currentMode = mode;
        
        console.log(`🔄 Przełączanie z trybu ${previousMode} na ${mode}`);
        
        // 💬 NOWE: Obsługa trybu zdaniowego
        if (mode === 'sentences') {
            this.initializeSentenceMode().then(success => {
                if (success) {
                    this.updateModeDisplay();
                    this.updateSentenceCard(); // NOWE: Użyj dedykowanej metody
                    this.updateProgress();
                    showNotification(`Przełączono na tryb: ${this.getModeDisplayName(mode)}`, 'info');
                } else {
                    // Fallback na poprzedni tryb jeśli inicjalizacja się nie udała
                    this.state.currentMode = previousMode;
                    showNotification('Nie udało się przełączyć na tryb zdaniowy', 'error');
                }
            });
        } else {
            // Standardowe tryby
            this.updateModeDisplay();
            if (mode === 'flashcards') {
                this.updateCard(); // Standardowa metoda dla fiszek
            }
            this.saveState();
            showNotification(`Przełączono na tryb: ${this.getModeDisplayName(mode)}`, 'info');
        }
    }


    /**
    * 💬 POPRAWIONA: Aktualizacja wyświetlania trybu
    */
    updateModeDisplay() {
        // Aktualizacja przycisków trybu
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.state.currentMode);
        });

        // Pokazywanie/ukrywanie sekcji
        const elements = {
            'category-selector': this.state.currentMode === 'flashcards', // ZMIANA: tylko flashcards
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

        // 💬 NOWE: Specjalna obsługa trybu zdaniowego
        if (this.state.currentMode === 'sentences') {
            // Ukryj selektor kategorii w trybie zdaniowym
            const categorySelector = document.getElementById('category-selector');
            if (categorySelector) {
                categorySelector.style.display = 'none';
            }
            
            // Dodaj klasę do body dla stylowania
            document.body.classList.add('sentence-mode');
            document.body.classList.remove('flashcard-mode', 'quiz-mode');
        } else {
            // Usuń klasę trybu zdaniowego
            document.body.classList.remove('sentence-mode');
            
            if (this.state.currentMode === 'flashcards') {
                document.body.classList.add('flashcard-mode');
                document.body.classList.remove('quiz-mode');
            } else if (this.state.currentMode === 'quiz') {
                document.body.classList.add('quiz-mode');
                document.body.classList.remove('flashcard-mode');
            }
        }
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
        showNotification(`Przełączono na kategorię: ${categoryName}`, 'info');
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

        // ✅ DODANE: Zapisz obecne słowo do state
        this.state.currentWord = word;

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
     * 💬 POPRAWIONA: Metoda flipCard z obsługą trybu zdaniowego
     */
    flipCard() {
        // 💬 OBSŁUGA TRYBU ZDANIOWEGO
        if (this.state.currentMode === 'sentences' && this.managers.sentence) {
            this.managers.sentence.flipCard();
            return;
        }

        // Standardowa logika dla trybu flashcards
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

    nextCard() {
        // 💬 OBSŁUGA TRYBU ZDANIOWEGO
        if (this.state.currentMode === 'sentences' && this.managers.sentence) {
            const hasNext = this.managers.sentence.nextSentence();
            if (!hasNext) {
                showNotification('To ostatnia fiszka zdaniowa!', 'info');
            } else {
                this.updateProgress(); // Aktualizuj progress
            }
            return;
        }

        // 🔖 Sprawdź tryb ulubionych (existing code)
        if (this.state.bookmarksOnlyMode) {
            if (this.state.bookmarksQueueIndex < this.state.bookmarkedWordsQueue.length - 1) {
                this.state.bookmarksQueueIndex++;
                this.updateCard();
            } else {
                showNotification('To ostatnie ulubione słowo!', 'info');
                if (confirm('Przejrzałeś wszystkie ulubione. Chcesz zacząć od nowa?')) {
                    this.state.bookmarksQueueIndex = 0;
                    this.updateCard();
                } else {
                    this.exitBookmarksOnlyMode();
                }
            }
            return;
        }
        
        // Standardowa logika dla trybu flashcards
        const category = this.state.vocabulary.categories[this.state.currentCategory];
        if (this.state.currentWordIndex < category.words.length - 1) {
            this.state.currentWordIndex++;
            this.updateCard();
            this.saveState();
        } else {
            showNotification('To jest ostatnia karta w kategorii', 'info');
        }
    }

    /**
    * 💬 POPRAWIONA: Metoda previousCard z obsługą trybu zdaniowego
    */
    previousCard() {
        // 💬 OBSŁUGA TRYBU ZDANIOWEGO
        if (this.state.currentMode === 'sentences' && this.managers.sentence) {
            const hasPrev = this.managers.sentence.previousSentence();
            if (!hasPrev) {
                showNotification('To pierwsza fiszka zdaniowa!', 'info');
            } else {
                this.updateProgress(); // Aktualizuj progress
            }
            return;
        }

        // 🔖 Sprawdź tryb ulubionych (existing code)
        if (this.state.bookmarksOnlyMode) {
            if (this.state.bookmarksQueueIndex > 0) {
                this.state.bookmarksQueueIndex--;
                this.updateCard();
            } else {
                showNotification('To pierwsze ulubione słowo!', 'info');
            }
            return;
        }
        
        // Standardowa logika dla trybu flashcards
        if (this.state.currentWordIndex > 0) {
            this.state.currentWordIndex--;
            this.updateCard();
            this.saveState();
        } else {
            showNotification('To jest pierwsza karta w kategorii', 'info');
        }
    }

    /**
     * ✅ ZAKTUALIZOWANA: Mieszanie kart z ES6 shuffle
     */
    shuffleCards() {
        const category = this.state.vocabulary.categories[this.state.currentCategory];
        category.words = shuffleArray(category.words);
        this.state.currentWordIndex = 0;
        this.updateCard();
        this.updateProgress();
        
        showNotification('Karty zostały wymieszane', 'info');
    }

    /**
     * Reset kategorii
     */
    resetCategory() {
        if (confirm('Czy na pewno chcesz zresetować postęp tej kategorii?')) {
            console.log(`🔄 Resetuję kategorię: ${this.state.currentCategory}`);
            
            // 📊 Zapisz stan przed resetem (do logowania)
            const progressBefore = this.managers.progress.getCategoryProgress(this.state.currentCategory);
            console.log(`📊 Postęp przed resetem: ${progressBefore.studied}/${progressBefore.total}`);
            
            // 🗑️ Resetuj dane w ProgressManager
            const resetSuccess = this.managers.progress.resetCategory(this.state.currentCategory);
            
            if (resetSuccess) {
                console.log(`✅ Kategoria ${this.state.currentCategory} zresetowana w ProgressManager`);
                
                // ✅ NOWE: Natychmiastowa aktualizacja UI
                this.updateCategoryProgressUI(this.state.currentCategory);
                
                // 🔄 Resetuj indeks karty do pierwszej
                this.state.currentWordIndex = 0;
                
                // 🔄 Aktualizuj aktualną kartę
                this.updateCard();
                
                // 🔄 Aktualizuj pasek postępu nauki
                this.updateProgress();
                
                // 📊 Aktualizuj ogólne statystyki
                this.updateStats();
                
                // 🔄 Aktualizuj liczniki bookmarks (mogły się zmienić)
                this.updateBookmarksCount();
                
                console.log(`🎯 UI zaktualizowane po resecie kategorii ${this.state.currentCategory}`);
                
                showNotification('Postęp kategorii został zresetowany', 'info');
            } else {
                console.error(`❌ Błąd resetowania kategorii ${this.state.currentCategory}`);
                showNotification('Błąd podczas resetowania kategorii', 'error');
            }
        }
    }

    /**
     * ✨ NOWA METODA: Aktualizacja UI konkretnej kategorii
     */
    updateCategoryProgressUI(categoryKey) {
        console.log(`🎨 Aktualizuję UI kategorii: ${categoryKey}`);
        
        if (!this.managers.progress || !categoryKey) {
            console.warn('⚠️ Brak ProgressManager lub categoryKey');
            return;
        }
        
        try {
            // 📊 Pobierz nowy postęp kategorii
            const newProgress = this.managers.progress.getCategoryProgress(categoryKey);
            const progressPercent = Math.round((newProgress.studied / newProgress.total) * 100);
            
            console.log(`📊 Nowy postęp kategorii ${categoryKey}: ${newProgress.studied}/${newProgress.total} (${progressPercent}%)`);
            
            // 🎯 Znajdź kartę kategorii w DOM
            const categoryCard = document.querySelector(`[data-category="${categoryKey}"]`);
            
            if (categoryCard) {
                // 📊 Aktualizuj pasek postępu
                const progressFill = categoryCard.querySelector('.progress-fill');
                const progressText = categoryCard.querySelector('.progress-text');
                
                if (progressFill) {
                    // Animacja zmiany - najpierw ukryj, potem pokaż z nową wartością
                    progressFill.style.transition = 'width 0.5s ease, background-color 0.3s ease';
                    progressFill.style.width = `${progressPercent}%`;
                    progressFill.style.background = progressPercent === 100 ? '#22c55e' : '#3b82f6';
                    
                    console.log(`🎨 Zaktualizowano pasek postępu: ${progressPercent}%`);
                }
                
                if (progressText) {
                    progressText.textContent = `${newProgress.studied}/${newProgress.total}`;
                    console.log(`📝 Zaktualizowano tekst postępu: ${newProgress.studied}/${newProgress.total}`);
                }
                
                // 🏆 Usuń badge ukończenia jeśli był (po resecie nie powinno być 100%)
                const existingBadge = categoryCard.querySelector('.completed-badge');
                if (existingBadge && progressPercent < 100) {
                    existingBadge.remove();
                    console.log('🗑️ Usunięto badge ukończenia');
                }
                
                // ✨ Dodaj efekt wizualny resetu
                categoryCard.classList.add('reset-animation');
                setTimeout(() => {
                    categoryCard.classList.remove('reset-animation');
                }, 600);
                
                console.log(`✅ UI kategorii ${categoryKey} zaktualizowane`);
                
            } else {
                console.warn(`⚠️ Nie znaleziono karty kategorii ${categoryKey} w DOM`);
                
                // 🔄 Fallback - odśwież wszystkie kategorie
                console.log('🔄 Odświeżam wszystkie kategorie jako fallback...');
                this.renderCategories();
            }
            
        } catch (error) {
            console.error(`❌ Błąd aktualizacji UI kategorii ${categoryKey}:`, error);
            
            // 🔄 Fallback - odśwież wszystkie kategorie
            this.renderCategories();
        }
    }

    /**
     * ✅ NOWA METODA: setupDifficultyEventListeners()
     * Event listeners dla zmian trudności (dodaj do setupEventListeners)
     */
    setupDifficultyEventListeners() {
        console.log('⭐ Konfigurowanie event listeners dla zmian trudności...');
        
        // Nasłuchuj na globalne zmiany trudności
        document.addEventListener('wordDifficultyChanged', (event) => {
            const { word, oldDifficulty, newDifficulty, wordKey } = event.detail;
            
            console.log(`📢 Otrzymano event zmiany trudności:`, {
                word: word.english,
                old: oldDifficulty,
                new: newDifficulty,
                key: wordKey
            });
            
            // Aktualizuj UI quizów trudności
            this.updateDifficultyQuizUI();
            
            // Opcjonalnie: aktualizuj statystyki
            this.updateStats();
            
            console.log('✅ UI zaktualizowane po zmianie trudności');
        });
    }

    /**
     * 🔖 Otwarcie modala ulubionych
     */
    openBookmarks() {
        console.log('🔖 Otwieranie słów do powtórki...');
        console.log('📊 bookmarksController dostępny:', !!this.bookmarksController);
        console.log('📊 BookmarksController class dostępny:', typeof BookmarksController !== 'undefined');
        
        if (!this.bookmarksController) {
            // 🔧 Inicjalizuj jeśli jeszcze nie istnieje
            if (typeof BookmarksController !== 'undefined') {
                console.log('🔧 Tworzę nowy BookmarksController...');
                this.bookmarksController = new BookmarksController(this);
                console.log('✅ BookmarksController utworzony:', !!this.bookmarksController);
            } else {
                console.error('❌ BookmarksController nie jest dostępny');
                showNotification('Nie można otworzyć powtórek - brak modułu', 'error');
                return;
            }
        }
        
        // 📂 Otwórz modal
        console.log('📂 Wywołuję openModal()...');
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
            toggleButton.querySelector('.text').textContent = 'Tryb powtórki';
            toggleButton.querySelector('.icon').textContent = '🔖';
            body.classList.remove('bookmarks-only-mode');
        }
    }

    updateBookmarksCount() {
        if (!this.managers.progress) return;
        
        try {
            const stats = this.managers.progress.getBookmarkStats();
            const bookmarksCount = stats.totalBookmarks;
            
            console.log(`📊 Aktualizuję liczniki bookmarks: ${bookmarksCount} słów`);
            
            // 🏷️ Aktualizuj licznik w header (już było)
            const headerBadge = document.querySelector('#bookmarks-toggle .count-badge');
            if (headerBadge) {
                headerBadge.textContent = bookmarksCount;
                headerBadge.style.display = bookmarksCount > 0 ? 'inline' : 'none';
            }
            
            // 📊 Aktualizuj w statystykach (już było)
            const statElement = document.getElementById('total-bookmarks-stat');
            if (statElement) {
                statElement.textContent = bookmarksCount;
            }
            
            // ✅ NOWE: Aktualizuj licznik w panelu Szybki dostęp
            const quickAccessCounter = document.getElementById('bookmarks-count-quick');
            if (quickAccessCounter) {
                quickAccessCounter.textContent = bookmarksCount;
                console.log(`📱 Zaktualizowano licznik szybkiego dostępu: ${bookmarksCount}`);
            } else {
                console.warn('⚠️ Element bookmarks-count-quick nie został znaleziony');
            }
            
            // ✅ NOWE: Aktualizuj stan przycisku "Ucz się ulubionych" (enable/disable)
            const studyBookmarksBtn = document.getElementById('study-bookmarks-quick');
            if (studyBookmarksBtn) {
                if (bookmarksCount === 0) {
                    studyBookmarksBtn.disabled = true;
                    studyBookmarksBtn.title = 'Brak słów do powtórki';
                    studyBookmarksBtn.classList.add('disabled');
                    console.log('🔒 Przycisk "Ucz się powtórek" wyłączony - brak słów');
                } else {
                    studyBookmarksBtn.disabled = false;
                    studyBookmarksBtn.title = `Powtarzaj ${bookmarksCount} trudne słownictwo`;
                    studyBookmarksBtn.classList.remove('disabled');
                    console.log(`✅ Przycisk "Ucz się powtórek" włączony - ${bookmarksCount} słów`);
                }
            }
            
            // ✅ NOWE: Aktualizuj stan przycisku "Przeglądaj ulubione"
            const browseBookmarksBtn = document.getElementById('browse-bookmarks-quick');
            if (browseBookmarksBtn) {
                if (bookmarksCount === 0) {
                    browseBookmarksBtn.disabled = true;
                    browseBookmarksBtn.title = 'Brak powtórek do przeglądania';
                    browseBookmarksBtn.classList.add('disabled');
                } else {
                    browseBookmarksBtn.disabled = false;
                    browseBookmarksBtn.title = `Powtarzaj ${bookmarksCount} trudne słownictwo`;
                    browseBookmarksBtn.classList.remove('disabled');
                }
            }
            
            // ✅ NOWE: Aktualizuj stan przycisku "Quiz ulubionych"
            const quizBookmarksBtn = document.getElementById('quiz-bookmarks-quick');
            if (quizBookmarksBtn) {
                if (bookmarksCount < 3) { // Minimum 3 słowa do quizu
                    quizBookmarksBtn.disabled = true;
                    quizBookmarksBtn.title = `Quiz wymaga minimum 3 słów oznaczonych do powtórki (masz: ${bookmarksCount})`;
                    quizBookmarksBtn.classList.add('disabled');
                } else {
                    quizBookmarksBtn.disabled = false;
                    quizBookmarksBtn.title = `Quiz z ${bookmarksCount} słów oznaczonych do powtórki`;
                    quizBookmarksBtn.classList.remove('disabled');
                }
            }
            
            // ✅ POPRAWKA: Zawsze aktualizuj przycisk trybu ulubionych
            const bookmarksModeBtn = document.getElementById('bookmarks-mode-toggle');
            if (bookmarksModeBtn) {
                const textEl = bookmarksModeBtn.querySelector('.text');
                if (textEl) {
                    // Aktualizuj tekst w zależności od liczby słów
                    if (bookmarksCount > 0) {
                        textEl.textContent = `Tryb powtórki (${bookmarksCount})`;
                        bookmarksModeBtn.disabled = false;
                        bookmarksModeBtn.title = `Przełącz na tryb nauki ${bookmarksCount} słów do powtórki`;
                    } else {
                        textEl.textContent = 'Tryb powtórki';
                        bookmarksModeBtn.disabled = true;
                        bookmarksModeBtn.title = 'Brak słów do powtórki - dodaj słowa klikając 🔖';
                    }
                }
            }
            
            console.log(`✅ Zaktualizowano wszystkie liczniki bookmarks: ${bookmarksCount} słów`);
            
        } catch (error) {
            console.error('❌ Błąd aktualizacji liczników bookmarks:', error);
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
            showNotification('Nie można uruchomić trybu powtórki', 'error');
            return false;
        }
        
        const bookmarkedWords = this.managers.progress.getAllBookmarkedWords();
        
        if (bookmarkedWords.length === 0) {
            showNotification('Brak słowek do powtórzenia', 'info');
            return false;
        }
        
        // 🎲 Wymieszaj ulubione słowa dla lepszego efektu nauki - używaj ES6 shuffle
        const shuffledBookmarks = shuffleArray(bookmarkedWords);
        
        // 💾 Zapisz stan trybu ulubionych
        this.state.bookmarksOnlyMode = true;
        this.state.bookmarkedWordsQueue = shuffledBookmarks;
        this.state.bookmarksQueueIndex = 0;
        
        // 🎯 Przejdź do pierwszego ulubionego słowa
        this.updateCard();
        
        // 🎨 Zaktualizuj UI
        this.updateBookmarksModeUI(true);
        
        showNotification(
            `🔖 Tryb powtórki: ${bookmarkedWords.length} słów`, 
            'success', 
            4000
        );
        
        console.log(`✅ Uruchomiono tryb powtórki z ${bookmarkedWords.length} słowami`);
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
        console.log('🔄 Wychodzę z trybu powtórek...');
        
        // 🗑️ Wyczyść stan trybu ulubionych
        this.state.bookmarksOnlyMode = false;
        this.state.bookmarkedWordsQueue = null;
        this.state.bookmarksQueueIndex = 0;
        
        // 🎨 Zaktualizuj UI
        this.updateBookmarksModeUI(false);
        
        // 🔄 Odśwież kartę (wróci do normalnego trybu)
        this.updateCard();
        
        showNotification('Zakończono tryb powtórek', 'info');
    }

    /**
     * ➡️ Następne słowo w trybie ulubionych
     */
    nextBookmarkedWord() {
        if (!this.state.bookmarksOnlyMode || !this.state.bookmarkedWordsQueue) {
            console.warn('⚠️ Nie jesteśmy w trybie powtórki');
            return;
        }
        
        // Przejdź do następnego słowa
        this.state.bookmarksQueueIndex++;
        
        if (this.state.bookmarksQueueIndex >= this.state.bookmarkedWordsQueue.length) {
            // 🔄 Koniec listy - zaproponuj powtórkę
            if (confirm('Przejrzałeś wszystkie słowa do powtórki! Czy chcesz rozpocząć od nowa?')) {
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
        console.log(`📖 Powtórka: pozostało ${remaining} słów`);
    }

    /**
     * ⬅️ Poprzednie słowo w trybie ulubionych
     */
    previousBookmarkedWord() {
        if (!this.state.bookmarksOnlyMode || !this.state.bookmarkedWordsQueue) {
            console.warn('⚠️ Nie jesteśmy w trybie powtórki');
            return;
        }
        
        if (this.state.bookmarksQueueIndex > 0) {
            this.state.bookmarksQueueIndex--;
            this.updateCard();
        } else {
            showNotification('To pierwsze słowo do powtórki', 'info');
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
                bookmarksModeBtn.title = 'Wyjdź z trybu powtórki';
            } else {
                // ✅ POPRAWKA: Po wyjściu z trybu, zaktualizuj tekst na podstawie liczby słów
                const stats = this.managers.progress ? this.managers.progress.getBookmarkStats() : null;
                const bookmarksCount = stats ? stats.totalBookmarks : 0;
                
                if (btnText) {
                    if (bookmarksCount > 0) {
                        btnText.textContent = `Tryb powtórki (${bookmarksCount})`;
                    } else {
                        btnText.textContent = 'Tryb powtórki';
                    }
                }
                if (btnIcon) btnIcon.textContent = '🔖';
                bookmarksModeBtn.classList.remove('active');
                
                if (bookmarksCount > 0) {
                    bookmarksModeBtn.title = `Przełącz na tryb nauki ${bookmarksCount} słów do powtórki`;
                    bookmarksModeBtn.disabled = false;
                } else {
                    bookmarksModeBtn.title = 'Brak słów do powtórki - dodaj słowa klikając 🔖';
                    bookmarksModeBtn.disabled = true;
                }
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
                <span class="text">Tryb powtórki</span>
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
     * 💬 POPRAWIONA: Aktualizacja postępu z obsługą trybu zdaniowego
     */
    updateProgress() {
        let currentIndex, totalCount, categoryName, progressPercent;

        // 💬 OBSŁUGA TRYBU ZDANIOWEGO
        if (this.state.currentMode === 'sentences' && this.managers.sentence) {
            const stats = this.managers.sentence.getStats();
            currentIndex = stats.currentIndex + 1;
            totalCount = stats.totalSentences;
            categoryName = `💬 Fiszki zdaniowe`;
            progressPercent = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0;
        }
        // 🔖 Tryb ulubionych
        else if (this.state.bookmarksOnlyMode && this.state.bookmarkedWordsQueue) {
            currentIndex = this.state.bookmarksQueueIndex + 1;
            totalCount = this.state.bookmarkedWordsQueue.length;
            categoryName = `🔖 Tryb powtórki`;
            progressPercent = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0;
        } else {
            // Standardowy tryb flashcards
            const category = this.state.vocabulary?.categories[this.state.currentCategory];
            if (!category || !category.words || category.words.length === 0) return;
            
            currentIndex = this.state.currentWordIndex + 1;
            totalCount = category.words.length;
            categoryName = category.name;
            progressPercent = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0;
        }

        // Aktualizuj elementy UI
        const currentCardEl = document.getElementById('current-card');
        const totalCardsEl = document.getElementById('total-cards');
        const currentCategoryEl = document.getElementById('current-category');
        const progressFillEl = document.getElementById('progress-fill');

        if (currentCardEl) currentCardEl.textContent = currentIndex;
        if (totalCardsEl) totalCardsEl.textContent = totalCount;
        if (currentCategoryEl) currentCategoryEl.textContent = categoryName;
        if (progressFillEl) {
            progressFillEl.style.width = `${progressPercent}%`;
            
            // 🔖 Różne kolory dla różnych trybów
            if (this.state.bookmarksOnlyMode) {
                progressFillEl.style.background = 'var(--gradient-accent, linear-gradient(90deg, #f59e0b, #fbbf24))';
            } else if (this.state.currentMode === 'sentences') {
                progressFillEl.style.background = 'var(--gradient-sentences, linear-gradient(90deg, #2563eb, #60a5fa))';
            } else {
                progressFillEl.style.background = ''; // Usuń styl, aby wrócić do domyślnego z CSS
            }
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
     * ✅ ZAKTUALIZOWANA: Filtrowanie kategorii z ES6 debounce
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
     * ✅ ZAKTUALIZOWANA: Zastosowanie ustawień z ES6 storage
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

        // ✅ ZAKTUALIZOWANE: Zapisz skonsolidowane ustawienia z ES6 storage
        try {
            this.saveSettings(settings);
        } catch (error) {
            console.warn('⚠️ Błąd zapisywania ustawień:', error);
        }
    }

    /**
     * ✅ ZAKTUALIZOWANA: Zapisywanie ustawień z ES6 storage
     */
    saveSettings(settings) {
        if (!settings) {
            console.warn('⚠️ Brak ustawień do zapisania');
            return;
        }

        try {
            // ✅ NOWE: Używaj ES6 storage manager
            this.storageManager.set('settings', settings);
            
            // Zachowaj kompatybilność z poprzednią wersją - zapisz również osobno
            storage.set('audioAutoPlay', settings.audioAutoPlay);
            storage.set('audioVolume', settings.audioVolume);
            storage.set('audioRate', settings.audioRate);
            storage.set('theme', settings.theme);
            
            console.log('💾 Ustawienia zapisane pomyślnie (ES6 storage)');
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
    /**
     * Rozpoczęcie quizu kategorii
     */
    startCategoryQuiz(category) {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        try {
            return this.managers.quiz.startCategoryQuiz(category, this);
        } catch (error) {
            console.error('❌ Błąd uruchamiania quizu kategorii:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }

    /**
     * Rozpoczęcie losowego quizu
     */
    startRandomQuiz() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        try {
            return this.managers.quiz.startRandomQuiz(this);
        } catch (error) {
            console.error('❌ Błąd uruchamiania losowego quizu:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }

    startDifficultWordsQuiz() {
        this.managers.quiz.startDifficultWordsQuiz(this);
    }

    /**
     * Quiz końcowy
     */
    startFinalQuiz() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        try {
            return this.managers.quiz.startFinalQuiz(this);
        } catch (error) {
            console.error('❌ Błąd uruchamiania quizu końcowego:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }

    /**
     * Przesyłanie odpowiedzi w quizie
     */
    submitQuizAnswer() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return;
        }
        
        try {
            this.managers.quiz.submitAnswer(this);
        } catch (error) {
            console.error('❌ Błąd przesyłania odpowiedzi:', error);
            NotificationManager.show('Błąd przesyłania odpowiedzi', 'error');
        }
    }

    /**
     * Przesyłanie odpowiedzi zdaniowej
     */
    submitSentenceAnswer() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return;
        }
        
        try {
            this.managers.quiz.submitSentenceAnswer(this);
        } catch (error) {
            console.error('❌ Błąd przesyłania odpowiedzi zdaniowej:', error);
            NotificationManager.show('Błąd przesyłania odpowiedzi', 'error');
        }
    }

    /**
     * Następne pytanie w quizie
     */
    nextQuizQuestion() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return;
        }
        
        try {
            this.managers.quiz.nextQuestion(this);
        } catch (error) {
            console.error('❌ Błąd przejścia do następnego pytania:', error);
            NotificationManager.show('Błąd przejścia do następnego pytania', 'error');
        }
    }

    /**
     * Powtórzenie quizu
     */
    retryQuiz() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return;
        }
        
        try {
            this.managers.quiz.retryCurrentQuiz(this);
        } catch (error) {
            console.error('❌ Błąd powtarzania quizu:', error);
            NotificationManager.show('Błąd powtarzania quizu', 'error');
        }
    }


    /**
     * Kontynuacja po quizie
     */
    continueAfterQuiz() {
        if (!this.managers.quiz) {
            console.warn('⚠️ QuizManager nie jest dostępny dla continueAfterQuiz');
            // Fallback - przełącz na tryb fiszek
            this.switchMode('flashcards');
            return;
        }
        
        try {
            this.managers.quiz.continueAfterQuiz(this);
        } catch (error) {
            console.error('❌ Błąd kontynuacji po quizie:', error);
            // Fallback - przełącz na tryb fiszek
            this.switchMode('flashcards');
        }
    }

    /**
     * Quiz trudnych słów
     */
    startHardWordsQuiz() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        try {
            return this.managers.quiz.startHardWordsQuiz(this);
        } catch (error) {
            console.error('❌ Błąd uruchamiania quiz trudnych słów:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }

    /**
     * Quiz łatwych słów  
     */
    startEasyWordsQuiz() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        try {
            return this.managers.quiz.startEasyWordsQuiz(this);
        } catch (error) {
            console.error('❌ Błąd uruchamiania quiz łatwych słów:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }

    /**
     * Quiz progresywny
     */
    startProgressiveQuiz() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        try {
            return this.managers.quiz.startProgressiveQuiz(this);
        } catch (error) {
            console.error('❌ Błąd uruchamiania quiz progresywny:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }

    /**
     * Quiz adaptacyjny
     */
    startAdaptiveQuiz() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        try {
            return this.managers.quiz.startAdaptiveQuiz(this);
        } catch (error) {
            console.error('❌ Błąd uruchamiania quiz adaptacyjny:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }


    /**
     * Quiz z powtórek
     */
    startBookmarksQuiz() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        try {
            return this.managers.quiz.startBookmarksQuiz(this);
        } catch (error) {
            console.error('❌ Błąd uruchamiania quiz z powtórek:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }

    /**
     * Quiz szybki
     */
    startSpeedQuiz() {
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        try {
            return this.managers.quiz.startSpeedQuiz(this);
        } catch (error) {
            console.error('❌ Błąd uruchamiania speed quizu:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }

    /**
     * Quiz mieszany z wyborem kategorii
     */
    startMixedQuiz() {
        console.log('🎯 Uruchamiam modal wyboru kategorii...');
        this.showCategorySelectionModal();
    }

    /**
     * ✨ NOWA METODA: Pokazanie modala wyboru kategorii
     */
    showCategorySelectionModal() {
        console.log('📋 Pokazuję modal wyboru kategorii');
        
        const modal = document.getElementById('category-selection-modal');
        if (!modal) {
            console.error('❌ Nie znaleziono modala wyboru kategorii');
            NotificationManager.show('Błąd interfejsu - modal niedostępny', 'error');
            return;
        }
        
        // Wyczyść poprzedni stan
        this.selectedCategories = new Set();
        
        // Renderuj kategorie
        this.renderCategorySelection();
        
        // Pokaż modal
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
        
        // Dodaj event listeners dla tego modala
        this.setupCategorySelectionListeners();
        
        console.log('✅ Modal wyboru kategorii otwarty');
    }

    /**
     * ✨ NOWA METODA: Event listeners dla modala kategorii
     */
    setupCategorySelectionListeners() {
        // Usuń poprzednie listenery jeśli istnieją
        this.removeCategorySelectionListeners();
        
        // Zamknij modal
        this.categoryCloseHandler = () => this.closeCategorySelectionModal();
        this.categoryOverlayHandler = (e) => {
            if (e.target.id === 'category-selection-modal') {
                this.closeCategorySelectionModal();
            }
        };
        
        // Zaznacz wszystkie
        this.selectAllHandler = () => {
            Object.keys(this.state.vocabulary.categories).forEach(key => {
                if (!this.selectedCategories.has(key)) {
                    this.toggleCategorySelection(key);
                }
            });
        };
        
        // Odznacz wszystkie  
        this.deselectAllHandler = () => {
            const categories = Array.from(this.selectedCategories);
            categories.forEach(key => {
                this.toggleCategorySelection(key);
            });
        };
        
        // Anuluj
        this.cancelSelectionHandler = () => this.closeCategorySelectionModal();
        
        // Uruchom quiz
        this.startMixedHandler = () => this.startSelectedCategoriesQuiz();
        
        // Dodaj event listeners
        const closeBtn = document.getElementById('category-selection-close');
        const modal = document.getElementById('category-selection-modal');
        const selectAllBtn = document.getElementById('select-all-categories');
        const deselectAllBtn = document.getElementById('deselect-all-categories');
        const cancelBtn = document.getElementById('cancel-category-selection');
        const startBtn = document.getElementById('start-mixed-quiz');
        
        if (closeBtn) closeBtn.addEventListener('click', this.categoryCloseHandler);
        if (modal) modal.addEventListener('click', this.categoryOverlayHandler);
        if (selectAllBtn) selectAllBtn.addEventListener('click', this.selectAllHandler);
        if (deselectAllBtn) deselectAllBtn.addEventListener('click', this.deselectAllHandler);
        if (cancelBtn) cancelBtn.addEventListener('click', this.cancelSelectionHandler);
        if (startBtn) startBtn.addEventListener('click', this.startMixedHandler);
        
        console.log('✅ Event listeners dla modala kategorii dodane');
    }

    /**
     * ✨ NOWA METODA: Usuwanie event listeners
     */
    removeCategorySelectionListeners() {
        const closeBtn = document.getElementById('category-selection-close');
        const modal = document.getElementById('category-selection-modal');
        const selectAllBtn = document.getElementById('select-all-categories');
        const deselectAllBtn = document.getElementById('deselect-all-categories');
        const cancelBtn = document.getElementById('cancel-category-selection');
        const startBtn = document.getElementById('start-mixed-quiz');
        
        if (closeBtn && this.categoryCloseHandler) {
            closeBtn.removeEventListener('click', this.categoryCloseHandler);
        }
        if (modal && this.categoryOverlayHandler) {
            modal.removeEventListener('click', this.categoryOverlayHandler);
        }
        if (selectAllBtn && this.selectAllHandler) {
            selectAllBtn.removeEventListener('click', this.selectAllHandler);
        }
        if (deselectAllBtn && this.deselectAllHandler) {
            deselectAllBtn.removeEventListener('click', this.deselectAllHandler);
        }
        if (cancelBtn && this.cancelSelectionHandler) {
            cancelBtn.removeEventListener('click', this.cancelSelectionHandler);
        }
        if (startBtn && this.startMixedHandler) {
            startBtn.removeEventListener('click', this.startMixedHandler);
        }
    }

    /**
     * ✨ NOWA METODA: Renderowanie listy kategorii do wyboru - Z LOGAMI
     */
    renderCategorySelection() {
        console.log('🎯 [RENDER] renderCategorySelection() START');
        
        const grid = document.getElementById('categories-selection-grid');
        console.log('🎯 [RENDER] Grid found:', !!grid);
        
        if (!grid || !this.state.vocabulary) {
            console.error('❌ [RENDER] Brak grid lub vocabulary');
            return;
        }

        const categories = this.state.vocabulary.categories;
        console.log('🎯 [RENDER] Categories found:', Object.keys(categories).length);
        
        let html = '';

        Object.entries(categories).forEach(([key, category]) => {
            const progress = this.managers.progress.getCategoryProgress(key);
            const wordCount = category.words ? category.words.length : 0;
            const studiedPercent = Math.round((progress.studied / progress.total) * 100);

            // ✅ WAŻNE: Używamy NOWEJ klasy i NOWEGO atrybutu
            html += `
                <div class="mixed-quiz-category-item GENERATED-NEW" data-category-key="${key}">
                    <div class="category-checkbox"></div>
                    <div class="category-info">
                        <div class="category-name">
                            <span class="category-icon">${category.icon || '📚'}</span>
                            <span>${category.name}</span>
                        </div>
                        <div class="category-stats">
                            <span class="category-word-count">${wordCount} słów</span>
                            <span class="category-progress">${studiedPercent}% przejrzane</span>
                        </div>
                    </div>
                </div>
            `;
        });

        console.log('🎯 [RENDER] Generated HTML length:', html.length);
        grid.innerHTML = html;
        
        // Event listeners dla NOWYCH elementów
        grid.querySelectorAll('.mixed-quiz-category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`🖱️ [CLICK] Category clicked: ${item.dataset.categoryKey}`);
                this.toggleCategorySelection(item.dataset.categoryKey);
            });
        });

        console.log('✅ [RENDER] renderCategorySelection COMPLETED');
    }

    /**
     * ✨ POPRAWIONA METODA: Przełączanie wyboru kategorii (dla NOWEJ struktury HTML)
     */
    toggleCategorySelection(categoryKey) {
        if (!this.selectedCategories) {
            this.selectedCategories = new Set();
        }

        // ✅ TERAZ UŻYWAJ NOWEJ KLASY i NOWEGO ATRYBUTU
        const item = document.querySelector(`.mixed-quiz-category-item[data-category-key="${categoryKey}"]`);
        if (!item) {
            console.warn(`⚠️ Nie znaleziono elementu kategorii: ${categoryKey}`);
            return;
        }

        const checkbox = item.querySelector('.category-checkbox');

        if (this.selectedCategories.has(categoryKey)) {
            // Usuń zaznaczenie
            this.selectedCategories.delete(categoryKey);
            item.classList.remove('selected');
            
            if (checkbox) {
                checkbox.style.cssText = '';
                checkbox.innerHTML = '';
            }
            
            console.log(`➖ Usunięto kategorię: ${categoryKey}`);
        } else {
            // Dodaj zaznaczenie
            this.selectedCategories.add(categoryKey);
            item.classList.add('selected');
            
            if (checkbox) {
                checkbox.style.cssText = `
                    width: 24px !important;
                    height: 24px !important;
                    border: 2px solid var(--blue-500) !important;
                    border-radius: var(--radius-md) !important;
                    background: var(--blue-500) !important;
                    position: relative !important;
                    transition: all 0.2s ease !important;
                `;
            }
            
            console.log(`➕ Dodano kategorię: ${categoryKey}`);
        }

        this.updateCategorySelectionUI();
    }

    /**
     * ✨ NOWA METODA: Aktualizacja UI wyboru kategorii
     */
    updateCategorySelectionUI() {
        const selectedCount = this.selectedCategories.size;
        const totalCategories = Object.keys(this.state.vocabulary.categories).length;
        
        // Aktualizuj liczniki
        const countElement = document.getElementById('selected-categories-count');
        const wordsElement = document.getElementById('selected-words-count');
        const startButton = document.getElementById('start-mixed-quiz');
        
        if (countElement) {
            countElement.textContent = selectedCount;
        }
        
        // Oblicz łączną liczbę słów z wybranych kategorii
        let totalWords = 0;
        this.selectedCategories.forEach(categoryKey => {
            const category = this.state.vocabulary.categories[categoryKey];
            if (category && category.words) {
                totalWords += category.words.length;
            }
        });
        
        if (wordsElement) {
            wordsElement.textContent = totalWords;
        }
        
        // Aktywuj/dezaktywuj przycisk start
        if (startButton) {
            const canStart = selectedCount >= 2;
            startButton.disabled = !canStart;
            
            if (canStart) {
                startButton.classList.remove('disabled');
            } else {
                startButton.classList.add('disabled');
            }
        }
        
        console.log(`📊 Wybrano ${selectedCount}/${totalCategories} kategorii, ${totalWords} słów`);
    }

    /**
     * ✨ NOWA METODA: Zamknięcie modala wyboru kategorii
     */
    closeCategorySelectionModal() {
        const modal = document.getElementById('category-selection-modal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        
        // Usuń event listeners
        this.removeCategorySelectionListeners();
        
        // Wyczyść wybór
        this.selectedCategories = new Set();
        
        console.log('❌ Modal wyboru kategorii zamknięty');
    }

    /**
     * Uruchomienie quizu z wybranych kategorii
     */
    startSelectedCategoriesQuiz() {
        if (!this.selectedCategories || this.selectedCategories.size < 2) {
            NotificationManager.show('Wybierz co najmniej 2 kategorie', 'warning');
            return;
        }
        
        if (!this.managers.quiz) {
            NotificationManager.show('Moduł quizów nie jest dostępny', 'error');
            return false;
        }
        
        const selectedArray = Array.from(this.selectedCategories);
        console.log(`🚀 Uruchamiam quiz mieszany z kategorii:`, selectedArray);
        
        // Zamknij modal
        this.closeCategorySelectionModal();
        
        try {
            // Uruchom quiz przez modularny QuizManager
            const success = this.managers.quiz.startMixedCategoriesQuiz(selectedArray, this);
            
            if (success) {
                const categoryNames = selectedArray.map(key => 
                    this.state.vocabulary.categories[key].name
                ).join(', ');
                
                NotificationManager.show(
                    `🎯 Quiz mieszany z kategorii: ${categoryNames}`, 
                    'success', 
                    4000
                );
            } else {
                NotificationManager.show('Nie udało się uruchomić quiz mieszany', 'error');
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ Błąd uruchamiania quiz mieszany:', error);
            NotificationManager.show('Błąd uruchamiania quizu', 'error');
            return false;
        }
    }

    /**
     * ✅ NOWA METODA: renderDifficultyQuizStatus()
     * Poprawnie renderuje status quizów trudności
     */
    renderDifficultyQuizStatus() {
        if (!this.managers.quiz || !this.managers.progress) {
            console.warn('⚠️ Menedżery nie są dostępne - pomijam renderowanie statusu trudności');
            return;
        }
        
        console.log('🎨 Renderuję status quizów trudności...');
        
        try {
            // 📊 Pobierz statystyki trudności
            const stats = this.managers.quiz.getDifficultyQuizStats(this);
            
            if (!stats) {
                console.warn('⚠️ Brak statystyk trudności');
                return;
            }
            
            // 🎯 Aktualizuj status każdego quizu trudności
            const quizMappings = [
                {
                    elementId: 'easy-quiz-status',
                    count: stats.easy,
                    minRequired: 5,
                    level: 'łatwe',
                    icon: '⭐'
                },
                {
                    elementId: 'hard-quiz-status', 
                    count: stats.hard,
                    minRequired: 5,
                    level: 'trudne',
                    icon: '⭐⭐⭐'
                },
                {
                    elementId: 'progressive-quiz-status',
                    count: stats.total,
                    minRequired: 10,
                    level: 'progresywny',
                    icon: '📈',
                    customCheck: stats.easy >= 3 && stats.medium >= 3 && stats.hard >= 3
                },
                {
                    elementId: 'adaptive-quiz-status',
                    count: stats.total,
                    minRequired: 10, 
                    level: 'adaptacyjny',
                    icon: '🎯'
                }
            ];
            
            quizMappings.forEach(mapping => {
                const element = document.getElementById(mapping.elementId);
                if (element) {
                    // ✅ Sprawdź czy quiz dostępny
                    const hasEnough = mapping.customCheck !== undefined 
                        ? mapping.customCheck 
                        : mapping.count >= mapping.minRequired;
                    
                    if (hasEnough) {
                        element.textContent = `${mapping.count} słów dostępnych`;
                        element.className = 'quiz-status available';
                    } else {
                        const needed = mapping.minRequired - mapping.count;
                        element.textContent = `Potrzebujesz ${needed} więcej słów`;
                        element.className = 'quiz-status unavailable';
                    }
                    
                    console.log(`📊 ${mapping.level}: ${mapping.count} słów, dostępny: ${hasEnough}`);
                }
            });
            
            console.log('✅ Status quizów trudności zaktualizowany');
            
        } catch (error) {
            console.error('❌ Błąd renderowania statusu quizów trudności:', error);
        }
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
     * Cleanup aplikacji
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
                try {
                    manager.cleanup();
                } catch (error) {
                    console.warn('⚠️ Błąd cleanup menedżera:', error);
                }
            }
        });

        // Cleanup bookmarks controller
        if (this.bookmarksController) {
            this.bookmarksController = null;
        }
        // Cleanup sentence manager
        if (this.managers.sentence && typeof this.managers.sentence.cleanup === 'function') {
            this.managers.sentence.cleanup();
        }
        // Usuń wskaźnik trybu ulubionych
        const indicator = document.getElementById('bookmarks-mode-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        console.log('🧹 Aplikacja wyczyszczona');
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

    /**
     * 🔍 NOWA METODA: Diagnostyka modułów quizu
     */
    checkQuizModulesStatus() {
        console.group('🔍 Status modułów quizu w aplikacji');
        
        const status = {
            quizManagerAvailable: !!this.managers.quiz,
            quizManagerType: this.managers.quiz ? this.managers.quiz.constructor.name : 'none',
            hasSetVocabulary: this.managers.quiz && typeof this.managers.quiz.setVocabulary === 'function',
            vocabularySet: !!this.state.vocabulary,
            globalQuizLoader: typeof loadQuizManager !== 'undefined',
            modulesCheck: typeof window.checkQuizModules === 'function' ? window.checkQuizModules() : null
        };
        
        console.table(status);
        console.groupEnd();
        
        return status;
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
    
    // Debug tools
    window.checkAppQuizStatus = () => {
        if (window.englishFlashcardsApp) {
            return window.englishFlashcardsApp.checkQuizModulesStatus();
        } else {
            console.error('❌ Aplikacja nie jest zainicjalizowana');
            return null;
        }
    };
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

console.log('✅ EnglishFlashcardsApp załadowana z modularnym QuizManager');
console.log('💡 Użyj window.checkAppQuizStatus() aby sprawdzić status quizów w aplikacji');

/**
 * DEBUG TOOLS dla systemu trudności
 * Dodaj ten kod na koniec app.js lub jako osobny plik dla debugowania
 */

// 🧪 NARZĘDZIA DEBUGOWANIA (tylko dla developmentu)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    
    /**
     * 🔧 Debug tools dla systemu trudności
     */
    window.debugDifficulty = {
        
        /**
         * Sprawdź statystyki trudności
         */
        getStats() {
            if (!window.englishFlashcardsApp?.managers?.progress) {
                console.error('❌ ProgressManager nie jest dostępny');
                return null;
            }
            
            const stats = window.englishFlashcardsApp.managers.progress.getDifficultyStats();
            console.table(stats);
            return stats;
        },
        
        /**
         * Sprawdź trudność konkretnego słowa
         */
        checkWord(english, polish) {
            const word = { english, polish };
            const difficulty = window.englishFlashcardsApp.managers.progress.getWordDifficulty(word);
            console.log(`🔍 Słowo "${english}": ${difficulty}`);
            return difficulty;
        },
        
        /**
         * Ustaw trudność słowa
         */
        setDifficulty(english, polish, level) {
            const word = { english, polish };
            const result = window.englishFlashcardsApp.managers.progress.setWordDifficulty(word, level);
            console.log(`⭐ Ustawiono "${english}" na ${level}: ${result ? 'SUKCES' : 'BŁĄD'}`);
            return result;
        },
        
        /**
         * Test pełnego cyklu trudności
         */
        testCycle(english = 'beautiful', polish = 'piękny') {
            const word = { english, polish };
            console.group(`🧪 Test cyklu trudności dla: ${english}`);
            
            // Sprawdź początkowy stan
            let current = window.englishFlashcardsApp.managers.progress.getWordDifficulty(word);
            console.log(`📊 Stan początkowy: ${current}`);
            
            // Test 3 zmian (pełny cykl)
            for (let i = 1; i <= 3; i++) {
                const newLevel = window.englishFlashcardsApp.managers.progress.toggleWordDifficulty(word);
                console.log(`🔄 Zmiana ${i}: ${current} → ${newLevel}`);
                current = newLevel;
            }
            
            console.groupEnd();
            return current;
        },
        
        /**
         * Reset wszystkich trudności
         */
        resetAll() {
            const result = window.englishFlashcardsApp.managers.progress.resetAllDifficulties();
            console.log(`🔄 Reset wszystkich trudności: ${result ? 'SUKCES' : 'BŁĄD'}`);
            return result;
        },
        
        /**
         * Sprawdź localStorage
         */
        checkStorage() {
            const key = 'english-flashcards-difficulty';
            const data = localStorage.getItem(key);
            
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`📦 Dane w localStorage (${Object.keys(parsed).length} słów):`);
                console.table(parsed);
                return parsed;
            } else {
                console.log('📦 Brak danych w localStorage');
                return null;
            }
        },
        
        /**
         * Test wizualnej aktualizacji przycisku
         */
        testVisualUpdate() {
            const diffBtn = document.querySelector('.difficulty-btn');
            if (!diffBtn) {
                console.error('❌ Nie znaleziono przycisku trudności na karcie');
                return false;
            }
            
            console.log('🎨 Testuję wizualną aktualizację...');
            
            const levels = ['easy', 'medium', 'hard'];
            let index = 0;
            
            const interval = setInterval(() => {
                const level = levels[index];
                
                // Usuń poprzednie klasy
                diffBtn.classList.remove('easy', 'medium', 'hard');
                // Dodaj nową klasę
                diffBtn.classList.add(level);
                
                // Zaktualizuj zawartość
                const icons = { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' };
                const texts = { easy: 'Łatwe', medium: 'Średnie', hard: 'Trudne' };
                
                diffBtn.innerHTML = `
                    <span class="icon">${icons[level]}</span>
                    <span class="text">${texts[level]}</span>
                `;
                
                console.log(`🎨 Przełączono na: ${level}`);
                
                index++;
                if (index >= levels.length) {
                    clearInterval(interval);
                    console.log('✅ Test wizualny zakończony');
                }
            }, 1500);
            
            return true;
        },
        
        /**
         * Sprawdź event listenery
         */
        checkEventListeners() {
            const diffBtn = document.querySelector('.difficulty-btn');
            if (!diffBtn) {
                console.error('❌ Nie znaleziono przycisku trudności');
                return false;
            }
            
            // Sprawdź czy przycisk ma event listener
            const hasListener = diffBtn.onclick !== null || 
                               (diffBtn._events && diffBtn._events.click);
            
            console.log(`🎯 Przycisk ma event listener: ${hasListener}`);
            
            // Test kliknięcia programowego
            console.log('🖱️ Testuję kliknięcie programowe...');
            diffBtn.click();
            
            return true;
        }
    };
    
    // 🎮 Dodaj przycisk debug do UI
    function addDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🧪 Debug Difficulty';
        debugBtn.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            z-index: 9999;
            padding: 8px 12px;
            background: #8b5cf6;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        debugBtn.addEventListener('click', () => {
            console.group('🧪 Debug systemu trudności');
            window.debugDifficulty.getStats();
            window.debugDifficulty.checkStorage();
            window.debugDifficulty.checkEventListeners();
            console.groupEnd();
        });
        
        document.body.appendChild(debugBtn);
        console.log('🧪 Przycisk debug difficulty dodany');
    }
    
    // Dodaj przycisk po załadowaniu DOM
    if (document.readyState === 'complete') {
        addDebugButton();
    } else {
        window.addEventListener('load', addDebugButton);
    }
    
    console.log('🧪 Debug tools dla systemu trudności załadowane');
    console.log('💡 Użyj: window.debugDifficulty.getStats() aby sprawdzić statystyki');
}

/**
 * 🎯 GLOBALNE FUNKCJE POMOCNICZE (dostępne zawsze)
 */
window.testDifficultyButton = function() {
    const currentWord = window.englishFlashcardsApp?.managers?.flashcard?.currentWord;
    if (!currentWord) {
        console.error('❌ Brak aktualnego słowa na karcie');
        return false;
    }
    
    console.log(`🧪 Testuję przycisk trudności dla: ${currentWord.english}`);
    
    // Znajdź przycisk
    const diffBtn = document.querySelector('.difficulty-btn');
    if (!diffBtn) {
        console.error('❌ Nie znaleziono przycisku trudności');
        return false;
    }
    
    // Symuluj kliknięcie
    diffBtn.click();
    
    console.log('✅ Test wykonany - sprawdź konsolę pod kątem logów z ProgressManager');
    return true;
};

/**
 * 🔍 Funkcja sprawdzania stanu systemu trudności
 */
window.checkDifficultySystem = function() {
    console.group('🔍 Sprawdzanie systemu trudności');
    
    // 1. Sprawdź dostępność menedżerów
    const app = window.englishFlashcardsApp;
    const hasProgress = !!app?.managers?.progress;
    const hasFlashcard = !!app?.managers?.flashcard;
    
    console.log('📊 Dostępność menedżerów:');
    console.log(`  ProgressManager: ${hasProgress ? '✅' : '❌'}`);
    console.log(`  FlashcardManager: ${hasFlashcard ? '✅' : '❌'}`);
    
    // 2. Sprawdź aktualną kartę
    const currentWord = app?.managers?.flashcard?.currentWord;
    console.log(`📱 Aktualne słowo: ${currentWord ? currentWord.english : 'BRAK'}`);
    
    // 3. Sprawdź przycisk na karcie
    const diffBtn = document.querySelector('.difficulty-btn');
    console.log(`🎯 Przycisk trudności: ${diffBtn ? '✅ Znaleziony' : '❌ Nie znaleziony'}`);
    
    if (diffBtn) {
        const classes = Array.from(diffBtn.classList);
        console.log(`🎨 Klasy przycisku: ${classes.join(', ')}`);
    }
    
    // 4. Sprawdź localStorage
    const difficultyData = localStorage.getItem('english-flashcards-difficulty');
    const wordsCount = difficultyData ? Object.keys(JSON.parse(difficultyData)).length : 0;
    console.log(`💾 Słowa z ustawioną trudnością: ${wordsCount}`);
    
    console.groupEnd();
    
    return {
        hasManagers: hasProgress && hasFlashcard,
        hasCurrentWord: !!currentWord,
        hasButton: !!diffBtn,
        wordsWithDifficulty: wordsCount
    };
};

// 💡 Informacja dla użytkownika
console.log(`
🧪 SYSTEM DEBUG TRUDNOŚCI ZAŁADOWANY
📝 Dostępne funkcje:
   - window.testDifficultyButton() - test przycisku na karcie
   - window.checkDifficultySystem() - sprawdź cały system
   - window.debugDifficulty.* - zaawansowane narzędzia (tylko localhost)
`);
