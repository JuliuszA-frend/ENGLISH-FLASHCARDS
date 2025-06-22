/**
 * ImageManager - Zarządzanie obrazkami
 */
class ImageManager {
    constructor() {
        this.storageKey = 'english-flashcards-images';
        this.maxImageSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.compressionQuality = 0.8;
        this.maxDimensions = { width: 500, height: 500 };
    }

    /**
     * Zapisanie obrazka
     */
    async saveImage(wordId, file) {
        try {
            // Walidacja pliku
            if (!this.validateFile(file)) {
                return false;
            }

            // Kompresja obrazka
            const compressedImageData = await this.compressImage(file);
            
            // Zapis w localStorage
            const images = this.loadImages();
            images[wordId] = {
                data: compressedImageData,
                originalName: file.name,
                size: compressedImageData.length,
                timestamp: new Date().toISOString()
            };

            this.saveImages(images);
            return true;

        } catch (error) {
            console.error('Błąd zapisywania obrazka:', error);
            return false;
        }
    }

    /**
     * Pobranie obrazka
     */
    getImage(wordId) {
        const images = this.loadImages();
        const imageData = images[wordId];
        return imageData ? imageData.data : null;
    }

    /**
     * Usunięcie obrazka
     */
    deleteImage(wordId) {
        try {
            const images = this.loadImages();
            delete images[wordId];
            this.saveImages(images);
            return true;
        } catch (error) {
            console.error('Błąd usuwania obrazka:', error);
            return false;
        }
    }

    /**
     * Pobranie wszystkich obrazków
     */
    getAllImages() {
        return this.loadImages();
    }

    /**
     * Otwarcie menedżera dla konkretnego słowa
     */
    openManagerForWord(wordId, word) {
        const modal = document.getElementById('image-modal');
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('image-modal-content');

        if (!modal || !overlay || !content) return;

        // Zbuduj zawartość modala
        content.innerHTML = this.buildModalContent(wordId, word);
        
        // Skonfiguruj upload
        this.setupImageUpload(wordId, word);
        
        // Pokaż modal
        overlay.classList.add('visible');
        modal.classList.add('visible');
    }

    /**
     * Budowanie zawartości modala
     */
    buildModalContent(wordId, word) {
        const existingImage = this.getImage(wordId);
        
        return `
            <div class="image-manager-content">
                <h4>📷 Obrazek dla słowa</h4>
                <div class="word-info">
                    <strong>${word.english}</strong> → ${word.polish}
                </div>

                ${existingImage ? `
                    <div class="current-image">
                        <h5>Aktualny obrazek:</h5>
                        <img src="${existingImage}" alt="${word.polish}" class="current-image-preview">
                        <button class="btn danger" id="delete-current-image">
                            <span class="icon">🗑️</span>
                            <span class="text">Usuń obrazek</span>
                        </button>
                    </div>
                ` : ''}

                <div class="image-upload-section">
                    <h5>${existingImage ? 'Zmień obrazek:' : 'Dodaj obrazek:'}</h5>
                    
                    <div class="file-drop-zone" id="file-drop-zone">
                        <div class="drop-zone-content">
                            <div class="upload-icon">📁</div>
                            <p class="upload-text">Przeciągnij obrazek tutaj lub kliknij, aby wybrać</p>
                            <p class="upload-info">Obsługiwane formaty: JPG, PNG, GIF, WebP<br>Maksymalny rozmiar: 5MB</p>
                        </div>
                        <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                    </div>

                    <div id="image-preview-section" style="display: none;">
                        <h5>Podgląd:</h5>
                        <img id="image-preview" class="image-preview">
                        <div class="preview-actions">
                            <button class="btn success" id="save-image">
                                <span class="icon">💾</span>
                                <span class="text">Zapisz obrazek</span>
                            </button>
                            <button class="btn secondary" id="cancel-upload">
                                <span class="icon">❌</span>
                                <span class="text">Anuluj</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="image-tips">
                    <h5>💡 Wskazówki:</h5>
                    <ul>
                        <li>Używaj obrazków, które pomagają zapamiętać słowo</li>
                        <li>Preferuj wysoką jakość i czytelność</li>
                        <li>Obrazek zostanie automatycznie przeskalowany</li>
                        <li>Można używać zdjęć, ilustracji lub ikon</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Konfiguracja uploadu obrazków
     */
    setupImageUpload(wordId, word) {
        const dropZone = document.getElementById('file-drop-zone');
        const fileInput = document.getElementById('image-file-input');
        const previewSection = document.getElementById('image-preview-section');
        const preview = document.getElementById('image-preview');
        const saveBtn = document.getElementById('save-image');
        const cancelBtn = document.getElementById('cancel-upload');
        const deleteBtn = document.getElementById('delete-current-image');

        let selectedFile = null;

        // Drag & Drop
        if (dropZone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, this.preventDefaults);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'));
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'));
            });

            dropZone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelection(files[0]);
                }
            });

            dropZone.addEventListener('click', () => fileInput.click());
        }

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelection(e.target.files[0]);
                }
            });
        }

        // Buttons
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                if (selectedFile) {
                    const success = await this.saveImage(wordId, selectedFile);
                    if (success) {
                        NotificationManager.show('Obrazek został zapisany!', 'success');
                        this.closeModal();
                        // Odśwież kartę
                        if (window.englishFlashcardsApp) {
                            window.englishFlashcardsApp.updateCard();
                        }
                    } else {
                        NotificationManager.show('Błąd podczas zapisywania obrazka', 'error');
                    }
                }
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.resetUpload();
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Czy na pewno chcesz usunąć ten obrazek?')) {
                    if (this.deleteImage(wordId)) {
                        NotificationManager.show('Obrazek został usunięty', 'info');
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
                preview.src = e.target.result;
                previewSection.style.display = 'block';
                dropZone.style.display = 'none';
            };
            reader.readAsDataURL(file);
        };

        this.resetUpload = () => {
            selectedFile = null;
            previewSection.style.display = 'none';
            dropZone.style.display = 'block';
            fileInput.value = '';
        };
    }

    /**
     * Walidacja pliku
     */
    validateFile(file) {
        // Sprawdź typ
        if (!this.allowedTypes.includes(file.type)) {
            NotificationManager.show('Nieobsługiwany format pliku. Użyj JPG, PNG, GIF lub WebP.', 'error');
            return false;
        }

        // Sprawdź rozmiar
        if (file.size > this.maxImageSize) {
            NotificationManager.show('Plik jest za duży. Maksymalny rozmiar to 5MB.', 'error');
            return false;
        }

        return true;
    }

    /**
     * Kompresja obrazka
     */
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Oblicz nowe wymiary
                const { width, height } = this.calculateDimensions(
                    img.width, 
                    img.height, 
                    this.maxDimensions.width, 
                    this.maxDimensions.height
                );

                canvas.width = width;
                canvas.height = height;

                // Narysuj przeskalowany obrazek
                ctx.drawImage(img, 0, 0, width, height);

                // Konwertuj do base64
                const compressedData = canvas.toDataURL('image/jpeg', this.compressionQuality);
                resolve(compressedData);
            };

            img.onerror = () => {
                reject(new Error('Błąd ładowania obrazka'));
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Obliczanie nowych wymiarów zachowując proporcje
     */
    calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let { width, height } = { width: originalWidth, height: originalHeight };

        // Przeskaluj jeśli za duży
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        return { width, height };
    }

    /**
     * Zamknięcie modala
     */
    closeModal() {
        const modal = document.getElementById('image-modal');
        const overlay = document.getElementById('modal-overlay');
        
        if (modal) modal.classList.remove('visible');
        if (overlay) overlay.classList.remove('visible');
    }

    /**
     * Zapobieganie domyślnym akcjom drag & drop
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Statystyki obrazków
     */
    getImageStats() {
        const images = this.loadImages();
        const imageKeys = Object.keys(images);
        const totalSize = Object.values(images).reduce((sum, img) => sum + (img.size || 0), 0);

        return {
            count: imageKeys.length,
            totalSize: totalSize,
            averageSize: imageKeys.length > 0 ? Math.round(totalSize / imageKeys.length) : 0,
            oldestImage: this.getOldestImage(images),
            newestImage: this.getNewestImage(images)
        };
    }

    getOldestImage(images) {
        const entries = Object.entries(images);
        if (entries.length === 0) return null;

        return entries.reduce((oldest, [key, img]) => {
            const imgDate = new Date(img.timestamp || 0);
            const oldestDate = new Date(oldest.timestamp || 0);
            return imgDate < oldestDate ? img : oldest;
        }, entries[0][1]);
    }

    getNewestImage(images) {
        const entries = Object.entries(images);
        if (entries.length === 0) return null;

        return entries.reduce((newest, [key, img]) => {
            const imgDate = new Date(img.timestamp || 0);
            const newestDate = new Date(newest.timestamp || 0);
            return imgDate > newestDate ? img : newest;
        }, entries[0][1]);
    }

    /**
     * Czyszczenie starych obrazków
     */
    cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 dni
        const images = this.loadImages();
        const now = Date.now();
        let removedCount = 0;

        Object.entries(images).forEach(([key, img]) => {
            const imgAge = now - new Date(img.timestamp || 0).getTime();
            if (imgAge > maxAge) {
                delete images[key];
                removedCount++;
            }
        });

        if (removedCount > 0) {
            this.saveImages(images);
            console.log(`Usunięto ${removedCount} starych obrazków`);
        }

        return removedCount;
    }

    /**
     * Export/Import obrazków
     */
    exportImages() {
        return this.loadImages();
    }

    importImages(images) {
        if (typeof images === 'object' && images !== null) {
            this.saveImages(images);
            return true;
        }
        return false;
    }

    /**
     * Reset wszystkich obrazków
     */
    reset() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Storage methods
     */
    loadImages() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Błąd ładowania obrazków:', error);
            return {};
        }
    }

    saveImages(images) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(images));
        } catch (error) {
            console.error('Błąd zapisywania obrazków:', error);
            // Sprawdź czy to problem z miejscem
            if (error.name === 'QuotaExceededError') {
                NotificationManager.show('Brak miejsca na obrazki. Usuń stare obrazki.', 'error');
            }
            throw error;
        }
    }
}