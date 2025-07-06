/**
 * 🎯 GŁÓWNY PUNKT WEJŚCIA - Moduł Flashcard
 * 
 * Ten plik łączy wszystkie komponenty modułu flashcard w jeden spójny system.
 * Eksportuje główną klasę FlashcardManager oraz wszystkie pomocnicze klasy.
 * 
 * STRUKTURA MODUŁU:
 * ├── FlashcardManager     (główna klasa - API kompatybilne z oryginałem)
 * ├── FlashcardRenderer    (renderowanie kart)
 * ├── FlashcardTemplates   (szablony HTML)
 * ├── DOMHelper           (narzędzia DOM)
 * ├── FlashcardImageHandler (obsługa obrazków)
 * ├── FlashcardAudioHandler (obsługa audio)
 * └── FlashcardControls    (kontrolki - trudność, bookmark)
 */

// 🎯 IMPORT wszystkich komponentów modułu
import FlashcardRenderer from './renderer.js';
import FlashcardTemplates from './templates.js';
import DOMHelper from './dom-helper.js';
import FlashcardImageHandler from './image-handler.js';
import FlashcardAudioHandler from './audio-handler.js';
import FlashcardControls from './controls.js';

/**
 * 🎮 GŁÓWNA KLASA FlashcardManager
 * 
 * Wrapper dla FlashcardRenderer, który zapewnia:
 * - Backward compatibility z oryginalnym API
 * - Łatwe zarządzanie wszystkimi komponentami
 * - Jednolity punkt dostępu do funkcjonalności fiszek
 */
class FlashcardManager {
    constructor() {
        // Główny renderer
        this.renderer = new FlashcardRenderer();
        
        // Przekazuj właściwości z renderer'a dla compatibility
        this.vocabulary = null;
        this.currentWord = null;
        this.showPhonetics = true;
        
        // Menedżery zewnętrzne (będą ustawione przez setManagers)
        this.imageManager = null;
        this.audioManager = null;
        this.progressManager = null;
        
        console.log('🎮 FlashcardManager zainicjalizowany (modularny)');
    }

    /**
     * 🔧 KONFIGURACJA - Ustawienie słownictwa
     */
    setVocabulary(vocabulary) {
        this.vocabulary = vocabulary;
        this.renderer.setVocabulary(vocabulary);
        console.log('📚 FlashcardManager otrzymał słownictwo');
    }

    /**
     * 🔧 KONFIGURACJA - Ustawienie menedżerów zewnętrznych
     */
    setManagers(imageManager, audioManager, progressManager = null) {
        this.imageManager = imageManager;
        this.audioManager = audioManager;
        this.progressManager = progressManager;
        
        // Przekaż menedżery do renderer'a
        this.renderer.setManagers(imageManager, audioManager, progressManager);
        
        console.log('🔧 FlashcardManager skonfigurowany z menedżerami:', {
            image: !!imageManager,
            audio: !!audioManager,
            progress: !!progressManager
        });
    }

    /**
     * 🎨 GŁÓWNE API - Wyświetlenie słowa (kompatybilność z oryginałem)
     */
    displayWord(word, mode = 'flashcards') {
        if (!word) {
            console.error('❌ FlashcardManager.displayWord: Brak słowa do wyświetlenia');
            return;
        }

        console.log(`🎨 FlashcardManager.displayWord: ${word.english} (${mode})`);
        
        // Zapisz bieżące słowo
        this.currentWord = word;
        
        // Przekaż do renderer'a
        this.renderer.displayWord(word, mode);
        
        // Auto-play jeśli włączone
        if (this.audioManager && this.audioManager.autoPlay && word.english) {
            this.renderer.autoPlayAudio(word.english);
        }
    }

    /**
     * ⚙️ USTAWIENIA - Pokazywanie fonetyki
     */
    setShowPhonetics(show) {
        this.showPhonetics = show;
        this.renderer.setShowPhonetics(show);
        console.log(`📖 Fonetyka: ${show ? 'włączona' : 'wyłączona'}`);
    }

    /**
     * 🔊 AUDIO - Auto-play toggle
     */
    toggleAutoPlay() {
        const result = this.renderer.toggleAutoPlay();
        console.log(`🔊 Auto-play przełączony: ${result}`);
        return result;
    }

    /**
     * 🧪 AUDIO - Test bieżącego słowa
     */
    async testCurrentWordAudio() {
        return await this.renderer.testCurrentWordAudio();
    }

    /**
     * 🔄 STAN - Odświeżenie stanów przycisków
     */
    refreshButtonStates(word = null) {
        const targetWord = word || this.currentWord;
        if (targetWord) {
            this.renderer.refreshButtonStates(targetWord);
        }
    }

    /**
     * 🔄 STAN - Odświeżenie stanu trudności (dla kompatybilności)
     */
    refreshDifficultyState(word = null) {
        const targetWord = word || this.currentWord;
        if (targetWord && this.renderer.controls) {
            this.renderer.controls.refreshDifficultyState(targetWord);
        }
    }

    /**
     * 🔄 STAN - Odświeżenie stanu bookmark (dla kompatybilności)
     */
    refreshBookmarkState(word = null) {
        const targetWord = word || this.currentWord;
        if (targetWord && this.renderer.controls) {
            this.renderer.controls.refreshBookmarkState(targetWord);
        }
    }

    /**
     * 🔄 UI - Aktualizacja karty (dla kompatybilności z app.js)
     */
    updateCard() {
        if (this.currentWord) {
            this.displayWord(this.currentWord);
        } else {
            console.warn('⚠️ FlashcardManager.updateCard: Brak bieżącego słowa');
        }
    }

    /**
     * 🔄 UI - Aktualizacja wyświetlania fonetyki
     */
    updatePhoneticDisplay() {
        this.renderer.updatePhoneticDisplay();
    }

    /**
     * 🧹 CLEANUP - Czyszczenie zasobów
     */
    cleanup() {
        console.log('🧹 FlashcardManager cleanup...');
        
        // Wyczyść renderer
        if (this.renderer) {
            this.renderer.cleanup();
        }
        
        // Wyczyść referencje
        this.vocabulary = null;
        this.currentWord = null;
        this.imageManager = null;
        this.audioManager = null;
        this.progressManager = null;
        this.renderer = null;
        
        console.log('✅ FlashcardManager wyczyszczony');
    }

    /**
     * 🔍 DEBUG - Informacje o stanie modułu
     */
    getModuleInfo() {
        return {
            name: 'FlashcardManager (Modular)',
            version: '2.0.0',
            hasVocabulary: !!this.vocabulary,
            hasCurrentWord: !!this.currentWord,
            currentWord: this.currentWord?.english || null,
            managers: {
                image: !!this.imageManager,
                audio: !!this.audioManager,
                progress: !!this.progressManager
            },
            renderer: !!this.renderer,
            showPhonetics: this.showPhonetics
        };
    }

    /**
     * 🧪 DEBUG - Test całego modułu
     */
    testModule() {
        console.group('🧪 Test modułu FlashcardManager');
        
        const info = this.getModuleInfo();
        console.table(info);
        
        console.log('📦 Dostępne komponenty:');
        console.log(`  FlashcardRenderer: ${!!this.renderer}`);
        console.log(`  ImageHandler: ${!!this.renderer?.imageHandler}`);
        console.log(`  AudioHandler: ${!!this.renderer?.audioHandler}`);
        console.log(`  Controls: ${!!this.renderer?.controls}`);
        
        if (this.currentWord) {
            console.log(`📱 Bieżące słowo: ${this.currentWord.english} → ${this.currentWord.polish}`);
        } else {
            console.log('📱 Brak bieżącego słowa');
        }
        
        console.groupEnd();
        
        return info;
    }
}

/**
 * 🌟 EKSPORTY MODUŁU
 * 
 * Eksportujemy wszystkie klasy dla elastyczności użycia:
 * - FlashcardManager (główna klasa)
 * - Wszystkie komponenty osobno (dla zaawansowanego użycia)
 */

// Główny eksport (domyślny)
export default FlashcardManager;

// Eksporty nazwane (wszystkie komponenty)
export {
    FlashcardManager,           // Główna klasa
    FlashcardRenderer,          // Renderer
    FlashcardTemplates,         // Szablony HTML
    DOMHelper,                  // Narzędzia DOM
    FlashcardImageHandler,      // Obsługa obrazków
    FlashcardAudioHandler,      // Obsługa audio
    FlashcardControls           // Kontrolki
};

/**
 * 🔧 FACTORY FUNCTION (opcjonalna)
 * Funkcja pomocnicza do tworzenia skonfigurowanego FlashcardManager
 */
export function createFlashcardManager(vocabulary = null, managers = {}) {
    const flashcardManager = new FlashcardManager();
    
    if (vocabulary) {
        flashcardManager.setVocabulary(vocabulary);
    }
    
    if (managers.image || managers.audio || managers.progress) {
        flashcardManager.setManagers(
            managers.image || null,
            managers.audio || null, 
            managers.progress || null
        );
    }
    
    return flashcardManager;
}

/**
 * 🌐 GLOBAL SETUP (dla backward compatibility)
 * Jeśli kod działa w przeglądarce, dodaj do window dla łatwego dostępu
 */
if (typeof window !== 'undefined') {
    // Dodaj główną klasę
    window.FlashcardManager = FlashcardManager;
    
    // Dodaj factory function
    window.createFlashcardManager = createFlashcardManager;
    
    // Debug info
    console.log('🌐 Moduł FlashcardManager dostępny globalnie:', {
        FlashcardManager: typeof FlashcardManager,
        createFlashcardManager: typeof createFlashcardManager
    });
}

/**
 * 🔍 MODULE INFO (dla debugowania)
 */
export const MODULE_INFO = {
    name: 'Flashcard Module',
    version: '2.0.0',
    description: 'Modularny system zarządzania fiszkami',
    components: [
        'FlashcardManager',
        'FlashcardRenderer', 
        'FlashcardTemplates',
        'DOMHelper',
        'FlashcardImageHandler',
        'FlashcardAudioHandler',
        'FlashcardControls'
    ],
    author: 'English Flashcards App',
    lastModified: new Date().toISOString()
};

console.log(`📦 ${MODULE_INFO.name} v${MODULE_INFO.version} załadowany`);
console.log(`🔧 Komponenty: ${MODULE_INFO.components.length}`);
console.log(`💡 Użyj: import { FlashcardManager } from './flashcard/index.js'`);