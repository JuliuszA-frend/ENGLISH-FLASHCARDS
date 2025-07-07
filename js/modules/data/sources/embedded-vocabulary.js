/**
 * Embedded Vocabulary Data
 * Rozszerzone dane słownictwa jako fallback
 */

export const EMBEDDED_VOCABULARY = {
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
                },
                {
                    id: 4,
                    english: "short",
                    polish: "niski",
                    pronunciation: "shawrt",
                    phonetic: "/ʃɔːrt/",
                    type: "adjective",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "My brother is quite short.",
                        polish: "Mój brat jest dość niski."
                    },
                    synonyms: ["small", "little"],
                    antonyms: ["tall", "high"]
                },
                {
                    id: 5,
                    english: "attractive",
                    polish: "atrakcyjny",
                    pronunciation: "uh-TRAK-tiv",
                    phonetic: "/əˈtræk.tɪv/",
                    type: "adjective",
                    difficulty: "medium",
                    frequency: "high",
                    examples: {
                        english: "She is very attractive.",
                        polish: "Ona jest bardzo atrakcyjna."
                    },
                    synonyms: ["beautiful", "appealing", "charming"],
                    antonyms: ["unattractive", "repulsive"]
                }
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
                },
                {
                    id: 22,
                    english: "funny",
                    polish: "zabawny",
                    pronunciation: "FUH-nee",
                    phonetic: "/ˈfʌn.i/",
                    type: "adjective",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "He tells funny jokes.",
                        polish: "On opowiada zabawne żarty."
                    },
                    synonyms: ["amusing", "humorous", "entertaining"],
                    antonyms: ["boring", "serious"]
                },
                {
                    id: 23,
                    english: "generous",
                    polish: "hojny",
                    pronunciation: "JEN-er-uhs",
                    phonetic: "/ˈdʒen.ər.əs/",
                    type: "adjective",
                    difficulty: "medium",
                    frequency: "medium",
                    examples: {
                        english: "She is generous with her time.",
                        polish: "Ona jest hojna ze swoim czasem."
                    },
                    synonyms: ["giving", "kind", "charitable"],
                    antonyms: ["selfish", "stingy"]
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
                },
                {
                    id: 42,
                    english: "excited",
                    polish: "podekscytowany",
                    pronunciation: "ik-SAHY-tid",
                    phonetic: "/ɪkˈsaɪ.tɪd/",
                    type: "adjective",
                    difficulty: "medium",
                    frequency: "high",
                    examples: {
                        english: "I'm excited about the trip.",
                        polish: "Jestem podekscytowany wycieczką."
                    },
                    synonyms: ["thrilled", "enthusiastic", "eager"],
                    antonyms: ["bored", "indifferent"]
                },
                {
                    id: 43,
                    english: "nervous",
                    polish: "zdenerwowany",
                    pronunciation: "NUR-vuhs",
                    phonetic: "/ˈnɜː.vəs/",
                    type: "adjective",
                    difficulty: "medium",
                    frequency: "high",
                    examples: {
                        english: "I feel nervous before exams.",
                        polish: "Czuję się zdenerwowany przed egzaminami."
                    },
                    synonyms: ["anxious", "worried", "tense"],
                    antonyms: ["calm", "relaxed"]
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
                },
                {
                    id: 62,
                    english: "sister",
                    polish: "siostra",
                    pronunciation: "SIS-ter",
                    phonetic: "/ˈsɪs.tər/",
                    type: "noun",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "I have one older sister.",
                        polish: "Mam jedną starszą siostrę."
                    },
                    synonyms: ["sibling"],
                    antonyms: ["brother"]
                },
                {
                    id: 63,
                    english: "brother",
                    polish: "brat",
                    pronunciation: "BRUHTH-er",
                    phonetic: "/ˈbrʌð.ər/",
                    type: "noun",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "My brother loves football.",
                        polish: "Mój brat uwielbia piłkę nożną."
                    },
                    synonyms: ["sibling"],
                    antonyms: ["sister"]
                },
                {
                    id: 64,
                    english: "grandparents",
                    polish: "dziadkowie",
                    pronunciation: "GRAND-pair-uhnts",
                    phonetic: "/ˈɡrænd.peər.ənts/",
                    type: "noun",
                    difficulty: "easy",
                    frequency: "high",
                    examples: {
                        english: "I visit my grandparents every Sunday.",
                        polish: "Odwiedzam dziadków w każdą niedzielę."
                    },
                    synonyms: ["grandma and grandpa"],
                    antonyms: ["grandchildren"]
                }
            ]
        }
    }
};

/**
 * Funkcja pobierania danych embedded (kompatybilność z oryginalnym API)
 */
export function getEmbeddedVocabulary() {
    return { ...EMBEDDED_VOCABULARY };
}