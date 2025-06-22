/**
 * QuizManager - Menedżer quizów
 * Obsługuje wszystkie typy quizów: kategorie, losowe, trudne słowa, końcowy
 */

class QuizManager {
    constructor() {
        this.vocabulary = null;
        this.currentQuiz = null;
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.difficulty = 'medium';
        this.language = 'en-pl'; // en-pl, pl-en, mixed
        this.quizTypes = {
            CATEGORY: 'category',
            RANDOM: 'random',
            DIFFICULT: 'difficult',
            FINAL: 'final'
        };
        
        this.storageKey = 'english-flashcards-quiz-results';
        this.usedQuestionsKey = 'english-flashcards-used-questions';
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
     * Ustawienie języka quizu
     */
    setLanguage(language) {
        this.language = language;
    }

    /**
     * Rozpoczęcie quizu kategorii
     */
    startCategoryQuiz(categoryKey, app) {
        if (!this.vocabulary || !this.vocabulary.categories[categoryKey]) {
            NotificationManager.show('Nie można uruchomić quizu - brak danych', 'error');
            return false;
        }

        const category = this.vocabulary.categories[categoryKey];
        const questions = this.generateCategoryQuestions(categoryKey, 15);

        if (questions.length === 0) {
            NotificationManager.show('Brak dostępnych pytań dla tej kategorii', 'error');
            return false;
        }

        this.currentQuiz = {
            type: this.quizTypes.CATEGORY,
            category: categoryKey,
            categoryName: category.name,
            totalQuestions: questions.length,
            passScore: 12,
            timeLimit: null
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * Rozpoczęcie losowego quizu
     */
    startRandomQuiz(app) {
        const questions = this.generateRandomQuestions(20);
        
        if (questions.length === 0) {
            NotificationManager.show('Brak dostępnych pytań', 'error');
            return false;
        }

        this.currentQuiz = {
            type: this.quizTypes.RANDOM,
            category: 'mixed',
            categoryName: 'Quiz losowy',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.7), // 70%
            timeLimit: null
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * Rozpoczęcie quizu trudnych słów
     */
    startDifficultWordsQuiz(app) {
        const difficultWords = this.getDifficultWords();
        
        if (difficultWords.length < 5) {
            NotificationManager.show('Potrzebujesz więcej danych z quizów, aby odblokować quiz trudnych słów', 'info');
            return false;
        }

        const questions = this.generateQuestionsFromWords(difficultWords, 15);

        this.currentQuiz = {
            type: this.quizTypes.DIFFICULT,
            category: 'difficult',
            categoryName: 'Trudne słowa',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.6), // 60%
            timeLimit: null
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * Rozpoczęcie quizu końcowego
     */
    startFinalQuiz(app) {
        const completedCategories = this.getCompletedCategoriesCount();
        const totalCategories = Object.keys(this.vocabulary.categories).length;
        
        if (completedCategories < Math.ceil(totalCategories * 0.75)) {
            NotificationManager.show(`Musisz ukończyć co najmniej ${Math.ceil(totalCategories * 0.75)} kategorii, aby odblokować quiz końcowy`, 'info');
            return false;
        }

        const questions = this.generateFinalQuizQuestions(50);

        this.currentQuiz = {
            type: this.quizTypes.FINAL,
            category: 'final',
            categoryName: 'Quiz końcowy',
            totalQuestions: questions.length,
            passScore: 42,
            timeLimit: 3600 // 60 minut
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * Inicjalizacja quizu
     */
    initializeQuiz(questions, app) {
        this.currentQuestions = questions;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;

        // Przełączenie na tryb quizu
        app.switchMode('quiz');
        this.showQuizInterface(app);
        this.displayCurrentQuestion(app);
        
        NotificationManager.show(`Rozpoczęto quiz: ${this.currentQuiz.categoryName}`, 'info');
    }

    /**
     * Pokazanie interfejsu quizu
     */
    showQuizInterface(app) {
        // Ukryj selektor quizów
        const quizSelector = document.getElementById('quiz-selector');
        const quizContainer = document.getElementById('quiz-container');
        const quizResults = document.getElementById('quiz-results');

        if (quizSelector) quizSelector.style.display = 'none';
        if (quizContainer) quizContainer.style.display = 'block';
        if (quizResults) quizResults.style.display = 'none';

        // Resetuj interfejs
        this.resetQuizInterface();
    }

    /**
     * Wyświetlenie aktualnego pytania
     */
    displayCurrentQuestion(app) {
        const question = this.getCurrentQuestion();
        if (!question) {
            this.showQuizResults(app);
            return;
        }

        // Aktualizuj nagłówek quizu
        this.updateQuizHeader();

        // Wyświetl pytanie
        this.displayQuestion(question);

        // Resetuj interfejs odpowiedzi
        this.resetAnswerInterface();
    }

    /**
     * Aktualizacja nagłówka quizu
     */
    updateQuizHeader() {
        const titleEl = document.getElementById('quiz-title');
        const currentEl = document.getElementById('quiz-current');
        const totalEl = document.getElementById('quiz-total');
        const progressFillEl = document.getElementById('quiz-progress-fill');
        const scoreDisplayEl = document.getElementById('quiz-score-display');

        if (titleEl) {
            titleEl.textContent = `Quiz: ${this.currentQuiz.categoryName}`;
        }

        if (currentEl) {
            currentEl.textContent = this.currentQuestionIndex + 1;
        }

        if (totalEl) {
            totalEl.textContent = this.currentQuiz.totalQuestions;
        }

        if (progressFillEl) {
            const progressPercent = ((this.currentQuestionIndex + 1) / this.currentQuiz.totalQuestions) * 100;
            progressFillEl.style.width = `${progressPercent}%`;
        }

        if (scoreDisplayEl) {
            scoreDisplayEl.textContent = `${this.score}/${this.currentQuestionIndex}`;
        }
    }

    /**
     * Wyświetlenie pytania
     */
    displayQuestion(question) {
        const questionWordEl = document.getElementById('quiz-english-word');
        
        if (questionWordEl) {
            // Określ kierunek tłumaczenia
            if (question.direction === 'pl-en') {
                questionWordEl.textContent = question.polish;
                this.updateQuizInstruction('Wybierz poprawne angielskie tłumaczenie:');
            } else {
                questionWordEl.textContent = question.english;
                this.updateQuizInstruction('Wybierz poprawne polskie tłumaczenie:');
            }
        }

        // Wyświetl odpowiedni typ pytania
        switch (question.type) {
            case 'multiple-choice':
                this.displayMultipleChoiceQuestion(question);
                break;
            case 'text-input':
                this.displayTextInputQuestion(question);
                break;
            case 'sentence-translation':
                this.displaySentenceQuestion(question);
                break;
            default:
                this.displayMultipleChoiceQuestion(question);
        }
    }

    /**
     * Wyświetlenie pytania wielokrotnego wyboru
     */
    displayMultipleChoiceQuestion(question) {
        const multipleChoiceSection = document.getElementById('multiple-choice-section');
        const textInputSection = document.getElementById('text-input-section');
        const sentenceSection = document.getElementById('sentence-section');
        const answerOptionsEl = document.getElementById('answer-options');

        // Pokaż odpowiednią sekcję
        if (multipleChoiceSection) multipleChoiceSection.style.display = 'block';
        if (textInputSection) textInputSection.style.display = 'none';
        if (sentenceSection) sentenceSection.style.display = 'none';

        if (!answerOptionsEl) return;

        // Wyczyść poprzednie opcje
        answerOptionsEl.innerHTML = '';

        // Dodaj opcje odpowiedzi
        question.options.forEach((option, index) => {
            const optionEl = document.createElement('button');
            optionEl.className = 'answer-option';
            optionEl.textContent = option;
            optionEl.dataset.optionIndex = index;
            
            optionEl.addEventListener('click', () => {
                this.selectAnswer(option, index);
            });

            answerOptionsEl.appendChild(optionEl);
        });
    }

    /**
     * Wyświetlenie pytania z wpisywaniem tekstu
     */
    displayTextInputQuestion(question) {
        const multipleChoiceSection = document.getElementById('multiple-choice-section');
        const textInputSection = document.getElementById('text-input-section');
        const sentenceSection = document.getElementById('sentence-section');
        const answerInput = document.getElementById('quiz-answer-input');

        // Pokaż odpowiednią sekcję
        if (multipleChoiceSection) multipleChoiceSection.style.display = 'none';
        if (textInputSection) textInputSection.style.display = 'block';
        if (sentenceSection) sentenceSection.style.display = 'none';

        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
            answerInput.placeholder = question.direction === 'pl-en' 
                ? 'Wpisz angielskie tłumaczenie...'
                : 'Wpisz polskie tłumaczenie...';
        }
    }

    /**
     * Wyświetlenie pytania z tłumaczeniem zdań
     */
    displaySentenceQuestion(question) {
        const multipleChoiceSection = document.getElementById('multiple-choice-section');
        const textInputSection = document.getElementById('text-input-section');
        const sentenceSection = document.getElementById('sentence-section');
        const sentenceToTranslateEl = document.getElementById('sentence-to-translate');
        const sentenceAnswerEl = document.getElementById('sentence-answer');

        // Pokaż odpowiednią sekcję
        if (multipleChoiceSection) multipleChoiceSection.style.display = 'none';
        if (textInputSection) textInputSection.style.display = 'none';
        if (sentenceSection) sentenceSection.style.display = 'block';

        if (sentenceToTranslateEl) {
            sentenceToTranslateEl.textContent = question.sentence;
        }

        if (sentenceAnswerEl) {
            sentenceAnswerEl.value = '';
            sentenceAnswerEl.focus();
        }
    }

    /**
     * Wybór odpowiedzi w pytaniu wielokrotnego wyboru
     */
    selectAnswer(answer, optionIndex) {
        // Usuń poprzednie zaznaczenie
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Zaznacz wybraną opcję
        const selectedOption = document.querySelector(`[data-option-index="${optionIndex}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }

        // Automatycznie prześlij odpowiedź po wyborze
        setTimeout(() => {
            this.submitAnswer({
                type: 'multiple-choice',
                answer: answer,
                optionIndex: optionIndex
            });
        }, 500);
    }

    /**
     * Przesłanie odpowiedzi przez użytkownika
     */
    submitAnswer(app, answerData = null) {
        let userAnswer;
        let answerType;

        if (answerData) {
            // Odpowiedź z multiple choice
            userAnswer = answerData.answer;
            answerType = answerData.type;
        } else {
            // Sprawdź który typ pytania jest aktywny
            const multipleChoiceSection = document.getElementById('multiple-choice-section');
            const textInputSection = document.getElementById('text-input-section');
            const sentenceSection = document.getElementById('sentence-section');

            if (textInputSection && textInputSection.style.display !== 'none') {
                const answerInput = document.getElementById('quiz-answer-input');
                userAnswer = answerInput ? answerInput.value.trim() : '';
                answerType = 'text-input';
            } else if (sentenceSection && sentenceSection.style.display !== 'none') {
                const sentenceAnswer = document.getElementById('sentence-answer');
                userAnswer = sentenceAnswer ? sentenceAnswer.value.trim() : '';
                answerType = 'sentence-translation';
            } else {
                NotificationManager.show('Wybierz odpowiedź', 'error');
                return;
            }
        }

        if (!userAnswer) {
            NotificationManager.show('Wpisz odpowiedź', 'error');
            return;
        }

        const question = this.getCurrentQuestion();
        if (!question) return;

        // Sprawdź poprawność odpowiedzi
        const result = this.checkAnswer(userAnswer, question, answerType);
        
        // Zapisz odpowiedź użytkownika
        this.userAnswers.push({
            question: question,
            userAnswer: userAnswer,
            correctAnswer: result.correctAnswer,
            isCorrect: result.isCorrect,
            answerType: answerType,
            timeSpent: Date.now() - (this.questionStartTime || Date.now())
        });

        if (result.isCorrect) {
            this.score++;
        }

        // Pokaż feedback
        this.showQuestionFeedback(result, app);
    }

    /**
     * Przesłanie odpowiedzi zdaniowej
     */
    submitSentenceAnswer(app) {
        this.submitAnswer(app);
    }

    /**
     * Sprawdzenie poprawności odpowiedzi
     */
    checkAnswer(userAnswer, question, answerType) {
        const normalizedUserAnswer = this.normalizeAnswer(userAnswer);
        let correctAnswer;
        let isCorrect = false;

        switch (answerType) {
            case 'multiple-choice':
                correctAnswer = question.correctAnswer;
                isCorrect = normalizedUserAnswer === this.normalizeAnswer(correctAnswer);
                break;

            case 'text-input':
                correctAnswer = question.direction === 'pl-en' ? question.english : question.polish;
                isCorrect = this.checkTextAnswer(normalizedUserAnswer, correctAnswer);
                break;

            case 'sentence-translation':
                correctAnswer = question.sentenceTranslation;
                isCorrect = this.checkSentenceAnswer(normalizedUserAnswer, correctAnswer);
                break;
        }

        return {
            isCorrect: isCorrect,
            correctAnswer: correctAnswer,
            userAnswer: userAnswer,
            explanation: this.generateExplanation(question, isCorrect)
        };
    }

    /**
     * Sprawdzenie odpowiedzi tekstowej
     */
    checkTextAnswer(userAnswer, correctAnswer) {
        const normalizedCorrect = this.normalizeAnswer(correctAnswer);
        
        // Dokładne dopasowanie
        if (userAnswer === normalizedCorrect) {
            return true;
        }

        // Sprawdzenie alternatywnych odpowiedzi (oddzielonych "/")
        if (correctAnswer.includes('/')) {
            const alternatives = correctAnswer.split('/').map(alt => this.normalizeAnswer(alt.trim()));
            return alternatives.some(alt => userAnswer === alt);
        }

        // Sprawdzenie podobieństwa (dla długich słów)
        if (correctAnswer.length > 6) {
            const similarity = this.calculateSimilarity(userAnswer, normalizedCorrect);
            return similarity > 0.8; // 80% podobieństwa
        }

        return false;
    }

    /**
     * Sprawdzenie odpowiedzi zdaniowej
     */
    checkSentenceAnswer(userAnswer, correctAnswer) {
        const normalizedUser = this.normalizeSentence(userAnswer);
        const normalizedCorrect = this.normalizeSentence(correctAnswer);
        
        // Bardziej elastyczne sprawdzanie dla zdań
        const similarity = this.calculateSimilarity(normalizedUser, normalizedCorrect);
        return similarity > 0.7; // 70% podobieństwa
    }

    /**
     * Normalizacja odpowiedzi
     */
    normalizeAnswer(answer) {
        return answer.toLowerCase()
            .replace(/[^\w\s]/g, '') // usuń znaki interpunkcyjne
            .replace(/\s+/g, ' ') // normalizuj spacje
            .trim();
    }

    /**
     * Normalizacja zdania
     */
    normalizeSentence(sentence) {
        return sentence.toLowerCase()
            .replace(/[.,!?;:]/g, '') // usuń podstawowe znaki interpunkcyjne
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Obliczanie podobieństwa tekstów (Levenshtein distance)
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;

        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        const maxLen = Math.max(len1, len2);
        return (maxLen - matrix[len1][len2]) / maxLen;
    }

    /**
     * Pokazanie feedback dla pytania
     */
    showQuestionFeedback(result, app) {
        const feedbackEl = document.getElementById('quiz-feedback');
        const iconEl = document.getElementById('feedback-icon');
        const textEl = document.getElementById('feedback-text');
        const detailsEl = document.getElementById('feedback-details');
        const nextBtn = document.getElementById('quiz-next-btn');

        if (!feedbackEl) return;

        // Ukryj sekcje odpowiedzi
        ['multiple-choice-section', 'text-input-section', 'sentence-section'].forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'none';
        });

        // Aktualizuj zawartość feedback
        if (result.isCorrect) {
            if (iconEl) iconEl.textContent = '✅';
            if (textEl) {
                textEl.textContent = 'Poprawnie!';
                textEl.className = 'feedback-text feedback-correct';
            }
        } else {
            if (iconEl) iconEl.textContent = '❌';
            if (textEl) {
                textEl.textContent = 'Niepoprawnie';
                textEl.className = 'feedback-text feedback-incorrect';
            }
        }

        // Szczegóły odpowiedzi
        if (detailsEl) {
            let detailsHTML = `
                <div class="answer-comparison">
                    <div class="user-answer">
                        <span class="label">Twoja odpowiedź:</span>
                        <span class="value">${result.userAnswer}</span>
                    </div>
                    <div class="correct-answer">
                        <span class="label">Poprawna odpowiedź:</span>
                        <span class="value">${result.correctAnswer}</span>
                    </div>
                </div>
            `;

            if (result.explanation) {
                detailsHTML += `
                    <div class="explanation">
                        <span class="label">Wyjaśnienie:</span>
                        <span class="text">${result.explanation}</span>
                    </div>
                `;
            }

            detailsEl.innerHTML = detailsHTML;
        }

        // Aktualizuj przycisk następnego pytania
        if (nextBtn) {
            nextBtn.textContent = this.isLastQuestion() ? 'Zobacz wyniki' : 'Następne pytanie';
        }

        // Pokaż feedback
        feedbackEl.style.display = 'block';
    }

    /**
     * Przejście do następnego pytania
     */
    nextQuestion(app) {
        if (this.isLastQuestion()) {
            this.showQuizResults(app);
        } else {
            this.currentQuestionIndex++;
            this.questionStartTime = Date.now();
            this.displayCurrentQuestion(app);
        }
    }

    /**
     * Pokazanie wyników quizu
     */
    showQuizResults(app) {
        const quizContainer = document.getElementById('quiz-container');
        const quizResults = document.getElementById('quiz-results');

        if (quizContainer) quizContainer.style.display = 'none';
        if (quizResults) quizResults.style.display = 'block';

        // Oblicz wyniki
        const results = this.calculateQuizResults();
        
        // Zapisz wyniki
        this.saveQuizResults(results);

        // Wyświetl wyniki
        this.displayResults(results);

        // Aktualizuj statystyki w aplikacji
        if (app) {
            app.updateStats();
            app.renderCategoryQuizzes();
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
     * Wyświetlenie wyników
     */
    displayResults(results) {
        const iconEl = document.getElementById('results-icon');
        const titleEl = document.getElementById('results-title');
        const scoreEl = document.getElementById('results-score');
        const percentageEl = document.getElementById('results-percentage');
        const statusEl = document.getElementById('results-status');
        const detailsEl = document.getElementById('results-details');

        // Ikona i tytuł
        if (results.passed) {
            if (iconEl) iconEl.textContent = '🎉';
            if (titleEl) titleEl.textContent = 'Gratulacje!';
        } else {
            if (iconEl) iconEl.textContent = '😔';
            if (titleEl) titleEl.textContent = 'Spróbuj ponownie';
        }

        // Wynik
        if (scoreEl) scoreEl.textContent = `${results.score}/${results.total}`;
        if (percentageEl) percentageEl.textContent = `${results.percentage}%`;

        // Status
        if (statusEl) {
            statusEl.textContent = results.passed ? 'Quiz zaliczony!' : 'Quiz niezaliczony';
            statusEl.className = `results-status ${results.passed ? 'results-passed' : 'results-failed'}`;
        }

        // Szczegóły
        if (detailsEl) {
            this.displayDetailedResults(detailsEl, results);
        }
    }

    /**
     * Wyświetlenie szczegółowych wyników
     */
    displayDetailedResults(container, results) {
        let detailsHTML = `
            <div class="results-summary">
                <div class="summary-item">
                    <span class="label">Poziom trudności:</span>
                    <span class="value">${this.getDifficultyLabel(results.difficulty)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Kierunek tłumaczenia:</span>
                    <span class="value">${this.getLanguageLabel(results.language)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Czas rozwiązywania:</span>
                    <span class="value">${this.formatTime(results.timeSpent)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Próg zaliczenia:</span>
                    <span class="value">${results.passScore}/${results.total}</span>
                </div>
            </div>
        `;

        // Analiza błędów
        const incorrectAnswers = results.userAnswers.filter(answer => !answer.isCorrect);
        if (incorrectAnswers.length > 0) {
            detailsHTML += `
                <div class="error-analysis">
                    <h4>Błędne odpowiedzi (${incorrectAnswers.length}):</h4>
                    <div class="error-list">
            `;

            incorrectAnswers.slice(0, 5).forEach(answer => {
                detailsHTML += `
                    <div class="error-item">
                        <div class="question">${answer.question.english} → ${answer.question.polish}</div>
                        <div class="answers">
                            <span class="user-answer">Twoja: ${answer.userAnswer}</span>
                            <span class="correct-answer">Poprawna: ${answer.correctAnswer}</span>
                        </div>
                    </div>
                `;
            });

            if (incorrectAnswers.length > 5) {
                detailsHTML += `<div class="more-errors">...i ${incorrectAnswers.length - 5} więcej</div>`;
            }

            detailsHTML += `</div></div>`;
        }

        container.innerHTML = detailsHTML;
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

    updateQuizInstruction(text) {
        const instructionEl = document.querySelector('.quiz-instruction');
        if (instructionEl) {
            instructionEl.textContent = text;
        }
    }

    resetQuizInterface() {
        const feedbackEl = document.getElementById('quiz-feedback');
        if (feedbackEl) feedbackEl.style.display = 'none';

        // Reset wszystkich sekcji
        ['multiple-choice-section', 'text-input-section', 'sentence-section'].forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'none';
        });
    }

    resetAnswerInterface() {
        // Wyczyść poprzednie odpowiedzi
        const answerInput = document.getElementById('quiz-answer-input');
        const sentenceAnswer = document.getElementById('sentence-answer');
        
        if (answerInput) answerInput.value = '';
        if (sentenceAnswer) sentenceAnswer.value = '';

        // Usuń zaznaczenia z opcji wielokrotnego wyboru
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Zapisz czas rozpoczęcia pytania
        this.questionStartTime = Date.now();
    }

    /**
     * Generowanie pytań
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
     * Tworzenie pytania
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

    createTextInputQuestion(baseQuestion) {
        return {
            ...baseQuestion,
            correctAnswer: baseQuestion.direction === 'pl-en' 
                ? baseQuestion.english 
                : baseQuestion.polish
        };
    }

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
     * Selekcja typów pytań i kierunków
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
     * Pomocnicze metody danych
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

    getDifficultWords() {
        const quizResults = this.loadQuizResults();
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
     * Zarządzanie wynikami
     */
    saveQuizResults(results) {
        try {
            const allResults = this.loadQuizResults();
            const key = `${results.quizType}_${results.category}`;
            
            if (!allResults[key]) {
                allResults[key] = [];
            }
            
            allResults[key].push(results);
            
            // Zachowaj tylko ostatnie 10 wyników dla każdego typu
            if (allResults[key].length > 10) {
                allResults[key] = allResults[key].slice(-10);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(allResults));
        } catch (error) {
            console.error('Błąd zapisywania wyników quizu:', error);
        }
    }

    loadQuizResults() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Błąd ładowania wyników quizów:', error);
            return {};
        }
    }

    getCategoryResults(category) {
        const allResults = this.loadQuizResults();
        const key = `${this.quizTypes.CATEGORY}_${category}`;
        const results = allResults[key] || [];
        
        if (results.length === 0) return null;
        
        // Zwróć najlepszy wynik
        return results.reduce((best, current) => 
            current.score > best.score ? current : best
        );
    }

    getOverallStats() {
        const allResults = this.loadQuizResults();
        let totalQuizzes = 0;
        let totalScore = 0;
        let totalPossible = 0;
        let completedCategories = 0;

        Object.entries(allResults).forEach(([key, results]) => {
            if (Array.isArray(results) && results.length > 0) {
                // Znajdź najlepszy wynik dla każdego klucza
                const bestResult = results.reduce((best, current) => 
                    current.score > best.score ? current : best
                );

                totalQuizzes++;
                totalScore += bestResult.score;
                totalPossible += bestResult.total;

                // Sprawdź czy kategoria zaliczona
                if (bestResult.passed && key.startsWith(this.quizTypes.CATEGORY)) {
                    completedCategories++;
                }
            }
        });

        const averageScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

        return {
            totalQuizzes,
            averageScore,
            completedCategories,
            totalCategories: Object.keys(this.vocabulary?.categories || {}).length
        };
    }

    getCompletedCategoriesCount() {
        const allResults = this.loadQuizResults();
        let count = 0;

        Object.entries(allResults).forEach(([key, results]) => {
            if (key.startsWith(this.quizTypes.CATEGORY) && Array.isArray(results)) {
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
     * Kontrola quizu
     */
    retryCurrentQuiz(app) {
        if (!this.currentQuiz) return;

        switch (this.currentQuiz.type) {
            case this.quizTypes.CATEGORY:
                this.startCategoryQuiz(this.currentQuiz.category, app);
                break;
            case this.quizTypes.RANDOM:
                this.startRandomQuiz(app);
                break;
            case this.quizTypes.DIFFICULT:
                this.startDifficultWordsQuiz(app);
                break;
            case this.quizTypes.FINAL:
                this.startFinalQuiz(app);
                break;
        }
    }

    continueAfterQuiz(app) {
        // Powrót do selekcji quizów lub fiszek
        const quizResults = document.getElementById('quiz-results');
        const quizSelector = document.getElementById('quiz-selector');

        if (quizResults) quizResults.style.display = 'none';
        if (quizSelector) quizSelector.style.display = 'block';

        app.switchMode('flashcards');
    }

    /**
     * Pomocnicze metody formatowania
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            'easy': 'Łatwy',
            'medium': 'Średni',
            'hard': 'Trudny'
        };
        return labels[difficulty] || difficulty;
    }

    getLanguageLabel(language) {
        const labels = {
            'en-pl': 'Angielski → Polski',
            'pl-en': 'Polski → Angielski',
            'mixed': 'Mieszany'
        };
        return labels[language] || language;
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    calculateTotalTime() {
        // Oblicz całkowity czas na podstawie odpowiedzi użytkownika
        return this.userAnswers.reduce((total, answer) => total + (answer.timeSpent || 0), 0);
    }

    generateExplanation(question, isCorrect) {
        if (isCorrect) return null;

        // Generuj proste wyjaśnienia na podstawie typu słowa
        let explanation = '';
        
        if (question.type) {
            explanation += `To jest ${question.type}. `;
        }

        if (question.examples) {
            explanation += `Przykład użycia: "${question.examples.english}" - "${question.examples.polish}".`;
        }

        return explanation || null;
    }

    /**
     * Export/Import danych
     */
    exportData() {
        return {
            quizResults: this.loadQuizResults(),
            settings: {
                difficulty: this.difficulty,
                language: this.language
            }
        };
    }

    importData(data) {
        if (data.quizResults) {
            localStorage.setItem(this.storageKey, JSON.stringify(data.quizResults));
        }
        
        if (data.settings) {
            this.difficulty = data.settings.difficulty || 'medium';
            this.language = data.settings.language || 'en-pl';
        }
    }

    reset() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.usedQuestionsKey);
        this.currentQuiz = null;
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
    }

    cleanup() {
        this.reset();
        this.vocabulary = null;
    }
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizManager;
}