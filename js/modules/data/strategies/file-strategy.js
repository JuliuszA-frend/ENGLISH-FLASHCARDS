/**
 * File Loading Strategy
 * Strategia ładowania danych z plików JSON przez HTTP
 */

export class FileLoadingStrategy {
    constructor(options = {}) {
        this.options = {
            retries: 3,
            retryDelay: 500,
            timeout: 10000,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            ...options
        };
    }

    /**
     * Sprawdź czy możemy używać fetch (nie file://)
     */
    isAvailable() {
        const protocol = window.location.protocol;
        const canUseFetch = protocol === 'http:' || protocol === 'https:';
        
        console.log(`🌐 Protokół: ${protocol}, Fetch dostępny: ${canUseFetch}`);
        return canUseFetch;
    }

    /**
     * Sprawdź dostępność pliku (HEAD request)
     */
    async checkFileAvailability(url) {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                headers: this.options.headers
            });
            
            const available = response.ok;
            console.log(`🔍 Sprawdzenie dostępności ${url}: ${available ? '✅' : '❌'}`);
            return available;
        } catch (error) {
            console.log(`🔍 Sprawdzenie dostępności ${url}: ❌ (${error.message})`);
            return false;
        }
    }

    /**
     * Załaduj plik JSON z retry mechanism
     */
    async loadFile(url) {
        if (!this.isAvailable()) {
            throw new Error('File loading strategy nie jest dostępna dla protokołu file://');
        }

        let lastError;

        for (let attempt = 1; attempt <= this.options.retries; attempt++) {
            try {
                console.log(`📥 Próba ${attempt}/${this.options.retries} ładowania: ${url}`);
                
                const response = await this.fetchWithTimeout(url, this.options.timeout);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                console.log(`✅ Pomyślnie załadowano: ${url} (próba ${attempt})`);
                return data;

            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Próba ${attempt}/${this.options.retries} nieudana: ${error.message}`);
                
                // Nie czekaj po ostatniej próbie
                if (attempt < this.options.retries) {
                    const delay = this.options.retryDelay * attempt; // Eksponencjalne opóźnienie
                    console.log(`⏳ Czekam ${delay}ms przed kolejną próbą...`);
                    await this.sleep(delay);
                }
            }
        }

        throw new Error(`Nie udało się załadować ${url} po ${this.options.retries} próbach. Ostatni błąd: ${lastError.message}`);
    }

    /**
     * Fetch z timeout
     */
    async fetchWithTimeout(url, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.options.headers,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Timeout po ${timeout}ms`);
            }
            
            throw error;
        }
    }

    /**
     * Załaduj wiele plików równolegle
     */
    async loadMultipleFiles(urls) {
        console.log(`📚 Ładowanie ${urls.length} plików równolegle...`);
        
        const promises = urls.map(async (url) => {
            try {
                const data = await this.loadFile(url);
                return { url, data, success: true };
            } catch (error) {
                console.error(`❌ Błąd ładowania ${url}:`, error);
                return { url, error: error.message, success: false };
            }
        });

        const results = await Promise.all(promises);
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log(`📊 Wyniki ładowania: ${successful.length} sukces, ${failed.length} błąd`);
        
        if (failed.length > 0) {
            console.warn('⚠️ Błędy ładowania:', failed);
        }

        return results;
    }

    /**
     * Załaduj z fallbackiem na inne URL
     */
    async loadWithFallback(primaryUrl, fallbackUrls = []) {
        const allUrls = [primaryUrl, ...fallbackUrls];
        
        for (let i = 0; i < allUrls.length; i++) {
            const url = allUrls[i];
            const isLast = i === allUrls.length - 1;
            
            try {
                console.log(`🎯 Próba ładowania z ${i === 0 ? 'głównego' : 'fallback'} URL: ${url}`);
                const data = await this.loadFile(url);
                
                if (i > 0) {
                    console.log(`⚠️ Załadowano z fallback URL (${i + 1}/${allUrls.length})`);
                }
                
                return data;
            } catch (error) {
                console.warn(`❌ Błąd ładowania z ${url}: ${error.message}`);
                
                if (isLast) {
                    throw new Error(`Nie udało się załadować z żadnego URL. Sprawdzono: ${allUrls.join(', ')}`);
                }
            }
        }
    }

    /**
     * Sprawdź dostępność wszystkich standardowych plików
     */
    async checkStandardFiles() {
        const standardFiles = [
            'data/vocabulary.json',
            'data/categories.json',
            'data/metadata.json'
        ];

        console.group('🔍 Sprawdzanie dostępności plików');
        
        const checks = await Promise.all(
            standardFiles.map(async (file) => {
                const available = await this.checkFileAvailability(file);
                console.log(`📄 ${file}: ${available ? '✅' : '❌'}`);
                return { file, available };
            })
        );

        console.groupEnd();
        
        return checks;
    }

    /**
     * Pobierz informacje o pliku (bez ładowania zawartości)
     */
    async getFileInfo(url) {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                headers: this.options.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return {
                url,
                size: response.headers.get('content-length'),
                type: response.headers.get('content-type'),
                lastModified: response.headers.get('last-modified'),
                etag: response.headers.get('etag'),
                available: true
            };
        } catch (error) {
            return {
                url,
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Ładowanie z postępem (dla dużych plików)
     */
    async loadFileWithProgress(url, onProgress) {
        const response = await this.fetchWithTimeout(url, this.options.timeout);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        let loaded = 0;
        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            chunks.push(value);
            loaded += value.length;
            
            if (onProgress && total > 0) {
                onProgress({ loaded, total, percentage: (loaded / total) * 100 });
            }
        }

        // Złącz chunks i parsuj JSON
        const blob = new Blob(chunks);
        const text = await blob.text();
        
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(`Błąd parsowania JSON: ${error.message}`);
        }
    }

    /**
     * Pomocnicza funkcja sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Pobierz konfigurację strategii
     */
    getConfig() {
        return {
            ...this.options,
            isAvailable: this.isAvailable()
        };
    }

    /**
     * Debug strategii
     */
    debug() {
        console.group('🔍 Debug File Loading Strategy');
        console.log('⚙️ Konfiguracja:', this.getConfig());
        console.log('🌐 Protokół:', window.location.protocol);
        console.log('📍 Base URL:', window.location.origin);
        console.groupEnd();
    }
}