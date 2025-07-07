/**
 * Minimal Vocabulary Data
 * Ostatnia deska ratunku - podstawowy zestaw słów
 */

export const MINIMAL_VOCABULARY = {
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
                },
                {
                    id: 6,
                    english: "no",
                    polish: "nie",
                    pronunciation: "noh",
                    phonetic: "/noʊ/",
                    type: "adverb",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "No, I don't want it.",
                        polish: "Nie, nie chcę tego."
                    }
                },
                {
                    id: 7,
                    english: "water",
                    polish: "woda",
                    pronunciation: "WAW-ter",
                    phonetic: "/ˈwɔː.tər/",
                    type: "noun",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "I need some water.",
                        polish: "Potrzebuję trochę wody."
                    }
                },
                {
                    id: 8,
                    english: "food",
                    polish: "jedzenie",
                    pronunciation: "food",
                    phonetic: "/fuːd/",
                    type: "noun",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "This food is delicious.",
                        polish: "To jedzenie jest pyszne."
                    }
                },
                {
                    id: 9,
                    english: "good",
                    polish: "dobry",
                    pronunciation: "gud",
                    phonetic: "/ɡʊd/",
                    type: "adjective",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "This is a good book.",
                        polish: "To jest dobra książka."
                    }
                },
                {
                    id: 10,
                    english: "bad",
                    polish: "zły",
                    pronunciation: "bad",
                    phonetic: "/bæd/",
                    type: "adjective",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "That's a bad idea.",
                        polish: "To zły pomysł."
                    }
                }
            ]
        },
        common_phrases: {
            name: "Przydatne zwroty",
            icon: "💬",
            description: "Często używane wyrażenia",
            words: [
                {
                    id: 11,
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
                    id: 12,
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
                    id: 13,
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
                },
                {
                    id: 14,
                    english: "where is",
                    polish: "gdzie jest",
                    pronunciation: "wair iz",
                    phonetic: "/weər ɪz/",
                    type: "phrase",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "Where is the station?",
                        polish: "Gdzie jest dworzec?"
                    }
                },
                {
                    id: 15,
                    english: "what time",
                    polish: "która godzina",
                    pronunciation: "what tahym",
                    phonetic: "/wʌt taɪm/",
                    type: "phrase",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "What time is it?",
                        polish: "Która jest godzina?"
                    }
                },
                {
                    id: 16,
                    english: "can you help me",
                    polish: "czy możesz mi pomóc",
                    pronunciation: "kan yoo help mee",
                    phonetic: "/kæn juː help miː/",
                    type: "phrase",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "Can you help me, please?",
                        polish: "Czy możesz mi pomóc, proszę?"
                    }
                },
                {
                    id: 17,
                    english: "I need",
                    polish: "potrzebuję",
                    pronunciation: "ahy need",
                    phonetic: "/aɪ niːd/",
                    type: "phrase",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "I need a doctor.",
                        polish: "Potrzebuję lekarza."
                    }
                },
                {
                    id: 18,
                    english: "I want",
                    polish: "chcę",
                    pronunciation: "ahy want",
                    phonetic: "/aɪ wɑːnt/",
                    type: "phrase",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "I want to go home.",
                        polish: "Chcę iść do domu."
                    }
                }
            ]
        }
    }
};

/**
 * Funkcja pobierania minimalnych danych (kompatybilność z oryginalnym API)
 */
export function getMinimalVocabulary() {
    return { ...MINIMAL_VOCABULARY };
}