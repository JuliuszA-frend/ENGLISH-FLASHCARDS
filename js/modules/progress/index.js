/**
 * ProgressManager - Refaktoryzowana wersja 2.0
 * Główny moduł łączący wszystkie wyspecjalizowane komponenty
 * 
 * Kompatybilny z istniejącą aplikacją - wszystkie publiczne metody zachowane
 */

// Import wszystkich modułów
import { StorageAdapter } from './storage-adapter.js';
import { ProgressTracker } from './progress-tracker.js';
import { BookmarksManager } from './bookmarks-manager.js';
import { DifficultyManager } from './difficulty-manager.js';
import { StatsCalculator } from './stats-calculator.js';

class ProgressManager {
    constructor() {
        console.log('🔄 Inicjalizuję ProgressManager 2.0...');
        
        // Inicjalizacja storage adapter
        this.storage = new StorageAdapter('english-flashcards');
        
        // Inicjalizacja wyspecjalizowanych menedżerów
        this.progressTracker = new ProgressTracker(this.storage);
        this.bookmarksManager = new BookmarksManager(this.storage);
        this.difficultyManager = new DifficultyManager(this.storage);
        this.statsCalculator = new StatsCalculator(
            this.progressTracker,
            this.bookmarksManager, 
            this.difficultyManager
        );
        
        // Zachowanie kompatybilności - stare klucze storage
        this.legacyKeys = {
            progress: 'english-flashcards-progress',
            bookmarks: 'english-flashcards-bookmarks', 
            difficulty: 'english-flashcards-difficulty'
        };
        
        // Flagi inicjalizacji
        this.isInitialized = false;
        this.vocabulary = null;
        
        // Sprawdź i migruj stare dane
        this.checkAndMigrateLegacyData();
        
        console.log('✅ ProgressManager 2.0 zainicjalizowany');
    }

    /**
     * KOMPATYBILNOŚĆ: Ustawienie słownictwa
     */
    setVocabulary(vocabulary) {
        console.log('📚 ProgressManager 2.0: Ustawianie słownictwa...');
        
        this.vocabulary = vocabulary;
        
        // Przekaż słownictwo do wszystkich menedżerów
        const results = {
            progressTracker: this.progressTracker.setVocabulary(vocabulary),
            bookmarksManager: this.bookmarksManager.setVocabulary(vocabulary),
            difficultyManager: this.difficultyManager.setVocabulary(vocabulary)
        };
        
        // Sprawdź czy wszystkie moduły zaakceptowały słownictwo
        const allSuccess = Object.values(results).every(result => result === true);
        
        if (allSuccess) {
            this.isInitialized = true;
            console.log('✅ Słownictwo przekazane do wszystkich modułów');
        } else {
            console.warn('⚠️ Niektóre moduły nie zaakceptowały słownictwa:', results);
        }
        
        return allSuccess;
    }

    /**
     * KOMPATYBILNOŚĆ: Oznaczenie słowa jako przejrzane
     */
    markWordAsStudied(category, wordIndex, wordId = null) {
        if (!this.isInitialized) {
            console.warn('⚠️ ProgressManager nie jest zainicjalizowany');
            return false;
        }
        
        return this.progressTracker.markWordAsStudied(category, wordIndex, wordId);
    }

    /**
     * KOMPATYBILNOŚĆ: Pobranie postępu kategorii
     */
    getCategoryProgress(category) {
        if (!this.isInitialized) {
            return { studied: 0, total: 0, percentage: 0 };
        }
        
        return this.progressTracker.getCategoryProgress(category);
    }

    /**
     * KOMPATYBILNOŚĆ: Pobranie ogólnych statystyk
     */
    getOverallStats() {
        if (!this.isInitialized) {
            return {
                totalStudied: 0,
                totalWords: 0,
                studyStreak: 0,
                favoriteCategory: null,
                studiedPercentage: 0
            };
        }
        
        // Używaj nowego StatsCalculator
        const detailedStats = this.statsCalculator.getOverallStats();
        
        // Mapuj na starą strukturę dla kompatybilności
        return {
            totalStudied: detailedStats.progress.totalStudied,
            totalWords: detailedStats.progress.totalWords,
            studyStreak: detailedStats.progress.studyStreak,
            favoriteCategory: this.getFavoriteCategory(),
            studiedPercentage: detailedStats.progress.studiedPercentage,
            
            // NOWE: Dodaj dodatkowe dane (opcjonalne)
            bookmarks: detailedStats.bookmarks,
            difficulty: detailedStats.difficulty,
            engagement: detailedStats.activity.engagementScore
        };
    }

    /**
     * KOMPATYBILNOŚĆ: Ulubiona kategoria (backward compatibility)
     */
    getFavoriteCategory() {
        if (!this.isInitialized) return null;
        
        const categoryStats = this.statsCalculator.getCategoryStats();
        let maxStudied = 0;
        let favoriteCategory = null;
        
        Object.entries(categoryStats).forEach(([key, stats]) => {
            if (stats.studied > maxStudied) {
                maxStudied = stats.studied;
                favoriteCategory = key;
            }
        });
        
        return favoriteCategory;
    }

    /**
     * KOMPATYBILNOŚĆ: Toggle bookmark słowa
     */
    toggleWordBookmark(word) {
        if (!this.isInitialized) {
            console.warn('⚠️ ProgressManager nie jest zainicjalizowany');
            return false;
        }
        
        const result = this.bookmarksManager.toggleBookmark(word);
        
        // Emit event dla kompatybilności z UI
        if (typeof window !== 'undefined' && window.document && result !== null) {
            const event = new CustomEvent('bookmarkChanged', {
                detail: {
                    word: word,
                    isBookmarked: result,
                    wordKey: this.bookmarksManager.generateWordKey(word)
                }
            });
            document.dispatchEvent(event);
        }
        
        return result;
    }

    /**
     * KOMPATYBILNOŚĆ: Sprawdzenie czy słowo jest bookmark
     */
    isWordBookmarked(word) {
        if (!this.isInitialized) return false;
        
        return this.bookmarksManager.isBookmarked(word);
    }

    /**
     * KOMPATYBILNOŚĆ: Pobranie wszystkich bookmark
     */
    getAllBookmarkedWords() {
        if (!this.isInitialized) return [];
        
        return this.bookmarksManager.getAllBookmarkedWords();
    }

    /**
     * KOMPATYBILNOŚĆ: Statystyki bookmark
     */
    getBookmarkStats() {
        if (!this.isInitialized) {
            return {
                totalBookmarks: 0,
                totalCategories: 0,
                topCategory: null,
                recentlyAdded: []
            };
        }
        
        return this.bookmarksManager.getBookmarkStats();
    }

    /**
     * KOMPATYBILNOŚĆ: Toggle trudności słowa
     */
    toggleWordDifficulty(word) {
        if (!this.isInitialized) {
            console.warn('⚠️ ProgressManager nie jest zainicjalizowany');
            return word.difficulty || 'medium';
        }
        
        return this.difficultyManager.toggleWordDifficulty(word);
    }

    /**
     * KOMPATYBILNOŚĆ: Pobranie trudności słowa
     */
    getWordDifficulty(word) {
        if (!this.isInitialized) {
            return word.difficulty || 'medium';
        }
        
        return this.difficultyManager.getWordDifficulty(word);
    }

    /**
     * KOMPATYBILNOŚĆ: Ustawienie trudności słowa
     */
    setWordDifficulty(word, level) {
        if (!this.isInitialized) return false;
        
        return this.difficultyManager.setWordDifficulty(word, level);
    }

    /**
     * KOMPATYBILNOŚĆ: Statystyki trudności
     */
    getDifficultyStats() {
        if (!this.isInitialized) {
            return { easy: 0, medium: 0, hard: 0, total: 0 };
        }
        
        return this.difficultyManager.getDifficultyStats();
    }

    /**
     * KOMPATYBILNOŚĆ: Słowa według poziomu trudności
     */
    getAllWordsByDifficultyLevel(level) {
        if (!this.isInitialized) return [];
        
        return this.difficultyManager.getAllWordsByDifficultyLevel(level);
    }

    /**
     * KOMPATYBILNOŚĆ: Reset kategorii
     */
    resetCategory(categoryKey) {
        if (!this.isInitialized) return false;
        
        return this.progressTracker.resetCategory(categoryKey);
    }

    /**
     * KOMPATYBILNOŚĆ: Aktualizacja statystyk kategorii
     */
    updateAllCategoryStats() {
        if (!this.isInitialized) return false;
        
        return this.progressTracker.updateAllCategoryStats();
    }

    /**
     * KOMPATYBILNOŚĆ: Export danych
     */
    exportData() {
        const exportData = {
            metadata: {
                version: '2.0.0',
                exportDate: new Date().toISOString(),
                compatibilityMode: true
            }
        };
        
        // Dodaj dane z każdego modułu
        if (this.progressTracker) {
            exportData.progress = this.progressTracker.exportData();
        }
        
        if (this.bookmarksManager) {
            exportData.bookmarks = this.bookmarksManager.exportBookmarks();
        }
        
        if (this.difficultyManager) {
            exportData.difficulty = this.difficultyManager.exportDifficulties();
        }
        
        // Dla kompatybilności - stary format
        exportData.legacy = {
            progress: this.progressTracker ? this.progressTracker.loadProgress() : {},
            bookmarks: this.bookmarksManager ? this.bookmarksManager.loadBookmarks() : [],
            difficulty: this.difficultyManager ? this.difficultyManager.loadDifficulties() : {}
        };
        
        return exportData;
    }

    /**
     * KOMPATYBILNOŚĆ: Import danych
     */
    importData(data) {
        console.log('📥 ProgressManager 2.0: Importowanie danych...');
        
        try {
            let importSuccess = true;
            
            // Import do nowych modułów
            if (data.progress && this.progressTracker) {
                try {
                    this.progressTracker.importData(data.progress);
                } catch (error) {
                    console.warn('⚠️ Błąd importu progress:', error);
                    importSuccess = false;
                }
            }
            
            if (data.bookmarks && this.bookmarksManager) {
                try {
                    this.bookmarksManager.importBookmarks(data.bookmarks);
                } catch (error) {
                    console.warn('⚠️ Błąd importu bookmarks:', error);
                    importSuccess = false;
                }
            }
            
            if (data.difficulty && this.difficultyManager) {
                try {
                    this.difficultyManager.importDifficulties(data.difficulty);
                } catch (error) {
                    console.warn('⚠️ Błąd importu difficulty:', error);
                    importSuccess = false;
                }
            }
            
            // Fallback - spróbuj importować z legacy format
            if (data.legacy && !importSuccess) {
                console.log('🔄 Próbuję import z legacy format...');
                this.importLegacyData(data.legacy);
            }
            
            console.log('✅ Import danych zakończony');
            return true;
            
        } catch (error) {
            console.error('❌ Błąd importu danych:', error);
            return false;
        }
    }

    /**
     * KOMPATYBILNOŚĆ: Reset wszystkich danych
     */
    reset() {
        console.log('🔄 ProgressManager 2.0: Reset wszystkich danych...');
        
        // Reset każdego modułu
        if (this.progressTracker) {
            this.progressTracker.resetAllProgress();
        }
        
        if (this.bookmarksManager) {
            this.bookmarksManager.clearAllBookmarks();
        }
        
        if (this.difficultyManager) {
            this.difficultyManager.resetAllDifficulties();
        }
        
        // Wyczyść cache w stats calculator
        if (this.statsCalculator) {
            this.statsCalculator.clearCache();
        }
        
        console.log('✅ Reset zakończony');
    }

    /**
     * NOWE METODY - Dodatkowe funkcjonalności
     */

    /**
     * Zaawansowane statystyki (nowa funkcjonalność)
     */
    getDetailedStats() {
        return this.statsCalculator.getOverallStats();
    }

    /**
     * Wyszukiwanie w bookmarks
     */
    searchBookmarks(query, options = {}) {
        if (!this.isInitialized) return [];
        
        return this.bookmarksManager.searchBookmarks(query, options);
    }

    /**
     * Bulk operacje na trudności
     */
    setMultipleWordsDifficulty(words, level) {
        if (!this.isInitialized) return 0;
        
        return this.difficultyManager.setMultipleWordsDifficulty(words, level);
    }

    /**
     * Diagnostyka całego systemu
     */
    getSystemDiagnostics() {
        return {
            version: '2.0.0',
            initialized: this.isInitialized,
            vocabulary: !!this.vocabulary,
            
            storage: this.storage.getDiagnostics(),
            progressTracker: this.progressTracker.getDiagnostics(),
            bookmarksManager: this.bookmarksManager.getDiagnostics(),
            difficultyManager: this.difficultyManager.getDiagnostics(),
            statsCalculator: this.statsCalculator.getDiagnostics(),
            
            performance: {
                memoryUsage: this.getMemoryUsage(),
                cacheStatus: this.getCacheStatus()
            }
        };
    }

    /**
     * MIGRACJA: Sprawdzenie i migracja starych danych
     */
    checkAndMigrateLegacyData() {
        console.log('🔍 Sprawdzam legacy data...');
        
        // Sprawdź czy istnieją stare dane
        const hasLegacyProgress = localStorage.getItem(this.legacyKeys.progress);
        const hasLegacyBookmarks = localStorage.getItem(this.legacyKeys.bookmarks);
        const hasLegacyDifficulty = localStorage.getItem(this.legacyKeys.difficulty);
        
        if (hasLegacyProgress || hasLegacyBookmarks || hasLegacyDifficulty) {
            console.log('📦 Znaleziono legacy data - rozpoczynam migrację...');
            
            try {
                const legacyData = {
                    progress: hasLegacyProgress ? JSON.parse(hasLegacyProgress) : null,
                    bookmarks: hasLegacyBookmarks ? JSON.parse(hasLegacyBookmarks) : null,
                    difficulty: hasLegacyDifficulty ? JSON.parse(hasLegacyDifficulty) : null
                };
                
                this.migrateLegacyData(legacyData);
                console.log('✅ Migracja legacy data zakończona');
                
            } catch (error) {
                console.error('❌ Błąd migracji legacy data:', error);
            }
        } else {
            console.log('📭 Brak legacy data do migracji');
        }
    }

    /**
     * Migracja starych danych
     */
    migrateLegacyData(legacyData) {
        // Migruj progress
        if (legacyData.progress && !this.storage.exists('progress')) {
            console.log('📈 Migruję progress data...');
            this.storage.save('progress', legacyData.progress);
        }
        
        // Migruj bookmarks
        if (legacyData.bookmarks && !this.storage.exists('bookmarks')) {
            console.log('🔖 Migruję bookmarks data...');
            this.storage.save('bookmarks', legacyData.bookmarks);
        }
        
        // Migruj difficulty
        if (legacyData.difficulty && !this.storage.exists('difficulty')) {
            console.log('⭐ Migruję difficulty data...');
            this.storage.save('difficulty', legacyData.difficulty);
        }
    }

    /**
     * Import legacy danych
     */
    importLegacyData(legacyData) {
        if (legacyData.progress) {
            this.storage.save('progress', legacyData.progress);
        }
        
        if (legacyData.bookmarks) {
            this.storage.save('bookmarks', legacyData.bookmarks);
        }
        
        if (legacyData.difficulty) {
            this.storage.save('difficulty', legacyData.difficulty);
        }
    }

    /**
     * Pomocnicze metody
     */
    getMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
            };
        }
        return { available: false };
    }

    getCacheStatus() {
        return {
            statsCalculator: this.statsCalculator.cache.size,
            storage: 'N/A' // StorageAdapter nie ma cache
        };
    }

    /**
     * KOMPATYBILNOŚĆ: Dodatkowe metody ze starego API
     */

    // Stare nazwy metod - aliasy dla kompatybilności
    getWordKey(word) {
        return this.bookmarksManager.generateWordKey(word);
    }

    loadProgress() {
        return this.progressTracker.loadProgress();
    }

    saveProgress(progress) {
        return this.progressTracker.saveProgress(progress);
    }

    loadBookmarks() {
        return this.bookmarksManager.loadBookmarks();
    }

    saveBookmarks(bookmarks) {
        return this.bookmarksManager.saveBookmarks(bookmarks);
    }

    loadDifficulty() {
        return this.difficultyManager.loadDifficulties();
    }

    saveDifficulty(difficulty) {
        return this.difficultyManager.saveDifficulties(difficulty);
    }

    // Metody, które mogły być używane w aplikacji
    clearAllBookmarks() {
        return this.bookmarksManager.clearAllBookmarks();
    }

    resetAllDifficulties() {
        return this.difficultyManager.resetAllDifficulties();
    }

    /**
     * Konfiguracja modułów
     */
    configureModules(config) {
        if (config.storage) {
            // StorageAdapter config jeśli potrzebne
        }
        
        if (config.difficulty) {
            this.difficultyManager.updateSettings(config.difficulty);
        }
        
        if (config.stats) {
            this.statsCalculator.updateSettings(config.stats);
        }
        
        console.log('⚙️ Konfiguracja modułów zaktualizowana');
    }
}

// Export dla ES6 modules
export { 
    ProgressManager,
    StorageAdapter,
    ProgressTracker, 
    BookmarksManager,
    DifficultyManager,
    StatsCalculator
};

// Export default dla wygody
export default ProgressManager;

// Informacja o załadowaniu
console.log(`
🎉 PROGRESS MANAGER 2.0 ZAŁADOWANY

📊 Nowa architektura modularna:
  ✅ StorageAdapter - Ujednolicone storage
  ✅ ProgressTracker - Śledzenie postępu  
  ✅ BookmarksManager - Zarządzanie ulubionymi
  ✅ DifficultyManager - Poziomy trudności
  ✅ StatsCalculator - Zaawansowane statystyki

🔄 Pełna kompatybilność z poprzednią wersją
📈 Ulepszona wydajność i czytelność kodu
🛡️ Lepsze zabezpieczenia i walidacja danych

Ready to use! 🚀
`);