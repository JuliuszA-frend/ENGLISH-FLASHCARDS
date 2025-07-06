/**
 * BookmarksEvents - Zarządzanie event listenerów dla modułu bookmarks
 * Centralizacja obsługi zdarzeń, debouncing, cleanup
 */

class BookmarksEvents {
    constructor() {
        this.eventHandlers = new Map();
        this.debounceTimers = new Map();
        this.modalElement = null;
        this.isActive = false;
    }

    /**
     * 🔧 Inicjalizacja event listenerów
     */
    init(modalElementId) {
        this.modalElement = document.getElementById(modalElementId);
        
        if (!this.modalElement) {
            console.error(`❌ Modal element ${modalElementId} nie został znaleziony`);
            return false;
        }
        
        console.log('✅ BookmarksEvents zainicjalizowane');
        return true;
    }

    /**
     * 🎯 Setup wszystkich event listenerów dla modala
     */
    setupModalEvents(callbacks) {
        if (!this.modalElement) {
            console.error('❌ Modal element nie jest zainicjalizowany');
            return;
        }

        console.log('🎯 Konfigurowanie event listenerów modala...');

        // 📝 Modal controls
        this.addEventHandler('bookmarks-modal-close', 'click', callbacks.onClose);
        this.addEventHandler('bookmarks-modal', 'click', (e) => {
            if (e.target.id === 'bookmarks-modal') {
                callbacks.onClose();
            }
        });

        // 🔍 Search
        this.addEventHandler('bookmarks-search', 'input', 
            this.debounce((e) => callbacks.onSearch(e.target.value), 300)
        );

        // 🏷️ Category filter
        this.addEventHandler('bookmarks-category-filter', 'change', (e) => {
            callbacks.onCategoryFilter(e.target.value);
        });

        // 📊 Sort
        this.addEventHandler('bookmarks-sort', 'change', (e) => {
            callbacks.onSort(e.target.value);
        });

        // 📚 Actions
        this.addEventHandler('study-bookmarks-btn', 'click', callbacks.onStudyAll);
        this.addEventHandler('export-bookmarks-btn', 'click', callbacks.onExport);
        this.addEventHandler('clear-bookmarks-btn', 'click', callbacks.onClearAll);

        // ⌨️ Keyboard shortcuts
        this.addKeyboardShortcuts(callbacks);

        this.isActive = true;
        console.log('✅ Event listenery modala skonfigurowane');
    }

    /**
     * 🎯 Setup event listenerów dla pojedynczego bookmark item
     */
    setupItemEvents(itemElement, word, callbacks) {
        if (!itemElement) return;

        const wordKey = word.wordKey;

        // 📚 Study button
        const studyBtn = itemElement.querySelector('.study-btn');
        if (studyBtn) {
            this.addElementHandler(studyBtn, 'click', (e) => {
                e.stopPropagation();
                callbacks.onStudySingle(word);
            }, `study-${wordKey}`);
        }

        // 🗑️ Remove button
        const removeBtn = itemElement.querySelector('.remove-btn');
        if (removeBtn) {
            this.addElementHandler(removeBtn, 'click', (e) => {
                e.stopPropagation();
                callbacks.onRemove(word);
            }, `remove-${wordKey}`);
        }

        // 📱 Click na całym item
        this.addElementHandler(itemElement, 'click', () => {
            callbacks.onStudySingle(word);
        }, `item-${wordKey}`);

        // 🎨 Hover effects
        this.addElementHandler(itemElement, 'mouseenter', () => {
            itemElement.classList.add('hover');
        }, `hover-enter-${wordKey}`);

        this.addElementHandler(itemElement, 'mouseleave', () => {
            itemElement.classList.remove('hover');
        }, `hover-leave-${wordKey}`);
    }

    /**
     * ⌨️ Keyboard shortcuts
     */
    addKeyboardShortcuts(callbacks) {
        const keyHandler = (e) => {
            if (!this.isActive) return;

            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    callbacks.onClose();
                    break;
                    
                case 'Enter':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        callbacks.onStudyAll();
                    }
                    break;
                    
                case 'f':
                case 'F':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.focusSearch();
                    }
                    break;
                    
                case 'ArrowLeft':
                    if (e.altKey) {
                        e.preventDefault();
                        callbacks.onPreviousPage?.();
                    }
                    break;
                    
                case 'ArrowRight':
                    if (e.altKey) {
                        e.preventDefault();
                        callbacks.onNextPage?.();
                    }
                    break;
            }
        };

        this.addGlobalHandler('keydown', keyHandler, 'keyboard-shortcuts');
    }

    /**
     * 🔍 Focus na wyszukiwanie
     */
    focusSearch() {
        const searchInput = document.getElementById('bookmarks-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    /**
     * 🎯 Dodawanie event handlera z automatycznym cleanup
     */
    addEventHandler(elementId, event, handler, key = null) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Element ${elementId} nie został znaleziony`);
            return false;
        }

        return this.addElementHandler(element, event, handler, key || `${elementId}-${event}`);
    }

    /**
     * 🎯 Dodawanie event handlera do konkretnego elementu
     */
    addElementHandler(element, event, handler, key) {
        if (!element || typeof handler !== 'function') {
            console.warn('⚠️ Nieprawidłowy element lub handler');
            return false;
        }

        // Usuń poprzedni handler jeśli istnieje
        this.removeEventHandler(key);

        // Dodaj nowy handler
        element.addEventListener(event, handler);

        // Zapisz referencję do cleanup
        this.eventHandlers.set(key, {
            element,
            event,
            handler
        });

        return true;
    }

    /**
     * 🌐 Dodawanie globalnego event handlera (np. do document)
     */
    addGlobalHandler(event, handler, key) {
        document.addEventListener(event, handler);
        
        this.eventHandlers.set(key, {
            element: document,
            event,
            handler
        });
        
        return true;
    }

    /**
     * 🗑️ Usuwanie konkretnego event handlera
     */
    removeEventHandler(key) {
        const handlerInfo = this.eventHandlers.get(key);
        
        if (handlerInfo) {
            handlerInfo.element.removeEventListener(handlerInfo.event, handlerInfo.handler);
            this.eventHandlers.delete(key);
            return true;
        }
        
        return false;
    }

    /**
     * ⏱️ Debounce function
     */
    debounce(func, delay, key = 'default') {
        return (...args) => {
            // Wyczyść poprzedni timer
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            // Ustaw nowy timer
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        };
    }

    /**
     * ⏱️ Throttle function
     */
    throttle(func, delay, key = 'default') {
        let lastTime = 0;
        
        return (...args) => {
            const now = Date.now();
            
            if (now - lastTime >= delay) {
                lastTime = now;
                func.apply(this, args);
            }
        };
    }

    /**
     * 🎭 Animacje przycisków
     */
    addClickAnimation(element) {
        if (!element) return;

        element.classList.add('click-animation');
        
        setTimeout(() => {
            element.classList.remove('click-animation');
        }, 150);
    }

    /**
     * ✨ Animacja sukcesu
     */
    addSuccessAnimation(element) {
        if (!element) return;

        element.classList.add('success-animation');
        
        setTimeout(() => {
            element.classList.remove('success-animation');
        }, 600);
    }

    /**
     * ❌ Animacja błędu
     */
    addErrorAnimation(element) {
        if (!element) return;

        element.classList.add('error-animation');
        
        setTimeout(() => {
            element.classList.remove('error-animation');
        }, 600);
    }

    /**
     * 🔄 Aktywacja/deaktywacja event listenerów
     */
    setActive(active) {
        this.isActive = active;
        console.log(`🔄 BookmarksEvents ${active ? 'aktywne' : 'nieaktywne'}`);
    }

    /**
     * 📊 Dodawanie analytics event
     */
    trackEvent(eventName, data = {}) {
        try {
            // Custom event dla analytics
            const analyticsEvent = new CustomEvent('bookmarksAnalytics', {
                detail: {
                    event: eventName,
                    data: data,
                    timestamp: new Date().toISOString()
                }
            });
            
            document.dispatchEvent(analyticsEvent);
            
            console.log(`📊 Analytics: ${eventName}`, data);
        } catch (error) {
            console.warn('⚠️ Błąd trackingu analytics:', error);
        }
    }

    /**
     * 🎯 Helper: Setup drag & drop dla bookmark items
     */
    setupDragAndDrop(container, callbacks) {
        if (!container) return;

        // Włącz drag na elementach
        container.addEventListener('dragstart', (e) => {
            if (e.target.closest('.bookmark-item')) {
                const item = e.target.closest('.bookmark-item');
                const wordKey = item.dataset.wordKey;
                
                e.dataTransfer.setData('text/plain', wordKey);
                e.dataTransfer.effectAllowed = 'move';
                
                item.classList.add('dragging');
                this.trackEvent('bookmark_drag_start', { wordKey });
            }
        });

        container.addEventListener('dragend', (e) => {
            const item = e.target.closest('.bookmark-item');
            if (item) {
                item.classList.remove('dragging');
            }
        });

        // Drop zones
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const wordKey = e.dataTransfer.getData('text/plain');
            
            if (wordKey && callbacks.onDrop) {
                callbacks.onDrop(wordKey, e);
                this.trackEvent('bookmark_drop', { wordKey });
            }
        });
    }

    /**
     * 📱 Setup touch events dla mobile
     */
    setupTouchEvents(container, callbacks) {
        if (!container) return;

        let touchStartTime = 0;
        let touchElement = null;

        container.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchElement = e.target.closest('.bookmark-item');
        });

        container.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            
            if (touchElement && touchDuration > 500) {
                // Long press - pokaż context menu
                e.preventDefault();
                
                const wordKey = touchElement.dataset.wordKey;
                if (callbacks.onLongPress) {
                    callbacks.onLongPress(wordKey, e);
                    this.trackEvent('bookmark_long_press', { wordKey });
                }
            }
        });
    }

    /**
     * 🧹 Cleanup wszystkich event listenerów
     */
    cleanup() {
        console.log('🧹 Czyszczenie BookmarksEvents...');

        // Usuń wszystkie event handlery
        this.eventHandlers.forEach((handlerInfo, key) => {
            try {
                handlerInfo.element.removeEventListener(handlerInfo.event, handlerInfo.handler);
            } catch (error) {
                console.warn(`⚠️ Błąd usuwania handlera ${key}:`, error);
            }
        });
        this.eventHandlers.clear();

        // Wyczyść debounce timers
        this.debounceTimers.forEach((timer) => {
            clearTimeout(timer);
        });
        this.debounceTimers.clear();

        // Reset stanu
        this.modalElement = null;
        this.isActive = false;

        console.log('✅ BookmarksEvents wyczyszczone');
    }

    /**
     * 📊 Diagnostyka event listenerów
     */
    getDiagnostics() {
        return {
            activeHandlers: this.eventHandlers.size,
            handlerKeys: Array.from(this.eventHandlers.keys()),
            pendingDebounces: this.debounceTimers.size,
            isActive: this.isActive,
            hasModal: !!this.modalElement
        };
    }
}

// 🎯 EXPORT
export default BookmarksEvents;