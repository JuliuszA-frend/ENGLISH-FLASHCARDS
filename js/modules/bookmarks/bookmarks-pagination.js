/**
 * BookmarksPagination - Zarządzanie paginacją bookmarks
 * Podział na strony, nawigacja, wyświetlanie informacji o stronach
 */

class BookmarksPagination {
    constructor(itemsPerPage = 10) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalItems = 0;
        this.totalPages = 0;
        this.paginationElement = null;
    }

    /**
     * 🔧 Inicjalizacja paginacji
     */
    init(paginationElementId) {
        this.paginationElement = document.getElementById(paginationElementId);
        
        if (!this.paginationElement) {
            console.warn(`⚠️ Element paginacji ${paginationElementId} nie został znaleziony`);
            return false;
        }
        
        console.log('✅ BookmarksPagination zainicjalizowana');
        return true;
    }

    /**
     * 📊 Ustawienie danych do paginacji
     */
    setData(items) {
        this.totalItems = items.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        // Reset do pierwszej strony jeśli przekraczamy dostępne strony
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = 1;
        }
        
        // Jeśli brak elementów, ustaw stronę na 1
        if (this.totalItems === 0) {
            this.currentPage = 1;
            this.totalPages = 0;
        }
        
        console.log(`📊 Paginacja: ${this.totalItems} elementów, ${this.totalPages} stron`);
    }

    /**
     * 📄 Pobranie elementów dla aktualnej strony
     */
    getPageItems(items) {
        if (!items || items.length === 0) {
            return [];
        }
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        
        const pageItems = items.slice(startIndex, endIndex);
        
        console.log(`📄 Strona ${this.currentPage}: elementy ${startIndex + 1}-${Math.min(endIndex, items.length)} z ${items.length}`);
        
        return pageItems;
    }

    /**
     * ➡️ Przejście do następnej strony
     */
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            console.log(`➡️ Przejście na stronę ${this.currentPage}`);
            return true;
        }
        
        console.log('➡️ Już na ostatniej stronie');
        return false;
    }

    /**
     * ⬅️ Przejście do poprzedniej strony
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            console.log(`⬅️ Przejście na stronę ${this.currentPage}`);
            return true;
        }
        
        console.log('⬅️ Już na pierwszej stronie');
        return false;
    }

    /**
     * 🎯 Przejście do konkretnej strony
     */
    goToPage(pageNumber) {
        const targetPage = Math.max(1, Math.min(pageNumber, this.totalPages));
        
        if (targetPage !== this.currentPage) {
            this.currentPage = targetPage;
            console.log(`🎯 Przejście na stronę ${this.currentPage}`);
            return true;
        }
        
        return false;
    }

    /**
     * 🎨 Renderowanie kontrolek paginacji
     */
    render() {
        if (!this.paginationElement) {
            console.warn('⚠️ Element paginacji nie jest zainicjalizowany');
            return;
        }

        // Ukryj paginację jeśli tylko jedna strona lub brak elementów
        if (this.totalPages <= 1) {
            this.paginationElement.style.display = 'none';
            return;
        }

        // Pokaż paginację
        this.paginationElement.style.display = 'flex';

        // Generuj HTML
        this.paginationElement.innerHTML = this.generatePaginationHTML();

        // Dodaj event listenery
        this.attachEventListeners();

        console.log(`🎨 Renderowana paginacja: strona ${this.currentPage}/${this.totalPages}`);
    }

    /**
     * 🏗️ Generowanie HTML paginacji
     */
    generatePaginationHTML() {
        const canGoPrev = this.currentPage > 1;
        const canGoNext = this.currentPage < this.totalPages;

        return `
            <button id="prev-page" class="pagination-btn" ${!canGoPrev ? 'disabled' : ''}>
                ‹ Poprzednie
            </button>
            <span id="page-info" class="page-info">
                Strona ${this.currentPage} z ${this.totalPages}
            </span>
            <button id="next-page" class="pagination-btn" ${!canGoNext ? 'disabled' : ''}>
                Następne ›
            </button>
        `;
    }

    /**
     * 🎯 Dodawanie event listenerów
     */
    attachEventListeners() {
        const prevBtn = this.paginationElement.querySelector('#prev-page');
        const nextBtn = this.paginationElement.querySelector('#next-page');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.previousPage()) {
                    this.onPageChange();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.nextPage()) {
                    this.onPageChange();
                }
            });
        }
    }

    /**
     * 🔄 Callback wywoływany przy zmianie strony
     */
    onPageChange() {
        // Ta metoda będzie nadpisana przez klasę używającą paginacji
        console.log(`🔄 Zmiana strony na: ${this.currentPage}`);
    }

    /**
     * 🔄 Ustawienie callbacka zmiany strony
     */
    setPageChangeCallback(callback) {
        if (typeof callback === 'function') {
            this.onPageChange = callback;
        }
    }

    /**
     * 📊 Pobranie informacji o aktualnej paginacji
     */
    getInfo() {
        return {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            totalItems: this.totalItems,
            itemsPerPage: this.itemsPerPage,
            startIndex: (this.currentPage - 1) * this.itemsPerPage,
            endIndex: Math.min(this.currentPage * this.itemsPerPage, this.totalItems),
            hasNext: this.currentPage < this.totalPages,
            hasPrev: this.currentPage > 1
        };
    }

    /**
     * ⚙️ Zmiana liczby elementów na stronę
     */
    setItemsPerPage(itemsPerPage) {
        if (itemsPerPage > 0) {
            this.itemsPerPage = itemsPerPage;
            
            // Przelicz strony ponownie
            this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            
            // Sprawdź czy aktualna strona jest nadal ważna
            if (this.currentPage > this.totalPages && this.totalPages > 0) {
                this.currentPage = this.totalPages;
            }
            
            console.log(`⚙️ Zmieniono na ${itemsPerPage} elementów na stronę`);
            return true;
        }
        
        return false;
    }

    /**
     * 🔄 Reset paginacji
     */
    reset() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.totalPages = 0;
        
        if (this.paginationElement) {
            this.paginationElement.style.display = 'none';
        }
        
        console.log('🔄 Paginacja zresetowana');
    }

    /**
     * 📱 Sprawdzenie czy strona jest pierwsza
     */
    isFirstPage() {
        return this.currentPage === 1;
    }

    /**
     * 📱 Sprawdzenie czy strona jest ostatnia
     */
    isLastPage() {
        return this.currentPage === this.totalPages;
    }

    /**
     * 📊 Pobranie zakresu elementów na aktualnej stronie
     */
    getCurrentRange() {
        if (this.totalItems === 0) {
            return { start: 0, end: 0, total: 0 };
        }

        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);

        return {
            start,
            end,
            total: this.totalItems
        };
    }

    /**
     * 📄 Generowanie zaawansowanej paginacji z numerami stron
     */
    generateAdvancedPaginationHTML() {
        if (this.totalPages <= 1) return '';

        let html = '';
        const current = this.currentPage;
        const total = this.totalPages;
        
        // Przycisk poprzedni
        html += `<button class="pagination-btn prev" ${current <= 1 ? 'disabled' : ''} data-page="${current - 1}">‹</button>`;
        
        // Numery stron
        if (total <= 7) {
            // Pokaż wszystkie strony jeśli jest mało
            for (let i = 1; i <= total; i++) {
                html += `<button class="pagination-btn page-num ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
        } else {
            // Zaawansowana logika dla wielu stron
            html += `<button class="pagination-btn page-num ${1 === current ? 'active' : ''}" data-page="1">1</button>`;
            
            if (current > 4) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            
            for (let i = start; i <= end; i++) {
                html += `<button class="pagination-btn page-num ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            
            if (current < total - 3) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            
            html += `<button class="pagination-btn page-num ${total === current ? 'active' : ''}" data-page="${total}">${total}</button>`;
        }
        
        // Przycisk następny
        html += `<button class="pagination-btn next" ${current >= total ? 'disabled' : ''} data-page="${current + 1}">›</button>`;
        
        return html;
    }

    /**
     * 🧹 Cleanup
     */
    cleanup() {
        this.reset();
        this.paginationElement = null;
        this.onPageChange = () => {};
        
        console.log('🧹 BookmarksPagination wyczyszczone');
    }
}

// 🎯 EXPORT
export default BookmarksPagination;