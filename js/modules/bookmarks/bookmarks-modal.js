/**
 * BookmarksModal - Zarządzanie modalem bookmarks
 * Otwieranie, zamykanie, animacje, stan modala
 */

class BookmarksModal {
    constructor() {
        this.modalElement = null;
        this.isOpen = false;
        this.openCallback = null;
        this.closeCallback = null;
        this.animationDuration = 300; // ms
    }

    /**
     * 🔧 Inicjalizacja modala
     */
    init(modalElementId) {
        this.modalElement = document.getElementById(modalElementId);
        
        if (!this.modalElement) {
            console.error(`❌ Modal element ${modalElementId} nie został znaleziony`);
            return false;
        }
        
        // Ukryj modal na początku
        this.modalElement.style.display = 'none';
        this.modalElement.classList.remove('visible');
        
        console.log('✅ BookmarksModal zainicjalizowany');
        return true;
    }

    /**
     * 📂 Otwarcie modala
     */
    open() {
        if (this.isOpen) {
            console.log('📂 Modal już jest otwarty');
            return false;
        }

        console.log('📂 Otwieranie modala bookmarks...');

        if (!this.modalElement) {
            console.error('❌ Modal element nie jest zainicjalizowany');
            return false;
        }

        // Wywołaj callback przed otwarciem
        if (this.openCallback) {
            try {
                this.openCallback();
            } catch (error) {
                console.error('❌ Błąd w openCallback:', error);
            }
        }

        // Pokaż modal
        this.modalElement.style.display = 'flex';
        
        // Animacja pojawienia (setTimeout dla smooth transition)
        setTimeout(() => {
            this.modalElement.classList.add('visible');
        }, 10);

        // Ustaw stan
        this.isOpen = true;
        
        // Focus na wyszukiwanie po animacji
        setTimeout(() => {
            this.focusSearchInput();
        }, this.animationDuration);

        // Dodaj klasę do body (może być używana w CSS)
        document.body.classList.add('bookmarks-modal-open');

        // Event dla innych komponentów
        this.dispatchModalEvent('bookmarksModalOpened');

        console.log('✅ Modal bookmarks otwarty');
        return true;
    }

    /**
     * 📂 Zamknięcie modala
     */
    close() {
        if (!this.isOpen) {
            console.log('📂 Modal już jest zamknięty');
            return false;
        }

        console.log('📂 Zamykanie modala bookmarks...');

        if (!this.modalElement) {
            console.error('❌ Modal element nie jest zainicjalizowany');
            return false;
        }

        // Animacja znikania
        this.modalElement.classList.remove('visible');

        // Wywołaj callback przed zamknięciem
        if (this.closeCallback) {
            try {
                this.closeCallback();
            } catch (error) {
                console.error('❌ Błąd w closeCallback:', error);
            }
        }

        // Ukryj modal po animacji
        setTimeout(() => {
            this.modalElement.style.display = 'none';
        }, this.animationDuration);

        // Ustaw stan
        this.isOpen = false;

        // Usuń klasę z body
        document.body.classList.remove('bookmarks-modal-open');

        // Event dla innych komponentów
        this.dispatchModalEvent('bookmarksModalClosed');

        console.log('✅ Modal bookmarks zamknięty');
        return true;
    }

    /**
     * 🔄 Toggle modala
     */
    toggle() {
        return this.isOpen ? this.close() : this.open();
    }

    /**
     * 🔍 Focus na pole wyszukiwania
     */
    focusSearchInput() {
        const searchInput = document.getElementById('bookmarks-search');
        if (searchInput && this.isOpen) {
            try {
                searchInput.focus();
                console.log('🔍 Focus ustawiony na wyszukiwanie');
            } catch (error) {
                console.warn('⚠️ Nie można ustawić focus na wyszukiwanie:', error);
            }
        }
    }

    /**
     * 🎨 Animacja ładowania
     */
    showLoading() {
        if (!this.modalElement) return;

        const content = this.modalElement.querySelector('.bookmarks-content');
        if (content) {
            content.classList.add('loading');
            
            // Dodaj spinner jeśli nie istnieje
            let spinner = content.querySelector('.loading-spinner');
            if (!spinner) {
                spinner = document.createElement('div');
                spinner.className = 'loading-spinner';
                spinner.innerHTML = `
                    <div class="spinner-icon">⏳</div>
                    <div class="spinner-text">Ładowanie bookmarks...</div>
                `;
                content.appendChild(spinner);
            }
        }
    }

    /**
     * 🎨 Ukrycie animacji ładowania
     */
    hideLoading() {
        if (!this.modalElement) return;

        const content = this.modalElement.querySelector('.bookmarks-content');
        if (content) {
            content.classList.remove('loading');
            
            const spinner = content.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    /**
     * ❌ Pokazanie błędu w modalu
     */
    showError(message, type = 'error') {
        if (!this.modalElement) return;

        const content = this.modalElement.querySelector('.bookmarks-content');
        if (content) {
            // Wyczyść poprzednią zawartość
            content.innerHTML = `
                <div class="modal-error ${type}">
                    <div class="error-icon">${type === 'error' ? '❌' : '⚠️'}</div>
                    <div class="error-message">${message}</div>
                    <button class="btn primary retry-btn">Spróbuj ponownie</button>
                </div>
            `;

            // Event listener dla przycisku retry
            const retryBtn = content.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    if (this.openCallback) {
                        this.openCallback();
                    }
                });
            }
        }
    }

    /**
     * 📊 Aktualizacja licznika w tytule
     */
    updateTitle(count) {
        const titleBadge = document.getElementById('bookmarks-count');
        if (titleBadge) {
            titleBadge.textContent = count;
        }
    }

    /**
     * 🎯 Sprawdzenie czy modal jest otwarty
     */
    isModalOpen() {
        return this.isOpen;
    }

    /**
     * 🔄 Ustawienie callbacków
     */
    setCallbacks(openCallback, closeCallback) {
        this.openCallback = openCallback;
        this.closeCallback = closeCallback;
    }

    /**
     * ⚙️ Ustawienie czasu animacji
     */
    setAnimationDuration(duration) {
        if (duration > 0) {
            this.animationDuration = duration;
        }
    }

    /**
     * 📱 Adaptacja do rozmiaru ekranu
     */
    adaptToScreenSize() {
        if (!this.modalElement) return;

        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            this.modalElement.classList.add('mobile-layout');
        } else {
            this.modalElement.classList.remove('mobile-layout');
        }
    }

    /**
     * 🔒 Blokowanie scrollowania tła
     */
    lockBodyScroll() {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    /**
     * 🔓 Odblokowanie scrollowania tła
     */
    unlockBodyScroll() {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }

    /**
     * 📡 Wysyłanie custom eventów
     */
    dispatchModalEvent(eventType, data = {}) {
        try {
            const event = new CustomEvent(eventType, {
                detail: {
                    modal: this,
                    isOpen: this.isOpen,
                    timestamp: new Date().toISOString(),
                    ...data
                }
            });
            
            document.dispatchEvent(event);
            console.log(`📡 Event wysłany: ${eventType}`);
        } catch (error) {
            console.warn('⚠️ Błąd wysyłania eventu:', error);
        }
    }

    /**
     * 🎭 Animacje wejścia/wyjścia (zaawansowane)
     */
    setCustomAnimation(type, keyframes, options = {}) {
        if (!this.modalElement || !this.modalElement.animate) return;

        const defaultOptions = {
            duration: this.animationDuration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'both'
        };

        const animationOptions = { ...defaultOptions, ...options };

        try {
            const animation = this.modalElement.animate(keyframes, animationOptions);
            
            animation.addEventListener('finish', () => {
                console.log(`🎭 Animacja ${type} zakończona`);
            });

            return animation;
        } catch (error) {
            console.warn('⚠️ Błąd animacji:', error);
            return null;
        }
    }

    /**
     * 📏 Dostosowanie wysokości modala
     */
    adjustHeight() {
        if (!this.modalElement) return;

        const modal = this.modalElement.querySelector('.modal');
        if (!modal) return;

        const maxHeight = window.innerHeight * 0.9; // 90% wysokości ekranu
        modal.style.maxHeight = `${maxHeight}px`;
    }

    /**
     * 🔍 Znajdowanie elementów w modalu
     */
    findElement(selector) {
        if (!this.modalElement) return null;
        return this.modalElement.querySelector(selector);
    }

    /**
     * 🔍 Znajdowanie wszystkich elementów w modalu
     */
    findElements(selector) {
        if (!this.modalElement) return [];
        return Array.from(this.modalElement.querySelectorAll(selector));
    }

    /**
     * 📊 Diagnostyka modala
     */
    getDiagnostics() {
        return {
            isOpen: this.isOpen,
            hasElement: !!this.modalElement,
            elementVisible: this.modalElement ? 
                getComputedStyle(this.modalElement).display !== 'none' : false,
            animationDuration: this.animationDuration,
            hasCallbacks: {
                open: !!this.openCallback,
                close: !!this.closeCallback
            }
        };
    }

    /**
     * 🧹 Cleanup modala
     */
    cleanup() {
        console.log('🧹 Czyszczenie BookmarksModal...');

        // Zamknij modal jeśli otwarty
        if (this.isOpen) {
            this.close();
        }

        // Odblokuj scroll
        this.unlockBodyScroll();

        // Usuń klasę z body
        document.body.classList.remove('bookmarks-modal-open');

        // Wyczyść referencje
        this.modalElement = null;
        this.openCallback = null;
        this.closeCallback = null;
        this.isOpen = false;

        console.log('✅ BookmarksModal wyczyszczony');
    }
}

// 🎯 EXPORT
export default BookmarksModal;