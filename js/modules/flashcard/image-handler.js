/**
 * FlashcardImageHandler - Obsługa obrazków dla fiszek
 * WERSJA POPRAWIONA - kompatybilna z zrefaktoryzowanym ImageManager
 */

// 🎯 IMPORT - pobieramy potrzebne klasy
import FlashcardTemplates from './templates.js';
import DOMHelper from './dom-helper.js';

class FlashcardImageHandler {
    constructor(imageManager) {
        this.imageManager = imageManager;
        
        // ✅ DEBUGOWANIE: Sprawdź czy imageManager ma wymagane metody
        if (this.imageManager) {
            console.log('🖼️ FlashcardImageHandler - sprawdzam dostępne metody ImageManager:');
            console.log('  openManagerForWord:', typeof this.imageManager.openManagerForWord);
            console.log('  getImage:', typeof this.imageManager.getImage);
            console.log('  deleteImage:', typeof this.imageManager.deleteImage);
            
            // ✅ FALLBACK: Jeśli brak metod, spróbuj użyć globalnej instancji
            if (typeof this.imageManager.openManagerForWord !== 'function') {
                console.warn('⚠️ ImageManager nie ma metody openManagerForWord, próbuję fallback...');
                
                if (window.imageManager && typeof window.imageManager.openManagerForWord === 'function') {
                    console.log('🔄 Używam globalnej instancji window.imageManager');
                    this.imageManager = window.imageManager;
                } else if (window.ImageManager) {
                    console.log('🔄 Tworzę nową instancję ImageManager');
                    this.imageManager = new window.ImageManager();
                }
            }
        } else {
            console.error('❌ FlashcardImageHandler: Brak imageManager!');
        }
    }

    /**
     * Dodanie sekcji obrazka do kontenera
     */
    addImageSection(container, word) {
        if (!this.imageManager) {
            console.warn('⚠️ ImageManager niedostępny - pomijam sekcję obrazka');
            return;
        }

        const wordId = this.getWordId(word);
        
        try {
            const savedImage = this.imageManager.getImage(wordId);

            if (savedImage && savedImage.data) {
                this.addExistingImage(container, savedImage.data, wordId, word);
            } else {
                this.addImageButton(container, wordId, word);
            }
        } catch (error) {
            console.error('❌ Błąd w addImageSection:', error);
            // Fallback - dodaj tylko przycisk
            this.addImageButton(container, wordId, word);
        }
    }

    /**
     * Dodanie istniejącego obrazka
     */
    addExistingImage(container, imageData, wordId, word) {
        const imageEl = DOMHelper.createElement('img', 'word-image');
        imageEl.src = imageData;
        imageEl.alt = `Obrazek dla: ${word.polish}`;
        imageEl.loading = 'lazy';
        
        const imageWrapper = DOMHelper.createElement('div', 'image-wrapper');
        imageWrapper.appendChild(imageEl);
        
        const controls = this.createImageControls(wordId, word);
        imageWrapper.appendChild(controls);
        
        container.appendChild(imageWrapper);
        
        console.log(`🖼️ Dodano istniejący obrazek dla: ${wordId}`);
    }

    /**
     * Dodanie przycisku dodawania obrazka
     */
    addImageButton(container, wordId, word) {
        const addImageBtn = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getAddImageButton()
        );
        
        addImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`📷 Kliknięto przycisk dodaj obrazek dla: ${wordId}`);
            this.openImageManager(wordId, word);
        });
        
        container.appendChild(addImageBtn);
    }

    /**
     * Tworzenie kontrolek obrazka
     */
    createImageControls(wordId, word) {
        const controls = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getImageControls()
        );

        const editBtn = controls.querySelector('.edit-btn');
        const deleteBtn = controls.querySelector('.delete-btn');

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`✏️ Kliknięto edytuj obrazek dla: ${wordId}`);
                this.openImageManager(wordId, word);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`🗑️ Kliknięto usuń obrazek dla: ${wordId}`);
                this.deleteWordImage(wordId);
            });
        }

        return controls;
    }

    /**
     * Otwarcie managera obrazków - GŁÓWNA METODA DO NAPRAWY
     */
    openImageManager(wordId, word) {
        console.log(`🚀 openImageManager wywołane dla: ${wordId}`, word);
        
        if (!this.imageManager) {
            console.error('❌ ImageManager nie jest dostępny');
            this.showErrorNotification('Moduł obrazków nie jest dostępny');
            return false;
        }

        // ✅ SPRAWDŹ DOSTĘPNOŚĆ METODY
        if (typeof this.imageManager.openManagerForWord !== 'function') {
            console.error('❌ Metoda openManagerForWord nie istnieje na imageManager');
            console.log('🔍 Dostępne metody:', Object.getOwnPropertyNames(this.imageManager));
            
            // ✅ FALLBACK: Spróbuj alternatywne metody
            if (typeof this.imageManager.showImageModal === 'function') {
                console.log('🔄 Używam fallback: showImageModal');
                return this.imageManager.showImageModal(wordId, word);
            } else if (typeof this.imageManager.modalUI?.showModal === 'function') {
                console.log('🔄 Używam fallback: modalUI.showModal');
                return this.imageManager.modalUI.showModal(wordId, word);
            } else {
                this.showErrorNotification('Funkcja zarządzania obrazkami nie jest dostępna');
                return false;
            }
        }

        // ✅ WYWOŁAJ WŁAŚCIWĄ METODĘ
        try {
            console.log('✅ Wywołuję openManagerForWord...');
            const result = this.imageManager.openManagerForWord(wordId, word);
            console.log('✅ openManagerForWord zakończone pomyślnie');
            return result;
        } catch (error) {
            console.error('❌ Błąd wywołania openManagerForWord:', error);
            this.showErrorNotification('Błąd otwierania managera obrazków: ' + error.message);
            return false;
        }
    }

    /**
     * Usunięcie obrazka słowa
     */
    deleteWordImage(wordId) {
        if (!this.imageManager) {
            console.error('❌ ImageManager nie jest dostępny dla deleteWordImage');
            return false;
        }

        if (confirm('Czy na pewno chcesz usunąć ten obrazek?')) {
            try {
                let result = false;
                
                // Spróbuj różne metody usuwania
                if (typeof this.imageManager.deleteImage === 'function') {
                    result = this.imageManager.deleteImage(wordId);
                } else if (typeof this.imageManager.removeImage === 'function') {
                    result = this.imageManager.removeImage(wordId);
                }
                
                if (result) {
                    // Odśwież kartę
                    if (window.englishFlashcardsApp && window.englishFlashcardsApp.updateCard) {
                        window.englishFlashcardsApp.updateCard();
                    }
                    
                    this.showSuccessNotification('Obrazek został usunięty');
                    console.log(`✅ Usunięto obrazek: ${wordId}`);
                } else {
                    this.showWarningNotification('Nie można usunąć obrazka');
                    console.warn(`⚠️ Nie udało się usunąć obrazka: ${wordId}`);
                }
                
                return result;
                
            } catch (error) {
                console.error('❌ Błąd usuwania obrazka:', error);
                this.showErrorNotification('Błąd podczas usuwania obrazka');
                return false;
            }
        }
        
        return false;
    }

    /**
     * Generowanie ID słowa
     */
    getWordId(word) {
        // Użyj tego samego algorytmu co w ProgressManager
        if (word.id) {
            return `word-${word.id}`;
        }
        
        // Fallback: użyj słów angielskiego i polskiego
        const englishPart = word.english.toLowerCase().replace(/\s+/g, '-');
        const polishPart = word.polish.toLowerCase().replace(/\s+/g, '-');
        return `word-${englishPart}-${polishPart}`;
    }

    /**
     * Metody pomocnicze dla powiadomień
     */
    showErrorNotification(message) {
        this.showNotification(message, 'error');
    }

    showSuccessNotification(message) {
        this.showNotification(message, 'success');
    }

    showWarningNotification(message) {
        this.showNotification(message, 'warning');
    }

    showNotification(message, type = 'info') {
        if (typeof NotificationManager !== 'undefined' && NotificationManager.show) {
            NotificationManager.show(message, type);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
            // Fallback - zwykły alert
            if (type === 'error') {
                alert('Błąd: ' + message);
            }
        }
    }

    /**
     * ✅ NOWA METODA: Test połączenia z ImageManager
     */
    testImageManagerConnection() {
        console.group('🧪 Test połączenia FlashcardImageHandler → ImageManager');
        
        console.log('ImageManager dostępny:', !!this.imageManager);
        
        if (this.imageManager) {
            console.log('Typ ImageManager:', this.imageManager.constructor.name);
            console.log('Metody ImageManager:', Object.getOwnPropertyNames(this.imageManager).filter(name => typeof this.imageManager[name] === 'function'));
            
            // Test kluczowych metod
            const methods = ['openManagerForWord', 'getImage', 'deleteImage', 'removeImage'];
            methods.forEach(method => {
                console.log(`  ${method}:`, typeof this.imageManager[method]);
            });
        }
        
        console.groupEnd();
        
        return {
            hasImageManager: !!this.imageManager,
            hasOpenManagerForWord: !!(this.imageManager && typeof this.imageManager.openManagerForWord === 'function'),
            managerType: this.imageManager ? this.imageManager.constructor.name : 'none'
        };
    }
}

// ✅ GLOBAL DEBUG FUNCTION
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.testImageHandler = function() {
        const app = window.englishFlashcardsApp;
        if (app && app.managers.flashcard && app.managers.flashcard.renderer && app.managers.flashcard.renderer.imageHandler) {
            return app.managers.flashcard.renderer.imageHandler.testImageManagerConnection();
        } else {
            console.error('❌ Nie można znaleźć FlashcardImageHandler');
            return null;
        }
    };
}

// 🎯 EXPORT
export default FlashcardImageHandler;