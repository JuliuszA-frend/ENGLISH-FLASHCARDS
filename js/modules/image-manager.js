/**
 * ImageManager - Zarządzanie obrazkami dla słówek
 * UWAGA: Upewnij się, że ta klasa nie jest zdefiniowana nigdzie indziej!
 */
class ImageManager {
    constructor() {
        this.storageKey = 'english-flashcards-images';
        this.defaultImageSize = { width: 300, height: 200 };
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp'
        ];
        this.maxImageSize = 5 * 1024 * 1024; // 5MB
    }

    /**
     * Dodanie obrazka dla słówka
     */
    async addImage(wordId, file) {
        try {
            // Walidacja pliku
            this.validateImageFile(file);

            // Konwersja do base64
            const base64 = await this.fileToBase64(file);

            // Optymalizacja obrazka
            const optimizedImage = await this.optimizeImage(base64, file.type);

            // Zapisz obrazek
            const imageData = {
                id: wordId,
                data: optimizedImage,
                type: file.type,
                size: optimizedImage.length,
                timestamp: new Date().toISOString(),
                filename: file.name
            };

            this.saveImage(wordId, imageData);
            
            // Pokaż powiadomienie o sukcesie - BEZPIECZNE WYWOŁANIE
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Obrazek został dodany pomyślnie!', 'success');
            }

            return imageData;

        } catch (error) {
            console.error('Błąd dodawania obrazka:', error);
            
            // Pokaż powiadomienie o błędzie - BEZPIECZNE WYWOŁANIE
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Błąd dodawania obrazka: ' + error.message, 'error');
            }
            
            throw error;
        }
    }

    /**
     * Pobranie obrazka dla słówka
     */
    getImage(wordId) {
        const images = this.loadImages();
        return images[wordId] || null;
    }

    /**
     * Sprawdzenie czy słówko ma obrazek
     */
    hasImage(wordId) {
        const image = this.getImage(wordId);
        return image !== null;
    }

    /**
     * Usunięcie obrazka
     */
    removeImage(wordId) {
        const images = this.loadImages();
        
        if (images[wordId]) {
            delete images[wordId];
            this.saveImages(images);
            
            // BEZPIECZNE WYWOŁANIE
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Obrazek został usunięty', 'info');
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * Walidacja pliku obrazka
     */
    validateImageFile(file) {
        if (!file) {
            throw new Error('Nie wybrano pliku');
        }

        if (!this.supportedFormats.includes(file.type)) {
            throw new Error('Nieobsługiwany format pliku. Wybierz JPG, PNG, GIF lub WebP.');
        }

        if (file.size > this.maxFileSize) {
            throw new Error('Plik jest za duży. Maksymalny rozmiar to 5MB.');
        }
    }

    /**
     * Konwersja pliku do base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Optymalizacja obrazka
     */
    async optimizeImage(base64, type) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Oblicz nowe wymiary zachowując proporcje
                const maxWidth = this.defaultImageSize.width;
                const maxHeight = this.defaultImageSize.height;
                
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
                resolve(canvas.toDataURL(type, quality));
            };
            img.src = base64;
        });
    }

    /**
     * Zapisanie obrazka
     */
    saveImage(wordId, imageData) {
        const images = this.loadImages();
        images[wordId] = imageData;
        this.saveImages(images);
    }

    /**
     * Ładowanie wszystkich obrazków
     */
    loadImages() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Błąd ładowania obrazków:', error);
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
            console.error('Błąd zapisywania obrazków:', error);
            if (error.name === 'QuotaExceededError') {
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.show('Brak miejsca w pamięci przeglądarki', 'error');
                }
            }
        }
    }

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
     * Otwarcie managera obrazków dla słówka
     */
    openManagerForWord(wordId, word) {
        this.showImageModal(wordId, word);
    }

    /**
     * Pokazanie modala do zarządzania obrazkami
     */
    showImageModal(wordId, word) {
        // Usuń istniejący modal jeśli istnieje
        const existingModal = document.getElementById('image-manager-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Stwórz modal
        const modal = this.createImageModal(wordId, word);
        document.body.appendChild(modal);

        // Pokaż modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // Obsługa zamknięcia na ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Stworzenie modala
     */
    createImageModal(wordId, word) {
        const existingImage = this.getImage(wordId);
        
        const modal = document.createElement('div');
        modal.id = 'image-manager-modal';
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>🖼️ Zarządzaj obrazkiem</h3>
                    <button class="modal-close" onclick="window.imageManager?.closeModal()">&times;</button>
                </div>
                
                <div class="modal-content">
                    <div class="word-info">
                        <strong>${word.english}</strong> - ${word.polish}
                    </div>
                    
                    ${existingImage ? this.createExistingImageSection(existingImage) : ''}
                    
                    <div class="upload-section">
                        <div class="drop-zone" id="drop-zone">
                            <div class="drop-zone-content">
                                <div class="upload-icon">📷</div>
                                <p>Przeciągnij obrazek tutaj lub kliknij aby wybrać</p>
                                <p class="upload-hint">JPG, PNG, GIF, WebP (maks. 5MB)</p>
                            </div>
                            <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                        </div>
                        
                        <div class="preview-section" id="preview-section" style="display: none;">
                            <img id="image-preview" src="" alt="Podgląd">
                            <div class="preview-actions">
                                <button id="save-image-btn" class="btn btn-primary">Zapisz obrazek</button>
                                <button id="cancel-upload-btn" class="btn btn-secondary">Anuluj</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupImageModalEvents(modal, wordId);
        return modal;
    }

    /**
     * Stworzenie sekcji istniejącego obrazka
     */
    createExistingImageSection(imageData) {
        return `
            <div class="existing-image-section">
                <h4>Aktualny obrazek:</h4>
                <div class="current-image">
                    <img src="${imageData.data}" alt="Obecny obrazek">
                    <div class="image-actions">
                        <button id="delete-image-btn" class="btn btn-danger">🗑️ Usuń obrazek</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Konfiguracja event listenerów dla modala
     */
    setupImageModalEvents(modal, wordId) {
        const dropZone = modal.querySelector('#drop-zone');
        const fileInput = modal.querySelector('#image-file-input');
        const previewSection = modal.querySelector('#preview-section');
        const preview = modal.querySelector('#image-preview');
        const saveBtn = modal.querySelector('#save-image-btn');
        const cancelBtn = modal.querySelector('#cancel-upload-btn');
        const deleteBtn = modal.querySelector('#delete-image-btn');

        let selectedFile = null;

        // Event listeners dla drag & drop
        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelection(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelection(e.target.files[0]);
                }
            });
        }

        // Zapisywanie obrazka
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                if (selectedFile) {
                    try {
                        await this.addImage(wordId, selectedFile);
                        if (typeof NotificationManager !== 'undefined') {
                            NotificationManager.show('Obrazek został zapisany!', 'success');
                        }
                        this.closeModal();
                        // Odśwież kartę
                        if (window.englishFlashcardsApp) {
                            window.englishFlashcardsApp.updateCard();
                        }
                    } catch (error) {
                        if (typeof NotificationManager !== 'undefined') {
                            NotificationManager.show('Błąd podczas zapisywania obrazka', 'error');
                        }
                    }
                }
            });
        }

        // Anulowanie uploadu
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.resetUpload();
            });
        }

        // Usuwanie obrazka
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Czy na pewno chcesz usunąć ten obrazek?')) {
                    if (this.removeImage(wordId)) {
                        if (typeof NotificationManager !== 'undefined') {
                            NotificationManager.show('Obrazek został usunięty', 'info');
                        }
                        this.closeModal();
                        if (window.englishFlashcardsApp) {
                            window.englishFlashcardsApp.updateCard();
                        }
                    }
                }
            });
        }

        // Funkcje pomocnicze
        this.handleFileSelection = (file) => {
            if (!this.validateFile(file)) return;

            selectedFile = file;
            
            // Pokaż podgląd
            const reader = new FileReader();
            reader.onload = (e) => {
                if (preview && previewSection && dropZone) {
                    preview.src = e.target.result;
                    previewSection.style.display = 'block';
                    dropZone.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        };

        this.resetUpload = () => {
            selectedFile = null;
            if (previewSection && dropZone && fileInput) {
                previewSection.style.display = 'none';
                dropZone.style.display = 'block';
                fileInput.value = '';
            }
        };
    }

    /**
     * Walidacja pliku
     */
    validateFile(file) {
        // Sprawdź typ
        if (!this.allowedTypes.includes(file.type)) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Nieobsługiwany format pliku. Użyj JPG, PNG, GIF lub WebP.', 'error');
            }
            return false;
        }

        // Sprawdź rozmiar
        if (file.size > this.maxImageSize) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Plik jest za duży. Maksymalny rozmiar to 5MB.', 'error');
            }
            return false;
        }

        return true;
    }

    /**
     * Zamknięcie modala
     */
    closeModal() {
        const modal = document.getElementById('image-manager-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    /**
     * Usunięcie obrazka (alias dla removeImage)
     */
    deleteImage(wordId) {
        return this.removeImage(wordId);
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
    }
}

// Dodaj referencję globalną dla łatwiejszego dostępu
if (typeof window !== 'undefined') {
    window.imageManager = new ImageManager();
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageManager;
}

// In image-manager.js, at the very end
if (typeof window !== 'undefined') {
    if (!window.ImageManager) {
        window.ImageManager = ImageManager;
        console.log('✅ ImageManager załadowany i dostępny globalnie');
    } else {
        console.warn('⚠️ ImageManager już istnieje w obiekcie window. Możliwa podwójna deklaracja.');
    }
}