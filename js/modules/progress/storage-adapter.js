/**
 * StorageAdapter - Ujednolicona obsługa localStorage
 * Centralizuje wszystkie operacje zapisywania/ładowania danych
 */
class StorageAdapter {
    constructor(keyPrefix = 'english-flashcards') {
        this.keyPrefix = keyPrefix;
        this.isSupported = this.checkLocalStorageSupport();
        
        if (!this.isSupported) {
            console.warn('⚠️ localStorage nie jest dostępny - używam pamięci tymczasowej');
            this.memoryFallback = new Map();
        }
    }

    /**
     * Sprawdza dostępność localStorage
     */
    checkLocalStorageSupport() {
        try {
            const testKey = '__localStorage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generuje pełny klucz dla localStorage
     */
    getFullKey(key) {
        return `${this.keyPrefix}-${key}`;
    }

    /**
     * Zapisuje dane do localStorage lub pamięci fallback
     */
    save(key, data, options = {}) {
        const fullKey = this.getFullKey(key);
        const { silent = false, validate = null } = options;

        try {
            // Walidacja danych jeśli podana
            if (validate && typeof validate === 'function') {
                const isValid = validate(data);
                if (!isValid) {
                    throw new Error(`Validation failed for key: ${key}`);
                }
            }

            const serializedData = JSON.stringify(data);

            if (this.isSupported) {
                localStorage.setItem(fullKey, serializedData);
            } else {
                this.memoryFallback.set(fullKey, serializedData);
            }

            if (!silent) {
                console.log(`💾 Zapisano: ${key} (${this.getDataSize(serializedData)})`);
            }

            return { success: true, key: fullKey };

        } catch (error) {
            console.error(`❌ Błąd zapisu ${key}:`, error);
            return { 
                success: false, 
                error: error.message, 
                key: fullKey 
            };
        }
    }

    /**
     * Ładuje dane z localStorage lub pamięci fallback
     */
    load(key, defaultValue = null, options = {}) {
        const fullKey = this.getFullKey(key);
        const { silent = false, validate = null } = options;

        try {
            let serializedData;

            if (this.isSupported) {
                serializedData = localStorage.getItem(fullKey);
            } else {
                serializedData = this.memoryFallback.get(fullKey);
            }

            if (!serializedData) {
                if (!silent) {
                    console.log(`📭 Brak danych dla: ${key}, używam wartości domyślnej`);
                }
                return defaultValue;
            }

            const data = JSON.parse(serializedData);

            // Walidacja danych jeśli podana
            if (validate && typeof validate === 'function') {
                const isValid = validate(data);
                if (!isValid) {
                    console.warn(`⚠️ Walidacja nie powiodła się dla ${key}, używam wartości domyślnej`);
                    return defaultValue;
                }
            }

            if (!silent) {
                console.log(`📂 Załadowano: ${key} (${this.getDataSize(serializedData)})`);
            }

            return data;

        } catch (error) {
            console.error(`❌ Błąd ładowania ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Usuwa dane z localStorage lub pamięci fallback
     */
    remove(key, options = {}) {
        const fullKey = this.getFullKey(key);
        const { silent = false } = options;

        try {
            if (this.isSupported) {
                localStorage.removeItem(fullKey);
            } else {
                this.memoryFallback.delete(fullKey);
            }

            if (!silent) {
                console.log(`🗑️ Usunięto: ${key}`);
            }

            return { success: true, key: fullKey };

        } catch (error) {
            console.error(`❌ Błąd usuwania ${key}:`, error);
            return { 
                success: false, 
                error: error.message, 
                key: fullKey 
            };
        }
    }

    /**
     * Sprawdza czy klucz istnieje
     */
    exists(key) {
        const fullKey = this.getFullKey(key);

        if (this.isSupported) {
            return localStorage.getItem(fullKey) !== null;
        } else {
            return this.memoryFallback.has(fullKey);
        }
    }

    /**
     * Pobiera wszystkie klucze z danym prefixem
     */
    getKeys(pattern = '') {
        const keys = [];
        const searchPattern = pattern ? `${this.keyPrefix}-${pattern}` : this.keyPrefix;

        if (this.isSupported) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes(searchPattern)) {
                    keys.push(key.replace(`${this.keyPrefix}-`, ''));
                }
            }
        } else {
            for (const key of this.memoryFallback.keys()) {
                if (key.includes(searchPattern)) {
                    keys.push(key.replace(`${this.keyPrefix}-`, ''));
                }
            }
        }

        return keys;
    }

    /**
     * Czyści wszystkie dane aplikacji
     */
    clearAll(options = {}) {
        const { silent = false, confirm = true } = options;

        if (confirm && !window.confirm('Czy na pewno chcesz usunąć wszystkie dane aplikacji?')) {
            return { success: false, reason: 'User cancelled' };
        }

        try {
            const keys = this.getKeys();
            let removedCount = 0;

            keys.forEach(key => {
                const result = this.remove(key, { silent: true });
                if (result.success) removedCount++;
            });

            if (!silent) {
                console.log(`🧹 Wyczyszczono ${removedCount} kluczy`);
            }

            return { 
                success: true, 
                removedCount,
                keys: keys 
            };

        } catch (error) {
            console.error('❌ Błąd czyszczenia danych:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    /**
     * Eksportuje wszystkie dane aplikacji
     */
    exportData() {
        const data = {};
        const keys = this.getKeys();

        keys.forEach(key => {
            const value = this.load(key, null, { silent: true });
            if (value !== null) {
                data[key] = value;
            }
        });

        return {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                keysCount: Object.keys(data).length,
                storageType: this.isSupported ? 'localStorage' : 'memory'
            },
            data: data
        };
    }

    /**
     * Importuje dane do aplikacji
     */
    importData(importedData, options = {}) {
        const { silent = false, overwrite = false } = options;

        try {
            if (!importedData.data || typeof importedData.data !== 'object') {
                throw new Error('Nieprawidłowy format danych importu');
            }

            const keys = Object.keys(importedData.data);
            let importedCount = 0;
            const conflicts = [];

            keys.forEach(key => {
                const exists = this.exists(key);
                
                if (exists && !overwrite) {
                    conflicts.push(key);
                    return;
                }

                const result = this.save(key, importedData.data[key], { silent: true });
                if (result.success) importedCount++;
            });

            if (!silent) {
                console.log(`📥 Zaimportowano ${importedCount} kluczy`);
                if (conflicts.length > 0) {
                    console.warn(`⚠️ Konflikty (nie nadpisano): ${conflicts.join(', ')}`);
                }
            }

            return {
                success: true,
                importedCount,
                conflicts,
                totalKeys: keys.length
            };

        } catch (error) {
            console.error('❌ Błąd importu danych:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Pomocnicze metody
     */
    getDataSize(serializedData) {
        const bytes = new Blob([serializedData]).size;
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / 1048576).toFixed(1)}MB`;
    }

    /**
     * Diagnostyka storage
     */
    getDiagnostics() {
        const keys = this.getKeys();
        let totalSize = 0;

        const keyDetails = keys.map(key => {
            const data = this.load(key, null, { silent: true });
            const serialized = JSON.stringify(data);
            const size = new Blob([serialized]).size;
            totalSize += size;

            return {
                key,
                size,
                type: typeof data,
                isArray: Array.isArray(data),
                itemCount: Array.isArray(data) ? data.length : Object.keys(data || {}).length
            };
        });

        return {
            storageType: this.isSupported ? 'localStorage' : 'memory',
            totalKeys: keys.length,
            totalSize: totalSize,
            totalSizeFormatted: this.getDataSize('x'.repeat(totalSize)),
            keyDetails: keyDetails,
            quotaInfo: this.getQuotaInfo()
        };
    }

    /**
     * Informacje o limicie localStorage
     */
    getQuotaInfo() {
        if (!this.isSupported) {
            return { available: false, reason: 'localStorage not supported' };
        }

        try {
            // Oszacowanie dostępnego miejsca
            let used = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length + key.length;
                }
            }

            return {
                available: true,
                usedBytes: used,
                usedFormatted: this.getDataSize('x'.repeat(used)),
                estimatedLimit: '5-10MB (varies by browser)'
            };

        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }
}

// Export dla ES6 modules
export { StorageAdapter };

// Export default dla wygody
export default StorageAdapter;

console.log('✅ StorageAdapter załadowany');