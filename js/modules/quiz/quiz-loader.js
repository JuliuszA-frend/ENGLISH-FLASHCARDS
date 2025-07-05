/**
 * QuizLoader - Inicjalizacja i ładowanie modułów quizu
 * Zapewnia poprawną kolejność ładowania i dostępność wszystkich klas
 */

class QuizLoader {
    constructor() {
        this.modulesLoaded = {
            QuizTimer: false,
            QuizStorage: false,
            QuestionGenerator: false,
            AnswerChecker: false,
            QuizUI: false,
            QuizTypes: false,
            QuizManager: false
        };
        this.loadingPromise = null;
    }

    /**
     * Główna metoda ładowania wszystkich modułów
     */
    async loadAllModules() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._loadModulesSequentially();
        return this.loadingPromise;
    }

    /**
     * Sekwencyjne ładowanie modułów w odpowiedniej kolejności
     */
    async _loadModulesSequentially() {
        console.group('🔄 QuizLoader: Rozpoczynam ładowanie modułów quizu');

        try {
            // Sprawdź czy wszystkie klasy są już dostępne
            if (this.checkAllModulesAvailable()) {
                console.log('✅ Wszystkie moduły quizu już dostępne');
                this.markAllAsLoaded();
                console.groupEnd();
                return true;
            }

            // Ładowanie w kolejności zależności
            const loadingSteps = [
                { name: 'QuizTimer', check: () => typeof QuizTimer !== 'undefined' },
                { name: 'QuizStorage', check: () => typeof QuizStorage !== 'undefined' },
                { name: 'QuestionGenerator', check: () => typeof QuestionGenerator !== 'undefined' },
                { name: 'AnswerChecker', check: () => typeof AnswerChecker !== 'undefined' },
                { name: 'QuizUI', check: () => typeof QuizUI !== 'undefined' },
                { name: 'QuizTypes', check: () => typeof QuizTypes !== 'undefined' },
                { name: 'QuizManager', check: () => typeof QuizManager !== 'undefined' }
            ];

            for (const step of loadingSteps) {
                if (step.check()) {
                    console.log(`✅ ${step.name} - już załadowany`);
                    this.modulesLoaded[step.name] = true;
                } else {
                    console.warn(`⚠️ ${step.name} - nie jest dostępny`);
                    // W rzeczywistej implementacji tutaj byłoby dynamiczne ładowanie
                    // Na potrzeby tego przykładu zakładamy, że skrypty są już załączone
                }
            }

            // Sprawdź końcowy stan
            const allLoaded = this.checkAllModulesLoaded();
            
            if (allLoaded) {
                console.log('🎉 Wszystkie moduły quizu załadowane pomyślnie!');
                this.validateModules();
            } else {
                console.error('❌ Niektóre moduły nie zostały załadowane:', this.getMissingModules());
            }

            console.groupEnd();
            return allLoaded;

        } catch (error) {
            console.error('💥 Błąd podczas ładowania modułów quizu:', error);
            console.groupEnd();
            return false;
        }
    }

    /**
     * Sprawdzenie czy wszystkie moduły są dostępne
     */
    checkAllModulesAvailable() {
        return typeof QuizTimer !== 'undefined' &&
               typeof QuizStorage !== 'undefined' &&
               typeof QuestionGenerator !== 'undefined' &&
               typeof AnswerChecker !== 'undefined' &&
               typeof QuizUI !== 'undefined' &&
               typeof QuizTypes !== 'undefined' &&
               typeof QuizManager !== 'undefined';
    }

    /**
     * Sprawdzenie czy wszystkie moduły zostały oznaczone jako załadowane
     */
    checkAllModulesLoaded() {
        return Object.values(this.modulesLoaded).every(loaded => loaded === true);
    }

    /**
     * Oznaczenie wszystkich modułów jako załadowane
     */
    markAllAsLoaded() {
        Object.keys(this.modulesLoaded).forEach(module => {
            this.modulesLoaded[module] = true;
        });
    }

    /**
     * Pobranie listy brakujących modułów
     */
    getMissingModules() {
        return Object.entries(this.modulesLoaded)
            .filter(([module, loaded]) => !loaded)
            .map(([module, loaded]) => module);
    }

    /**
     * Walidacja załadowanych modułów
     */
    validateModules() {
        console.group('🔍 Walidacja modułów quizu');

        const validations = [
            {
                name: 'QuizTimer',
                test: () => {
                    const timer = new QuizTimer();
                    return typeof timer.start === 'function' && 
                           typeof timer.stop === 'function';
                }
            },
            {
                name: 'QuizStorage',
                test: () => {
                    const storage = new QuizStorage();
                    return typeof storage.saveQuizResults === 'function' && 
                           typeof storage.loadQuizResults === 'function';
                }
            },
            {
                name: 'QuestionGenerator',
                test: () => {
                    const generator = new QuestionGenerator();
                    return typeof generator.generateCategoryQuestions === 'function';
                }
            },
            {
                name: 'AnswerChecker',
                test: () => {
                    const checker = new AnswerChecker();
                    return typeof checker.checkAnswer === 'function';
                }
            },
            {
                name: 'QuizUI',
                test: () => {
                    const ui = new QuizUI();
                    return typeof ui.displayQuestion === 'function' && 
                           typeof ui.showQuizResults === 'function';
                }
            },
            {
                name: 'QuizManager',
                test: () => {
                    const manager = new QuizManager();
                    return typeof manager.startCategoryQuiz === 'function' && 
                           typeof manager.submitAnswer === 'function';
                }
            }
        ];

        let allValid = true;

        validations.forEach(validation => {
            try {
                const isValid = validation.test();
                if (isValid) {
                    console.log(`✅ ${validation.name} - walidacja przeszła`);
                } else {
                    console.error(`❌ ${validation.name} - walidacja nie powiodła się`);
                    allValid = false;
                }
            } catch (error) {
                console.error(`💥 ${validation.name} - błąd walidacji:`, error);
                allValid = false;
            }
        });

        if (allValid) {
            console.log('🎉 Wszystkie moduły przeszły walidację!');
        } else {
            console.error('❌ Niektóre moduły nie przeszły walidacji');
        }

        console.groupEnd();
        return allValid;
    }

    /**
     * Tworzenie instancji QuizManager po załadowaniu wszystkich modułów
     */
    async createQuizManager() {
        const allLoaded = await this.loadAllModules();
        
        if (!allLoaded) {
            throw new Error('Nie można utworzyć QuizManager - brakuje modułów');
        }

        console.log('🏗️ Tworzę instancję QuizManager...');
        const quizManager = new QuizManager();
        
        console.log('✅ QuizManager utworzony pomyślnie');
        return quizManager;
    }

    /**
     * Status ładowania modułów
     */
    getLoadingStatus() {
        const total = Object.keys(this.modulesLoaded).length;
        const loaded = Object.values(this.modulesLoaded).filter(Boolean).length;
        
        return {
            total: total,
            loaded: loaded,
            percentage: Math.round((loaded / total) * 100),
            complete: loaded === total,
            missing: this.getMissingModules(),
            details: this.modulesLoaded
        };
    }

    /**
     * Informacje diagnostyczne
     */
    getDiagnostics() {
        const status = this.getLoadingStatus();
        
        return {
            timestamp: new Date().toISOString(),
            loadingStatus: status,
            globalClasses: {
                QuizTimer: typeof QuizTimer !== 'undefined',
                QuizStorage: typeof QuizStorage !== 'undefined',
                QuestionGenerator: typeof QuestionGenerator !== 'undefined',
                AnswerChecker: typeof AnswerChecker !== 'undefined',
                QuizUI: typeof QuizUI !== 'undefined',
                QuizTypes: typeof QuizTypes !== 'undefined',
                QuizManager: typeof QuizManager !== 'undefined'
            },
            recommendations: this.getRecommendations()
        };
    }

    /**
     * Rekomendacje na podstawie stanu ładowania
     */
    getRecommendations() {
        const recommendations = [];
        const missing = this.getMissingModules();

        if (missing.length > 0) {
            recommendations.push(`Załaduj brakujące moduły: ${missing.join(', ')}`);
            recommendations.push('Sprawdź kolejność ładowania skryptów w HTML');
            recommendations.push('Upewnij się, że wszystkie pliki .js są dostępne');
        }

        if (this.checkAllModulesLoaded()) {
            recommendations.push('Wszystkie moduły załadowane - możesz używać QuizManager');
        }

        return recommendations;
    }

    /**
     * Reset stanu loadera
     */
    reset() {
        Object.keys(this.modulesLoaded).forEach(module => {
            this.modulesLoaded[module] = false;
        });
        this.loadingPromise = null;
        console.log('🔄 QuizLoader zresetowany');
    }
}

// Singleton pattern dla QuizLoader
let quizLoaderInstance = null;

/**
 * Pobranie instancji QuizLoader
 */
function getQuizLoader() {
    if (!quizLoaderInstance) {
        quizLoaderInstance = new QuizLoader();
    }
    return quizLoaderInstance;
}

/**
 * Funkcja pomocnicza do szybkiego ładowania QuizManager
 */
async function loadQuizManager() {
    try {
        const loader = getQuizLoader();
        const quizManager = await loader.createQuizManager();
        return quizManager;
    } catch (error) {
        console.error('❌ Błąd ładowania QuizManager:', error);
        throw error;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuizLoader, getQuizLoader, loadQuizManager };
}

// Globalne dostępność
if (typeof window !== 'undefined') {
    window.QuizLoader = QuizLoader;
    window.getQuizLoader = getQuizLoader;
    window.loadQuizManager = loadQuizManager;
    
    // Debug tools
    window.checkQuizModules = () => {
        const loader = getQuizLoader();
        const diagnostics = loader.getDiagnostics();
        console.group('🔍 Diagnostyka modułów quizu');
        console.table(diagnostics.globalClasses);
        console.log('📊 Status ładowania:', diagnostics.loadingStatus);
        console.log('💡 Rekomendacje:', diagnostics.recommendations);
        console.groupEnd();
        return diagnostics;
    };
}

console.log('✅ QuizLoader załadowany i gotowy do użycia');
console.log('💡 Użyj window.checkQuizModules() aby sprawdzić stan modułów');