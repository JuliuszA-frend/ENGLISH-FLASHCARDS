/**
 * AnswerChecker - Sprawdzanie poprawności odpowiedzi użytkownika
 */
class AnswerChecker {
    constructor() {
        // Można dodać konfigurację sprawdzania
        this.strictMode = false;
        this.similarityThreshold = 0.8;
        this.sentenceSimilarityThreshold = 0.7;
    }

    /**
     * Główna metoda sprawdzania odpowiedzi
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
            return similarity > this.similarityThreshold;
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
        return similarity > this.sentenceSimilarityThreshold;
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
     * Generowanie wyjaśnienia
     */
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
     * Sprawdzenie czy odpowiedź była szybka (dla Speed Quiz)
     */
    isQuickAnswer(responseTime, timeLimit) {
        const quickThreshold = timeLimit * 0.5; // Połowa dostępnego czasu
        return responseTime < quickThreshold;
    }

    /**
     * Analiza błędów w odpowiedzi
     */
    analyzeError(userAnswer, correctAnswer, answerType) {
        const analysis = {
            type: 'unknown',
            severity: 'medium',
            suggestions: []
        };

        const normalizedUser = this.normalizeAnswer(userAnswer);
        const normalizedCorrect = this.normalizeAnswer(correctAnswer);

        // Analiza różnych typów błędów
        if (answerType === 'text-input') {
            // Literówki
            if (this.calculateSimilarity(normalizedUser, normalizedCorrect) > 0.7) {
                analysis.type = 'typo';
                analysis.severity = 'low';
                analysis.suggestions.push('Sprawdź pisownię');
            }
            // Całkowicie błędna odpowiedź
            else if (this.calculateSimilarity(normalizedUser, normalizedCorrect) < 0.3) {
                analysis.type = 'wrong_word';
                analysis.severity = 'high';
                analysis.suggestions.push('Sprawdź znaczenie słowa');
            }
            // Częściowo poprawna
            else {
                analysis.type = 'partial';
                analysis.severity = 'medium';
                analysis.suggestions.push('Blisko! Spróbuj ponownie');
            }
        }

        // Dodatkowe analizy dla wielokrotnego wyboru
        if (answerType === 'multiple-choice') {
            analysis.type = 'wrong_choice';
            analysis.severity = 'medium';
            analysis.suggestions.push('Przeczytaj ponownie wszystkie opcje');
        }

        return analysis;
    }

    /**
     * Sprawdzenie czy użytkownik popełnia systematyczne błędy
     */
    detectPatterns(userAnswers) {
        const patterns = {
            consistentTypos: false,
            confusedWords: [],
            weakCategories: [],
            timePatterns: 'normal'
        };

        if (userAnswers.length < 5) return patterns;

        // Analiza błędów pisowni
        const typoCount = userAnswers.filter(answer => 
            !answer.isCorrect && 
            answer.answerType === 'text-input' &&
            this.calculateSimilarity(
                this.normalizeAnswer(answer.userAnswer),
                this.normalizeAnswer(answer.correctAnswer)
            ) > 0.7
        ).length;

        patterns.consistentTypos = typoCount / userAnswers.length > 0.3;

        // Analiza czasu odpowiedzi
        const avgResponseTime = userAnswers.reduce((sum, answer) => 
            sum + (answer.timeSpent || 0), 0) / userAnswers.length;

        if (avgResponseTime < 2000) {
            patterns.timePatterns = 'too_fast';
        } else if (avgResponseTime > 15000) {
            patterns.timePatterns = 'too_slow';
        }

        return patterns;
    }

    /**
     * Ustawienie trybu strict
     */
    setStrictMode(strict) {
        this.strictMode = strict;
        if (strict) {
            this.similarityThreshold = 0.95;
            this.sentenceSimilarityThreshold = 0.85;
        } else {
            this.similarityThreshold = 0.8;
            this.sentenceSimilarityThreshold = 0.7;
        }
    }

    /**
     * Sprawdzenie alternatywnych form słowa
     */
    checkAlternativeForms(userAnswer, correctAnswer) {
        // Lista popularnych alternatywnych form
        const alternatives = {
            // Liczba mnoga/pojedyncza
            'child': ['children'],
            'mouse': ['mice'],
            'foot': ['feet'],
            // Formy czasowników
            'go': ['goes', 'went', 'gone'],
            'be': ['is', 'are', 'was', 'were', 'been'],
            // Synonimy popularne
            'big': ['large', 'huge'],
            'small': ['little', 'tiny'],
            'happy': ['glad', 'joyful']
        };

        const normalizedUser = this.normalizeAnswer(userAnswer);
        const normalizedCorrect = this.normalizeAnswer(correctAnswer);

        // Sprawdź czy poprawna odpowiedź ma alternatywy
        if (alternatives[normalizedCorrect]) {
            return alternatives[normalizedCorrect].includes(normalizedUser);
        }

        // Sprawdź czy odpowiedź użytkownika jest alternatywą dla jakiegoś słowa
        for (const [base, alts] of Object.entries(alternatives)) {
            if (alts.includes(normalizedCorrect) && base === normalizedUser) {
                return true;
            }
        }

        return false;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnswerChecker;
}