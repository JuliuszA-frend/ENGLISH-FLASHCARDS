/**
 * Vocabulary Validator
 * Walidacja struktur danych słownictwa
 */

export class VocabularyValidator {
    constructor(options = {}) {
        this.options = {
            strict: false, // Tryb ścisły - wszystkie pola wymagane
            logErrors: true,
            throwOnError: true,
            ...options
        };
        
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Główna metoda walidacji słownictwa
     */
    validate(vocabulary) {
        this.reset();
        
        console.log('🔍 Rozpoczynam walidację słownictwa...');
        
        try {
            // Podstawowa struktura
            this.validateBasicStructure(vocabulary);
            
            // Metadata
            this.validateMetadata(vocabulary.metadata);
            
            // Kategorie
            this.validateCategories(vocabulary.categories);
            
            // Podsumowanie
            this.logValidationResults();
            
            if (this.errors.length > 0 && this.options.throwOnError) {
                throw new Error(`Walidacja nie powiodła się: ${this.errors.length} błędów`);
            }
            
            return {
                valid: this.errors.length === 0,
                errors: this.errors,
                warnings: this.warnings,
                summary: this.getValidationSummary(vocabulary)
            };
            
        } catch (error) {
            this.addError('critical', 'Krytyczny błąd walidacji', error.message);
            
            if (this.options.throwOnError) {
                throw error;
            }
            
            return {
                valid: false,
                errors: this.errors,
                warnings: this.warnings,
                criticalError: error.message
            };
        }
    }

    /**
     * Walidacja podstawowej struktury
     */
    validateBasicStructure(vocabulary) {
        if (!vocabulary || typeof vocabulary !== 'object') {
            this.addError('structure', 'vocabulary', 'Słownictwo musi być obiektem');
            return;
        }

        if (!vocabulary.categories || typeof vocabulary.categories !== 'object') {
            this.addError('structure', 'categories', 'Brak kategorii w słownictwie');
            return;
        }

        const categoryCount = Object.keys(vocabulary.categories).length;
        if (categoryCount === 0) {
            this.addError('structure', 'categories', 'Słownictwo nie zawiera żadnych kategorii');
        }
    }

    /**
     * Walidacja metadanych
     */
    validateMetadata(metadata) {
        if (!metadata) {
            this.addWarning('metadata', 'missing', 'Brak metadanych słownictwa');
            return;
        }

        // Sprawdź wymagane pola
        const requiredFields = ['version', 'level', 'language'];
        const recommendedFields = ['totalWords', 'totalCategories', 'lastUpdated'];

        requiredFields.forEach(field => {
            if (!metadata[field]) {
                this.addError('metadata', field, `Brak wymaganego pola: ${field}`);
            }
        });

        recommendedFields.forEach(field => {
            if (!metadata[field]) {
                this.addWarning('metadata', field, `Brak zalecanego pola: ${field}`);
            }
        });

        // Walidacja języka
        if (metadata.language) {
            this.validateLanguageConfig(metadata.language);
        }

        // Walidacja liczb
        if (metadata.totalWords && (!Number.isInteger(metadata.totalWords) || metadata.totalWords <= 0)) {
            this.addError('metadata', 'totalWords', 'totalWords musi być dodatnią liczbą całkowitą');
        }

        if (metadata.totalCategories && (!Number.isInteger(metadata.totalCategories) || metadata.totalCategories <= 0)) {
            this.addError('metadata', 'totalCategories', 'totalCategories musi być dodatnią liczbą całkowitą');
        }
    }

    /**
     * Walidacja konfiguracji języka
     */
    validateLanguageConfig(language) {
        if (typeof language !== 'object') {
            this.addError('language', 'structure', 'Konfiguracja języka musi być obiektem');
            return;
        }

        if (!language.source || !language.target) {
            this.addError('language', 'fields', 'Konfiguracja języka musi zawierać source i target');
        }

        // Sprawdź czy języki są różne
        if (language.source === language.target) {
            this.addWarning('language', 'same', 'Język źródłowy i docelowy są takie same');
        }
    }

    /**
     * Walidacja wszystkich kategorii
     */
    validateCategories(categories) {
        const categoryKeys = Object.keys(categories);
        let totalWords = 0;

        console.log(`📂 Walidacja ${categoryKeys.length} kategorii...`);

        categoryKeys.forEach((key, index) => {
            const category = categories[key];
            const categoryWords = this.validateCategory(key, category, index);
            totalWords += categoryWords;
        });

        console.log(`📊 Łącznie zwalidowano ${totalWords} słów w ${categoryKeys.length} kategoriach`);
        return totalWords;
    }

    /**
     * Walidacja pojedynczej kategorii
     */
    validateCategory(key, category, index) {
        if (!category || typeof category !== 'object') {
            this.addError('category', key, 'Kategoria musi być obiektem');
            return 0;
        }

        // Sprawdź wymagane pola kategorii
        if (!category.name) {
            this.addError('category', `${key}.name`, 'Brak nazwy kategorii');
        }

        if (!category.words || !Array.isArray(category.words)) {
            this.addError('category', `${key}.words`, 'Kategoria musi zawierać tablicę słów');
            return 0;
        }

        const wordsCount = category.words.length;
        if (wordsCount === 0) {
            this.addWarning('category', `${key}.words`, 'Kategoria nie zawiera słów');
            return 0;
        }

        // Walidacja słów w kategorii
        const validWords = this.validateWords(key, category.words);

        // Sprawdź czy liczba słów się zgadza
        if (validWords !== wordsCount) {
            this.addWarning('category', `${key}.words`, 
                `Zwalidowano ${validWords}/${wordsCount} słów w kategorii`);
        }

        return validWords;
    }

    /**
     * Walidacja słów w kategorii
     */
    validateWords(categoryKey, words) {
        let validCount = 0;
        const seenWords = new Set();
        const seenIds = new Set();

        words.forEach((word, index) => {
            try {
                this.validateWord(categoryKey, word, index);
                
                // Sprawdź duplikaty
                const wordKey = `${word.english}-${word.polish}`;
                if (seenWords.has(wordKey)) {
                    this.addWarning('word', `${categoryKey}[${index}]`, 
                        `Duplikat słowa: ${word.english}`);
                } else {
                    seenWords.add(wordKey);
                }

                // Sprawdź duplikaty ID
                if (word.id && seenIds.has(word.id)) {
                    this.addWarning('word', `${categoryKey}[${index}]`, 
                        `Duplikat ID: ${word.id}`);
                } else if (word.id) {
                    seenIds.add(word.id);
                }

                validCount++;
            } catch (error) {
                this.addError('word', `${categoryKey}[${index}]`, 
                    `Błąd walidacji słowa: ${error.message}`);
            }
        });

        return validCount;
    }

    /**
     * Walidacja pojedynczego słowa
     */
    validateWord(categoryKey, word, index) {
        const wordPath = `${categoryKey}[${index}]`;

        if (!word || typeof word !== 'object') {
            throw new Error('Słowo musi być obiektem');
        }

        // Wymagane pola
        if (!word.english || typeof word.english !== 'string') {
            this.addError('word', `${wordPath}.english`, 'Brak lub nieprawidłowe angielskie słowo');
        }

        if (!word.polish || typeof word.polish !== 'string') {
            this.addError('word', `${wordPath}.polish`, 'Brak lub nieprawidłowe polskie tłumaczenie');
        }

        // Zalecane pola
        const recommendedFields = ['pronunciation', 'phonetic', 'type', 'difficulty', 'frequency'];
        recommendedFields.forEach(field => {
            if (!word[field] && this.options.strict) {
                this.addWarning('word', `${wordPath}.${field}`, `Brak zalecanego pola: ${field}`);
            }
        });

        // Walidacja przykładów
        if (word.examples) {
            this.validateExamples(wordPath, word.examples);
        }

        // Walidacja poziomu trudności
        if (word.difficulty) {
            this.validateDifficulty(wordPath, word.difficulty);
        }

        // Walidacja częstotliwości
        if (word.frequency) {
            this.validateFrequency(wordPath, word.frequency);
        }

        // Walidacja typu słowa
        if (word.type) {
            this.validateWordType(wordPath, word.type);
        }
    }

    /**
     * Walidacja przykładów użycia
     */
    validateExamples(wordPath, examples) {
        if (typeof examples !== 'object') {
            this.addWarning('examples', `${wordPath}.examples`, 'Przykłady muszą być obiektem');
            return;
        }

        if (!examples.english) {
            this.addWarning('examples', `${wordPath}.examples.english`, 'Brak angielskiego przykładu');
        }

        if (!examples.polish) {
            this.addWarning('examples', `${wordPath}.examples.polish`, 'Brak polskiego przykładu');
        }
    }

    /**
     * Walidacja poziomu trudności
     */
    validateDifficulty(wordPath, difficulty) {
        const validDifficulties = ['easy', 'medium', 'hard'];
        if (!validDifficulties.includes(difficulty)) {
            this.addWarning('difficulty', `${wordPath}.difficulty`, 
                `Nieprawidłowy poziom trudności: ${difficulty}. Dozwolone: ${validDifficulties.join(', ')}`);
        }
    }

    /**
     * Walidacja częstotliwości
     */
    validateFrequency(wordPath, frequency) {
        const validFrequencies = ['low', 'medium', 'high'];
        if (!validFrequencies.includes(frequency)) {
            this.addWarning('frequency', `${wordPath}.frequency`, 
                `Nieprawidłowa częstotliwość: ${frequency}. Dozwolone: ${validFrequencies.join(', ')}`);
        }
    }

    /**
     * Walidacja typu słowa
     */
    validateWordType(wordPath, type) {
        const validTypes = [
            'noun', 'verb', 'adjective', 'adverb', 'pronoun', 
            'preposition', 'conjunction', 'interjection', 'phrase'
        ];
        
        if (!validTypes.includes(type)) {
            this.addWarning('type', `${wordPath}.type`, 
                `Nieprawidłowy typ słowa: ${type}. Przykłady: ${validTypes.slice(0, 5).join(', ')}`);
        }
    }

    /**
     * Dodaj błąd
     */
    addError(category, field, message) {
        const error = {
            category,
            field,
            message,
            type: 'error',
            timestamp: new Date().toISOString()
        };
        
        this.errors.push(error);
        
        if (this.options.logErrors) {
            console.error(`❌ ${category}[${field}]: ${message}`);
        }
    }

    /**
     * Dodaj ostrzeżenie
     */
    addWarning(category, field, message) {
        const warning = {
            category,
            field,
            message,
            type: 'warning',
            timestamp: new Date().toISOString()
        };
        
        this.warnings.push(warning);
        
        if (this.options.logErrors) {
            console.warn(`⚠️ ${category}[${field}]: ${message}`);
        }
    }

    /**
     * Reset walidatora
     */
    reset() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Podsumowanie walidacji
     */
    getValidationSummary(vocabulary) {
        const categories = Object.keys(vocabulary.categories || {});
        let totalWords = 0;
        
        categories.forEach(key => {
            const category = vocabulary.categories[key];
            if (category && category.words) {
                totalWords += category.words.length;
            }
        });

        return {
            totalCategories: categories.length,
            totalWords,
            errorsCount: this.errors.length,
            warningsCount: this.warnings.length,
            isValid: this.errors.length === 0
        };
    }

    /**
     * Logowanie wyników walidacji
     */
    logValidationResults() {
        console.group('📋 Wyniki walidacji słownictwa');
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ Walidacja przeszła pomyślnie - brak błędów i ostrzeżeń');
        } else {
            if (this.errors.length > 0) {
                console.error(`❌ Znaleziono ${this.errors.length} błędów`);
            }
            
            if (this.warnings.length > 0) {
                console.warn(`⚠️ Znaleziono ${this.warnings.length} ostrzeżeń`);
            }
        }
        
        console.groupEnd();
    }

    /**
     * Eksport raportu walidacji
     */
    exportReport() {
        return {
            timestamp: new Date().toISOString(),
            configuration: this.options,
            errors: this.errors,
            warnings: this.warnings,
            summary: {
                totalIssues: this.errors.length + this.warnings.length,
                isValid: this.errors.length === 0,
                hasWarnings: this.warnings.length > 0
            }
        };
    }

    /**
     * Debug walidatora
     */
    debug() {
        console.group('🔍 Debug Vocabulary Validator');
        console.log('⚙️ Konfiguracja:', this.options);
        console.log('📊 Statystyki:', {
            errors: this.errors.length,
            warnings: this.warnings.length
        });
        
        if (this.errors.length > 0) {
            console.log('❌ Błędy:', this.errors);
        }
        
        if (this.warnings.length > 0) {
            console.log('⚠️ Ostrzeżenia:', this.warnings);
        }
        
        console.groupEnd();
    }
}