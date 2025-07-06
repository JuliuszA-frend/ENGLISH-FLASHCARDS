/**
 * BookmarksData - Zarządzanie danymi bookmarks
 * Filtrowanie, sortowanie, wyszukiwanie i operacje na danych
 */

class BookmarksData {
    constructor(progressManager) {
        this.progressManager = progressManager;
        this.allBookmarks = [];
        this.filteredBookmarks = [];
        this.currentFilters = {
            searchTerm: '',
            categoryKey: '',
            sortType: 'recent'
        };
    }

    /**
     * 📊 Załadowanie wszystkich danych bookmarks
     */
    loadAllBookmarks() {
        console.log('📊 Ładowanie wszystkich bookmarks...');
        
        if (!this.progressManager) {
            console.error('❌ ProgressManager nie jest dostępny');
            throw new Error('ProgressManager nie jest dostępny');
        }

        try {
            this.allBookmarks = this.progressManager.getAllBookmarkedWords();
            this.filteredBookmarks = [...this.allBookmarks];
            
            console.log(`✅ Załadowano ${this.allBookmarks.length} bookmarks`);
            return this.allBookmarks;
        } catch (error) {
            console.error('❌ Błąd ładowania bookmarks:', error);
            throw error;
        }
    }

    /**
     * 📊 Pobranie statystyk bookmarks
     */
    getStats() {
        if (!this.progressManager) {
            return {
                totalBookmarks: 0,
                totalCategories: 0,
                categoryStats: {},
                topCategory: null,
                recentlyAdded: []
            };
        }

        try {
            return this.progressManager.getBookmarkStats();
        } catch (error) {
            console.error('❌ Błąd pobierania statystyk:', error);
            return {
                totalBookmarks: 0,
                totalCategories: 0,
                categoryStats: {},
                topCategory: null,
                recentlyAdded: []
            };
        }
    }

    /**
     * 🔍 Filtrowanie bookmarks
     */
    filterBookmarks(searchTerm = '', categoryKey = '', sortType = 'recent') {
        console.log(`🔍 Filtrowanie: search="${searchTerm}", category="${categoryKey}", sort="${sortType}"`);
        
        // Zapisz filtry
        this.currentFilters = { searchTerm, categoryKey, sortType };
        
        // Zacznij od wszystkich bookmarks
        let filtered = [...this.allBookmarks];
        
        // 🏷️ Filtruj po kategorii
        if (categoryKey) {
            filtered = filtered.filter(word => word.categoryKey === categoryKey);
            console.log(`🏷️ Po filtrze kategorii "${categoryKey}": ${filtered.length} słów`);
        }
        
        // 🔍 Filtruj po wyszukiwanym terminie
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(word => 
                word.english.toLowerCase().includes(term) ||
                word.polish.toLowerCase().includes(term) ||
                word.categoryName.toLowerCase().includes(term)
            );
            console.log(`🔍 Po filtrze wyszukiwania "${searchTerm}": ${filtered.length} słów`);
        }
        
        // 📊 Sortuj
        filtered = this.sortBookmarks(filtered, sortType);
        
        // Zapisz wyniki
        this.filteredBookmarks = filtered;
        
        console.log(`📊 Końcowy wynik filtrowania: ${filtered.length} słów`);
        return filtered;
    }

    /**
     * 📊 Sortowanie bookmarks
     */
    sortBookmarks(bookmarks, sortType) {
        const sorted = [...bookmarks];
        
        switch (sortType) {
            case 'alphabetical':
                sorted.sort((a, b) => a.english.localeCompare(b.english));
                break;
                
            case 'category':
                sorted.sort((a, b) => {
                    if (a.categoryName !== b.categoryName) {
                        return a.categoryName.localeCompare(b.categoryName);
                    }
                    return a.english.localeCompare(b.english);
                });
                break;
                
            case 'recent':
            default:
                sorted.sort((a, b) => {
                    const dateA = new Date(a.bookmarkedAt || 0);
                    const dateB = new Date(b.bookmarkedAt || 0);
                    return dateB - dateA; // Najnowsze pierwsze
                });
                break;
        }
        
        console.log(`📊 Posortowano ${sorted.length} bookmarks według: ${sortType}`);
        return sorted;
    }

    /**
     * 🔄 Odświeżenie danych
     */
    refresh() {
        console.log('🔄 Odświeżanie danych bookmarks...');
        
        this.loadAllBookmarks();
        
        // Ponownie zastosuj aktualne filtry
        this.filterBookmarks(
            this.currentFilters.searchTerm,
            this.currentFilters.categoryKey,
            this.currentFilters.sortType
        );
        
        console.log('✅ Dane odświeżone');
    }

    /**
     * 📋 Pobranie przefiltrowanych bookmarks
     */
    getFilteredBookmarks() {
        return this.filteredBookmarks;
    }

    /**
     * 📋 Pobranie wszystkich bookmarks
     */
    getAllBookmarks() {
        return this.allBookmarks;
    }

    /**
     * 🔍 Wyszukiwanie konkretnego bookmark
     */
    findBookmark(wordKey) {
        return this.allBookmarks.find(word => word.wordKey === wordKey);
    }

    /**
     * ➕ Dodanie bookmark (przez ProgressManager)
     */
    addBookmark(word) {
        if (!this.progressManager) {
            console.error('❌ ProgressManager nie jest dostępny');
            return false;
        }

        try {
            const result = this.progressManager.toggleWordBookmark(word);
            
            if (result) {
                console.log(`➕ Dodano bookmark: ${word.english}`);
                this.refresh(); // Odśwież dane
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Błąd dodawania bookmark:', error);
            return false;
        }
    }

    /**
     * ➖ Usunięcie bookmark
     */
    removeBookmark(word) {
        if (!this.progressManager) {
            console.error('❌ ProgressManager nie jest dostępny');
            return false;
        }

        try {
            const result = this.progressManager.toggleWordBookmark(word);
            
            if (result === false) { // toggleWordBookmark zwraca false gdy usuwa
                console.log(`➖ Usunięto bookmark: ${word.english}`);
                this.refresh(); // Odśwież dane
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Błąd usuwania bookmark:', error);
            return false;
        }
    }

    /**
     * 🗑️ Usunięcie wszystkich bookmarks
     */
    clearAllBookmarks() {
        if (!this.progressManager) {
            console.error('❌ ProgressManager nie jest dostępny');
            return 0;
        }

        try {
            const removedCount = this.progressManager.clearAllBookmarks();
            console.log(`🗑️ Usunięto ${removedCount} bookmarks`);
            
            this.refresh(); // Odśwież dane
            return removedCount;
        } catch (error) {
            console.error('❌ Błąd czyszczenia bookmarks:', error);
            return 0;
        }
    }

    /**
     * 💾 Eksport bookmarks
     */
    exportBookmarks() {
        if (!this.progressManager) {
            console.error('❌ ProgressManager nie jest dostępny');
            throw new Error('ProgressManager nie jest dostępny');
        }

        try {
            return this.progressManager.exportBookmarks();
        } catch (error) {
            console.error('❌ Błąd eksportu bookmarks:', error);
            throw error;
        }
    }

    /**
     * 📥 Import bookmarks
     */
    importBookmarks(importData) {
        if (!this.progressManager) {
            console.error('❌ ProgressManager nie jest dostępny');
            return { success: false, error: 'ProgressManager nie jest dostępny' };
        }

        try {
            const result = this.progressManager.importBookmarks(importData);
            
            if (result.success) {
                this.refresh(); // Odśwież dane po imporcie
            }
            
            return result;
        } catch (error) {
            console.error('❌ Błąd importu bookmarks:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 📊 Pobranie kategorii z bookmarks
     */
    getCategoriesWithBookmarks() {
        const categoriesStats = {};
        
        this.allBookmarks.forEach(word => {
            if (!categoriesStats[word.categoryKey]) {
                categoriesStats[word.categoryKey] = {
                    categoryName: word.categoryName,
                    categoryIcon: word.categoryIcon,
                    count: 0
                };
            }
            categoriesStats[word.categoryKey].count++;
        });
        
        return categoriesStats;
    }

    /**
     * 🔍 Sprawdzenie czy są dane do wyświetlenia
     */
    hasData() {
        return this.allBookmarks.length > 0;
    }

    /**
     * 🔍 Sprawdzenie czy są wyniki filtrowania
     */
    hasFilteredResults() {
        return this.filteredBookmarks.length > 0;
    }

    /**
     * 📊 Czy filtry są aktywne
     */
    hasActiveFilters() {
        return this.currentFilters.searchTerm.trim() !== '' || 
               this.currentFilters.categoryKey !== '' ||
               this.currentFilters.sortType !== 'recent';
    }

    /**
     * 🔄 Reset filtrów
     */
    resetFilters() {
        console.log('🔄 Resetowanie filtrów...');
        
        this.currentFilters = {
            searchTerm: '',
            categoryKey: '',
            sortType: 'recent'
        };
        
        this.filteredBookmarks = [...this.allBookmarks];
        this.sortBookmarks(this.filteredBookmarks, 'recent');
        
        console.log('✅ Filtry zresetowane');
    }

    /**
     * 📊 Pobranie info o aktualnych filtrach
     */
    getFiltersInfo() {
        return {
            ...this.currentFilters,
            totalResults: this.filteredBookmarks.length,
            totalBookmarks: this.allBookmarks.length,
            isFiltered: this.hasActiveFilters()
        };
    }

    /**
     * 🧹 Cleanup
     */
    cleanup() {
        this.allBookmarks = [];
        this.filteredBookmarks = [];
        this.currentFilters = {
            searchTerm: '',
            categoryKey: '',
            sortType: 'recent'
        };
        
        console.log('🧹 BookmarksData wyczyszczone');
    }
}

// 🎯 EXPORT
export default BookmarksData;