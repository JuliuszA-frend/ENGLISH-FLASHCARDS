/**
 * BookmarksManager - Zarządzanie ulubionymi słowami
 * Odpowiedzialny wyłącznie za dodawanie/usuwanie/zarządzanie słowami do powtórki
 */
class BookmarksManager {
    constructor(storageAdapter) {
        this.storage = storageAdapter;
        this.vocabulary = null;
        
        // Klucze storage
        this.bookmarksKey = 'bookmarks';
        this.bookmarkDatesKey = 'bookmark-dates';
        
        // Walidatory
        this.validators = {
            bookmarks: (data) => Array.isArray(data),
            bookmarkDates: (data) => typeof data === 'object' && data !== null,
            word: (word) => this.validateWord(word)
        };
        
        // Ustawienia
        this.settings = {
            maxBookmarks: 500, // Maksymalna liczba bookmarks
            autoCleanup: true  // Automatyczne czyszczenie nieistniejących słów
        };
    }

    /**
     * Ustawienie słownictwa
     */
    setVocabulary(vocabulary) {
        if (!vocabulary || !vocabulary.categories) {
            console.error('❌ Nieprawidłowa struktura słownictwa');
            return false;
        }

        this.vocabulary = vocabulary;
        console.log(`📚 BookmarksManager: załadowano słownictwo`);
        
        // Automatyczne czyszczenie nieistniejących bookmarks
        if (this.settings.autoCleanup) {
            this.cleanupInvalidBookmarks();
        }
        
        return true;
    }

    /**
     * Przełączanie bookmark dla słowa
     */
    toggleBookmark(word) {
        if (!this.validators.word(word)) {
            console.error('❌ Nieprawidłowe słowo:', word);
            return null;
        }

        const wordKey = this.generateWordKey(word);
        const bookmarks = this.loadBookmarks();
        const bookmarkIndex = bookmarks.indexOf(wordKey);
        
        if (bookmarkIndex >= 0) {
            // Usuń bookmark
            bookmarks.splice(bookmarkIndex, 1);
            this.removeBookmarkDate(wordKey);
            
            console.log(`➖ Usunięto bookmark: ${wordKey}`);
            
            // Zapisz zmiany
            this.saveBookmarks(bookmarks);
            
            return false; // Nie jest już w bookmarks
        } else {
            // Sprawdź limit
            if (bookmarks.length >= this.settings.maxBookmarks) {
                console.warn(`⚠️ Osiągnięto limit bookmarks (${this.settings.maxBookmarks})`);
                return null;
            }
            
            // Dodaj bookmark
            bookmarks.push(wordKey);
            this.setBookmarkDate(wordKey);
            
            console.log(`➕ Dodano bookmark: ${wordKey}`);
            
            // Zapisz zmiany
            this.saveBookmarks(bookmarks);
            
            return true; // Jest teraz w bookmarks
        }
    }

    /**
     * Sprawdzanie czy słowo jest w bookmarks
     */
    isBookmarked(word) {
        if (!this.validators.word(word)) {
            return false;
        }

        const wordKey = this.generateWordKey(word);
        const bookmarks = this.loadBookmarks();
        
        return bookmarks.includes(wordKey);
    }

    /**
     * Pobieranie wszystkich bookmarkowanych słów z pełnymi danymi
     */
    getAllBookmarkedWords() {
        if (!this.vocabulary) {
            console.warn('⚠️ Brak załadowanego słownictwa');
            return [];
        }

        const bookmarks = this.loadBookmarks();
        const bookmarkDates = this.loadBookmarkDates();
        const bookmarkedWords = [];
        
        // Przejdź przez wszystkie kategorie i znajdź bookmarkowane słowa
        Object.entries(this.vocabulary.categories).forEach(([categoryKey, category]) => {
            if (category.words && Array.isArray(category.words)) {
                category.words.forEach((word, index) => {
                    const wordKey = this.generateWordKey(word);
                    
                    if (bookmarks.includes(wordKey)) {
                        bookmarkedWords.push({
                            ...word,
                            categoryKey: categoryKey,
                            categoryName: category.name,
                            categoryIcon: category.icon || '📚',
                            wordIndex: index,
                            wordKey: wordKey,
                            bookmarkedAt: bookmarkDates[wordKey] || null
                        });
                    }
                });
            }
        });
        
        // Sortuj według daty dodania (najnowsze pierwsze)
        bookmarkedWords.sort((a, b) => {
            const dateA = new Date(a.bookmarkedAt || 0);
            const dateB = new Date(b.bookmarkedAt || 0);
            return dateB - dateA;
        });
        
        return bookmarkedWords;
    }

    /**
     * Pobieranie bookmarks z konkretnej kategorii
     */
    getBookmarkedWordsFromCategory(categoryKey) {
        const allBookmarks = this.getAllBookmarkedWords();
        return allBookmarks.filter(word => word.categoryKey === categoryKey);
    }

    /**
     * Wyszukiwanie w bookmarks
     */
    searchBookmarks(query, options = {}) {
        const { 
            categoryFilter = null, 
            sortBy = 'recent', 
            limit = null 
        } = options;
        
        let bookmarks = this.getAllBookmarkedWords();
        
        // Filtruj według kategorii
        if (categoryFilter) {
            bookmarks = bookmarks.filter(word => word.categoryKey === categoryFilter);
        }
        
        // Wyszukiwanie tekstowe
        if (query && query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            bookmarks = bookmarks.filter(word => 
                word.english.toLowerCase().includes(searchTerm) ||
                word.polish.toLowerCase().includes(searchTerm) ||
                word.categoryName.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sortowanie
        bookmarks = this.sortBookmarks(bookmarks, sortBy);
        
        // Limit wyników
        if (limit && limit > 0) {
            bookmarks = bookmarks.slice(0, limit);
        }
        
        return bookmarks;
    }

    /**
     * Sortowanie bookmarks
     */
    sortBookmarks(bookmarks, sortBy) {
        switch (sortBy) {
            case 'recent':
                return bookmarks.sort((a, b) => {
                    const dateA = new Date(a.bookmarkedAt || 0);
                    const dateB = new Date(b.bookmarkedAt || 0);
                    return dateB - dateA;
                });
            
            case 'alphabetical':
                return bookmarks.sort((a, b) => 
                    a.english.localeCompare(b.english)
                );
            
            case 'category':
                return bookmarks.sort((a, b) => {
                    const categoryCompare = a.categoryName.localeCompare(b.categoryName);
                    if (categoryCompare === 0) {
                        return a.english.localeCompare(b.english);
                    }
                    return categoryCompare;
                });
            
            default:
                return bookmarks;
        }
    }

    /**
     * Statystyki bookmarks
     */
    getBookmarkStats() {
        const bookmarks = this.loadBookmarks();
        const bookmarkedWords = this.getAllBookmarkedWords();
        
        // Statystyki według kategorii
        const categoryStats = {};
        bookmarkedWords.forEach(word => {
            if (!categoryStats[word.categoryKey]) {
                categoryStats[word.categoryKey] = {
                    count: 0,
                    categoryName: word.categoryName,
                    categoryIcon: word.categoryIcon
                };
            }
            categoryStats[word.categoryKey].count++;
        });
        
        // Znajdź najczęściej bookmarkowaną kategorię
        let topCategory = null;
        let maxCount = 0;
        Object.entries(categoryStats).forEach(([key, stats]) => {
            if (stats.count > maxCount) {
                maxCount = stats.count;
                topCategory = {
                    key: key,
                    name: stats.categoryName,
                    count: stats.count
                };
            }
        });
        
        // Ostatnio dodane
        const recentlyAdded = bookmarkedWords.slice(0, 5);
        
        return {
            totalBookmarks: bookmarks.length,
            totalCategories: Object.keys(categoryStats).length,
            categoryStats: categoryStats,
            topCategory: topCategory,
            recentlyAdded: recentlyAdded,
            storageUsage: {
                bookmarksCount: bookmarks.length,
                maxBookmarks: this.settings.maxBookmarks,
                usagePercentage: Math.round((bookmarks.length / this.settings.maxBookmarks) * 100)
            }
        };
    }

    /**
     * Czyszczenie wszystkich bookmarks
     */
    clearAllBookmarks() {
        const bookmarksCount = this.loadBookmarks().length;
        
        // Wyczyść bookmarks i daty
        this.saveBookmarks([]);
        this.saveBookmarkDates({});
        
        console.log(`🗑️ Usunięto ${bookmarksCount} bookmarks`);
        return bookmarksCount;
    }

    /**
     * Usuwanie konkretnego bookmark
     */
    removeBookmark(word) {
        if (!this.validators.word(word)) {
            return false;
        }

        const wordKey = this.generateWordKey(word);
        const bookmarks = this.loadBookmarks();
        const index = bookmarks.indexOf(wordKey);
        
        if (index >= 0) {
            bookmarks.splice(index, 1);
            this.removeBookmarkDate(wordKey);
            this.saveBookmarks(bookmarks);
            
            console.log(`🗑️ Usunięto bookmark: ${wordKey}`);
            return true;
        }
        
        return false;
    }

    /**
     * Dodawanie bookmark (bez toggle)
     */
    addBookmark(word) {
        if (!this.validators.word(word)) {
            return false;
        }

        const wordKey = this.generateWordKey(word);
        const bookmarks = this.loadBookmarks();
        
        if (!bookmarks.includes(wordKey)) {
            if (bookmarks.length >= this.settings.maxBookmarks) {
                console.warn(`⚠️ Osiągnięto limit bookmarks (${this.settings.maxBookmarks})`);
                return false;
            }
            
            bookmarks.push(wordKey);
            this.setBookmarkDate(wordKey);
            this.saveBookmarks(bookmarks);
            
            console.log(`➕ Dodano bookmark: ${wordKey}`);
            return true;
        }
        
        return false; // Już istnieje
    }

    /**
     * Prywatne metody pomocnicze
     */

    /**
     * Generowanie klucza słowa
     */
    generateWordKey(word) {
        // Używa kombinacji angielskiego słowa i polskiego tłumaczenia dla unikalności
        return `${word.english.toLowerCase().trim()}-${word.polish.toLowerCase().trim()}`;
    }

    /**
     * Walidacja słowa
     */
    validateWord(word) {
        return (
            word &&
            typeof word === 'object' &&
            typeof word.english === 'string' &&
            typeof word.polish === 'string' &&
            word.english.trim().length > 0 &&
            word.polish.trim().length > 0
        );
    }

    /**
     * Czyszczenie nieistniejących bookmarks
     */
    cleanupInvalidBookmarks() {
        if (!this.vocabulary) return;
        
        const bookmarks = this.loadBookmarks();
        const validWordKeys = this.getAllValidWordKeys();
        const invalidBookmarks = bookmarks.filter(wordKey => !validWordKeys.has(wordKey));
        
        if (invalidBookmarks.length > 0) {
            const cleanedBookmarks = bookmarks.filter(wordKey => validWordKeys.has(wordKey));
            this.saveBookmarks(cleanedBookmarks);
            
            // Usuń także daty dla nieważnych bookmarks
            const bookmarkDates = this.loadBookmarkDates();
            invalidBookmarks.forEach(wordKey => {
                delete bookmarkDates[wordKey];
            });
            this.saveBookmarkDates(bookmarkDates);
            
            console.log(`🧹 Wyczyszczono ${invalidBookmarks.length} nieważnych bookmarks`);
        }
    }

    /**
     * Pobieranie wszystkich ważnych kluczy słów
     */
    getAllValidWordKeys() {
        const validKeys = new Set();
        
        if (this.vocabulary && this.vocabulary.categories) {
            Object.values(this.vocabulary.categories).forEach(category => {
                if (category.words && Array.isArray(category.words)) {
                    category.words.forEach(word => {
                        if (this.validators.word(word)) {
                            validKeys.add(this.generateWordKey(word));
                        }
                    });
                }
            });
        }
        
        return validKeys;
    }

    /**
     * Operacje na datach bookmarks
     */
    setBookmarkDate(wordKey) {
        const dates = this.loadBookmarkDates();
        dates[wordKey] = new Date().toISOString();
        this.saveBookmarkDates(dates);
    }

    removeBookmarkDate(wordKey) {
        const dates = this.loadBookmarkDates();
        delete dates[wordKey];
        this.saveBookmarkDates(dates);
    }

    getBookmarkDate(wordKey) {
        const dates = this.loadBookmarkDates();
        return dates[wordKey] || null;
    }

    /**
     * Operacje na storage
     */
    loadBookmarks() {
        return this.storage.load(this.bookmarksKey, [], {
            validate: this.validators.bookmarks,
            silent: true
        });
    }

    saveBookmarks(bookmarks) {
        return this.storage.save(this.bookmarksKey, bookmarks, {
            validate: this.validators.bookmarks,
            silent: true
        });
    }

    loadBookmarkDates() {
        return this.storage.load(this.bookmarkDatesKey, {}, {
            validate: this.validators.bookmarkDates,
            silent: true
        });
    }

    saveBookmarkDates(dates) {
        return this.storage.save(this.bookmarkDatesKey, dates, {
            validate: this.validators.bookmarkDates,
            silent: true
        });
    }

    /**
     * Export/Import
     */
    exportBookmarks() {
        const bookmarkedWords = this.getAllBookmarkedWords();
        const stats = this.getBookmarkStats();
        
        return {
            metadata: {
                exportDate: new Date().toISOString(),
                totalBookmarks: stats.totalBookmarks,
                version: '2.0.0',
                appName: 'English Flashcards B1/B2'
            },
            bookmarks: bookmarkedWords,
            statistics: stats
        };
    }

    importBookmarks(importData) {
        try {
            if (!importData || !importData.bookmarks || !Array.isArray(importData.bookmarks)) {
                throw new Error('Nieprawidłowy format danych import');
            }
            
            // Wyciągnij wordKey z importowanych słów
            const importedWordKeys = importData.bookmarks.map(word => 
                word.wordKey || this.generateWordKey(word)
            );
            
            // Sprawdź limit
            if (importedWordKeys.length > this.settings.maxBookmarks) {
                throw new Error(`Za dużo bookmarks do importu. Limit: ${this.settings.maxBookmarks}`);
            }
            
            // Zamień obecne bookmarks na importowane
            this.saveBookmarks(importedWordKeys);
            
            // Zapisz również daty bookmarks jeśli dostępne
            if (importData.bookmarks.some(word => word.bookmarkedAt)) {
                const bookmarkDates = {};
                importData.bookmarks.forEach(word => {
                    if (word.bookmarkedAt) {
                        const wordKey = word.wordKey || this.generateWordKey(word);
                        bookmarkDates[wordKey] = word.bookmarkedAt;
                    }
                });
                this.saveBookmarkDates(bookmarkDates);
            }
            
            console.log(`✅ Zaimportowano ${importedWordKeys.length} bookmarks`);
            return {
                success: true,
                imported: importedWordKeys.length
            };
            
        } catch (error) {
            console.error('❌ Błąd importu bookmarks:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Diagnostyka
     */
    getDiagnostics() {
        const bookmarks = this.loadBookmarks();
        const bookmarkDates = this.loadBookmarkDates();
        const stats = this.getBookmarkStats();
        
        return {
            bookmarksData: {
                count: bookmarks.length,
                datesCount: Object.keys(bookmarkDates).length,
                maxAllowed: this.settings.maxBookmarks,
                autoCleanup: this.settings.autoCleanup
            },
            vocabularyData: {
                loaded: !!this.vocabulary,
                validWordKeys: this.vocabulary ? this.getAllValidWordKeys().size : 0
            },
            statistics: stats,
            storageInfo: {
                bookmarksExists: this.storage.exists(this.bookmarksKey),
                datesExists: this.storage.exists(this.bookmarkDatesKey)
            }
        };
    }
}

// Export dla ES6 modules
export { BookmarksManager };

// Export default dla wygody
export default BookmarksManager;

console.log('✅ BookmarksManager załadowany');