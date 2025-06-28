/**
 * ProgressManager - Naprawione zarządzanie postępem
 * POPRAWIONA WERSJA z pełną obsługą systemu trudności
 */
class ProgressManager {
    constructor() {
        this.vocabulary = null;
        this.storageKey = 'english-flashcards-progress';
        this.bookmarksKey = 'english-flashcards-bookmarks';
        this.difficultyKey = 'english-flashcards-difficulty';
    }

    /**
     * Ustawienie słownictwa - POPRAWIONE
     */
    setVocabulary(vocabulary) {
        this.vocabulary = vocabulary;
        
        // ✅ NOWE: Logowanie do debugowania
        console.log('📚 ProgressManager otrzymał słownictwo:', {
            categories: vocabulary?.categories ? Object.keys(vocabulary.categories).length : 0,
            structure: vocabulary?.categories ? 'OK' : 'BŁĄD'
        });
        
        // ✅ NOWE: Walidacja struktury danych
        if (!vocabulary || !vocabulary.categories) {
            console.error('❌ Nieprawidłowa struktura słownictwa w ProgressManager');
            return false;
        }
        
        return true;
    }

    /**
     * Oznaczenie słowa jako przejrzane - POPRAWIONE
     */
    markWordAsStudied(category, wordIndex, wordId = null) {
        const progress = this.loadProgress();
        const cardId = wordId || `${category}-${wordIndex}`;
        
        if (!progress.studiedCards.includes(cardId)) {
            progress.studiedCards.push(cardId);
            progress.lastStudied = new Date().toISOString();
            
            // ✅ POPRAWKA: Użyj poprawionej funkcji getCategoryWordCount
            if (!progress.categoryStats[category]) {
                progress.categoryStats[category] = {
                    studied: 0,
                    total: this.getCategoryWordCount(category), // Teraz działa prawidłowo
                    lastAccess: new Date().toISOString()
                };
            }
            
            progress.categoryStats[category].studied++;
            progress.categoryStats[category].lastAccess = new Date().toISOString();
            
            // ✅ NOWE: Aktualizuj total na wypadek zmiany w słownictwie
            progress.categoryStats[category].total = this.getCategoryWordCount(category);
            
            // Aktualizuj daty nauki
            this.updateStudyDates(progress);
            
            this.saveProgress(progress);
            
            // ✅ NOWE: Logowanie dla debugowania
            console.log(`📈 Słowo oznaczone jako nauczone: ${cardId}`, {
                category: category,
                studied: progress.categoryStats[category].studied,
                total: progress.categoryStats[category].total
            });
            
            return true;
        }
        
        return false;
    }

    /**
     * Pobranie postępu kategorii - POPRAWIONE i ROZSZERZONE
     */
    getCategoryProgress(category) {
        const progress = this.loadProgress();
        const categoryStats = progress.categoryStats[category];
        
        // ✅ POPRAWKA: Zawsze użyj aktualnej liczby słów z słownictwa
        const currentTotal = this.getCategoryWordCount(category);
        
        if (categoryStats) {
            // ✅ POPRAWKA: Aktualizuj total jeśli się zmienił
            if (categoryStats.total !== currentTotal) {
                categoryStats.total = currentTotal;
                this.saveProgress(progress);
            }
            
            const studied = categoryStats.studied;
            const total = currentTotal;
            const percentage = total > 0 ? Math.round((studied / total) * 100) : 0;
            
            return {
                studied: studied,
                total: total,
                percentage: percentage
            };
        }
        
        // ✅ POPRAWKA: Jeśli brak statystyk, zwróć aktualne dane
        return {
            studied: 0,
            total: currentTotal,
            percentage: 0
        };
    }

    /**
     * ✅ GŁÓWNA POPRAWKA: Prawidłowe liczenie słów w kategorii
     */
    getCategoryWordCount(category) {
        // ✅ POPRAWKA: Sprawdź strukturę vocabulary.categories zamiast vocabulary
        if (!this.vocabulary || !this.vocabulary.categories || !this.vocabulary.categories[category]) {
            console.warn(`⚠️ Brak kategorii: ${category} w słownictwie`);
            return 0;
        }
        
        // ✅ POPRAWKA: Dostęp przez categories[category].words
        const categoryData = this.vocabulary.categories[category];
        
        if (!categoryData.words || !Array.isArray(categoryData.words)) {
            console.warn(`⚠️ Kategoria ${category} nie ma tablicy słów`);
            return 0;
        }
        
        const wordCount = categoryData.words.length;
        
        // ✅ NOWE: Logowanie dla debugowania
        console.log(`📊 Liczba słów w kategorii ${category}: ${wordCount}`);
        
        return wordCount;
    }

    /**
     * Pobranie ogólnych statystyk - POPRAWIONE
     */
    getOverallStats() {
        const progress = this.loadProgress();
        const totalWords = this.getTotalWordCount();
        const studiedCount = progress.studiedCards.length;
        const studyStreak = this.calculateStudyStreak(progress.studyDates);
        const favoriteCategory = this.getFavoriteCategory(progress);
        
        return {
            totalStudied: studiedCount,
            totalWords: totalWords,
            studyStreak: studyStreak,
            favoriteCategory: favoriteCategory,
            studiedPercentage: totalWords > 0 ? Math.round((studiedCount / totalWords) * 100) : 0
        };
    }

    /**
     * ✅ POPRAWKA: Prawidłowe liczenie wszystkich słów
     */
    getTotalWordCount() {
        if (!this.vocabulary || !this.vocabulary.categories) {
            return 0;
        }
        
        // ✅ POPRAWKA: Iteruj przez vocabulary.categories
        let totalWords = 0;
        
        Object.values(this.vocabulary.categories).forEach(category => {
            if (category.words && Array.isArray(category.words)) {
                totalWords += category.words.length;
            }
        });
        
        console.log(`📚 Łączna liczba słów: ${totalWords}`);
        return totalWords;
    }

    /**
     * ✅ NOWA METODA: Resetowanie postępu kategorii (dla debugowania)
     */
    resetCategory(categoryKey) {
        const progress = this.loadProgress();
        
        if (progress.categoryStats[categoryKey]) {
            // Usuń słowa tej kategorii z przejrzanych
            const categoryPrefix = `${categoryKey}-`;
            progress.studiedCards = progress.studiedCards.filter(cardId => 
                !cardId.startsWith(categoryPrefix)
            );
            
            // Resetuj statystyki kategorii
            delete progress.categoryStats[categoryKey];
            
            this.saveProgress(progress);
            
            console.log(`🔄 Zresetowano postęp kategorii: ${categoryKey}`);
            return true;
        }
        
        return false;
    }

    /**
     * ✅ NOWA METODA: Diagnostyka kategorii (do debugowania)
     */
    debugCategory(category) {
        console.group(`🔍 Diagnostyka kategorii: ${category}`);
        
        // Sprawdź dostępność słownictwa
        console.log('📚 Słownictwo dostępne:', !!this.vocabulary);
        console.log('📂 Categories dostępne:', !!this.vocabulary?.categories);
        console.log('📁 Kategoria dostępna:', !!this.vocabulary?.categories?.[category]);
        
        if (this.vocabulary?.categories?.[category]) {
            const categoryData = this.vocabulary.categories[category];
            console.log('📄 Dane kategorii:', {
                name: categoryData.name,
                hasWords: !!categoryData.words,
                wordsCount: categoryData.words?.length || 0,
                wordsIsArray: Array.isArray(categoryData.words)
            });
        }
        
        // Sprawdź postęp
        const progress = this.getCategoryProgress(category);
        console.log('📈 Postęp kategorii:', progress);
        
        console.groupEnd();
        
        return {
            vocabularyAvailable: !!this.vocabulary,
            categoryAvailable: !!this.vocabulary?.categories?.[category],
            wordCount: this.getCategoryWordCount(category),
            progress: progress
        };
    }

    /**
     * ✅ NOWA METODA: Aktualizacja wszystkich statystyk kategorii
     */
    updateAllCategoryStats() {
        if (!this.vocabulary || !this.vocabulary.categories) {
            console.warn('⚠️ Brak słownictwa do aktualizacji statystyk');
            return false;
        }
        
        const progress = this.loadProgress();
        let updated = false;
        
        // Sprawdź wszystkie kategorie
        Object.keys(this.vocabulary.categories).forEach(categoryKey => {
            const currentTotal = this.getCategoryWordCount(categoryKey);
            
            if (progress.categoryStats[categoryKey]) {
                // Aktualizuj istniejące statystyki jeśli total się zmienił
                if (progress.categoryStats[categoryKey].total !== currentTotal) {
                    progress.categoryStats[categoryKey].total = currentTotal;
                    updated = true;
                    console.log(`📊 Zaktualizowano total dla ${categoryKey}: ${currentTotal}`);
                }
            }
        });
        
        if (updated) {
            this.saveProgress(progress);
            console.log('✅ Statystyki kategorii zaktualizowane');
        }
        
        return updated;
    }

    /**
     * ✨ NAPRAWIONA METODA: Toggle trudności słowa z pełną obsługą i logowaniem
     */
    toggleWordDifficulty(word) {
        console.log(`⭐ toggleWordDifficulty wywołane dla słowa: ${word.english}`);
        
        try {
            // 📊 Załaduj aktualny stan trudności
            const difficulty = this.loadDifficulty();
            const wordKey = this.getWordKey(word);
            
            console.log(`🔑 WordKey: ${wordKey}`);
            
            // 📈 Dostępne poziomy trudności
            const levels = ['easy', 'medium', 'hard'];
            
            // 📊 Znajdź aktualny poziom
            const currentLevel = difficulty[wordKey] || word.difficulty || 'medium';
            console.log(`📊 Aktualny poziom: ${currentLevel}`);
            
            // 🔄 Oblicz następny poziom (cyklicznie)
            const currentIndex = levels.indexOf(currentLevel);
            const nextIndex = (currentIndex + 1) % levels.length;
            const newLevel = levels[nextIndex];
            
            console.log(`🔄 Przełączam z ${currentLevel} (index: ${currentIndex}) na ${newLevel} (index: ${nextIndex})`);
            
            // 💾 Zapisz nowy poziom
            difficulty[wordKey] = newLevel;
            this.saveDifficulty(difficulty);
            
            console.log(`✅ Trudność zapisana: ${wordKey} → ${newLevel}`);
            
            // 📊 Wyloguj stan po zapisie (weryfikacja)
            const verificationDifficulty = this.loadDifficulty();
            const savedLevel = verificationDifficulty[wordKey];
            console.log(`🔍 Weryfikacja zapisu: ${savedLevel} (oczekiwano: ${newLevel})`);
            
            if (savedLevel !== newLevel) {
                console.error(`❌ BŁĄD: Poziom nie został poprawnie zapisany! Saved: ${savedLevel}, Expected: ${newLevel}`);
            }
            
            return newLevel;
            
        } catch (error) {
            console.error('❌ Błąd w toggleWordDifficulty:', error);
            console.error('❌ Stack trace:', error.stack);
            
            // Fallback - zwróć aktualny poziom lub domyślny
            const fallbackLevel = word.difficulty || 'medium';
            console.log(`🔄 Fallback: zwracam ${fallbackLevel}`);
            return fallbackLevel;
        }
    }

    /**
     * ✨ NOWA METODA: Pobieranie poziomu trudności słowa (dla UI)
     */
    getWordDifficulty(word) {
        try {
            const difficulty = this.loadDifficulty();
            const wordKey = this.getWordKey(word);
            const level = difficulty[wordKey] || word.difficulty || 'medium';
            
            console.log(`🔍 getWordDifficulty dla ${word.english}: ${level}`);
            return level;
            
        } catch (error) {
            console.error('❌ Błąd podczas pobierania trudności:', error);
            return word.difficulty || 'medium';
        }
    }

    /**
     * ✨ NOWA METODA: Ustawienie poziomu trudności słowa (bezpośrednie)
     */
    setWordDifficulty(word, difficultyLevel) {
        const validLevels = ['easy', 'medium', 'hard'];
        
        if (!validLevels.includes(difficultyLevel)) {
            console.error(`❌ Nieprawidłowy poziom trudności: ${difficultyLevel}`);
            return false;
        }
        
        try {
            const difficulty = this.loadDifficulty();
            const wordKey = this.getWordKey(word);
            
            console.log(`⭐ setWordDifficulty: ${word.english} → ${difficultyLevel}`);
            
            difficulty[wordKey] = difficultyLevel;
            this.saveDifficulty(difficulty);
            
            console.log(`✅ Poziom trudności ustawiony: ${wordKey} → ${difficultyLevel}`);
            return true;
            
        } catch (error) {
            console.error('❌ Błąd podczas ustawiania trudności:', error);
            return false;
        }
    }

    /**
     * ✨ NOWA METODA: Statystyki trudności
     */
    getDifficultyStats() {
        try {
            const difficulty = this.loadDifficulty();
            const stats = {
                easy: 0,
                medium: 0,
                hard: 0,
                total: 0
            };
            
            Object.values(difficulty).forEach(level => {
                if (stats.hasOwnProperty(level)) {
                    stats[level]++;
                    stats.total++;
                }
            });
            
            console.log('📊 Statystyki trudności:', stats);
            return stats;
            
        } catch (error) {
            console.error('❌ Błąd podczas pobierania statystyk trudności:', error);
            return { easy: 0, medium: 0, hard: 0, total: 0 };
        }
    }

    /**
     * ✨ NOWA METODA: Reset wszystkich poziomów trudności
     */
    resetAllDifficulties() {
        try {
            console.log('🔄 Resetuję wszystkie poziomy trudności...');
            
            const emptyDifficulty = {};
            this.saveDifficulty(emptyDifficulty);
            
            console.log('✅ Wszystkie poziomy trudności zresetowane');
            return true;
            
        } catch (error) {
            console.error('❌ Błąd podczas resetowania trudności:', error);
            return false;
        }
    }

    toggleWordBookmark(word) {
        const bookmarks = this.loadBookmarks();
        const wordKey = this.getWordKey(word);
        
        if (bookmarks.includes(wordKey)) {
            // ➖ Usuń z bookmarks
            const index = bookmarks.indexOf(wordKey);
            bookmarks.splice(index, 1);
            
            // 🗑️ Usuń datę
            const bookmarkDates = this.loadBookmarkDates();
            delete bookmarkDates[wordKey];
            this.saveBookmarkDates(bookmarkDates);
            
            console.log(`➖ Usunięto bookmark: ${wordKey}`);
        } else {
            // ➕ Dodaj do bookmarks
            bookmarks.push(wordKey);
            
            // 📅 Zapisz datę dodania
            this.saveBookmarkDate(wordKey);
            
            console.log(`➕ Dodano bookmark: ${wordKey}`);
        }
        
        // 💾 Zapisz zaktualizowane bookmarks
        this.saveBookmarks(bookmarks);
        
        // 📊 Zwróć nowy stan (true = jest w bookmarks)
        const isBookmarked = bookmarks.includes(wordKey);
        return isBookmarked;
    }

    isWordBookmarked(word) {
        const bookmarks = this.loadBookmarks();
        const wordKey = this.getWordKey(word);
        return bookmarks.includes(wordKey);
    }

    getWordKey(word) {
        // 🔧 STARA WERSJA (problematyczna):
        // return word.id || `${word.english}-${word.polish}`;
        
        // ✅ NOWA WERSJA - zawsze unikalny klucz:
        // Używa kombinacji angielskiego słowa i polskiego tłumaczenia
        // co gwarantuje unikalność nawet jeśli ID są duplikowane
        return `${word.english.toLowerCase().trim()}-${word.polish.toLowerCase().trim()}`;
    }

    loadProgress() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Błąd ładowania postępu:', error);
        }
        
        return this.getDefaultProgress();
    }

    saveProgress(progress) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(progress));
        } catch (error) {
            console.error('Błąd zapisywania postępu:', error);
        }
    }

    getDefaultProgress() {
        return {
            studiedCards: [],
            studyDates: [],
            categoryStats: {},
            lastStudied: null,
            version: '1.0.0'
        };
    }

    getAllBookmarkedWords() {
        const bookmarks = this.loadBookmarks();
        const bookmarkedWords = [];
        
        // 🔍 Sprawdź czy mamy dostęp do słownictwa
        if (!this.vocabulary || !this.vocabulary.categories) {
            console.warn('⚠️ Brak dostępu do słownictwa w getAllBookmarkedWords');
            return [];
        }
        
        // 📚 Przejdź przez wszystkie kategorie i znajdź ulubione słowa
        Object.entries(this.vocabulary.categories).forEach(([categoryKey, category]) => {
            if (category.words && Array.isArray(category.words)) {
                category.words.forEach((word, index) => {
                    const wordKey = this.getWordKey(word);
                    
                    // ✅ Jeśli słowo jest w bookmarks, dodaj je z dodatkowymi info
                    if (bookmarks.includes(wordKey)) {
                        bookmarkedWords.push({
                            ...word, // Wszystkie dane słowa
                            categoryKey: categoryKey,
                            categoryName: category.name,
                            categoryIcon: category.icon || '📚',
                            wordIndex: index,
                            wordKey: wordKey,
                            bookmarkedAt: this.getBookmarkDate(wordKey) // Kiedy dodano do ulubionych
                        });
                    }
                });
            }
        });
        
        // 📊 Sortuj według daty dodania (najnowsze pierwsze)
        bookmarkedWords.sort((a, b) => {
            const dateA = new Date(a.bookmarkedAt || 0);
            const dateB = new Date(b.bookmarkedAt || 0);
            return dateB - dateA;
        });
        
        console.log(`🔖 Znaleziono ${bookmarkedWords.length} ulubionych słów`);
        return bookmarkedWords;
    }

    /**
     * ✨ NOWA METODA: Pobranie ulubionych słów z konkretnej kategorii
     */
    getBookmarkedWordsFromCategory(categoryKey) {
        const allBookmarked = this.getAllBookmarkedWords();
        const categoryBookmarks = allBookmarked.filter(word => word.categoryKey === categoryKey);
        
        console.log(`🔖 Kategoria ${categoryKey}: ${categoryBookmarks.length} ulubionych słów`);
        return categoryBookmarks;
    }

    /**
     * ✨ NOWA METODA: Statystyki bookmarks
     */
    getBookmarkStats() {
        const bookmarks = this.loadBookmarks();
        const bookmarkedWords = this.getAllBookmarkedWords();
        
        // 📊 Policz ulubione w każdej kategorii
        const categoryStats = {};
        bookmarkedWords.forEach(word => {
            if (!categoryStats[word.categoryKey]) {
                categoryStats[word.categoryKey] = {
                    count: 0,
                    categoryName: word.categoryName,
                    categoryIcon: word.categoryIcon
                };
            }
            categoryStats[word.categoryKey].count++;
        });
        
        // 🏆 Znajdź kategorię z największą liczbą ulubionych
        let topCategory = null;
        let maxCount = 0;
        Object.entries(categoryStats).forEach(([key, stats]) => {
            if (stats.count > maxCount) {
                maxCount = stats.count;
                topCategory = {
                    key: key,
                    name: stats.categoryName,
                    count: stats.count
                };
            }
        });
        
        return {
            totalBookmarks: bookmarks.length,
            totalCategories: Object.keys(categoryStats).length,
            categoryStats: categoryStats,
            topCategory: topCategory,
            recentlyAdded: bookmarkedWords.slice(0, 5) // Ostatnie 5 dodanych
        };
    }

    /**
     * ✨ NOWA METODA: Export ulubionych do JSON
     */
    exportBookmarks() {
        const bookmarkedWords = this.getAllBookmarkedWords();
        const stats = this.getBookmarkStats();
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalBookmarks: stats.totalBookmarks,
                version: '1.0.0',
                appName: 'English Flashcards B1/B2'
            },
            bookmarks: bookmarkedWords,
            statistics: stats
        };
        
        console.log('📤 Przygotowano dane do eksportu:', exportData);
        return exportData;
    }

    /**
     * ✨ NOWA METODA: Import ulubionych z JSON
     */
    importBookmarks(importData) {
        try {
            // 🔍 Walidacja danych
            if (!importData || !importData.bookmarks || !Array.isArray(importData.bookmarks)) {
                throw new Error('Nieprawidłowy format danych import');
            }
            
            // 📝 Wyciągnij wordKey z importowanych słów
            const importedWordKeys = importData.bookmarks.map(word => 
                word.wordKey || this.getWordKey(word)
            );
            
            // 🔄 Zamień obecne bookmarks na importowane
            this.saveBookmarks(importedWordKeys);
            
            // 💾 Zapisz również daty bookmarks jeśli dostępne
            if (importData.bookmarks.some(word => word.bookmarkedAt)) {
                const bookmarkDates = {};
                importData.bookmarks.forEach(word => {
                    if (word.bookmarkedAt) {
                        const wordKey = word.wordKey || this.getWordKey(word);
                        bookmarkDates[wordKey] = word.bookmarkedAt;
                    }
                });
                this.saveBookmarkDates(bookmarkDates);
            }
            
            console.log(`✅ Zaimportowano ${importedWordKeys.length} ulubionych słów`);
            return {
                success: true,
                imported: importedWordKeys.length
            };
            
        } catch (error) {
            console.error('❌ Błąd importu bookmarks:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ✨ NOWA METODA: Usunięcie wszystkich bookmarks
     */
    clearAllBookmarks() {
        const bookmarksCount = this.loadBookmarks().length;
        
        // 🗑️ Wyczyść bookmarks
        this.saveBookmarks([]);
        
        // 🗑️ Wyczyść daty bookmarks
        this.saveBookmarkDates({});
        
        console.log(`🗑️ Usunięto ${bookmarksCount} ulubionych słów`);
        return bookmarksCount;
    }

    /**
     * ✨ NOWA METODA: Zapisanie daty dodania bookmark
     */
    saveBookmarkDate(wordKey) {
        const bookmarkDates = this.loadBookmarkDates();
        bookmarkDates[wordKey] = new Date().toISOString();
        this.saveBookmarkDates(bookmarkDates);
    }

    /**
     * ✨ NOWA METODA: Pobranie daty dodania bookmark
     */
    getBookmarkDate(wordKey) {
        const bookmarkDates = this.loadBookmarkDates();
        return bookmarkDates[wordKey] || null;
    }

    /**
     * ✨ NOWA METODA: Ładowanie dat bookmarks
     */
    loadBookmarkDates() {
        try {
            const data = localStorage.getItem(this.bookmarksKey + '-dates');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Błąd ładowania dat bookmarks:', error);
            return {};
        }
    }

    /**
     * ✨ NOWA METODA: Zapisywanie dat bookmarks
     */
    saveBookmarkDates(dates) {
        try {
            localStorage.setItem(this.bookmarksKey + '-dates', JSON.stringify(dates));
        } catch (error) {
            console.error('Błąd zapisywania dat bookmarks:', error);
        }
    }

    loadBookmarks() {
        try {
            const data = localStorage.getItem(this.bookmarksKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Błąd ładowania bookmarks:', error);
            return [];
        }
    }

    saveBookmarks(bookmarks) {
        try {
            localStorage.setItem(this.bookmarksKey, JSON.stringify(bookmarks));
        } catch (error) {
            console.error('Błąd zapisywania bookmarks:', error);
        }
    }

    /**
     * ✨ NAPRAWIONE METODY: Ładowanie i zapisywanie trudności z logowaniem
     */
    loadDifficulty() {
        try {
            const data = localStorage.getItem(this.difficultyKey);
            const difficulty = data ? JSON.parse(data) : {};
            
            console.log(`📊 Załadowano ${Object.keys(difficulty).length} poziomów trudności z localStorage`);
            
            return difficulty;
        } catch (error) {
            console.error('❌ Błąd ładowania poziomów trudności:', error);
            return {};
        }
    }

    saveDifficulty(difficulty) {
        try {
            const serialized = JSON.stringify(difficulty);
            localStorage.setItem(this.difficultyKey, serialized);
            
            console.log(`💾 Zapisano ${Object.keys(difficulty).length} poziomów trudności do localStorage`);
            console.log('💾 Przykład zapisanych danych:', Object.fromEntries(Object.entries(difficulty).slice(0, 3)));
            
            // ✅ WERYFIKACJA ZAPISU
            const verification = localStorage.getItem(this.difficultyKey);
            if (verification === serialized) {
                console.log('✅ Weryfikacja zapisu trudności: SUKCES');
            } else {
                console.error('❌ Weryfikacja zapisu trudności: BŁĄD');
                console.error('❌ Oczekiwano:', serialized);
                console.error('❌ Otrzymano:', verification);
            }
            
        } catch (error) {
            console.error('❌ Błąd zapisywania poziomów trudności:', error);
            console.error('❌ Dane do zapisu:', difficulty);
        }
    }

    updateStudyDates(progress) {
        const today = new Date().toISOString().split('T')[0];
        if (!progress.studyDates.includes(today)) {
            progress.studyDates.push(today);
            if (progress.studyDates.length > 365) {
                progress.studyDates = progress.studyDates.slice(-365);
            }
        }
    }

    calculateStudyStreak(studyDates) {
        if (!studyDates || studyDates.length === 0) return 0;
        
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        for (let i = studyDates.length - 1; i >= 0; i--) {
            const studyDate = new Date(studyDates[i]);
            const daysDiff = Math.floor((currentDate - studyDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
            } else {
                break;
            }
            
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    }

    getFavoriteCategory(progress) {
        const categoryStats = progress.categoryStats;
        if (!categoryStats || Object.keys(categoryStats).length === 0) {
            return null;
        }
        
        let maxStudied = 0;
        let favoriteCategory = null;
        
        for (const [category, stats] of Object.entries(categoryStats)) {
            if (stats.studied > maxStudied) {
                maxStudied = stats.studied;
                favoriteCategory = category;
            }
        }
        
        return favoriteCategory;
    }

    exportData() {
        return {
            progress: this.loadProgress(),
            bookmarks: this.loadBookmarks(),
            difficulty: this.loadDifficulty()
        };
    }

    importData(data) {
        if (data.progress) {
            this.saveProgress(data.progress);
        }
        if (data.bookmarks) {
            this.saveBookmarks(data.bookmarks);
        }
        if (data.difficulty) {
            this.saveDifficulty(data.difficulty);
        }
    }

    reset() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.bookmarksKey);
        localStorage.removeItem(this.difficultyKey);
        localStorage.removeItem(this.bookmarksKey + '-dates'); // ✨ NOWE: usuń także daty
        console.log('🔄 ProgressManager zresetowany');
    }
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressManager;
}