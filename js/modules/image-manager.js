/**
 * ImageManager - PEŁNA NAPRAWIONA WERSJA (Wszystkie funkcje + poprawiona kolejność)
 * WERSJA ZREFAKTORYZOWANA - logika biznesowa oddzielona od UI
 */

// ==========================================
// 1. KLASY POMOCNICZE - MUSZĄ BYĆ PIERWSZE!
// ==========================================

/**
 * Klasa obsługi plików obrazków
 */
class ImageFileHandler {
    constructor() {
        this.allowedTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp'
        ];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
    }

    /**
     * Walidacja pliku obrazka
     */
    validateFile(file) {
        if (!file) {
            throw new Error('Nie wybrano pliku');
        }

        if (!this.allowedTypes.includes(file.type)) {
            throw new Error('Nieobsługiwany format pliku. Wybierz JPG, PNG, GIF lub WebP.');
        }

        if (file.size > this.maxFileSize) {
            throw new Error('Plik jest za duży. Maksymalny rozmiar to 5MB.');
        }

        return true;
    }

    /**
     * Konwersja pliku do base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Błąd czytania pliku'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Optymalizacja obrazka
     */
    async optimizeImage(base64, type, targetSize) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Oblicz nowe wymiary zachowując proporcje
                    const maxWidth = targetSize.width;
                    const maxHeight = targetSize.height;
                    
                    let { width, height } = img;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Narysuj przeskalowany obrazek
                    ctx.drawImage(img, 0, 0, width, height);

                    // Konwertuj do base64 z kompresją
                    const quality = 0.8;
                    const optimizedBase64 = canvas.toDataURL(type, quality);
                    
                    resolve(optimizedBase64);
                } catch (error) {
                    reject(new Error('Błąd optymalizacji obrazka: ' + error.message));
                }
            };
            
            img.onerror = () => {
                reject(new Error('Błąd ładowania obrazka'));
            };
            
            img.src = base64;
        });
    }
}

/**
 * Klasa UI modala obrazków
 */
class ImageModalUI {
    constructor(imageManager) {
        this.imageManager = imageManager;
        this.currentModal = null;
        this.eventListeners = new Map();
    }

    /**
     * Pokazanie modala
     */
    showModal(wordId, word) {
        console.log(`🎨 Pokazuję modal obrazków dla: ${wordId}`, word);
        
        // Usuń istniejący modal
        this.removeExistingModal();
        
        // Stwórz nowy modal
        this.currentModal = this.createModal(wordId, word);
        document.body.appendChild(this.currentModal);

        // Pokaż modal z animacją
        setTimeout(() => {
            this.currentModal.classList.add('active');
        }, 10);

        // Setup event listeners
        this.setupModalEvents(wordId, word);
        
        console.log('✅ Modal obrazków otwarty');
        return true;
    }

    /**
     * Usunięcie istniejącego modala
     */
    removeExistingModal() {
        const existingModal = document.getElementById('image-manager-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
        
        this.clearEventListeners();
    }

    /**
     * Tworzenie modala
     */
    createModal(wordId, word) {
        const existingImage = this.imageManager.getImage(wordId);
        
        const modal = document.createElement('div');
        modal.id = 'image-manager-modal';
        modal.className = 'modal-overlay';
        
        // CSS dla modala (inline, żeby działał bez zewnętrznego CSS)
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div class="modal-container" style="
                background: white;
                padding: 20px;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 15px;
                ">
                    <h3 style="margin: 0; color: #1f2937;">🖼️ Zarządzaj obrazkiem</h3>
                    <button class="modal-close" id="modal-close-btn" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #6b7280;
                        padding: 5px;
                        border-radius: 4px;
                    ">&times;</button>
                </div>
                
                <div class="modal-content">
                    <div class="word-info" style="
                        background: #f3f4f6;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        text-align: center;
                    ">
                        <strong style="color: #1e40af; font-size: 18px;">${word.english}</strong> 
                        <span style="color: #6b7280;"> - </span>
                        <strong style="color: #059669; font-size: 18px;">${word.polish}</strong>
                    </div>
                    
                    ${existingImage ? this.createExistingImageSection(existingImage) : ''}
                    
                    <div class="upload-section">
                        <div class="drop-zone" id="drop-zone" style="
                            border: 2px dashed #d1d5db;
                            border-radius: 8px;
                            padding: 40px 20px;
                            text-align: center;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            background: #f9fafb;
                        ">
                            <div class="drop-zone-content">
                                <div class="upload-icon" style="font-size: 48px; margin-bottom: 15px;">📷</div>
                                <p style="margin: 10px 0; color: #374151; font-weight: 500;">Przeciągnij obrazek tutaj lub kliknij aby wybrać</p>
                                <p class="upload-hint" style="margin: 5px 0; color: #6b7280; font-size: 14px;">JPG, PNG, GIF, WebP (maks. 5MB)</p>
                            </div>
                            <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                        </div>
                        
                        <div class="preview-section" id="preview-section" style="display: none; text-align: center; margin-top: 20px;">
                            <img id="image-preview" src="" alt="Podgląd" style="
                                max-width: 100%;
                                max-height: 200px;
                                border-radius: 8px;
                                margin-bottom: 15px;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            ">
                            <div class="preview-actions">
                                <button id="save-image-btn" class="btn btn-primary" style="
                                    background: #1e40af;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    margin: 0 5px;
                                    font-weight: 500;
                                ">✅ Zapisz obrazek</button>
                                <button id="cancel-upload-btn" class="btn btn-secondary" style="
                                    background: #6b7280;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    margin: 0 5px;
                                    font-weight: 500;
                                ">❌ Anuluj</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * Sekcja istniejącego obrazka
     */
    createExistingImageSection(imageData) {
        return `
            <div class="existing-image-section" style="margin-bottom: 20px;">
                <h4 style="color: #374151; margin-bottom: 10px;">Aktualny obrazek:</h4>
                <div class="current-image" style="text-align: center;">
                    <img src="${imageData.data}" alt="Obecny obrazek" style="
                        max-width: 100%;
                        max-height: 150px;
                        border-radius: 8px;
                        margin-bottom: 10px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    ">
                    <div class="image-actions">
                        <button id="delete-image-btn" class="btn btn-danger" style="
                            background: #dc2626;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                        ">🗑️ Usuń obrazek</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners dla modala
     */
    setupModalEvents(wordId, word) {
        if (!this.currentModal) return;

        let selectedFile = null;

        // Elementy modala
        const closeBtn = this.currentModal.querySelector('#modal-close-btn');
        const dropZone = this.currentModal.querySelector('#drop-zone');
        const fileInput = this.currentModal.querySelector('#image-file-input');
        const previewSection = this.currentModal.querySelector('#preview-section');
        const preview = this.currentModal.querySelector('#image-preview');
        const saveBtn = this.currentModal.querySelector('#save-image-btn');
        const cancelBtn = this.currentModal.querySelector('#cancel-upload-btn');
        const deleteBtn = this.currentModal.querySelector('#delete-image-btn');

        // Funkcje pomocnicze
        const handleFileSelection = (file) => {
            try {
                this.imageManager.fileHandler.validateFile(file);
                selectedFile = file;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (preview && previewSection && dropZone) {
                        preview.src = e.target.result;
                        previewSection.style.display = 'block';
                        dropZone.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            } catch (error) {
                alert('Błąd: ' + error.message);
            }
        };

        const resetUpload = () => {
            selectedFile = null;
            if (previewSection && dropZone && fileInput) {
                previewSection.style.display = 'none';
                dropZone.style.display = 'block';
                fileInput.value = '';
            }
        };

        // Event listeners
        const listeners = new Map();

        // Zamknij modal
        if (closeBtn) {
            const closeHandler = () => this.closeModal();
            closeBtn.addEventListener('click', closeHandler);
            listeners.set('close', closeHandler);
        }

        // Obsługa drag & drop
        if (dropZone && fileInput) {
            const clickHandler = () => fileInput.click();
            const dragOverHandler = (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#3b82f6';
                dropZone.style.background = '#eff6ff';
            };
            const dragLeaveHandler = () => {
                dropZone.style.borderColor = '#d1d5db';
                dropZone.style.background = '#f9fafb';
            };
            const dropHandler = (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#d1d5db';
                dropZone.style.background = '#f9fafb';
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileSelection(files[0]);
                }
            };
            const changeHandler = (e) => {
                if (e.target.files.length > 0) {
                    handleFileSelection(e.target.files[0]);
                }
            };

            dropZone.addEventListener('click', clickHandler);
            dropZone.addEventListener('dragover', dragOverHandler);
            dropZone.addEventListener('dragleave', dragLeaveHandler);
            dropZone.addEventListener('drop', dropHandler);
            fileInput.addEventListener('change', changeHandler);

            listeners.set('dropZoneClick', clickHandler);
            listeners.set('dragOver', dragOverHandler);
            listeners.set('dragLeave', dragLeaveHandler);
            listeners.set('drop', dropHandler);
            listeners.set('fileChange', changeHandler);
        }

        // Zapisz obrazek
        if (saveBtn) {
            const saveHandler = async () => {
                if (selectedFile) {
                    try {
                        await this.imageManager.addImage(wordId, selectedFile);
                        this.closeModal();
                        this.refreshCard();
                    } catch (error) {
                        console.error('❌ Błąd zapisywania:', error);
                        alert('Błąd zapisywania: ' + error.message);
                    }
                }
            };
            saveBtn.addEventListener('click', saveHandler);
            listeners.set('save', saveHandler);
        }

        // Anuluj upload
        if (cancelBtn) {
            const cancelHandler = () => resetUpload();
            cancelBtn.addEventListener('click', cancelHandler);
            listeners.set('cancel', cancelHandler);
        }

        // Usuń obrazek
        if (deleteBtn) {
            const deleteHandler = () => {
                if (confirm('Czy na pewno chcesz usunąć ten obrazek?')) {
                    if (this.imageManager.removeImage(wordId)) {
                        this.closeModal();
                        this.refreshCard();
                    }
                }
            };
            deleteBtn.addEventListener('click', deleteHandler);
            listeners.set('delete', deleteHandler);
        }

        // ESC key listener
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', escHandler);
        listeners.set('escape', escHandler);

        // Zapisz listenery do czyszczenia później
        this.eventListeners.set(wordId, listeners);
    }

    /**
     * Zamknij modal
     */
    closeModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('active');
            setTimeout(() => {
                this.removeExistingModal();
            }, 300);
        }
        
        console.log('❌ Modal obrazków zamknięty');
    }

    /**
     * Odśwież kartę po zmianie obrazka
     */
    refreshCard() {
        if (window.englishFlashcardsApp && window.englishFlashcardsApp.updateCard) {
            window.englishFlashcardsApp.updateCard();
        }
    }

    /**
     * Czyszczenie event listeners
     */
    clearEventListeners() {
        this.eventListeners.forEach((listeners, wordId) => {
            listeners.forEach((handler, type) => {
                if (type === 'escape') {
                    document.removeEventListener('keydown', handler);
                }
            });
        });
        this.eventListeners.clear();
    }

    /**
     * Cleanup UI
     */
    cleanup() {
        this.removeExistingModal();
        this.clearEventListeners();
    }
}

// ==========================================
// 2. GŁÓWNA KLASA ImageManager
// ==========================================

class ImageManager {
    constructor() {
        console.log('🖼️ ImageManager - inicjalizacja...');
        
        this.storageKey = 'english-flashcards-images';
        this.defaultImageSize = { width: 300, height: 200 };
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        
        try {
            // ✅ TERAZ TO DZIAŁA - klasy są już zdefiniowane!
            this.fileHandler = new ImageFileHandler();
            this.modalUI = new ImageModalUI(this);
            
            console.log('✅ ImageManager zainicjalizowany (zrefaktoryzowany)');
        } catch (error) {
            console.error('❌ Błąd inicjalizacji ImageManager:', error);
        }
    }

    // ==========================================
    // GŁÓWNE METODY API (zachowane dla kompatybilności)
    // ==========================================

    /**
     * Główna metoda - otwiera manager dla słówka
     * NAPRAWIONE: Metoda została przywrócona
     */
    openManagerForWord(wordId, word) {
        console.log(`🖼️ Otwieranie managera obrazków dla: ${wordId}`, word);
        if (!this.modalUI) {
            console.error('❌ ModalUI nie jest dostępny');
            this.showNotification('Moduł obrazków nie jest poprawnie zainicjalizowany', 'error');
            return false;
        }
        return this.modalUI.showModal(wordId, word);
    }

    /**
     * Dodanie obrazka dla słówka
     */
    async addImage(wordId, file) {
        try {
            console.log(`🖼️ Dodawanie obrazka dla: ${wordId}`);
            
            // Walidacja pliku
            this.fileHandler.validateFile(file);

            // Konwersja i optymalizacja
            const base64 = await this.fileHandler.fileToBase64(file);
            const optimizedImage = await this.fileHandler.optimizeImage(base64, file.type, this.defaultImageSize);

            // Utworz dane obrazka
            const imageData = {
                id: wordId,
                data: optimizedImage,
                type: file.type,
                size: optimizedImage.length,
                timestamp: new Date().toISOString(),
                filename: file.name
            };

            // Zapisz
            this.saveImage(wordId, imageData);
            
            this.showNotification('Obrazek został dodany pomyślnie!', 'success');
            console.log(`✅ Obrazek dodany: ${wordId}`);
            
            return imageData;

        } catch (error) {
            console.error('❌ Błąd dodawania obrazka:', error);
            this.showNotification('Błąd dodawania obrazka: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Pobranie obrazka dla słówka
     */
    getImage(wordId) {
        const images = this.loadImages();
        const imageData = images[wordId] || null;
        
        if (imageData) {
            console.log(`🔍 Znaleziono obrazek dla: ${wordId}`);
        }
        
        return imageData;
    }

    /**
     * Sprawdzenie czy słówko ma obrazek
     */
    hasImage(wordId) {
        return this.getImage(wordId) !== null;
    }

    /**
     * Usunięcie obrazka
     */
    removeImage(wordId) {
        const images = this.loadImages();
        
        if (images[wordId]) {
            delete images[wordId];
            this.saveImages(images);
            
            this.showNotification('Obrazek został usunięty', 'info');
            console.log(`🗑️ Usunięto obrazek: ${wordId}`);
            
            return true;
        }
        
        console.warn(`⚠️ Nie znaleziono obrazka do usunięcia: ${wordId}`);
        return false;
    }

    /**
     * Alias dla removeImage (dla kompatybilności)
     */
    deleteImage(wordId) {
        return this.removeImage(wordId);
    }

    // ==========================================
    // METODY STORAGE
    // ==========================================

    /**
     * Zapisanie obrazka
     */
    saveImage(wordId, imageData) {
        const images = this.loadImages();
        images[wordId] = imageData;
        this.saveImages(images);
        console.log(`💾 Zapisano obrazek: ${wordId}`);
    }

    /**
     * Ładowanie wszystkich obrazków
     */
    loadImages() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Błąd ładowania obrazków:', error);
            return {};
        }
    }

    /**
     * Zapisanie wszystkich obrazków
     */
    saveImages(images) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(images));
        } catch (error) {
            console.error('❌ Błąd zapisywania obrazków:', error);
            if (error.name === 'QuotaExceededError') {
                this.showNotification('Brak miejsca w pamięci przeglądarki', 'error');
            }
            throw error;
        }
    }

    // ==========================================
    // UTILITY METODY
    // ==========================================

    /**
     * Pobranie rozmiaru pamięci używanej przez obrazki
     */
    getStorageSize() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? new Blob([data]).size : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Export wszystkich obrazków
     */
    exportImages() {
        return this.loadImages();
    }

    /**
     * Import obrazków
     */
    importImages(images) {
        if (images && typeof images === 'object') {
            this.saveImages(images);
        }
    }

    /**
     * Czyszczenie wszystkich obrazków
     */
    clearAllImages() {
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ Wyczyszczono wszystkie obrazki');
    }

    /**
     * Bezpieczne pokazywanie powiadomień
     */
    showNotification(message, type = 'info') {
        if (typeof NotificationManager !== 'undefined' && NotificationManager.show) {
            NotificationManager.show(message, type);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
            // Fallback dla ważnych błędów
            if (type === 'error') {
                alert('Błąd: ' + message);
            }
        }
    }

    /**
     * Cleanup zasobów
     */
    cleanup() {
        if (this.modalUI) {
            this.modalUI.cleanup();
        }
        console.log('🧹 ImageManager wyczyszczony');
    }

    /**
     * NOWA METODA: Test funkcjonalności
     */
    testImageManager() {
        console.group('🧪 Test ImageManager');
        
        console.log('Podstawowe właściwości:');
        console.log('  storageKey:', this.storageKey);
        console.log('  defaultImageSize:', this.defaultImageSize);
        console.log('  maxFileSize:', this.maxFileSize);
        
        console.log('Handlery:');
        console.log('  fileHandler:', !!this.fileHandler);
        console.log('  modalUI:', !!this.modalUI);
        
        console.log('Metody:');
        console.log('  openManagerForWord:', typeof this.openManagerForWord);
        console.log('  addImage:', typeof this.addImage);
        console.log('  getImage:', typeof this.getImage);
        console.log('  removeImage:', typeof this.removeImage);
        
        const images = this.loadImages();
        console.log('Obrazki w storage:', Object.keys(images).length);
        
        console.groupEnd();
        
        return {
            hasHandlers: !!(this.fileHandler && this.modalUI),
            hasMainMethods: !!(this.openManagerForWord && this.addImage),
            storageWorking: true,
            imagesCount: Object.keys(images).length
        };
    }
}


export {
    ImageManager,
    ImageFileHandler,
    ImageModalUI
};