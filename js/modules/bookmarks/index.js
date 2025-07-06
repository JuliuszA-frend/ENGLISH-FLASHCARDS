/**
 * 🔖 GŁÓWNY PUNKT WEJŚCIA - Moduł Bookmarks
 * 
 * Ten plik łączy wszystkie komponenty modułu bookmarks w jeden spójny system.
 * Eksportuje główną klasę BookmarksManager oraz wszystkie pomocnicze klasy.
 * 
 * STRUKTURA MODUŁU:
 * ├── BookmarksManager     (główna klasa - API kompatybilne z oryginałem)
 * ├── BookmarksModal       (zarządzanie modalem)
 * ├── BookmarksData        (zarządzanie danymi i filtrowanie)
 * ├── BookmarksRenderer    (renderowanie UI)
 * ├── BookmarksEvents      (obsługa zdarzeń)
 * ├── BookmarksPagination  (paginacja)
 * └── BookmarksTemplates   (szablony HTML)
 */

// 🎯 IMPORT wszystkich komponentów modułu
import BookmarksManager from './bookmarks-manager.js';
import BookmarksModal from './bookmarks-modal.js';
import BookmarksData from './bookmarks-data.js';
import BookmarksRenderer from './bookmarks-renderer.js';
import BookmarksEvents from './bookmarks-events.js';
import BookmarksPagination from './bookmarks-pagination.js';
import BookmarksTemplates from './bookmarks-templates.js';

/**
 * 🔖 GŁÓWNA KLASA BookmarksController
 * 
 * Wrapper dla BookmarksManager, który zapewnia:
 * - Backward compatibility z oryginalnym API
 * - Łatwe zarządzanie wszystkimi komponentami
 * - Jednolity punkt dostępu do funkcjonalności bookmarks
 */
class BookmarksController {
    constructor(app) {
        // Główny manager
        this.manager = new BookmarksManager(app);
        
        // Przekazuj właściwości z managera dla compatibility
        this.app = app;
        this.isInitialized = false;
        
        console.log('🔖 BookmarksController zainicjalizowany (modularny)');
    }

    /**
     * 🔧 KONFIGURACJA - Inicjalizacja kontrolera
     */
    init() {
        try {
            this.manager.init();
            this.isInitialized = true;
            console.log('✅ BookmarksController zainicjalizowany pomyślnie');
            return true;
        } catch (error) {
            console.error('❌ Błąd inicjalizacji BookmarksController:', error);
            return false;
        }
    }

    /**
     * 📂 GŁÓWNE API - Otwarcie modala (kompatybilność z oryginałem)
     */
    openModal() {
        if (!this.isInitialized) {
            console.error('❌ BookmarksController nie jest zainicjalizowany');
            return false;
        }

        console.log('📂 BookmarksController.openModal() wywołana');
        return this.manager.openModal();
    }

    /**
     * 📂 GŁÓWNE API - Zamknięcie modala
     */
    closeModal() {
        return this.manager.closeModal();
    }

    /**
     * ❓ GŁÓWNE API - Sprawdzenie czy modal jest otwarty
     */
    isModalOpen() {
        return this.manager.isModalOpen();
    }

    /**
     * 📊 GŁÓWNE API - Ładowanie danych bookmarks
     */
    loadBookmarksData() {
        return this.manager.loadBookmarksData();
    }

    /**
     * 📚 GŁÓWNE API - Rozpoczęcie nauki bookmarks
     */
    startBookmarksStudy() {
        return this.manager.startBookmarksStudy();
    }

    /**
     * 💾 GŁÓWNE API - Eksport bookmarks
     */
    exportBookmarks() {
        return this.manager.exportBookmarks();
    }

    /**
     * 🗑️ GŁÓWNE API - Czyszczenie wszystkich bookmarks
     */
    clearAllBookmarks() {
        return this.manager.clearAllBookmarks();
    }

    /**
     * 📊 DIAGNOSTYKA - Informacje o stanie modułu
     */
    getModuleInfo() {
        return {
            name: 'BookmarksController (Modular)',
            version: '2.0.0',
            isInitialized: this.isInitialized,
            hasApp: !!this.app,
            manager: this.manager ? this.manager.getDiagnostics() : null
        };
    }

    /**
     * 🧪 DEBUG - Test całego modułu
     */
    testModule() {
        console.group('🧪 Test modułu BookmarksController');
        
        const info = this.getModuleInfo();
        console.table(info);
        
        console.log('📦 Dostępne komponenty:');
        console.log(`  BookmarksManager: ${!!this.manager}`);
        console.log(`  BookmarksModal: ${!!this.manager?.modal}`);
        console.log(`  BookmarksData: ${!!this.manager?.data}`);
        console.log(`  BookmarksRenderer: ${!!this.manager?.renderer}`);
        console.log(`  BookmarksEvents: ${!!this.manager?.events}`);
        console.log(`  BookmarksPagination: ${!!this.manager?.pagination}`);
        
        if (this.manager?.data) {
            const bookmarks = this.manager.data.getAllBookmarks();
            console.log(`📋 Liczba bookmarks: ${bookmarks.length}`);
        }
        
        console.groupEnd();
        
        return info;
    }

    /**
     * 🧹 CLEANUP - Czyszczenie zasobów
     */
    cleanup() {
        console.log('🧹 BookmarksController cleanup...');
        
        // Wyczyść manager
        if (this.manager) {
            this.manager.cleanup();
        }
        
        // Wyczyść referencje
        this.app = null;
        this.manager = null;
        this.isInitialized = false;
        
        console.log('✅ BookmarksController wyczyszczony');
    }
}

/**
 * 🌟 EKSPORTY MODUŁU
 * 
 * Eksportujemy wszystkie klasy dla elastyczności użycia:
 * - BookmarksController (główna klasa dla compatibility)
 * - BookmarksManager (główny manager)
 * - Wszystkie komponenty osobno (dla zaawansowanego użycia)
 */

// Główny eksport (domyślny) - dla backward compatibility
export default BookmarksController;

// Eksporty nazwane (wszystkie komponenty)
export {
    BookmarksController,        // Główna klasa (wrapper)
    BookmarksManager,          // Główny manager
    BookmarksModal,            // Zarządzanie modalem
    BookmarksData,             // Zarządzanie danymi
    BookmarksRenderer,         // Renderowanie UI
    BookmarksEvents,           // Obsługa zdarzeń
    BookmarksPagination,       // Paginacja
    BookmarksTemplates         // Szablony HTML
};

/**
 * 🔧 FACTORY FUNCTION (opcjonalna)
 * Funkcja pomocnicza do tworzenia skonfigurowanego BookmarksController
 */
export function createBookmarksController(app) {
    const controller = new BookmarksController(app);
    
    // Auto-inicjalizacja jeśli app jest dostępny
    if (app && app.managers?.progress) {
        try {
            controller.init();
        } catch (error) {
            console.warn('⚠️ Auto-inicjalizacja nie powiodła się:', error);
        }
    }
    
    return controller;
}

/**
 * 🌐 GLOBAL SETUP (dla backward compatibility)
 * Jeśli kod działa w przeglądarce, dodaj do window dla łatwego dostępu
 */
if (typeof window !== 'undefined') {
    // Dodaj główną klasę
    window.BookmarksController = BookmarksController;
    
    // Dodaj factory function
    window.createBookmarksController = createBookmarksController;
    
    // Dodaj wszystkie komponenty dla zaawansowanego użycia
    window.BookmarksModule = {
        BookmarksController,
        BookmarksManager,
        BookmarksModal,
        BookmarksData,
        BookmarksRenderer,
        BookmarksEvents,
        BookmarksPagination,
        BookmarksTemplates
    };
    
    // Debug info
    console.log('🌐 Moduł BookmarksController dostępny globalnie:', {
        BookmarksController: typeof BookmarksController,
        createBookmarksController: typeof createBookmarksController,
        BookmarksModule: typeof window.BookmarksModule
    });
}

/**
 * 🔍 MODULE INFO (dla debugowania)
 */
export const MODULE_INFO = {
    name: 'Bookmarks Module',
    version: '2.0.0',
    description: 'Modularny system zarządzania ulubionymi słowami',
    components: [
        'BookmarksController',
        'BookmarksManager',
        'BookmarksModal', 
        'BookmarksData',
        'BookmarksRenderer',
        'BookmarksEvents',
        'BookmarksPagination',
        'BookmarksTemplates'
    ],
    author: 'English Flashcards App',
    lastModified: new Date().toISOString()
};

console.log(`📦 ${MODULE_INFO.name} v${MODULE_INFO.version} załadowany`);
console.log(`🔧 Komponenty: ${MODULE_INFO.components.length}`);
console.log(`💡 Użyj: import { BookmarksController } from './bookmarks/index.js'`);

/**
 * 🧪 GLOBAL DEBUG FUNCTIONS (tylko dla development)
 */
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    
    // Test funkcja dla całego modułu
    window.testBookmarksModule = function() {
        console.group('🧪 Test modułu Bookmarks');
        
        const app = window.englishFlashcardsApp;
        if (!app) {
            console.error('❌ Główna aplikacja nie jest dostępna');
            console.groupEnd();
            return false;
        }
        
        console.log('📱 Sprawdzanie aplikacji...');
        console.log('  App dostępna:', !!app);
        console.log('  ProgressManager:', !!app.managers?.progress);
        console.log('  BookmarksController:', !!app.bookmarksController);
        
        if (app.bookmarksController) {
            console.log('🔖 Test BookmarksController...');
            const moduleInfo = app.bookmarksController.testModule();
            console.log('📊 Wynik testu:', moduleInfo);
        }
        
        console.groupEnd();
        return true;
    };
    
    // Szybki test otwierania modala
    window.testBookmarksModal = function() {
        const app = window.englishFlashcardsApp;
        if (app?.bookmarksController) {
            console.log('🧪 Testuję modal bookmarks...');
            return app.bookmarksController.openModal();
        } else {
            console.error('❌ BookmarksController nie jest dostępny');
            return false;
        }
    };
    
    console.log(`
🧪 BOOKMARKS MODULE DEBUG TOOLS ZAŁADOWANE
📝 Dostępne funkcje:
   - window.testBookmarksModule() - test całego modułu
   - window.testBookmarksModal() - test otwierania modala
   - window.BookmarksModule.* - dostęp do wszystkich komponentów
`);
}