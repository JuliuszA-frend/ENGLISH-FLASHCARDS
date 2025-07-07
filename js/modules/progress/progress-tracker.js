/**
 * ProgressTracker - Śledzenie postępu nauki
 * Odpowiedzialny wyłącznie za śledzenie które słowa zostały przejrzane
 */
class ProgressTracker {
    constructor(storageAdapter) {
        this.storage = storageAdapter;
        this.vocabulary = null;
        this.storageKey = 'progress';
        
        // Walidatory danych
        this.validators = {
            progress: (data) => this.validateProgressData(data),
            vocabulary: (data) => this.validateVocabularyData(data)
        };
    }

    /**
     * Ustawienie słownictwa z walidacją
     */
    setVocabulary(vocabulary) {
        if (!this.validators.vocabulary(vocabulary)) {
            console.error('❌ Nieprawidłowa struktura słownictwa');
            return false;
        }

        this.vocabulary = vocabulary;
        console.log(`📚 ProgressTracker: załadowano ${this.getTotalWordCount()} słów w ${Object.keys(vocabulary.categories).length} kategoriach`);
        
        // Aktualizuj statystyki kategorii przy zmianie słownictwa
        this.updateAllCategoryStats();
        
        return true;
    }

    /**
     * Oznaczenie słowa jako przejrzane
     */
    markWordAsStudied(category, wordIndex, wordId = null) {
        if (!this.vocabulary) {
            console.warn('⚠️ Brak załadowanego słownictwa');
            return false;
        }

        if (!this.vocabulary.categories[category]) {
            console.warn(`⚠️ Kategoria ${category} nie istnieje`);
            return false;
        }

        const progress = this.loadProgress();
        const cardId = this.generateCardId(category, wordIndex, wordId);
        
        // Sprawdź czy słowo już było przejrzane
        if (progress.studiedCards.includes(cardId)) {
            return false; // Już było przejrzane
        }

        // Dodaj do przejrzanych
        progress.studiedCards.push(cardId);
        progress.lastStudied = new Date().toISOString();
        
        // Aktualizuj statystyki kategorii
        this.updateCategoryStats(progress, category);
        
        // Aktualizuj daty nauki
        this.updateStudyDates(progress);
        
        // Zapisz progress
        this.saveProgress(progress);
        
        console.log(`📈 Słowo oznaczone jako nauczone: ${cardId}`);
        return true;
    }

    /**
     * Sprawdzenie czy słowo zostało przejrzane
     */
    isWordStudied(category, wordIndex, wordId = null) {
        const progress = this.loadProgress();
        const cardId = this.generateCardId(category, wordIndex, wordId);
        
        return progress.studiedCards.includes(cardId);
    }

    /**
     * Pobieranie postępu kategorii
     */
    getCategoryProgress(category) {
        const progress = this.loadProgress();
        const categoryStats = progress.categoryStats[category];
        const currentTotal = this.getCategoryWordCount(category);
        
        if (categoryStats) {
            // Aktualizuj total jeśli się zmienił
            if (categoryStats.total !== currentTotal) {
                categoryStats.total = currentTotal;
                this.saveProgress(progress);
            }
            
            return {
                studied: categoryStats.studied || 0,
                total: currentTotal,
                percentage: currentTotal > 0 ? Math.round((categoryStats.studied || 0) / currentTotal * 100) : 0,
                lastAccess: categoryStats.lastAccess
            };
        }
        
        // Jeśli brak statystyk, zwróć domyślne
        return {
            studied: 0,
            total: currentTotal,
            percentage: 0,
            lastAccess: null
        };
    }

    /**
     * Pobieranie ogólnych statystyk postępu
     */
    getOverallProgress() {
        const progress = this.loadProgress();
        const totalWords = this.getTotalWordCount();
        const studiedCount = progress.studiedCards.length;
        const studyStreak = this.calculateStudyStreak(progress.studyDates);
        
        return {
            totalStudied: studiedCount,
            totalWords: totalWords,
            studiedPercentage: totalWords > 0 ? Math.round((studiedCount / totalWords) * 100) : 0,
            studyStreak: studyStreak,
            lastStudied: progress.lastStudied,
            categoriesStats: this.getAllCategoriesProgress()
        };
    }

    /**
     * Reset postępu kategorii
     */
    resetCategory(categoryKey) {
        if (!this.vocabulary || !this.vocabulary.categories[categoryKey]) {
            console.warn(`⚠️ Kategoria ${categoryKey} nie istnieje`);
            return false;
        }

        const progress = this.loadProgress();
        
        // Usuń słowa tej kategorii z przejrzanych
        const categoryPrefix = `${categoryKey}-`;
        const oldCount = progress.studiedCards.length;
        
        progress.studiedCards = progress.studiedCards.filter(cardId => 
            !cardId.startsWith(categoryPrefix)
        );
        
        const removedCount = oldCount - progress.studiedCards.length;
        
        // Resetuj statystyki kategorii
        if (progress.categoryStats[categoryKey]) {
            delete progress.categoryStats[categoryKey];
        }
        
        // Zapisz zmiany
        this.saveProgress(progress);
        
        console.log(`🔄 Reset kategorii ${categoryKey}: usunięto ${removedCount} słów`);
        return true;
    }

    /**
     * Reset całego postępu
     */
    resetAllProgress() {
        const defaultProgress = this.getDefaultProgress();
        this.saveProgress(defaultProgress);
        console.log('🔄 Cały postęp został zresetowany');
        return true;
    }

    /**
     * Prywatne metody pomocnicze
     */

    /**
     * Generowanie ID karty
     */
    generateCardId(category, wordIndex, wordId = null) {
        if (wordId) {
            return `${category}-${wordId}`;
        }
        return `${category}-${wordIndex}`;
    }

    /**
     * Aktualizacja statystyk kategorii
     */
    updateCategoryStats(progress, category) {
        if (!progress.categoryStats[category]) {
            progress.categoryStats[category] = {
                studied: 0,
                total: this.getCategoryWordCount(category),
                lastAccess: new Date().toISOString()
            };
        }
        
        // Przelicz ile słów z tej kategorii zostało przejrzanych
        const categoryPrefix = `${category}-`;
        const studiedInCategory = progress.studiedCards.filter(cardId => 
            cardId.startsWith(categoryPrefix)
        ).length;
        
        progress.categoryStats[category].studied = studiedInCategory;
        progress.categoryStats[category].total = this.getCategoryWordCount(category);
        progress.categoryStats[category].lastAccess = new Date().toISOString();
    }

    /**
     * Aktualizacja statystyk wszystkich kategorii
     */
    updateAllCategoryStats() {
        if (!this.vocabulary) return false;
        
        const progress = this.loadProgress();
        let updated = false;
        
        Object.keys(this.vocabulary.categories).forEach(categoryKey => {
            const currentTotal = this.getCategoryWordCount(categoryKey);
            
            if (!progress.categoryStats[categoryKey]) {
                progress.categoryStats[categoryKey] = {
                    studied: 0,
                    total: currentTotal,
                    lastAccess: null
                };
                updated = true;
            } else if (progress.categoryStats[categoryKey].total !== currentTotal) {
                progress.categoryStats[categoryKey].total = currentTotal;
                updated = true;
            }
            
            // Przelicz studied
            this.updateCategoryStats(progress, categoryKey);
        });
        
        if (updated) {
            this.saveProgress(progress);
        }
        
        return updated;
    }

    /**
     * Pobieranie postępu wszystkich kategorii
     */
    getAllCategoriesProgress() {
        if (!this.vocabulary) return {};
        
        const result = {};
        
        Object.keys(this.vocabulary.categories).forEach(categoryKey => {
            result[categoryKey] = this.getCategoryProgress(categoryKey);
        });
        
        return result;
    }

    /**
     * Liczenie słów w kategorii
     */
    getCategoryWordCount(category) {
        if (!this.vocabulary || !this.vocabulary.categories || !this.vocabulary.categories[category]) {
            return 0;
        }
        
        const categoryData = this.vocabulary.categories[category];
        
        if (!categoryData.words || !Array.isArray(categoryData.words)) {
            return 0;
        }
        
        return categoryData.words.length;
    }

    /**
     * Łączna liczba słów
     */
    getTotalWordCount() {
        if (!this.vocabulary || !this.vocabulary.categories) {
            return 0;
        }
        
        return Object.values(this.vocabulary.categories).reduce((total, category) => {
            return total + (category.words ? category.words.length : 0);
        }, 0);
    }

    /**
     * Aktualizacja dat nauki
     */
    updateStudyDates(progress) {
        const today = new Date().toISOString().split('T')[0];
        
        if (!progress.studyDates.includes(today)) {
            progress.studyDates.push(today);
            
            // Zachowaj tylko ostatnie 365 dni
            if (progress.studyDates.length > 365) {
                progress.studyDates = progress.studyDates.slice(-365);
            }
        }
    }

    /**
     * Obliczanie serii dni nauki
     */
    calculateStudyStreak(studyDates) {
        if (!studyDates || studyDates.length === 0) return 0;
        
        const today = new Date();
        let streak = 0;
        let checkDate = new Date(today);
        
        // Sortuj daty od najnowszych
        const sortedDates = studyDates
            .map(date => new Date(date))
            .sort((a, b) => b - a);
        
        for (const studyDate of sortedDates) {
            const daysDiff = Math.floor((checkDate - studyDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (daysDiff > streak) {
                break;
            }
        }
        
        return streak;
    }

    /**
     * Ładowanie danych postępu
     */
    loadProgress() {
        return this.storage.load(this.storageKey, this.getDefaultProgress(), {
            validate: this.validators.progress,
            silent: true
        });
    }

    /**
     * Zapisywanie danych postępu
     */
    saveProgress(progress) {
        return this.storage.save(this.storageKey, progress, {
            validate: this.validators.progress,
            silent: true
        });
    }

    /**
     * Domyślna struktura danych postępu
     */
    getDefaultProgress() {
        return {
            studiedCards: [],
            studyDates: [],
            categoryStats: {},
            lastStudied: null,
            version: '2.0.0',
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Walidatory danych
     */
    validateProgressData(data) {
        return (
            data &&
            typeof data === 'object' &&
            Array.isArray(data.studiedCards) &&
            Array.isArray(data.studyDates) &&
            typeof data.categoryStats === 'object'
        );
    }

    validateVocabularyData(data) {
        return (
            data &&
            typeof data === 'object' &&
            data.categories &&
            typeof data.categories === 'object'
        );
    }

    /**
     * Export danych postępu
     */
    exportData() {
        const progress = this.loadProgress();
        
        return {
            progress: progress,
            metadata: {
                exportDate: new Date().toISOString(),
                totalWords: this.getTotalWordCount(),
                studiedWords: progress.studiedCards.length,
                version: '2.0.0'
            }
        };
    }

    /**
     * Import danych postępu
     */
    importData(data) {
        if (!data.progress || !this.validators.progress(data.progress)) {
            throw new Error('Nieprawidłowe dane postępu do importu');
        }
        
        const result = this.saveProgress(data.progress);
        
        if (result.success) {
            console.log('📥 Dane postępu zaimportowane pomyślnie');
            return true;
        } else {
            throw new Error(`Błąd importu: ${result.error}`);
        }
    }

    /**
     * Diagnostyka postępu
     */
    getDiagnostics() {
        const progress = this.loadProgress();
        const overall = this.getOverallProgress();
        
        return {
            progressData: {
                studiedCards: progress.studiedCards.length,
                studyDates: progress.studyDates.length,
                categories: Object.keys(progress.categoryStats).length,
                lastStudied: progress.lastStudied,
                version: progress.version
            },
            vocabularyData: {
                totalWords: this.getTotalWordCount(),
                totalCategories: this.vocabulary ? Object.keys(this.vocabulary.categories).length : 0,
                vocabularyLoaded: !!this.vocabulary
            },
            statistics: overall,
            storageInfo: {
                storageKey: this.storageKey,
                dataExists: this.storage.exists(this.storageKey)
            }
        };
    }
}

// Export dla ES6 modules
export { ProgressTracker };

// Export default dla wygody
export default ProgressTracker;

console.log('✅ ProgressTracker załadowany');