/**
 * DataLoader - Ładowanie danych
 */
class DataLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Set();
    }

    /**
     * Ładowanie słownictwa
     */
    async loadVocabulary() {
        const cacheKey = 'vocabulary';
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        if (this.loading.has(cacheKey)) {
            // Czekaj na zakończenie ładowania
            return new Promise((resolve, reject) => {
                const checkLoading = () => {
                    if (!this.loading.has(cacheKey)) {
                        if (this.cache.has(cacheKey)) {
                            resolve(this.cache.get(cacheKey));
                        } else {
                            reject(new Error('Błąd ładowania danych'));
                        }
                    } else {
                        setTimeout(checkLoading, 100);
                    }
                };
                checkLoading();
            });
        }

        this.loading.add(cacheKey);

        try {
            let vocabulary;

            // Spróbuj załadować z pliku
            try {
                vocabulary = await this.loadFromFile('data/vocabulary.json');
            } catch (error) {
                console.warn('Nie można załadować z pliku, używam danych embedded:', error);
                vocabulary = this.getEmbeddedVocabulary();
            }

            // Walidacja danych
            this.validateVocabulary(vocabulary);

            // Cache i zwróć
            this.cache.set(cacheKey, vocabulary);
            return vocabulary;

        } catch (error) {
            console.error('Błąd ładowania słownictwa:', error);
            throw error;
        } finally {
            this.loading.delete(cacheKey);
        }
    }

    /**
     * Ładowanie kategorii
     */
    async loadCategories() {
        const cacheKey = 'categories';
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            let categories;

            try {
                categories = await this.loadFromFile('data/categories.json');
            } catch (error) {
                console.warn('Nie można załadować kategorii z pliku, używam domyślnych');
                categories = this.getDefaultCategories();
            }

            this.cache.set(cacheKey, categories);
            return categories;

        } catch (error) {
            console.error('Błąd ładowania kategorii:', error);
            return this.getDefaultCategories();
        }
    }

    /**
     * Ładowanie z pliku JSON
     */
    async loadFromFile(url) {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }

    /**
     * Walidacja danych słownictwa
     */
    validateVocabulary(vocabulary) {
        if (!vocabulary || typeof vocabulary !== 'object') {
            throw new Error('Nieprawidłowy format słownictwa');
        }

        if (!vocabulary.categories || typeof vocabulary.categories !== 'object') {
            throw new Error('Brak kategorii w słownictwie');
        }

        // Sprawdź każdą kategorię
        Object.entries(vocabulary.categories).forEach(([key, category]) => {
            if (!category.name || !category.words || !Array.isArray(category.words)) {
                throw new Error(`Nieprawidłowa kategoria: ${key}`);
            }

            // Sprawdź słowa w kategorii
            category.words.forEach((word, index) => {
                if (!word.english || !word.polish) {
                    throw new Error(`Nieprawidłowe słowo w kategorii ${key}, indeks ${index}`);
                }
            });
        });
    }

    /**
     * Embedded słownictwo (fallback)
     */
    getEmbeddedVocabulary() {
        return {
            metadata: {
                version: "1.0.0",
                level: "B1/B2",
                totalWords: 1600,
                totalCategories: 32,
                wordsPerCategory: 50,
                language: {
                    source: "English",
                    target: "Polish"
                },
                lastUpdated: new Date().toISOString()
            },
            categories: {
                build_and_appearance: {
                    name: "Build and Appearance",
                    icon: "👤",
                    description: "Opis wyglądu i budowy ciała",
                    words: [
                        {
                            id: 1,
                            english: "beautiful",
                            polish: "piękny/piękna",
                            pronunciation: "BYOO-ti-ful",
                            phonetic: "/ˈbjuː.tɪ.fəl/",
                            type: "adjective",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "She has beautiful eyes.",
                                polish: "Ona ma piękne oczy."
                            },
                            synonyms: ["gorgeous", "lovely", "attractive"],
                            audio: "beautiful"
                        },
                        {
                            id: 2,
                            english: "handsome",
                            polish: "przystojny",
                            pronunciation: "HAND-sum",
                            phonetic: "/ˈhæn.səm/",
                            type: "adjective",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "He is a handsome young man.",
                                polish: "On jest przystojnym młodym mężczyzną."
                            },
                            synonyms: ["attractive", "good-looking"],
                            audio: "handsome"
                        }
                        // ... więcej słów zostanie dodane w pełnej implementacji
                    ]
                },
                personality: {
                    name: "Personality",
                    icon: "🧠",
                    description: "Cechy charakteru i osobowości",
                    words: [
                        {
                            id: 1,
                            english: "friendly",
                            polish: "przyjazny",
                            pronunciation: "FREND-lee",
                            phonetic: "/ˈfrend.li/",
                            type: "adjective",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "She is very friendly and helpful.",
                                polish: "Ona jest bardzo przyjazna i pomocna."
                            },
                            synonyms: ["kind", "nice", "pleasant"],
                            antonyms: ["unfriendly", "hostile"],
                            audio: "friendly"
                        }
                        // ... więcej słów
                    ]
                }
                // ... więcej kategorii zostanie dodane w pełnej implementacji
            }
        };
    }

    /**
     * Domyślne kategorie
     */
    getDefaultCategories() {
        return {
            build_and_appearance: { name: "Build and Appearance", icon: "👤" },
            personality: { name: "Personality", icon: "🧠" },
            clothes: { name: "Clothes", icon: "👕" },
            age: { name: "Age", icon: "📅" },
            feelings_and_emotions: { name: "Feelings and Emotions", icon: "😊" },
            body_language: { name: "Body Language and Gestures", icon: "🤲" },
            family: { name: "Family", icon: "👨‍👩‍👧‍👦" },
            friends_and_relations: { name: "Friends and Relations", icon: "👥" },
            celebrations: { name: "Celebrations and Special Occasions", icon: "🎉" },
            housing_and_living: { name: "Housing and Living", icon: "🏠" },
            house_problems: { name: "Problems Around the House", icon: "🔧" },
            in_the_house: { name: "In the House", icon: "🛋️" },
            daily_activities: { name: "Daily Activities", icon: "📋" },
            hobbies_and_leisure: { name: "Hobbies and Leisure", icon: "⚽" },
            shopping: { name: "Shopping", icon: "🛍️" },
            talking_about_food: { name: "Talking About Food", icon: "🍽️" },
            food_preparation: { name: "Food Preparation", icon: "👨‍🍳" },
            eating_in: { name: "Eating In", icon: "🍽️" },
            eating_out: { name: "Eating Out", icon: "🍕" },
            drinking: { name: "Drinking", icon: "🥤" },
            on_the_road: { name: "On the Road", icon: "🛣️" },
            driving: { name: "Driving", icon: "🚗" },
            traveling: { name: "Traveling and Means of Transport", icon: "✈️" },
            holidays: { name: "Holidays", icon: "🏖️" },
            health_problems: { name: "Health Problems", icon: "🏥" },
            at_the_doctor: { name: "At the Doctor's", icon: "👨‍⚕️" },
            in_hospital: { name: "In Hospital", icon: "🏥" },
            education: { name: "Education", icon: "🎓" },
            looking_for_job: { name: "Looking for a Job", icon: "💼" },
            work_and_career: { name: "Work and Career", icon: "💻" },
            film_and_cinema: { name: "Film and Cinema", icon: "🎬" },
            books: { name: "Books", icon: "📚" },
            music: { name: "Music", icon: "🎵" },
            television: { name: "Television", icon: "📺" },
            computers_and_internet: { name: "Computers and the Internet", icon: "💻" },
            newspapers_and_magazines: { name: "Newspapers and Magazines", icon: "📰" },
            weather: { name: "The Weather", icon: "🌤️" },
            natural_world: { name: "Natural World", icon: "🌍" }
        };
    }

    /**
     * Czyszczenie cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Sprawdzenie czy dane są w cache
     */
    isCached(key) {
        return this.cache.has(key);
    }
}