/**
 * QuizUI - Zarządzanie interfejsem użytkownika quizu
 */
class QuizUI {
    constructor() {
        this.currentQuestion = null;
        this.currentQuiz = null;
        this.onAnswerSelected = null;
    }

    /**
     * Pokazanie interfejsu quizu
     */
    showQuizInterface() {
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
     * Ukrycie interfejsu quizu
     */
    hideQuizInterface() {
        const quizContainer = document.getElementById('quiz-container');
        const quizResults = document.getElementById('quiz-results');

        if (quizContainer) quizContainer.style.display = 'none';
        if (quizResults) quizResults.style.display = 'none';
    }

    /**
     * Pokazanie selektora quizów
     */
    showQuizSelector() {
        const quizSelector = document.getElementById('quiz-selector');
        if (quizSelector) {
            quizSelector.style.display = 'block';
        }
    }

    /**
     * Aktualizacja nagłówka quizu
     */
    updateQuizHeader(quiz, currentQuestionIndex, score) {
        const titleEl = document.getElementById('quiz-title');
        const currentEl = document.getElementById('quiz-current');
        const totalEl = document.getElementById('quiz-total');
        const progressFillEl = document.getElementById('quiz-progress-fill');
        const scoreDisplayEl = document.getElementById('quiz-score-display');

        if (titleEl) {
            titleEl.textContent = `Quiz: ${quiz.categoryName}`;
        }

        if (currentEl) {
            currentEl.textContent = currentQuestionIndex + 1;
        }

        if (totalEl) {
            totalEl.textContent = quiz.totalQuestions;
        }

        if (progressFillEl) {
            const progressPercent = ((currentQuestionIndex + 1) / quiz.totalQuestions) * 100;
            progressFillEl.style.width = `${progressPercent}%`;
        }

        if (scoreDisplayEl) {
            scoreDisplayEl.textContent = `${score}/${currentQuestionIndex}`;
        }
    }

    /**
     * Wyświetlenie pytania
     */
    displayQuestion(question, quiz) {
        this.currentQuestion = question;
        this.currentQuiz = quiz;

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

        // Ukryj feedback z poprzedniego pytania
        this.hideFeedback();
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
                this.selectMultipleChoiceAnswer(option, index);
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
    selectMultipleChoiceAnswer(answer, optionIndex) {
        // Usuń poprzednie zaznaczenie
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Zaznacz wybraną opcję
        const selectedOption = document.querySelector(`[data-option-index="${optionIndex}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }

        // Wywołaj callback jeśli istnieje
        if (this.onAnswerSelected) {
            setTimeout(() => {
                this.onAnswerSelected({
                    type: 'multiple-choice',
                    answer: answer,
                    optionIndex: optionIndex
                });
            }, 500);
        }
    }

    /**
     * Pobranie odpowiedzi z inputu tekstowego
     */
    getTextInputAnswer() {
        const answerInput = document.getElementById('quiz-answer-input');
        return answerInput ? answerInput.value.trim() : '';
    }

    /**
     * Pobranie odpowiedzi zdaniowej
     */
    getSentenceAnswer() {
        const sentenceAnswer = document.getElementById('sentence-answer');
        return sentenceAnswer ? sentenceAnswer.value.trim() : '';
    }

    /**
     * Sprawdzenie aktywnego typu pytania
     */
    getActiveQuestionType() {
        const multipleChoiceSection = document.getElementById('multiple-choice-section');
        const textInputSection = document.getElementById('text-input-section');
        const sentenceSection = document.getElementById('sentence-section');

        if (textInputSection && textInputSection.style.display !== 'none') {
            return 'text-input';
        } else if (sentenceSection && sentenceSection.style.display !== 'none') {
            return 'sentence-translation';
        } else {
            return 'multiple-choice';
        }
    }

    /**
     * Pokazanie feedback dla pytania
     */
    showQuestionFeedback(result, isLastQuestion) {
        const feedbackEl = document.getElementById('quiz-feedback');
        const iconEl = document.getElementById('feedback-icon');
        const textEl = document.getElementById('feedback-text');
        const detailsEl = document.getElementById('feedback-details');
        const nextBtn = document.getElementById('quiz-next-btn');

        if (!feedbackEl) return;

        // Ustaw klasę CSS dla typu feedback
        feedbackEl.className = `quiz-feedback ${result.isCorrect ? 'correct' : 'incorrect'}`;

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

            // Dodaj informacje o szybkości dla Speed Quiz
            if (result.speedInfo) {
                const speedClass = result.speedInfo.wasQuick ? 'quick-response' : 'normal-response';
                detailsHTML += `
                    <div class="speed-info ${speedClass}">
                        <span class="label">Czas odpowiedzi:</span>
                        <span class="value">${result.speedInfo.responseTime}s</span>
                        ${result.speedInfo.wasQuick ? '<span class="badge">⚡ Szybka odpowiedź!</span>' : ''}
                    </div>
                `;
            }

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
            nextBtn.textContent = isLastQuestion ? 'Zobacz wyniki' : 'Następne pytanie';
        }

        // Pokaż feedback
        feedbackEl.style.display = 'block';
    }

    /**
     * Pokazanie feedback dla timeout
     */
    showTimeoutFeedback(question, isLastQuestion) {
        const feedbackEl = document.getElementById('quiz-feedback');
        const iconEl = document.getElementById('feedback-icon');
        const textEl = document.getElementById('feedback-text');
        const detailsEl = document.getElementById('feedback-details');
        const nextBtn = document.getElementById('quiz-next-btn');

        if (!feedbackEl) return;

        // Ustaw klasę CSS dla timeout
        feedbackEl.className = 'quiz-feedback timeout';

        // Ukryj sekcje odpowiedzi
        ['multiple-choice-section', 'text-input-section', 'sentence-section'].forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'none';
        });

        // Aktualizuj zawartość feedback
        if (iconEl) iconEl.textContent = '⏰';
        if (textEl) {
            textEl.textContent = 'Czas się skończył!';
            textEl.className = 'feedback-text feedback-timeout';
        }

        // Szczegóły odpowiedzi
        if (detailsEl) {
            detailsEl.innerHTML = `
                <div class="answer-comparison">
                    <div class="timeout-message">
                        <span class="label">Nie zdążyłeś odpowiedzieć na czas</span>
                    </div>
                    <div class="correct-answer">
                        <span class="label">Poprawna odpowiedź:</span>
                        <span class="value">${question.correctAnswer || question.polish}</span>
                    </div>
                </div>
                <div class="timeout-tip">
                    💡 Wskazówka: W speed quizu masz tylko ${this.currentQuiz?.timeLimit || 10} sekund na odpowiedź!
                </div>
            `;
        }

        // Aktualizuj przycisk następnego pytania
        if (nextBtn) {
            nextBtn.textContent = isLastQuestion ? 'Zobacz wyniki' : 'Następne pytanie';
        }

        // Pokaż feedback
        feedbackEl.style.display = 'block';
    }

    /**
     * Ukrycie feedback
     */
    hideFeedback() {
        const feedbackEl = document.getElementById('quiz-feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
        }
    }

    /**
     * Pokazanie wyników quizu
     */
    showQuizResults() {
        const quizContainer = document.getElementById('quiz-container');
        const quizResults = document.getElementById('quiz-results');

        if (quizContainer) quizContainer.style.display = 'none';
        if (quizResults) quizResults.style.display = 'block';
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
     * Reset interfejsu quizu
     */
    resetQuizInterface() {
        // Ukryj feedback
        this.hideFeedback();

        // Reset wszystkich sekcji
        ['multiple-choice-section', 'text-input-section', 'sentence-section'].forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'none';
        });

        // Wyczyść inputy
        const answerInput = document.getElementById('quiz-answer-input');
        const sentenceAnswer = document.getElementById('sentence-answer');
        
        if (answerInput) answerInput.value = '';
        if (sentenceAnswer) sentenceAnswer.value = '';

        // Usuń zaznaczenia z opcji
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });
    }

    /**
     * Aktualizacja instrukcji quizu
     */
    updateQuizInstruction(text) {
        const instructionEl = document.querySelector('.quiz-instruction');
        if (instructionEl) {
            instructionEl.textContent = text;
        }
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

    /**
     * Ustawienie callback dla wyboru odpowiedzi
     */
    setAnswerCallback(callback) {
        this.onAnswerSelected = callback;
    }

    /**
     * Cleanup UI
     */
    cleanup() {
        this.currentQuestion = null;
        this.currentQuiz = null;
        this.onAnswerSelected = null;
        this.hideFeedback();
        this.hideQuizInterface();
    }
}


// Export dla ES6 modules
export { QuizUI };

// Export default dla wygody
export default QuizUI;

console.log('✅ QuizUI załadowany');