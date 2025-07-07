/**
 * Theme Configuration
 * Konfiguracja motywów dla ThemeManager
 */

export const THEME_CONFIG = {
    // Dostępne motywy
    themes: {
        light: {
            name: 'Jasny',
            icon: '☀️',
            metaColor: '#1e3a8a'
        },
        dark: {
            name: 'Ciemny', 
            icon: '🌙',
            metaColor: '#1f2937'
        },
        auto: {
            name: 'Automatyczny',
            icon: '🌗',
            metaColor: null // Dynamiczny w zależności od systemu
        }
    },

    // Klucz przechowywania w localStorage
    storageKey: 'english-flashcards-theme',

    // Domyślny motyw
    defaultTheme: 'auto',

    // CSS selektory i atrybuty
    selectors: {
        root: ':root',
        themeToggle: '#theme-toggle',
        themeColorMeta: 'meta[name="theme-color"]'
    },

    // Atrybuty HTML
    attributes: {
        dataTheme: 'data-theme'
    },

    // Klasy CSS
    classes: {
        toggleIcon: '.icon',
        toggleText: '.text'
    },

    // Teksty interfejsu dla każdego motywu
    ui: {
        light: {
            icon: '🌙',
            text: 'Tryb ciemny'
        },
        dark: {
            icon: '☀️', 
            text: 'Tryb jasny'
        },
        auto: {
            // Dynamiczne - zależy od aktualnego systemu
            getIcon: (isDark) => isDark ? '☀️' : '🌙',
            getText: (isDark) => `Auto (${isDark ? 'ciemny' : 'jasny'})`
        }
    },

    // Media query dla preferencji systemowych
    mediaQuery: '(prefers-color-scheme: dark)',

    // Event names
    events: {
        themeChanged: 'themeChanged'
    }
};

export default THEME_CONFIG;