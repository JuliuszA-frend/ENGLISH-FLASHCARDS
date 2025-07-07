/**
 * ImageManager - Zarządzanie obrazkami dla słówek ES6
 * Modularny menedżer obsługi obrazków z optymalizacją
 */

import { AppConstants } from '../config/constants.js';
import { showNotification } from './notification-manager.js';

/**
 * Klasa zarządzająca obrazkami dla słówek
 */
class ImageManager {
    constructor() {
        this.storageKey = AppConstants?.STORAGE_KEYS?.IMAGES || 'english-flashcards-images';
        this.defaultImageSize = { width: 300, height: 200 };
        this.supportedFormats = AppConstants?.SUPPORTED_IMAGE_FORMATS || [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp'
        ];
        this.maxFileSize = AppConstants?.LIMITS?.MAX_IMAGE_SIZE || 5 * 1024 * 1024; // 5MB
    }

    /**
     * Dodanie obrazka dla słówka
     * @param {string} wordId - ID słówka
     * @param {File} file - Plik obrazka
     * @returns {Promise<Object>} Dane obrazka lub error
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
                filename: file.name,
                originalSize: file.size
            };

            this.saveImage(wordId, imageData);
            
            // Pokaż powiadomienie o sukcesie
            showNotification('Obrazek został dodany pomyślnie!', 'success');

            console.log(`✅ Obrazek dodany dla słówka ${wordId}:`, {
                filename: file.name,
                originalSize: this.formatSize(file.size),
                optimizedSize: this.formatSize(optimizedImage.length)
            });

            return imageData;

        } catch (error) {
            console.error('Błąd dodawania obrazka:', error);
            
            // Pokaż powiadomienie o błędzie
            showNotification('Błąd dodawania obrazka: ' + error.message, 'error');
            
            throw error;
        }
    }

    /**
     * Pobranie obrazka dla słówka
     * @param {string} wordId - ID słówka
     * @returns {Object|null} Dane obrazka lub null
     */
    getImage(wordId) {
        try {
            const images = this.loadImages();
            return images[wordId] || null;
        } catch (error) {
            console.error(`Błąd pobierania obrazka dla ${wordId}:`, error);
            return null;
        }
    }

    /**
     * Usunięcie obrazka
     * @param {string} wordId - ID słówka
     * @returns {boolean} True jeśli usunięto pomyślnie
     */
    removeImage(wordId) {
        try {
            const images = this.loadImages();
            
            if (images[wordId]) {
                delete images[wordId];
                this.saveImages(images);
                
                showNotification('Obrazek został usunięty', 'info');
                console.log(`🗑️ Usunięto obrazek dla słówka ${wordId}`);
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Błąd usuwania obrazka dla ${wordId}:`, error);
            showNotification('Błąd usuwania obrazka', 'error');
            return false;
        }
    }

    /**
     * Walidacja pliku obrazka
     * @param {File} file - Plik do walidacji
     * @throws {Error} Błąd walidacji
     */
    validateImageFile(file) {
        if (!file) {
            throw new Error('Nie wybrano pliku');
        }

        if (!this.supportedFormats.includes(file.type)) {
            throw new Error(`Nieobsługiwany format pliku. Obsługiwane: ${this.supportedFormats.join(', ')}`);
        }

        if (file.size > this.maxFileSize) {
            throw new Error(`Plik jest za duży. Maksymalny rozmiar to ${this.formatSize(this.maxFileSize)}`);
        }

        // Sprawdź czy nazwa pliku nie zawiera niebezpiecznych znaków
        if (!/^[a-zA-Z0-9\.\-_\s]+$/.test(file.name)) {
            throw new Error('Nazwa pliku zawiera niedozwolone znaki');
        }
    }

    /**
     * Konwersja pliku do base64
     * @param {File} file - Plik
     * @returns {Promise<string>} Base64 string
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Błąd odczytu pliku'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Optymalizacja obrazka
     * @param {string} base64 - Base64 obrazka
     * @param {string} type - Typ MIME
     * @returns {Promise<string>} Zoptymalizowany base64
     */
    async optimizeImage(base64, type) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Oblicz nowe wymiary zachowując proporcje
                    const { width, height } = this.calculateOptimalSize(
                        img.width, 
                        img.height, 
                        this.defaultImageSize.width, 
                        this.defaultImageSize.height
                    );

                    canvas.width = width;
                    canvas.height = height;

                    // Narysuj zoptymalizowany obrazek
                    ctx.drawImage(img, 0, 0, width, height);

                    // Konwertuj z kompresją
                    const quality = type === 'image/jpeg' ? 0.8 : undefined;
                    const optimized = canvas.toDataURL(type, quality);
                    
                    resolve(optimized);
                } catch (error) {
                    console.warn('Błąd optymalizacji obrazka, używam oryginału:', error);
                    resolve(base64);
                }
            };
            
            img.onerror = () => {
                console.warn('Błąd ładowania obrazka, używam oryginału');
                resolve(base64);
            };
            
            img.src = base64;
        });
    }

    /**
     * Obliczenie optymalnego rozmiaru
     * @param {number} originalWidth - Oryginalna szerokość
     * @param {number} originalHeight - Oryginalna wysokość
     * @param {number} maxWidth - Maksymalna szerokość
     * @param {number} maxHeight - Maksymalna wysokość
     * @returns {Object} Nowe wymiary {width, height}
     */
    calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
        
        if (ratio >= 1) {
            return { width: originalWidth, height: originalHeight };
        }
        
        return {
            width: Math.round(originalWidth * ratio),
            height: Math.round(originalHeight * ratio)
        };
    }

    /**
     * Zapis pojedynczego obrazka
     * @param {string} wordId - ID słówka
     * @param {Object} imageData - Dane obrazka
     */
    saveImage(wordId, imageData) {
        const images = this.loadImages();
        images[wordId] = imageData;
        this.saveImages(images);
    }

    /**
     * Ładowanie obrazków z localStorage
     * @returns {Object} Obiekt z obrazkami
     */
    loadImages() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.warn('Błąd ładowania obrazków:', error);
            return {};
        }
    }

    /**
     * Zapisywanie obrazków do localStorage
     * @param {Object} images - Obiekt z obrazkami
     */
    saveImages(images) {
        try {
            const dataString = JSON.stringify(images);
            
            // Sprawdź rozmiar przed zapisem
            const sizeInMB = dataString.length / (1024 * 1024);
            if (sizeInMB > 8) { // Ostrzeżenie przy 8MB
                console.warn(`⚠️ Obrazki zajmują ${sizeInMB.toFixed(2)}MB miejsca w localStorage`);
            }
            
            localStorage.setItem(this.storageKey, dataString);
        } catch (error) {
            console.error('Błąd zapisywania obrazków:', error);
            
            if (error.name === 'QuotaExceededError') {
                showNotification(
                    'Brak miejsca w pamięci przeglądarki. Usuń niektóre obrazki.',
                    'error'
                );
            } else {
                showNotification('Błąd zapisywania obrazków', 'error');
            }
            
            throw error;
        }
    }

    /**
     * Pobranie listy wszystkich obrazków
     * @returns {Object} Wszystkie obrazki
     */
    getAllImages() {
        return this.loadImages();
    }

    /**
     * Sprawdzenie rozmiaru zajętego przez obrazki
     * @returns {Object} Informacje o pamięci
     */
    getStorageInfo() {
        try {
            const images = this.loadImages();
            const imageKeys = Object.keys(images);
            const dataString = JSON.stringify(images);
            const totalSize = dataString.length;
            
            return {
                count: imageKeys.length,
                totalSize: totalSize,
                totalSizeFormatted: this.formatSize(totalSize),
                averageSize: imageKeys.length > 0 ? Math.round(totalSize / imageKeys.length) : 0,
                averageSizeFormatted: imageKeys.length > 0 ? this.formatSize(Math.round(totalSize / imageKeys.length)) : '0 B',
                largestImage: this.findLargestImage(images),
                oldestImage: this.findOldestImage(images)
            };
        } catch (error) {
            console.error('Błąd pobierania informacji o pamięci:', error);
            return {
                count: 0,
                totalSize: 0,
                totalSizeFormatted: '0 B',
                averageSize: 0,
                averageSizeFormatted: '0 B',
                largestImage: null,
                oldestImage: null
            };
        }
    }

    /**
     * Znajdź największy obrazek
     * @param {Object} images - Obiekt z obrazkami
     * @returns {Object|null} Informacje o największym obrazku
     */
    findLargestImage(images) {
        let largest = null;
        let maxSize = 0;

        Object.entries(images).forEach(([wordId, imageData]) => {
            if (imageData.size > maxSize) {
                maxSize = imageData.size;
                largest = {
                    wordId,
                    filename: imageData.filename,
                    size: imageData.size,
                    sizeFormatted: this.formatSize(imageData.size)
                };
            }
        });

        return largest;
    }

    /**
     * Znajdź najstarszy obrazek
     * @param {Object} images - Obiekt z obrazkami
     * @returns {Object|null} Informacje o najstarszym obrazku
     */
    findOldestImage(images) {
        let oldest = null;
        let minTimestamp = Date.now();

        Object.entries(images).forEach(([wordId, imageData]) => {
            const timestamp = new Date(imageData.timestamp).getTime();
            if (timestamp < minTimestamp) {
                minTimestamp = timestamp;
                oldest = {
                    wordId,
                    filename: imageData.filename,
                    timestamp: imageData.timestamp,
                    age: this.formatAge(Date.now() - timestamp)
                };
            }
        });

        return oldest;
    }

    /**
     * Formatowanie rozmiaru pliku
     * @param {number} bytes - Rozmiar w bajtach
     * @returns {string} Sformatowany rozmiar
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Formatowanie wieku pliku
     * @param {number} milliseconds - Wiek w ms
     * @returns {string} Sformatowany wiek
     */
    formatAge(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} dni`;
        if (hours > 0) return `${hours} godz.`;
        if (minutes > 0) return `${minutes} min.`;
        return `${seconds} sek.`;
    }

    /**
     * Czyszczenie starych obrazków
     * @param {number} maxAge - Maksymalny wiek w ms (domyślnie 30 dni)
     * @returns {number} Liczba usuniętych obrazków
     */
    cleanupOldImages(maxAge = 30 * 24 * 60 * 60 * 1000) {
        try {
            const images = this.loadImages();
            const cutoffTime = Date.now() - maxAge;
            let removedCount = 0;
            
            Object.entries(images).forEach(([wordId, imageData]) => {
                const imageTime = new Date(imageData.timestamp).getTime();
                if (imageTime < cutoffTime) {
                    delete images[wordId];
                    removedCount++;
                }
            });

            if (removedCount > 0) {
                this.saveImages(images);
                console.log(`🧹 Usunięto ${removedCount} starych obrazków`);
                showNotification(`Usunięto ${removedCount} starych obrazków`, 'info');
            }

            return removedCount;
        } catch (error) {
            console.error('Błąd czyszczenia starych obrazków:', error);
            return 0;
        }
    }

    /**
     * Eksport obrazków do ZIP (teoretycznie - tu tylko przygotowanie danych)
     * @returns {Object} Dane do eksportu
     */
    exportImages() {
        try {
            const images = this.loadImages();
            const exportData = {
                timestamp: new Date().toISOString(),
                count: Object.keys(images).length,
                images: images
            };

            console.log(`📦 Przygotowano eksport ${exportData.count} obrazków`);
            return exportData;
        } catch (error) {
            console.error('Błąd eksportu obrazków:', error);
            return null;
        }
    }

    /**
     * Import obrazków z danych
     * @param {Object} importData - Dane do importu
     * @param {boolean} replaceExisting - Czy zastąpić istniejące
     * @returns {boolean} True jeśli import się powiódł
     */
    importImages(importData, replaceExisting = false) {
        try {
            if (!importData || !importData.images) {
                throw new Error('Nieprawidłowe dane do importu');
            }

            const currentImages = replaceExisting ? {} : this.loadImages();
            const importedImages = importData.images;
            let importedCount = 0;

            Object.entries(importedImages).forEach(([wordId, imageData]) => {
                if (!currentImages[wordId] || replaceExisting) {
                    currentImages[wordId] = imageData;
                    importedCount++;
                }
            });

            this.saveImages(currentImages);
            
            console.log(`📥 Zaimportowano ${importedCount} obrazków`);
            showNotification(`Zaimportowano ${importedCount} obrazków`, 'success');
            
            return true;
        } catch (error) {
            console.error('Błąd importu obrazków:', error);
            showNotification('Błąd importu obrazków: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Walidacja integralności danych obrazków
     * @returns {Object} Raport walidacji
     */
    validateIntegrity() {
        try {
            const images = this.loadImages();
            const report = {
                totalImages: 0,
                validImages: 0,
                invalidImages: 0,
                corruptedImages: [],
                missingFields: [],
                oversizedImages: []
            };

            Object.entries(images).forEach(([wordId, imageData]) => {
                report.totalImages++;

                // Sprawdź wymagane pola
                const requiredFields = ['data', 'type', 'size', 'timestamp'];
                const missingFields = requiredFields.filter(field => !imageData[field]);
                
                if (missingFields.length > 0) {
                    report.invalidImages++;
                    report.missingFields.push({ wordId, missingFields });
                    return;
                }

                // Sprawdź rozmiar
                if (imageData.size > this.maxFileSize) {
                    report.oversizedImages.push({
                        wordId,
                        size: imageData.size,
                        sizeFormatted: this.formatSize(imageData.size)
                    });
                }

                // Sprawdź integralność danych base64
                try {
                    if (!imageData.data.startsWith('data:image/')) {
                        throw new Error('Nieprawidłowy format base64');
                    }
                    report.validImages++;
                } catch (error) {
                    report.invalidImages++;
                    report.corruptedImages.push({ wordId, error: error.message });
                }
            });

            console.log('🔍 Raport walidacji obrazków:', report);
            return report;
        } catch (error) {
            console.error('Błąd walidacji integralności:', error);
            return null;
        }
    }

    /**
     * Reset - usuwa wszystkie obrazki
     * @returns {boolean} True jeśli zresetowano pomyślnie
     */
    reset() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🔄 Reset ImageManager - wszystkie obrazki usunięte');
            showNotification('Wszystkie obrazki zostały usunięte', 'info');
            return true;
        } catch (error) {
            console.error('Błąd resetowania ImageManager:', error);
            return false;
        }
    }

    /**
     * Cleanup - alias dla reset
     */
    cleanup() {
        return this.reset();
    }
}

// Singleton instance
let imageManagerInstance = null;

/**
 * Pobierz singleton instancję ImageManager
 * @returns {ImageManager} Instancja ImageManager
 */
export function getImageManager() {
    if (!imageManagerInstance) {
        imageManagerInstance = new ImageManager();
    }
    return imageManagerInstance;
}

/**
 * Utwórz nową instancję ImageManager (tylko do testów)
 * @returns {ImageManager} Nowa instancja
 */
export function createImageManager() {
    return new ImageManager();
}

// Named exports dla popularnych metod
export const imageUtils = {
    addImage: (...args) => getImageManager().addImage(...args),
    getImage: (...args) => getImageManager().getImage(...args),
    removeImage: (...args) => getImageManager().removeImage(...args),
    getAllImages: (...args) => getImageManager().getAllImages(...args),
    getStorageInfo: (...args) => getImageManager().getStorageInfo(...args),
    cleanupOldImages: (...args) => getImageManager().cleanupOldImages(...args)
};

// Export klasy
export { ImageManager };

// Default export
export default getImageManager;

// 🔧 KOMPATYBILNOŚĆ WSTECZNA: Eksport globalny
if (typeof window !== 'undefined') {
    window.ImageManager = ImageManager;
    window.getImageManager = getImageManager;
    
    // Auto-inicjalizacja dla kompatybilności
    window.imageManagerInstance = getImageManager();
}