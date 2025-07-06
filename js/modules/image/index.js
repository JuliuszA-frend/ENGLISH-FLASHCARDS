/**
 * Image Module - Główny punkt wejścia
 * Eksportuje wszystkie klasy modułu zarządzania obrazkami
 * 
 * STRUKTURA MODUŁU:
 * ├── ImageFileHandler    (obsługa plików)
 * ├── ImageModalUI        (interfejs użytkownika)
 * └── ImageManager        (główna klasa)
 */

// Import wszystkich komponentów modułu
import { ImageFileHandler } from './file-handler.js';
import { ImageModalUI } from './modal-ui.js';
import { ImageManager } from './image-manager.js';

// ==========================================
// GŁÓWNE EKSPORTY
// ==========================================

// Eksport głównej klasy (kompatybilność z app.js)
export { ImageManager };

// Eksport wszystkich komponentów (dla zaawansowanego użycia)
export {
    ImageFileHandler,
    ImageModalUI
};

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Factory function - tworzenie skonfigurowanego ImageManager
 * @param {Object} options - Opcje konfiguracji
 * @returns {ImageManager} - Skonfigurowany ImageManager
 */
export function createImageManager(options = {}) {
    const imageManager = new ImageManager();
    
    // Zastosuj opcje konfiguracji jeśli podane
    if (options.defaultImageSize) {
        imageManager.defaultImageSize = { ...imageManager.defaultImageSize, ...options.defaultImageSize };
    }
    
    if (options.maxFileSize) {
        imageManager.maxFileSize = options.maxFileSize;
    }
    
    if (options.storageKey) {
        imageManager.storageKey = options.storageKey;
    }
    
    console.log('🏭 ImageManager utworzony przez factory z opcjami:', options);
    return imageManager;
}

/**
 * Funkcja sprawdzenia dostępności modułu
 * @returns {Object} - Status modułu
 */
export function checkImageModuleStatus() {
    const status = {
        moduleLoaded: true,
        components: {
            ImageFileHandler: typeof ImageFileHandler === 'function',
            ImageModalUI: typeof ImageModalUI === 'function', 
            ImageManager: typeof ImageManager === 'function'
        },
        browserSupport: {
            localStorage: typeof Storage !== 'undefined',
            fileReader: typeof FileReader !== 'undefined',
            canvas: typeof HTMLCanvasElement !== 'undefined',
            dragDrop: typeof DataTransfer !== 'undefined'
        },
        timestamp: new Date().toISOString()
    };
    
    status.allComponentsLoaded = Object.values(status.components).every(Boolean);
    status.browserCompatible = Object.values(status.browserSupport).every(Boolean);
    status.ready = status.allComponentsLoaded && status.browserCompatible;
    
    return status;
}

// ==========================================
// GLOBAL SETUP (dla backward compatibility)
// ==========================================

if (typeof window !== 'undefined') {
    // Dodaj główną klasę do window
    window.ImageManager = ImageManager;
    
    // Dodaj factory function
    window.createImageManager = createImageManager;
    
    // Dodaj funkcję diagnostyczną
    window.checkImageModuleStatus = checkImageModuleStatus;
    
    // Debug info (tylko dla development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🌐 Image Module dostępny globalnie:', {
            ImageManager: typeof ImageManager,
            createImageManager: typeof createImageManager,
            checkImageModuleStatus: typeof checkImageModuleStatus
        });
        
        // Test modułu
        const moduleStatus = checkImageModuleStatus();
        console.log('🔍 Status Image Module:', moduleStatus);
        
        if (!moduleStatus.ready) {
            console.warn('⚠️ Image Module nie jest w pełni gotowy:', {
                components: moduleStatus.components,
                browserSupport: moduleStatus.browserSupport
            });
        }
    }
}

// ==========================================
// MODULE INFO (dla debugowania)
// ==========================================

export const MODULE_INFO = {
    name: 'Image Management Module',
    version: '2.0.0',
    description: 'Modularny system zarządzania obrazkami dla fiszek',
    components: [
        'ImageFileHandler - obsługa plików',
        'ImageModalUI - interfejs użytkownika', 
        'ImageManager - główna klasa łącząca'
    ],
    features: [
        'Drag & drop upload',
        'Automatyczna optymalizacja obrazków',
        'Walidacja plików',
        'Storage w localStorage',
        'Modal UI z animacjami',
        'Export/import danych'
    ],
    author: 'English Flashcards App',
    lastModified: new Date().toISOString()
};

// ==========================================
// DEVELOPMENT HELPERS
// ==========================================

if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    
    /**
     * Debug function - test całego modułu
     */
    window.testImageModule = function() {
        console.group('🧪 Test Image Module');
        
        try {
            // Test factory
            const testManager = createImageManager({
                maxFileSize: 1024 * 1024,
                defaultImageSize: { width: 200, height: 150 }
            });
            
            console.log('✅ Factory function działa');
            
            // Test głównej klasy
            const testResults = testManager.testImageManager();
            console.log('📊 Wyniki testów ImageManager:', testResults);
            
            // Test status modułu
            const moduleStatus = checkImageModuleStatus();
            console.log('🔍 Status modułu:', moduleStatus);
            
            // Cleanup
            testManager.cleanup();
            
            console.log('✅ Wszystkie testy modułu zakończone');
            
        } catch (error) {
            console.error('❌ Błąd testów modułu:', error);
        }
        
        console.groupEnd();
    };
    
    /**
     * Debug function - informacje o module
     */
    window.getImageModuleInfo = function() {
        console.table(MODULE_INFO);
        console.log('📦 Komponenty modułu:', MODULE_INFO.components);
        console.log('🚀 Funkcje modułu:', MODULE_INFO.features);
        return MODULE_INFO;
    };
    
    console.log(`
📦 IMAGE MODULE v${MODULE_INFO.version} ZAŁADOWANY
🔧 Debug functions:
   - window.testImageModule() - test całego modułu
   - window.getImageModuleInfo() - informacje o module  
   - window.checkImageModuleStatus() - status komponentów
   - window.createImageManager(options) - factory function
    `);
}

// Logowanie ładowania modułu
console.log(`📦 ${MODULE_INFO.name} v${MODULE_INFO.version} załadowany`);
console.log(`🔧 Komponenty: ${MODULE_INFO.components.length}`);
console.log(`💡 Użyj: import { ImageManager } from './modules/image/index.js'`);