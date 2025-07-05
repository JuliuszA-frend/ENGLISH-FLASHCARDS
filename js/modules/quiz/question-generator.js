/**
 * QuestionGenerator - Generowanie różnych typów pytań quizowych
 */
class QuestionGenerator {
    constructor(vocabulary) {
        this.vocabulary = vocabulary;
        this.difficulty = 'medium';
        this.language = 'en-pl';
    }

    /**
     * Ustawienie słownictwa
     */
    setVocabulary(vocabulary) {
        this.vocabulary = vocabulary;
    }

    /**
     * Ustawienie poziomu trudności
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    /**
     * Ustawienie języka
     */
    setLanguage(language) {
        this.language = language;
    }

    /**
     * Generowanie pytań dla kategorii
     */
    generateCategoryQuestions(categoryKey, count) {
        const category = this.vocabulary.categories[categoryKey];
        if (!category || !category.words) return [];

        const words = [...category.words];
        const questions = [];

        // Mieszaj słowa
        const shuffledWords = Utils.shuffle(words).slice(0, count);

        shuffledWords.forEach(word => {
            const questionType = this.selectQuestionType();
            const direction = this.selectQuestionDirection();
            
            const question = this.createQuestion(word, questionType, direction, categoryKey);
            if (question) {
                questions.push(question);
            }
        });

        return questions;
    }

    /**
     * Generowanie losowych pytań
     */
    generateRandomQuestions(count) {
        const allWords = this.getAllWords();
        const shuffledWords = Utils.shuffle(allWords).slice(0, count);
        const questions = [];

        shuffledWords.forEach(word => {
            const questionType = this.selectQuestionType();
            const direction = this.selectQuestionDirection();
            
            const question = this.createQuestion(word, questionType, direction, word.category);
            if (question) {
                questions.push(question);
            }
        });

        return questions;
    }

    /**
     * Generowanie pytań z konkretnych słów
     */
    generateQuestionsFromWords(words, count, shuffle = true) {
        if (!words || words.length === 0) return [];
        
        // Dla quizu progresywnego - NIE mieszaj słów
        const selectedWords = shuffle ? Utils.shuffle(words) : words;
        const limitedWords = selectedWords.slice(0, count);
        const questions = [];

        limitedWords.forEach(word => {
            const questionType = this.selectQuestionType();
            const direction = this.selectQuestionDirection();
            
            const question = this.createQuestion(word, questionType, direction, word.category);
            if (question) {
                // Dodaj informację o poziomie trudności do pytania
                question.userDifficulty = word.userDifficulty || word.difficulty || 'medium';
                questions.push(question);
            }
        });

        return questions;
    }

    /**
     * Generowanie pytań z wybranych kategorii (quiz mieszany)
     */
    generateMixedCategoryQuestions(selectedCategories, totalCount) {
        console.log(`🔄 Generuję ${totalCount} pytań z kategorii:`, selectedCategories);
        
        // Zbierz wszystkie słowa z wybranych kategorii
        let allWords = [];
        
        selectedCategories.forEach(categoryKey => {
            const category = this.vocabulary.categories[categoryKey];
            if (category && category.words && Array.isArray(category.words)) {
                category.words.forEach(word => {
                    allWords.push({
                        ...word,
                        category: categoryKey,
                        categoryName: category.name
                    });
                });
            }
        });
        
        console.log(`📚 Zebrano ${allWords.length} słów z ${selectedCategories.length} kategorii`);
        
        if (allWords.length === 0) {
            console.error('❌ Brak słów w wybranych kategoriach');
            return [];
        }
        
        // Wymieszaj i wybierz słowa
        const shuffledWords = Utils.shuffle(allWords);
        const selectedWords = shuffledWords.slice(0, Math.min(totalCount, allWords.length));
        
        // Generuj pytania
        const questions = [];
        
        selectedWords.forEach(word => {
            const questionType = this.selectQuestionType();
            const direction = this.selectQuestionDirection();
            
            const question = this.createQuestion(word, questionType, direction, word.category);
            if (question) {
                // Dodaj informacje o kategorii do pytania
                question.sourceCategory = word.category;
                question.sourceCategoryName = word.categoryName;
                questions.push(question);
            }
        });
        
        console.log(`✅ Wygenerowano ${questions.length} pytań z wybranych kategorii`);
        
        return questions;
    }

    /**
     * Generowanie pytań dla quizu końcowego
     */
    generateFinalQuizQuestions(count) {
        const allWords = this.getAllWords();
        const selectedWords = this.selectWordsForFinalQuiz(allWords, count);
        const questions = [];

        selectedWords.forEach(word => {
            const questionType = this.selectQuestionType();
            const direction = this.selectQuestionDirection();
            
            const question = this.createQuestion(word, questionType, direction, word.category);
            if (question) {
                questions.push(question);
            }
        });

        return questions;
    }

    /**
     * Tworzenie pojedynczego pytania
     */
    createQuestion(word, type, direction, category) {
        const baseQuestion = {
            id: word.id,
            english: word.english,
            polish: word.polish,
            type: type,
            direction: direction,
            category: category,
            difficulty: word.difficulty || 'medium'
        };

        switch (type) {
            case 'multiple-choice':
                return this.createMultipleChoiceQuestion(baseQuestion);
            case 'text-input':
                return this.createTextInputQuestion(baseQuestion);
            case 'sentence-translation':
                return this.createSentenceQuestion(baseQuestion, word);
            default:
                return this.createMultipleChoiceQuestion(baseQuestion);
        }
    }

    /**
     * Tworzenie pytania wielokrotnego wyboru
     */
    createMultipleChoiceQuestion(baseQuestion) {
        const correctAnswer = baseQuestion.direction === 'pl-en' 
            ? baseQuestion.english 
            : baseQuestion.polish;

        const wrongAnswers = this.generateWrongAnswers(baseQuestion, 3);
        const allOptions = [correctAnswer, ...wrongAnswers];
        const shuffledOptions = Utils.shuffle(allOptions);

        return {
            ...baseQuestion,
            correctAnswer: correctAnswer,
            options: shuffledOptions
        };
    }

    /**
     * Tworzenie pytania z wpisywaniem tekstu
     */
    createTextInputQuestion(baseQuestion) {
        return {
            ...baseQuestion,
            correctAnswer: baseQuestion.direction === 'pl-en' 
                ? baseQuestion.english 
                : baseQuestion.polish
        };
    }

    /**
     * Tworzenie pytania z tłumaczeniem zdań
     */
    createSentenceQuestion(baseQuestion, word) {
        if (!word.examples) return null;

        return {
            ...baseQuestion,
            sentence: baseQuestion.direction === 'pl-en' 
                ? word.examples.polish 
                : word.examples.english,
            sentenceTranslation: baseQuestion.direction === 'pl-en' 
                ? word.examples.english 
                : word.examples.polish
        };
    }

    /**
     * Generowanie błędnych odpowiedzi
     */
    generateWrongAnswers(question, count) {
        const allWords = this.getAllWords();
        const wrongAnswers = [];
        const targetLanguage = question.direction === 'pl-en' ? 'english' : 'polish';
        const correctAnswer = question[targetLanguage];

        // Filtruj słowa tej samej kategorii i podobnego typu
        let candidates = allWords.filter(word => {
            const candidate = word[targetLanguage];
            return candidate !== correctAnswer && 
                   word.type === question.type &&
                   candidate.length > 2; // unikaj bardzo krótkich słów
        });

        // Jeśli za mało kandydatów, dodaj z innych kategorii
        if (candidates.length < count) {
            const additionalCandidates = allWords.filter(word => {
                const candidate = word[targetLanguage];
                return candidate !== correctAnswer && candidate.length > 2;
            });
            candidates = [...candidates, ...additionalCandidates];
        }

        // Losowo wybierz błędne odpowiedzi
        const shuffledCandidates = Utils.shuffle(candidates);
        for (let i = 0; i < Math.min(count, shuffledCandidates.length); i++) {
            wrongAnswers.push(shuffledCandidates[i][targetLanguage]);
        }

        return wrongAnswers;
    }

    /**
     * Selekcja typu pytania
     */
    selectQuestionType() {
        const types = ['multiple-choice', 'text-input'];
        
        // Dodaj pytania zdaniowe dla wyższych poziomów trudności
        if (this.difficulty === 'hard') {
            types.push('sentence-translation');
        }

        // Prawdopodobieństwa na podstawie poziomu trudności
        const probabilities = {
            'easy': { 'multiple-choice': 0.8, 'text-input': 0.2 },
            'medium': { 'multiple-choice': 0.6, 'text-input': 0.4 },
            'hard': { 'multiple-choice': 0.4, 'text-input': 0.4, 'sentence-translation': 0.2 }
        };

        return this.selectByProbability(probabilities[this.difficulty]);
    }

    /**
     * Selekcja kierunku pytania
     */
    selectQuestionDirection() {
        const directions = {
            'en-pl': 0.7,  // Angielski → Polski (częściej)
            'pl-en': 0.3   // Polski → Angielski
        };

        if (this.language === 'pl-en') {
            return 'pl-en';
        } else if (this.language === 'en-pl') {
            return 'en-pl';
        } else {
            // Mixed mode
            return this.selectByProbability(directions);
        }
    }

    /**
     * Wybór na podstawie prawdopodobieństwa
     */
    selectByProbability(probabilities) {
        const random = Math.random();
        let cumulative = 0;

        for (const [option, probability] of Object.entries(probabilities)) {
            cumulative += probability;
            if (random <= cumulative) {
                return option;
            }
        }

        return Object.keys(probabilities)[0]; // fallback
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
     * Wybór słów dla quizu końcowego
     */
    selectWordsForFinalQuiz(allWords, count) {
        // Strategia selekcji dla quizu końcowego:
        // 40% - słowa podstawowe (easy)
        // 40% - słowa średnie (medium)  
        // 20% - słowa trudne (hard)

        const easyWords = allWords.filter(w => w.difficulty === 'easy');
        const mediumWords = allWords.filter(w => w.difficulty === 'medium');
        const hardWords = allWords.filter(w => w.difficulty === 'hard');

        const easyCount = Math.floor(count * 0.4);
        const mediumCount = Math.floor(count * 0.4);
        const hardCount = count - easyCount - mediumCount;

        const selectedWords = [
            ...Utils.shuffle(easyWords).slice(0, easyCount),
            ...Utils.shuffle(mediumWords).slice(0, mediumCount),
            ...Utils.shuffle(hardWords).slice(0, hardCount)
        ];

        return Utils.shuffle(selectedWords);
    }

    /**
     * Pobranie trudnych słów na podstawie statystyk
     */
    getDifficultWords(quizResults) {
        const wordStats = {};

        // Analizuj wyniki poprzednich quizów
        Object.values(quizResults).forEach(results => {
            if (Array.isArray(results)) {
                results.forEach(result => {
                    if (result.userAnswers) {
                        result.userAnswers.forEach(answer => {
                            const wordKey = `${answer.question.english}-${answer.question.polish}`;
                            if (!wordStats[wordKey]) {
                                wordStats[wordKey] = {
                                    word: answer.question,
                                    attempts: 0,
                                    correct: 0
                                };
                            }
                            wordStats[wordKey].attempts++;
                            if (answer.isCorrect) {
                                wordStats[wordKey].correct++;
                            }
                        });
                    }
                });
            }
        });

        // Znajdź słowa z najgorszymi wynikami
        const difficultWords = [];
        Object.values(wordStats).forEach(stat => {
            const successRate = stat.correct / stat.attempts;
            if (stat.attempts >= 3 && successRate < 0.6) { // mniej niż 60% poprawnych
                difficultWords.push(stat.word);
            }
        });

        return difficultWords;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionGenerator;
}