/**
 * QuizTypes - Zarządzanie różnymi typami quizów
 */

class QuizTypes {
    constructor(vocabulary, questionGenerator, storage) {
        this.vocabulary = vocabulary;
        this.questionGenerator = questionGenerator;
        this.storage = storage;
        
        this.types = {
            CATEGORY: 'category',
            RANDOM: 'random',
            BOOKMARKS: 'bookmarks',
            FINAL: 'final',
            SPEED: 'speed',
            SPELLING: 'spelling',
            MIXED_CATEGORIES: 'mixed',
            HARD_WORDS: 'hard_words',
            EASY_WORDS: 'easy_words',
            PROGRESSIVE: 'progressive',
            ADAPTIVE: 'adaptive'
        };
    }

    /**
     * Rozpoczęcie quizu kategorii
     */
    startCategoryQuiz(categoryKey) {
        if (!this.vocabulary || !this.vocabulary.categories[categoryKey]) {
            return { success: false, error: 'Nie można uruchomić quizu - brak danych' };
        }

        const category = this.vocabulary.categories[categoryKey];
        const questions = this.questionGenerator.generateCategoryQuestions(categoryKey, 15);

        if (questions.length === 0) {
            return { success: false, error: 'Brak dostępnych pytań dla tej kategorii' };
        }

        const quiz = {
            type: this.types.CATEGORY,
            category: categoryKey,
            categoryName: category.name,
            totalQuestions: questions.length,
            passScore: 12,
            timeLimit: null,
            questions: questions
        };

        return { success: true, quiz: quiz };
    }

    /**
     * Rozpoczęcie losowego quizu
     */
    startRandomQuiz() {
        const questions = this.questionGenerator.generateRandomQuestions(20);
        
        if (questions.length === 0) {
            return { success: false, error: 'Brak dostępnych pytań' };
        }

        const quiz = {
            type: this.types.RANDOM,
            category: 'mixed',
            categoryName: 'Quiz losowy',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.7), // 70%
            timeLimit: null,
            questions: questions
        };

        return { success: true, quiz: quiz };
    }

    /**
     * Rozpoczęcie quizu z powtórek
     */
    startBookmarksQuiz(app) {
        const bookmarkedWords = app.managers.progress.getAllBookmarkedWords();
    
        if (bookmarkedWords.length < 3) {
            return { success: false, error: 'Potrzebujesz co najmniej 3 słowa do powtórki' };
        }

        const questions = this.questionGenerator.generateQuestionsFromWords(
            bookmarkedWords, 
            Math.min(15, bookmarkedWords.length)
        );

        const quiz = {
            type: this.types.BOOKMARKS,
            category: 'bookmarks',
            categoryName: 'Quiz z powtórek',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.7), // 70%
            timeLimit: null,
            questions: questions
        };

        return { success: true, quiz: quiz };
    }

    /**
     * Quiz szybki - 10 pytań, 10 sekund na pytanie
     */
    startSpeedQuiz() {
        const questions = this.questionGenerator.generateRandomQuestions(10);
        
        const quiz = {
            type: this.types.SPEED,
            category: 'speed',
            categoryName: 'Quiz błyskawiczny',
            totalQuestions: questions.length,
            passScore: 7,
            timeLimit: 10, // 10 sekund na pytanie
            isSpeed: true,
            questions: questions
        };

        return { success: true, quiz: quiz };
    }

    /**
     * Quiz z wybranych kategorii
     */
    startMixedCategoriesQuiz(selectedCategories) {
        console.log(`🎯 QuizTypes: Uruchamiam quiz z kategorii:`, selectedCategories);
        
        if (!selectedCategories || selectedCategories.length < 2) {
            return { success: false, error: 'Wybierz co najmniej 2 kategorie' };
        }
        
        // Sprawdź czy kategorie istnieją
        const validCategories = selectedCategories.filter(key => 
            this.vocabulary.categories[key]
        );
        
        if (validCategories.length < 2) {
            return { success: false, error: 'Błąd: nieprawidłowe kategorie' };
        }
        
        // Generuj pytania z wybranych kategorii
        const questions = this.questionGenerator.generateMixedCategoryQuestions(validCategories, 20);
        
        if (questions.length === 0) {
            return { success: false, error: 'Brak dostępnych pytań z wybranych kategorii' };
        }
        
        // Przygotuj informacje o quizie
        const categoryNames = validCategories.map(key => 
            this.vocabulary.categories[key].name
        );
        
        const quiz = {
            type: this.types.MIXED_CATEGORIES,
            category: 'mixed',
            categoryName: `Quiz mieszany (${categoryNames.length} kategorii)`,
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.7), // 70%
            timeLimit: null,
            selectedCategories: validCategories,
            categoryNames: categoryNames,
            questions: questions
        };
        
        console.log(`✅ Quiz mieszany przygotowany: ${questions.length} pytań`);
        
        return { success: true, quiz: quiz };
    }

    /**
     * Rozpoczęcie quizu końcowego
     */
    startFinalQuiz() {
        const completedCategories = this.storage.getCompletedCategoriesCount();
        const totalCategories = Object.keys(this.vocabulary.categories).length;
        
        if (completedCategories < Math.ceil(totalCategories * 0.75)) {
            return { 
                success: false, 
                error: `Musisz ukończyć co najmniej ${Math.ceil(totalCategories * 0.75)} kategorii, aby odblokować quiz końcowy` 
            };
        }

        const questions = this.questionGenerator.generateFinalQuizQuestions(50);

        const quiz = {
            type: this.types.FINAL,
            category: 'final',
            categoryName: 'Quiz końcowy',
            totalQuestions: questions.length,
            passScore: 42,
            timeLimit: 3600, // 60 minut
            questions: questions
        };

        return { success: true, quiz: quiz };
    }

    /**
     * Quiz z trudnych słów
     */
    startHardWordsQuiz(app) {
        const hardWords = this.getWordsByDifficulty('hard', app);
        
        if (hardWords.length < 5) {
            return { success: false, error: 'Musisz oznaczyć więcej słów jako trudne (⭐⭐⭐)' };
        }

        const questions = this.questionGenerator.generateQuestionsFromWords(
            hardWords, 
            Math.min(15, hardWords.length)
        );

        const quiz = {
            type: this.types.HARD_WORDS,
            category: 'hard_words',
            categoryName: 'Quiz trudnych słów',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.6), // 60% - trudniejszy próg
            timeLimit: null,
            description: 'Słowa oznaczone jako trudne (⭐⭐⭐)',
            questions: questions
        };

        return { success: true, quiz: quiz };
    }

    /**
     * Quiz z łatwych słów
     */
    startEasyWordsQuiz(app) {
        const easyWords = this.getWordsByDifficulty('easy', app);
        
        if (easyWords.length < 5) {
            return { success: false, error: 'Musisz oznaczyć więcej słów jako łatwe (⭐)' };
        }

        const questions = this.questionGenerator.generateQuestionsFromWords(
            easyWords, 
            Math.min(20, easyWords.length)
        );

        const quiz = {
            type: this.types.EASY_WORDS,
            category: 'easy_words', 
            categoryName: 'Quiz łatwych słów',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.8), // 80% - wyższy próg dla łatwych
            timeLimit: null,
            description: 'Słowa oznaczone jako łatwe (⭐)',
            questions: questions
        };

        return { success: true, quiz: quiz };
    }

    /**
     * Quiz progresywny (łatwe → średnie → trudne)
     */
    startProgressiveQuiz(app) {
        const easyWords = this.getWordsByDifficulty('easy', app).slice(0, 5);
        const mediumWords = this.getWordsByDifficulty('medium', app).slice(0, 8);
        const hardWords = this.getWordsByDifficulty('hard', app).slice(0, 7);
        
        const allWords = [...easyWords, ...mediumWords, ...hardWords];
        
        if (allWords.length < 10) {
            return { success: false, error: 'Potrzebujesz więcej słów z różnymi poziomami trudności' };
        }

        // NIE mieszaj - zachowaj kolejność łatwe→trudne
        const questions = this.questionGenerator.generateQuestionsFromWords(allWords, allWords.length, false);

        const quiz = {
            type: this.types.PROGRESSIVE,
            category: 'progressive',
            categoryName: 'Quiz progresywny',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.7),
            timeLimit: null,
            description: 'Od łatwych do trudnych słów',
            isProgressive: true,
            questions: questions
        };

        return { success: true, quiz: quiz };
    }

    /**
     * Quiz adaptacyjny
     */
    startAdaptiveQuiz(app) {
        const adaptiveWords = this.getAdaptiveWords(app);
        
        if (adaptiveWords.length < 10) {
            return { success: false, error: 'Potrzebujesz więcej danych do quizu adaptacyjnego' };
        }

        const questions = this.questionGenerator.generateQuestionsFromWords(adaptiveWords, 15);

        const quiz = {
            type: this.types.ADAPTIVE,
            category: 'adaptive',
            categoryName: 'Quiz adaptacyjny',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.75),
            timeLimit: null,
            description: 'Dostosowany do Twojego poziomu',
            isAdaptive: true,
            questions: questions
        };

        return { success: true, quiz: quiz };
    }

    /**
     * Pobieranie słów według poziomu trudności
     */
    getWordsByDifficulty(difficultyLevel, app) {
        if (!app.managers.progress) {
            console.error('❌ ProgressManager nie jest dostępny');
            return [];
        }

        const allWords = this.getAllWords();
        const wordsWithDifficulty = [];

        allWords.forEach(word => {
            const wordDifficulty = app.managers.progress.getWordDifficulty(word);
            if (wordDifficulty === difficultyLevel) {
                wordsWithDifficulty.push({
                    ...word,
                    userDifficulty: wordDifficulty
                });
            }
        });

        console.log(`🎯 Znaleziono ${wordsWithDifficulty.length} słów z trudnością: ${difficultyLevel}`);
        return wordsWithDifficulty;
    }

    /**
     * Inteligentny dobór słów dla quizu adaptacyjnego
     */
    getAdaptiveWords(app) {
        const progressManager = app.managers.progress;
        if (!progressManager) return [];

        // Pobierz statystyki trudności użytkownika
        const difficultyStats = progressManager.getDifficultyStats();
        const allWords = this.getAllWords();
        
        console.log('📊 Statystyki trudności:', difficultyStats);

        // Strategia adaptacyjna:
        // - Jeśli użytkownik ma dużo trudnych słów → więcej średnich
        // - Jeśli ma dużo łatwych → więcej średnich i trudnych
        // - Balansuj na podstawie postępów
        
        let easyCount, mediumCount, hardCount;
        
        if (difficultyStats.hard > difficultyStats.easy) {
            // Użytkownik ma dużo trudnych słów - daj mu przewagę łatwych/średnich
            easyCount = 6;
            mediumCount = 7;
            hardCount = 2;
        } else if (difficultyStats.easy > difficultyStats.hard * 2) {
            // Użytkownik ma dużo łatwych - czas na wyzwanie
            easyCount = 3;
            mediumCount = 6;
            hardCount = 6;
        } else {
            // Zbalansowany mix
            easyCount = 5;
            mediumCount = 5;
            hardCount = 5;
        }

        const adaptiveWords = [
            ...this.getWordsByDifficulty('easy', app).slice(0, easyCount),
            ...this.getWordsByDifficulty('medium', app).slice(0, mediumCount),
            ...this.getWordsByDifficulty('hard', app).slice(0, hardCount)
        ];

        console.log(`🎯 Quiz adaptacyjny: ${easyCount} łatwych, ${mediumCount} średnich, ${hardCount} trudnych`);
        return Utils.shuffle(adaptiveWords);
    }

    /**
     * Statystyki trudności dla UI
     */
    getDifficultyQuizStats(app) {
        if (!app.managers.progress) return null;
        
        const stats = app.managers.progress.getDifficultyStats();
        
        console.log('🎯 Statystyki dla UI quizów trudności:', stats);
        
        return {
            easy: stats.easy,
            medium: stats.medium, 
            hard: stats.hard,
            total: stats.total,
            hasEnoughForHardQuiz: stats.hard >= 5,
            hasEnoughForEasyQuiz: stats.easy >= 5,
            hasEnoughForProgressive: stats.easy >= 3 && stats.medium >= 3 && stats.hard >= 3,
            hasEnoughForAdaptive: stats.total >= 10
        };
    }

    /**
     * Pobranie wszystkich słów
     */
    getAllWords() {
        const words = [];
        
        Object.entries(this.vocabulary.categories).forEach(([categoryKey, category]) => {
            category.words.forEach(word => {
                words.push({
                    ...word,
                    category: categoryKey
                });
            });
        });

        return words;
    }

    /**
     * Sprawdzenie czy można uruchomić dany typ quizu
     */
    canStartQuiz(quizType, app) {
        switch (quizType) {
            case this.types.CATEGORY:
                return true; // Zawsze dostępny jeśli są kategorie
            
            case this.types.RANDOM:
                return this.getAllWords().length > 0;
            
            case this.types.BOOKMARKS:
                return app.managers.progress.getAllBookmarkedWords().length >= 3;
            
            case this.types.FINAL:
                const completedCategories = this.storage.getCompletedCategoriesCount();
                const totalCategories = Object.keys(this.vocabulary.categories).length;
                return completedCategories >= Math.ceil(totalCategories * 0.75);
            
            case this.types.SPEED:
                return this.getAllWords().length >= 10;
            
            case this.types.HARD_WORDS:
                return this.getWordsByDifficulty('hard', app).length >= 5;
            
            case this.types.EASY_WORDS:
                return this.getWordsByDifficulty('easy', app).length >= 5;
            
            case this.types.PROGRESSIVE:
                const stats = app.managers.progress.getDifficultyStats();
                return stats.easy >= 3 && stats.medium >= 3 && stats.hard >= 3;
            
            case this.types.ADAPTIVE:
                return app.managers.progress.getDifficultyStats().total >= 10;
            
            default:
                return false;
        }
    }

    /**
     * Pobranie informacji o quizie (bez uruchamiania)
     */
    getQuizInfo(quizType, categoryKey = null) {
        const baseInfo = {
            type: quizType,
            available: false,
            requirements: '',
            description: ''
        };

        switch (quizType) {
            case this.types.CATEGORY:
                if (categoryKey && this.vocabulary.categories[categoryKey]) {
                    const category = this.vocabulary.categories[categoryKey];
                    return {
                        ...baseInfo,
                        name: category.name,
                        available: true,
                        questionsCount: 15,
                        passScore: 12,
                        description: `Quiz z kategorii: ${category.name}`
                    };
                }
                break;
            
            case this.types.RANDOM:
                return {
                    ...baseInfo,
                    name: 'Quiz losowy',
                    available: true,
                    questionsCount: 20,
                    passScore: 14,
                    description: 'Losowe słowa ze wszystkich kategorii'
                };
            
            case this.types.SPEED:
                return {
                    ...baseInfo,
                    name: 'Quiz błyskawiczny',
                    available: true,
                    questionsCount: 10,
                    passScore: 7,
                    timeLimit: 10,
                    description: '10 pytań, 10 sekund na pytanie'
                };
        }

        return baseInfo;
    }
}


// Export dla ES6 modules
export { QuizTypes };

// Export default dla wygody
export default QuizTypes;

console.log('✅ QuizTypes załadowany');