/**
 * StorageManager - Zarządzanie localStorage z kompresją i walidacją
 * Obsługuje bezpieczne zapisywanie/odczytywanie danych z localStorage
 */

class StorageManager {
    constructor() {
        this.prefix = 'english-flashcards-';
        this.maxSize = 10 * 1024 * 1024; // 10MB
        this.compressionThreshold = 1024; // 1KB
        this.isAvailable = this.checkAvailability();
    }

    /**
     * Sprawdzenie dostępności localStorage
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
            if (data.length > this.compressionThreshold && options.compress !== false) {
                data = this.compress(data);
            }

            // Sprawdzenie rozmiaru
            if (data.length > this.maxSize) {
                throw new Error(`Dane za duże: ${data.length} bajtów`);
            }

            // Sprawdzenie dostępnego miejsca
            if (!this.hasSpace(data.length)) {
                // Próba czyszczenia starych danych
                if (options.autoCleanup !== false) {
                    this.cleanup();
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
                version: '1.0.0',
                compressed: data.length > this.compressionThreshold,
                size: data.length
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
     */
    has(key) {
        if (!this.isAvailable) return false;
        
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    }

    /**
     * Pobranie wszystkich kluczy aplikacji
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
     */
    clear() {
        if (!this.isAvailable) return false;

        try {
            const keys = this.keys();
            keys.forEach(key => this.remove(key));
            return true;
        } catch (error) {
            console.error('Błąd czyszczenia localStorage:', error);
            return false;
        }
    }

    /**
     * Pobranie statystyk użycia
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
            usagePercentage: Math.round((totalUsage / this.maxSize) * 100)
        };
    }

    /**
     * Czyszczenie starych danych
     */
    cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 dni
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

        console.log(`Wyczyszczono ${removedCount} starych elementów`);
        return removedCount;
    }

    /**
     * Backup danych do pliku
     */
    async backup() {
        if (!this.isAvailable) return null;

        try {
            const keys = this.keys();
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                data: {}
            };

            keys.forEach(key => {
                backup.data[key] = this.get(key);
            });

            return backup;
        } catch (error) {
            console.error('Błąd tworzenia backup:', error);
            return null;
        }
    }

    /**
     * Przywracanie z backup
     */
    async restore(backupData) {
        if (!this.isAvailable || !backupData || !backupData.data) {
            return false;
        }

        try {
            // Opcjonalne wyczyszczenie przed przywracaniem
            // this.clear();

            Object.entries(backupData.data).forEach(([key, value]) => {
                this.set(key, value);
            });

            return true;
        } catch (error) {
            console.error('Błąd przywracania backup:', error);
            return false;
        }
    }

    /**
     * Walidacja struktury elementu
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
     */
    handleQuotaExceeded(key, value, options) {
        console.warn('Przekroczono limit localStorage');
        
        if (options.autoCleanup !== false) {
            const removedCount = this.cleanup();
            
            if (removedCount > 0) {
                // Ponów próbę po wyczyszczeniu
                return this.set(key, value, { ...options, autoCleanup: false });
            }
        }

        // Wyświetl powiadomienie użytkownikowi
        if (window.NotificationManager) {
            NotificationManager.show(
                'Brak miejsca w pamięci przeglądarki. Usuń stare dane w ustawieniach.',
                'error',
                0
            );
        }

        return false;
    }

    /**
     * Prosta kompresja (placeholder - można zaimplementować LZ-string)
     */
    compress(data) {
        // Dla prostoty - base64 encoding jako "kompresja"
        // W prawdziwej implementacji użyłbym biblioteki jak LZ-string
        try {
            return btoa(unescape(encodeURIComponent(data)));
        } catch (e) {
            return data;
        }
    }

    /**
     * Dekompresja
     */
    decompress(data) {
        try {
            return decodeURIComponent(escape(atob(data)));
        } catch (e) {
            return data;
        }
    }

    /**
     * Migracja danych między wersjami
     */
    migrate() {
        const currentVersion = '1.0.0';
        const versionKey = 'data-version';
        const storedVersion = this.get(versionKey);

        if (storedVersion !== currentVersion) {
            console.log(`Migracja danych z wersji ${storedVersion} do ${currentVersion}`);
            
            // Tutaj można dodać logikę migracji
            // np. aktualizacja struktury danych
            
            this.set(versionKey, currentVersion);
        }
    }

    /**
     * Monitoring wydajności
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
            avgTime: Math.round(duration / iterations * 1000) / 1000
        };
    }
}

// Singleton pattern
let storageManagerInstance = null;

function getStorageManager() {
    if (!storageManagerInstance) {
        storageManagerInstance = new StorageManager();
        storageManagerInstance.migrate();
    }
    return storageManagerInstance;
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, getStorageManager };
}

// Globalne dostępność
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
    window.getStorageManager = getStorageManager;
}

// Auto-inicjalizacja
document.addEventListener('DOMContentLoaded', () => {
    window.storageManager = getStorageManager();
});