/**
 * QuizManager - Główny menedżer quizów (zrefaktoryzowany)
 * Orchestruje współpracę między różnymi modułami quizu
 */

class QuizManager {
    constructor() {
        // Stan quizu
        this.currentQuiz = null;
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.currentApp = null;
        
        // Ustawienia
        this.difficulty = 'medium';
        this.language = 'en-pl';
        
        // Moduły
        this.vocabulary = null;
        this.storage = new QuizStorage();
        this.questionGenerator = new QuestionGenerator();
        this.answerChecker = new AnswerChecker();
        this.ui = new QuizUI();
        this.timer = new QuizTimer();
        this.types = null; // Zostanie zainicjalizowane po ustawieniu vocabulary
        
        // Event listeners
        this.setupEventListeners();
        
        console.log('✅ QuizManager zainicjalizowany z modułami');
    }

    /**
     * Ustawienie słownictwa
     */
    setVocabulary(vocabulary) {
        this.vocabulary = vocabulary;
        this.questionGenerator.setVocabulary(vocabulary);
        this.types = new QuizTypes(vocabulary, this.questionGenerator, this.storage);
        
        console.log('📚 Słownictwo ustawione w QuizManager');
    }

    /**
     * Ustawienie poziomu trudności
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.questionGenerator.setDifficulty(difficulty);
    }

    /**
     * Ustawienie języka quizu
     */
    setLanguage(language) {
        this.language = language;
        this.questionGenerator.setLanguage(language);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // UI callback
        this.ui.setAnswerCallback((answerData) => {
            this.submitAnswer(this.currentApp, answerData);
        });

        // Timer callback
        this.timer.onTimeExpired = () => {
            this.onTimerExpired();
        };
    }

    /**
     * Rozpoczęcie quizu kategorii
     */
    startCategoryQuiz(categoryKey, app) {
        const result = this.types.startCategoryQuiz(categoryKey);
        
        if (!result.success) {
            NotificationManager.show(result.error, 'error');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Rozpoczęcie losowego quizu
     */
    startRandomQuiz(app) {
        const result = this.types.startRandomQuiz();
        
        if (!result.success) {
            NotificationManager.show(result.error, 'error');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Rozpoczęcie quizu z powtórek
     */
    startBookmarksQuiz(app) {
        const result = this.types.startBookmarksQuiz(app);
        
        if (!result.success) {
            NotificationManager.show(result.error, 'info');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Rozpoczęcie quizu szybkiego
     */
    startSpeedQuiz(app) {
        const result = this.types.startSpeedQuiz();
        
        if (!result.success) {
            NotificationManager.show(result.error, 'error');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Rozpoczęcie quizu mieszanego z wybranych kategorii
     */
    startMixedCategoriesQuiz(selectedCategories, app) {
        const result = this.types.startMixedCategoriesQuiz(selectedCategories);
        
        if (!result.success) {
            NotificationManager.show(result.error, 'error');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Rozpoczęcie quizu końcowego
     */
    startFinalQuiz(app) {
        const result = this.types.startFinalQuiz();
        
        if (!result.success) {
            NotificationManager.show(result.error, 'info');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Quiz trudnych słów
     */
    startHardWordsQuiz(app) {
        const result = this.types.startHardWordsQuiz(app);
        
        if (!result.success) {
            NotificationManager.show(result.error, 'info');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Quiz łatwych słów
     */
    startEasyWordsQuiz(app) {
        const result = this.types.startEasyWordsQuiz(app);
        
        if (!result.success) {
            NotificationManager.show(result.error, 'info');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Quiz progresywny
     */
    startProgressiveQuiz(app) {
        const result = this.types.startProgressiveQuiz(app);
        
        if (!result.success) {
            NotificationManager.show(result.error, 'info');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Quiz adaptacyjny
     */
    startAdaptiveQuiz(app) {
        const result = this.types.startAdaptiveQuiz(app);
        
        if (!result.success) {
            NotificationManager.show(result.error, 'info');
            return false;
        }

        this.initializeQuiz(result.quiz, app);
        return true;
    }

    /**
     * Inicjalizacja quizu
     */
    initializeQuiz(quiz, app) {
        this.currentApp = app;
        this.currentQuiz = quiz;
        this.currentQuestions = quiz.questions;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;

        // Przełączenie na tryb quizu
        app.switchMode('quiz');
        this.ui.showQuizInterface();
        this.displayCurrentQuestion();
        
        NotificationManager.show(`Rozpoczęto quiz: ${this.currentQuiz.categoryName}`, 'info');
    }

    /**
     * Wyświetlenie aktualnego pytania
     */
    displayCurrentQuestion() {
        const question = this.getCurrentQuestion();
        if (!question) {
            this.showQuizResults();
            return;
        }

        // Aktualizuj nagłówek quizu
        this.ui.updateQuizHeader(this.currentQuiz, this.currentQuestionIndex, this.score);

        // Wyświetl pytanie
        this.ui.displayQuestion(question, this.currentQuiz);

        // Obsługa timera dla speed quiz
        if (this.currentQuiz && this.currentQuiz.isSpeed) {
            this.timer.show();
            this.timer.start(this.currentQuiz.timeLimit, () => this.onTimerExpired());
        } else {
            this.timer.hide();
        }
    }

    /**
     * Przesłanie odpowiedzi przez użytkownika
     */
    submitAnswer(app, answerData = null) {
        console.log('📝 QuizManager.submitAnswer wywołane', { answerData, isSpeedQuiz: this.currentQuiz?.isSpeed });
        
        // Zatrzymaj timer gdy użytkownik odpowie w Speed Quiz
        if (this.currentQuiz && this.currentQuiz.isSpeed && this.timer.active) {
            console.log('⏰ Zatrzymuję timer po odpowiedzi użytkownika');
            this.timer.stop();
        }
        
        let userAnswer;
        let answerType;

        if (answerData) {
            // Odpowiedź z multiple choice
            userAnswer = answerData.answer;
            answerType = answerData.type;
            console.log('🎯 Multiple choice answer:', userAnswer);
        } else {
            // Sprawdź który typ pytania jest aktywny
            answerType = this.ui.getActiveQuestionType();
            
            if (answerType === 'text-input') {
                userAnswer = this.ui.getTextInputAnswer();
            } else if (answerType === 'sentence-translation') {
                userAnswer = this.ui.getSentenceAnswer();
            } else {
                console.warn('⚠️ No active answer section found');
                NotificationManager.show('Wybierz odpowiedź', 'error');
                return;
            }
        }

        if (!userAnswer) {
            console.warn('⚠️ Empty answer provided');
            NotificationManager.show('Wpisz odpowiedź', 'error');
            return;
        }

        const question = this.getCurrentQuestion();
        if (!question) {
            console.error('❌ No current question available');
            return;
        }

        // Oblicz czas odpowiedzi
        const responseTime = Date.now() - (this.questionStartTime || Date.now());
        const responseTimeSeconds = Math.round(responseTime / 1000 * 10) / 10;
        
        console.log(`⏱️ Czas odpowiedzi: ${responseTimeSeconds}s`);

        // Sprawdź poprawność odpowiedzi
        const result = this.answerChecker.checkAnswer(userAnswer, question, answerType);
        
        console.log('🔍 Answer check result:', {
            isCorrect: result.isCorrect,
            userAnswer: result.userAnswer,
            correctAnswer: result.correctAnswer
        });
        
        // Zapisz odpowiedź użytkownika z dodatkowymi informacjami
        const answerRecord = {
            question: question,
            userAnswer: userAnswer,
            correctAnswer: result.correctAnswer,
            isCorrect: result.isCorrect,
            answerType: answerType,
            timeSpent: responseTime,
            responseTimeSeconds: responseTimeSeconds,
            isSpeedQuiz: this.currentQuiz?.isSpeed || false,
            remainingTime: this.currentQuiz?.isSpeed ? this.timer.remainingTime : null
        };
        
        this.userAnswers.push(answerRecord);

        if (result.isCorrect) {
            this.score++;
            console.log(`✅ Correct answer! Score: ${this.score}/${this.userAnswers.length}`);
        } else {
            console.log(`❌ Incorrect answer. Score: ${this.score}/${this.userAnswers.length}`);
        }

        // Dodaj informację o szybkości odpowiedzi dla Speed Quiz
        if (this.currentQuiz && this.currentQuiz.isSpeed) {
            result.speedInfo = {
                responseTime: responseTimeSeconds,
                remainingTime: Math.max(0, this.timer.remainingTime),
                wasQuick: responseTimeSeconds < (this.currentQuiz.timeLimit * 0.5)
            };
            
            console.log('🚀 Speed Quiz info:', result.speedInfo);
        }

        // Pokaż feedback
        this.ui.showQuestionFeedback(result, this.isLastQuestion());
        
        console.log('📊 Answer submitted successfully');
    }

    /**
     * Przesłanie odpowiedzi zdaniowej
     */
    submitSentenceAnswer(app) {
        this.submitAnswer(app);
    }

    /**
     * Obsługa wygaśnięcia timera
     */
    onTimerExpired() {
        console.log('🚨 Timer wygasł - automatyczne przejście');
        
        const question = this.getCurrentQuestion();
        if (question) {
            this.userAnswers.push({
                question: question,
                userAnswer: '(brak odpowiedzi - timeout)',
                correctAnswer: question.correctAnswer || question.polish,
                isCorrect: false,
                answerType: 'timeout',
                timeSpent: this.currentQuiz.timeLimit * 1000
            });
            
            // Pokaż feedback dla timeout
            this.ui.showTimeoutFeedback(question, this.isLastQuestion());
        }
    }

    /**
     * Przejście do następnego pytania
     */
    nextQuestion(app) {
        // Ukryj feedback przed przejściem
        this.ui.hideFeedback();

        if (this.isLastQuestion()) {
            // Zatrzymaj timer przed pokazaniem wyników
            this.timer.stop();
            this.timer.hide();
            this.showQuizResults();
        } else {
            this.currentQuestionIndex++;
            this.questionStartTime = Date.now();
            this.displayCurrentQuestion();
        }
    }

    /**
     * Pokazanie wyników quizu
     */
    showQuizResults() {
        this.ui.showQuizResults();

        // Oblicz wyniki
        const results = this.calculateQuizResults();
        
        // Zapisz wyniki
        this.storage.saveQuizResults(results);

        // Wyświetl wyniki
        this.ui.displayResults(results);

        // Aktualizuj statystyki w aplikacji
        if (this.currentApp) {
            this.currentApp.updateStats();
            this.currentApp.renderCategoryQuizzes();
        }
    }

    /**
     * Obliczenie wyników quizu
     */
    calculateQuizResults() {
        const totalQuestions = this.currentQuiz.totalQuestions;
        const score = this.score;
        const percentage = Math.round((score / totalQuestions) * 100);
        const passed = score >= this.currentQuiz.passScore;

        const results = {
            quizType: this.currentQuiz.type,
            category: this.currentQuiz.category,
            categoryName: this.currentQuiz.categoryName,
            score: score,
            total: totalQuestions,
            percentage: percentage,
            passed: passed,
            passScore: this.currentQuiz.passScore,
            difficulty: this.difficulty,
            language: this.language,
            userAnswers: this.userAnswers,
            completedAt: new Date().toISOString(),
            timeSpent: this.calculateTotalTime()
        };

        return results;
    }

    /**
     * Przerwanie bieżącego quizu
     */
    cancelQuiz(app) {
        console.log('🚫 QuizManager: Przerwanie quizu');
        
        if (!this.currentQuiz) {
            console.warn('⚠️ Brak aktywnego quizu do przerwania');
            return false;
        }
        
        // Zatrzymaj i ukryj timer
        console.log('⏰ Zatrzymuję timer przed przerwaniem quizu...');
        this.timer.stop();
        this.timer.hide();
        
        const cancelledQuiz = this.currentQuiz;
        console.log(`✅ Quiz "${cancelledQuiz.categoryName}" został przerwany pomyślnie`);
        
        try {
            // Wyczyść stan bieżącego quizu
            this.currentQuiz = null;
            this.currentQuestions = [];
            this.currentQuestionIndex = 0;
            this.userAnswers = [];
            this.score = 0;
            this.questionStartTime = null;
            
            // Ukryj interfejs quizu i pokaż selector
            this.ui.hideQuizInterface();
            this.ui.showQuizSelector();
            
            // Przełącz aplikację na tryb quizów
            if (app && typeof app.switchMode === 'function') {
                app.switchMode('quiz');
            }
            
            // Wyślij event o przerwaniu
            document.dispatchEvent(new CustomEvent('quizCancelled', {
                detail: {
                    quiz: cancelledQuiz,
                    timestamp: new Date().toISOString(),
                    reason: 'user_cancelled'
                }
            }));
            
            return true;
            
        } catch (error) {
            console.error('❌ Błąd podczas przerwania quizu:', error);
            return false;
        }
    }

    /**
     * Kontrola quizu
     */
    retryCurrentQuiz(app) {
        if (!this.currentQuiz) return;

        const quizType = this.currentQuiz.type;
        const category = this.currentQuiz.category;

        // Restart odpowiedniego typu quizu
        switch (quizType) {
            case 'category':
                this.startCategoryQuiz(category, app);
                break;
            case 'random':
                this.startRandomQuiz(app);
                break;
            case 'bookmarks':
                this.startBookmarksQuiz(app);
                break;
            case 'final':
                this.startFinalQuiz(app);
                break;
            case 'speed':
                this.startSpeedQuiz(app);
                break;
            case 'hard_words':
                this.startHardWordsQuiz(app);
                break;
            case 'easy_words':
                this.startEasyWordsQuiz(app);
                break;
            case 'progressive':
                this.startProgressiveQuiz(app);
                break;
            case 'adaptive':
                this.startAdaptiveQuiz(app);
                break;
        }
    }

    continueAfterQuiz(app) {
        // Powrót do selekcji quizów lub fiszek
        this.ui.hideQuizInterface();
        this.ui.showQuizSelector();
        app.switchMode('flashcards');
    }

    /**
     * Pomocnicze metody
     */
    getCurrentQuestion() {
        if (this.currentQuestionIndex >= this.currentQuestions.length) {
            return null;
        }
        return this.currentQuestions[this.currentQuestionIndex];
    }

    isLastQuestion() {
        return this.currentQuestionIndex >= this.currentQuestions.length - 1;
    }

    calculateTotalTime() {
        return this.userAnswers.reduce((total, answer) => total + (answer.timeSpent || 0), 0);
    }

    /**
     * Zarządzanie wynikami - delegacja do storage
     */
    loadQuizResults() {
        return this.storage.loadQuizResults();
    }

    getCategoryResults(category) {
        return this.storage.getCategoryResults(category);
    }

    getOverallStats() {
        return this.storage.getOverallStats(this.vocabulary);
    }

    getCompletedCategoriesCount() {
        return this.storage.getCompletedCategoriesCount();
    }

    getDifficultyQuizStats(app) {
        return this.types ? this.types.getDifficultyQuizStats(app) : null;
    }

    /**
     * Export/Import danych
     */
    exportData() {
        return {
            quizResults: this.storage.exportData(),
            settings: {
                difficulty: this.difficulty,
                language: this.language
            }
        };
    }

    importData(data) {
        if (data.quizResults) {
            this.storage.importData(data.quizResults);
        }
        
        if (data.settings) {
            this.difficulty = data.settings.difficulty || 'medium';
            this.language = data.settings.language || 'en-pl';
        }
    }

    reset() {
        this.storage.reset();
        this.currentQuiz = null;
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
    }

    cleanup() {
        // Zatrzymaj timer
        this.timer.stop();
        this.timer.cleanup();
        
        // Cleanup UI
        this.ui.cleanup();
        
        // Wyczyść stan
        this.vocabulary = null;
        this.currentQuiz = null;
        this.currentApp = null;
        
        console.log('🧹 QuizManager cleanup: Wyczyściłem stan w pamięci.');
    }
}

// Export dla ES6 modules
export { QuizManager };

// Export default dla wygody
export default QuizManager;

console.log('✅ QuizManager załadowany');