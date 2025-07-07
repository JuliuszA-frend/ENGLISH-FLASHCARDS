/**
 * Cache Strategy
 * Zarządzanie cache'em danych w pamięci
 */

export class CacheStrategy {
    constructor() {
        this.cache = new Map();
        this.loading = new Set();
        this.stats = {
            hits: 0,
            misses: 0,
            size: 0
        };
    }

    /**
     * Sprawdź czy dane są w cache
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Pobierz dane z cache
     */
    get(key) {
        if (this.cache.has(key)) {
            this.stats.hits++;
            console.log(`📦 Cache HIT: ${key}`);
            return this.cache.get(key);
        }
        
        this.stats.misses++;
        console.log(`📭 Cache MISS: ${key}`);
        return null;
    }

    /**
     * Zapisz dane do cache
     */
    set(key, data) {
        if (!key || !data) {
            console.warn('⚠️ Próba zapisania niepełnych danych do cache');
            return false;
        }

        this.cache.set(key, data);
        this.stats.size = this.cache.size;
        
        console.log(`💾 Cache SET: ${key} (rozmiar: ${this.stats.size})`);
        return true;
    }

    /**
     * Usuń dane z cache
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.size = this.cache.size;
            console.log(`🗑️ Cache DELETE: ${key}`);
        }
        return deleted;
    }

    /**
     * Wyczyść cały cache
     */
    clear() {
        const previousSize = this.cache.size;
        this.cache.clear();
        this.loading.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            size: 0
        };
        
        console.log(`🧹 Cache wyczyszczony (poprzedni rozmiar: ${previousSize})`);
        return true;
    }

    /**
     * Zarządzanie statusem ładowania
     */
    isLoading(key) {
        return this.loading.has(key);
    }

    setLoading(key) {
        this.loading.add(key);
        console.log(`⏳ Rozpoczęcie ładowania: ${key}`);
    }

    setLoaded(key) {
        const wasLoading = this.loading.delete(key);
        if (wasLoading) {
            console.log(`✅ Zakończenie ładowania: ${key}`);
        }
        return wasLoading;
    }

    /**
     * Czekanie na zakończenie ładowania
     */
    async waitForLoading(key, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkLoading = () => {
                // Sprawdź timeout
                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout podczas ładowania: ${key}`));
                    return;
                }

                // Sprawdź czy skończone ładowanie
                if (!this.loading.has(key)) {
                    if (this.cache.has(key)) {
                        resolve(this.cache.get(key));
                    } else {
                        reject(new Error(`Błąd ładowania danych: ${key}`));
                    }
                } else {
                    // Sprawdź ponownie za 100ms
                    setTimeout(checkLoading, 100);
                }
            };
            
            checkLoading();
        });
    }

    /**
     * Prefetch - załaduj dane w tle
     */
    async prefetch(key, loaderFunction) {
        if (this.has(key) || this.isLoading(key)) {
            return; // Już mamy lub ładujemy
        }

        this.setLoading(key);
        
        try {
            const data = await loaderFunction();
            this.set(key, data);
            return data;
        } catch (error) {
            console.error(`❌ Błąd prefetch dla ${key}:`, error);
        } finally {
            this.setLoaded(key);
        }
    }

    /**
     * Statystyki cache
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
            : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            keys: Array.from(this.cache.keys()),
            loadingKeys: Array.from(this.loading)
        };
    }

    /**
     * Optymalizacja cache - usuń stare wpisy
     */
    optimize(maxSize = 50) {
        if (this.cache.size <= maxSize) {
            return false;
        }

        // Konwertuj Map na array z timestampami
        const entries = Array.from(this.cache.entries()).map(([key, data]) => ({
            key,
            data,
            timestamp: data._cacheTimestamp || Date.now()
        }));

        // Sortuj według wieku (najstarsze pierwsze)
        entries.sort((a, b) => a.timestamp - b.timestamp);

        // Usuń najstarsze wpisy
        const toRemove = entries.slice(0, entries.length - maxSize);
        
        toRemove.forEach(entry => {
            this.cache.delete(entry.key);
        });

        this.stats.size = this.cache.size;
        
        console.log(`🔧 Cache zoptymalizowany: usunięto ${toRemove.length} starych wpisów`);
        return true;
    }

    /**
     * Dodaj timestamp do danych przy zapisie
     */
    setWithTimestamp(key, data) {
        const dataWithTimestamp = {
            ...data,
            _cacheTimestamp: Date.now()
        };
        
        return this.set(key, dataWithTimestamp);
    }

    /**
     * Sprawdź czy dane w cache są świeże
     */
    isFresh(key, maxAge = 5 * 60 * 1000) { // 5 minut domyślnie
        const data = this.cache.get(key);
        if (!data || !data._cacheTimestamp) {
            return false;
        }

        return (Date.now() - data._cacheTimestamp) < maxAge;
    }

    /**
     * Pobierz tylko świeże dane z cache
     */
    getFresh(key, maxAge = 5 * 60 * 1000) {
        if (this.isFresh(key, maxAge)) {
            return this.get(key);
        }
        
        console.log(`⏰ Dane w cache są przestarzałe: ${key}`);
        this.delete(key); // Usuń przestarzałe dane
        return null;
    }

    /**
     * Debug - wypisz zawartość cache
     */
    debug() {
        console.group('🔍 Debug Cache Strategy');
        console.log('📊 Statystyki:', this.getStats());
        console.log('📦 Zawartość cache:');
        
        for (const [key, data] of this.cache.entries()) {
            const size = JSON.stringify(data).length;
            const timestamp = data._cacheTimestamp 
                ? new Date(data._cacheTimestamp).toLocaleTimeString()
                : 'brak';
            
            console.log(`  ${key}: ${size} znaków, ${timestamp}`);
        }
        
        console.groupEnd();
    }
}