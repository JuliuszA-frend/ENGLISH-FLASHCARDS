/**
 * ThemeManager - Modularny zarządzanie motywami ES6
 * Wersja refaktoryzowana bez cyklicznych zależności
 */

import { THEME_CONFIG } from './theme-config.js';

/**
 * Główna klasa ThemeManager
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = THEME_CONFIG.defaultTheme;
        this.mediaQuery = null;
        this.isInitialized = false;
        
        console.log('🎨 ThemeManager (ES6) utworzony');
    }

    /**
     * Inicjalizacja ThemeManager
     */
    init() {
        if (this.isInitialized) {
            console.log('⚠️ ThemeManager już zainicjalizowany');
            return;
        }

        // Załaduj zapisany motyw
        this.currentTheme = this.loadTheme();
        
        // Inicjalizuj media query
        this.setupMediaQuery();
        
        // Zastosuj motyw
        this.applyTheme(this.currentTheme);
        
        // Aktualizuj przycisk
        this.updateToggleButton();
        
        this.isInitialized = true;
        console.log('✅ ThemeManager (ES6) zainicjalizowany');
    }

    /**
     * Konfiguracja media query dla preferencji systemowych
     */
    setupMediaQuery() {
        try {
            this.mediaQuery = window.matchMedia(THEME_CONFIG.mediaQuery);
            
            // Nasłuchuj zmian preferencji systemu
            this.mediaQuery.addListener(() => {
                if (this.currentTheme === 'auto') {
                    this.applySystemTheme();
                }
            });
            
            console.log('🔄 Media query dla preferencji systemowych skonfigurowana');
        } catch (error) {
            console.warn('⚠️ Błąd konfiguracji media query:', error);
        }
    }

    /**
     * Przełączanie motywu
     */
    toggle() {
        const themes = Object.keys(THEME_CONFIG.themes);
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setTheme(themes[nextIndex]);
    }

    /**
     * Ustawienie konkretnego motywu
     */
    setTheme(theme) {
        if (!THEME_CONFIG.themes[theme]) {
            console.warn(`⚠️ Nieznany motyw: ${theme}`);
            return false;
        }

        const previousTheme = this.currentTheme;
        this.currentTheme = theme;
        
        this.applyTheme(theme);
        this.saveTheme(theme);
        this.updateToggleButton();
        
        // Wyślij event o zmianie motywu
        this.emitThemeChangedEvent();
        
        // Bezpieczne powiadomienie
        this.showThemeNotification(theme, previousTheme);
        
        console.log(`🎨 Motyw zmieniony: ${previousTheme} → ${theme}`);
        return true;
    }

    /**
     * Zastosowanie motywu
     */
    applyTheme(theme) {
        const effectiveTheme = this.getEffectiveTheme(theme);
        
        // Ustaw atrybut na elemencie root
        const root = document.documentElement;
        if (root) {
            root.setAttribute(THEME_CONFIG.attributes.dataTheme, effectiveTheme);
        }
        
        // Aktualizuj meta theme-color
        this.updateThemeColor(effectiveTheme);
        
        console.log(`🎨 Zastosowany motyw: ${effectiveTheme}`);
    }

    /**
     * Zastosowanie motywu systemowego
     */
    applySystemTheme() {
        if (this.currentTheme === 'auto') {
            this.applyTheme('auto');
            this.updateToggleButton();
        }
    }

    /**
     * Pobranie efektywnego motywu (rozwiązanie 'auto')
     */
    getEffectiveTheme(theme = this.currentTheme) {
        if (theme === 'auto') {
            return this.mediaQuery && this.mediaQuery.matches ? 'dark' : 'light';
        }
        return theme;
    }

    /**
     * Sprawdzenie czy obecnie jest ciemny motyw
     */
    isDarkMode() {
        return this.getEffectiveTheme() === 'dark';
    }

    /**
     * Aktualizacja przycisku przełączania motywu
     */
    updateToggleButton() {
        const button = document.querySelector(THEME_CONFIG.selectors.themeToggle);
        if (!button) {
            console.warn('⚠️ Nie znaleziono przycisku przełączania motywu');
            return;
        }

        const iconEl = button.querySelector(THEME_CONFIG.classes.toggleIcon);
        const textEl = button.querySelector(THEME_CONFIG.classes.toggleText);
        
        const effectiveTheme = this.getEffectiveTheme();
        const buttonConfig = this.getButtonConfig(effectiveTheme);
        
        if (iconEl) iconEl.textContent = buttonConfig.icon;
        if (textEl) textEl.textContent = buttonConfig.text;
        
        console.log(`🎯 Przycisk motywu zaktualizowany: ${buttonConfig.text}`);
    }

    /**
     * Pobieranie konfiguracji przycisku dla danego motywu
     */
    getButtonConfig(effectiveTheme) {
        const ui = THEME_CONFIG.ui;
        
        if (this.currentTheme === 'auto') {
            return {
                icon: ui.auto.getIcon(effectiveTheme === 'dark'),
                text: ui.auto.getText(effectiveTheme === 'dark')
            };
        }
        
        return ui[this.currentTheme] || ui.light;
    }

    /**
     * Aktualizacja meta theme-color
     */
    updateThemeColor(effectiveTheme) {
        const themeColorMeta = document.querySelector(THEME_CONFIG.selectors.themeColorMeta);
        if (!themeColorMeta) return;

        const themeConfig = THEME_CONFIG.themes[effectiveTheme];
        if (themeConfig && themeConfig.metaColor) {
            themeColorMeta.setAttribute('content', themeConfig.metaColor);
            console.log(`🎨 Theme color zaktualizowany: ${themeConfig.metaColor}`);
        }
    }

    /**
     * Wysłanie eventu o zmianie motywu
     */
    emitThemeChangedEvent() {
        try {
            const event = new CustomEvent(THEME_CONFIG.events.themeChanged, { 
                detail: { 
                    theme: this.currentTheme,
                    effectiveTheme: this.getEffectiveTheme(),
                    isDarkMode: this.isDarkMode()
                } 
            });
            
            window.dispatchEvent(event);
            console.log('📡 Event themeChanged wysłany');
        } catch (error) {
            console.warn('⚠️ Błąd wysyłania eventu themeChanged:', error);
        }
    }

    /**
     * Bezpieczne pokazanie powiadomienia o zmianie motywu
     */
    showThemeNotification(newTheme, previousTheme) {
        try {
            const themeName = this.getThemeDisplayName(newTheme);
            
            // Sprawdź czy NotificationManager jest dostępny
            if (typeof window !== 'undefined' && 
                window.NotificationManager && 
                typeof window.NotificationManager.show === 'function') {
                
                window.NotificationManager.show(
                    `Przełączono na motyw: ${themeName}`, 
                    'info',
                    3000
                );
            } else {
                // Fallback - zwykły console.log
                console.log(`🎨 Motyw zmieniony na: ${themeName}`);
            }
        } catch (error) {
            console.warn('⚠️ Nie można pokazać powiadomienia o zmianie motywu:', error);
        }
    }

    /**
     * Nazwa wyświetlana motywu
     */
    getThemeDisplayName(theme) {
        const themeConfig = THEME_CONFIG.themes[theme];
        return themeConfig ? themeConfig.name : theme;
    }

    /**
     * Zapis motywu do localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(THEME_CONFIG.storageKey, theme);
            console.log(`💾 Motyw zapisany: ${theme}`);
        } catch (error) {
            console.warn('⚠️ Nie można zapisać motywu:', error);
        }
    }

    /**
     * Odczyt motywu z localStorage
     */
    loadTheme() {
        try {
            const saved = localStorage.getItem(THEME_CONFIG.storageKey);
            const validThemes = Object.keys(THEME_CONFIG.themes);
            
            if (saved && validThemes.includes(saved)) {
                console.log(`📖 Załadowany motyw: ${saved}`);
                return saved;
            }
        } catch (error) {
            console.warn('⚠️ Nie można załadować motywu:', error);
        }
        
        console.log(`📖 Używam domyślnego motywu: ${THEME_CONFIG.defaultTheme}`);
        return THEME_CONFIG.defaultTheme;
    }

    /**
     * Czyszczenie zasobów
     */
    cleanup() {
        if (this.mediaQuery) {
            try {
                this.mediaQuery.removeListener(this.applySystemTheme);
                console.log('🧹 Media query listener usunięty');
            } catch (error) {
                console.warn('⚠️ Błąd czyszczenia media query:', error);
            }
        }
        
        this.isInitialized = false;
        console.log('🧹 ThemeManager wyczyszczony');
    }

    /**
     * Informacje o stanie motywu
     */
    getStatus() {
        return {
            currentTheme: this.currentTheme,
            effectiveTheme: this.getEffectiveTheme(),
            isDarkMode: this.isDarkMode(),
            isSystemDark: this.mediaQuery ? this.mediaQuery.matches : null,
            isInitialized: this.isInitialized
        };
    }
}

// Export jako domyślny
export default ThemeManager;

// Zachowanie kompatybilności z poprzednią wersją
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
    console.log('✅ ThemeManager (ES6) dostępny globalnie dla kompatybilności');
}