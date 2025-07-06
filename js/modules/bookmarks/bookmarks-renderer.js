/**
 * BookmarksRenderer - Renderowanie UI dla modułu bookmarks
 * Główny renderer łączący wszystkie komponenty wizualne
 */

// 🎯 IMPORT
import BookmarksTemplates from './bookmarks-templates.js';

class BookmarksRenderer {
    constructor() {
        this.containerElement = null;
        this.listElement = null;
        this.placeholderElement = null;
        this.isMobileLayout = false;
    }

    /**
     * 🔧 Inicjalizacja renderera
     */
    init() {
        // Znajdź główne elementy UI
        this.containerElement = document.getElementById('bookmarks-list');
        this.placeholderElement = document.getElementById('no-bookmarks-placeholder');
        
        if (!this.containerElement) {
            console.error('❌ Container bookmarks-list nie został znaleziony');
            return false;
        }

        if (!this.placeholderElement) {
            console.error('❌ Placeholder no-bookmarks-placeholder nie został znaleziony');
            return false;
        }

        // Sprawdź layout
        this.checkMobileLayout();
        
        console.log('✅ BookmarksRenderer zainicjalizowany');
        return true;
    }

    /**
     * 📱 Sprawdzenie czy używamy mobile layout
     */
    checkMobileLayout() {
        this.isMobileLayout = window.innerWidth <= 768;
        
        if (this.containerElement) {
            this.containerElement.classList.toggle('mobile-layout', this.isMobileLayout);
        }
    }

    renderBookmarksList(bookmarks, setupItemEvents) {
        console.log(`🎨 Renderowanie ${bookmarks.length} bookmarks...`);

        // ✅ POPRAWKA: ZAWSZE wyczyść kontener na początku
        this.clearContainer();

        // Sprawdź czy są dane do wyświetlenia
        if (bookmarks.length === 0) {
            this.showEmptyState();
            return;
        }

        // Ukryj placeholder i pokaż listę
        this.hideEmptyState();

        // Renderuj każdy bookmark
        bookmarks.forEach((word, index) => {
            const itemElement = this.createBookmarkElement(word, index);
            this.containerElement.appendChild(itemElement);

            // Setup event listeners dla tego elementu
            if (setupItemEvents && typeof setupItemEvents === 'function') {
                setupItemEvents(itemElement, word);
            }
        });

        console.log(`✅ Wyrenderowano ${bookmarks.length} bookmarks`);
    }

    /**
     * 🏗️ Tworzenie elementu bookmark
     */
    createBookmarkElement(word, index) {
        // Wybierz odpowiedni template w zależności od layoutu
        const template = this.isMobileLayout 
            ? BookmarksTemplates.getCompactBookmarkItemTemplate(word)
            : BookmarksTemplates.getBookmarkItemTemplate(word, index);

        // Stwórz element DOM z template
        const div = document.createElement('div');
        div.innerHTML = template.trim();
        const itemElement = div.firstChild;

        // Dodaj dodatkowe klasy/atrybuty
        itemElement.classList.add('bookmark-item-rendered');
        itemElement.setAttribute('data-index', index);
        
        // Animacja pojawienia się
        itemElement.style.opacity = '0';
        itemElement.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            itemElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            itemElement.style.opacity = '1';
            itemElement.style.transform = 'translateY(0)';
        }, index * 50); // Staged animation

        return itemElement;
    }

    /**
     * 📭 Pokazanie stanu pustego
     */
    showEmptyState(isFiltered = false) {
        console.log('📭 Pokazuję stan pusty...');

        // ✅ POPRAWKA: Wyczyść kontener PRZED ukryciem
        this.clearContainer();

        // Ukryj listę
        if (this.containerElement) {
            this.containerElement.style.display = 'none';
        }

        // Pokaż placeholder
        if (this.placeholderElement) {
            this.placeholderElement.style.display = 'block';
            
            // Ustaw odpowiedni content
            this.placeholderElement.innerHTML = BookmarksTemplates.getEmptyStateTemplate(isFiltered);
        }
    }

    /**
     * 📋 Ukrycie stanu pustego
     */
    hideEmptyState() {
        // Ukryj placeholder
        if (this.placeholderElement) {
            this.placeholderElement.style.display = 'none';
        }

        // Pokaż listę
        if (this.containerElement) {
            this.containerElement.style.display = 'block';
        }
    }

    /**
     * 🧹 Wyczyszczenie kontenera
     */
    clearContainer() {
        if (this.containerElement) {
            const itemCount = this.containerElement.querySelectorAll('.bookmark-item').length;
            
            if (itemCount > 0) {
                console.log(`🧹 Czyszczę kontener: usuwam ${itemCount} elementów`);
            }
            
            // ✅ NATYCHMIASTOWE czyszczenie
            this.containerElement.innerHTML = '';
            
            // Reset stylu opacity (usuwa artefakty animacji)
            this.containerElement.style.opacity = '1';
        }
    }

    /**
     * 📊 Renderowanie statystyk
     */
    renderStats(stats) {
        console.log('📊 Renderowanie statystyk...');

        const statsContainer = document.querySelector('.bookmark-stats');
        if (statsContainer) {
            statsContainer.innerHTML = BookmarksTemplates.getStatsTemplate(stats);
        }

        // Aktualizuj licznik w tytule
        const countBadge = document.getElementById('bookmarks-count');
        if (countBadge) {
            countBadge.textContent = stats.totalBookmarks;
        }

        console.log('✅ Statystyki wyrenderowane');
    }

    /**
     * 🏷️ Renderowanie filtru kategorii
     */
    renderCategoryFilter(categoryStats) {
        console.log('🏷️ Renderowanie filtru kategorii...');

        const categoryFilter = document.getElementById('bookmarks-category-filter');
        if (!categoryFilter) return;

        // Wyczyść istniejące opcje (oprócz "Wszystkie")
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }

        // Dodaj nowe opcje
        const optionsHTML = BookmarksTemplates.getCategoryFilterOptionsTemplate(categoryStats);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = optionsHTML;

        // Przenieś opcje do selecta
        while (tempDiv.firstChild) {
            categoryFilter.appendChild(tempDiv.firstChild);
        }

        console.log('✅ Filtr kategorii wyrenderowany');
    }

    /**
     * ❌ Pokazanie błędu
     */
    showError(message) {
        console.error('❌ Pokazuję błąd:', message);

        if (this.containerElement) {
            this.containerElement.style.display = 'none';
        }

        if (this.placeholderElement) {
            this.placeholderElement.style.display = 'block';
            this.placeholderElement.innerHTML = BookmarksTemplates.getErrorTemplate(message);
        }
    }

    /**
     * ⏳ Pokazanie stanu ładowania
     */
    showLoading() {
        console.log('⏳ Pokazuję stan ładowania...');

        if (this.containerElement) {
            this.containerElement.style.display = 'none';
        }

        if (this.placeholderElement) {
            this.placeholderElement.style.display = 'block';
            this.placeholderElement.innerHTML = BookmarksTemplates.getLoadingTemplate();
        }
    }

    /**
     * 🎯 Highlight konkretnego bookmark
     */
    highlightBookmark(wordKey) {
        const item = this.containerElement?.querySelector(`[data-word-key="${wordKey}"]`);
        if (item) {
            item.classList.add('highlighted');
            
            // Usuń highlight po 2 sekundach
            setTimeout(() => {
                item.classList.remove('highlighted');
            }, 2000);

            // Przewiń do elementu
            item.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    /**
     * 🎨 Animacja usunięcia bookmark
     */
    animateRemove(wordKey, callback) {
        const item = this.containerElement?.querySelector(`[data-word-key="${wordKey}"]`);
        if (!item) {
            if (callback) callback();
            return;
        }

        console.log(`🎨 Animuję usunięcie: ${wordKey}`);

        // ✅ SZYBKA animacja lub natychmiastowe usunięcie
        item.style.transition = 'opacity 0.2s ease';
        item.style.opacity = '0';

        // ✅ SZYBSZE usunięcie (100ms zamiast 300ms)
        setTimeout(() => {
            if (item.parentNode) {
                item.parentNode.removeChild(item);
                console.log(`🗑️ Element ${wordKey} usunięty z DOM`);
            }
            if (callback) callback();
        }, 100);
    }

    removeItemImmediately(wordKey) {
        const item = this.containerElement?.querySelector(`[data-word-key="${wordKey}"]`);
        if (item && item.parentNode) {
            item.parentNode.removeChild(item);
            console.log(`⚡ Element ${wordKey} usunięty natychmiast`);
            return true;
        }
        return false;
    }

    /**
     * 🎨 Animacja dodania bookmark
     */
    animateAdd(wordKey) {
        const item = this.containerElement?.querySelector(`[data-word-key="${wordKey}"]`);
        if (item) {
            item.classList.add('newly-added');
            
            setTimeout(() => {
                item.classList.remove('newly-added');
            }, 1000);
        }
    }

    /**
     * 🔄 Aktualizacja pojedynczego bookmark
     */
    updateBookmark(word) {
        const existingItem = this.containerElement?.querySelector(`[data-word-key="${word.wordKey}"]`);
        if (existingItem) {
            const newItemElement = this.createBookmarkElement(word, 0);
            existingItem.parentNode.replaceChild(newItemElement, existingItem);
            
            console.log(`🔄 Zaktualizowano bookmark: ${word.english}`);
        }
    }

    /**
     * 📱 Aktualizacja layoutu na mobile/desktop
     */
    updateLayout() {
        const wasMobile = this.isMobileLayout;
        this.checkMobileLayout();

        // Jeśli layout się zmienił, wyrenderuj ponownie
        if (wasMobile !== this.isMobileLayout) {
            console.log(`📱 Layout zmieniony na: ${this.isMobileLayout ? 'mobile' : 'desktop'}`);
            // Trigger re-render będzie wywołany z zewnątrz
            return true;
        }

        return false;
    }

    /**
     * 🎨 Dodanie batch actions
     */
    renderBatchActions(selectedCount) {
        let batchContainer = document.querySelector('.batch-actions-container');
        
        if (!batchContainer) {
            batchContainer = document.createElement('div');
            batchContainer.className = 'batch-actions-container';
            
            // Wstaw przed listą bookmarks
            if (this.containerElement && this.containerElement.parentNode) {
                this.containerElement.parentNode.insertBefore(batchContainer, this.containerElement);
            }
        }

        batchContainer.innerHTML = BookmarksTemplates.getBatchActionsTemplate(selectedCount);
    }

    /**
     * 🎨 Dodanie selection mode
     */
    enableSelectionMode() {
        if (this.containerElement) {
            this.containerElement.classList.add('selection-mode');
            
            // Dodaj checkboxy do wszystkich items
            const items = this.containerElement.querySelectorAll('.bookmark-item');
            items.forEach(item => {
                if (!item.querySelector('.selection-checkbox')) {
                    const checkbox = document.createElement('div');
                    checkbox.className = 'selection-checkbox';
                    checkbox.innerHTML = '<input type="checkbox">';
                    item.insertBefore(checkbox, item.firstChild);
                }
            });
        }
    }

    /**
     * 🎨 Wyłączenie selection mode
     */
    disableSelectionMode() {
        if (this.containerElement) {
            this.containerElement.classList.remove('selection-mode');
            
            // Usuń checkboxy
            const checkboxes = this.containerElement.querySelectorAll('.selection-checkbox');
            checkboxes.forEach(checkbox => checkbox.remove());
        }

        // Usuń batch actions
        const batchContainer = document.querySelector('.batch-actions-container');
        if (batchContainer) {
            batchContainer.remove();
        }
    }

    /**
     * 📊 Pobranie informacji o renderze
     */
    getRenderInfo() {
        return {
            hasContainer: !!this.containerElement,
            hasPlaceholder: !!this.placeholderElement,
            isMobileLayout: this.isMobileLayout,
            renderedItems: this.containerElement ? 
                this.containerElement.querySelectorAll('.bookmark-item').length : 0,
            containerVisible: this.containerElement ? 
                this.containerElement.style.display !== 'none' : false
        };
    }

    /**
     * 🧹 Cleanup renderera
     */
    cleanup() {
        console.log('🧹 Czyszczenie BookmarksRenderer...');

        // Wyczyść kontener
        this.clearContainer();
        
        // Ukryj placeholder
        this.hideEmptyState();

        // Wyłącz selection mode
        this.disableSelectionMode();

        // Wyczyść referencje
        this.containerElement = null;
        this.listElement = null;
        this.placeholderElement = null;

        console.log('✅ BookmarksRenderer wyczyszczony');
    }
}

// 🎯 EXPORT
export default BookmarksRenderer;