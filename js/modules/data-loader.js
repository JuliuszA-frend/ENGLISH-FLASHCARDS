/**
 * DataLoader - Ładowanie danych z fallback dla CORS
 */
class DataLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Set();
        this.isFileProtocol = window.location.protocol === 'file:';
    }

    /**
     * Ładowanie słownictwa z obsługą CORS fallback
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

            // Strategia ładowania w zależności od protokołu
            if (this.isFileProtocol) {
                console.warn('⚠️ Ładowanie z file:// - używam danych embedded');
                vocabulary = this.getEmbeddedVocabulary();
                
                // Pokaż informację użytkownikowi
                if (window.NotificationManager) {
                    NotificationManager.show(
                        'Aplikacja działa w trybie offline z ograniczonymi danymi. Dla pełnej funkcjonalności uruchom przez serwer HTTP.',
                        'warning',
                        6000
                    );
                }
            } else {
                // Spróbuj załadować z pliku
                try {
                    vocabulary = await this.loadFromFile('data/vocabulary.json');
                    console.log('✅ Załadowano słownictwo z pliku');
                } catch (error) {
                    console.warn('⚠️ Nie można załadować z pliku, używam danych embedded:', error);
                    vocabulary = this.getEmbeddedVocabulary();
                    
                    if (window.NotificationManager) {
                        NotificationManager.show(
                            'Nie można załadować pełnego słownictwa. Używam danych podstawowych.',
                            'warning'
                        );
                    }
                }
            }

            // Walidacja danych
            this.validateVocabulary(vocabulary);

            // Cache i zwróć
            this.cache.set(cacheKey, vocabulary);
            return vocabulary;

        } catch (error) {
            console.error('❌ Błąd ładowania słownictwa:', error);
            
            // Ostatnia deska ratunku - minimalny zestaw danych
            console.log('🔄 Próba załadowania minimalnych danych...');
            try {
                const minimalVocabulary = this.getMinimalVocabulary();
                this.cache.set(cacheKey, minimalVocabulary);
                
                if (window.NotificationManager) {
                    NotificationManager.show(
                        'Załadowano podstawowy zestaw słówek. Część funkcji może być ograniczona.',
                        'info'
                    );
                }
                
                return minimalVocabulary;
            } catch (minimalError) {
                console.error('❌ Nie można załadować nawet minimalnych danych:', minimalError);
                throw new Error('Nie można załadować żadnych danych słownictwa');
            }
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

            if (this.isFileProtocol) {
                categories = this.getDefaultCategories();
            } else {
                try {
                    categories = await this.loadFromFile('data/categories.json');
                } catch (error) {
                    console.warn('Nie można załadować kategorii z pliku, używam domyślnych');
                    categories = this.getDefaultCategories();
                }
            }

            this.cache.set(cacheKey, categories);
            return categories;

        } catch (error) {
            console.error('Błąd ładowania kategorii:', error);
            return this.getDefaultCategories();
        }
    }

    /**
     * Ładowanie z pliku JSON z retry mechanism
     */
    async loadFromFile(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                console.warn(`Próba ${i + 1}/${retries} ładowania ${url} nieudana:`, error.message);
                
                if (i === retries - 1) {
                    throw error;
                }
                
                // Opóźnienie przed kolejną próbą
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            }
        }
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
     * Minimalny zestaw danych (ostatnia deska ratunku)
     */
    getMinimalVocabulary() {
        return {
            metadata: {
                version: "1.0.0-minimal",
                level: "B1/B2",
                totalWords: 50,
                totalCategories: 2,
                wordsPerCategory: 25,
                language: {
                    source: "English",
                    target: "Polish"
                },
                lastUpdated: new Date().toISOString(),
                note: "Minimalny zestaw danych - uruchom przez serwer HTTP dla pełnej funkcjonalności"
            },
            categories: {
                basic_vocabulary: {
                    name: "Podstawowe słownictwo",
                    icon: "📚",
                    description: "Najważniejsze słowa do rozpoczęcia nauki",
                    words: [
                        {
                            id: 1,
                            english: "hello",
                            polish: "cześć, witaj",
                            pronunciation: "heh-LOH",
                            phonetic: "/həˈloʊ/",
                            type: "interjection",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "Hello, how are you?",
                                polish: "Cześć, jak się masz?"
                            }
                        },
                        {
                            id: 2,
                            english: "goodbye",
                            polish: "do widzenia",
                            pronunciation: "gud-BAHY",
                            phonetic: "/ɡʊdˈbaɪ/",
                            type: "interjection",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "Goodbye, see you tomorrow!",
                                polish: "Do widzenia, do zobaczenia jutro!"
                            }
                        },
                        {
                            id: 3,
                            english: "please",
                            polish: "proszę",
                            pronunciation: "pleez",
                            phonetic: "/pliːz/",
                            type: "adverb",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "Please help me.",
                                polish: "Proszę, pomóż mi."
                            }
                        },
                        {
                            id: 4,
                            english: "thank you",
                            polish: "dziękuję",
                            pronunciation: "THANGK yoo",
                            phonetic: "/θæŋk juː/",
                            type: "interjection",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "Thank you for your help.",
                                polish: "Dziękuję za pomoc."
                            }
                        },
                        {
                            id: 5,
                            english: "yes",
                            polish: "tak",
                            pronunciation: "yes",
                            phonetic: "/jɛs/",
                            type: "adverb",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "Yes, I understand.",
                                polish: "Tak, rozumiem."
                            }
                        }
                        // Można dodać więcej słów podstawowych...
                    ]
                },
                common_phrases: {
                    name: "Przydatne zwroty",
                    icon: "💬",
                    description: "Często używane wyrażenia",
                    words: [
                        {
                            id: 6,
                            english: "excuse me",
                            polish: "przepraszam, wybacz",
                            pronunciation: "ik-SKYOOZ mee",
                            phonetic: "/ɪkˈskjuːz miː/",
                            type: "phrase",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "Excuse me, where is the bathroom?",
                                polish: "Przepraszam, gdzie jest łazienka?"
                            }
                        },
                        {
                            id: 7,
                            english: "I don't understand",
                            polish: "nie rozumiem",
                            pronunciation: "ahy dohnt uhn-der-STAND",
                            phonetic: "/aɪ doʊnt ˌʌndərˈstænd/",
                            type: "phrase",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "I don't understand. Can you repeat?",
                                polish: "Nie rozumiem. Możesz powtórzyć?"
                            }
                        },
                        {
                            id: 8,
                            english: "how much",
                            polish: "ile kosztuje",
                            pronunciation: "how muhch",
                            phonetic: "/haʊ mʌtʃ/",
                            type: "phrase",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "How much does it cost?",
                                polish: "Ile to kosztuje?"
                            }
                        }
                    ]
                }
            }
        };
    }

    /**
     * Embedded słownictwo (fallback) - rozszerzona wersja
     */
    getEmbeddedVocabulary() {
        return {
            metadata: {
                version: "1.0.0-embedded",
                level: "B1/B2",
                totalWords: 100,
                totalCategories: 4,
                wordsPerCategory: 25,
                language: {
                    source: "English",
                    target: "Polish"
                },
                lastUpdated: new Date().toISOString(),
                note: "Dane embedded - dla pełnego zestawu uruchom przez serwer HTTP"
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
                            synonyms: ["lovely", "gorgeous", "attractive"],
                            antonyms: ["ugly", "unattractive"]
                        },
                        {
                            id: 2,
                            english: "tall",
                            polish: "wysoki",
                            pronunciation: "tawl",
                            phonetic: "/tɔːl/",
                            type: "adjective",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "He is very tall.",
                                polish: "On jest bardzo wysoki."
                            },
                            synonyms: ["high", "elevated"],
                            antonyms: ["short", "low"]
                        },
                        {
                            id: 3,
                            english: "young",
                            polish: "młody",
                            pronunciation: "yuhng",
                            phonetic: "/jʌŋ/",
                            type: "adjective",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "She looks very young.",
                                polish: "Ona wygląda bardzo młodo."
                            },
                            synonyms: ["youthful", "juvenile"],
                            antonyms: ["old", "elderly"]
                        }
                        // Więcej słów można dodać w rzeczywistej implementacji
                    ]
                },
                personality: {
                    name: "Personality",
                    icon: "🧠",
                    description: "Cechy charakteru i osobowości",
                    words: [
                        {
                            id: 20,
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
                            antonyms: ["unfriendly", "hostile"]
                        },
                        {
                            id: 21,
                            english: "intelligent",
                            polish: "inteligentny",
                            pronunciation: "in-TEL-i-juhnt",
                            phonetic: "/ɪnˈtel.ɪ.dʒənt/",
                            type: "adjective",
                            difficulty: "medium",
                            frequency: "high",
                            examples: {
                                english: "He is a very intelligent student.",
                                polish: "On jest bardzo inteligentnym studentem."
                            },
                            synonyms: ["smart", "clever", "bright"],
                            antonyms: ["stupid", "dumb"]
                        }
                    ]
                },
                feelings_and_emotions: {
                    name: "Feelings and Emotions",
                    icon: "😊",
                    description: "Uczucia i emocje",
                    words: [
                        {
                            id: 40,
                            english: "happy",
                            polish: "szczęśliwy",
                            pronunciation: "HAP-ee",
                            phonetic: "/ˈhæp.i/",
                            type: "adjective",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "I'm very happy today.",
                                polish: "Jestem dziś bardzo szczęśliwy."
                            },
                            synonyms: ["joyful", "cheerful", "glad"],
                            antonyms: ["sad", "unhappy"]
                        },
                        {
                            id: 41,
                            english: "angry",
                            polish: "zły",
                            pronunciation: "ANG-gree",
                            phonetic: "/ˈæŋ.ɡri/",
                            type: "adjective",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "Why are you so angry?",
                                polish: "Dlaczego jesteś tak zły?"
                            },
                            synonyms: ["mad", "furious", "irritated"],
                            antonyms: ["calm", "peaceful"]
                        }
                    ]
                },
                family: {
                    name: "Family",
                    icon: "👨‍👩‍👧‍👦",
                    description: "Rodzina i relacje rodzinne",
                    words: [
                        {
                            id: 60,
                            english: "mother",
                            polish: "matka, mama",
                            pronunciation: "MUHTH-er",
                            phonetic: "/ˈmʌð.ər/",
                            type: "noun",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "My mother is a teacher.",
                                polish: "Moja mama jest nauczycielką."
                            },
                            synonyms: ["mom", "mum"],
                            antonyms: ["father"]
                        },
                        {
                            id: 61,
                            english: "father",
                            polish: "ojciec, tata",
                            pronunciation: "FAH-ther",
                            phonetic: "/ˈfɑː.ðər/",
                            type: "noun",
                            difficulty: "easy",
                            frequency: "high",
                            examples: {
                                english: "My father works in an office.",
                                polish: "Mój tata pracuje w biurze."
                            },
                            synonyms: ["dad", "papa"],
                            antonyms: ["mother"]
                        }
                    ]
                }
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
     * Sprawdzenie dostępności pliku
     */
    async checkFileAvailability(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Pobranie informacji o protokole
     */
    getProtocolInfo() {
        return {
            protocol: window.location.protocol,
            isFile: this.isFileProtocol,
            isSecure: window.location.protocol === 'https:',
            canUseFetch: !this.isFileProtocol
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

    /**
     * Diagnostyka systemu ładowania
     */
    getDiagnostics() {
        return {
            protocol: this.getProtocolInfo(),
            cache: {
                size: this.cache.size,
                keys: Array.from(this.cache.keys())
            },
            loading: {
                inProgress: Array.from(this.loading)
            },
            timestamp: new Date().toISOString()
        };
    }
}