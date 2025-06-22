/**
 * ProgressManager - Zarządzanie postępem
 */
class ProgressManager {
    constructor() {
        this.vocabulary = null;
        this.storageKey = 'english-flashcards-progress';
        this.bookmarksKey = 'english-flashcards-bookmarks';
        this.difficultyKey = 'english-flashcards-difficulty';
    }

    /**
     * Ustawienie słownictwa
     */
    setVocabulary(vocabulary) {
        this.vocabulary = vocabulary;
    }

    /**
     * Oznaczenie słowa jako przejrzane
     */
    markWordAsStudied(category, wordIndex, wordId = null) {
        const progress = this.loadProgress();
        const cardId = wordId || `${category}-${wordIndex}`;
        
        if (!progress.studiedCards.includes(cardId)) {
            progress.studiedCards.push(cardId);
            progress.lastStudied = new Date().toISOString();
            
            // Aktualizuj statystyki kategorii
            if (!progress.categoryStats[category]) {
                progress.categoryStats[category] = {
                    studied: 0,
                    total: this.getCategoryWordCount(category),
                    lastAccess: new Date().toISOString()
                };
            }
            progress.categoryStats[category].studied++;
            progress.categoryStats[category].lastAccess = new Date().toISOString();
            
            // Aktualizuj daty nauki
            this.updateStudyDates(progress);
            
            this.saveProgress(progress);
            
            return true;
        }
        
        return false;
    }

    /**
     * Pobranie postępu kategorii
     */
    getCategoryProgress(category) {
        const progress = this.loadProgress();
        const categoryStats = progress.categoryStats[category];
        
        if (categoryStats) {
            return {
                studied: categoryStats.studied,
                total: categoryStats.total,
                percentage: Math.round((categoryStats.studied / categoryStats.total) * 100)
            };
        }
        
        return {
            studied: 0,
            total: this.getCategoryWordCount(category),
            percentage: 0
        };
    }

    /**
     * Pobranie ogólnych statystyk
     */
    getOverallStats() {
        const progress = this.loadProgress();
        const totalWords = this.getTotalWordCount();
        const studiedCount = progress.studiedCards.length;
        const studyStreak = this.calculateStudyStreak(progress.studyDates);
        const favoriteCategory = this.getFavoriteCategory(progress);
        
        return {
            totalStudied: studiedCount,
            totalWords: totalWords,
            studyStreak: studyStreak,
            favoriteCategory: favoriteCategory,
            studiedPercentage: Math.round((studiedCount / totalWords) * 100)
        };
    }

    /**
     * Toggle trudności słowa
     */
    toggleWordDifficulty(word) {
        const difficulty = this.loadDifficulty();
        const wordKey = this.getWordKey(word);
        
        const levels = ['easy', 'medium', 'hard'];
        const currentLevel = difficulty[wordKey] || word.difficulty || 'medium';
        const currentIndex = levels.indexOf(currentLevel);
        const nextIndex = (currentIndex + 1) % levels.length;
        
        difficulty[wordKey] = levels[nextIndex];
        this.saveDifficulty(difficulty);
        
        return levels[nextIndex];
    }

    /**
     * Toggle bookmark słowa
     */
    toggleWordBookmark(word) {
        const bookmarks = this.loadBookmarks();
        const wordKey = this.getWordKey(word);
        
        if (bookmarks.includes(wordKey)) {
            const index = bookmarks.indexOf(wordKey);
            bookmarks.splice(index, 1);
        } else {
            bookmarks.push(wordKey);
        }
        
        this.saveBookmarks(bookmarks);
        return !bookmarks.includes(wordKey);
    }

    /**
     * Sprawdź czy słowo jest bookmarked
     */
    isWordBookmarked(word) {
        const bookmarks = this.loadBookmarks();
        const wordKey = this.getWordKey(word);
        return bookmarks.includes(wordKey);
    }

    /**
     * Pobranie klucza słowa
     */
    getWordKey(word) {
        return word.id || `${word.english}-${word.polish}`;
    }

    /**
     * Ładowanie postępu
     */
    loadProgress() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Błąd ładowania postępu:', error);
        }
        
        return this.getDefaultProgress();
    }

    /**
     * Zapisywanie postępu
     */
    saveProgress(progress) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(progress));
        } catch (error) {
            console.error('Błąd zapisywania postępu:', error);
        }
    }

    /**
     * Domyślny postęp
     */
    getDefaultProgress() {
        return {
            studiedCards: [],
            studyDates: [],
            categoryStats: {},
            lastStudied: null,
            version: '1.0.0'
        };
    }

    /**
     * Ładowanie bookmarks
     */
    loadBookmarks() {
        try {
            const data = localStorage.getItem(this.bookmarksKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Błąd ładowania bookmarks:', error);
            return [];
        }
    }

    /**
     * Zapisywanie bookmarks
     */
    saveBookmarks(bookmarks) {
        try {
            localStorage.setItem(this.bookmarksKey, JSON.stringify(bookmarks));
        } catch (error) {
            console.error('Błąd zapisywania bookmarks:', error);
        }
    }

    /**
     * Ładowanie poziomów trudności
     */
    loadDifficulty() {
        try {
            const data = localStorage.getItem(this.difficultyKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Błąd ładowania poziomów trudności:', error);
            return {};
        }
    }

    /**
     * Zapisywanie poziomów trudności
     */
    saveDifficulty(difficulty) {
        try {
            localStorage.setItem(this.difficultyKey, JSON.stringify(difficulty));
        } catch (error) {
            console.error('Błąd zapisywania poziomów trudności:', error);
        }
    }

    /**
     * Pobranie liczby słów w kategorii
     */
    getCategoryWordCount(category) {
        if (!this.vocabulary || !this.vocabulary[category]) {
            return 0;
        }
        return this.vocabulary[category].length;
    }

    /**
     * Pobranie całkowitej liczby słów
     */
    getTotalWordCount() {
        if (!this.vocabulary) return 0;
        
        return Object.values(this.vocabulary).reduce((total, category) => {
            return total + category.length;
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
     * Obliczenie streaku nauki
     */
    calculateStudyStreak(studyDates) {
        if (!studyDates || studyDates.length === 0) return 0;
        
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        for (let i = studyDates.length - 1; i >= 0; i--) {
            const studyDate = new Date(studyDates[i]);
            const daysDiff = Math.floor((currentDate - studyDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
            } else {
                break;
            }
            
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    }

    /**
     * Pobranie ulubionej kategorii
     */
    getFavoriteCategory(progress) {
        const categoryStats = progress.categoryStats;
        if (!categoryStats || Object.keys(categoryStats).length === 0) {
            return null;
        }
        
        let maxStudied = 0;
        let favoriteCategory = null;
        
        for (const [category, stats] of Object.entries(categoryStats)) {
            if (stats.studied > maxStudied) {
                maxStudied = stats.studied;
                favoriteCategory = category;
            }
        }
        
        return favoriteCategory;
    }

    /**
     * Export danych
     */
    exportData() {
        return {
            progress: this.loadProgress(),
            bookmarks: this.loadBookmarks(),
            difficulty: this.loadDifficulty()
        };
    }

    /**
     * Import danych
     */
    importData(data) {
        if (data.progress) {
            this.saveProgress(data.progress);
        }
        if (data.bookmarks) {
            this.saveBookmarks(data.bookmarks);
        }
        if (data.difficulty) {
            this.saveDifficulty(data.difficulty);
        }
    }

    /**
     * Reset wszystkich danych
     */
    resetAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.bookmarksKey);
        localStorage.removeItem(this.difficultyKey);
    }
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressManager;
}