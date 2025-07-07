/**
 * Module Configuration
 * Konfiguracja modułów dla ModuleLoader
 */

export const MODULE_CONFIG = {
    // Konfiguracja ścieżek modułów
    modules: {
        // Core modules - podstawowe narzędzia bez zależności
        'utils': {
            path: 'js/utils/utils.js',
            dependencies: [],
            init: null,
            type: 'legacy', // Ładowany jako script
            essential: true
        },
        'storage-manager': {
            path: 'js/utils/storage-manager.js', 
            dependencies: [],
            init: null,
            type: 'legacy',
            essential: true
        },
        'notification-manager': {
            path: 'js/utils/notification-manager.js',
            dependencies: [],
            init: null,
            type: 'legacy',
            essential: true
        },

        // Theme module - ES6
        'theme-manager': {
            path: 'js/modules/theme/index.js',
            dependencies: [],
            init: null,
            type: 'es6',
            essential: true
        },

        // Audio module - ES6  
        'audio-manager': {
            path: 'js/modules/audio/index.js',
            dependencies: ['notification-manager'],
            init: null,
            type: 'es6',
            essential: true
        },

        // Image module - ES6
        'image-manager': {
            path: 'js/modules/image/index.js',
            dependencies: ['storage-manager', 'notification-manager'],
            init: null,
            type: 'es6',
            essential: false
        },

        // Progress module - ES6
        'progress-manager': {
            path: 'js/modules/progress/index.js',
            dependencies: ['storage-manager', 'notification-manager'],
            init: null,
            type: 'es6',
            essential: true
        },

        // Flashcard module - ES6
        'flashcard-manager': {
            path: 'js/modules/flashcard/index.js',
            dependencies: ['audio-manager', 'image-manager', 'progress-manager'],
            init: null,
            type: 'es6',
            essential: true
        },

        // Quiz module - ES6
        'quiz-manager': {
            path: 'js/modules/quiz/index.js',
            dependencies: ['utils', 'storage-manager', 'notification-manager'],
            init: null,
            type: 'es6',
            essential: true
        },

        // Bookmarks module - ES6
        'bookmarks-controller': {
            path: 'js/modules/bookmarks/index.js',
            dependencies: ['progress-manager', 'notification-manager'],
            init: null,
            type: 'es6',
            essential: false
        },

        // Data module - ES6
        'data-loader': {
            path: 'js/modules/data/index.js',
            dependencies: ['utils', 'storage-manager'],
            init: null,
            type: 'es6',
            essential: true
        },

        // Main app - ES6
        'app': {
            path: 'js/app.js',
            dependencies: [
                'utils', 'storage-manager', 'notification-manager',
                'theme-manager', 'audio-manager', 'image-manager',
                'progress-manager', 'flashcard-manager', 'quiz-manager',
                'bookmarks-controller', 'data-loader'
            ],
            init: 'initApp',
            type: 'es6',
            essential: true
        }
    },

    // Ustawienia ładowania
    loading: {
        retries: 3,
        retryDelay: 500, // ms
        timeout: 10000, // ms
        parallel: true // Czy ładować zależności równolegle
    },

    // Komunikaty ładowania
    messages: {
        'core': 'Ładowanie podstawowych modułów...',
        'managers': 'Ładowanie menedżerów...',
        'ui': 'Ładowanie komponentów UI...',
        'finalization': 'Finalizacja inicjalizacji...',
        'complete': 'Aplikacja gotowa!'
    },

    // Grupy modułów dla stopniowanego ładowania
    loadingGroups: {
        'core': ['utils', 'storage-manager', 'notification-manager'],
        'theme': ['theme-manager'],
        'managers': ['audio-manager', 'image-manager', 'progress-manager', 'data-loader'],
        'ui': ['flashcard-manager', 'quiz-manager', 'bookmarks-controller'],
        'app': ['app']
    },

    // Procenty postępu dla każdej grupy
    progressSteps: {
        'core': 20,
        'theme': 30,
        'managers': 60,
        'ui': 85,
        'app': 100
    }
};

export default MODULE_CONFIG;