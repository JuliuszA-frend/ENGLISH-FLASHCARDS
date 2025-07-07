/**
 * StatsCalculator - Obliczanie statystyk
 * Odpowiedzialny za agregację i kalkulację statystyk z wszystkich modułów
 */
class StatsCalculator {
    constructor(progressTracker, bookmarksManager, difficultyManager) {
        this.progressTracker = progressTracker;
        this.bookmarksManager = bookmarksManager;
        this.difficultyManager = difficultyManager;
        
        // Cache dla expensive calculations
        this.cache = new Map();
        this.cacheTimeout = 5000; // 5 sekund
        
        // Ustawienia
        this.settings = {
            enableCaching: true,
            detailedCalculations: true,
            includeHistoricalData: true
        };
    }

    /**
     * Pobieranie kompletnych statystyk aplikacji
     */
    getOverallStats() {
        const cacheKey = 'overall-stats';
        
        if (this.settings.enableCaching && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey).data;
        }

        const stats = {
            // Statystyki postępu
            progress: this.getProgressStats(),
            
            // Statystyki bookmarks
            bookmarks: this.getBookmarksStats(),
            
            // Statystyki trudności
            difficulty: this.getDifficultyStats(),
            
            // Statystyki aktywności
            activity: this.getActivityStats(),
            
            // Statystyki kategorii
            categories: this.getCategoryStats(),
            
            // Metadane
            metadata: this.getMetadata()
        };

        // Cache wynik
        if (this.settings.enableCaching) {
            this.setCacheValue(cacheKey, stats);
        }

        return stats;
    }

    /**
     * Statystyki postępu nauki
     */
    getProgressStats() {
        if (!this.progressTracker) {
            return this.getEmptyProgressStats();
        }

        const progressData = this.progressTracker.getOverallProgress();
        
        return {
            totalStudied: progressData.totalStudied,
            totalWords: progressData.totalWords,
            studiedPercentage: progressData.studiedPercentage,
            studyStreak: progressData.studyStreak,
            lastStudied: progressData.lastStudied,
            
            // Dodatkowe obliczenia
            wordsRemaining: progressData.totalWords - progressData.totalStudied,
            averageWordsPerDay: this.calculateAverageWordsPerDay(),
            estimatedCompletionDays: this.calculateEstimatedCompletion(progressData),
            
            // Breakdown według kategorii
            categoryBreakdown: progressData.categoriesStats
        };
    }

    /**
     * Statystyki bookmarks
     */
    getBookmarksStats() {
        if (!this.bookmarksManager) {
            return this.getEmptyBookmarksStats();
        }

        const bookmarkStats = this.bookmarksManager.getBookmarkStats();
        
        return {
            totalBookmarks: bookmarkStats.totalBookmarks,
            totalCategories: bookmarkStats.totalCategories,
            topCategory: bookmarkStats.topCategory,
            recentlyAdded: bookmarkStats.recentlyAdded,
            storageUsage: bookmarkStats.storageUsage,
            
            // Dodatkowe obliczenia
            bookmarksPercentage: this.calculateBookmarksPercentage(bookmarkStats),
            averageBookmarksPerCategory: this.calculateAverageBookmarksPerCategory(bookmarkStats),
            bookmarksTrend: this.calculateBookmarksTrend(),
            
            // Breakdown według kategorii
            categoryStats: bookmarkStats.categoryStats
        };
    }

    /**
     * Statystyki trudności
     */
    getDifficultyStats() {
        if (!this.difficultyManager) {
            return this.getEmptyDifficultyStats();
        }

        const difficultyStats = this.difficultyManager.getDifficultyStats();
        const categoryBreakdown = this.difficultyManager.getDifficultyByCategory();
        
        return {
            easy: difficultyStats.easy,
            medium: difficultyStats.medium,
            hard: difficultyStats.hard,
            total: difficultyStats.total,
            customCount: difficultyStats.customCount,
            
            // Percentages
            easyPercentage: this.calculatePercentage(difficultyStats.easy, difficultyStats.total),
            mediumPercentage: this.calculatePercentage(difficultyStats.medium, difficultyStats.total),
            hardPercentage: this.calculatePercentage(difficultyStats.hard, difficultyStats.total),
            customPercentage: this.calculatePercentage(difficultyStats.customCount, difficultyStats.total),
            
            // Dodatkowe obliczenia
            difficultyBalance: this.calculateDifficultyBalance(difficultyStats),
            recommendedFocus: this.calculateRecommendedFocus(difficultyStats),
            
            // Breakdown według kategorii
            categoryBreakdown: categoryBreakdown
        };
    }

    /**
     * Statystyki aktywności użytkownika
     */
    getActivityStats() {
        const progressData = this.progressTracker ? this.progressTracker.getOverallProgress() : null;
        const bookmarksData = this.bookmarksManager ? this.bookmarksManager.getBookmarkStats() : null;
        
        return {
            studyStreak: progressData ? progressData.studyStreak : 0,
            lastStudied: progressData ? progressData.lastStudied : null,
            
            // Aktywność bookmarks
            recentBookmarks: bookmarksData ? bookmarksData.recentlyAdded.length : 0,
            
            // Wzorce aktywności
            activityPattern: this.calculateActivityPattern(),
            engagementScore: this.calculateEngagementScore(),
            consistencyScore: this.calculateConsistencyScore(),
            
            // Dodatkowe metryki
            averageSessionLength: this.calculateAverageSessionLength(),
            peakActivityDay: this.calculatePeakActivityDay(),
            weeklyProgress: this.calculateWeeklyProgress()
        };
    }

    /**
     * Statystyki kategorii
     */
    getCategoryStats() {
        if (!this.progressTracker) {
            return {};
        }

        const categoryProgress = this.progressTracker.getAllCategoriesProgress();
        const difficultyByCategory = this.difficultyManager ? 
            this.difficultyManager.getDifficultyByCategory() : {};
        const bookmarksByCategory = this.calculateBookmarksByCategory();
        
        const categoryStats = {};
        
        Object.entries(categoryProgress).forEach(([categoryKey, progress]) => {
            categoryStats[categoryKey] = {
                // Podstawowe info
                name: this.getCategoryName(categoryKey),
                icon: this.getCategoryIcon(categoryKey),
                
                // Progress
                studied: progress.studied,
                total: progress.total,
                percentage: progress.percentage,
                lastAccess: progress.lastAccess,
                
                // Difficulty breakdown
                difficulty: difficultyByCategory[categoryKey] || this.getEmptyDifficultyStats(),
                
                // Bookmarks
                bookmarksCount: bookmarksByCategory[categoryKey] || 0,
                
                // Dodatkowe metryki
                completionRate: progress.percentage,
                difficultyScore: this.calculateCategoryDifficultyScore(categoryKey),
                engagementLevel: this.calculateCategoryEngagement(categoryKey),
                recommendedAction: this.getRecommendedAction(progress, categoryKey)
            };
        });
        
        return categoryStats;
    }

    /**
     * Metadane i informacje systemowe
     */
    getMetadata() {
        return {
            calculatedAt: new Date().toISOString(),
            version: '2.0.0',
            
            // Info o modułach
            modules: {
                progressTracker: !!this.progressTracker,
                bookmarksManager: !!this.bookmarksManager,
                difficultyManager: !!this.difficultyManager
            },
            
            // Cache info
            cacheEnabled: this.settings.enableCaching,
            cacheSize: this.cache.size,
            
            // Ustawienia kalkulacji
            settings: { ...this.settings }
        };
    }

    /**
     * Zaawansowane kalkulacje
     */

    /**
     * Obliczanie średniej liczby słów dziennie
     */
    calculateAverageWordsPerDay() {
        if (!this.progressTracker) return 0;
        
        const progressData = this.progressTracker.getOverallProgress();
        const studyDates = this.progressTracker.loadProgress().studyDates;
        
        if (!studyDates || studyDates.length === 0) return 0;
        
        const totalDays = studyDates.length;
        return totalDays > 0 ? Math.round(progressData.totalStudied / totalDays) : 0;
    }

    /**
     * Szacowanie dni do ukończenia
     */
    calculateEstimatedCompletion(progressData) {
        const wordsRemaining = progressData.totalWords - progressData.totalStudied;
        const averagePerDay = this.calculateAverageWordsPerDay();
        
        if (averagePerDay === 0) return null;
        
        return Math.ceil(wordsRemaining / averagePerDay);
    }

    /**
     * Procent słów w bookmarks
     */
    calculateBookmarksPercentage(bookmarkStats) {
        if (!this.progressTracker) return 0;
        
        const totalWords = this.progressTracker.getTotalWordCount();
        return totalWords > 0 ? 
            Math.round((bookmarkStats.totalBookmarks / totalWords) * 100) : 0;
    }

    /**
     * Średnia liczba bookmarks na kategorię
     */
    calculateAverageBookmarksPerCategory(bookmarkStats) {
        return bookmarkStats.totalCategories > 0 ? 
            Math.round(bookmarkStats.totalBookmarks / bookmarkStats.totalCategories) : 0;
    }

    /**
     * Trend dodawania bookmarks
     */
    calculateBookmarksTrend() {
        // Simplified - można rozbudować o analizę dat
        const recentBookmarks = this.bookmarksManager ? 
            this.bookmarksManager.getBookmarkStats().recentlyAdded : [];
        
        if (recentBookmarks.length === 0) return 'none';
        
        // Analiza dat dodania z ostatnich 7 dni
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const recentCount = recentBookmarks.filter(bookmark => 
            bookmark.bookmarkedAt && new Date(bookmark.bookmarkedAt) > weekAgo
        ).length;
        
        if (recentCount > 5) return 'increasing';
        if (recentCount > 2) return 'stable';
        return 'decreasing';
    }

    /**
     * Balans trudności
     */
    calculateDifficultyBalance(difficultyStats) {
        const total = difficultyStats.total;
        if (total === 0) return 'unknown';
        
        const idealEasy = 0.3;    // 30%
        const idealMedium = 0.5;  // 50%
        const idealHard = 0.2;    // 20%
        
        const actualEasy = difficultyStats.easy / total;
        const actualMedium = difficultyStats.medium / total;
        const actualHard = difficultyStats.hard / total;
        
        const deviation = Math.abs(actualEasy - idealEasy) + 
                         Math.abs(actualMedium - idealMedium) + 
                         Math.abs(actualHard - idealHard);
        
        if (deviation < 0.2) return 'balanced';
        if (deviation < 0.4) return 'slightly-unbalanced';
        return 'unbalanced';
    }

    /**
     * Rekomendowane skupienie na trudności
     */
    calculateRecommendedFocus(difficultyStats) {
        const total = difficultyStats.total;
        if (total === 0) return 'unknown';
        
        const easyRatio = difficultyStats.easy / total;
        const hardRatio = difficultyStats.hard / total;
        
        if (hardRatio > 0.4) return 'review-hard';
        if (easyRatio < 0.2) return 'practice-easy';
        if (difficultyStats.medium / total < 0.3) return 'balance-medium';
        return 'maintain-balance';
    }

    /**
     * Wzorzec aktywności
     */
    calculateActivityPattern() {
        if (!this.progressTracker) return 'unknown';
        
        const studyDates = this.progressTracker.loadProgress().studyDates;
        if (!studyDates || studyDates.length < 7) return 'insufficient-data';
        
        // Analiza ostatnich 7 dni
        const now = new Date();
        const recentDates = studyDates.filter(dateStr => {
            const date = new Date(dateStr);
            const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        });
        
        if (recentDates.length >= 6) return 'very-active';
        if (recentDates.length >= 4) return 'active';
        if (recentDates.length >= 2) return 'moderate';
        return 'low-active';
    }

    /**
     * Wynik zaangażowania (0-100)
     */
    calculateEngagementScore() {
        let score = 0;
        
        // Progress component (40 points)
        if (this.progressTracker) {
            const progressData = this.progressTracker.getOverallProgress();
            score += Math.min(40, progressData.studiedPercentage * 0.4);
        }
        
        // Bookmarks component (30 points)
        if (this.bookmarksManager) {
            const bookmarkStats = this.bookmarksManager.getBookmarkStats();
            const bookmarkRatio = this.calculateBookmarksPercentage(bookmarkStats) / 100;
            score += Math.min(30, bookmarkRatio * 100 * 0.3);
        }
        
        // Difficulty management component (30 points)
        if (this.difficultyManager) {
            const difficultyStats = this.difficultyManager.getDifficultyStats();
            const customRatio = difficultyStats.total > 0 ? 
                difficultyStats.customCount / difficultyStats.total : 0;
            score += Math.min(30, customRatio * 100 * 0.3);
        }
        
        return Math.round(score);
    }

    /**
     * Wynik konsystencji (0-100)
     */
    calculateConsistencyScore() {
        if (!this.progressTracker) return 0;
        
        const progressData = this.progressTracker.getOverallProgress();
        const streak = progressData.studyStreak;
        
        // Konsystencja na podstawie streak
        if (streak >= 30) return 100;
        if (streak >= 14) return 80;
        if (streak >= 7) return 60;
        if (streak >= 3) return 40;
        if (streak >= 1) return 20;
        return 0;
    }

    /**
     * Pomocnicze metody
     */

    calculatePercentage(value, total) {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    }

    calculateBookmarksByCategory() {
        if (!this.bookmarksManager) return {};
        
        const bookmarkedWords = this.bookmarksManager.getAllBookmarkedWords();
        const categoryCount = {};
        
        bookmarkedWords.forEach(word => {
            categoryCount[word.categoryKey] = (categoryCount[word.categoryKey] || 0) + 1;
        });
        
        return categoryCount;
    }

    getCategoryName(categoryKey) {
        if (this.progressTracker && this.progressTracker.vocabulary) {
            return this.progressTracker.vocabulary.categories[categoryKey]?.name || categoryKey;
        }
        return categoryKey;
    }

    getCategoryIcon(categoryKey) {
        if (this.progressTracker && this.progressTracker.vocabulary) {
            return this.progressTracker.vocabulary.categories[categoryKey]?.icon || '📚';
        }
        return '📚';
    }

    calculateCategoryDifficultyScore(categoryKey) {
        if (!this.difficultyManager) return 50;
        
        const categoryDifficulty = this.difficultyManager.getDifficultyByCategory()[categoryKey];
        if (!categoryDifficulty) return 50;
        
        const total = categoryDifficulty.total;
        if (total === 0) return 50;
        
        // Wynik trudności: easy=1, medium=2, hard=3
        const weightedScore = (
            categoryDifficulty.easy * 1 +
            categoryDifficulty.medium * 2 +
            categoryDifficulty.hard * 3
        ) / total;
        
        return Math.round((weightedScore - 1) * 50); // Przekształć na skalę 0-100
    }

    calculateCategoryEngagement(categoryKey) {
        // Kombinacja progress, bookmarks i custom difficulty
        const progress = this.progressTracker ? 
            this.progressTracker.getCategoryProgress(categoryKey) : null;
        const bookmarks = this.calculateBookmarksByCategory()[categoryKey] || 0;
        const difficulty = this.difficultyManager ? 
            this.difficultyManager.getDifficultyByCategory()[categoryKey] : null;
        
        let engagement = 0;
        
        if (progress) {
            engagement += progress.percentage * 0.5; // 50% z progress
        }
        
        if (bookmarks > 0) {
            engagement += Math.min(25, bookmarks * 5); // Do 25 punktów z bookmarks
        }
        
        if (difficulty && difficulty.customCount > 0) {
            const customRatio = difficulty.customCount / difficulty.total;
            engagement += customRatio * 25; // Do 25 punktów z custom difficulty
        }
        
        return Math.min(100, Math.round(engagement));
    }

    getRecommendedAction(progress, categoryKey) {
        if (progress.percentage === 100) return 'completed';
        if (progress.percentage > 80) return 'finish-remaining';
        if (progress.percentage > 50) return 'continue-study';
        if (progress.percentage > 20) return 'regular-practice';
        if (progress.percentage > 0) return 'more-focus-needed';
        return 'start-learning';
    }

    /**
     * Metody czasowe - można rozbudować
     */
    calculateAverageSessionLength() {
        return 15; // Placeholder - można implementować na podstawie timestamps
    }

    calculatePeakActivityDay() {
        return 'Monday'; // Placeholder - można implementować analizę dni tygodnia
    }

    calculateWeeklyProgress() {
        return 12; // Placeholder - można implementować na podstawie ostatniego tygodnia
    }

    /**
     * Cache management
     */
    isCacheValid(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        
        const now = Date.now();
        return (now - cached.timestamp) < this.cacheTimeout;
    }

    setCacheValue(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Empty stats dla fallback
     */
    getEmptyProgressStats() {
        return {
            totalStudied: 0,
            totalWords: 0,
            studiedPercentage: 0,
            studyStreak: 0,
            lastStudied: null,
            wordsRemaining: 0,
            averageWordsPerDay: 0,
            estimatedCompletionDays: null,
            categoryBreakdown: {}
        };
    }

    getEmptyBookmarksStats() {
        return {
            totalBookmarks: 0,
            totalCategories: 0,
            topCategory: null,
            recentlyAdded: [],
            storageUsage: { bookmarksCount: 0, maxBookmarks: 500, usagePercentage: 0 },
            bookmarksPercentage: 0,
            averageBookmarksPerCategory: 0,
            bookmarksTrend: 'none',
            categoryStats: {}
        };
    }

    getEmptyDifficultyStats() {
        return {
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0,
            customCount: 0,
            easyPercentage: 0,
            mediumPercentage: 0,
            hardPercentage: 0,
            customPercentage: 0,
            difficultyBalance: 'unknown',
            recommendedFocus: 'unknown',
            categoryBreakdown: {}
        };
    }

    /**
     * Konfiguracja
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (!this.settings.enableCaching) {
            this.clearCache();
        }
    }

    /**
     * Diagnostyka
     */
    getDiagnostics() {
        return {
            modules: {
                progressTracker: !!this.progressTracker,
                bookmarksManager: !!this.bookmarksManager,
                difficultyManager: !!this.difficultyManager
            },
            cache: {
                enabled: this.settings.enableCaching,
                size: this.cache.size,
                timeout: this.cacheTimeout,
                keys: Array.from(this.cache.keys())
            },
            settings: this.settings,
            performance: {
                lastCalculationTime: this.getMetadata().calculatedAt
            }
        };
    }
}

// Export dla ES6 modules
export { StatsCalculator };

// Export default dla wygody
export default StatsCalculator;

console.log('✅ StatsCalculator załadowany');