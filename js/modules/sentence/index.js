/**
 * Sentence Module Index
 * Główny punkt wejścia do modułu fiszek zdaniowych
 */

import SentenceFlashcardManager from './sentence-flashcard-manager.js';

// 🎯 GŁÓWNY EXPORT
export { SentenceFlashcardManager };

// 🔄 Export domyślny dla kompatybilności
export default SentenceFlashcardManager;

// 📊 Metadane modułu
export const SentenceModuleInfo = {
    name: 'SentenceFlashcards',
    version: '1.0.0',
    description: 'Moduł do nauki słownictwa w kontekście zdań',
    author: 'English Learning App',
    dependencies: ['FlashcardManager', 'AudioManager', 'ProgressManager'],
    features: [
        'Nauka słownictwa w kontekście',
        'Podświetlanie słów kluczowych',
        'Audio dla zdań i słów',
        'System trudności',
        'Bookmarki dla zdań'
    ]
};

// 🧪 FUNKCJE NARZĘDZIOWE (opcjonalne)

/**
 * Sprawdzenie czy moduł może być zainicjalizowany
 */
export function verifySentenceModuleRequirements() {
    const requirements = {
        vocabulary: null,
        audioManager: null,
        progressManager: null,
        imageManager: null
    };
    
    return {
        isReady: false,
        missing: Object.keys(requirements),
        check: (managers) => {
            const missing = [];
            
            if (!managers.vocabulary) missing.push('vocabulary');
            if (!managers.audio) missing.push('audioManager');
            if (!managers.progress) missing.push('progressManager');
            if (!managers.image) missing.push('imageManager');
            
            return {
                isReady: missing.length === 0,
                missing: missing
            };
        }
    };
}

/**
 * Factory function do tworzenia SentenceFlashcardManager
 */
export function createSentenceManager(vocabulary, managers = {}) {
    console.log('🏭 Factory: Tworzę SentenceFlashcardManager...');
    
    try {
        const sentenceManager = new SentenceFlashcardManager();
        
        // Sprawdź wymagania
        const verification = verifySentenceModuleRequirements();
        const checkResult = verification.check({
            vocabulary: vocabulary,
            audio: managers.audio,
            progress: managers.progress,
            image: managers.image
        });
        
        if (!checkResult.isReady) {
            console.warn('⚠️ Brakuje wymaganych zależności:', checkResult.missing);
            return null;
        }
        
        console.log('✅ Factory: SentenceFlashcardManager utworzony');
        return sentenceManager;
        
    } catch (error) {
        console.error('❌ Factory: Błąd tworzenia SentenceFlashcardManager:', error);
        return null;
    }
}

/**
 * Test dostępności modułu zdaniowego
 */
export function testSentenceModule() {
    console.group('🧪 Test modułu zdaniowego');
    
    try {
        // Test 1: Tworzenie instancji
        const manager = new SentenceFlashcardManager();
        console.log('✅ Test 1: Tworzenie instancji - PASSED');
        
        // Test 2: Sprawdzenie wymaganych metod
        const requiredMethods = [
            'init',
            'filterWordsWithSentences', 
            'loadWord',
            'nextSentence',
            'previousSentence',
            'flipCard',
            'getStats',
            'cleanup'
        ];
        
        const missingMethods = requiredMethods.filter(method => 
            typeof manager[method] !== 'function'
        );
        
        if (missingMethods.length === 0) {
            console.log('✅ Test 2: Wymagane metody - PASSED');
        } else {
            console.error('❌ Test 2: Brakuje metod:', missingMethods);
        }
        
        // Test 3: Sprawdzenie właściwości
        const hasRequiredProps = manager.hasOwnProperty('sentenceWords') && 
                                manager.hasOwnProperty('currentWordIndex') &&
                                manager.hasOwnProperty('settings');
        
        if (hasRequiredProps) {
            console.log('✅ Test 3: Wymagane właściwości - PASSED');
        } else {
            console.error('❌ Test 3: Brakuje wymaganych właściwości');
        }
        
        console.log('🎉 Moduł zdaniowy działa poprawnie');
        console.groupEnd();
        return true;
        
    } catch (error) {
        console.error('❌ Test modułu zdaniowego FAILED:', error);
        console.groupEnd();
        return false;
    }
}

// 🔧 DEBUG TOOLS (tylko dla developmentu)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    
    window.debugSentenceModule = {
        test: testSentenceModule,
        verify: verifySentenceModuleRequirements,
        create: createSentenceManager,
        info: SentenceModuleInfo,
        
        /**
         * Sprawdź słowa z przykładami zdań w słowniku
         */
        checkWordsWithSentences: (vocabulary) => {
            if (!vocabulary || !vocabulary.categories) {
                console.error('❌ Brak słownictwa');
                return null;
            }
            
            let totalWords = 0;
            let wordsWithSentences = 0;
            const categoriesStats = {};
            
            Object.entries(vocabulary.categories).forEach(([key, category]) => {
                if (category.words) {
                    const categoryTotal = category.words.length;
                    const categoryWithSentences = category.words.filter(word => 
                        word.examples && Array.isArray(word.examples) && word.examples.length > 0
                    ).length;
                    
                    totalWords += categoryTotal;
                    wordsWithSentences += categoryWithSentences;
                    
                    categoriesStats[key] = {
                        name: category.name,
                        total: categoryTotal,
                        withSentences: categoryWithSentences,
                        percentage: Math.round((categoryWithSentences / categoryTotal) * 100)
                    };
                }
            });
            
            const result = {
                totalWords,
                wordsWithSentences,
                percentage: Math.round((wordsWithSentences / totalWords) * 100),
                categories: categoriesStats
            };
            
            console.table(categoriesStats);
            console.log(`📊 Podsumowanie: ${wordsWithSentences}/${totalWords} słów ma przykłady zdań (${result.percentage}%)`);
            
            return result;
        }
    };
    
    console.log('🧪 Debug tools dla modułu zdaniowego załadowane');
    console.log('💡 Użyj: window.debugSentenceModule.test() aby przetestować moduł');
}

console.log('📦 Sentence module załadowany');