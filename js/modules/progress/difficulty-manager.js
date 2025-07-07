/**
 * DifficultyManager - Zarządzanie poziomami trudności słów
 * Odpowiedzialny wyłącznie za ustawianie i pobieranie poziomów trudności
 */
class DifficultyManager {
    constructor(storageAdapter) {
        this.storage = storageAdapter;
        this.vocabulary = null;
        
        // Klucz storage
        this.difficultyKey = 'difficulty';
        
        // Dostępne poziomy trudności
        this.levels = ['easy', 'medium', 'hard'];
        this.defaultLevel = 'medium';
        
        // Walidatory
        this.validators = {
            difficulty: (data) => typeof data === 'object' && data !== null,
            word: (word) => this.validateWord(word),
            level: (level) => this.levels.includes(level)
        };
        
        // Ustawienia
        this.settings = {
            autoCleanup: true, // Automatyczne czyszczenie nieistniejących słów
            logChanges: false  // Czy logować zmiany trudności (można wyłączyć dla performance)
        };
    }

    /**
     * Ustawienie słownictwa
     */
    setVocabulary(vocabulary) {
        if (!vocabulary || !vocabulary.categories) {
            console.error('❌ Nieprawidłowa struktura słownictwa');
            return false;
        }

        this.vocabulary = vocabulary;
        console.log(`📚 DifficultyManager: załadowano słownictwo`);
        
        // Automatyczne czyszczenie nieistniejących poziomów trudności
        if (this.settings.autoCleanup) {
            this.cleanupInvalidDifficulties();
        }
        
        return true;
    }

    /**
     * Przełączanie poziomu trudności słowa (cyklicznie)
     */
    toggleWordDifficulty(word) {
        if (!this.validators.word(word)) {
            console.error('❌ Nieprawidłowe słowo:', word);
            return null;
        }

        const wordKey = this.generateWordKey(word);
        const difficulties = this.loadDifficulties();
        
        // Pobierz aktualny poziom
        const currentLevel = this.getWordDifficulty(word);
        
        // Oblicz następny poziom (cyklicznie)
        const currentIndex = this.levels.indexOf(currentLevel);
        const nextIndex = (currentIndex + 1) % this.levels.length;
        const newLevel = this.levels[nextIndex];
        
        // Zapisz nowy poziom
        difficulties[wordKey] = newLevel;
        this.saveDifficulties(difficulties);
        
        if (this.settings.logChanges) {
            console.log(`⭐ Trudność "${word.english}": ${currentLevel} → ${newLevel}`);
        }
        
        // Emit event dla UI
        this.emitDifficultyChangeEvent(word, currentLevel, newLevel, wordKey);
        
        return newLevel;
    }

    /**
     * Ustawienie konkretnego poziomu trudności
     */
    setWordDifficulty(word, level) {
        if (!this.validators.word(word)) {
            console.error('❌ Nieprawidłowe słowo:', word);
            return false;
        }

        if (!this.validators.level(level)) {
            console.error(`❌ Nieprawidłowy poziom trudności: ${level}`);
            return false;
        }

        const wordKey = this.generateWordKey(word);
        const difficulties = this.loadDifficulties();
        const oldLevel = this.getWordDifficulty(word);
        
        // Zapisz nowy poziom
        difficulties[wordKey] = level;
        this.saveDifficulties(difficulties);
        
        if (this.settings.logChanges) {
            console.log(`⭐ Ustawiono "${word.english}" na ${level}`);
        }
        
        // Emit event dla UI
        this.emitDifficultyChangeEvent(word, oldLevel, level, wordKey);
        
        return true;
    }

    /**
     * Pobieranie poziomu trudności słowa
     */
    getWordDifficulty(word) {
        if (!this.validators.word(word)) {
            return this.defaultLevel;
        }

        const wordKey = this.generateWordKey(word);
        const difficulties = this.loadDifficulties();
        
        // Zwróć custom trudność lub domyślną z słowa lub globalnie domyślną
        return difficulties[wordKey] || word.difficulty || this.defaultLevel;
    }

    /**
     * Sprawdzanie czy słowo ma ustawioną custom trudność
     */
    hasCustomDifficulty(word) {
        if (!this.validators.word(word)) {
            return false;
        }

        const wordKey = this.generateWordKey(word);
        const difficulties = this.loadDifficulties();
        
        return difficulties.hasOwnProperty(wordKey);
    }

    /**
     * Usuwanie custom trudności (powrót do domyślnej)
     */
    resetWordDifficulty(word) {
        if (!this.validators.word(word)) {
            return false;
        }

        const wordKey = this.generateWordKey(word);
        const difficulties = this.loadDifficulties();
        
        if (difficulties.hasOwnProperty(wordKey)) {
            const oldLevel = difficulties[wordKey];
            delete difficulties[wordKey];
            this.saveDifficulties(difficulties);
            
            const newLevel = word.difficulty || this.defaultLevel;
            
            if (this.settings.logChanges) {
                console.log(`🔄 Reset trudności "${word.english}": ${oldLevel} → ${newLevel} (domyślna)`);
            }
            
            // Emit event dla UI
            this.emitDifficultyChangeEvent(word, oldLevel, newLevel, wordKey);
            
            return true;
        }
        
        return false;
    }

    /**
     * Pobieranie wszystkich słów z określonym poziomem trudności
     */
    getAllWordsByDifficultyLevel(difficultyLevel) {
        if (!this.validators.level(difficultyLevel)) {
            console.error(`❌ Nieprawidłowy poziom trudności: ${difficultyLevel}`);
            return [];
        }

        if (!this.vocabulary) {
            console.warn('⚠️ Brak załadowanego słownictwa');
            return [];
        }

        const words = [];
        const customDifficulties = this.loadDifficulties();
        
        Object.entries(this.vocabulary.categories).forEach(([categoryKey, category]) => {
            if (category.words && Array.isArray(category.words)) {
                category.words.forEach((word, index) => {
                    const actualDifficulty = this.getWordDifficulty(word);
                    
                    if (actualDifficulty === difficultyLevel) {
                        words.push({
                            ...word,
                            categoryKey: categoryKey,
                            categoryName: category.name,
                            categoryIcon: category.icon || '📚',
                            wordIndex: index,
                            currentDifficulty: actualDifficulty,
                            isCustomDifficulty: this.hasCustomDifficulty(word),
                            wordKey: this.generateWordKey(word)
                        });
                    }
                });
            }
        });
        
        return words;
    }

    /**
     * Statystyki poziomów trudności
     */
    getDifficultyStats() {
        if (!this.vocabulary) {
            return { easy: 0, medium: 0, hard: 0, total: 0, customCount: 0 };
        }

        const stats = {
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0,
            customCount: 0
        };

        const customDifficulties = this.loadDifficulties();
        stats.customCount = Object.keys(customDifficulties).length;
        
        // Przejdź przez wszystkie słowa
        Object.values(this.vocabulary.categories).forEach(category => {
            if (category.words && Array.isArray(category.words)) {
                category.words.forEach(word => {
                    const difficulty = this.getWordDifficulty(word);
                    
                    if (stats.hasOwnProperty(difficulty)) {
                        stats[difficulty]++;
                        stats.total++;
                    }
                });
            }
        });
        
        return stats;
    }

    /**
     * Analiza rozkładu trudności według kategorii
     */
    getDifficultyByCategory() {
        if (!this.vocabulary) {
            return {};
        }

        const categoryStats = {};
        
        Object.entries(this.vocabulary.categories).forEach(([categoryKey, category]) => {
            if (category.words && Array.isArray(category.words)) {
                categoryStats[categoryKey] = {
                    categoryName: category.name,
                    easy: 0,
                    medium: 0,
                    hard: 0,
                    total: 0,
                    customCount: 0
                };
                
                category.words.forEach(word => {
                    const difficulty = this.getWordDifficulty(word);
                    const isCustom = this.hasCustomDifficulty(word);
                    
                    if (categoryStats[categoryKey].hasOwnProperty(difficulty)) {
                        categoryStats[categoryKey][difficulty]++;
                        categoryStats[categoryKey].total++;
                        
                        if (isCustom) {
                            categoryStats[categoryKey].customCount++;
                        }
                    }
                });
            }
        });
        
        return categoryStats;
    }

    /**
     * Reset wszystkich custom trudności
     */
    resetAllDifficulties() {
        const difficulties = this.loadDifficulties();
        const resetCount = Object.keys(difficulties).length;
        
        this.saveDifficulties({});
        
        console.log(`🔄 Zresetowano ${resetCount} custom poziomów trudności`);
        return resetCount;
    }

    /**
     * Bulk ustawianie trudności dla wielu słów
     */
    setMultipleWordsDifficulty(words, level) {
        if (!Array.isArray(words) || !this.validators.level(level)) {
            return false;
        }

        const difficulties = this.loadDifficulties();
        let updatedCount = 0;
        
        words.forEach(word => {
            if (this.validators.word(word)) {
                const wordKey = this.generateWordKey(word);
                difficulties[wordKey] = level;
                updatedCount++;
            }
        });
        
        if (updatedCount > 0) {
            this.saveDifficulties(difficulties);
            console.log(`⭐ Ustawiono poziom ${level} dla ${updatedCount} słów`);
        }
        
        return updatedCount;
    }

    /**
     * Prywatne metody pomocnicze
     */

    /**
     * Generowanie klucza słowa
     */
    generateWordKey(word) {
        return `${word.english.toLowerCase().trim()}-${word.polish.toLowerCase().trim()}`;
    }

    /**
     * Walidacja słowa
     */
    validateWord(word) {
        return (
            word &&
            typeof word === 'object' &&
            typeof word.english === 'string' &&
            typeof word.polish === 'string' &&
            word.english.trim().length > 0 &&
            word.polish.trim().length > 0
        );
    }

    /**
     * Emit event o zmianie trudności
     */
    emitDifficultyChangeEvent(word, oldDifficulty, newDifficulty, wordKey) {
        if (typeof window !== 'undefined' && window.document) {
            const event = new CustomEvent('wordDifficultyChanged', {
                detail: {
                    word: word,
                    oldDifficulty: oldDifficulty,
                    newDifficulty: newDifficulty,
                    wordKey: wordKey,
                    timestamp: new Date().toISOString()
                }
            });
            
            document.dispatchEvent(event);
        }
    }

    /**
     * Czyszczenie nieistniejących trudności
     */
    cleanupInvalidDifficulties() {
        if (!this.vocabulary) return;
        
        const difficulties = this.loadDifficulties();
        const validWordKeys = this.getAllValidWordKeys();
        const invalidKeys = Object.keys(difficulties).filter(wordKey => !validWordKeys.has(wordKey));
        
        if (invalidKeys.length > 0) {
            invalidKeys.forEach(key => {
                delete difficulties[key];
            });
            
            this.saveDifficulties(difficulties);
            console.log(`🧹 Wyczyszczono ${invalidKeys.length} nieważnych poziomów trudności`);
        }
    }

    /**
     * Pobieranie wszystkich ważnych kluczy słów
     */
    getAllValidWordKeys() {
        const validKeys = new Set();
        
        if (this.vocabulary && this.vocabulary.categories) {
            Object.values(this.vocabulary.categories).forEach(category => {
                if (category.words && Array.isArray(category.words)) {
                    category.words.forEach(word => {
                        if (this.validators.word(word)) {
                            validKeys.add(this.generateWordKey(word));
                        }
                    });
                }
            });
        }
        
        return validKeys;
    }

    /**
     * Operacje na storage
     */
    loadDifficulties() {
        return this.storage.load(this.difficultyKey, {}, {
            validate: this.validators.difficulty,
            silent: true
        });
    }

    saveDifficulties(difficulties) {
        return this.storage.save(this.difficultyKey, difficulties, {
            validate: this.validators.difficulty,
            silent: true
        });
    }

    /**
     * Export/Import
     */
    exportDifficulties() {
        const difficulties = this.loadDifficulties();
        const stats = this.getDifficultyStats();
        
        return {
            metadata: {
                exportDate: new Date().toISOString(),
                customDifficulties: Object.keys(difficulties).length,
                totalWords: stats.total,
                version: '2.0.0'
            },
            difficulties: difficulties,
            statistics: stats
        };
    }

    importDifficulties(importData) {
        try {
            if (!importData || !importData.difficulties || typeof importData.difficulties !== 'object') {
                throw new Error('Nieprawidłowy format danych import');
            }
            
            // Waliduj każdy poziom trudności
            const difficulties = importData.difficulties;
            const validDifficulties = {};
            let validCount = 0;
            
            Object.entries(difficulties).forEach(([wordKey, level]) => {
                if (typeof wordKey === 'string' && this.validators.level(level)) {
                    validDifficulties[wordKey] = level;
                    validCount++;
                }
            });
            
            // Zapisz zwalidowane trudności
            this.saveDifficulties(validDifficulties);
            
            console.log(`✅ Zaimportowano ${validCount} poziomów trudności`);
            return {
                success: true,
                imported: validCount,
                total: Object.keys(difficulties).length
            };
            
        } catch (error) {
            console.error('❌ Błąd importu trudności:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Konfiguracja ustawień
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('⚙️ Zaktualizowano ustawienia DifficultyManager');
    }

    getSettings() {
        return { ...this.settings };
    }

    /**
     * Diagnostyka
     */
    getDiagnostics() {
        const difficulties = this.loadDifficulties();
        const stats = this.getDifficultyStats();
        const categoryStats = this.getDifficultyByCategory();
        
        return {
            difficultyData: {
                customCount: Object.keys(difficulties).length,
                levels: this.levels,
                defaultLevel: this.defaultLevel
            },
            vocabularyData: {
                loaded: !!this.vocabulary,
                validWordKeys: this.vocabulary ? this.getAllValidWordKeys().size : 0
            },
            statistics: stats,
            categoryBreakdown: categoryStats,
            settings: this.settings,
            storageInfo: {
                dataExists: this.storage.exists(this.difficultyKey),
                storageKey: this.difficultyKey
            }
        };
    }

    /**
     * Metody do testowania i debugowania
     */
    
    /**
     * Test pełnego cyklu trudności dla słowa
     */
    testDifficultyCycle(word) {
        if (!this.validators.word(word)) {
            return null;
        }

        const results = [];
        let currentLevel = this.getWordDifficulty(word);
        results.push({ step: 0, level: currentLevel, action: 'initial' });
        
        // Test 3 zmian (pełny cykl)
        for (let i = 1; i <= 3; i++) {
            const newLevel = this.toggleWordDifficulty(word);
            results.push({ 
                step: i, 
                level: newLevel, 
                action: 'toggle',
                previous: currentLevel 
            });
            currentLevel = newLevel;
        }
        
        return results;
    }

    /**
     * Randomly assign difficulties (for testing)
     */
    randomlyAssignDifficulties(percentage = 0.1) {
        if (!this.vocabulary) return;
        
        const allWords = [];
        Object.entries(this.vocabulary.categories).forEach(([categoryKey, category]) => {
            if (category.words && Array.isArray(category.words)) {
                category.words.forEach(word => {
                    if (this.validators.word(word)) {
                        allWords.push(word);
                    }
                });
            }
        });
        
        const wordsToAssign = Math.floor(allWords.length * percentage);
        const shuffled = allWords.sort(() => 0.5 - Math.random());
        const selectedWords = shuffled.slice(0, wordsToAssign);
        
        const difficulties = this.loadDifficulties();
        let assignedCount = 0;
        
        selectedWords.forEach(word => {
            const randomLevel = this.levels[Math.floor(Math.random() * this.levels.length)];
            const wordKey = this.generateWordKey(word);
            difficulties[wordKey] = randomLevel;
            assignedCount++;
        });
        
        this.saveDifficulties(difficulties);
        console.log(`🎲 Losowo przypisano trudności do ${assignedCount} słów`);
        
        return assignedCount;
    }
}

// Export dla ES6 modules
export { DifficultyManager };

// Export default dla wygody
export default DifficultyManager;

console.log('✅ DifficultyManager załadowany');