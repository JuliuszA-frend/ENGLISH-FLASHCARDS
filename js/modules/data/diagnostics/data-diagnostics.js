/**
 * Data Diagnostics
 * Narzędzia diagnostyczne dla systemu ładowania danych
 */

export class DataDiagnostics {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    /**
     * Sprawdź środowisko wykonania
     */
    getEnvironmentInfo() {
        const info = {
            protocol: window.location.protocol,
            host: window.location.host,
            pathname: window.location.pathname,
            isFile: window.location.protocol === 'file:',
            isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
            isSecure: window.location.protocol === 'https:',
            canUseFetch: window.location.protocol !== 'file:',
            userAgent: navigator.userAgent,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };

        return info;
    }

    /**
     * Test dostępności API przeglądarki
     */
    async testBrowserAPIs() {
        const apis = {
            fetch: typeof fetch !== 'undefined',
            localStorage: (() => {
                try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    return true;
                } catch {
                    return false;
                }
            })(),
            sessionStorage: (() => {
                try {
                    sessionStorage.setItem('test', 'test');
                    sessionStorage.removeItem('test');
                    return true;
                } catch {
                    return false;
                }
            })(),
            indexedDB: typeof indexedDB !== 'undefined',
            webWorkers: typeof Worker !== 'undefined',
            serviceWorker: 'serviceWorker' in navigator,
            notifications: 'Notification' in window,
            geolocation: 'geolocation' in navigator
        };

        console.group('🔍 Test API przeglądarki');
        Object.entries(apis).forEach(([api, available]) => {
            console.log(`${available ? '✅' : '❌'} ${api}: ${available}`);
        });
        console.groupEnd();

        return apis;
    }

    /**
     * Test połączenia sieciowego
     */
    async testNetworkConnectivity() {
        const results = {
            online: navigator.onLine,
            tests: []
        };

        const testUrls = [
            { name: 'Google DNS', url: 'https://8.8.8.8/', timeout: 3000 },
            { name: 'Cloudflare', url: 'https://1.1.1.1/', timeout: 3000 },
            { name: 'Local server', url: window.location.origin + '/ping', timeout: 2000 }
        ];

        console.group('🌐 Test połączenia sieciowego');
        console.log(`📡 Navigator.onLine: ${navigator.onLine}`);

        for (const test of testUrls) {
            const result = await this.testSingleConnection(test);
            results.tests.push(result);
            
            console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.success ? result.time + 'ms' : result.error}`);
        }

        console.groupEnd();
        return results;
    }

    /**
     * Test pojedynczego połączenia
     */
    async testSingleConnection({ name, url, timeout }) {
        const startTime = performance.now();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const time = Math.round(performance.now() - startTime);
            
            return { name, url, success: true, time, error: null };
        } catch (error) {
            const time = Math.round(performance.now() - startTime);
            return { 
                name, 
                url, 
                success: false, 
                time, 
                error: error.name === 'AbortError' ? 'Timeout' : error.message 
            };
        }
    }

    /**
     * Test wydajności ładowania danych
     */
    async testDataLoadingPerformance(dataLoader) {
        const tests = [];
        
        console.group('⚡ Test wydajności ładowania danych');

        // Test cache
        const cacheTest = await this.testCachePerformance(dataLoader);
        tests.push(cacheTest);

        // Test ładowania z różnych źródeł
        if (dataLoader.getProtocolInfo().canUseFetch) {
            const fileTest = await this.testFileLoadingPerformance(dataLoader);
            tests.push(fileTest);
        }

        const embeddedTest = await this.testEmbeddedDataPerformance(dataLoader);
        tests.push(embeddedTest);

        console.groupEnd();
        
        return {
            tests,
            summary: this.summarizePerformanceTests(tests)
        };
    }

    /**
     * Test wydajności cache
     */
    async testCachePerformance(dataLoader) {
        const startTime = performance.now();
        
        try {
            // Test zapisu do cache
            const testData = { test: 'data', timestamp: Date.now() };
            dataLoader.cache.set('performance-test', testData);
            
            // Test odczytu z cache
            const retrieved = dataLoader.cache.get('performance-test');
            
            const time = performance.now() - startTime;
            
            // Czyścimy po teście
            dataLoader.cache.delete('performance-test');
            
            const success = retrieved && retrieved.test === 'data';
            
            console.log(`${success ? '✅' : '❌'} Cache performance: ${time.toFixed(2)}ms`);
            
            return {
                name: 'Cache Performance',
                success,
                time: time.toFixed(2),
                details: success ? 'Cache działa poprawnie' : 'Problem z cache'
            };
        } catch (error) {
            const time = performance.now() - startTime;
            console.log(`❌ Cache performance: ${error.message}`);
            
            return {
                name: 'Cache Performance',
                success: false,
                time: time.toFixed(2),
                error: error.message
            };
        }
    }

    /**
     * Test wydajności ładowania z plików
     */
    async testFileLoadingPerformance(dataLoader) {
        const startTime = performance.now();
        
        try {
            // Sprawdź dostępność pliku testowego
            const available = await dataLoader.checkFileAvailability('data/vocabulary.json');
            const time = performance.now() - startTime;
            
            console.log(`${available ? '✅' : '❌'} File loading test: ${time.toFixed(2)}ms`);
            
            return {
                name: 'File Loading Performance',
                success: available,
                time: time.toFixed(2),
                details: available ? 'Pliki dostępne' : 'Pliki niedostępne'
            };
        } catch (error) {
            const time = performance.now() - startTime;
            console.log(`❌ File loading test: ${error.message}`);
            
            return {
                name: 'File Loading Performance',
                success: false,
                time: time.toFixed(2),
                error: error.message
            };
        }
    }

    /**
     * Test wydajności danych wbudowanych
     */
    async testEmbeddedDataPerformance(dataLoader) {
        const startTime = performance.now();
        
        try {
            const data = dataLoader.getEmbeddedVocabulary();
            const time = performance.now() - startTime;
            
            const success = data && data.categories && Object.keys(data.categories).length > 0;
            
            console.log(`${success ? '✅' : '❌'} Embedded data test: ${time.toFixed(2)}ms`);
            
            return {
                name: 'Embedded Data Performance',
                success,
                time: time.toFixed(2),
                details: success ? `${Object.keys(data.categories).length} kategorii` : 'Brak danych'
            };
        } catch (error) {
            const time = performance.now() - startTime;
            console.log(`❌ Embedded data test: ${error.message}`);
            
            return {
                name: 'Embedded Data Performance',
                success: false,
                time: time.toFixed(2),
                error: error.message
            };
        }
    }

    /**
     * Podsumowanie testów wydajności
     */
    summarizePerformanceTests(tests) {
        const successful = tests.filter(t => t.success).length;
        const total = tests.length;
        const avgTime = tests.reduce((sum, t) => sum + parseFloat(t.time), 0) / total;
        
        return {
            successful,
            total,
            successRate: ((successful / total) * 100).toFixed(1) + '%',
            averageTime: avgTime.toFixed(2) + 'ms',
            fastest: tests.reduce((min, t) => parseFloat(t.time) < parseFloat(min.time) ? t : min),
            slowest: tests.reduce((max, t) => parseFloat(t.time) > parseFloat(max.time) ? t : max)
        };
    }

    /**
     * Test integrity danych
     */
    async testDataIntegrity(vocabulary) {
        const issues = [];
        
        console.group('🔒 Test integralności danych');

        // Test podstawowej struktury
        if (!vocabulary || typeof vocabulary !== 'object') {
            issues.push('Słownictwo nie jest obiektem');
        }

        if (!vocabulary.categories) {
            issues.push('Brak kategorii');
        } else {
            // Test każdej kategorii
            Object.entries(vocabulary.categories).forEach(([key, category]) => {
                if (!category.name) {
                    issues.push(`Kategoria ${key} nie ma nazwy`);
                }
                
                if (!category.words || !Array.isArray(category.words)) {
                    issues.push(`Kategoria ${key} nie ma słów`);
                } else {
                    // Test każdego słowa
                    category.words.forEach((word, index) => {
                        if (!word.english) {
                            issues.push(`Słowo ${key}[${index}] nie ma angielskiego tłumaczenia`);
                        }
                        if (!word.polish) {
                            issues.push(`Słowo ${key}[${index}] nie ma polskiego tłumaczenia`);
                        }
                    });
                }
            });
        }

        const isValid = issues.length === 0;
        console.log(`${isValid ? '✅' : '❌'} Integralność danych: ${isValid ? 'OK' : issues.length + ' problemów'}`);
        
        if (issues.length > 0) {
            console.warn('🚨 Znalezione problemy:', issues);
        }

        console.groupEnd();

        return {
            valid: isValid,
            issues,
            summary: isValid ? 'Dane są integre' : `Znaleziono ${issues.length} problemów`
        };
    }

    /**
     * Pełna diagnostyka systemu
     */
    async runFullDiagnostics(dataLoader = null) {
        console.group('🔬 Pełna diagnostyka systemu ładowania danych');
        
        const results = {
            timestamp: new Date().toISOString(),
            environment: this.getEnvironmentInfo(),
            browserAPIs: await this.testBrowserAPIs(),
            network: await this.testNetworkConnectivity(),
            overall: {
                status: 'unknown',
                issues: [],
                recommendations: []
            }
        };

        // Dodatkowe testy jeśli DataLoader jest dostępny
        if (dataLoader) {
            results.performance = await this.testDataLoadingPerformance(dataLoader);
            
            // Test danych jeśli są załadowane
            if (dataLoader.cache.has('vocabulary')) {
                const vocabulary = dataLoader.cache.get('vocabulary');
                results.dataIntegrity = await this.testDataIntegrity(vocabulary);
            }
        }

        // Analiza wyników i rekomendacje
        results.overall = this.analyzeResults(results);
        
        console.groupEnd();
        
        this.results.push(results);
        return results;
    }

    /**
     * Analiza wyników i generowanie rekomendacji
     */
    analyzeResults(results) {
        const issues = [];
        const recommendations = [];
        
        // Analiza środowiska
        if (results.environment.isFile) {
            issues.push('Aplikacja uruchomiona z protokołu file://');
            recommendations.push('Uruchom aplikację przez serwer HTTP dla pełnej funkcjonalności');
        }

        if (!results.environment.onLine) {
            issues.push('Brak połączenia sieciowego');
            recommendations.push('Sprawdź połączenie internetowe');
        }

        // Analiza API
        if (!results.browserAPIs.localStorage) {
            issues.push('LocalStorage niedostępne');
            recommendations.push('Sprawdź ustawienia prywatności przeglądarki');
        }

        if (!results.browserAPIs.fetch) {
            issues.push('Fetch API niedostępne');
            recommendations.push('Zaktualizuj przeglądarkę do nowszej wersji');
        }

        // Analiza sieci
        const networkFailures = results.network.tests.filter(t => !t.success).length;
        if (networkFailures > 0) {
            issues.push(`${networkFailures} testów sieciowych nieudanych`);
            recommendations.push('Sprawdź połączenie sieciowe i firewall');
        }

        // Analiza wydajności
        if (results.performance) {
            const successRate = parseFloat(results.performance.summary.successRate);
            if (successRate < 100) {
                issues.push(`Problemy z wydajnością: ${results.performance.summary.successRate} sukces`);
                recommendations.push('Sprawdź konfigurację serwera lub dane wbudowane');
            }
        }

        // Określ status ogólny
        let status = 'healthy';
        if (issues.length > 0) {
            status = issues.length > 2 ? 'critical' : 'warning';
        }

        return {
            status,
            issues,
            recommendations,
            summary: this.generateSummary(status, issues.length)
        };
    }

    /**
     * Generuj podsumowanie
     */
    generateSummary(status, issuesCount) {
        switch (status) {
            case 'healthy':
                return 'System działa poprawnie';
            case 'warning':
                return `System działa z ${issuesCount} ostrzeżeniami`;
            case 'critical':
                return `System ma ${issuesCount} krytycznych problemów`;
            default:
                return 'Status nieznany';
        }
    }

    /**
     * Eksport raportu diagnostycznego
     */
    exportDiagnosticsReport() {
        return {
            generatedAt: new Date().toISOString(),
            version: '1.0.0',
            results: this.results,
            summary: {
                totalTests: this.results.length,
                lastTest: this.results[this.results.length - 1]?.timestamp,
                overallHealth: this.results[this.results.length - 1]?.overall.status
            }
        };
    }

    /**
     * Debug diagnostyki
     */
    debug() {
        console.group('🔍 Debug Data Diagnostics');
        console.log('📊 Liczba testów:', this.results.length);
        
        if (this.results.length > 0) {
            const latest = this.results[this.results.length - 1];
            console.log('📋 Ostatni test:', latest.timestamp);
            console.log('🎯 Status:', latest.overall.status);
            console.log('🚨 Problemy:', latest.overall.issues);
            console.log('💡 Rekomendacje:', latest.overall.recommendations);
        }
        
        console.groupEnd();
    }
}