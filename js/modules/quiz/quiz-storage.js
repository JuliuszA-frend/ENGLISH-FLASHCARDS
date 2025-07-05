/**
 * QuizStorage - Zarządzanie zapisywania/ładowania wyników quizów
 */
class QuizStorage {
    constructor() {
        this.storageKey = 'english-flashcards-quiz-results';
        this.usedQuestionsKey = 'english-flashcards-used-questions';
        this.debugMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.allResults = {};
        
        this.verifyStorageKey();
        this.loadAllResults();
    }

    /**
     * Weryfikacja klucza localStorage
     */
    verifyStorageKey() {
        console.log(`🔑 QuizStorage używa klucza: "${this.storageKey}"`);
        
        // Sprawdź czy nie ma danych pod alternatywnymi kluczami
        const alternativeKeys = [
            'quiz-results',
            'english-flashcards-quizzes',
            'flashcards-quiz-results',
            'quiz-data'
        ];
        
        alternativeKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                console.warn(`⚠️ Znaleziono dane pod alternatywnym kluczem: "${key}"`);
                console.log(`📦 Dane: ${data.substring(0, 100)}...`);
            }
        });
        
        // Sprawdź wszystkie klucze w localStorage
        const allKeys = Object.keys(localStorage);
        const quizRelatedKeys = allKeys.filter(key => 
            key.toLowerCase().includes('quiz') || 
            key.toLowerCase().includes('result')
        );
        
        if (quizRelatedKeys.length > 0) {
            console.log(`🔍 Klucze związane z quizami w localStorage:`, quizRelatedKeys);
        }
    }

    /**
     * Ładowanie wszystkich wyników z localStorage
     */
    loadAllResults() {
        try {
            const existingResults = this.loadQuizResults();
            this.allResults = existingResults;
            
            const resultsCount = Object.keys(this.allResults).length;
            
            if (this.debugMode) {
                console.group('🎯 QuizStorage - Inicjalizacja wyników');
                console.log(`📊 Załadowano ${resultsCount} typów quizów z localStorage`);
                console.log('🔑 Klucze wyników:', Object.keys(this.allResults));
                console.groupEnd();
            }
        } catch (error) {
            console.error('❌ Błąd inicjalizacji wyników quizów:', error);
            this.allResults = {};
        }
    }

    /**
     * Zapisywanie wyników quizu
     */
    saveQuizResults(results) {
        console.group('💾 QuizStorage - Zapis wyników');
        
        try {
            if (!results || !results.quizType || !results.category) {
                console.error('❌ Nieprawidłowe dane wyników:', results);
                return false;
            }
            
            const key = `${results.quizType}_${results.category}`;
            console.log(`🔑 Klucz zapisu: "${key}"`);
            
            // Modyfikuj bezpośrednio stan w pamięci
            if (!this.allResults[key]) {
                this.allResults[key] = [];
            }
            
            this.allResults[key].push(results);
            
            // Przycinanie do 10 ostatnich wyników
            if (this.allResults[key].length > 10) {
                this.allResults[key] = this.allResults[key].slice(-10);
            }
            
            // Zapisz cały obiekt do localStorage
            const dataToSave = JSON.stringify(this.allResults);
            localStorage.setItem(this.storageKey, dataToSave);
            
            console.log(`✅ Zapisano stan z ${Object.keys(this.allResults).length} kluczami do localStorage.`);
            
            // Weryfikacja zapisu
            const verification = localStorage.getItem(this.storageKey);
            if (!verification || verification.length !== dataToSave.length) {
                console.error(`❌ BŁĄD: Weryfikacja zapisu w localStorage nie powiodła się!`);
                return false;
            }
            
            // Wyślij event o zapisaniu
            document.dispatchEvent(new CustomEvent('quizResultsSaved', { detail: { key, results } }));
            
            console.groupEnd();
            return true;
            
        } catch (error) {
            console.error('💥 KRYTYCZNY BŁĄD zapisywania wyników quizu:', error);
            console.groupEnd();
            return false;
        }
    }

    /**
     * Ładowanie wyników quizów
     */
    loadQuizResults() {
        console.group('📚 QuizStorage - Ładowanie wyników');
        
        try {
            console.log(`🔑 Ładuję z klucza: "${this.storageKey}"`);
            
            // Sprawdź dostępność localStorage
            if (typeof Storage === 'undefined') {
                console.error('❌ localStorage nie jest dostępne w tej przeglądarce');
                console.groupEnd();
                return {};
            }
            
            // Sprawdź wszystkie klucze w localStorage
            const allKeys = Object.keys(localStorage);
            console.log(`🗂️ Wszystkie klucze w localStorage: [${allKeys.join(', ')}]`);
            
            const quizKeys = allKeys.filter(key => key.includes('quiz') || key.includes('result'));
            if (quizKeys.length > 0) {
                console.log(`🎯 Klucze związane z quizami: [${quizKeys.join(', ')}]`);
            }
            
            // Pobierz dane
            const saved = localStorage.getItem(this.storageKey);
            
            if (!saved) {
                console.log(`📭 Brak danych pod kluczem "${this.storageKey}"`);
                console.log(`🔍 Sprawdzam localStorage.length: ${localStorage.length}`);
                
                // Test localStorage
                const testKey = 'test-' + Date.now();
                const testValue = 'test-value';
                
                try {
                    localStorage.setItem(testKey, testValue);
                    const testResult = localStorage.getItem(testKey);
                    localStorage.removeItem(testKey);
                    
                    if (testResult === testValue) {
                        console.log(`✅ localStorage działa poprawnie (test passed)`);
                    } else {
                        console.error(`❌ localStorage test failed: expected "${testValue}", got "${testResult}"`);
                    }
                } catch (testError) {
                    console.error(`❌ localStorage test error:`, testError);
                }
                
                console.groupEnd();
                return {};
            }
            
            console.log(`📦 Rozmiar pobranych danych: ${saved.length} znaków`);
            console.log(`📄 Pierwsze 200 znaków:`, saved.substring(0, 200));
            
            // Parsuj dane
            const parsed = JSON.parse(saved);
            const keys = Object.keys(parsed);
            
            console.log(`🔑 Znajdowane klucze w danych: [${keys.join(', ')}]`);
            console.log(`📊 Liczba kategorii z wynikami: ${keys.length}`);
            
            // Szczegóły każdego klucza
            keys.forEach(key => {
                const results = parsed[key];
                if (Array.isArray(results)) {
                    console.log(`📋 ${key}: ${results.length} wyników, najnowszy: ${results[results.length - 1]?.completedAt || 'brak daty'}`);
                } else {
                    console.warn(`⚠️ ${key}: nieprawidłowy format (nie jest tablicą)`);
                }
            });
            
            console.log(`✅ Ładowanie zakończone sukcesem`);
            console.groupEnd();
            return parsed;
            
        } catch (error) {
            console.error('💥 KRYTYCZNY BŁĄD ładowania wyników quizów:', error);
            console.error('📋 Stack trace:', error.stack);
            console.groupEnd();
            return {};
        }
    }

    /**
     * Pobranie wyników dla konkretnej kategorii
     */
    getCategoryResults(category, quizType = 'category') {
        try {
            const key = `${quizType}_${category}`;
            const results = this.allResults[key] || [];
            
            if (results.length === 0) {
                return null;
            }
            
            // Zwróć najlepszy wynik
            return results.reduce((best, current) => 
                current.score > best.score ? current : best
            );
        } catch (error) {
            console.error(`❌ Błąd pobierania wyników dla kategorii "${category}":`, error);
            return null;
        }
    }

    /**
     * Statystyki ogólne
     */
    getOverallStats(vocabulary) {
        let totalQuizzes = 0;
        let totalScore = 0;
        let totalPossible = 0;
        let completedCategories = 0;

        Object.entries(this.allResults).forEach(([key, results]) => {
            if (Array.isArray(results) && results.length > 0) {
                // Znajdź najlepszy wynik dla każdego klucza
                const bestResult = results.reduce((best, current) => 
                    current.score > best.score ? current : best
                );

                totalQuizzes++;
                totalScore += bestResult.score;
                totalPossible += bestResult.total;

                // Sprawdź czy kategoria zaliczona
                if (bestResult.passed && key.startsWith('category')) {
                    completedCategories++;
                }
            }
        });

        const averageScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

        return {
            totalQuizzes,
            averageScore,
            completedCategories,
            totalCategories: Object.keys(vocabulary?.categories || {}).length
        };
    }

    /**
     * Liczba ukończonych kategorii
     */
    getCompletedCategoriesCount() {
        let count = 0;

        Object.entries(this.allResults).forEach(([key, results]) => {
            if (key.startsWith('category') && Array.isArray(results) && results.length > 0) {
                const bestResult = results.reduce((best, current) => 
                    current.score > best.score ? current : best
                );
                if (bestResult.passed) {
                    count++;
                }
            }
        });

        return count;
    }

    /**
     * Export danych
     */
    exportData() {
        return {
            quizResults: this.allResults,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Import danych
     */
    importData(data) {
        if (data.quizResults) {
            this.allResults = data.quizResults;
            localStorage.setItem(this.storageKey, JSON.stringify(this.allResults));
            return true;
        }
        return false;
    }

    /**
     * Reset wszystkich danych
     */
    reset() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.usedQuestionsKey);
        this.allResults = {};
        return true;
    }

    /**
     * Pobranie wszystkich wyników (getter)
     */
    get results() {
        return this.allResults;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizStorage;
}