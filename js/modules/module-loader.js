/**
 * ModuleLoader - Dynamiczne ładowanie modułów aplikacji
 * Zapewnia asynchroniczne ładowanie i inicjalizację komponentów
 */

class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.dependencies = new Map();
        this.initQueue = [];
        this.isInitialized = false;
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
    }

    /**
     * Ładowanie pojedynczego modułu
     */
    async loadModule(moduleName, retries = 3) {
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
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }

    /**
     * Wewnętrzna implementacja ładowania
     */
    async _loadModuleInternal(moduleName, retries) {
        const moduleConfig = this.getModuleConfig(moduleName);
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Załaduj zależności
                if (moduleConfig.dependencies?.length > 0) {
                    await this.loadModules(moduleConfig.dependencies);
                }

                // Załaduj sam moduł
                const module = await this._loadScript(moduleConfig.path);
                
                // Inicjalizacja jeśli potrzebna
                if (moduleConfig.init && typeof window[moduleConfig.init] === 'function') {
                    await window[moduleConfig.init]();
                }

                console.log(`✅ Załadowano moduł: ${moduleName}`);
                return module;

            } catch (error) {
                console.warn(`❌ Próba ${attempt}/${retries} ładowania ${moduleName} nieudana:`, error);
                
                if (attempt === retries) {
                    throw new Error(`Nie udało się załadować modułu ${moduleName}: ${error.message}`);
                }

                // Opóźnienie przed kolejną próbą
                await this._delay(500 * attempt);
            }
        }
    }

    /**
     * Ładowanie wielu modułów równolegle
     */
    async loadModules(moduleNames) {
        const promises = moduleNames.map(name => this.loadModule(name));
        return Promise.all(promises);
    }

    /**
     * Ładowanie skryptu
     */
    _loadScript(src) {
        return new Promise((resolve, reject) => {
            // Sprawdź czy skrypt już istnieje
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve(existing);
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            
            script.onload = () => {
                resolve(script);
            };

            script.onerror = () => {
                document.head.removeChild(script);
                reject(new Error(`Nie udało się załadować skryptu: ${src}`));
            };

            // Timeout dla ładowania
            const timeout = setTimeout(() => {
                document.head.removeChild(script);
                reject(new Error(`Timeout ładowania skryptu: ${src}`));
            }, 10000);

            script.onload = () => {
                clearTimeout(timeout);
                resolve(script);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Konfiguracja modułów
     */
    getModuleConfig(moduleName) {
        const configs = {
            // Core modules
            'utils': {
                path: 'js/utils/utils.js',
                dependencies: [],
                init: null
            },
            'storage-manager': {
                path: 'js/utils/storage-manager.js',
                dependencies: [],
                init: null
            },
            'notification-manager': {
                path: 'js/utils/notification-manager.js',
                dependencies: [],
                init: null
            },

            // Main modules
            'data-loader': {
                path: 'js/modules/data-loader.js',
                dependencies: ['utils', 'storage-manager'],
                init: null
            },
            'theme-manager': {
                path: 'js/modules/theme-manager.js',
                dependencies: ['storage-manager', 'notification-manager'],
                init: null
            },
            'audio-manager': {
                path: 'js/modules/audio-manager.js',
                dependencies: ['notification-manager'],
                init: null
            },
            'image-manager': {
                path: 'js/modules/image-manager.js',
                dependencies: ['storage-manager', 'notification-manager'],
                init: null
            },
            'progress-manager': {
                path: 'js/modules/progress-manager.js',
                dependencies: ['storage-manager', 'notification-manager'],
                init: null
            },
            'flashcard-manager': {
                path: 'js/modules/flashcard-manager.js',
                dependencies: ['audio-manager', 'image-manager'],
                init: null
            },
            'quiz-manager': {
                path: 'js/modules/quiz-manager.js',
                dependencies: ['utils', 'storage-manager', 'notification-manager'],
                init: null
            },

            // App core
            'app': {
                path: 'js/app.js',
                dependencies: [
                    'utils', 'storage-manager', 'notification-manager',
                    'data-loader', 'theme-manager', 'audio-manager',
                    'image-manager', 'progress-manager', 'flashcard-manager',
                    'quiz-manager'
                ],
                init: 'initApp'
            }
        };

        if (!configs[moduleName]) {
            throw new Error(`Nieznany moduł: ${moduleName}`);
        }

        return configs[moduleName];
    }

    /**
     * Inicjalizacja aplikacji z ładowaniem modułów
     */
    async initializeApp() {
        if (this.isInitialized) {
            console.warn('Aplikacja już zainicjalizowana');
            return;
        }

        console.log('🚀 Rozpoczynam inicjalizację aplikacji...');

        try {
            // Pokaż loading screen
            this._showLoadingProgress('Ładowanie core modules...', 10);

            // Załaduj podstawowe moduły
            await this.loadModules(['utils', 'storage-manager', 'notification-manager']);
            this._showLoadingProgress('Ładowanie managers...', 40);

            // Załaduj menedżery
            await this.loadModules([
                'data-loader', 'theme-manager', 'audio-manager', 
                'image-manager', 'progress-manager'
            ]);
            this._showLoadingProgress('Ładowanie UI modules...', 70);

            // Załaduj komponenty UI
            await this.loadModules(['flashcard-manager', 'quiz-manager']);
            this._showLoadingProgress('Inicjalizacja aplikacji...', 90);

            // Finalna inicjalizacja
            await this._finalizeInitialization();
            this._showLoadingProgress('Gotowe!', 100);

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
        // Ukryj loading screen
        await this._delay(500);
        this._hideLoadingScreen();

        // Trigger app start event
        window.dispatchEvent(new CustomEvent('appReady', {
            detail: { modules: Array.from(this.loadedModules.keys()) }
        }));
    }

    /**
     * Aktualizacja progressu ładowania
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
            // Stwórz pasek progressu jeśli nie istnieje
            const loadingContent = document.querySelector('.loading-content');
            if (loadingContent) {
                const progressContainer = document.createElement('div');
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
            loaded: this.loadedModules.size,
            loading: this.loadingPromises.size,
            failed: this.failedModules?.size || 0,
            initialized: this.isInitialized
        };
    }
}

// Singleton instance
let moduleLoaderInstance = null;

function getModuleLoader() {
    if (!moduleLoaderInstance) {
        moduleLoaderInstance = new ModuleLoader();
    }
    return moduleLoaderInstance;
}

// Global access
if (typeof window !== 'undefined') {
    window.ModuleLoader = ModuleLoader;
    window.getModuleLoader = getModuleLoader;
    window.moduleLoader = getModuleLoader();
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModuleLoader, getModuleLoader };
}