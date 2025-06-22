/**
 * ThemeManager - Zarządzanie motywami
 * Wersja bez cyklicznej zależności od NotificationManager
 */
class ThemeManager {
    constructor() {
        this.storageKey = 'english-flashcards-theme';
        this.currentTheme = 'auto';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }

    /**
     * Inicjalizacja menedżera motywów
     */
    init() {
        // Załaduj zapisany motyw
        this.currentTheme = this.loadTheme();
        
        // Zastosuj motyw
        this.applyTheme(this.currentTheme);
        
        // Nasłuchuj zmian preferencji systemu
        this.mediaQuery.addListener(() => {
            if (this.currentTheme === 'auto') {
                this.applySystemTheme();
            }
        });
        
        // Aktualizuj przycisk
        this.updateToggleButton();
        
        console.log('✅ ThemeManager zainicjalizowany');
    }

    /**
     * Przełączanie motywu
     */
    toggle() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setTheme(themes[nextIndex]);
    }

    /**
     * Ustawienie konkretnego motywu
     */
    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
        this.updateToggleButton();
        
        // Wyślij event o zmianie motywu
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.getEffectiveTheme() } 
        }));
        
        // BEZPIECZNE powiadomienie - sprawdź czy NotificationManager istnieje
        this.showThemeNotification(theme);
    }

    /**
     * Bezpieczne pokazanie powiadomienia o zmianie motywu
     */
    showThemeNotification(theme) {
        try {
            // Sprawdź czy NotificationManager jest dostępny
            if (typeof window !== 'undefined' && 
                window.NotificationManager && 
                typeof window.NotificationManager.show === 'function') {
                
                window.NotificationManager.show(
                    `Przełączono na motyw: ${this.getThemeDisplayName(theme)}`, 
                    'info'
                );
            } else {
                // Fallback - zwykły console.log
                console.log(`🎨 Motyw zmieniony na: ${this.getThemeDisplayName(theme)}`);
            }
        } catch (error) {
            console.warn('Nie można pokazać powiadomienia o zmianie motywu:', error);
        }
    }

    /**
     * Zastosowanie motywu
     */
    applyTheme(theme) {
        const effectiveTheme = this.getEffectiveTheme(theme);
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        
        // Aktualizuj meta theme-color
        this.updateThemeColor();
        
        console.log(`🎨 Zastosowano motyw: ${effectiveTheme}`);
    }

    /**
     * Zastosowanie motywu systemowego
     */
    applySystemTheme() {
        if (this.currentTheme === 'auto') {
            this.applyTheme('auto');
        }
    }

    /**
     * Pobranie efektywnego motywu (rozwiązanie 'auto')
     */
    getEffectiveTheme(theme = this.currentTheme) {
        if (theme === 'auto') {
            return this.mediaQuery.matches ? 'dark' : 'light';
        }
        return theme;
    }

    /**
     * Aktualizacja przycisku przełączania
     */
    updateToggleButton() {
        const button = document.getElementById('theme-toggle');
        if (!button) return;

        const iconEl = button.querySelector('.icon');
        const textEl = button.querySelector('.text');
        
        const effectiveTheme = this.getEffectiveTheme();
        const themeConfig = {
            light: { icon: '🌙', text: 'Tryb ciemny' },
            dark: { icon: '☀️', text: 'Tryb jasny' },
            auto: { 
                icon: effectiveTheme === 'dark' ? '☀️' : '🌙', 
                text: `Auto (${effectiveTheme === 'dark' ? 'ciemny' : 'jasny'})` 
            }
        };

        const config = themeConfig[this.currentTheme];
        if (iconEl) iconEl.textContent = config.icon;
        if (textEl) textEl.textContent = config.text;
    }

    /**
     * Aktualizacja meta theme-color
     */
    updateThemeColor() {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            const effectiveTheme = this.getEffectiveTheme();
            const color = effectiveTheme === 'dark' ? '#1f2937' : '#1e3a8a';
            themeColorMeta.setAttribute('content', color);
        }
    }

    /**
     * Nazwa wyświetlana motywu
     */
    getThemeDisplayName(theme) {
        const names = {
            'light': 'Jasny',
            'dark': 'Ciemny',
            'auto': 'Automatyczny'
        };
        return names[theme] || theme;
    }

    /**
     * Zapis/odczyt motywu
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (error) {
            console.warn('Nie można zapisać motywu:', error);
        }
    }

    loadTheme() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved && ['light', 'dark', 'auto'].includes(saved)) {
                return saved;
            }
        } catch (error) {
            console.warn('Nie można załadować motywu:', error);
        }
        return 'auto'; // domyślny
    }

    /**
     * Sprawdzenie czy aktualnie jest ciemny motyw
     */
    isDarkMode() {
        return this.getEffectiveTheme() === 'dark';
    }

    /**
     * Czyszczenie zasobów
     */
    cleanup() {
        this.mediaQuery.removeListener(this.applySystemTheme);
    }
}

// =====================================
// GLOBALNY EKSPORT I AUTO-INICJALIZACJA
// =====================================

// Automatyczne dodanie do window
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
    console.log('✅ ThemeManager załadowany i dostępny globalnie');

    // Auto-inicjalizacja gdy DOM będzie gotowy
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.themeManagerInstance) {
                window.themeManagerInstance = new ThemeManager();
                window.themeManagerInstance.init();
            }
        });
    } else {
        // DOM już gotowy
        if (!window.themeManagerInstance) {
            window.themeManagerInstance = new ThemeManager();
            window.themeManagerInstance.init();
        }
    }
}

// Export dla modułów Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}