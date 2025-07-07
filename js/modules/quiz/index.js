/**
 * Quiz System - Centralny punkt importu wszystkich modułów quizu
 * Nowoczesny ES6 modules approach
 */

// Import wszystkich modułów quizu
import QuizTimer from './quiz-timer.js';
import QuizStorage from './quiz-storage.js';
import QuestionGenerator from './question-generator.js';
import AnswerChecker from './answer-checker.js';
import QuizUI from './quiz-ui.js';
import QuizTypes from './quiz-types.js';
import QuizManager from './quiz-manager.js';
import { QuizLoader, getQuizLoader, loadQuizManager } from './quiz-loader.js';

// Eksport wszystkich klas jako named exports
export {
    QuizTimer,
    QuizStorage,
    QuestionGenerator,
    AnswerChecker,
    QuizUI,
    QuizTypes,
    QuizManager,
    QuizLoader,
    getQuizLoader,
    loadQuizManager
};

// Eksport domyślny - główny QuizManager
export default QuizManager;

// Funkcja pomocnicza do utworzenia pełnego zestawu quizów
export async function createQuizSystem(vocabulary = null) {
    console.log('🏗️ Tworzę kompletny system quizów...');
    
    try {
        // Utwórz wszystkie komponenty
        const timer = new QuizTimer();
        const storage = new QuizStorage();
        const questionGenerator = new QuestionGenerator(vocabulary);
        const answerChecker = new AnswerChecker();
        const ui = new QuizUI();
        const quizManager = new QuizManager();
        
        // Ustaw słownictwo jeśli podane
        if (vocabulary) {
            quizManager.setVocabulary(vocabulary);
        }
        
        console.log('✅ System quizów utworzony pomyślnie');
        
        return {
            timer,
            storage,
            questionGenerator,
            answerChecker,
            ui,
            quizManager,
            // Metody pomocnicze
            createLoader: () => new QuizLoader(),
            loadManager: loadQuizManager
        };
    } catch (error) {
        console.error('❌ Błąd tworzenia systemu quizów:', error);
        throw error;
    }
}

// Funkcja weryfikacji dostępności wszystkich modułów
export function verifyQuizModules() {
    const modules = {
        QuizTimer: !!QuizTimer,
        QuizStorage: !!QuizStorage,
        QuestionGenerator: !!QuestionGenerator,
        AnswerChecker: !!AnswerChecker,
        QuizUI: !!QuizUI,
        QuizTypes: !!QuizTypes,
        QuizManager: !!QuizManager,
        QuizLoader: !!QuizLoader
    };
    
    const allAvailable = Object.values(modules).every(available => available);
    
    console.group('🔍 Weryfikacja modułów quizu');
    console.table(modules);
    console.log(allAvailable ? '✅ Wszystkie moduły dostępne' : '❌ Brakuje niektórych modułów');
    console.groupEnd();
    
    return {
        modules,
        allAvailable,
        missing: Object.entries(modules)
            .filter(([name, available]) => !available)
            .map(([name]) => name)
    };
}

// Debug tools
export const QuizDebug = {
    verifyModules: verifyQuizModules,
    createSystem: createQuizSystem,
    
    // Test wszystkich klas
    testAllClasses() {
        console.group('🧪 Test wszystkich klas quizu');
        
        try {
            const timer = new QuizTimer();
            console.log('✅ QuizTimer - OK');
            
            const storage = new QuizStorage();
            console.log('✅ QuizStorage - OK');
            
            const generator = new QuestionGenerator();
            console.log('✅ QuestionGenerator - OK');
            
            const checker = new AnswerChecker();
            console.log('✅ AnswerChecker - OK');
            
            const ui = new QuizUI();
            console.log('✅ QuizUI - OK');
            
            const manager = new QuizManager();
            console.log('✅ QuizManager - OK');
            
            const loader = new QuizLoader();
            console.log('✅ QuizLoader - OK');
            
            console.log('🎉 Wszystkie klasy działają poprawnie!');
            return true;
            
        } catch (error) {
            console.error('❌ Błąd testowania klas:', error);
            return false;
        } finally {
            console.groupEnd();
        }
    }
};

// Globalne udostępnienie dla kompatybilności wstecznej i debugowania
if (typeof window !== 'undefined') {
    window.QuizSystem = {
        QuizTimer,
        QuizStorage,
        QuestionGenerator,
        AnswerChecker,
        QuizUI,
        QuizTypes,
        QuizManager,
        QuizLoader,
        createQuizSystem,
        verifyQuizModules,
        debug: QuizDebug
    };
    
    // Debug tools
    window.testQuizSystem = () => QuizDebug.testAllClasses();
    window.verifyQuizModules = verifyQuizModules;
}

console.log('✅ Quiz System - wszystkie moduły załadowane przez ES6 modules');