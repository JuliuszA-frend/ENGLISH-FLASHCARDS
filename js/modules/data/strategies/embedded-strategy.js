/**
 * Embedded Data Loading Strategy
 * Strategia ładowania danych wbudowanych w aplikację
 */

import { getEmbeddedVocabulary } from '../sources/embedded-vocabulary.js';
import { getMinimalVocabulary } from '../sources/minimal-vocabulary.js';
import { getDefaultCategories } from '../sources/default-categories.js';

export class EmbeddedLoadingStrategy {
    constructor(options = {}) {
        this.options = {
            preferMinimal: false, // Czy preferować minimalne dane zamiast embedded
            showNotifications: true,
            ...options
        };
    }

    /**
     * Sprawdź czy strategia jest dostępna (zawsze jest)
     */
    isAvailable() {
        return true;
    }

    /**
     * Załaduj słownictwo wbudowane
     */
    async loadVocabulary(type = 'embedded') {
        console.log(`📦 Ładowanie ${type} vocabulary...`);
        
        try {
            let vocabulary;
            
            switch (type) {
                case 'minimal':
                    vocabulary = getMinimalVocabulary();
                    this.showWarning('Załadowano minimalny zestaw danych - dla pełnej funkcjonalności uruchom przez serwer HTTP');
                    break;
                    
                case 'embedded':
                default:
                    vocabulary = getEmbeddedVocabulary();
                    this.showInfo('Używam danych wbudowanych - dla pełnego zestawu uruchom przez serwer HTTP');
                    break;
            }
            
            // Dodaj metadata o źródle
            vocabulary._source = {
                type: 'embedded',
                strategy: 'EmbeddedLoadingStrategy',
                loadedAt: new Date().toISOString(),
                dataType: type
            };
            
            console.log(`✅ Załadowano ${type} vocabulary: ${vocabulary.metadata.totalWords} słów w ${vocabulary.metadata.totalCategories} kategoriach`);
            
            return vocabulary;
            
        } catch (error) {
            console.error(`❌ Błąd ładowania ${type} vocabulary:`, error);
            throw new Error(`Nie udało się załadować danych ${type}: ${error.message}`);
        }
    }

    /**
     * Załaduj kategorie wbudowane
     */
    async loadCategories() {
        console.log('📂 Ładowanie wbudowanych kategorii...');
        
        try {
            const categories = getDefaultCategories();
            
            // Dodaj metadata
            const categoriesWithMetadata = {
                ...categories,
                _source: {
                    type: 'embedded',
                    strategy: 'EmbeddedLoadingStrategy',
                    loadedAt: new Date().toISOString()
                }
            };
            
            console.log(`✅ Załadowano ${Object.keys(categories).length} kategorii`);
            
            return categoriesWithMetadata;
            
        } catch (error) {
            console.error('❌ Błąd ładowania kategorii:', error);
            throw new Error(`Nie udało się załadować kategorii: ${error.message}`);
        }
    }

    /**
     * Tryb awaryjny - załaduj minimalne dane
     */
    async loadEmergencyData() {
        console.warn('🆘 Tryb awaryjny - ładowanie minimalnych danych...');
        
        try {
            const vocabulary = await this.loadVocabulary('minimal');
            const categories = await this.loadCategories();
            
            this.showWarning('Załadowano podstawowy zestaw danych w trybie awaryjnym');
            
            return {
                vocabulary,
                categories,
                emergency: true
            };
            
        } catch (error) {
            console.error('💥 Krytyczny błąd - nie można załadować nawet minimalnych danych:', error);
            throw new Error('Aplikacja nie może się uruchomić - brak danych do załadowania');
        }
    }

    /**
     * Sprawdź dostępność danych wbudowanych
     */
    checkEmbeddedDataAvailability() {
        const checks = {
            embeddedVocabulary: false,
            minimalVocabulary: false,
            defaultCategories: false,
            errors: []
        };

        try {
            const embedded = getEmbeddedVocabulary();
            checks.embeddedVocabulary = !!(embedded && embedded.categories);
            
            if (!checks.embeddedVocabulary) {
                checks.errors.push('Embedded vocabulary jest niepełne lub uszkodzone');
            }
        } catch (error) {
            checks.errors.push(`Błąd embedded vocabulary: ${error.message}`);
        }

        try {
            const minimal = getMinimalVocabulary();
            checks.minimalVocabulary = !!(minimal && minimal.categories);
            
            if (!checks.minimalVocabulary) {
                checks.errors.push('Minimal vocabulary jest niepełne lub uszkodzone');
            }
        } catch (error) {
            checks.errors.push(`Błąd minimal vocabulary: ${error.message}`);
        }

        try {
            const categories = getDefaultCategories();
            checks.defaultCategories = !!(categories && Object.keys(categories).length > 0);
            
            if (!checks.defaultCategories) {
                checks.errors.push('Default categories są niepełne lub uszkodzone');
            }
        } catch (error) {
            checks.errors.push(`Błąd default categories: ${error.message}`);
        }

        console.group('🔍 Sprawdzenie danych wbudowanych');
        console.log('📦 Embedded vocabulary:', checks.embeddedVocabulary ? '✅' : '❌');
        console.log('📦 Minimal vocabulary:', checks.minimalVocabulary ? '✅' : '❌');
        console.log('📂 Default categories:', checks.defaultCategories ? '✅' : '❌');
        
        if (checks.errors.length > 0) {
            console.warn('⚠️ Błędy:', checks.errors);
        }
        
        console.groupEnd();

        return checks;
    }

    /**
     * Porównaj rozmiary danych
     */
    getDataSizeComparison() {
        try {
            const embedded = getEmbeddedVocabulary();
            const minimal = getMinimalVocabulary();
            
            const embeddedSize = JSON.stringify(embedded).length;
            const minimalSize = JSON.stringify(minimal).length;
            
            const comparison = {
                embedded: {
                    size: embeddedSize,
                    sizeFormatted: this.formatBytes(embeddedSize),
                    words: embedded.metadata.totalWords,
                    categories: embedded.metadata.totalCategories
                },
                minimal: {
                    size: minimalSize,
                    sizeFormatted: this.formatBytes(minimalSize),
                    words: minimal.metadata.totalWords,
                    categories: minimal.metadata.totalCategories
                },
                ratio: (embeddedSize / minimalSize).toFixed(1)
            };
            
            console.log('📊 Porównanie rozmiarów danych:');
            console.table(comparison);
            
            return comparison;
            
        } catch (error) {
            console.error('❌ Błąd porównania rozmiarów:', error);
            return null;
        }
    }

    /**
     * Automatyczny wybór typu danych na podstawie warunków
     */
    async loadOptimalData(conditions = {}) {
        const {
            isOffline = false,
            lowMemory = false,
            quickStart = false
        } = conditions;

        console.log('🎯 Wybór optymalnych danych:', conditions);

        // Logika wyboru
        let dataType = 'embedded'; // Domyślnie

        if (quickStart || lowMemory) {
            dataType = 'minimal';
            console.log('⚡ Wybrano minimalne dane dla szybkiego startu');
        } else if (isOffline) {
            dataType = 'embedded';
            console.log('📦 Wybrano dane embedded dla trybu offline');
        }

        return this.loadVocabulary(dataType);
    }

    /**
     * Pokazanie powiadomienia (jeśli włączone)
     */
    showNotification(message, type = 'info') {
        if (!this.options.showNotifications) return;
        
        if (typeof window !== 'undefined' && window.NotificationManager) {
            const duration = type === 'warning' ? 6000 : 4000;
            window.NotificationManager.show(message, type, duration);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    /**
     * Formatowanie bajtów
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Pobierz konfigurację strategii
     */
    getConfig() {
        return {
            ...this.options,
            isAvailable: this.isAvailable(),
            protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown'
        };
    }

    /**
     * Debug strategii
     */
    debug() {
        console.group('🔍 Debug Embedded Loading Strategy');
        
        console.log('⚙️ Konfiguracja:', this.getConfig());
        
        const availability = this.checkEmbeddedDataAvailability();
        const sizeComparison = this.getDataSizeComparison();
        
        console.log('📊 Dostępność danych:', availability);
        
        if (sizeComparison) {
            console.log('📏 Porównanie rozmiarów:', sizeComparison);
        }
        
        console.groupEnd();
    }
}