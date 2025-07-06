/**
 * ImageModalUI - Interfejs użytkownika modala obrazków
 * Obsługa wyświetlania, interakcji i zamykania modala
 */

export class ImageModalUI {
    constructor(imageManager) {
        this.imageManager = imageManager;
        this.currentModal = null;
        this.eventListeners = new Map();
        
        console.log('🎨 ImageModalUI zainicjalizowany');
    }

    /**
     * Pokazanie modala dla konkretnego słowa
     * @param {string} wordId - ID słowa
     * @param {Object} word - Obiekt słowa {english, polish}
     * @returns {boolean} - Czy modal został pomyślnie otwarty
     */
    showModal(wordId, word) {
        console.log(`🎨 Pokazuję modal obrazków dla: ${wordId}`, word);
        
        // Usuń istniejący modal jeśli istnieje
        this.removeExistingModal();
        
        // Stwórz nowy modal
        this.currentModal = this.createModal(wordId, word);
        if (!this.currentModal) {
            console.error('❌ Nie udało się utworzyć modala');
            return false;
        }
        
        // Dodaj do DOM
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
     * Usunięcie istniejącego modala z DOM
     */
    removeExistingModal() {
        // Usuń modal po ID jeśli istnieje
        const existingModal = document.getElementById('image-manager-modal');
        if (existingModal) {
            existingModal.remove();
            console.log('🗑️ Usunięto istniejący modal po ID');
        }
        
        // Usuń current modal jeśli istnieje
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
            console.log('🗑️ Usunięto current modal');
        }
        
        // Wyczyść event listeners
        this.clearEventListeners();
    }

    /**
     * Tworzenie struktury HTML modala
     * @param {string} wordId - ID słowa
     * @param {Object} word - Obiekt słowa
     * @returns {HTMLElement} - Element modala
     */
    createModal(wordId, word) {
        const existingImage = this.imageManager.getImage(wordId);
        
        const modal = document.createElement('div');
        modal.id = 'image-manager-modal';
        modal.className = 'modal-overlay image-modal-overlay';
        
        // Inline styles dla niezależności od external CSS
        this.applyModalStyles(modal);
        
        modal.innerHTML = this.getModalHTML(word, existingImage);

        return modal;
    }

    /**
     * Zastosowanie stylów CSS do modala
     * @param {HTMLElement} modal - Element modala
     */
    applyModalStyles(modal) {
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
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Klasa active dla animacji
        const style = document.createElement('style');
        style.textContent = `
            .image-modal-overlay.active {
                opacity: 1 !important;
            }
            .image-modal-overlay .modal-container {
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            .image-modal-overlay.active .modal-container {
                transform: scale(1);
            }
        `;
        
        if (!document.querySelector('#image-modal-styles')) {
            style.id = 'image-modal-styles';
            document.head.appendChild(style);
        }
    }

    /**
     * Generowanie HTML modala
     * @param {Object} word - Obiekt słowa
     * @param {Object|null} existingImage - Istniejący obrazek lub null
     * @returns {string} - HTML modala
     */
    getModalHTML(word, existingImage) {
        return `
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
                ${this.getModalHeader()}
                
                <div class="modal-content">
                    ${this.getWordInfoSection(word)}
                    ${existingImage ? this.createExistingImageSection(existingImage) : ''}
                    ${this.getUploadSection()}
                </div>
            </div>
        `;
    }

    /**
     * Generowanie nagłówka modala
     * @returns {string} - HTML nagłówka
     */
    getModalHeader() {
        return `
            <div class="modal-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 15px;
            ">
                <h3 style="margin: 0; color: #1f2937; font-family: system-ui, sans-serif;">
                    🖼️ Zarządzaj obrazkiem
                </h3>
                <button class="modal-close" id="modal-close-btn" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 5px;
                    border-radius: 4px;
                    transition: color 0.2s ease;
                " 
                onmouseover="this.style.color='#374151'" 
                onmouseout="this.style.color='#6b7280'"
                title="Zamknij modal">&times;</button>
            </div>
        `;
    }

    /**
     * Sekcja informacji o słowie
     * @param {Object} word - Obiekt słowa
     * @returns {string} - HTML sekcji
     */
    getWordInfoSection(word) {
        return `
            <div class="word-info" style="
                background: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                text-align: center;
                font-family: system-ui, sans-serif;
            ">
                <strong style="color: #1e40af; font-size: 18px;">${word.english}</strong> 
                <span style="color: #6b7280; font-size: 16px;"> - </span>
                <strong style="color: #059669; font-size: 18px;">${word.polish}</strong>
            </div>
        `;
    }

    /**
     * Sekcja istniejącego obrazka
     * @param {Object} imageData - Dane istniejącego obrazka
     * @returns {string} - HTML sekcji
     */
    createExistingImageSection(imageData) {
        return `
            <div class="existing-image-section" style="margin-bottom: 20px;">
                <h4 style="color: #374151; margin-bottom: 10px; font-family: system-ui, sans-serif;">
                    Aktualny obrazek:
                </h4>
                <div class="current-image" style="text-align: center;">
                    <img src="${imageData.data}" alt="Obecny obrazek" style="
                        max-width: 100%;
                        max-height: 150px;
                        border-radius: 8px;
                        margin-bottom: 10px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    ">
                    <div class="image-info" style="
                        font-size: 12px;
                        color: #6b7280;
                        margin-bottom: 10px;
                        font-family: system-ui, sans-serif;
                    ">
                        ${imageData.filename || 'Obrazek'} • ${this.formatImageSize(imageData)}
                    </div>
                    <div class="image-actions">
                        <button id="delete-image-btn" class="btn btn-danger" style="
                            background: #dc2626;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                            font-family: system-ui, sans-serif;
                            transition: background-color 0.2s ease;
                        " 
                        onmouseover="this.style.backgroundColor='#b91c1c'" 
                        onmouseout="this.style.backgroundColor='#dc2626'"
                        title="Usuń obrazek">
                            🗑️ Usuń obrazek
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Sekcja uploadu nowego obrazka
     * @returns {string} - HTML sekcji upload
     */
    getUploadSection() {
        return `
            <div class="upload-section">
                <div class="drop-zone" id="drop-zone" style="
                    border: 2px dashed #d1d5db;
                    border-radius: 8px;
                    padding: 40px 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: #f9fafb;
                    font-family: system-ui, sans-serif;
                ">
                    <div class="drop-zone-content">
                        <div class="upload-icon" style="font-size: 48px; margin-bottom: 15px;">📷</div>
                        <p style="margin: 10px 0; color: #374151; font-weight: 500;">
                            Przeciągnij obrazek tutaj lub kliknij aby wybrać
                        </p>
                        <p class="upload-hint" style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                            JPG, PNG, GIF, WebP (maks. 5MB)
                        </p>
                    </div>
                    <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                </div>
                
                ${this.getPreviewSection()}
            </div>
        `;
    }

    /**
     * Sekcja podglądu wybranego obrazka
     * @returns {string} - HTML sekcji preview
     */
    getPreviewSection() {
        return `
            <div class="preview-section" id="preview-section" style="
                display: none; 
                text-align: center; 
                margin-top: 20px;
                font-family: system-ui, sans-serif;
            ">
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
                        transition: background-color 0.2s ease;
                    " 
                    onmouseover="this.style.backgroundColor='#1d4ed8'" 
                    onmouseout="this.style.backgroundColor='#1e40af'">
                        ✅ Zapisz obrazek
                    </button>
                    <button id="cancel-upload-btn" class="btn btn-secondary" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin: 0 5px;
                        font-weight: 500;
                        transition: background-color 0.2s ease;
                    " 
                    onmouseover="this.style.backgroundColor='#4b5563'" 
                    onmouseout="this.style.backgroundColor='#6b7280'">
                        ❌ Anuluj
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Konfiguracja event listeners dla modala
     * @param {string} wordId - ID słowa
     * @param {Object} word - Obiekt słowa
     */
    setupModalEvents(wordId, word) {
        if (!this.currentModal) {
            console.error('❌ Brak currentModal do setup events');
            return;
        }

        let selectedFile = null;

        // Pobierz elementy modala
        const elements = this.getModalElements();
        
        // Funkcje pomocnicze
        const handleFileSelection = (file) => this.handleFileSelection(file, elements, (f) => selectedFile = f);
        const resetUpload = () => this.resetUpload(elements, () => selectedFile = null);

        // Mapa event listeners dla łatwego czyszczenia
        const listeners = new Map();

        // Setup poszczególnych event listeners
        this.setupCloseEvents(elements, listeners);
        this.setupDragDropEvents(elements, listeners, handleFileSelection);
        this.setupActionEvents(elements, listeners, wordId, selectedFile, resetUpload);
        this.setupKeyboardEvents(listeners);

        // Zapisz listeners do czyszczenia później
        this.eventListeners.set(wordId, listeners);
        
        console.log(`🎯 Event listeners skonfigurowane dla ${wordId}`);
    }

    /**
     * Pobranie elementów modala
     * @returns {Object} - Obiekt z elementami modala
     */
    getModalElements() {
        return {
            closeBtn: this.currentModal.querySelector('#modal-close-btn'),
            dropZone: this.currentModal.querySelector('#drop-zone'),
            fileInput: this.currentModal.querySelector('#image-file-input'),
            previewSection: this.currentModal.querySelector('#preview-section'),
            preview: this.currentModal.querySelector('#image-preview'),
            saveBtn: this.currentModal.querySelector('#save-image-btn'),
            cancelBtn: this.currentModal.querySelector('#cancel-upload-btn'),
            deleteBtn: this.currentModal.querySelector('#delete-image-btn')
        };
    }

    /**
     * Setup event listeners dla zamykania modala
     */
    setupCloseEvents(elements, listeners) {
        if (elements.closeBtn) {
            const closeHandler = () => this.closeModal();
            elements.closeBtn.addEventListener('click', closeHandler);
            listeners.set('close', closeHandler);
        }
    }

    /**
     * Setup event listeners dla drag & drop
     */
    setupDragDropEvents(elements, listeners, handleFileSelection) {
        const { dropZone, fileInput } = elements;
        
        if (!dropZone || !fileInput) return;

        const handlers = {
            click: () => fileInput.click(),
            dragover: (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#3b82f6';
                dropZone.style.background = '#eff6ff';
            },
            dragleave: () => {
                dropZone.style.borderColor = '#d1d5db';
                dropZone.style.background = '#f9fafb';
            },
            drop: (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#d1d5db';
                dropZone.style.background = '#f9fafb';
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileSelection(files[0]);
                }
            },
            change: (e) => {
                if (e.target.files.length > 0) {
                    handleFileSelection(e.target.files[0]);
                }
            }
        };

        // Dodaj event listeners
        Object.entries(handlers).forEach(([event, handler]) => {
            const element = event === 'change' ? fileInput : dropZone;
            element.addEventListener(event, handler);
            listeners.set(`dropZone${event}`, handler);
        });
    }

    /**
     * Setup event listeners dla akcji (save, cancel, delete)
     */
    setupActionEvents(elements, listeners, wordId, selectedFile, resetUpload) {
        const { saveBtn, cancelBtn, deleteBtn } = elements;

        // Zapisz obrazek
        if (saveBtn) {
            const saveHandler = async () => {
                // Pobierz aktualny selectedFile (może się zmienić)
                const fileInput = this.currentModal.querySelector('#image-file-input');
                const currentFile = fileInput?.files[0] || selectedFile;
                
                if (currentFile) {
                    try {
                        await this.imageManager.addImage(wordId, currentFile);
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
    }

    /**
     * Setup event listeners dla klawiatury
     */
    setupKeyboardEvents(listeners) {
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', escHandler);
        listeners.set('escape', escHandler);
    }

    /**
     * Obsługa wyboru pliku
     */
    handleFileSelection(file, elements, setSelectedFile) {
        try {
            this.imageManager.fileHandler.validateFile(file);
            setSelectedFile(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                if (elements.preview && elements.previewSection && elements.dropZone) {
                    elements.preview.src = e.target.result;
                    elements.previewSection.style.display = 'block';
                    elements.dropZone.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
            
            console.log(`📁 Plik wybrany: ${file.name}`);
        } catch (error) {
            console.error('❌ Błąd wyboru pliku:', error);
            alert('Błąd: ' + error.message);
        }
    }

    /**
     * Reset procesu uploadu
     */
    resetUpload(elements, setSelectedFile) {
        setSelectedFile(null);
        
        if (elements.previewSection && elements.dropZone && elements.fileInput) {
            elements.previewSection.style.display = 'none';
            elements.dropZone.style.display = 'block';
            elements.fileInput.value = '';
        }
        
        console.log('🔄 Upload zresetowany');
    }

    /**
     * Zamknij modal z animacją
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
            console.log('🔄 Karta odświeżona po zmianie obrazka');
        }
    }

    /**
     * Formatowanie rozmiaru obrazka dla wyświetlania
     */
    formatImageSize(imageData) {
        if (imageData.size) {
            const kb = Math.round(imageData.size / 1024);
            return `${kb} KB`;
        }
        return '';
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
                // Inne listenery są automatycznie usuwane z DOM
            });
        });
        this.eventListeners.clear();
        
        console.log('🧹 Event listeners wyczyszczone');
    }

    /**
     * Cleanup UI - czyszczenie zasobów
     */
    cleanup() {
        this.removeExistingModal();
        this.clearEventListeners();
        
        // Usuń dynamiczne style
        const styles = document.querySelector('#image-modal-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('🧹 ImageModalUI wyczyszczony');
    }
}