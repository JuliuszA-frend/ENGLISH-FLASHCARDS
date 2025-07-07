/**
 * StorageManager - Zarządzanie localStorage z kompresją i walidacją ES6
 * Obsługuje bezpieczne zapisywanie/odczytywanie danych z localStorage
 * Singleton pattern z ES6 modules
 */

import { AppConstants } from '../config/constants.js';

/**
 * Klasa StorageManager z pełnym API localStorage
 */
class StorageManager {
    constructor() {
        this.prefix = 'english-flashcards-';
        this.maxSize = 10 * 1024 * 1024; // 10MB
        this.compressionThreshold = 1024; // 1KB
        this.isAvailable = this.checkAvailability();
        this.version = '1.0.0';
        
        // Auto-migracja przy inicjalizacji
        if (this.isAvailable) {
            this.migrate();
        }
    }

    /**
     * Sprawdzenie dostępności localStorage
     * @returns {boolean} True jeśli localStorage jest dostępny
     */
    checkAvailability() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage nie jest dostępny:', e);
            return false;
        }
    }

    /**
     * Bezpieczne zapisanie danych
     * @param {string} key - Klucz
     * @param {any} value - Wartość do zapisania
     * @param {Object} options - Opcje zapisu
     * @returns {boolean} True jeśli zapisano pomyślnie
     */
    set(key, value, options = {}) {
        if (!this.isAvailable) {
            console.warn('localStorage nie jest dostępny');
            return false;
        }

        try {
            const fullKey = this.prefix + key;
            let data = value;

            // Serializacja jeśli nie jest stringiem
            if (typeof data !== 'string') {
                data = JSON.stringify(data);
            }

            // Kompresja dla dużych danych
            const shouldCompress = data.length > this.compressionThreshold && options.compress !== false;
            if (shouldCompress) {
                data = this.compress(data);
            }

            // Sprawdzenie rozmiaru
            if (data.length > this.maxSize) {
                throw new Error(`Dane za duże: ${this.formatSize(data.length)}`);
            }

            // Sprawdzenie dostępnego miejsca
            if (!this.hasSpace(data.length)) {
                // Próba czyszczenia starych danych
                if (options.autoCleanup !== false) {
                    const cleaned = this.cleanup();
                    console.log(`🧹 Wyczyszczono ${cleaned} starych elementów`);
                    
                    if (!this.hasSpace(data.length)) {
                        throw new Error('Brak miejsca w localStorage');
                    }
                } else {
                    throw new Error('Brak miejsca w localStorage');
                }
            }

            // Metadane
            const item = {
                data: data,
                timestamp: Date.now(),
                version: this.version,
                compressed: shouldCompress,
                size: data.length,
                type: typeof value
            };

            localStorage.setItem(fullKey, JSON.stringify(item));
            return true;

        } catch (error) {
            console.error('Błąd zapisywania do localStorage:', error);
            
            // Obsługa QuotaExceededError
            if (error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded(key, value, options);
            }
            
            return false;
        }
    }

    /**
     * Bezpieczne odczytanie danych
     * @param {string} key - Klucz
     * @param {any} defaultValue - Wartość domyślna
     * @returns {any} Odczytana wartość lub defaultValue
     */
    get(key, defaultValue = null) {
        if (!this.isAvailable) {
            return defaultValue;
        }

        try {
            const fullKey = this.prefix + key;
            const rawData = localStorage.getItem(fullKey);
            
            if (!rawData) {
                return defaultValue;
            }

            const item = JSON.parse(rawData);
            
            // Walidacja struktury
            if (!this.validateItem(item)) {
                console.warn(`Nieprawidłowa struktura danych dla klucza: ${key}`);
                this.remove(key);
                return defaultValue;
            }

            let data = item.data;

            // Dekompresja jeśli potrzebna
            if (item.compressed) {
                data = this.decompress(data);
            }

            // Parsowanie JSON jeśli to możliwe
            try {
                return JSON.parse(data);
            } catch (e) {
                return data;
            }

        } catch (error) {
            console.error('Błąd odczytywania z localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Usunięcie klucza
     * @param {string} key - Klucz do usunięcia
     * @returns {boolean} True jeśli usunięto pomyślnie
     */
    remove(key) {
        if (!this.isAvailable) return false;

        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Błąd usuwania z localStorage:', error);
            return false;
        }
    }

    /**
     * Sprawdzenie czy klucz istnieje
     * @param {string} key - Klucz
     * @returns {boolean} True jeśli klucz istnieje
     */
    has(key) {
        if (!this.isAvailable) return false;
        
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    }

    /**
     * Pobranie wszystkich kluczy aplikacji
     * @returns {string[]} Tablica kluczy
     */
    keys() {
        if (!this.isAvailable) return [];

        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }
        return keys;
    }

    /**
     * Czyszczenie wszystkich danych aplikacji
     * @returns {boolean} True jeśli wyczyszczono pomyślnie
     */
    clear() {
        if (!this.isAvailable) return false;

        try {
            const keys = this.keys();
            keys.forEach(key => this.remove(key));
            console.log(`🧹 Wyczyszczono ${keys.length} kluczy aplikacji`);
            return true;
        } catch (error) {
            console.error('Błąd czyszczenia localStorage:', error);
            return false;
        }
    }

    /**
     * Pobranie statystyk użycia
     * @returns {Object} Statystyki localStorage
     */
    getStats() {
        if (!this.isAvailable) {
            return { available: false };
        }

        const keys = this.keys();
        let totalSize = 0;
        let itemCount = 0;
        let oldestTimestamp = Date.now();
        let newestTimestamp = 0;

        keys.forEach(key => {
            try {
                const fullKey = this.prefix + key;
                const rawData = localStorage.getItem(fullKey);
                if (rawData) {
                    totalSize += rawData.length;
                    itemCount++;

                    const item = JSON.parse(rawData);
                    if (item.timestamp) {
                        oldestTimestamp = Math.min(oldestTimestamp, item.timestamp);
                        newestTimestamp = Math.max(newestTimestamp, item.timestamp);
                    }
                }
            } catch (e) {
                console.warn(`Błąd przetwarzania klucza: ${key}`);
            }
        });

        // Sprawdzenie całkowitego użycia localStorage
        let totalUsage = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalUsage += localStorage[key].length;
            }
        }

        return {
            available: true,
            itemCount: itemCount,
            totalSize: totalSize,
            totalUsage: totalUsage,
            availableSpace: this.maxSize - totalUsage,
            oldestItem: oldestTimestamp !== Date.now() ? new Date(oldestTimestamp) : null,
            newestItem: newestTimestamp > 0 ? new Date(newestTimestamp) : null,
            usagePercentage: Math.round((totalUsage / this.maxSize) * 100),
            formattedTotalSize: this.formatSize(totalSize),
            formattedTotalUsage: this.formatSize(totalUsage),
            formattedAvailableSpace: this.formatSize(this.maxSize - totalUsage)
        };
    }

    /**
     * Czyszczenie starych danych
     * @param {number} maxAge - Maksymalny wiek w ms (domyślnie 30 dni)
     * @returns {number} Liczba usuniętych elementów
     */
    cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) {
        if (!this.isAvailable) return 0;

        const cutoffTime = Date.now() - maxAge;
        const keys = this.keys();
        let removedCount = 0;

        keys.forEach(key => {
            try {
                const fullKey = this.prefix + key;
                const rawData = localStorage.getItem(fullKey);
                
                if (rawData) {
                    const item = JSON.parse(rawData);
                    if (item.timestamp && item.timestamp < cutoffTime) {
                        this.remove(key);
                        removedCount++;
                    }
                }
            } catch (e) {
                // Usuń uszkodzone dane
                this.remove(key);
                removedCount++;
            }
        });

        console.log(`🧹 Wyczyszczono ${removedCount} starych elementów`);
        return removedCount;
    }

    /**
     * Backup danych do obiektu
     * @returns {Object|null} Obiekt z backup lub null
     */
    backup() {
        if (!this.isAvailable) return null;

        try {
            const keys = this.keys();
            const backup = {
                timestamp: new Date().toISOString(),
                version: this.version,
                appVersion: AppConstants?.VERSION || '1.0.0',
                data: {}
            };

            keys.forEach(key => {
                backup.data[key] = this.get(key);
            });

            console.log(`💾 Utworzono backup z ${keys.length} kluczy`);
            return backup;
        } catch (error) {
            console.error('Błąd tworzenia backup:', error);
            return null;
        }
    }

    /**
     * Przywracanie z backup
     * @param {Object} backupData - Dane backup
     * @param {boolean} clearFirst - Czy wyczyścić przed przywracaniem
     * @returns {boolean} True jeśli przywrócono pomyślnie
     */
    restore(backupData, clearFirst = false) {
        if (!this.isAvailable || !backupData || !backupData.data) {
            return false;
        }

        try {
            // Opcjonalne wyczyszczenie przed przywracaniem
            if (clearFirst) {
                this.clear();
            }

            let restoredCount = 0;
            Object.entries(backupData.data).forEach(([key, value]) => {
                if (this.set(key, value)) {
                    restoredCount++;
                }
            });

            console.log(`🔄 Przywrócono ${restoredCount} elementów z backup`);
            return true;
        } catch (error) {
            console.error('Błąd przywracania backup:', error);
            return false;
        }
    }

    /**
     * Walidacja struktury elementu
     * @param {Object} item - Element do walidacji
     * @returns {boolean} True jeśli struktura jest prawidłowa
     */
    validateItem(item) {
        return item && 
               typeof item === 'object' && 
               'data' in item && 
               'timestamp' in item &&
               typeof item.timestamp === 'number';
    }

    /**
     * Sprawdzenie dostępnego miejsca
     * @param {number} requiredSize - Wymagany rozmiar
     * @returns {boolean} True jeśli jest wystarczająco miejsca
     */
    hasSpace(requiredSize) {
        try {
            const testKey = '__space_test__';
            const testData = 'x'.repeat(requiredSize);
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Obsługa przekroczenia limitu
     * @param {string} key - Klucz
     * @param {any} value - Wartość
     * @param {Object} options - Opcje
     * @returns {boolean} True jeśli udało się zapisać po cleanup
     */
    handleQuotaExceeded(key, value, options) {
        console.warn('💾 Przekroczono limit localStorage');
        
        if (options.autoCleanup !== false) {
            const removedCount = this.cleanup();
            
            if (removedCount > 0) {
                // Ponów próbę po wyczyszczeniu
                return this.set(key, value, { ...options, autoCleanup: false });
            }
        }

        // Wyświetl powiadomienie użytkownikowi jeśli dostępne
        if (typeof window !== 'undefined' && window.NotificationManager) {
            window.NotificationManager.show(
                'Brak miejsca w pamięci przeglądarki. Usuń stare dane w ustawieniach.',
                'error',
                0
            );
        }

        return false;
    }

    /**
     * Prosta kompresja (base64 encoding jako placeholder)
     * @param {string} data - Dane do kompresji
     * @returns {string} Skompresowane dane
     */
    compress(data) {
        try {
            return btoa(unescape(encodeURIComponent(data)));
        } catch (e) {
            console.warn('Błąd kompresji, używam oryginalnych danych');
            return data;
        }
    }

    /**
     * Dekompresja
     * @param {string} data - Dane do dekompresji
     * @returns {string} Zdekompresowane dane
     */
    decompress(data) {
        try {
            return decodeURIComponent(escape(atob(data)));
        } catch (e) {
            console.warn('Błąd dekompresji, używam oryginalnych danych');
            return data;
        }
    }

    /**
     * Migracja danych między wersjami
     */
    migrate() {
        const currentVersion = this.version;
        const versionKey = 'data-version';
        const storedVersion = this.get(versionKey);

        if (storedVersion !== currentVersion) {
            console.log(`🔄 Migracja danych z wersji ${storedVersion || 'brak'} do ${currentVersion}`);
            
            // Tutaj można dodać logikę migracji
            // np. aktualizacja struktury danych
            
            this.set(versionKey, currentVersion);
        }
    }

    /**
     * Monitoring wydajności
     * @param {string} operation - Typ operacji ('read'|'write')
     * @param {number} iterations - Liczba iteracji
     * @returns {Object|null} Wyniki benchmarku
     */
    benchmark(operation, iterations = 1000) {
        if (!this.isAvailable) return null;

        const testKey = '__benchmark__';
        const testData = { test: 'data', number: 123, array: [1, 2, 3] };

        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            if (operation === 'write') {
                this.set(testKey + i, testData);
            } else if (operation === 'read') {
                this.get(testKey + i);
            }
        }

        const end = performance.now();
        const duration = end - start;

        // Wyczyść dane testowe
        for (let i = 0; i < iterations; i++) {
            this.remove(testKey + i);
        }

        return {
            operation: operation,
            iterations: iterations,
            duration: Math.round(duration),
            avgTime: Math.round(duration / iterations * 1000) / 1000,
            opsPerSecond: Math.round(iterations / (duration / 1000))
        };
    }

    /**
     * Formatowanie rozmiaru
     * @param {number} bytes - Rozmiar w bajtach
     * @returns {string} Sformatowany rozmiar
     */
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Export wszystkich danych do JSON
     * @returns {string} JSON z wszystkimi danymi
     */
    exportToJson() {
        const backup = this.backup();
        return backup ? JSON.stringify(backup, null, 2) : null;
    }

    /**
     * Import danych z JSON
     * @param {string} jsonString - JSON string z danymi
     * @param {boolean} clearFirst - Czy wyczyścić przed importem
     * @returns {boolean} True jeśli import się powiódł
     */
    importFromJson(jsonString, clearFirst = false) {
        try {
            const data = JSON.parse(jsonString);
            return this.restore(data, clearFirst);
        } catch (error) {
            console.error('Błąd importu z JSON:', error);
            return false;
        }
    }
}

// Singleton instance
let storageManagerInstance = null;

/**
 * Pobierz singleton instancję StorageManager
 * @returns {StorageManager} Instancja StorageManager
 */
export function getStorageManager() {
    if (!storageManagerInstance) {
        storageManagerInstance = new StorageManager();
    }
    return storageManagerInstance;
}

/**
 * Utwórz nową instancję StorageManager (tylko do testów)
 * @returns {StorageManager} Nowa instancja
 */
export function createStorageManager() {
    return new StorageManager();
}

// Named exports dla popularnych metod
export const storage = {
    get: (...args) => getStorageManager().get(...args),
    set: (...args) => getStorageManager().set(...args),
    remove: (...args) => getStorageManager().remove(...args),
    has: (...args) => getStorageManager().has(...args),
    clear: (...args) => getStorageManager().clear(...args),
    keys: (...args) => getStorageManager().keys(...args),
    getStats: (...args) => getStorageManager().getStats(...args),
    backup: (...args) => getStorageManager().backup(...args),
    restore: (...args) => getStorageManager().restore(...args)
};

// Default export
export default getStorageManager;

// Export klasy dla zaawansowanego użycia
export { StorageManager };

// 🔧 KOMPATYBILNOŚĆ WSTECZNA: Eksport globalny
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
    window.getStorageManager = getStorageManager;
    
    // Auto-inicjalizacja dla kompatybilności
    window.storageManager = getStorageManager();
}