/**
 * ModuleLoader - Modularny system ładowania ES6
 * Wersja refaktoryzowana z obsługą ES6 modules
 */

import { MODULE_CONFIG } from './module-config.js';

/**
 * Główna klasa ModuleLoader
 */
export class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.dependencies = new Map();
        this.initQueue = [];
        this.isInitialized = false;
        this.loadingStats = {
            total: 0,
            loaded: 0,
            failed: 0
        };
        
        console.log('🔧 ModuleLoader (ES6) utworzony');
    }

    /**
     * Rejestracja modułu z zależnościami
     */
    register(name, dependencies = [], initFunction = null) {
        this.dependencies.set(name, {
            deps: dependencies,
            init: initFunction,
            loaded: false
        });
        
        console.log(`📝 Zarejestrowano moduł: ${name}`);
    }

    /**
     * Ładowanie pojedynczego modułu
     */
    async loadModule(moduleName, retries = MODULE_CONFIG.loading.retries) {
        // Sprawdź czy już załadowany
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        // Sprawdź czy już się ładuje
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        const loadPromise = this._loadModuleInternal(moduleName, retries);
        this.loadingPromises.set(moduleName, loadPromise);

        try {
            const module = await loadPromise;
            this.loadedModules.set(moduleName, module);
            this.loadingPromises.delete(moduleName);
            this.loadingStats.loaded++;
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            this.loadingStats.failed++;
            throw error;
        }
    }

    /**
     * Wewnętrzna implementacja ładowania modułu
     */
    async _loadModuleInternal(moduleName, retries) {
        const moduleConfig = this.getModuleConfig(moduleName);
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Załaduj zależności najpierw
                if (moduleConfig.dependencies?.length > 0) {
                    await this.loadModules(moduleConfig.dependencies);
                }

                // Załaduj sam moduł
                let module;
                if (moduleConfig.type === 'es6') {
                    module = await this._loadES6Module(moduleConfig.path);
                } else {
                    module = await this._loadLegacyScript(moduleConfig.path);
                }
                
                // Inicjalizacja jeśli potrzebna
                if (moduleConfig.init && typeof window[moduleConfig.init] === 'function') {
                    await window[moduleConfig.init]();
                }

                console.log(`✅ Załadowano moduł: ${moduleName} (${moduleConfig.type})`);
                return module;

            } catch (error) {
                console.warn(`❌ Próba ${attempt}/${retries} ładowania ${moduleName} nieudana:`, error);
                
                if (attempt === retries) {
                    const errorMsg = `Nie udało się załadować modułu ${moduleName}: ${error.message}`;
                    
                    if (moduleConfig.essential) {
                        throw new Error(`[KRYTYCZNY] ${errorMsg}`);
                    } else {
                        console.warn(`[OPCJONALNY] ${errorMsg}`);
                        return null; // Zwróć null dla opcjonalnych modułów
                    }
                }

                // Opóźnienie przed kolejną próbą
                await this._delay(MODULE_CONFIG.loading.retryDelay * attempt);
            }
        }
    }

    /**
     * Ładowanie modułu ES6
     */
    async _loadES6Module(path) {
        try {
            console.log(`📦 Ładuję moduł ES6: ${path}`);
            const module = await import(path);
            return module;
        } catch (error) {
            throw new Error(`Błąd ładowania modułu ES6 ${path}: ${error.message}`);
        }
    }

    /**
     * Ładowanie tradycyjnego skryptu
     */
    async _loadLegacyScript(src) {
        return new Promise((resolve, reject) => {
            // Sprawdź czy skrypt już istnieje
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve(existing);
                return;
            }

            console.log(`📜 Ładuję legacy script: ${src}`);

            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            
            const timeout = setTimeout(() => {
                document.head.removeChild(script);
                reject(new Error(`Timeout ładowania skryptu: ${src}`));
            }, MODULE_CONFIG.loading.timeout);

            script.onload = () => {
                clearTimeout(timeout);
                resolve(script);
            };

            script.onerror = () => {
                clearTimeout(timeout);
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
                reject(new Error(`Błąd ładowania skryptu: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Ładowanie wielu modułów
     */
    async loadModules(moduleNames) {
        if (MODULE_CONFIG.loading.parallel) {
            // Ładowanie równoległe
            const promises = moduleNames.map(name => this.loadModule(name));
            return Promise.all(promises);
        } else {
            // Ładowanie sekwencyjne
            const results = [];
            for (const name of moduleNames) {
                results.push(await this.loadModule(name));
            }
            return results;
        }
    }

    /**
     * Pobieranie konfiguracji modułu
     */
    getModuleConfig(moduleName) {
        const config = MODULE_CONFIG.modules[moduleName];
        
        if (!config) {
            throw new Error(`Nieznany moduł: ${moduleName}`);
        }

        return config;
    }

    /**
     * Inicjalizacja aplikacji z ładowaniem modułów grup
     */
    async initializeApp() {
        if (this.isInitialized) {
            console.warn('⚠️ Aplikacja już zainicjalizowana');
            return;
        }

        console.log('🚀 Rozpoczynam inicjalizację aplikacji...');

        try {
            const groups = MODULE_CONFIG.loadingGroups;
            const progressSteps = MODULE_CONFIG.progressSteps;
            
            // Oblicz całkowitą liczbę modułów
            this.loadingStats.total = Object.values(groups).flat().length;

            // Ładuj grupy sekwencyjnie
            for (const [groupName, modules] of Object.entries(groups)) {
                const message = MODULE_CONFIG.messages[groupName] || `Ładowanie ${groupName}...`;
                const progress = progressSteps[groupName] || 50;
                
                this._showLoadingProgress(message, progress);
                
                console.log(`📦 Ładuję grupę: ${groupName} (${modules.length} modułów)`);
                
                try {
                    await this.loadModules(modules);
                    console.log(`✅ Grupa ${groupName} załadowana pomyślnie`);
                } catch (error) {
                    console.error(`❌ Błąd ładowania grupy ${groupName}:`, error);
                    
                    // Sprawdź czy grupa zawiera krytyczne moduły
                    const hasEssential = modules.some(moduleName => {
                        const config = MODULE_CONFIG.modules[moduleName];
                        return config && config.essential;
                    });
                    
                    if (hasEssential) {
                        throw error; // Przerwij jeśli grupa ma krytyczne moduły
                    } else {
                        console.warn(`⚠️ Kontynuuję pomimo błędów w grupie ${groupName}`);
                    }
                }
            }

            // Finalna inicjalizacja
            await this._finalizeInitialization();
            
            this.isInitialized = true;
            console.log('✅ Aplikacja zainicjalizowana pomyślnie');

        } catch (error) {
            console.error('❌ Błąd inicjalizacji aplikacji:', error);
            this._showError('Błąd ładowania aplikacji: ' + error.message);
            throw error;
        }
    }

    /**
     * Finalna inicjalizacja
     */
    async _finalizeInitialization() {
        this._showLoadingProgress(MODULE_CONFIG.messages.finalization, 95);
        
        // Ukryj loading screen z opóźnieniem
        await this._delay(500);
        this._hideLoadingScreen();
        
        // Trigger app ready event
        window.dispatchEvent(new CustomEvent('appReady', {
            detail: { 
                modules: Array.from(this.loadedModules.keys()),
                stats: this.loadingStats
            }
        }));
        
        this._showLoadingProgress(MODULE_CONFIG.messages.complete, 100);
    }

    /**
     * Aktualizacja postępu ładowania
     */
    _showLoadingProgress(message, percent) {
        const messageEl = document.getElementById('loading-message');
        const progressEl = document.querySelector('.loading-progress');

        if (messageEl) {
            messageEl.textContent = message;
        }

        if (progressEl) {
            progressEl.style.width = `${percent}%`;
        } else {
            this._createProgressBar(percent);
        }
        
        console.log(`📊 Progress: ${percent}% - ${message}`);
    }

    /**
     * Tworzenie paska postępu
     */
    _createProgressBar(percent) {
        const loadingContent = document.querySelector('.loading-content');
        if (!loadingContent) return;

        let progressContainer = loadingContent.querySelector('.loading-progress-container');
        
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.className = 'loading-progress-container';
            progressContainer.style.cssText = `
                width: 200px;
                height: 4px;
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
                margin: 20px auto;
                overflow: hidden;
            `;

            const progressBar = document.createElement('div');
            progressBar.className = 'loading-progress';
            progressBar.style.cssText = `
                height: 100%;
                background: #fbbf24;
                border-radius: 2px;
                transition: width 0.3s ease;
                width: ${percent}%;
            `;

            progressContainer.appendChild(progressBar);
            loadingContent.appendChild(progressContainer);
        } else {
            const progressBar = progressContainer.querySelector('.loading-progress');
            if (progressBar) {
                progressBar.style.width = `${percent}%`;
            }
        }
    }

    /**
     * Ukrycie loading screen
     */
    _hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const appContainer = document.getElementById('app');

        if (loadingScreen && appContainer) {
            loadingScreen.style.opacity = '0';
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                appContainer.classList.remove('hidden');
                appContainer.style.display = 'block';
                document.body.classList.remove('loading');
            }, 300);
        }
    }

    /**
     * Pokazanie błędu
     */
    _showError(message) {
        const loadingContent = document.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.innerHTML = `
                <div style="text-align: center; color: #ef4444;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">${message}</h2>
                    <div style="margin-bottom: 1rem;">
                        <p>Załadowane: ${this.loadingStats.loaded}/${this.loadingStats.total}</p>
                        <p>Nieudane: ${this.loadingStats.failed}</p>
                    </div>
                    <button onclick="location.reload()" 
                            style="background: #1e3a8a; color: white; border: none; 
                                   padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                        Odśwież stronę
                    </button>
                </div>
            `;
        }
    }

    /**
     * Delay helper
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Lazy loading dla dodatkowych modułów
     */
    async lazyLoad(moduleName) {
        console.log(`🔄 Lazy loading: ${moduleName}`);
        return this.loadModule(moduleName);
    }

    /**
     * Sprawdzenie czy moduł jest załadowany
     */
    isLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Pobieranie załadowanego modułu
     */
    getModule(moduleName) {
        return this.loadedModules.get(moduleName);
    }

    /**
     * Statystyki ładowania
     */
    getStats() {
        return {
            ...this.loadingStats,
            loading: this.loadingPromises.size,
            initialized: this.isInitialized,
            modules: Array.from(this.loadedModules.keys())
        };
    }

    /**
     * Reset loadera
     */
    reset() {
        this.loadedModules.clear();
        this.loadingPromises.clear();
        this.isInitialized = false;
        this.loadingStats = { total: 0, loaded: 0, failed: 0 };
        console.log('🔄 ModuleLoader zresetowany');
    }

    /**
     * Czyszczenie zasobów
     */
    cleanup() {
        this.reset();
        console.log('🧹 ModuleLoader wyczyszczony');
    }
}

// Singleton instance
let moduleLoaderInstance = null;

export function getModuleLoader() {
    if (!moduleLoaderInstance) {
        moduleLoaderInstance = new ModuleLoader();
    }
    return moduleLoaderInstance;
}

// Export jako domyślny
export default ModuleLoader;

// Zachowanie kompatybilności z poprzednią wersją
if (typeof window !== 'undefined') {
    window.ModuleLoader = ModuleLoader;
    window.getModuleLoader = getModuleLoader;
    window.moduleLoader = getModuleLoader();
    console.log('✅ ModuleLoader (ES6) dostępny globalnie dla kompatybilności');
}