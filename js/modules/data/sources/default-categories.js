/**
 * Default Categories Configuration
 * Konfiguracja domyślnych kategorii dla aplikacji
 */

export const DEFAULT_CATEGORIES = {
    // Wygląd i osobowość
    build_and_appearance: { 
        name: "Build and Appearance", 
        icon: "👤",
        description: "Opis wyglądu i budowy ciała"
    },
    personality: { 
        name: "Personality", 
        icon: "🧠",
        description: "Cechy charakteru i osobowości"
    },
    clothes: { 
        name: "Clothes", 
        icon: "👕",
        description: "Ubrania i akcesoria"
    },
    age: { 
        name: "Age", 
        icon: "📅",
        description: "Określenia wieku"
    },

    // Emocje i zachowania
    feelings_and_emotions: { 
        name: "Feelings and Emotions", 
        icon: "😊",
        description: "Uczucia i emocje"
    },
    body_language: { 
        name: "Body Language and Gestures", 
        icon: "🤲",
        description: "Mowa ciała i gesty"
    },

    // Relacje społeczne
    family: { 
        name: "Family", 
        icon: "👨‍👩‍👧‍👦",
        description: "Rodzina i relacje rodzinne"
    },
    friends_and_relations: { 
        name: "Friends and Relations", 
        icon: "👥",
        description: "Przyjaciele i znajomi"
    },
    celebrations: { 
        name: "Celebrations and Special Occasions", 
        icon: "🎉",
        description: "Święta i specjalne okazje"
    },

    // Dom i mieszkanie
    housing_and_living: { 
        name: "Housing and Living", 
        icon: "🏠",
        description: "Mieszkanie i warunki życia"
    },
    house_problems: { 
        name: "Problems Around the House", 
        icon: "🔧",
        description: "Problemy domowe i naprawy"
    },
    in_the_house: { 
        name: "In the House", 
        icon: "🛋️",
        description: "Przedmioty i pomieszczenia w domu"
    },

    // Codzienność i czas wolny
    daily_activities: { 
        name: "Daily Activities", 
        icon: "📋",
        description: "Codzienne czynności"
    },
    hobbies_and_leisure: { 
        name: "Hobbies and Leisure", 
        icon: "⚽",
        description: "Hobby i czas wolny"
    },

    // Zakupy i jedzenie
    shopping: { 
        name: "Shopping", 
        icon: "🛍️",
        description: "Zakupy i handel"
    },
    talking_about_food: { 
        name: "Talking About Food", 
        icon: "🍽️",
        description: "Rozmowy o jedzeniu"
    },
    food_preparation: { 
        name: "Food Preparation", 
        icon: "👨‍🍳",
        description: "Przygotowywanie posiłków"
    },
    eating_in: { 
        name: "Eating In", 
        icon: "🍽️",
        description: "Jedzenie w domu"
    },
    eating_out: { 
        name: "Eating Out", 
        icon: "🍕",
        description: "Jedzenie poza domem"
    },
    drinking: { 
        name: "Drinking", 
        icon: "🥤",
        description: "Napoje i picie"
    },

    // Transport i podróże
    on_the_road: { 
        name: "On the Road", 
        icon: "🛣️",
        description: "Na drodze"
    },
    driving: { 
        name: "Driving", 
        icon: "🚗",
        description: "Prowadzenie samochodu"
    },
    traveling: { 
        name: "Traveling and Means of Transport", 
        icon: "✈️",
        description: "Podróżowanie i środki transportu"
    },
    holidays: { 
        name: "Holidays", 
        icon: "🏖️",
        description: "Wakacje i wypoczynek"
    },

    // Zdrowie
    health_problems: { 
        name: "Health Problems", 
        icon: "🏥",
        description: "Problemy zdrowotne"
    },
    at_the_doctor: { 
        name: "At the Doctor's", 
        icon: "👨‍⚕️",
        description: "U lekarza"
    },
    in_hospital: { 
        name: "In Hospital", 
        icon: "🏥",
        description: "W szpitalu"
    },

    // Edukacja i praca
    education: { 
        name: "Education", 
        icon: "🎓",
        description: "Edukacja i nauka"
    },
    looking_for_job: { 
        name: "Looking for a Job", 
        icon: "💼",
        description: "Poszukiwanie pracy"
    },
    work_and_career: { 
        name: "Work and Career", 
        icon: "💻",
        description: "Praca i kariera"
    },

    // Media i rozrywka
    film_and_cinema: { 
        name: "Film and Cinema", 
        icon: "🎬",
        description: "Film i kino"
    },
    books: { 
        name: "Books", 
        icon: "📚",
        description: "Książki i literatura"
    },
    music: { 
        name: "Music", 
        icon: "🎵",
        description: "Muzyka"
    },
    television: { 
        name: "Television", 
        icon: "📺",
        description: "Telewizja"
    },
    computers_and_internet: { 
        name: "Computers and the Internet", 
        icon: "💻",
        description: "Komputery i internet"
    },
    newspapers_and_magazines: { 
        name: "Newspapers and Magazines", 
        icon: "📰",
        description: "Gazety i czasopisma"
    },

    // Środowisko naturalne
    weather: { 
        name: "The Weather", 
        icon: "🌤️",
        description: "Pogoda"
    },
    natural_world: { 
        name: "Natural World", 
        icon: "🌍",
        description: "Świat przyrody"
    }
};

/**
 * Lista grup tematycznych kategorii
 */
export const CATEGORY_GROUPS = {
    personal: {
        name: "Dane osobowe",
        icon: "👤",
        categories: ["build_and_appearance", "personality", "clothes", "age"]
    },
    emotions: {
        name: "Emocje",
        icon: "😊", 
        categories: ["feelings_and_emotions", "body_language"]
    },
    social: {
        name: "Relacje społeczne",
        icon: "👥",
        categories: ["family", "friends_and_relations", "celebrations"]
    },
    home: {
        name: "Dom",
        icon: "🏠",
        categories: ["housing_and_living", "house_problems", "in_the_house"]
    },
    daily_life: {
        name: "Życie codzienne",
        icon: "📋",
        categories: ["daily_activities", "hobbies_and_leisure"]
    },
    food: {
        name: "Jedzenie",
        icon: "🍽️",
        categories: ["shopping", "talking_about_food", "food_preparation", "eating_in", "eating_out", "drinking"]
    },
    travel: {
        name: "Podróże",
        icon: "✈️",
        categories: ["on_the_road", "driving", "traveling", "holidays"]
    },
    health: {
        name: "Zdrowie",
        icon: "🏥",
        categories: ["health_problems", "at_the_doctor", "in_hospital"]
    },
    work: {
        name: "Praca i edukacja",
        icon: "💼",
        categories: ["education", "looking_for_job", "work_and_career"]
    },
    entertainment: {
        name: "Rozrywka",
        icon: "🎬",
        categories: ["film_and_cinema", "books", "music", "television", "computers_and_internet", "newspapers_and_magazines"]
    },
    nature: {
        name: "Przyroda",
        icon: "🌍",
        categories: ["weather", "natural_world"]
    }
};

/**
 * Metadata kategorii - dodatkowe informacje
 */
export const CATEGORIES_METADATA = {
    totalCategories: Object.keys(DEFAULT_CATEGORIES).length,
    totalGroups: Object.keys(CATEGORY_GROUPS).length,
    version: "1.0.0",
    lastUpdated: "2024-01-15"
};

/**
 * Funkcja pobierania domyślnych kategorii (kompatybilność z oryginalnym API)
 */
export function getDefaultCategories() {
    return { ...DEFAULT_CATEGORIES };
}

/**
 * Sprawdzenie czy kategoria istnieje
 */
export function categoryExists(categoryKey) {
    return DEFAULT_CATEGORIES.hasOwnProperty(categoryKey);
}

/**
 * Pobranie grupy kategorii
 */
export function getCategoryGroup(categoryKey) {
    for (const [groupKey, group] of Object.entries(CATEGORY_GROUPS)) {
        if (group.categories.includes(categoryKey)) {
            return {
                key: groupKey,
                ...group
            };
        }
    }
    return null;
}

/**
 * Pobranie wszystkich kategorii z danej grupy
 */
export function getCategoriesFromGroup(groupKey) {
    const group = CATEGORY_GROUPS[groupKey];
    if (!group) return [];
    
    return group.categories.map(categoryKey => ({
        key: categoryKey,
        ...DEFAULT_CATEGORIES[categoryKey]
    }));
}