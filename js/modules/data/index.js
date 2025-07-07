/**
 * Data Module - Main Export File
 * Główny plik eksportów dla modularnego systemu ładowania danych
 * 
 * @version 2.0.0
 * @description Refaktoryzowany system ładowania danych z modularną architekturą
 */
import { DataLoader, createDataLoader, createMinimalDataLoader, createDebugDataLoader } from './data-loader.js';
// 🏗️ GŁÓWNE KLASY
export { DataLoader, createDataLoader, createMinimalDataLoader, createDebugDataLoader } from './data-loader.js';

// 🎯 STRATEGIE ŁADOWANIA
export { CacheStrategy } from './strategies/cache-strategy.js';
export { FileLoadingStrategy } from './strategies/file-strategy.js';
export { EmbeddedLoadingStrategy } from './strategies/embedded-strategy.js';

// 📊 ŹRÓDŁA DANYCH
export { 
    EMBEDDED_VOCABULARY, 
    getEmbeddedVocabulary 
} from './sources/embedded-vocabulary.js';

export { 
    MINIMAL_VOCABULARY, 
    getMinimalVocabulary 
} from './sources/minimal-vocabulary.js';

export { 
    DEFAULT_CATEGORIES, 
    CATEGORY_GROUPS, 
    CATEGORIES_METADATA,
    getDefaultCategories,
    categoryExists,
    getCategoryGroup,
    getCategoriesFromGroup
} from './sources/default-categories.js';

// 🔍 WALIDACJA I DIAGNOSTYKA
export { VocabularyValidator } from './validators/vocabulary-validator.js';
export { DataDiagnostics } from './diagnostics/data-diagnostics.js';

// 🏭 FACTORY FUNCTIONS dla różnych przypadków użycia

/**
 * Tworzy podstawowy DataLoader dla produkcji
 */
export function createProductionDataLoader() {
    return new DataLoader({
        enableCache: true,
        enableValidation: false, // Wyłączone dla wydajności
        enableDiagnostics: false,
        cacheOptions: {
            maxSize: 100
        },
        fileOptions: {
            retries: 3,
            timeout: 10000
        }
    });
}

/**
 * Tworzy DataLoader dla developmentu z pełnym debuggingiem
 */
export function createDevelopmentDataLoader() {
    return new DataLoader({
        enableCache: true,
        enableValidation: true,
        enableDiagnostics: true,
        validationOptions: {
            strict: true,
            logErrors: true,
            throwOnError: false
        },
        cacheOptions: {
            maxSize: 50
        },
        fileOptions: {
            retries: 2,
            timeout: 5000
        }
    });
}

/**
 * Tworzy DataLoader dla trybu offline (tylko dane wbudowane)
 */
export function createOfflineDataLoader() {
    return new DataLoader({
        enableCache: true,
        enableValidation: false,
        enableDiagnostics: false,
        embeddedOptions: {
            preferMinimal: false,
            showNotifications: true
        }
    });
}

/**
 * Tworzy lekki DataLoader dla testów jednostkowych
 */
export function createTestDataLoader() {
    return new DataLoader({
        enableCache: false,
        enableValidation: true,
        enableDiagnostics: false,
        embeddedOptions: {
            preferMinimal: true,
            showNotifications: false
        },
        validationOptions: {
            strict: false,
            logErrors: false,
            throwOnError: true
        }
    });
}

// 🔧 UTILITY FUNCTIONS

/**
 * Szybka funkcja do załadowania tylko słownictwa
 */
export async function loadVocabularyQuick(options = {}) {
    const loader = createDataLoader(options);
    try {
        return await loader.loadVocabulary();
    } finally {
        loader.cleanup();
    }
}

/**
 * Szybka funkcja do załadowania tylko kategorii
 */
export async function loadCategoriesQuick(options = {}) {
    const loader = createDataLoader(options);
    try {
        return await loader.loadCategories();
    } finally {
        loader.cleanup();
    }
}

/**
 * Załaduj wszystkie dane jednocześnie
 */
export async function loadAllData(options = {}) {
    const loader = createDataLoader(options);
    try {
        const [vocabulary, categories] = await Promise.all([
            loader.loadVocabulary(),
            loader.loadCategories()
        ]);
        
        return {
            vocabulary,
            categories,
            loader, // Zwróć loader dla dalszego użycia
            cacheStats: loader.getCacheStats()
        };
    } catch (error) {
        loader.cleanup();
        throw error;
    }
}

/**
 * Sprawdź dostępność wszystkich komponentów systemu
 */
export async function checkSystemHealth() {
    const loader = createDevelopmentDataLoader();
    
    try {
        console.group('🏥 Sprawdzanie zdrowia systemu danych');
        
        const results = {
            timestamp: new Date().toISOString(),
            protocol: loader.getProtocolInfo(),
            cache: loader.getCacheStats(),
            files: await loader.checkAllFiles(),
            diagnostics: null,
            dataIntegrity: null,
            overall: 'unknown'
        };

        // Uruchom diagnostykę jeśli dostępna
        if (loader.diagnostics) {
            results.diagnostics = await loader.runDiagnostics();
        }

        // Test integralności danych
        try {
            const vocabulary = await loader.loadVocabulary();
            if (loader.validator) {
                const validation = loader.validator.validate(vocabulary);
                results.dataIntegrity = validation;
            }
        } catch (error) {
            results.dataIntegrity = {
                valid: false,
                error: error.message
            };
        }

        // Określ ogólny stan
        const hasErrors = [
            !results.protocol.canUseFetch && results.files?.availableCount === 0,
            results.dataIntegrity?.valid === false,
            results.diagnostics?.overall?.status === 'critical'
        ].some(Boolean);

        results.overall = hasErrors ? 'unhealthy' : 'healthy';

        console.log(`🎯 Stan systemu: ${results.overall.toUpperCase()}`);
        console.groupEnd();

        return results;
        
    } finally {
        loader.cleanup();
    }
}

/**
 * Waliduj dane bez ładowania przez DataLoader
 */
export function validateVocabularyData(vocabulary, options = {}) {
    const validator = new VocabularyValidator(options);
    return validator.validate(vocabulary);
}

/**
 * Debug całego systemu - dla problemów technicznych
 */
export async function debugDataSystem() {
    console.group('🐛 Debug systemu danych');
    
    const loader = createDebugDataLoader();
    
    try {
        // Debug głównej klasy
        loader.debug();
        
        // Test wszystkich strategii
        console.group('🧪 Test strategii');
        console.log('📁 File Strategy:', loader.fileStrategy.isAvailable());
        console.log('📦 Embedded Strategy:', loader.embeddedStrategy.isAvailable());
        
        if (loader.fileStrategy.isAvailable()) {
            loader.fileStrategy.debug();
        }
        
        loader.embeddedStrategy.debug();
        console.groupEnd();
        
        // Sprawdź dostępność danych
        console.group('📊 Test dostępności danych');
        const embedded = loader.embeddedStrategy.checkEmbeddedDataAvailability();
        console.log('Embedded data:', embedded);
        
        if (loader.fileStrategy.isAvailable()) {
            const files = await loader.checkAllFiles();
            console.log('File data:', files);
        }
        console.groupEnd();
        
        // Sprawdź wydajność
        if (loader.diagnostics) {
            console.group('⚡ Test wydajności');
            await loader.diagnostics.testDataLoadingPerformance(loader);
            console.groupEnd();
        }
        
        return loader.getDiagnostics();
        
    } finally {
        loader.cleanup();
        console.groupEnd();
    }
}

// 📋 METADATA MODUŁU
export const MODULE_INFO = {
    name: 'Data Loading Module',
    version: '2.0.0',
    description: 'Modularny system ładowania danych dla English Flashcards',
    author: 'English Learning App',
    
    components: {
        strategies: ['CacheStrategy', 'FileLoadingStrategy', 'EmbeddedLoadingStrategy'],
        sources: ['EMBEDDED_VOCABULARY', 'MINIMAL_VOCABULARY', 'DEFAULT_CATEGORIES'],
        validators: ['VocabularyValidator'],
        diagnostics: ['DataDiagnostics'],
        main: ['DataLoader']
    },
    
    factoryFunctions: [
        'createProductionDataLoader',
        'createDevelopmentDataLoader', 
        'createOfflineDataLoader',
        'createTestDataLoader'
    ],
    
    utilities: [
        'loadVocabularyQuick',
        'loadCategoriesQuick', 
        'loadAllData',
        'checkSystemHealth',
        'validateVocabularyData',
        'debugDataSystem'
    ]
};

// 🎯 COMPATIBILITY LAYER dla oryginalnego API
export const LegacyDataLoader = DataLoader;

// 🚀 AUTO-INITIALIZATION dla prostego użycia
let defaultLoader = null;

/**
 * Pobierz domyślną instancję DataLoader (singleton)
 */
export function getDefaultLoader() {
    if (!defaultLoader) {
        // Wybierz odpowiedni loader na podstawie środowiska
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
        
        defaultLoader = isDevelopment 
            ? createDevelopmentDataLoader()
            : createProductionDataLoader();
            
        console.log(`🏭 Utworzono domyślny ${isDevelopment ? 'development' : 'production'} DataLoader`);
    }
    
    return defaultLoader;
}

/**
 * Resetuj domyślny loader
 */
export function resetDefaultLoader() {
    if (defaultLoader) {
        defaultLoader.cleanup();
        defaultLoader = null;
        console.log('🔄 Domyślny loader zresetowany');
    }
}

// 📚 EXAMPLES dla dokumentacji
export const USAGE_EXAMPLES = {
    basic: `
// Podstawowe użycie
import { createDataLoader } from './data/index.js';

const loader = createDataLoader();
const vocabulary = await loader.loadVocabulary();
`,
    
    production: `
// Dla produkcji
import { createProductionDataLoader } from './data/index.js';

const loader = createProductionDataLoader();
const data = await loadAllData();
`,
    
    development: `
// Dla developmentu z debuggingiem
import { createDevelopmentDataLoader, checkSystemHealth } from './data/index.js';

const health = await checkSystemHealth();
const loader = createDevelopmentDataLoader();
`,
    
    offline: `
// Tryb offline
import { createOfflineDataLoader } from './data/index.js';

const loader = createOfflineDataLoader();
const vocabulary = await loader.loadVocabulary(); // Tylko dane wbudowane
`,
    
    testing: `
// Dla testów
import { createTestDataLoader, validateVocabularyData } from './data/index.js';

const loader = createTestDataLoader();
const vocabulary = await loader.loadVocabulary();
const validation = validateVocabularyData(vocabulary);
`
};

console.log('📦 Data Module v2.0.0 załadowany - wszystkie komponenty dostępne');
console.log('💡 Użyj debugDataSystem() aby sprawdzić stan systemu');
console.log('📚 Sprawdź USAGE_EXAMPLES dla przykładów użycia');

// Export jako default dla łatwiejszego importu
export default {
    DataLoader,
    createDataLoader,
    createProductionDataLoader,
    createDevelopmentDataLoader,
    createOfflineDataLoader,
    getDefaultLoader,
    loadAllData,
    checkSystemHealth,
    MODULE_INFO
};