/**
 * BookmarksManager - Główna klasa zarządzająca modułem bookmarks
 * API-compatible z oryginalnym BookmarksController
 * Łączy wszystkie komponenty: modal, data, renderer, events, pagination
 */

// 🎯 IMPORT wszystkich komponentów modułu
import BookmarksModal from './bookmarks-modal.js';
import BookmarksData from './bookmarks-data.js';
import BookmarksRenderer from './bookmarks-renderer.js';
import BookmarksEvents from './bookmarks-events.js';
import BookmarksPagination from './bookmarks-pagination.js';

class BookmarksManager {
    constructor(app) {
        this.app = app; // Referencja do głównej aplikacji
        
        // Komponenty modułu
        this.modal = new BookmarksModal();
        this.data = null; // Będzie ustawione w init()
        this.renderer = new BookmarksRenderer();
        this.events = new BookmarksEvents();
        this.pagination = new BookmarksPagination(10); // 10 items per page
        
        // Stan modułu
        this.isInitialized = false;
        this.currentFilters = {
            searchTerm: '',
            categoryKey: '',
            sortType: 'recent'
        };
        
        console.log('🔖 BookmarksManager utworzony');
    }

    /**
     * 🚀 Inicjalizacja modułu
     */
    init() {
        console.log('🚀 Inicjalizacja BookmarksManager...');
        
        try {
            // 1. Sprawdź dostępność ProgressManager
            if (!this.app.managers?.progress) {
                throw new Error('ProgressManager nie jest dostępny');
            }

            // 2. Inicjalizuj komponenty danych
            this.data = new BookmarksData(this.app.managers.progress);

            // 3. Inicjalizuj komponenty UI
            if (!this.modal.init('bookmarks-modal')) {
                throw new Error('Nie można zainicjalizować modala');
            }

            if (!this.renderer.init()) {
                throw new Error('Nie można zainicjalizować renderera');
            }

            if (!this.events.init('bookmarks-modal')) {
                throw new Error('Nie można zainicjalizować event handlerów');
            }

            if (!this.pagination.init('bookmarks-pagination')) {
                throw new Error('Nie można zainicjalizować paginacji');
            }

            // 4. Setup callbacks
            this.setupCallbacks();

            // 5. Setup event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('✅ BookmarksManager zainicjalizowany pomyślnie');
            
        } catch (error) {
            console.error('❌ Błąd inicjalizacji BookmarksManager:', error);
            throw error;
        }
    }

    /**
     * 🔧 Setup callbacks między komponentami
     */
    setupCallbacks() {
        // Modal callbacks
        this.modal.setCallbacks(
            () => this.loadBookmarksData(), // onOpen
            () => this.onModalClose()       // onClose
        );

        // Pagination callback
        this.pagination.setPageChangeCallback(() => {
            this.renderCurrentPage();
        });
    }

    /**
     * 🎯 Setup event listeners
     */
    setupEventListeners() {
        const callbacks = {
            onClose: () => this.closeModal(),
            onSearch: (searchTerm) => this.handleSearch(searchTerm),
            onCategoryFilter: (categoryKey) => this.handleCategoryFilter(categoryKey),
            onSort: (sortType) => this.handleSort(sortType),
            onStudyAll: () => this.startBookmarksStudy(),
            onExport: () => this.exportBookmarks(),
            onClearAll: () => this.clearAllBookmarks(),
            onPreviousPage: () => this.pagination.previousPage(),
            onNextPage: () => this.pagination.nextPage()
        };

        this.events.setupModalEvents(callbacks);

        // Global app events
        document.addEventListener('bookmarkChanged', (e) => {
            this.handleBookmarkChange(e.detail);
        });

        document.addEventListener('bookmarksCleared', (e) => {
            this.handleBookmarksCleared(e.detail);
        });
    }

    /**
     * 📂 Główna metoda otwierania modala (API compatibility)
     */
    openModal() {
        console.log('📂 BookmarksManager.openModal() wywołana');
        
        if (!this.isInitialized) {
            console.error('❌ BookmarksManager nie jest zainicjalizowany');
            return false;
        }

        return this.modal.open();
    }

    /**
     * 📂 Zamykanie modala
     */
    closeModal() {
        console.log('📂 Zamykanie modala bookmarks...');
        return this.modal.close();
    }

    /**
     * ❓ Sprawdzenie czy modal jest otwarty (API compatibility)
     */
    isModalOpen() {
        return this.modal.isModalOpen();
    }

    /**
     * 📊 Główna metoda ładowania danych (API compatibility)
     */
    loadBookmarksData() {
        console.log('📊 Ładowanie danych bookmarks...');
        
        try {
            // 1. Pokaż loading
            this.renderer.showLoading();

            // 2. Załaduj wszystkie dane
            this.data.loadAllBookmarks();

            // 3. Zastosuj aktualne filtry
            this.applyCurrentFilters();

            // 4. Renderuj UI
            this.renderBookmarksUI();

            console.log('✅ Dane bookmarks załadowane pomyślnie');
            return true;
            
        } catch (error) {
            console.error('❌ Błąd ładowania danych bookmarks:', error);
            this.renderer.showError('Błąd podczas ładowania ulubionych słów');
            return false;
        }
    }

    /**
     * 🎨 Renderowanie całego UI
     */
    renderBookmarksUI() {
        console.log('🎨 renderBookmarksUI() START');
        
        try {
            // 1. Pobierz dane
            const stats = this.data.getStats();
            const filteredBookmarks = this.data.getFilteredBookmarks();
            
            console.log(`📊 Stats: ${stats.totalBookmarks} total bookmarks`);
            console.log(`📋 Filtered: ${filteredBookmarks.length} bookmarks to render`);

            // 2. Renderuj statystyki
            this.renderer.renderStats(stats);

            // 3. Renderuj filtr kategorii
            const categoryStats = this.data.getCategoriesWithBookmarks();
            this.renderer.renderCategoryFilter(categoryStats);

            // 4. Setup pagination
            this.pagination.setData(filteredBookmarks);

            // 5. Renderuj aktualną stronę
            this.renderCurrentPage();
            
            console.log('✅ renderBookmarksUI() SUCCESS');
            
        } catch (error) {
            console.error('❌ Błąd w renderBookmarksUI():', error);
            this.renderer.showError('Błąd renderowania interfejsu');
        }
    }

    /**
     * 📄 Renderowanie aktualnej strony
     */
    renderCurrentPage() {
        const filteredBookmarks = this.data.getFilteredBookmarks();
        const pageBookmarks = this.pagination.getPageItems(filteredBookmarks);

        // Renderuj listę słów
        this.renderer.renderBookmarksList(pageBookmarks, (itemElement, word) => {
            this.setupWordActions(itemElement, word);
        });

        // Renderuj pagination
        this.pagination.render();
    }

    /**
     * 🎯 Setup akcji dla pojedynczego słowa
     */
    setupWordActions(itemElement, word) {
        const callbacks = {
            onStudySingle: (word) => this.studySingleWord(word),
            onRemove: (word) => this.removeBookmark(word)
        };

        this.events.setupItemEvents(itemElement, word, callbacks);
    }

    /**
     * 🔍 Obsługa wyszukiwania
     */
    handleSearch(searchTerm) {
        console.log(`🔍 Wyszukiwanie: "${searchTerm}"`);
        
        this.currentFilters.searchTerm = searchTerm;
        this.applyCurrentFilters();
        this.renderBookmarksUI();
    }

    /**
     * 🏷️ Obsługa filtru kategorii
     */
    handleCategoryFilter(categoryKey) {
        console.log(`🏷️ Filtr kategorii: "${categoryKey}"`);
        
        this.currentFilters.categoryKey = categoryKey;
        this.applyCurrentFilters();
        this.renderBookmarksUI();
    }

    /**
     * 📊 Obsługa sortowania
     */
    handleSort(sortType) {
        console.log(`📊 Sortowanie: "${sortType}"`);
        
        this.currentFilters.sortType = sortType;
        this.applyCurrentFilters();
        this.renderBookmarksUI();
    }

    /**
     * 🔄 Zastosowanie aktualnych filtrów
     */
    applyCurrentFilters() {
        this.data.filterBookmarks(
            this.currentFilters.searchTerm,
            this.currentFilters.categoryKey,
            this.currentFilters.sortType
        );
    }

    /**
     * 📚 Rozpoczęcie nauki wszystkich bookmarks (API compatibility)
     */
    startBookmarksStudy() {
        console.log('📚 Rozpoczynam naukę wszystkich bookmarks...');
        
        if (this.data.getAllBookmarks().length === 0) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Brak słów do powtórek', 'info');
            }
            return false;
        }
        
        // Zamknij modal i uruchom tryb nauki w głównej aplikacji
        this.closeModal();
        
        if (this.app.startBookmarksOnlyMode) {
            this.app.startBookmarksOnlyMode();
        }
        
        return true;
    }

    /**
     * 📚 Nauka pojedynczego słowa
     */
    studySingleWord(word) {
        console.log(`📚 Przechodzę do nauki słowa: ${word.english}`);
        
        // Zamknij modal
        this.closeModal();
        
        // Deleguj do głównej aplikacji
        if (this.app.switchCategory && this.app.updateCard) {
            // Wyjdź z trybu bookmarks jeśli aktywny
            if (this.app.state?.bookmarksOnlyMode && this.app.exitBookmarksOnlyMode) {
                this.app.exitBookmarksOnlyMode();
            }
            
            // Przełącz na kategorię i słowo
            setTimeout(() => {
                this.app.switchCategory(word.categoryKey);
                this.app.state.currentWordIndex = word.wordIndex;
                this.app.updateCard();
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.show(`Przechodzę do słowa: ${word.english}`, 'info');
                }
            }, 350);
        }
    }

    /**
     * 🗑️ Usunięcie bookmark
     */
    removeBookmark(word) {
        if (!confirm(`Czy na pewno chcesz usunąć "${word.english}" z powtórek?`)) {
            return false;
        }
        
        console.log(`🗑️ Usuwam bookmark: ${word.english}`);
        
        // Sprawdź stan przed usunięciem
        const wasInBookmarksMode = this.app.state?.bookmarksOnlyMode;
        const bookmarksCountBefore = this.data.getAllBookmarks().length;
        const willBeLastBookmark = bookmarksCountBefore === 1;
        
        // ✅ POPRAWKA: Najpierw usuń z UI (natychmiast)
        this.renderer.removeItemImmediately(word.wordKey);
        
        // ✅ POPRAWKA: Potem usuń z danych
        const success = this.data.removeBookmark(word);
        
        if (success) {
            console.log(`✅ Bookmark ${word.english} usunięty z danych`);
            
            // ✅ POPRAWKA: Natychmiast odśwież UI (bez animacji)
            this.renderBookmarksUI();
            
            // Powiadom inne komponenty
            this.notifyBookmarkChange(word, false);
            
            // Wyjdź z trybu bookmarks jeśli to było ostatnie słowo
            if (wasInBookmarksMode && willBeLastBookmark && this.app.exitBookmarksOnlyMode) {
                console.log('🚪 To było ostatnie słowo - wychodzimy z trybu bookmarks');
                this.app.exitBookmarksOnlyMode();
                
                setTimeout(() => {
                    if (typeof NotificationManager !== 'undefined') {
                        NotificationManager.show(
                            '🚪 Wyszedłeś z trybu powtórki - brak słów do nauki', 
                            'info', 
                            3000
                        );
                    }
                }, 500);
            }
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show(`"${word.english}" usunięte z powtórek`, 'info');
            }
            
            return true;
        } else {
            console.error(`❌ Błąd usuwania ${word.english} z danych`);
            
            // ✅ POPRAWKA: Jeśli usunięcie z danych nie powiodło się, odśwież UI
            this.renderBookmarksUI();
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Błąd podczas usuwania z powtórek', 'error');
            }
            return false;
        }
    }

    /**
     * 💾 Eksport bookmarks
     */
    exportBookmarks() {
        console.log('💾 Eksportuję bookmarks...');
        
        try {
            const exportData = this.data.exportBookmarks();
            
            // Stwórz plik JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            // Pobierz plik
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `powtorka-slowa-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show(`Wyeksportowano ${exportData.bookmarks.length} słów`, 'success');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Błąd eksportu:', error);
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Błąd podczas eksportu słów', 'error');
            }
            return false;
        }
    }

    /**
     * 🗑️ Czyszczenie wszystkich bookmarks
     */
    clearAllBookmarks() {
        if (!confirm('Czy na pewno chcesz usunąć WSZYSTKIE słowa do powtórki? Tej operacji nie można cofnąć.')) {
            return false;
        }
        
        console.log('🗑️ Czyszczę wszystkie bookmarks...');
        
        // Sprawdź stan przed czyszczeniem
        const wasInBookmarksMode = this.app.state?.bookmarksOnlyMode;
        const bookmarksToRemove = this.data.getAllBookmarks();
        
        // ✅ POPRAWKA: Najpierw wyczyść UI
        this.renderer.clearContainer();
        this.renderer.showEmptyState();
        
        // ✅ POPRAWKA: Potem wyczyść dane
        const removedCount = this.data.clearAllBookmarks();
        
        if (removedCount > 0) {
            console.log(`✅ Wyczyszczono ${removedCount} bookmarks`);
            
            // Wyjdź z trybu bookmarks jeśli był aktywny
            if (wasInBookmarksMode && this.app.exitBookmarksOnlyMode) {
                console.log('🚪 Wychodzimy z trybu bookmarks po wyczyszczeniu');
                this.app.exitBookmarksOnlyMode();
                
                setTimeout(() => {
                    if (typeof NotificationManager !== 'undefined') {
                        NotificationManager.show(
                            '🚪 Wyszedłeś z trybu powtórki - brak słów do nauki', 
                            'info', 
                            4000
                        );
                    }
                }, 1000);
            }
            
            // Powiadom o zmianach (batch notification)
            bookmarksToRemove.forEach((word, index) => {
                setTimeout(() => {
                    this.notifyBookmarkChange(word, false);
                }, index * 10);
            });
            
            // ✅ POPRAWKA: Końcowe odświeżenie UI (dla pewności)
            setTimeout(() => {
                this.renderBookmarksUI();
            }, 100);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show(`Usunięto ${removedCount} słów do powtórki`, 'info');
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * 📡 Powiadomienie o zmianie bookmark
     */
    notifyBookmarkChange(word, isBookmarked) {
        console.log(`📡 Powiadamiam o zmianie bookmark: ${word.english} → ${isBookmarked}`);
        
        // Wyślij event do aplikacji
        const bookmarkEvent = new CustomEvent('bookmarkChanged', {
            detail: {
                word: word,
                isBookmarked: isBookmarked,
                wordKey: word.wordKey,
                source: 'modal'
            }
        });
        document.dispatchEvent(bookmarkEvent);
        
        // Aktualizuj liczniki w aplikacji
        if (this.app.updateBookmarksCount) {
            this.app.updateBookmarksCount();
        }
        
        if (this.app.updateStats) {
            this.app.updateStats();
        }
    }

    /**
     * 🔄 Obsługa zmiany bookmark z zewnątrz
     */
    handleBookmarkChange(detail) {
        if (this.isModalOpen()) {
            console.log('🔄 Odświeżam modal po zmianie bookmark');
            this.loadBookmarksData();
        }
    }

    /**
     * 🔄 Obsługa wyczyszczenia wszystkich bookmarks z zewnątrz
     */
    handleBookmarksCleared(detail) {
        if (this.isModalOpen()) {
            console.log('🔄 Odświeżam modal po wyczyszczeniu bookmarks');
            this.loadBookmarksData();
        }
    }

    /**
     * 🔄 Callback zamknięcia modala
     */
    onModalClose() {
        // Wyczyść filtry przy zamknięciu
        this.currentFilters = {
            searchTerm: '',
            categoryKey: '',
            sortType: 'recent'
        };
        
        // Deaktywuj event listeners
        this.events.setActive(false);
    }

    /**
     * 📊 Diagnostyka modułu
     */
    getDiagnostics() {
        return {
            isInitialized: this.isInitialized,
            hasApp: !!this.app,
            components: {
                modal: this.modal.getDiagnostics(),
                data: this.data ? {
                    totalBookmarks: this.data.getAllBookmarks().length,
                    filteredBookmarks: this.data.getFilteredBookmarks().length,
                    hasProgressManager: !!this.data.progressManager
                } : null,
                renderer: this.renderer.getRenderInfo(),
                events: this.events.getDiagnostics(),
                pagination: this.pagination.getInfo()
            },
            currentFilters: this.currentFilters
        };
    }

    /**
     * 🧹 Cleanup modułu
     */
    cleanup() {
        console.log('🧹 Czyszczenie BookmarksManager...');
        
        // Cleanup wszystkich komponentów
        if (this.modal) this.modal.cleanup();
        if (this.data) this.data.cleanup();
        if (this.renderer) this.renderer.cleanup();
        if (this.events) this.events.cleanup();
        if (this.pagination) this.pagination.cleanup();
        
        // Wyczyść referencje
        this.app = null;
        this.modal = null;
        this.data = null;
        this.renderer = null;
        this.events = null;
        this.pagination = null;
        
        this.isInitialized = false;
        
        console.log('✅ BookmarksManager wyczyszczony');
    }
}

// 🎯 EXPORT
export default BookmarksManager;