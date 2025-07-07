/**
 * constants.js - Stałe aplikacji ES6
 * Centralne miejsce dla wszystkich stałych używanych w aplikacji
 */

export const AppConstants = {
    // Wersja aplikacji
    VERSION: '1.0.0',
    BUILD_DATE: '2025-01-22',
    
    // Nazwy kluczy localStorage
    STORAGE_KEYS: {
        PROGRESS: 'english-flashcards-progress',
        QUIZ_RESULTS: 'english-flashcards-quiz-results',
        SETTINGS: 'english-flashcards-settings',
        STATE: 'english-flashcards-state',
        IMAGES: 'english-flashcards-images',
        BOOKMARKS: 'english-flashcards-bookmarks',
        DIFFICULTY: 'english-flashcards-difficulty',
        THEME: 'english-flashcards-theme',
        USED_QUESTIONS: 'english-flashcards-used-questions'
    },

    // Limity aplikacji
    LIMITS: {
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        MAX_NOTIFICATIONS: 5,
        MAX_QUIZ_HISTORY: 10,
        MAX_STUDY_DATES: 365,
        AUDIO_CACHE_SIZE: 50
    },

    // Ustawienia domyślne
    DEFAULTS: {
        THEME: 'auto',
        AUTO_AUDIO: false,
        SHOW_PHONETICS: true,
        QUIZ_DIFFICULTY: 'medium',
        QUIZ_LANGUAGE: 'en-pl',
        NOTIFICATION_DURATION: 4000,
        FLASHCARD_HEIGHT: 400,
        ANIMATION_DURATION: 300
    },

    // Konfiguracja quizów
    QUIZ_CONFIG: {
        CATEGORY_QUESTIONS: 15,
        CATEGORY_PASS_SCORE: 12,
        RANDOM_QUESTIONS: 20,
        RANDOM_PASS_PERCENTAGE: 70,
        DIFFICULT_QUESTIONS: 15,
        DIFFICULT_PASS_PERCENTAGE: 60,
        FINAL_QUESTIONS: 50,
        FINAL_PASS_SCORE: 42,
        FINAL_TIME_LIMIT: 3600, // sekundy
        MIN_QUIZZES_FOR_DIFFICULT: 5,
        MIN_CATEGORIES_FOR_FINAL: 0.75 // 75%
    },

    // Poziomy trudności
    DIFFICULTY_LEVELS: {
        EASY: {
            name: 'Łatwy',
            color: '#4CAF50',
            multipleChoice: 0.8,
            textInput: 0.2,
            sentenceTranslation: 0.0,
            timeMultiplier: 1.5
        },
        MEDIUM: {
            name: 'Średni',
            color: '#FF9800',
            multipleChoice: 0.6,
            textInput: 0.4,
            sentenceTranslation: 0.0,
            timeMultiplier: 1.0
        },
        HARD: {
            name: 'Trudny',
            color: '#F44336',
            multipleChoice: 0.4,
            textInput: 0.4,
            sentenceTranslation: 0.2,
            timeMultiplier: 0.8
        }
    },

    // Obsługiwane formaty obrazków
    SUPPORTED_IMAGE_FORMATS: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp'
    ],

    // URL-e API
    API_URLS: {
        GOOGLE_TTS: 'https://translate.google.com/translate_tts',
        OXFORD_DICT: 'https://api.oxforddictionaries.com/api/v2',
        CAMBRIDGE_DICT: 'https://dictionary.cambridge.org/api/v1'
    },

    // Obsługiwane języki audio
    AUDIO_LANGUAGES: {
        ENGLISH_US: 'en-US',
        ENGLISH_UK: 'en-GB',
        ENGLISH_AU: 'en-AU'
    },

    // Typy powiadomień
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error', 
        WARNING: 'warning',
        INFO: 'info',
        LOADING: 'loading'
    },

    // Tryby aplikacji
    APP_MODES: {
        FLASHCARDS: 'flashcards',
        QUIZ: 'quiz',
        SENTENCES: 'sentences'
    },

    // Typy pytań quizowych
    QUESTION_TYPES: {
        MULTIPLE_CHOICE: 'multiple-choice',
        TEXT_INPUT: 'text-input',
        SENTENCE_TRANSLATION: 'sentence-translation'
    },

    // Kierunki tłumaczenia
    TRANSLATION_DIRECTIONS: {
        EN_TO_PL: 'en-pl',
        PL_TO_EN: 'pl-en',
        MIXED: 'mixed'
    },

    // Pozycje powiadomień
    NOTIFICATION_POSITIONS: {
        TOP_RIGHT: 'top-right',
        TOP_LEFT: 'top-left',
        BOTTOM_RIGHT: 'bottom-right',
        BOTTOM_LEFT: 'bottom-left',
        TOP_CENTER: 'top-center',
        BOTTOM_CENTER: 'bottom-center'
    },

    // Breakpoints responsywne
    BREAKPOINTS: {
        XS: 320,
        SM: 576,
        MD: 768,
        LG: 1024,
        XL: 1200,
        XXL: 1400
    },

    // Z-Index scale
    Z_INDEX: {
        DROPDOWN: 1000,
        STICKY: 1020,
        FIXED: 1030,
        MODAL_BACKDROP: 1040,
        MODAL: 1050,
        POPOVER: 1060,
        TOOLTIP: 1070,
        TOAST: 1080
    },

    // Kolory semantyczne
    SEMANTIC_COLORS: {
        PRIMARY: '#1e3a8a',
        SUCCESS: '#10b981',
        WARNING: '#f59e0b',
        ERROR: '#ef4444',
        INFO: '#3b82f6'
    },

    // Kategorie słownictwa z metadanymi
    VOCABULARY_CATEGORIES: {
        'build_and_appearance': {
            order: 1,
            color: '#8b5cf6',
            estimatedTime: 45 // minuty
        },
        'personality': {
            order: 2,
            color: '#06b6d4',
            estimatedTime: 40
        },
        'clothes': {
            order: 3,
            color: '#f59e0b',
            estimatedTime: 35
        },
        'age': {
            order: 4,
            color: '#10b981',
            estimatedTime: 30
        },
        'feelings_and_emotions': {
            order: 5,
            color: '#f43f5e',
            estimatedTime: 50
        },
        'body_language': {
            order: 6,
            color: '#8b5cf6',
            estimatedTime: 45
        },
        'family': {
            order: 7,
            color: '#06b6d4',
            estimatedTime: 40
        },
        'friends_and_relations': {
            order: 8,
            color: '#f59e0b',
            estimatedTime: 35
        },
        'celebrations': {
            order: 9,
            color: '#10b981',
            estimatedTime: 40
        },
        'housing_and_living': {
            order: 10,
            color: '#f43f5e',
            estimatedTime: 45
        },
        'house_problems': {
            order: 11,
            color: '#8b5cf6',
            estimatedTime: 40
        },
        'in_the_house': {
            order: 12,
            color: '#06b6d4',
            estimatedTime: 35
        },
        'daily_activities': {
            order: 13,
            color: '#f59e0b',
            estimatedTime: 45
        },
        'hobbies_and_leisure': {
            order: 14,
            color: '#10b981',
            estimatedTime: 50
        },
        'shopping': {
            order: 15,
            color: '#f43f5e',
            estimatedTime: 40
        },
        'talking_about_food': {
            order: 16,
            color: '#8b5cf6',
            estimatedTime: 45
        },
        'food_preparation': {
            order: 17,
            color: '#06b6d4',
            estimatedTime: 40
        },
        'eating_in': {
            order: 18,
            color: '#f59e0b',
            estimatedTime: 35
        },
        'eating_out': {
            order: 19,
            color: '#10b981',
            estimatedTime: 40
        },
        'drinking': {
            order: 20,
            color: '#f43f5e',
            estimatedTime: 30
        },
        'on_the_road': {
            order: 21,
            color: '#8b5cf6',
            estimatedTime: 40
        },
        'driving': {
            order: 22,
            color: '#06b6d4',
            estimatedTime: 35
        },
        'traveling': {
            order: 23,
            color: '#f59e0b',
            estimatedTime: 50
        },
        'holidays': {
            order: 24,
            color: '#10b981',
            estimatedTime: 45
        },
        'health_problems': {
            order: 25,
            color: '#f43f5e',
            estimatedTime: 45
        },
        'at_the_doctor': {
            order: 26,
            color: '#8b5cf6',
            estimatedTime: 40
        },
        'in_hospital': {
            order: 27,
            color: '#06b6d4',
            estimatedTime: 35
        },
        'education': {
            order: 28,
            color: '#f59e0b',
            estimatedTime: 50
        },
        'looking_for_job': {
            order: 29,
            color: '#10b981',
            estimatedTime: 45
        },
        'work_and_career': {
            order: 30,
            color: '#f43f5e',
            estimatedTime: 50
        },
        'film_and_cinema': {
            order: 31,
            color: '#8b5cf6',
            estimatedTime: 40
        },
        'books': {
            order: 32,
            color: '#06b6d4',
            estimatedTime: 45
        },
        'music': {
            order: 33,
            color: '#f59e0b',
            estimatedTime: 40
        },
        'television': {
            order: 34,
            color: '#10b981',
            estimatedTime: 35
        },
        'computers_and_internet': {
            order: 35,
            color: '#f43f5e',
            estimatedTime: 50
        },
        'newspapers_and_magazines': {
            order: 36,
            color: '#8b5cf6',
            estimatedTime: 40
        },
        'weather': {
            order: 37,
            color: '#06b6d4',
            estimatedTime: 35
        },
        'natural_world': {
            order: 38,
            color: '#f59e0b',
            estimatedTime: 50
        }
    },

    // Częstotliwość słów
    WORD_FREQUENCY: {
        HIGH: 'high',
        MEDIUM: 'medium', 
        LOW: 'low'
    },

    // Typy części mowy
    WORD_TYPES: {
        NOUN: 'noun',
        VERB: 'verb',
        ADJECTIVE: 'adjective',
        ADVERB: 'adverb',
        PREPOSITION: 'preposition',
        PRONOUN: 'pronoun',
        CONJUNCTION: 'conjunction',
        INTERJECTION: 'interjection'
    },

    // Regex patterns
    PATTERNS: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^\+?[\d\s\-\(\)]+$/,
        URL: /^https?:\/\/.+/,
        WORD: /^[a-zA-Z\s\-']+$/,
        SENTENCE: /^[a-zA-Z0-9\s\-'.,!?;:()]+$/
    },

    // Czas cache (milisekundy)
    CACHE_DURATION: {
        AUDIO: 30 * 60 * 1000,        // 30 minut
        IMAGES: 24 * 60 * 60 * 1000,  // 24 godziny
        VOCABULARY: 7 * 24 * 60 * 60 * 1000, // 7 dni
        STATS: 5 * 60 * 1000          // 5 minut
    },

    // Konfiguracja animacji
    ANIMATION: {
        FAST: 150,
        NORMAL: 250,
        SLOW: 350,
        CARD_FLIP: 800,
        PAGE_TRANSITION: 500
    },

    // Ustawienia localStorage
    STORAGE_CONFIG: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        COMPRESSION_THRESHOLD: 1024, // 1KB
        AUTO_CLEANUP: true,
        BACKUP_ON_ERROR: true
    },

    // Feature flags
    FEATURES: {
        PWA_ENABLED: true,
        OFFLINE_MODE: true,
        SPEECH_SYNTHESIS: true,
        DRAG_AND_DROP: true,
        KEYBOARD_SHORTCUTS: true,
        ANALYTICS: false,
        BETA_FEATURES: false
    },

    // Błędy aplikacji
    ERROR_CODES: {
        STORAGE_FULL: 'STORAGE_FULL',
        NETWORK_ERROR: 'NETWORK_ERROR',
        AUDIO_ERROR: 'AUDIO_ERROR',
        IMAGE_ERROR: 'IMAGE_ERROR',
        DATA_CORRUPTION: 'DATA_CORRUPTION',
        QUOTA_EXCEEDED: 'QUOTA_EXCEEDED'
    },

    // Komunikaty błędów
    ERROR_MESSAGES: {
        STORAGE_FULL: 'Brak miejsca w pamięci przeglądarki. Usuń stare dane.',
        NETWORK_ERROR: 'Brak połączenia internetowego.',
        AUDIO_ERROR: 'Nie można odtworzyć audio.',
        IMAGE_ERROR: 'Błąd podczas ładowania obrazka.',
        DATA_CORRUPTION: 'Dane aplikacji są uszkodzone.',
        QUOTA_EXCEEDED: 'Przekroczono limit przechowywania danych.'
    },

    // Events aplikacji
    EVENTS: {
        THEME_CHANGED: 'themeChanged',
        CARD_FLIPPED: 'cardFlipped',
        QUIZ_COMPLETED: 'quizCompleted',
        PROGRESS_UPDATED: 'progressUpdated',
        SETTINGS_CHANGED: 'settingsChanged',
        CATEGORY_CHANGED: 'categoryChanged',
        MODE_CHANGED: 'modeChanged',
        WORD_STUDIED: 'wordStudied',
        IMAGE_UPLOADED: 'imageUploaded',
        NOTIFICATION_SHOWN: 'notificationShown'
    },

    // Metryki wydajności
    PERFORMANCE: {
        MAX_RENDER_TIME: 16, // ms (60fps)
        MAX_INTERACTION_DELAY: 100, // ms
        IMAGE_LAZY_THRESHOLD: 100, // px
        DEBOUNCE_SEARCH: 300, // ms
        THROTTLE_SCROLL: 16 // ms
    },

    // Cele nauki
    LEARNING_GOALS: {
        DAILY_CARDS: 20,
        WEEKLY_CATEGORIES: 2,
        MONTHLY_QUIZZES: 10,
        STREAK_TARGET: 7,
        ACCURACY_TARGET: 80
    },

    // Statystyki
    STATS_CATEGORIES: {
        CARDS_STUDIED: 'cardsStudied',
        QUIZZES_COMPLETED: 'quizzesCompleted',
        STREAK_DAYS: 'streakDays',
        ACCURACY_RATE: 'accuracyRate',
        TIME_SPENT: 'timeSpent',
        CATEGORIES_COMPLETED: 'categoriesCompleted'
    }
};

// Funkcje pomocnicze dla stałych
export const AppUtils = {
    /**
     * Pobierz konfigurację poziomu trudności
     */
    getDifficultyConfig(level) {
        return AppConstants.DIFFICULTY_LEVELS[level?.toUpperCase()] || 
               AppConstants.DIFFICULTY_LEVELS.MEDIUM;
    },

    /**
     * Sprawdź czy format obrazka jest obsługiwany
     */
    isImageFormatSupported(mimeType) {
        return AppConstants.SUPPORTED_IMAGE_FORMATS.includes(mimeType);
    },

    /**
     * Pobierz breakpoint dla szerokości ekranu
     */
    getCurrentBreakpoint(width) {
        const bp = AppConstants.BREAKPOINTS;
        if (width < bp.SM) return 'xs';
        if (width < bp.MD) return 'sm';
        if (width < bp.LG) return 'md';
        if (width < bp.XL) return 'lg';
        if (width < bp.XXL) return 'xl';
        return 'xxl';
    },

    /**
     * Sprawdź czy funkcja jest włączona
     */
    isFeatureEnabled(featureName) {
        return AppConstants.FEATURES[featureName] === true;
    },

    /**
     * Pobierz klucz localStorage
     */
    getStorageKey(keyName) {
        return AppConstants.STORAGE_KEYS[keyName];
    },

    /**
     * Pobierz konfigurację quizu
     */
    getQuizConfig(type) {
        const config = AppConstants.QUIZ_CONFIG;
        switch (type) {
            case 'category':
                return {
                    questions: config.CATEGORY_QUESTIONS,
                    passScore: config.CATEGORY_PASS_SCORE
                };
            case 'random':
                return {
                    questions: config.RANDOM_QUESTIONS,
                    passScore: Math.ceil(config.RANDOM_QUESTIONS * config.RANDOM_PASS_PERCENTAGE / 100)
                };
            case 'difficult':
                return {
                    questions: config.DIFFICULT_QUESTIONS,
                    passScore: Math.ceil(config.DIFFICULT_QUESTIONS * config.DIFFICULT_PASS_PERCENTAGE / 100)
                };
            case 'final':
                return {
                    questions: config.FINAL_QUESTIONS,
                    passScore: config.FINAL_PASS_SCORE,
                    timeLimit: config.FINAL_TIME_LIMIT
                };
            default:
                return null;
        }
    },

    /**
     * Walidacja rozmiaru pliku
     */
    validateFileSize(size) {
        return size <= AppConstants.LIMITS.MAX_IMAGE_SIZE;
    },

    /**
     * Format rozmiaru pliku
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    },

    /**
     * Sprawdź czy localStorage jest dostępne
     */
    isStorageAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Sprawdź używane miejsce w localStorage
     */
    getStorageUsage() {
        if (!this.isStorageAvailable()) return { used: 0, available: 0 };
        
        let used = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage[key].length;
            }
        }
        
        return {
            used: used,
            available: AppConstants.STORAGE_CONFIG.MAX_SIZE - used,
            percentage: (used / AppConstants.STORAGE_CONFIG.MAX_SIZE) * 100
        };
    },

    /**
     * Sprawdź czy urządzenie jest mobilne
     */
    isMobile() {
        return window.innerWidth <= AppConstants.BREAKPOINTS.MD;
    },

    /**
     * Sprawdź czy urządzenie obsługuje touch
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * Debugowanie - wypisz informacje o aplikacji
     */
    debugInfo() {
        return {
            version: AppConstants.VERSION,
            buildDate: AppConstants.BUILD_DATE,
            storage: this.getStorageUsage(),
            breakpoint: this.getCurrentBreakpoint(window.innerWidth),
            features: AppConstants.FEATURES,
            performance: {
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                } : null,
                timing: performance.timing
            }
        };
    }
};

// Funkcje pomocnicze do eksportu jako named exports
export const getDifficultyConfig = AppUtils.getDifficultyConfig.bind(AppUtils);
export const isImageFormatSupported = AppUtils.isImageFormatSupported.bind(AppUtils);
export const getCurrentBreakpoint = AppUtils.getCurrentBreakpoint.bind(AppUtils);
export const isFeatureEnabled = AppUtils.isFeatureEnabled.bind(AppUtils);
export const getStorageKey = AppUtils.getStorageKey.bind(AppUtils);
export const getQuizConfig = AppUtils.getQuizConfig.bind(AppUtils);
export const validateFileSize = AppUtils.validateFileSize.bind(AppUtils);
export const formatFileSize = AppUtils.formatFileSize.bind(AppUtils);
export const isStorageAvailable = AppUtils.isStorageAvailable.bind(AppUtils);
export const getStorageUsage = AppUtils.getStorageUsage.bind(AppUtils);
export const isMobile = AppUtils.isMobile.bind(AppUtils);
export const isTouchDevice = AppUtils.isTouchDevice.bind(AppUtils);
export const debugInfo = AppUtils.debugInfo.bind(AppUtils);

// Default export dla kompatybilności
export default {
    AppConstants,
    AppUtils,
    // Re-export named functions
    getDifficultyConfig,
    isImageFormatSupported,
    getCurrentBreakpoint,
    isFeatureEnabled,
    getStorageKey,
    getQuizConfig,
    validateFileSize,
    formatFileSize,
    isStorageAvailable,
    getStorageUsage,
    isMobile,
    isTouchDevice,
    debugInfo
};

// 🔧 KOMPATYBILNOŚĆ WSTECZNA: Eksport globalny dla starszego kodu
if (typeof window !== 'undefined') {
    window.AppConstants = AppConstants;
    window.AppUtils = AppUtils;
    
    // Debug command dla konsoli
    window.debugApp = () => {
        console.table(AppUtils.debugInfo());
    };
}