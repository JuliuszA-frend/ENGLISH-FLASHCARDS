/**
 * BOOKMARKS CONTROLLER - Zarządzanie modalem ulubionych słów
 * Dodaj ten kod do app.js lub stwórz nowy plik bookmarks-controller.js
 */

/**
 * 🔖 BookmarksController - Klasa zarządzająca UI ulubionych słów
 */
class BookmarksController {
    constructor(app) {
        this.app = app; // Referencja do głównej aplikacji
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredBookmarks = [];
        this.allBookmarks = [];
        
        // 🔧 Inicjalizuj controller
        this.init();
    }
    
    /**
     * 🚀 Inicjalizacja controller'a
     */
    init() {
        console.log('🔖 Inicjalizacja BookmarksController...');
        
        // 🎯 Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ BookmarksController zainicjalizowany');
    }
    
    /**
     * 🔧 Konfiguracja nasłuchiwaczy zdarzeń
     */
    setupEventListeners() {
        // 📝 Event listeners dla przycisku otwierania modala
        const bookmarksBtn = document.getElementById('bookmarks-toggle');
        if (bookmarksBtn) {
            bookmarksBtn.addEventListener('click', () => this.openModal());
        }
        
        // 📝 Event listeners dla modala
        const closeBtn = document.getElementById('bookmarks-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        // 📝 Zamykanie na overlay
        const modal = document.getElementById('bookmarks-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
        
        // 🔍 Wyszukiwanie
        const searchInput = document.getElementById('bookmarks-search');
        if (searchInput) {
            searchInput.addEventListener('input', 
                Utils.debounce((e) => this.filterBookmarks(e.target.value), 300)
            );
        }
        
        // 🏷️ Filtrowanie po kategorii
        const categoryFilter = document.getElementById('bookmarks-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }
        
        // 📊 Sortowanie
        const sortSelect = document.getElementById('bookmarks-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBookmarks(e.target.value);
            });
        }
        
        // 🎯 Akcje na bookmarks
        this.setupActionListeners();
        
        // ⌨️ Skróty klawiszowe
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closeModal();
            }
        });
    }
    
    /**
     * 🎯 Setup akcji na bookmarks
     */
    setupActionListeners() {
        // 📚 Nauka tylko ulubionych
        const studyBtn = document.getElementById('study-bookmarks-btn');
        if (studyBtn) {
            studyBtn.addEventListener('click', () => this.startBookmarksStudy());
        }
        
        // 💾 Eksport ulubionych
        const exportBtn = document.getElementById('export-bookmarks-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportBookmarks());
        }
        
        // 🗑️ Czyszczenie wszystkich ulubionych
        const clearBtn = document.getElementById('clear-bookmarks-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllBookmarks());
        }
        
        // 📄 Paginacja
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
    }
    
    /**
     * 📂 Otwieranie modala
     */
    openModal() {
        console.log('🔖 Otwieranie modala ulubionych...');
        
        // 📊 Załaduj dane
        this.loadBookmarksData();
        
        // 🎨 Pokaż modal
        const modal = document.getElementById('bookmarks-modal');
        if (modal) {
            modal.style.display = 'flex';
            // 📱 Animacja pojawienia się
            setTimeout(() => {
                modal.classList.add('visible');
            }, 10);
        }
        
        // 🔍 Focus na wyszukiwanie
        setTimeout(() => {
            const searchInput = document.getElementById('bookmarks-search');
            if (searchInput) {
                searchInput.focus();
            }
        }, 300);
        
        console.log('✅ Modal ulubionych otwarty');
    }
    
    /**
     * 📂 Zamykanie modala
     */
    closeModal() {
        console.log('🔖 Zamykanie modala ulubionych...');
        
        const modal = document.getElementById('bookmarks-modal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        
        console.log('✅ Modal ulubionych zamknięty');
    }
    
    /**
     * ❓ Sprawdzenie czy modal jest otwarty
     */
    isModalOpen() {
        const modal = document.getElementById('bookmarks-modal');
        return modal && modal.style.display !== 'none';
    }
    
    /**
     * 📊 Ładowanie danych ulubionych
     */
    loadBookmarksData() {
        console.log('📊 Ładowanie danych ulubionych...');
        
        // 🔍 Sprawdź czy ProgressManager jest dostępny
        if (!this.app.managers.progress) {
            console.error('❌ ProgressManager nie jest dostępny');
            this.showError('Nie można załadować ulubionych słów');
            return;
        }
        
        try {
            // 📚 Pobierz wszystkie ulubione słowa
            this.allBookmarks = this.app.managers.progress.getAllBookmarkedWords();
            this.filteredBookmarks = [...this.allBookmarks];
            
            // 📊 Pobierz statystyki
            const stats = this.app.managers.progress.getBookmarkStats();
            
            // 🎨 Aktualizuj UI
            this.updateStatsDisplay(stats);
            this.updateCategoryFilter();
            this.renderBookmarksList();
            this.updatePagination();
            
            console.log(`✅ Załadowano ${this.allBookmarks.length} ulubionych słów`);
            
        } catch (error) {
            console.error('❌ Błąd ładowania danych bookmarks:', error);
            this.showError('Błąd podczas ładowania ulubionych słów');
        }
    }
    
    /**
     * 📊 Aktualizacja wyświetlania statystyk
     */
    updateStatsDisplay(stats) {
        // 🏷️ Licznik w tytule
        const countBadge = document.getElementById('bookmarks-count');
        if (countBadge) {
            countBadge.textContent = stats.totalBookmarks;
        }
        
        // 📊 Statystyki szczegółowe
        const totalEl = document.getElementById('total-bookmarks');
        const categoriesEl = document.getElementById('bookmark-categories');
        const recentEl = document.getElementById('recent-bookmark');
        
        if (totalEl) totalEl.textContent = stats.totalBookmarks;
        if (categoriesEl) categoriesEl.textContent = stats.totalCategories;
        
        if (recentEl && stats.recentlyAdded.length > 0) {
            recentEl.textContent = stats.recentlyAdded[0].english;
        } else if (recentEl) {
            recentEl.textContent = '-';
        }
    }
    
    /**
     * 🏷️ Aktualizacja filtru kategorii
     */
    updateCategoryFilter() {
        const categoryFilter = document.getElementById('bookmarks-category-filter');
        if (!categoryFilter) return;
        
        // 🗑️ Wyczyść istniejące opcje (oprócz "Wszystkie")
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }
        
        // 📊 Policz kategorie z ulubionymi
        const categoriesWithBookmarks = {};
        this.allBookmarks.forEach(word => {
            if (!categoriesWithBookmarks[word.categoryKey]) {
                categoriesWithBookmarks[word.categoryKey] = {
                    name: word.categoryName,
                    icon: word.categoryIcon,
                    count: 0
                };
            }
            categoriesWithBookmarks[word.categoryKey].count++;
        });
        
        // 📝 Dodaj opcje kategorii
        Object.entries(categoriesWithBookmarks).forEach(([key, category]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${category.icon} ${category.name} (${category.count})`;
            categoryFilter.appendChild(option);
        });
    }
    
    /**
     * 🔍 Filtrowanie ulubionych słów
     */
    filterBookmarks(searchTerm = '') {
        const categoryFilter = document.getElementById('bookmarks-category-filter');
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        
        console.log(`🔍 Filtrowanie: "${searchTerm}", kategoria: "${selectedCategory}"`);
        
        // 🎯 Zacznij od wszystkich bookmarks
        let filtered = [...this.allBookmarks];
        
        // 🏷️ Filtruj po kategorii
        if (selectedCategory) {
            filtered = filtered.filter(word => word.categoryKey === selectedCategory);
        }
        
        // 🔍 Filtruj po wyszukiwanym terminie
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(word => 
                word.english.toLowerCase().includes(term) ||
                word.polish.toLowerCase().includes(term) ||
                word.categoryName.toLowerCase().includes(term)
            );
        }
        
        // 💾 Zapisz przefiltrowane wyniki
        this.filteredBookmarks = filtered;
        this.currentPage = 1; // Reset do pierwszej strony
        
        // 🎨 Aktualizuj UI
        this.renderBookmarksList();
        this.updatePagination();
        
        console.log(`📊 Wyników filtrowania: ${filtered.length}`);
    }
    
    /**
     * 🏷️ Filtrowanie po kategorii
     */
    filterByCategory(categoryKey) {
        console.log(`🏷️ Filtrowanie po kategorii: ${categoryKey}`);
        
        // 🔍 Wykonaj filtrowanie z aktualnym wyszukiwaniem
        const searchInput = document.getElementById('bookmarks-search');
        const searchTerm = searchInput ? searchInput.value : '';
        
        this.filterBookmarks(searchTerm);
    }
    
    /**
     * 📊 Sortowanie ulubionych
     */
    sortBookmarks(sortType) {
        console.log(`📊 Sortowanie: ${sortType}`);
        
        switch (sortType) {
            case 'alphabetical':
                // 🔤 Sortowanie alfabetyczne
                this.filteredBookmarks.sort((a, b) => 
                    a.english.localeCompare(b.english)
                );
                break;
                
            case 'category':
                // 🏷️ Sortowanie po kategorii, potem alfabetycznie
                this.filteredBookmarks.sort((a, b) => {
                    if (a.categoryName !== b.categoryName) {
                        return a.categoryName.localeCompare(b.categoryName);
                    }
                    return a.english.localeCompare(b.english);
                });
                break;
                
            case 'recent':
            default:
                // 📅 Sortowanie po dacie dodania (najnowsze pierwsze)
                this.filteredBookmarks.sort((a, b) => {
                    const dateA = new Date(a.bookmarkedAt || 0);
                    const dateB = new Date(b.bookmarkedAt || 0);
                    return dateB - dateA;
                });
                break;
        }
        
        // 🎨 Odśwież listę
        this.renderBookmarksList();
    }
    
    /**
     * 🎨 Renderowanie listy ulubionych
     */
    renderBookmarksList() {
        const container = document.getElementById('bookmarks-list');
        const placeholder = document.getElementById('no-bookmarks-placeholder');
        
        if (!container || !placeholder) return;
        
        // 🎯 Sprawdź czy są ulubione
        if (this.filteredBookmarks.length === 0) {
            // 📭 Pokaż placeholder
            placeholder.style.display = 'block';
            container.style.display = 'none';
            
            // 🔍 Dostosuj komunikat do sytuacji
            const placeholderText = placeholder.querySelector('p');
            if (placeholderText) {
                if (this.allBookmarks.length === 0) {
                    placeholderText.textContent = 'Dodaj słowa do ulubionych klikając przycisk 🔖 na fiszce';
                } else {
                    placeholderText.textContent = 'Brak wyników dla podanych kryteriów wyszukiwania';
                }
            }
            
            return;
        }
        
        // 📚 Ukryj placeholder i pokaż listę
        placeholder.style.display = 'none';
        container.style.display = 'block';
        
        // 📄 Oblicz elementy dla aktualnej strony
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageBookmarks = this.filteredBookmarks.slice(startIndex, endIndex);
        
        // 🗑️ Wyczyść kontener
        container.innerHTML = '';
        
        // 📝 Renderuj każde słowo
        pageBookmarks.forEach((word, index) => {
            const wordElement = this.createBookmarkElement(word, startIndex + index);
            container.appendChild(wordElement);
        });
        
        console.log(`🎨 Wyrenderowano ${pageBookmarks.length} ulubionych słów`);
    }
    
    /**
     * 🎨 Tworzenie elementu ulubionego słowa
     */
    createBookmarkElement(word, index) {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        item.setAttribute('data-word-key', word.wordKey);
        
        // 📅 Formatuj datę dodania
        const bookmarkDate = word.bookmarkedAt 
            ? new Date(word.bookmarkedAt).toLocaleDateString('pl-PL')
            : 'Nieznana';
        
        item.innerHTML = `
            <div class="bookmark-word">
                <div class="word-main">
                    <div class="word-english">${word.english}</div>
                    <div class="word-polish">${word.polish}</div>
                </div>
                <div class="bookmark-actions-item">
                    <button class="bookmark-action-btn study-btn" title="Ucz się tego słowa">
                        📚
                    </button>
                    <button class="bookmark-action-btn remove-btn" title="Usuń z ulubionych">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="bookmark-meta">
                <span class="category-tag">
                    <span>${word.categoryIcon}</span>
                    <span>${word.categoryName}</span>
                </span>
                <span class="bookmark-date">Dodano: ${bookmarkDate}</span>
            </div>
        `;
        
        // 🎯 Event listeners dla akcji
        this.setupWordActions(item, word);
        
        return item;
    }
    
    /**
     * 🎯 Setup akcji dla pojedynczego słowa
     */
    setupWordActions(element, word) {
        // 📚 Nauka pojedynczego słowa
        const studyBtn = element.querySelector('.study-btn');
        if (studyBtn) {
            studyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.studySingleWord(word);
            });
        }
        
        // 🗑️ Usunięcie z ulubionych
        const removeBtn = element.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeBookmark(word);
            });
        }
        
        // 📱 Kliknięcie w całe słowo - przejdź do nauki
        element.addEventListener('click', () => {
            this.studySingleWord(word);
        });
    }
    
    /**
     * 📚 Rozpoczęcie nauki wszystkich ulubionych
     */

    startBookmarksStudy() {
        if (this.allBookmarks.length === 0) {
            NotificationManager.show('Brak ulubionych słów do nauki', 'info');
            return;
        }
        
        console.log(`📚 Rozpoczynam naukę ${this.allBookmarks.length} ulubionych słów z poziomu modala`);
        
        // Zamknij modal i uruchom tryb nauki w głównej aplikacji
        this.closeModal();
        this.app.startBookmarksOnlyMode();
    }
    
    /**
     * 📚 Nauka pojedynczego słowa
     */
    studySingleWord(word) {
        console.log(`📚 Przechodzę do nauki słowa: ${word.english}`);
        
        // 📂 Zamknij modal
        this.closeModal();
        
        // 🎯 Jeśli jesteśmy w trybie ulubionych, wyjdź z niego
        if (this.app.state.bookmarksOnlyMode) {
            this.app.exitBookmarksOnlyMode();
        }
        
        // 🎯 Przełącz na kategorię i słowo
        // Używamy setTimeout, aby dać czas na zamknięcie modala i uniknąć "przeskoku"
        setTimeout(() => {
            this.app.switchCategory(word.categoryKey);
            this.app.state.currentWordIndex = word.wordIndex;
            this.app.updateCard();
            NotificationManager.show(`Przechodzę do słowa: ${word.english}`, 'info');
        }, 350); // nieco dłużej niż animacja zamykania modala
    }
    
    /**
     * 🗑️ Usunięcie słowa z ulubionych
     */
    removeBookmark(word) {
        if (!confirm(`Czy na pewno chcesz usunąć "${word.english}" z ulubionych?`)) {
            return;
        }
        
        console.log(`🗑️ Usuwam z ulubionych: ${word.english}`);
        
        // 🔄 Toggle bookmark (usunie go)
        const success = this.app.managers.progress.toggleWordBookmark(word);
        
        if (success !== undefined) {
            // 🔄 Odśwież dane
            this.loadBookmarksData();
            
            NotificationManager.show(`"${word.english}" usunięte z ulubionych`, 'info');
            
            // 🔄 Aktualizuj statystyki w głównej aplikacji
            if (this.app.updateStats) {
                this.app.updateStats();
            }
        } else {
            NotificationManager.show('Błąd podczas usuwania z ulubionych', 'error');
        }
    }
    
    /**
     * 💾 Eksport ulubionych do pliku
     */
    exportBookmarks() {
        console.log('💾 Eksportuję ulubione słowa...');
        
        try {
            // 📊 Pobierz dane do eksportu
            const exportData = this.app.managers.progress.exportBookmarks();
            
            // 📝 Stwórz plik JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            // 💾 Pobierz plik
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ulubione-slowa-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            NotificationManager.show(`Wyeksportowano ${exportData.bookmarks.length} ulubionych słów`, 'success');
            
        } catch (error) {
            console.error('❌ Błąd eksportu:', error);
            NotificationManager.show('Błąd podczas eksportu ulubionych', 'error');
        }
    }
    
    /**
     * 🗑️ Czyszczenie wszystkich ulubionych
     */
    clearAllBookmarks() {
        if (!confirm('Czy na pewno chcesz usunąć WSZYSTKIE ulubione słowa? Tej operacji nie można cofnąć.')) {
            return;
        }
        
        console.log('🗑️ Czyszczę wszystkie ulubione...');
        
        const removedCount = this.app.managers.progress.clearAllBookmarks();
        
        // 🔄 Odśwież dane
        this.loadBookmarksData();
        
        // 🔄 Aktualizuj statystyki w głównej aplikacji
        if (this.app.updateStats) {
            this.app.updateStats();
        }
        
        NotificationManager.show(`Usunięto ${removedCount} ulubionych słów`, 'info');
    }
    
    /**
     * 📄 Paginacja - poprzednia strona
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderBookmarksList();
            this.updatePagination();
        }
    }
    
    /**
     * 📄 Paginacja - następna strona
     */
    nextPage() {
        const totalPages = Math.ceil(this.filteredBookmarks.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderBookmarksList();
            this.updatePagination();
        }
    }
    
    /**
     * 📄 Aktualizacja paginacji
     */
    updatePagination() {
        const pagination = document.getElementById('bookmarks-pagination');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredBookmarks.length / this.itemsPerPage);
        
        // 🎯 Pokaż/ukryj paginację
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        } else {
            pagination.style.display = 'flex';
        }
        
        // 🔄 Aktualizuj przyciski
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
        }
        
        // 📊 Aktualizuj info
        if (pageInfo) {
            pageInfo.textContent = `Strona ${this.currentPage} z ${totalPages}`;
        }
    }
    
    /**
     * ❌ Pokazanie błędu
     */
    showError(message) {
        console.error('❌ BookmarksController Error:', message);
        
        const container = document.getElementById('bookmarks-list');
        const placeholder = document.getElementById('no-bookmarks-placeholder');
        
        if (container && placeholder) {
            placeholder.style.display = 'block';
            container.style.display = 'none';
            
            const icon = placeholder.querySelector('.placeholder-icon');
            const title = placeholder.querySelector('h4');
            const text = placeholder.querySelector('p');
            
            if (icon) icon.textContent = '❌';
            if (title) title.textContent = 'Błąd';
            if (text) text.textContent = message;
        }
        
        NotificationManager.show(message, 'error');
    }
}

/**
 * 🌐 Funkcje globalne dla łatwego dostępu
 */
window.openBookmarksModal = function() {
    if (window.englishFlashcardsApp && window.englishFlashcardsApp.openBookmarks) {
        window.englishFlashcardsApp.openBookmarks();
    }
};

window.closeBookmarksModal = function() {
    if (window.englishFlashcardsApp && window.englishFlashcardsApp.bookmarksController) {
        window.englishFlashcardsApp.bookmarksController.closeModal();
    }
};

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookmarksController;
}