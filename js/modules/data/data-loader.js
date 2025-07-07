/**
 * DataLoader - Refaktoryzowana wersja
 * Orkiestrująca klasa do ładowania danych z fallback dla CORS
 */

import { CacheStrategy } from './strategies/cache-strategy.js';
import { FileLoadingStrategy } from './strategies/file-strategy.js';
import { EmbeddedLoadingStrategy } from './strategies/embedded-strategy.js';
import { VocabularyValidator } from './validators/vocabulary-validator.js';
import { DataDiagnostics } from './diagnostics/data-diagnostics.js';

export class DataLoader {
    constructor(options = {}) {
        this.options = {
            enableCache: true,
            enableValidation: true,
            enableDiagnostics: false,
            cacheOptions: {},
            fileOptions: {},
            embeddedOptions: {},
            validationOptions: {},
            ...options
        };

        // Inicjalizacja strategii
        this.cache = new CacheStrategy(this.options.cacheOptions);
        this.fileStrategy = new FileLoadingStrategy(this.options.fileOptions);
        this.embeddedStrategy = new EmbeddedLoadingStrategy(this.options.embeddedOptions);
        
        // Opcjonalne komponenty
        this.validator = this.options.enableValidation 
            ? new VocabularyValidator(this.options.validationOptions) 
            : null;
            
        this.diagnostics = this.options.enableDiagnostics 
            ? new DataDiagnostics() 
            : null;

        // Status i informacje o protokole
        this.isFileProtocol = window.location.protocol === 'file:';
        
        console.log('🏗️ DataLoader zainicjalizowany:', {
            cache: this.options.enableCache,
            validation: this.options.enableValidation,
            diagnostics: this.options.enableDiagnostics,
            protocol: window.location.protocol
        });
    }

    /**
     * 🎯 GŁÓWNA METODA: Ładowanie słownictwa z inteligentnym fallback
     */
    async loadVocabulary() {
        const cacheKey = 'vocabulary';
        
        console.group('📚 Ładowanie słownictwa');
        
        try {
            // 1. Sprawdź cache
            if (this.options.enableCache && this.cache.has(cacheKey)) {
                console.log('⚡ Zwracam dane z cache');
                console.groupEnd();
                return this.cache.get(cacheKey);
            }

            // 2. Sprawdź czy nie trwa już ładowanie
            if (this.cache.isLoading(cacheKey)) {
                console.log('⏳ Oczekuję na zakończenie trwającego ładowania...');
                const data = await this.cache.waitForLoading(cacheKey);
                console.groupEnd();
                return data;
            }

            // 3. Rozpocznij ładowanie
            this.cache.setLoading(cacheKey);
            
            // 4. Spróbuj załadować używając strategii ładowania
            const vocabulary = await this.loadVocabularyWithStrategies();
            
            // 5. Walidacja (jeśli włączona)
            if (this.validator) {
                console.log('🔍 Walidacja danych...');
                const validation = this.validator.validate(vocabulary);
                
                if (!validation.valid) {
                    console.warn('⚠️ Walidacja nie powiodła się, ale kontynuuję:', validation.errors);
                }
                
                // Dodaj wyniki walidacji do danych
                vocabulary._validation = validation;
            }

            // 6. Zapisz do cache
            if (this.options.enableCache) {
                this.cache.setWithTimestamp(cacheKey, vocabulary);
            }

            console.log('✅ Słownictwo załadowane pomyślnie');
            console.groupEnd();
            
            return vocabulary;

        } catch (error) {
            console.error('❌ Błąd ładowania słownictwa:', error);
            
            // Ostatnia deska ratunku - spróbuj załadować minimalne dane
            try {
                console.log('🆘 Próba załadowania danych awaryjnych...');
                const emergencyData = await this.embeddedStrategy.loadEmergencyData();
                
                if (this.options.enableCache) {
                    this.cache.set(cacheKey, emergencyData.vocabulary);
                }
                
                console.groupEnd();
                return emergencyData.vocabulary;
                
            } catch (emergencyError) {
                console.error('💥 Krytyczny błąd - nie można załadować żadnych danych:', emergencyError);
                throw new Error('Nie można załadować żadnych danych słownictwa');
            }
        } finally {
            this.cache.setLoaded(cacheKey);
        }
    }

    /**
     * 🔄 Strategia ładowania słownictwa w kolejności priorytetów
     */
    async loadVocabularyWithStrategies() {
        const strategies = [
            {
                name: 'File Strategy',
                condition: () => this.fileStrategy.isAvailable(),
                loader: () => this.loadFromFileWithFallback()
            },
            {
                name: 'Embedded Strategy',
                condition: () => this.embeddedStrategy.isAvailable(),
                loader: () => this.embeddedStrategy.loadVocabulary('embedded')
            },
            {
                name: 'Minimal Strategy',
                condition: () => true, // Zawsze dostępna
                loader: () => this.embeddedStrategy.loadVocabulary('minimal')
            }
        ];

        for (const strategy of strategies) {
            if (!strategy.condition()) {
                console.log(`⏭️ Pomijam ${strategy.name} - niedostępna`);
                continue;
            }

            try {
                console.log(`🎯 Próbuję ${strategy.name}...`);
                const data = await strategy.loader();
                
                if (data && data.categories) {
                    console.log(`✅ ${strategy.name} - sukces`);
                    return data;
                }
                
                console.warn(`⚠️ ${strategy.name} - niepełne dane`);
                
            } catch (error) {
                console.warn(`❌ ${strategy.name} - błąd:`, error.message);
            }
        }

        throw new Error('Wszystkie strategie ładowania nie powiodły się');
    }

    /**
     * 📁 Ładowanie z pliku z fallback URL
     */
    async loadFromFileWithFallback() {
        const primaryUrls = [
            'data/vocabulary.json',
            './data/vocabulary.json'
        ];
        
        const fallbackUrls = [
            'assets/data/vocabulary.json',
            'public/data/vocabulary.json'
        ];

        return this.fileStrategy.loadWithFallback(primaryUrls[0], [...primaryUrls.slice(1), ...fallbackUrls]);
    }

    /**
     * 📂 Ładowanie kategorii
     */
    async loadCategories() {
        const cacheKey = 'categories';
        
        console.group('📂 Ładowanie kategorii');
        
        try {
            // Sprawdź cache
            if (this.options.enableCache && this.cache.has(cacheKey)) {
                console.log('⚡ Zwracam kategorie z cache');
                console.groupEnd();
                return this.cache.get(cacheKey);
            }

            let categories;

            // Strategia ładowania kategorii
            if (this.fileStrategy.isAvailable()) {
                try {
                    console.log('🎯 Próbuję załadować kategorie z pliku...');
                    categories = await this.loadCategoriesFromFile();
                    console.log('✅ Kategorie załadowane z pliku');
                } catch (error) {
                    console.warn('❌ Nie można załadować kategorii z pliku:', error.message);
                    console.log('🔄 Przełączam na dane wbudowane...');
                    categories = await this.embeddedStrategy.loadCategories();
                }
            } else {
                console.log('📦 Ładuję kategorie wbudowane...');
                categories = await this.embeddedStrategy.loadCategories();
            }

            // Zapisz do cache
            if (this.options.enableCache) {
                this.cache.setWithTimestamp(cacheKey, categories);
            }

            console.log('✅ Kategorie załadowane pomyślnie');
            console.groupEnd();
            
            return categories;

        } catch (error) {
            console.error('❌ Błąd ładowania kategorii:', error);
            console.groupEnd();
            
            // Fallback na domyślne kategorie
            return this.embeddedStrategy.loadCategories();
        }
    }

    /**
     * 📁 Ładowanie kategorii z pliku
     */
    async loadCategoriesFromFile() {
        const urls = [
            'data/categories.json',
            './data/categories.json',
            'assets/data/categories.json'
        ];

        return this.fileStrategy.loadWithFallback(urls[0], urls.slice(1));
    }

    /**
     * 🔄 Odświeżanie danych (wymusza ponowne załadowanie)
     */
    async refreshData() {
        console.log('🔄 Odświeżanie wszystkich danych...');
        
        // Wyczyść cache
        this.clearCache();
        
        // Załaduj ponownie
        const [vocabulary, categories] = await Promise.all([
            this.loadVocabulary(),
            this.loadCategories()
        ]);

        console.log('✅ Dane odświeżone pomyślnie');
        
        return { vocabulary, categories };
    }

    /**
     * 🔍 Sprawdzenie dostępności plików
     */
    async checkFileAvailability(url) {
        if (!this.fileStrategy.isAvailable()) {
            return false;
        }
        
        return this.fileStrategy.checkFileAvailability(url);
    }

    /**
     * 📊 Sprawdzenie wszystkich standardowych plików
     */
    async checkAllFiles() {
        if (!this.fileStrategy.isAvailable()) {
            return {
                available: false,
                reason: 'File strategy niedostępna (protokół file://)',
                files: []
            };
        }

        const files = await this.fileStrategy.checkStandardFiles();
        const availableCount = files.filter(f => f.available).length;
        
        return {
            available: availableCount > 0,
            availableCount,
            totalCount: files.length,
            files
        };
    }

    /**
     * 🧪 Uruchomienie diagnostyki systemu
     */
    async runDiagnostics() {
        if (!this.diagnostics) {
            console.warn('⚠️ Diagnostyka wyłączona - włącz opcję enableDiagnostics');
            return null;
        }

        console.log('🔬 Uruchamiam pełną diagnostykę...');
        return this.diagnostics.runFullDiagnostics(this);
    }

    /**
     * 📋 Pobranie informacji o protokole
     */
    getProtocolInfo() {
        return {
            protocol: window.location.protocol,
            isFile: this.isFileProtocol,
            isSecure: window.location.protocol === 'https:',
            canUseFetch: !this.isFileProtocol,
            host: window.location.host,
            origin: window.location.origin
        };
    }

    /**
     * 🧹 Czyszczenie cache
     */
    clearCache() {
        if (this.options.enableCache) {
            this.cache.clear();
            console.log('🧹 Cache wyczyszczony');
        }
    }

    /**
     * 📊 Sprawdzenie czy dane są w cache
     */
    isCached(key) {
        return this.options.enableCache && this.cache.has(key);
    }

    /**
     * 📈 Statystyki cache
     */
    getCacheStats() {
        if (!this.options.enableCache) {
            return { enabled: false };
        }
        
        return {
            enabled: true,
            ...this.cache.getStats()
        };
    }

    /**
     * 🔧 Optymalizacja cache
     */
    optimizeCache(maxSize = 50) {
        if (this.options.enableCache) {
            return this.cache.optimize(maxSize);
        }
        return false;
    }

    /**
     * 📦 Prefetch danych (ładowanie w tle)
     */
    async prefetchData() {
        if (!this.options.enableCache) {
            console.warn('⚠️ Prefetch wymaga włączonego cache');
            return false;
        }

        console.log('📦 Rozpoczynam prefetch danych...');
        
        const promises = [
            this.cache.prefetch('vocabulary', () => this.loadVocabularyWithStrategies()),
            this.cache.prefetch('categories', () => this.loadCategoriesFromFile().catch(() => this.embeddedStrategy.loadCategories()))
        ];

        try {
            await Promise.all(promises);
            console.log('✅ Prefetch zakończony pomyślnie');
            return true;
        } catch (error) {
            console.warn('⚠️ Błąd podczas prefetch:', error);
            return false;
        }
    }

    /**
     * 📊 Pobranie pełnych diagnostycznych informacji
     */
    getDiagnostics() {
        const baseInfo = {
            timestamp: new Date().toISOString(),
            protocol: this.getProtocolInfo(),
            cache: this.getCacheStats(),
            strategies: {
                file: {
                    available: this.fileStrategy.isAvailable(),
                    config: this.fileStrategy.getConfig()
                },
                embedded: {
                    available: this.embeddedStrategy.isAvailable(),
                    config: this.embeddedStrategy.getConfig()
                }
            },
            validation: {
                enabled: !!this.validator,
                config: this.validator?.options
            }
        };

        // Dodaj wyniki diagnostyki jeśli dostępne
        if (this.diagnostics && this.diagnostics.results.length > 0) {
            baseInfo.lastDiagnostics = this.diagnostics.results[this.diagnostics.results.length - 1];
        }

        return baseInfo;
    }

    /**
     * 🔄 Resetowanie do stanu początkowego
     */
    reset() {
        console.log('🔄 Resetowanie DataLoader...');
        
        this.clearCache();
        
        if (this.validator) {
            this.validator.reset();
        }
        
        console.log('✅ DataLoader zresetowany');
    }

    /**
     * 🧪 Debug mode - szczegółowe logowanie
     */
    debug() {
        console.group('🔍 Debug DataLoader');
        
        console.log('⚙️ Konfiguracja:', this.options);
        console.log('📊 Informacje o protokole:', this.getProtocolInfo());
        console.log('💾 Statystyki cache:', this.getCacheStats());
        
        // Debug strategii
        console.group('🎯 Strategie ładowania');
        console.log('📁 File Strategy:', this.fileStrategy.getConfig());
        console.log('📦 Embedded Strategy:', this.embeddedStrategy.getConfig());
        console.groupEnd();
        
        // Debug komponentów opcjonalnych
        if (this.validator) {
            console.log('🔍 Validator dostępny:', !!this.validator);
        }
        
        if (this.diagnostics) {
            console.log('🧪 Diagnostics dostępna:', !!this.diagnostics);
        }
        
        // Debug cache
        if (this.options.enableCache) {
            this.cache.debug();
        }
        
        console.groupEnd();
    }

    /**
     * 📤 Eksport konfiguracji
     */
    exportConfig() {
        return {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            options: this.options,
            protocol: this.getProtocolInfo(),
            strategies: {
                file: this.fileStrategy.isAvailable(),
                embedded: this.embeddedStrategy.isAvailable()
            },
            cache: this.getCacheStats()
        };
    }

    /**
     * 🧹 Cleanup - zwolnienie zasobów
     */
    cleanup() {
        console.log('🧹 Czyszczenie zasobów DataLoader...');
        
        this.clearCache();
        
        // Resetuj referencje
        this.cache = null;
        this.fileStrategy = null;
        this.embeddedStrategy = null;
        this.validator = null;
        this.diagnostics = null;
        
        console.log('✅ Zasoby DataLoader zwolnione');
    }
}

// 🆔 Kompatybilność z oryginalnym API - statyczne metody
DataLoader.getEmbeddedVocabulary = function() {
    console.warn('⚠️ DEPRECATED: Użyj EmbeddedLoadingStrategy.loadVocabulary()');
    const strategy = new EmbeddedLoadingStrategy();
    return strategy.loadVocabulary('embedded');
};

DataLoader.getMinimalVocabulary = function() {
    console.warn('⚠️ DEPRECATED: Użyj EmbeddedLoadingStrategy.loadVocabulary("minimal")');
    const strategy = new EmbeddedLoadingStrategy();
    return strategy.loadVocabulary('minimal');
};

DataLoader.getDefaultCategories = function() {
    console.warn('⚠️ DEPRECATED: Użyj EmbeddedLoadingStrategy.loadCategories()');
    const strategy = new EmbeddedLoadingStrategy();
    return strategy.loadCategories();
};

// 🏭 Factory funkcje dla łatwego tworzenia instancji
export function createDataLoader(options = {}) {
    return new DataLoader(options);
}

export function createMinimalDataLoader() {
    return new DataLoader({
        enableCache: false,
        enableValidation: false,
        enableDiagnostics: false,
        embeddedOptions: { preferMinimal: true }
    });
}

export function createDebugDataLoader() {
    return new DataLoader({
        enableCache: true,
        enableValidation: true,
        enableDiagnostics: true,
        validationOptions: { strict: true, logErrors: true }
    });
}

console.log('✅ Refaktoryzowany DataLoader załadowany - wersja 2.0.0');