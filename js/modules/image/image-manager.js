/**
 * ImageManager - Główna klasa zarządzania obrazkami (REFAKTORYZOWANA)
 * Łączy FileHandler i ModalUI w jeden spójny system
 */

import { ImageFileHandler } from './file-handler.js';
import { ImageModalUI } from './modal-ui.js';

export class ImageManager {
    constructor() {
        console.log('🖼️ ImageManager - inicjalizacja (refaktoryzowana wersja)...');
        
        // Konfiguracja
        this.storageKey = 'english-flashcards-images';
        this.defaultImageSize = { width: 300, height: 200 };
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        
        // Inicjalizacja komponentów
        this.initializeComponents();
        
        console.log('✅ ImageManager zainicjalizowany (modularny)');
    }

    /**
     * Inicjalizacja komponentów modułu
     */
    initializeComponents() {
        try {
            // Inicjalizuj handler plików
            this.fileHandler = new ImageFileHandler();
            console.log('📁 FileHandler zainicjalizowany');
            
            // Inicjalizuj UI modala
            this.modalUI = new ImageModalUI(this);
            console.log('🎨 ModalUI zainicjalizowany');
            
            // Sprawdź czy wszystko działa
            this.validateComponents();
            
        } catch (error) {
            console.error('❌ Błąd inicjalizacji komponentów ImageManager:', error);
            throw error;
        }
    }

    /**
     * Walidacja poprawności komponentów
     */
    validateComponents() {
        if (!this.fileHandler) {
            throw new Error('FileHandler nie został zainicjalizowany');
        }
        
        if (!this.modalUI) {
            throw new Error('ModalUI nie został zainicjalizowany');
        }
        
        if (typeof this.fileHandler.validateFile !== 'function') {
            throw new Error('FileHandler nie ma metody validateFile');
        }
        
        if (typeof this.modalUI.showModal !== 'function') {
            throw new Error('ModalUI nie ma metody showModal');
        }
        
        console.log('✅ Wszystkie komponenty zwalidowane');
    }

    // ==========================================
    // GŁÓWNE METODY API
    // ==========================================

    /**
     * Główna metoda - otwiera manager dla słówka
     * @param {string} wordId - Unikalny identyfikator słowa
     * @param {Object} word - Obiekt słowa {english, polish}
     * @returns {boolean} - Czy modal został pomyślnie otwarty
     */
    openManagerForWord(wordId, word) {
        console.log(`🖼️ Otwieranie managera obrazków dla: ${wordId}`, word);
        
        if (!this.modalUI) {
            console.error('❌ ModalUI nie jest dostępny');
            this.showNotification('Moduł obrazków nie jest poprawnie zainicjalizowany', 'error');
            return false;
        }

        if (!wordId || !word) {
            console.error('❌ Nieprawidłowe parametry: wordId lub word');
            this.showNotification('Błędne dane słowa', 'error');
            return false;
        }

        try {
            return this.modalUI.showModal(wordId, word);
        } catch (error) {
            console.error('❌ Błąd otwierania modala:', error);
            this.showNotification('Błąd otwierania modala obrazków', 'error');
            return false;
        }
    }

    /**
     * Dodanie obrazka dla słówka
     * @param {string} wordId - ID słowa
     * @param {File} file - Plik obrazka
     * @returns {Promise<Object>} - Dane zapisanego obrazka
     */
    async addImage(wordId, file) {
        try {
            console.log(`🖼️ Dodawanie obrazka dla: ${wordId}`);
            
            if (!wordId || !file) {
                throw new Error('Brak wymaganych parametrów (wordId, file)');
            }
            
            // Walidacja pliku
            this.fileHandler.validateFile(file);
            console.log('✅ Plik zwalidowany');

            // Konwersja do base64
            const base64 = await this.fileHandler.fileToBase64(file);
            console.log('📄 Plik skonwertowany do base64');

            // Optymalizacja obrazka
            const optimizedImage = await this.fileHandler.optimizeImage(
                base64, 
                file.type, 
                this.defaultImageSize
            );
            console.log('🔧 Obrazek zoptymalizowany');

            // Utworz dane obrazka
            const imageData = this.createImageData(wordId, optimizedImage, file);

            // Zapisz w storage
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
     * Tworzenie obiektu danych obrazka
     * @param {string} wordId - ID słowa
     * @param {string} optimizedImage - Zoptymalizowany obrazek base64
     * @param {File} originalFile - Oryginalny plik
     * @returns {Object} - Dane obrazka
     */
    createImageData(wordId, optimizedImage, originalFile) {
        return {
            id: wordId,
            data: optimizedImage,
            type: originalFile.type,
            size: optimizedImage.length,
            timestamp: new Date().toISOString(),
            filename: originalFile.name,
            originalSize: originalFile.size,
            version: '1.0'
        };
    }

    /**
     * Pobranie obrazka dla słówka
     * @param {string} wordId - ID słowa
     * @returns {Object|null} - Dane obrazka lub null
     */
    getImage(wordId) {
        if (!wordId) {
            console.warn('⚠️ Brak wordId w getImage');
            return null;
        }

        const images = this.loadImages();
        const imageData = images[wordId] || null;
        
        if (imageData) {
            console.log(`🔍 Znaleziono obrazek dla: ${wordId}`);
            
            // Walidacja integralności danych
            if (!this.validateImageData(imageData)) {
                console.warn(`⚠️ Uszkodzone dane obrazka: ${wordId}`);
                return null;
            }
        }
        
        return imageData;
    }

    /**
     * Walidacja integralności danych obrazka
     * @param {Object} imageData - Dane obrazka
     * @returns {boolean} - Czy dane są prawidłowe
     */
    validateImageData(imageData) {
        if (!imageData || typeof imageData !== 'object') {
            return false;
        }

        const requiredFields = ['id', 'data', 'type', 'timestamp'];
        return requiredFields.every(field => imageData.hasOwnProperty(field));
    }

    /**
     * Sprawdzenie czy słówko ma obrazek
     * @param {string} wordId - ID słowa
     * @returns {boolean} - Czy ma obrazek
     */
    hasImage(wordId) {
        return this.getImage(wordId) !== null;
    }

    /**
     * Usunięcie obrazka
     * @param {string} wordId - ID słowa
     * @returns {boolean} - Czy usunięto pomyślnie
     */
    removeImage(wordId) {
        if (!wordId) {
            console.warn('⚠️ Brak wordId w removeImage');
            return false;
        }

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
     * @param {string} wordId - ID słowa
     * @returns {boolean} - Czy usunięto pomyślnie
     */
    deleteImage(wordId) {
        return this.removeImage(wordId);
    }

    // ==========================================
    // METODY STORAGE
    // ==========================================

    /**
     * Zapisanie obrazka w localStorage
     * @param {string} wordId - ID słowa
     * @param {Object} imageData - Dane obrazka
     */
    saveImage(wordId, imageData) {
        try {
            const images = this.loadImages();
            images[wordId] = imageData;
            this.saveImages(images);
            console.log(`💾 Zapisano obrazek: ${wordId}`);
        } catch (error) {
            console.error('❌ Błąd zapisywania obrazka:', error);
            throw error;
        }
    }

    /**
     * Ładowanie wszystkich obrazków z localStorage
     * @returns {Object} - Obiekt z obrazkami
     */
    loadImages() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const images = data ? JSON.parse(data) : {};
            
            // Sprawdź czy dane są prawidłowe
            if (typeof images !== 'object' || Array.isArray(images)) {
                console.warn('⚠️ Nieprawidłowe dane w storage, resetuję');
                return {};
            }
            
            return images;
        } catch (error) {
            console.error('❌ Błąd ładowania obrazków:', error);
            return {};
        }
    }

    /**
     * Zapisanie wszystkich obrazków do localStorage
     * @param {Object} images - Obiekt z obrazkami
     */
    saveImages(images) {
        try {
            if (!images || typeof images !== 'object') {
                throw new Error('Nieprawidłowe dane do zapisu');
            }

            const dataString = JSON.stringify(images);
            localStorage.setItem(this.storageKey, dataString);
            
            console.log(`💾 Zapisano ${Object.keys(images).length} obrazków (${Math.round(dataString.length / 1024)}KB)`);
        } catch (error) {
            console.error('❌ Błąd zapisywania obrazków:', error);
            
            if (error.name === 'QuotaExceededError') {
                this.showNotification('Brak miejsca w pamięci przeglądarki', 'error');
                this.handleStorageQuotaExceeded();
            }
            throw error;
        }
    }

    /**
     * Obsługa przekroczenia limitu storage
     */
    handleStorageQuotaExceeded() {
        console.warn('⚠️ Przekroczono limit storage');
        
        // Pokaż informacje o rozmiarze
        const storageInfo = this.getStorageInfo();
        console.log('📊 Informacje o storage:', storageInfo);
        
        // Zaproponuj czyszczenie
        if (confirm('Brak miejsca w pamięci przeglądarki. Czy chcesz usunąć stare obrazki?')) {
            this.cleanupOldImages();
        }
    }

    // ==========================================
    // UTILITY METODY
    // ==========================================

    /**
     * Informacje o wykorzystaniu storage
     * @returns {Object} - Informacje o storage
     */
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const images = this.loadImages();
            const dataSize = data ? new Blob([data]).size : 0;
            
            return {
                totalImages: Object.keys(images).length,
                totalSizeBytes: dataSize,
                totalSizeKB: Math.round(dataSize / 1024),
                totalSizeMB: Math.round(dataSize / (1024 * 1024) * 100) / 100,
                storageKey: this.storageKey
            };
        } catch (error) {
            console.error('❌ Błąd pobierania info o storage:', error);
            return { error: error.message };
        }
    }

    /**
     * Czyszczenie starych obrazków
     * @param {number} maxAge - Maksymalny wiek w dniach (domyślnie 30)
     * @returns {number} - Liczba usuniętych obrazków
     */
    cleanupOldImages(maxAge = 30) {
        try {
            const images = this.loadImages();
            const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
            let removedCount = 0;
            
            Object.entries(images).forEach(([wordId, imageData]) => {
                const imageDate = new Date(imageData.timestamp);
                if (imageDate < cutoffDate) {
                    delete images[wordId];
                    removedCount++;
                }
            });
            
            if (removedCount > 0) {
                this.saveImages(images);
                console.log(`🧹 Usunięto ${removedCount} starych obrazków`);
                this.showNotification(`Usunięto ${removedCount} starych obrazków`, 'info');
            }
            
            return removedCount;
        } catch (error) {
            console.error('❌ Błąd czyszczenia starych obrazków:', error);
            return 0;
        }
    }

    /**
     * Export wszystkich obrazków
     * @returns {Object} - Dane do eksportu
     */
    exportImages() {
        const images = this.loadImages();
        const storageInfo = this.getStorageInfo();
        
        return {
            images: images,
            metadata: {
                exportDate: new Date().toISOString(),
                totalImages: storageInfo.totalImages,
                totalSize: storageInfo.totalSizeKB + 'KB',
                version: '1.0'
            }
        };
    }

    /**
     * Import obrazków z pliku
     * @param {Object} importData - Dane do importu
     * @returns {Object} - Wynik importu
     */
    importImages(importData) {
        try {
            if (!importData || !importData.images) {
                throw new Error('Nieprawidłowe dane do importu');
            }

            const currentImages = this.loadImages();
            const importedImages = importData.images;
            
            // Merge obrazków
            const mergedImages = { ...currentImages, ...importedImages };
            
            this.saveImages(mergedImages);
            
            const importedCount = Object.keys(importedImages).length;
            console.log(`📥 Zaimportowano ${importedCount} obrazków`);
            
            this.showNotification(`Zaimportowano ${importedCount} obrazków`, 'success');
            
            return {
                success: true,
                imported: importedCount,
                total: Object.keys(mergedImages).length
            };
            
        } catch (error) {
            console.error('❌ Błąd importu obrazków:', error);
            this.showNotification('Błąd importu obrazków: ' + error.message, 'error');
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Czyszczenie wszystkich obrazków
     * @returns {boolean} - Czy wyczyszczono pomyślnie
     */
    clearAllImages() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ Wyczyszczono wszystkie obrazki');
            this.showNotification('Wszystkie obrazki zostały usunięte', 'info');
            return true;
        } catch (error) {
            console.error('❌ Błąd czyszczenia obrazków:', error);
            return false;
        }
    }

    /**
     * Reset całego modułu (tylko dla testów)
     */
    reset() {
        this.clearAllImages();
        
        if (this.modalUI) {
            this.modalUI.cleanup();
        }
        
        console.log('🔄 ImageManager zresetowany');
    }

    /**
     * Bezpieczne pokazywanie powiadomień
     * @param {string} message - Wiadomość
     * @param {string} type - Typ powiadomienia
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
        console.log('🧹 ImageManager cleanup...');
        
        if (this.modalUI) {
            this.modalUI.cleanup();
        }
        
        // Wyczyść referencje
        this.fileHandler = null;
        this.modalUI = null;
        
        console.log('✅ ImageManager wyczyszczony');
    }

    /**
     * Test funkcjonalności modułu
     * @returns {Object} - Wyniki testów
     */
    testImageManager() {
        console.group('🧪 Test ImageManager (refaktoryzowany)');
        
        const results = {
            basic: this.testBasicProperties(),
            components: this.testComponents(),
            storage: this.testStorage(),
            methods: this.testMethods()
        };
        
        console.log('📊 Wyniki testów:', results);
        console.groupEnd();
        
        return results;
    }

    /**
     * Test podstawowych właściwości
     */
    testBasicProperties() {
        return {
            storageKey: !!this.storageKey,
            defaultImageSize: !!this.defaultImageSize,
            maxFileSize: !!this.maxFileSize,
            supportedFormats: Array.isArray(this.supportedFormats)
        };
    }

    /**
     * Test komponentów
     */
    testComponents() {
        return {
            fileHandler: !!this.fileHandler,
            modalUI: !!this.modalUI,
            fileHandlerMethods: this.fileHandler && typeof this.fileHandler.validateFile === 'function',
            modalUIMethods: this.modalUI && typeof this.modalUI.showModal === 'function'
        };
    }

    /**
     * Test storage
     */
    testStorage() {
        try {
            const images = this.loadImages();
            return {
                canLoad: true,
                imageCount: Object.keys(images).length,
                storageInfo: this.getStorageInfo()
            };
        } catch (error) {
            return {
                canLoad: false,
                error: error.message
            };
        }
    }

    /**
     * Test metod
     */
    testMethods() {
        const requiredMethods = [
            'openManagerForWord',
            'addImage',
            'getImage',
            'removeImage',
            'hasImage',
            'exportImages',
            'importImages'
        ];
        
        const results = {};
        requiredMethods.forEach(method => {
            results[method] = typeof this[method] === 'function';
        });
        
        return results;
    }
}