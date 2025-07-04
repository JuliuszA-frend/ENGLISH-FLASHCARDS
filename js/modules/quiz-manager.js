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
        this.questionTimer = null;          // Referencja do setInterval
        this.questionTimeLeft = 0;          // Pozostały czas w sekundach
        this.questionStartTime = null;      // Czas rozpoczęcia pytania
        this.isTimerActive = false;         // Czy timer jest aktywny
        this.quizTypes = {
        CATEGORY: 'category',
        RANDOM: 'random',
        BOOKMARKS: 'bookmarks',
        FINAL: 'final',
        SPEED: 'speed',
        SPELLING: 'spelling',
        MIXED_CATEGORIES: 'mixed',
        HARD_WORDS: 'hard_words',          // NOWE - tylko trudne słowa
        EASY_WORDS: 'easy_words',          // NOWE - tylko łatwe słowa  
        PROGRESSIVE: 'progressive',        // NOWE - progresywny (łatwe→trudne)
        ADAPTIVE: 'adaptive'               // NOWE - adaptacyjny do użytkownika
    };
        this.allResults = {};
        // ✅ POPRAWIONY KLUCZ - spójny z innymi menedżerami
        this.storageKey = 'english-flashcards-quiz-results';
        this.usedQuestionsKey = 'english-flashcards-used-questions';
        
        // ✨ DODAJ: Weryfikacja klucza przy starcie
        this.verifyStorageKey();
        
        this.debugMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.loadAllResultsFromStorage();
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

    loadAllResultsFromStorage() {
        try {
            const existingResults = this.loadQuizResults(); // Użyj istniejącej logiki ładowania
            this.allResults = existingResults; // <-- ZAPISZ WYNIKI DO STANU WEWNĘTRZNEGO
            
            const resultsCount = Object.keys(this.allResults).length;
            
            if (this.debugMode) {
                console.group('🎯 QuizManager - Inicjalizacja wyników');
                console.log(`📊 Załadowano ${resultsCount} typów quizów z localStorage do stanu menedżera`);
                console.log('🔑 Klucze wyników:', Object.keys(this.allResults));
                console.groupEnd();
            }
        } catch (error) {
            console.error('❌ Błąd inicjalizacji wyników quizów:', error);
            this.allResults = {}; // Upewnij się, że stan jest czysty w razie błędu
        }
    }

    verifyStorageKey() {
        console.log(`🔑 QuizManager używa klucza: "${this.storageKey}"`);
        
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
    startBookmarksQuiz(app) {
        const bookmarkedWords = app.managers.progress.getAllBookmarkedWords();
    
        if (bookmarkedWords.length < 3) {
            NotificationManager.show('Potrzebujesz co najmniej 3 słowa do powtórki', 'info');
            return false;
        }

        const questions = this.generateQuestionsFromWords(bookmarkedWords, Math.min(15, bookmarkedWords.length));

        this.currentQuiz = {
            type: this.quizTypes.BOOKMARKS,
            category: 'bookmarks',
            categoryName: 'Quiz z powtórek',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.7), // 70%
            timeLimit: null
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * Quiz szybki - 10 pytań, 30 sekund na pytanie
     */
    startSpeedQuiz(app) {
        const questions = this.generateRandomQuestions(10);
        
        this.currentQuiz = {
            type: this.quizTypes.SPEED,
            category: 'speed',
            categoryName: 'Quiz błyskawiczny',
            totalQuestions: questions.length,
            passScore: 7,
            timeLimit: 10, // ✅ ZMIANA: 30 → 10 sekund na pytanie
            isSpeed: true
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * ✨ NOWA METODA: Quiz z wybranych kategorii
     */
    startMixedCategoriesQuiz(selectedCategories, app) {
        console.log(`🎯 Uruchamiam quiz z kategorii:`, selectedCategories);
        
        if (!selectedCategories || selectedCategories.length < 2) {
            console.error('❌ Za mało kategorii do quiz mieszany');
            NotificationManager.show('Wybierz co najmniej 2 kategorie', 'error');
            return false;
        }
        
        // Sprawdź czy kategorie istnieją
        const validCategories = selectedCategories.filter(key => 
            this.vocabulary.categories[key]
        );
        
        if (validCategories.length !== selectedCategories.length) {
            console.warn('⚠️ Niektóre kategorie nie istnieją');
        }
        
        if (validCategories.length < 2) {
            NotificationManager.show('Błąd: nieprawidłowe kategorie', 'error');
            return false;
        }
        
        // Generuj pytania z wybranych kategorii
        const questions = this.generateMixedCategoryQuestions(validCategories, 20);
        
        if (questions.length === 0) {
            NotificationManager.show('Brak dostępnych pytań z wybranych kategorii', 'error');
            return false;
        }
        
        // Przygotuj informacje o quizie
        const categoryNames = validCategories.map(key => 
            this.vocabulary.categories[key].name
        );
        
        this.currentQuiz = {
            type: this.quizTypes.MIXED_CATEGORIES,
            category: 'mixed',
            categoryName: `Quiz mieszany (${categoryNames.length} kategorii)`,
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.7), // 70%
            timeLimit: null,
            selectedCategories: validCategories,
            categoryNames: categoryNames
        };
        
        console.log(`✅ Quiz mieszany przygotowany: ${questions.length} pytań z kategorii: ${categoryNames.join(', ')}`);
        
        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * ✨ NOWA METODA: Generowanie pytań z wybranych kategorii
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
     * ✨ NOWA METODA: Quiz z trudnych słów (oznaczonych przez użytkownika)
     */
    startHardWordsQuiz(app) {
        const hardWords = this.getWordsByDifficulty('hard', app);
        
        if (hardWords.length < 5) {
            NotificationManager.show('Musisz oznaczyć więcej słów jako trudne (⭐⭐⭐)', 'info');
            return false;
        }

        const questions = this.generateQuestionsFromWords(hardWords, Math.min(15, hardWords.length));

        this.currentQuiz = {
            type: this.quizTypes.HARD_WORDS,
            category: 'hard_words',
            categoryName: 'Quiz trudnych słów',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.6), // 60% - trudniejszy próg
            timeLimit: null,
            description: 'Słowa oznaczone jako trudne (⭐⭐⭐)'
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * ✨ NOWA METODA: Quiz z łatwych słów 
     */
    startEasyWordsQuiz(app) {
        const easyWords = this.getWordsByDifficulty('easy', app);
        
        if (easyWords.length < 5) {
            NotificationManager.show('Musisz oznaczyć więcej słów jako łatwe (⭐)', 'info');
            return false;
        }

        const questions = this.generateQuestionsFromWords(easyWords, Math.min(20, easyWords.length));

        this.currentQuiz = {
            type: this.quizTypes.EASY_WORDS,
            category: 'easy_words', 
            categoryName: 'Quiz łatwych słów',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.8), // 80% - wyższy próg dla łatwych
            timeLimit: null,
            description: 'Słowa oznaczone jako łatwe (⭐)'
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * ✨ NOWA METODA: Quiz progresywny (łatwe → średnie → trudne)
     */
    startProgressiveQuiz(app) {
        const easyWords = this.getWordsByDifficulty('easy', app).slice(0, 5);
        const mediumWords = this.getWordsByDifficulty('medium', app).slice(0, 8);
        const hardWords = this.getWordsByDifficulty('hard', app).slice(0, 7);
        
        const allWords = [...easyWords, ...mediumWords, ...hardWords];
        
        if (allWords.length < 10) {
            NotificationManager.show('Potrzebujesz więcej słów z różnymi poziomami trudności', 'info');
            return false;
        }

        // NIE mieszaj - zachowaj kolejność łatwe→trudne
        const questions = this.generateQuestionsFromWords(allWords, allWords.length, false);

        this.currentQuiz = {
            type: this.quizTypes.PROGRESSIVE,
            category: 'progressive',
            categoryName: 'Quiz progresywny',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.7),
            timeLimit: null,
            description: 'Od łatwych do trudnych słów',
            isProgressive: true
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * ✨ NOWA METODA: Quiz adaptacyjny 
     */
    startAdaptiveQuiz(app) {
        const adaptiveWords = this.getAdaptiveWords(app);
        
        if (adaptiveWords.length < 10) {
            NotificationManager.show('Potrzebujesz więcej danych do quizu adaptacyjnego', 'info');
            return false;
        }

        const questions = this.generateQuestionsFromWords(adaptiveWords, 15);

        this.currentQuiz = {
            type: this.quizTypes.ADAPTIVE,
            category: 'adaptive',
            categoryName: 'Quiz adaptacyjny',
            totalQuestions: questions.length,
            passScore: Math.ceil(questions.length * 0.75),
            timeLimit: null,
            description: 'Dostosowany do Twojego poziomu',
            isAdaptive: true
        };

        this.initializeQuiz(questions, app);
        return true;
    }

    /**
     * ✨ Przerwanie bieżącego quizu
     * ✅ ZAKTUALIZOWANA WERSJA z obsługą timera
     */
    cancelQuiz(app) {
        console.log('🚫 QuizManager: Przerwanie quizu');
        
        if (!this.currentQuiz) {
            console.warn('⚠️ Brak aktywnego quizu do przerwania');
            return false;
        }
        
        // ✨ NOWE: Zatrzymaj i ukryj timer przy przerywaniu quizu
        console.log('⏰ Zatrzymuję timer przed przerwaniem quizu...');
        this.stopQuestionTimer();
        this.hideTimer();
        
        const cancelledQuiz = this.currentQuiz;
        const currentQuestion = this.currentQuestionIndex + 1;
        const totalQuestions = this.currentQuestions.length;
        const currentScore = this.score;
        
        // Przygotuj informacje o bieżącym postępie dla logów
        const progressInfo = {
            quizType: cancelledQuiz.type,
            categoryName: cancelledQuiz.categoryName,
            currentQuestion: currentQuestion,
            totalQuestions: totalQuestions,
            currentScore: currentScore,
            progress: `${currentQuestion}/${totalQuestions}`,
            scoreProgress: `${currentScore}/${Math.max(1, currentQuestion - 1)}`,
            isSpeedQuiz: cancelledQuiz.isSpeed || false
        };
        
        console.log('📊 Postęp quizu przed przerwaniem:', progressInfo);
        
        try {
            // 1. Wyczyść stan bieżącego quizu
            console.log('🧹 Czyszczenie stanu quizu...');
            this.currentQuiz = null;
            this.currentQuestions = [];
            this.currentQuestionIndex = 0;
            this.userAnswers = [];
            this.score = 0;
            
            // ✨ NOWE: Wyczyść stan timera
            this.questionTimer = null;
            this.questionTimeLeft = 0;
            this.questionStartTime = null;
            this.isTimerActive = false;
            
            // 2. Ukryj interfejs quizu
            console.log('🎨 Ukrywanie interfejsu quizu...');
            const quizContainer = document.getElementById('quiz-container');
            const quizResults = document.getElementById('quiz-results');
            
            if (quizContainer) {
                quizContainer.style.display = 'none';
                console.log('✅ Quiz container ukryty');
            }
            
            if (quizResults) {
                quizResults.style.display = 'none';
                console.log('✅ Quiz results ukryte');
            }
            
            // 3. Pokaż selector quizów
            console.log('📋 Pokazywanie selectora quizów...');
            const quizSelector = document.getElementById('quiz-selector');
            if (quizSelector) {
                quizSelector.style.display = 'block';
                console.log('✅ Quiz selector pokazany');
            }
            
            // 4. Przełącz aplikację na tryb quizów (menu wyboru)
            if (app && typeof app.switchMode === 'function') {
                console.log('🔄 Przełączanie na tryb quiz...');
                app.switchMode('quiz');
            } else {
                console.warn('⚠️ Nie można przełączyć trybu - brak referencji do app');
            }
            
            // 5. Zresetuj interfejs quizu do stanu początkowego
            console.log('🔄 Resetowanie interfejsu quizu...');
            this.resetQuizInterface();
            
            // ✨ NOWE: Dodatkowe czyszczenie elementów związanych z timerem
            const timerElement = document.getElementById('quiz-timer');
            if (timerElement) {
                timerElement.classList.remove('warning', 'critical', 'visible');
                console.log('🧹 Wyczyszczono klasy timera');
            }
            
            // ✨ NOWE: Wyczyść wszystkie feedback
            const feedbackEl = document.getElementById('quiz-feedback');
            if (feedbackEl) {
                feedbackEl.style.display = 'none';
                feedbackEl.className = 'quiz-feedback'; // Reset klas CSS
                console.log('🧹 Wyczyszczono feedback');
            }
            
            console.log(`✅ Quiz "${cancelledQuiz.categoryName}" został przerwany pomyślnie`);
            
            // 6. Wyślij event o przerwaniu (dla innych komponentów)
            const eventDetail = {
                quiz: cancelledQuiz,
                progress: progressInfo,
                timestamp: new Date().toISOString(),
                reason: 'user_cancelled'
            };
            
            document.dispatchEvent(new CustomEvent('quizCancelled', {
                detail: eventDetail
            }));
            
            console.log('📡 Event quizCancelled wysłany:', eventDetail);
            
            // 7. Pokaż notyfikację o przerwaniu
            const message = progressInfo.isSpeedQuiz 
                ? `Speed Quiz przerwany (${progressInfo.progress})`
                : `Quiz "${cancelledQuiz.categoryName}" przerwany (${progressInfo.progress})`;
                
            if (window.NotificationManager) {
                NotificationManager.show(message, 'info', 3000);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Błąd podczas przerwania quizu:', error);
            console.error('📋 Stack trace:', error.stack);
            
            // ✨ NOWE: Bardziej defensywne fallback cleaning
            try {
                // Force cleanup w przypadku błędu
                this.stopQuestionTimer();
                this.hideTimer();
                
                // Ukryj wszystkie sekcje quizu
                ['quiz-container', 'quiz-results', 'quiz-feedback'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.style.display = 'none';
                });
                
                // Pokaż selector quizów
                const quizSelector = document.getElementById('quiz-selector');
                if (quizSelector) quizSelector.style.display = 'block';
                
                console.log('🔧 Emergency cleanup wykonany');
                
            } catch (cleanupError) {
                console.error('💥 Krytyczny błąd podczas emergency cleanup:', cleanupError);
            }
            
            // Fallback - na siłę przywróć menu quizów
            if (app && typeof app.switchMode === 'function') {
                try {
                    app.switchMode('quiz');
                    console.log('🔄 Fallback: przełączono na menu quizów');
                } catch (switchError) {
                    console.error('❌ Błąd fallback switchMode:', switchError);
                }
            }
            
            // Pokaż notyfikację o błędzie
            if (window.NotificationManager) {
                NotificationManager.show('Wystąpił błąd podczas przerywania quizu', 'error', 4000);
            }
            
            return false;
        }
    }

    /**
     * ✨ NOWA METODA: Reset interfejsu quizu po przerwaniu
     */
    resetQuizInterface() {
        console.log('🔄 Resetowanie interfejsu quizu');
        
        try {
            // Wyczyść wszystkie sekcje odpowiedzi
            const sections = [
                'multiple-choice-section',
                'text-input-section', 
                'sentence-section',
                'quiz-feedback'
            ];
            
            sections.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.style.display = 'none';
                }
            });
            
            // Wyczyść inputy
            const answerInput = document.getElementById('quiz-answer-input');
            const sentenceAnswer = document.getElementById('sentence-answer');
            
            if (answerInput) answerInput.value = '';
            if (sentenceAnswer) sentenceAnswer.value = '';
            
            // Usuń zaznaczenia opcji
            document.querySelectorAll('.answer-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Zresetuj nagłówek
            const titleEl = document.getElementById('quiz-title');
            const currentEl = document.getElementById('quiz-current');
            const totalEl = document.getElementById('quiz-total');
            const progressFillEl = document.getElementById('quiz-progress-fill');
            const scoreDisplayEl = document.getElementById('quiz-score-display');
            
            if (titleEl) titleEl.textContent = 'Wybierz quiz';
            if (currentEl) currentEl.textContent = '0';
            if (totalEl) totalEl.textContent = '0';
            if (progressFillEl) progressFillEl.style.width = '0%';
            if (scoreDisplayEl) scoreDisplayEl.textContent = '0/0';
            
            console.log('✅ Interfejs quizu zresetowany');
            
        } catch (error) {
            console.warn('⚠️ Błąd resetowania interfejsu quizu:', error);
        }
    }

    /**
     * Inicjalizacja quizu
     */
    initializeQuiz(questions, app) {
        this.currentApp = app;  // ✅ Zapisz referencję do app
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

        // Ukryj feedback z poprzedniego pytania
        const feedbackEl = document.getElementById('quiz-feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
        }

        // Aktualizuj nagłówek quizu
        this.updateQuizHeader();

        // Wyświetl pytanie
        this.displayQuestion(question);

        // Resetuj interfejs odpowiedzi
        this.resetAnswerInterface();

        // ✨ NOWE: Pokaż i rozpocznij timer dla speed quiz
        if (this.currentQuiz && this.currentQuiz.isSpeed) {
            this.showTimer();
            this.startQuestionTimer(app);
        } else {
            this.hideTimer();
        }
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

    updateAchievements(results) {
        // "Mistrz powtórek", "Błyskawica", "Słuchacz" itp.
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
                this.selectAnswer(option, index, this.currentApp);  // ✅ Przekaż app
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
     * POPRAWKA 4: NOWA METODA - Pokazanie timera
     */
    showTimer() {
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) {
            timerEl.style.display = 'block'; // ✅ Usuń display: none
            console.log('⏰ Timer został pokazany');
        }
    }

    /**
     * POPRAWKA 5: NOWA METODA - Ukrycie timera
     */
    hideTimer() {
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) {
            timerEl.style.display = 'none';
            console.log('⏰ Timer został ukryty');
        }
    }

    /**
     * POPRAWKA 6: NOWA METODA - Rozpoczęcie timera pytania
     */
    startQuestionTimer(app) {
        console.log('⏰ Rozpoczynam timer pytania...');
        
        // Zatrzymaj poprzedni timer jeśli istnieje
        this.stopQuestionTimer();
        
        // Ustaw czas na podstawie ustawień quizu
        this.questionTimeLeft = this.currentQuiz.timeLimit || 10;
        this.questionStartTime = Date.now();
        this.isTimerActive = true;
        
        // Zaktualizuj wyświetlanie
        this.updateTimerDisplay();
        
        // Rozpocznij odliczanie (co 100ms dla płynności)
        this.questionTimer = setInterval(() => {
            this.updateTimer(app);
        }, 100);
        
        console.log(`⏰ Timer uruchomiony na ${this.questionTimeLeft} sekund`);
    }

    /**
     * POPRAWKA 7: NOWA METODA - Zatrzymanie timera
     */
    stopQuestionTimer() {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
            this.isTimerActive = false;
            console.log('⏰ Timer zatrzymany');
        }
    }

    /**
     * POPRAWKA 8: NOWA METODA - Aktualizacja timera
     */
    updateTimer(app) {
        if (!this.isTimerActive) return;
        
        const elapsed = (Date.now() - this.questionStartTime) / 1000;
        this.questionTimeLeft = Math.max(0, this.currentQuiz.timeLimit - elapsed);
        
        // Aktualizuj wyświetlanie
        this.updateTimerDisplay();
        
        // Sprawdź czy czas się skończył
        if (this.questionTimeLeft <= 0) {
            console.log('⏰ Czas się skończył!');
            this.onTimerExpired(app);
        }
    }

    /**
     * POPRAWKA 9: NOWA METODA - Aktualizacja wyświetlania timera
     */
    updateTimerDisplay() {
        const timerValueEl = document.getElementById('timer-value');
        const timerFillEl = document.getElementById('timer-fill');
        
        if (timerValueEl) {
            timerValueEl.textContent = Math.ceil(this.questionTimeLeft);
        }
        
        if (timerFillEl) {
            const percentage = (this.questionTimeLeft / this.currentQuiz.timeLimit) * 100;
            timerFillEl.style.width = `${percentage}%`;
            
            // Zmień kolor w zależności od pozostałego czasu
            if (percentage > 50) {
                timerFillEl.style.background = '#22c55e'; // Zielony
            } else if (percentage > 25) {
                timerFillEl.style.background = '#f59e0b'; // Pomarańczowy
            } else {
                timerFillEl.style.background = '#ef4444'; // Czerwony
            }
        }
    }

    /**
     * POPRAWKA 10: NOWA METODA - Obsługa wygaśnięcia timera
     */
    onTimerExpired(app) {
        console.log('🚨 Timer wygasł - automatyczne przejście');
        
        // Zatrzymaj timer
        this.stopQuestionTimer();
        
        // Zapisz odpowiedź jako niepoprawną (timeout)
        const question = this.getCurrentQuestion();
        if (question) {
            this.userAnswers.push({
                question: question,
                userAnswer: '(brak odpowiedzi - timeout)',
                correctAnswer: question.correctAnswer || question.polish,
                isCorrect: false,
                answerType: 'timeout',
                timeSpent: this.currentQuiz.timeLimit * 1000 // pełny czas w ms
            });
            
            // Pokaż feedback dla timeout
            this.showTimeoutFeedback(question, app);
        }
    }

    /**
     * POPRAWKA 11: NOWA METODA - Feedback dla timeout
     */
    showTimeoutFeedback(question, app) {
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
                    💡 Wskazówka: W speed quizu masz tylko ${this.currentQuiz.timeLimit} sekund na odpowiedź!
                </div>
            `;
        }

        // Aktualizuj przycisk następnego pytania
        if (nextBtn) {
            nextBtn.textContent = this.isLastQuestion() ? 'Zobacz wyniki' : 'Następne pytanie';
        }

        // Pokaż feedback
        feedbackEl.style.display = 'block';
        
        // Auto-przejście po 3 sekundach
        setTimeout(() => {
            if (nextBtn) {
                nextBtn.click();
            }
        }, 3000);
    }


    /**
     * Wybór odpowiedzi w pytaniu wielokrotnego wyboru
     */
    selectAnswer(answer, optionIndex, app) {
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
            this.submitAnswer(app, {  // ✅ Poprawne przekazanie parametrów
                type: 'multiple-choice',
                answer: answer,
                optionIndex: optionIndex
            });
        }, 500);
    }

    /**
     * Przesłanie odpowiedzi przez użytkownika
     * ✅ ZAKTUALIZOWANA WERSJA z obsługą timera Speed Quiz
     */
    submitAnswer(app, answerData = null) {
        console.log('📝 submitAnswer wywołane', { answerData, isSpeedQuiz: this.currentQuiz?.isSpeed });
        
        // ✨ NOWE: Zatrzymaj timer gdy użytkownik odpowie w Speed Quiz
        if (this.currentQuiz && this.currentQuiz.isSpeed && this.isTimerActive) {
            console.log('⏰ Zatrzymuję timer po odpowiedzi użytkownika');
            this.stopQuestionTimer();
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
            const multipleChoiceSection = document.getElementById('multiple-choice-section');
            const textInputSection = document.getElementById('text-input-section');
            const sentenceSection = document.getElementById('sentence-section');

            if (textInputSection && textInputSection.style.display !== 'none') {
                const answerInput = document.getElementById('quiz-answer-input');
                userAnswer = answerInput ? answerInput.value.trim() : '';
                answerType = 'text-input';
                console.log('⌨️ Text input answer:', userAnswer);
            } else if (sentenceSection && sentenceSection.style.display !== 'none') {
                const sentenceAnswer = document.getElementById('sentence-answer');
                userAnswer = sentenceAnswer ? sentenceAnswer.value.trim() : '';
                answerType = 'sentence-translation';
                console.log('📝 Sentence answer:', userAnswer);
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

        // ✨ NOWE: Oblicz czas odpowiedzi (użyteczne dla statystyk)
        const responseTime = this.questionStartTime ? Date.now() - this.questionStartTime : 0;
        const responseTimeSeconds = Math.round(responseTime / 1000 * 10) / 10; // Zaokrąglij do 0.1s
        
        console.log(`⏱️ Czas odpowiedzi: ${responseTimeSeconds}s`);

        // Sprawdź poprawność odpowiedzi
        const result = this.checkAnswer(userAnswer, question, answerType);
        
        console.log('🔍 Answer check result:', {
            isCorrect: result.isCorrect,
            userAnswer: result.userAnswer,
            correctAnswer: result.correctAnswer
        });
        
        // ✨ ZAKTUALIZOWANE: Zapisz odpowiedź użytkownika z dodatkowymi informacjami
        const answerRecord = {
            question: question,
            userAnswer: userAnswer,
            correctAnswer: result.correctAnswer,
            isCorrect: result.isCorrect,
            answerType: answerType,
            timeSpent: responseTime,
            responseTimeSeconds: responseTimeSeconds, // ✨ NOWE: Czas w sekundach dla czytelności
            isSpeedQuiz: this.currentQuiz?.isSpeed || false, // ✨ NOWE: Czy to był speed quiz
            remainingTime: this.currentQuiz?.isSpeed ? this.questionTimeLeft : null // ✨ NOWE: Pozostały czas przy odpowiedzi
        };
        
        this.userAnswers.push(answerRecord);

        if (result.isCorrect) {
            this.score++;
            console.log(`✅ Correct answer! Score: ${this.score}/${this.userAnswers.length}`);
        } else {
            console.log(`❌ Incorrect answer. Score: ${this.score}/${this.userAnswers.length}`);
        }

        // ✨ NOWE: Dodaj informację o szybkości odpowiedzi do feedback (dla Speed Quiz)
        if (this.currentQuiz && this.currentQuiz.isSpeed) {
            result.speedInfo = {
                responseTime: responseTimeSeconds,
                remainingTime: Math.max(0, this.questionTimeLeft),
                wasQuick: responseTimeSeconds < (this.currentQuiz.timeLimit * 0.5) // Szybka odpowiedź = mniej niż połowa czasu
            };
            
            console.log('🚀 Speed Quiz info:', result.speedInfo);
        }

        // Pokaż feedback
        this.showQuestionFeedback(result, app);
        
        console.log('📊 Answer submitted successfully');
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

        // ✅ DODAJ: Ustaw klasę CSS dla typu feedback
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
        // Ukryj feedback przed przejściem
        const feedbackEl = document.getElementById('quiz-feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
        }

        if (this.isLastQuestion()) {
            // ✨ NOWE: Zatrzymaj timer przed pokazaniem wyników
            this.stopQuestionTimer();
            this.hideTimer();
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
        // ✅ POPRAW: Ukryj feedback
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

    generateAdaptiveQuestions(count) {
        const progress = app.managers.progress;
        const words = this.getAllWords();
        
        // Wybierz słowa na podstawie ich poziomu trudności
        const adaptiveWords = words.filter(word => {
            const difficulty = progress.getWordDifficulty(word);
            return this.shouldIncludeWord(difficulty);
        });
        
        return this.generateQuestionsFromWords(adaptiveWords, count);
    }

    /**
     * ✨ MODYFIKACJA: generateQuestionsFromWords - dodaj flagę shuffling
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
     * ✨ NOWA METODA: Pobieranie słów według poziomu trudności
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
     * ✨ NOWA METODA: Inteligentny dobór słów dla quizu adaptacyjnego
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
     * ✨ NOWA METODA: Statystyki trudności dla UI
     */
    getDifficultyQuizStats(app) {
        if (!app.managers.progress) return null;
        
        const stats = app.managers.progress.getDifficultyStats();
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
        const quizResults = this.allResults; // <-- ZMIANA: Użycie stanu z pamięci
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
        console.group('💾 saveQuizResults - Zapis na podstawie stanu w pamięci');
        
        try {
            if (!results || !results.quizType || !results.category) {
                console.error('❌ Nieprawidłowe dane wyników:', results);
                return false;
            }
            
            const key = `${results.quizType}_${results.category}`;
            console.log(`🔑 Klucz zapisu: "${key}"`);
            
            // 1. Użyj stanu z pamięci, ZAMIAST this.loadQuizResults()
            // const allResults = this.loadQuizResults(); // <--- USUŃ TĘ LINIĘ
            
            // 2. Modyfikuj bezpośrednio stan w pamięci (this.allResults)
            if (!this.allResults[key]) {
                this.allResults[key] = [];
            }
            
            this.allResults[key].push(results);
            
            // Opcjonalne: przycinanie do 10 ostatnich wyników
            if (this.allResults[key].length > 10) {
                this.allResults[key] = this.allResults[key].slice(-10);
            }
            
            // 3. Przygotuj dane do zapisu
            const dataToSave = JSON.stringify(this.allResults);
            
            // 4. ZAPISZ CAŁY OBIEKT DO localStorage
            localStorage.setItem(this.storageKey, dataToSave);
            console.log(`✅ Zapisano stan z ${Object.keys(this.allResults).length} kluczami do localStorage.`);
            
            // Weryfikacja (opcjonalna, ale dobra praktyka)
            const verification = localStorage.getItem(this.storageKey);
            if (!verification || verification.length !== dataToSave.length) {
                console.error(`❌ BŁĄD: Weryfikacja zapisu w localStorage nie powiodła się!`);
                return false;
            }
            
            document.dispatchEvent(new CustomEvent('quizResultsSaved', { detail: { key, results } }));
            
            console.groupEnd();
            return true;
            
        } catch (error) {
            console.error('💥 KRYTYCZNY BŁĄD zapisywania wyników quizu:', error);
            console.groupEnd();
            return false;
        }
    }

    loadQuizResults() {
        console.group('📚 loadQuizResults - SZCZEGÓŁOWY DEBUG');
        
        try {
            console.log(`🔑 Ładuję z klucza: "${this.storageKey}"`);
            
            // 1. Sprawdź dostępność localStorage
            if (typeof Storage === 'undefined') {
                console.error('❌ localStorage nie jest dostępne w tej przeglądarce');
                console.groupEnd();
                return {};
            }
            
            // 2. Sprawdź wszystkie klucze w localStorage
            const allKeys = Object.keys(localStorage);
            console.log(`🗂️ Wszystkie klucze w localStorage: [${allKeys.join(', ')}]`);
            
            const quizKeys = allKeys.filter(key => key.includes('quiz') || key.includes('result'));
            if (quizKeys.length > 0) {
                console.log(`🎯 Klucze związane z quizami: [${quizKeys.join(', ')}]`);
            }
            
            // 3. Pobierz dane
            const saved = localStorage.getItem(this.storageKey);
            
            if (!saved) {
                console.log(`📭 Brak danych pod kluczem "${this.storageKey}"`);
                console.log(`🔍 Sprawdzam localStorage.length: ${localStorage.length}`);
                
                // Sprawdź czy localStorage w ogóle działa
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
            
            // 4. Parsuj dane
            const parsed = JSON.parse(saved);
            const keys = Object.keys(parsed);
            
            console.log(`🔑 Znajdowane klucze w danych: [${keys.join(', ')}]`);
            console.log(`📊 Liczba kategorii z wynikami: ${keys.length}`);
            
            // 5. Szczegóły każdego klucza
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

    getCategoryResults(category) {
        try {
            // const allResults = this.loadQuizResults(); // <--- USUŃ TĘ LINIĘ
            const key = `${this.quizTypes.CATEGORY}_${category}`;
            const results = this.allResults[key] || []; // <-- ODCZYTAJ Z PAMIĘCI
            
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

    getOverallStats() {
        const allResults = this.allResults; // <-- ZMIANA: Użycie stanu z pamięci
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
        const allResults = this.allResults; // <-- ZMIANA: Użycie stanu z pamięci
        let count = 0;

        Object.entries(allResults).forEach(([key, results]) => {
            if (key.startsWith(this.quizTypes.CATEGORY) && Array.isArray(results) && results.length > 0) {
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
        // ✨ NOWE: Zatrzymaj timer przy czyszczeniu
        this.stopQuestionTimer();
        
        // Czyszczenie stanu w pamięci
        this.vocabulary = null;
        this.currentQuiz = null;
        this.allResults = {};
        
        // ✨ NOWE: Wyczyść właściwości timera
        this.questionTimer = null;
        this.questionTimeLeft = 0;
        this.questionStartTime = null;
        this.isTimerActive = false;
        
        console.log('🧹 QuizManager cleanup: Wyczyściłem stan w pamięci (bez usuwania localStorage).');
    }
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizManager;
}