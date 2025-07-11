/**
 * SentenceSearch - Wyszukiwarka dla fiszek zdaniowych
 * Filtruje słowa z przykładami zdań na podstawie zapytania użytkownika
 */

class SentenceSearch {
    constructor() {
        this.debounceTimer = null;
        this.lastSearchTerm = '';
        this.isSearchActive = false;
        
        console.log('✅ SentenceSearch zainicjalizowana');
    }

    /**
     * 🔍 Główna metoda wyszukiwania z debounce
     * @param {string} searchTerm - Termin wyszukiwania
     * @param {Array} sentenceWords - Tablica słów z przykładami zdań
     * @param {Function} callback - Funkcja zwrotna z wynikami
     * @param {number} debounceDelay - Opóźnienie debounce (domyślnie 300ms)
     */
    search(searchTerm, sentenceWords, callback, debounceDelay = 300) {
        // Wyczyść poprzedni timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Ustaw nowy timer z debounce
        this.debounceTimer = setTimeout(() => {
            const results = this.performSearch(searchTerm, sentenceWords);
            
            // Zapisz ostatnie wyszukiwanie
            this.lastSearchTerm = searchTerm;
            this.isSearchActive = searchTerm.trim().length > 0;
            
            // Wywołaj callback z wynikami
            callback(results, searchTerm);
            
            console.log(`🔍 Wyszukiwanie "${searchTerm}": ${results.length} wyników`);
        }, debounceDelay);
    }

    /**
     * 🎯 Wykonanie wyszukiwania (bez debounce)
     * @param {string} searchTerm - Termin wyszukiwania
     * @param {Array} sentenceWords - Tablica słów z przykładami zdań
     * @returns {Array} - Przefiltrowane słowa
     */
    performSearch(searchTerm, sentenceWords) {
        if (!searchTerm || !searchTerm.trim()) {
            return sentenceWords; // Zwróć wszystkie słowa jeśli brak wyszukiwania
        }

        if (!Array.isArray(sentenceWords)) {
            console.warn('⚠️ sentenceWords nie jest tablicą');
            return [];
        }

        const normalizedSearchTerm = this.normalizeSearchTerm(searchTerm);
        
        const results = sentenceWords.filter(word => {
            return this.matchesWord(word, normalizedSearchTerm);
        });

        return results;
    }

    /**
     * 🧹 Normalizacja terminu wyszukiwania
     * @param {string} term - Termin do normalizacji
     * @returns {string} - Znormalizowany termin
     */
    normalizeSearchTerm(term) {
        return term
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' '); // Zamień wielokrotne spacje na pojedyncze
    }

    /**
     * 🎯 Sprawdzenie czy słowo pasuje do wyszukiwania
     * @param {Object} word - Obiekt słowa
     * @param {string} searchTerm - Znormalizowany termin wyszukiwania
     * @returns {boolean} - Czy słowo pasuje
     */
    matchesWord(word, searchTerm) {
        if (!word || typeof word !== 'object') {
            return false;
        }

        // 1. Sprawdź słowo angielskie
        if (word.english && this.containsText(word.english, searchTerm)) {
            return true;
        }

        // 2. Sprawdź słowo polskie
        if (word.polish && this.containsText(word.polish, searchTerm)) {
            return true;
        }

        // 3. Sprawdź przykłady zdań
        if (word.examples && Array.isArray(word.examples)) {
            return word.examples.some(example => {
                return this.matchesExample(example, searchTerm);
            });
        }

        // 4. Sprawdź stary format examples (object)
        if (word.examples && typeof word.examples === 'object' && !Array.isArray(word.examples)) {
            return this.matchesExample(word.examples, searchTerm);
        }

        return false;
    }

    /**
     * 🎯 Sprawdzenie czy przykład zdania pasuje do wyszukiwania
     * @param {Object} example - Obiekt przykładu
     * @param {string} searchTerm - Znormalizowany termin wyszukiwania
     * @returns {boolean} - Czy przykład pasuje
     */
    matchesExample(example, searchTerm) {
        if (!example || typeof example !== 'object') {
            return false;
        }

        // Sprawdź zdanie angielskie
        if (example.english && this.containsText(example.english, searchTerm)) {
            return true;
        }

        // Sprawdź zdanie polskie
        if (example.polish && this.containsText(example.polish, searchTerm)) {
            return true;
        }

        return false;
    }

    /**
     * 📝 Sprawdzenie czy tekst zawiera wyszukiwany termin
     * @param {string} text - Tekst do przeszukania
     * @param {string} searchTerm - Termin wyszukiwania
     * @returns {boolean} - Czy tekst zawiera termin
     */
    containsText(text, searchTerm) {
        if (typeof text !== 'string' || typeof searchTerm !== 'string') {
            return false;
        }

        const normalizedText = text.toLowerCase();
        return normalizedText.includes(searchTerm);
    }

    /**
     * 🔄 Czyszczenie wyszukiwania
     */
    clear() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        
        this.lastSearchTerm = '';
        this.isSearchActive = false;
        
        console.log('🧹 Wyszukiwanie wyczyszczone');
    }

    /**
     * 📊 Pobieranie stanu wyszukiwarki
     * @returns {Object} - Informacje o stanie
     */
    getState() {
        return {
            lastSearchTerm: this.lastSearchTerm,
            isSearchActive: this.isSearchActive,
            hasDebounceTimer: !!this.debounceTimer
        };
    }

    /**
     * 🧪 Testowanie wyszukiwarki (development only)
     * @param {Array} testWords - Słowa testowe
     * @returns {Object} - Wyniki testów
     */
    runTests(testWords) {
        if (!Array.isArray(testWords) || testWords.length === 0) {
            return { error: 'Brak słów testowych' };
        }

        const tests = [
            { term: 'beautiful', expectedMin: 1 },
            { term: 'piękny', expectedMin: 1 },
            { term: 'eyes', expectedMin: 1 },
            { term: 'oczy', expectedMin: 1 },
            { term: 'xyz123nonexistent', expectedMin: 0 }
        ];

        const results = tests.map(test => {
            const searchResults = this.performSearch(test.term, testWords);
            const passed = searchResults.length >= test.expectedMin;
            
            return {
                term: test.term,
                resultsCount: searchResults.length,
                expectedMin: test.expectedMin,
                passed,
                results: searchResults.slice(0, 2) // Pokaż maksymalnie 2 wyniki
            };
        });

        return {
            totalTests: tests.length,
            passed: results.filter(r => r.passed).length,
            results
        };
    }
}

// 🎯 EXPORT
export default SentenceSearch;