/**
 * ImageFileHandler - Obsługa plików obrazków
 * Walidacja, konwersja do base64 i optymalizacja obrazków
 */

export class ImageFileHandler {
    constructor() {
        this.allowedTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp'
        ];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        
        console.log('📁 ImageFileHandler zainicjalizowany');
    }

    /**
     * Walidacja pliku obrazka
     * @param {File} file - Plik do walidacji
     * @returns {boolean} - true jeśli plik jest poprawny
     * @throws {Error} - Błąd walidacji
     */
    validateFile(file) {
        if (!file) {
            throw new Error('Nie wybrano pliku');
        }

        if (!this.allowedTypes.includes(file.type)) {
            throw new Error('Nieobsługiwany format pliku. Wybierz JPG, PNG, GIF lub WebP.');
        }

        if (file.size > this.maxFileSize) {
            const sizeMB = Math.round(file.size / (1024 * 1024));
            throw new Error(`Plik jest za duży (${sizeMB}MB). Maksymalny rozmiar to 5MB.`);
        }

        console.log(`✅ Plik zwalidowany: ${file.name} (${file.type}, ${this.formatFileSize(file.size)})`);
        return true;
    }

    /**
     * Konwersja pliku do base64
     * @param {File} file - Plik do konwersji
     * @returns {Promise<string>} - Base64 string
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
                console.log('📄 Plik skonwertowany do base64');
                resolve(reader.result);
            };
            
            reader.onerror = () => {
                console.error('❌ Błąd czytania pliku');
                reject(new Error('Błąd czytania pliku'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Optymalizacja obrazka - zmiana rozmiaru i kompresja
     * @param {string} base64 - Obrazek w formacie base64
     * @param {string} type - Typ MIME obrazka
     * @param {Object} targetSize - Docelowy rozmiar {width, height}
     * @returns {Promise<string>} - Zoptymalizowany obrazek w base64
     */
    async optimizeImage(base64, type, targetSize) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Oblicz nowe wymiary zachowując proporcje
                    const dimensions = this.calculateDimensions(
                        img.width, 
                        img.height, 
                        targetSize.width, 
                        targetSize.height
                    );

                    canvas.width = dimensions.width;
                    canvas.height = dimensions.height;

                    // Narysuj przeskalowany obrazek
                    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

                    // Konwertuj do base64 z kompresją
                    const quality = 0.8;
                    const optimizedBase64 = canvas.toDataURL(type, quality);
                    
                    console.log(`🔧 Obrazek zoptymalizowany: ${img.width}x${img.height} → ${dimensions.width}x${dimensions.height}`);
                    resolve(optimizedBase64);
                } catch (error) {
                    console.error('❌ Błąd optymalizacji:', error);
                    reject(new Error('Błąd optymalizacji obrazka: ' + error.message));
                }
            };
            
            img.onerror = () => {
                console.error('❌ Błąd ładowania obrazka do optymalizacji');
                reject(new Error('Błąd ładowania obrazka'));
            };
            
            img.src = base64;
        });
    }

    /**
     * Obliczanie nowych wymiarów zachowując proporcje
     * @param {number} originalWidth - Oryginalna szerokość
     * @param {number} originalHeight - Oryginalna wysokość  
     * @param {number} maxWidth - Maksymalna szerokość
     * @param {number} maxHeight - Maksymalna wysokość
     * @returns {Object} - Nowe wymiary {width, height}
     */
    calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let { width, height } = { width: originalWidth, height: originalHeight };
        
        // Sprawdź czy trzeba skalować
        if (width <= maxWidth && height <= maxHeight) {
            return { width, height };
        }
        
        // Oblicz współczynnik skali dla szerokości i wysokości
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        
        // Użyj mniejszego współczynnika aby zachować proporcje
        const ratio = Math.min(widthRatio, heightRatio);
        
        return {
            width: Math.round(width * ratio),
            height: Math.round(height * ratio)
        };
    }

    /**
     * Formatowanie rozmiaru pliku dla czytelności
     * @param {number} bytes - Rozmiar w bajtach
     * @returns {string} - Sformatowany rozmiar
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Sprawdzenie czy format jest obsługiwany
     * @param {string} type - Typ MIME
     * @returns {boolean} - Czy format jest obsługiwany
     */
    isFormatSupported(type) {
        return this.allowedTypes.includes(type);
    }

    /**
     * Pobranie informacji o obsługiwanych formatach
     * @returns {Object} - Informacje o formatach
     */
    getSupportedFormats() {
        return {
            types: [...this.allowedTypes],
            maxSize: this.maxFileSize,
            maxSizeMB: Math.round(this.maxFileSize / (1024 * 1024))
        };
    }
}