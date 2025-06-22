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
        
        NotificationManager.show(`Trudność zmieniona na: ${this.getDifficultyLabel(levels[nextIndex])}`, 'info');
        
        return levels[nextIndex];
    }

    /**
     * Toggle ulubione słowo
     */
    toggleWordBookmark(word) {
        const bookmarks = this.loadBookmarks();
        const wordKey = this.getWordKey(word);
        
        if (bookmarks.includes(wordKey)) {
            const index = bookmarks.indexOf(wordKey);
            bookmarks.splice(index, 1);
            NotificationManager.show('Usunięto z ulubionych', 'info');
        } else {
            bookmarks.push(wordKey);
            NotificationManager.show('Dodano do ulubionych', 'success');
        }
        
        this.saveBookmarks(bookmarks);
        return !bookmarks.includes(wordKey);
    }

    /**
     * Sprawdzenie czy słowo jest ulubione
     */
    isWordBookmarked(word) {
        const bookmarks = this.loadBookmarks();
        const wordKey = this.getWordKey(word);
        return bookmarks.includes(wordKey);
    }

    /**
     * Pobranie ulubionych słów
     */
    getBookmarkedWords() {
        if (!this.vocabulary) return [];
        
        const bookmarks = this.loadBookmarks();
        const words = [];
        
        Object.entries(this.vocabulary.categories).forEach(([categoryKey, category]) => {
            category.words.forEach(word => {
                const wordKey = this.getWordKey(word);
                if (bookmarks.includes(wordKey)) {
                    words.push({
                        ...word,
                        category: categoryKey
                    });
                }
            });
        });
        
        return words;
    }

    /**
     * Reset kategorii
     */
    resetCategory(category) {
        const progress = this.loadProgress();
        
        // Usuń przejrzane karty z tej kategorii
        progress.studiedCards = progress.studiedCards.filter(cardId => 
            !cardId.startsWith(`${category}-`)
        );
        
        // Resetuj statystyki kategorii
        if (progress.categoryStats[category]) {
            progress.categoryStats[category].studied = 0;
        }
        
        this.saveProgress(progress);
    }

    /**
     * Reset wszystkich danych
     */
    reset() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.bookmarksKey);
        localStorage.removeItem(this.difficultyKey);
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