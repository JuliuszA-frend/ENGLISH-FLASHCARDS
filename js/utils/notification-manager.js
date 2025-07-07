/**
 * NotificationManager - Zarządzanie powiadomieniami ES6
 * Bezpieczna wersja z singleton pattern
 */

import { AppConstants } from '../config/constants.js';

/**
 * Klasa zarządzająca powiadomieniami
 */
class NotificationManager {
    static instance = null;
    
    constructor() {
        if (NotificationManager.instance) {
            return NotificationManager.instance;
        }
        
        this.container = null;
        this.notifications = new Map();
        this.defaultDuration = AppConstants?.DEFAULTS?.NOTIFICATION_DURATION || 4000;
        this.maxNotifications = AppConstants?.LIMITS?.MAX_NOTIFICATIONS || 5;
        this.init();
        
        NotificationManager.instance = this;
    }

    /**
     * Inicjalizacja menedżera powiadomień
     */
    init() {
        this.createContainer();
        this.injectStyles();
        console.log('✅ NotificationManager zainicjalizowany');
    }

    /**
     * Tworzenie kontenera powiadomień
     */
    createContainer() {
        this.container = document.getElementById('notifications-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-atomic', 'false');
            this.container.setAttribute('role', 'status');
            document.body.appendChild(this.container);
        }
    }

    /**
     * Pokazanie powiadomienia - STATYCZNA METODA
     * @param {string} message - Wiadomość do wyświetlenia
     * @param {string} type - Typ powiadomienia ('success'|'error'|'warning'|'info')
     * @param {number|null} duration - Czas wyświetlania w ms (null = domyślny, 0 = persistent)
     * @param {Object} options - Dodatkowe opcje
     * @returns {string} ID powiadomienia
     */
    static show(message, type = 'info', duration = null, options = {}) {
        return NotificationManager.getInstance().show(message, type, duration, options);
    }

    /**
     * Pobranie instancji (singleton)
     * @returns {NotificationManager} Instancja
     */
    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    /**
     * Pokazanie powiadomienia (instancyjna)
     * @param {string} message - Wiadomość
     * @param {string} type - Typ powiadomienia
     * @param {number|null} duration - Czas wyświetlania
     * @param {Object} options - Opcje
     * @returns {string} ID powiadomienia
     */
    show(message, type = 'info', duration = null, options = {}) {
        const id = this.generateId();
        const actualDuration = duration !== null ? duration : 
                             (duration === 0 ? 0 : this.defaultDuration);
        
        // Walidacja typu
        const validTypes = ['success', 'error', 'warning', 'info', 'loading'];
        if (!validTypes.includes(type)) {
            console.warn(`Nieprawidłowy typ powiadomienia: ${type}, używam 'info'`);
            type = 'info';
        }
        
        // Opcje powiadomienia
        const {
            closable = true,
            persistent = duration === 0,
            position = 'top-right',
            showProgress = actualDuration > 0
        } = options;

        // Ogranicz liczbę powiadomień
        this.limitNotifications();

        // Stwórz element powiadomienia
        const notification = this.createNotificationElement(
            id, message, type, actualDuration, closable, showProgress
        );

        // Dodaj do kontenera
        this.container.appendChild(notification);
        this.notifications.set(id, {
            element: notification,
            type: type,
            timestamp: Date.now(),
            persistent: persistent
        });

        // Pokaż z animacją
        setTimeout(() => {
            notification.classList.add('show');
        }, 50);

        // Auto-ukrywanie
        if (!persistent && actualDuration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, actualDuration);
        }

        // Emit event
        this.emitEvent('notificationShown', { id, message, type, duration: actualDuration });

        return id;
    }

    /**
     * Tworzenie elementu powiadomienia
     * @param {string} id - ID powiadomienia
     * @param {string} message - Wiadomość
     * @param {string} type - Typ
     * @param {number} duration - Czas trwania
     * @param {boolean} closable - Czy można zamknąć
     * @param {boolean} showProgress - Czy pokazywać progress bar
     * @returns {HTMLElement} Element powiadomienia
     */
    createNotificationElement(id, message, type, duration, closable, showProgress) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-id', id);
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon" aria-hidden="true">${icons[type] || icons.info}</span>
                <div class="notification-message">${this.sanitizeMessage(message)}</div>
                ${closable ? '<button class="notification-close" aria-label="Zamknij powiadomienie" tabindex="0">×</button>' : ''}
            </div>
            ${showProgress ? `<div class="notification-progress"><div class="notification-progress-bar" style="animation-duration: ${duration}ms"></div></div>` : ''}
        `;

        // Obsługa zamykania
        if (closable) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                this.hide(id);
            });
            
            // Obsługa klawiatury
            closeBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.hide(id);
                }
            });
        }

        return notification;
    }

    /**
     * Bezpieczne sanityzowanie wiadomości
     * @param {any} message - Wiadomość do sanityzacji
     * @returns {string} Bezpieczna wiadomość
     */
    sanitizeMessage(message) {
        if (typeof message !== 'string') {
            message = String(message);
        }
        
        // Podstawowa ochrona przed XSS
        return message
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    /**
     * Ukrycie powiadomienia
     * @param {string} id - ID powiadomienia
     * @returns {boolean} True jeśli ukryto pomyślnie
     */
    hide(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) {
            console.warn(`Powiadomienie ${id} nie zostało znalezione`);
            return false;
        }

        const notification = notificationData.element;
        notification.classList.add('hide');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);

        // Emit event
        this.emitEvent('notificationHidden', { id });
        
        return true;
    }

    /**
     * Wyczyszczenie wszystkich powiadomień
     * @param {string} typeFilter - Opcjonalny filtr typu
     * @returns {number} Liczba usuniętych powiadomień
     */
    clear(typeFilter = null) {
        let count = 0;
        
        this.notifications.forEach((data, id) => {
            if (!typeFilter || data.type === typeFilter) {
                this.hide(id);
                count++;
            }
        });
        
        console.log(`🧹 Wyczyszczono ${count} powiadomień${typeFilter ? ` typu ${typeFilter}` : ''}`);
        return count;
    }

    /**
     * Ograniczenie liczby powiadomień
     */
    limitNotifications() {
        if (this.notifications.size >= this.maxNotifications) {
            // Usuń najstarsze niepersistentne powiadomienie
            const sortedNotifications = Array.from(this.notifications.entries())
                .filter(([id, data]) => !data.persistent)
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            if (sortedNotifications.length > 0) {
                const [oldestId] = sortedNotifications[0];
                this.hide(oldestId);
            }
        }
    }

    /**
     * Generowanie unikalnego ID
     * @returns {string} Unikalny ID
     */
    generateId() {
        return 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Sprawdzenie czy aktualnie jest ciemny motyw (BEZPIECZNE)
     * @returns {boolean} True jeśli ciemny motyw
     */
    isDarkMode() {
        try {
            // Sprawdź ThemeManager jeśli dostępny
            if (typeof window !== 'undefined' && 
                window.ThemeManager && 
                typeof window.ThemeManager.isDarkMode === 'function') {
                return window.ThemeManager.isDarkMode();
            }
            
            // Sprawdź instancję ThemeManager
            if (typeof window !== 'undefined' && 
                window.themeManagerInstance && 
                typeof window.themeManagerInstance.isDarkMode === 'function') {
                return window.themeManagerInstance.isDarkMode();
            }
            
            // Fallback - sprawdź atrybut data-theme
            const theme = document.documentElement.getAttribute('data-theme');
            if (theme) {
                return theme === 'dark';
            }
            
            // Fallback - sprawdź preferencje systemu
            if (window.matchMedia) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            
            // Domyślnie false
            return false;
            
        } catch (error) {
            console.warn('Błąd sprawdzania trybu ciemnego:', error);
            return false;
        }
    }

    /**
     * Emit custom event
     * @param {string} eventName - Nazwa eventu
     * @param {Object} detail - Detale eventu
     */
    emitEvent(eventName, detail) {
        try {
            const event = new CustomEvent(eventName, { detail });
            document.dispatchEvent(event);
        } catch (error) {
            console.warn(`Błąd emitowania eventu ${eventName}:`, error);
        }
    }

    /**
     * Pobranie wszystkich aktywnych powiadomień
     * @returns {Array} Tablica informacji o powiadomieniach
     */
    getActiveNotifications() {
        return Array.from(this.notifications.entries()).map(([id, data]) => ({
            id,
            type: data.type,
            timestamp: data.timestamp,
            persistent: data.persistent,
            message: data.element.querySelector('.notification-message')?.textContent || ''
        }));
    }

    /**
     * Zaktualizuj powiadomienie
     * @param {string} id - ID powiadomienia
     * @param {string} newMessage - Nowa wiadomość
     * @param {string} newType - Nowy typ (opcjonalnie)
     * @returns {boolean} True jeśli zaktualizowano
     */
    update(id, newMessage, newType = null) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return false;

        const notification = notificationData.element;
        const messageEl = notification.querySelector('.notification-message');
        const iconEl = notification.querySelector('.notification-icon');

        if (messageEl) {
            messageEl.innerHTML = this.sanitizeMessage(newMessage);
        }

        if (newType && newType !== notificationData.type) {
            // Zmień typ
            notification.className = notification.className.replace(
                `notification-${notificationData.type}`, 
                `notification-${newType}`
            );
            
            // Zmień ikonę
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️',
                loading: '⏳'
            };
            
            if (iconEl) {
                iconEl.textContent = icons[newType] || icons.info;
            }
            
            notificationData.type = newType;
        }

        return true;
    }

    /**
     * Metody skrótowe dla różnych typów powiadomień
     */
    success(message, duration = null, options = {}) {
        return this.show(message, 'success', duration, options);
    }

    error(message, duration = 0, options = {}) {
        return this.show(message, 'error', duration, options);
    }

    warning(message, duration = null, options = {}) {
        return this.show(message, 'warning', duration, options);
    }

    info(message, duration = null, options = {}) {
        return this.show(message, 'info', duration, options);
    }

    loading(message, options = {}) {
        return this.show(message, 'loading', 0, { ...options, closable: false });
    }

    /**
     * Wstrzyknięcie stylów CSS
     */
    injectStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
        .notifications-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .notification {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(12px);
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            position: relative;
            overflow: hidden;
            max-width: 100%;
            word-wrap: break-word;
        }
        
        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.hide {
            transform: translateX(100%);
            opacity: 0;
        }
        
        .notification-success {
            background: rgba(16, 185, 129, 0.95);
            border-color: rgba(16, 185, 129, 0.3);
            color: white;
        }
        
        .notification-error {
            background: rgba(239, 68, 68, 0.95);
            border-color: rgba(239, 68, 68, 0.3);
            color: white;
        }
        
        .notification-warning {
            background: rgba(245, 158, 11, 0.95);
            border-color: rgba(245, 158, 11, 0.3);
            color: white;
        }
        
        .notification-info {
            background: rgba(59, 130, 246, 0.95);
            border-color: rgba(59, 130, 246, 0.3);
            color: white;
        }
        
        .notification-loading {
            background: rgba(156, 163, 175, 0.95);
            border-color: rgba(156, 163, 175, 0.3);
            color: white;
        }
        
        .notification-content {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        
        .notification-icon {
            font-size: 18px;
            flex-shrink: 0;
            margin-top: 1px;
        }
        
        .notification-message {
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            font-weight: 500;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: inherit;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s ease;
            flex-shrink: 0;
        }
        
        .notification-close:hover,
        .notification-close:focus {
            background: rgba(255, 255, 255, 0.2);
            outline: none;
        }
        
        .notification-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: rgba(255, 255, 255, 0.2);
        }
        
        .notification-progress-bar {
            height: 100%;
            background: rgba(255, 255, 255, 0.6);
            width: 100%;
            transform-origin: left;
            animation: notificationProgress linear forwards;
        }
        
        @keyframes notificationProgress {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
        }
        
        /* Dark mode adaptations */
        [data-theme="dark"] .notification {
            background: rgba(31, 41, 55, 0.95);
            border-color: rgba(75, 85, 99, 0.3);
            color: white;
        }
        
        [data-theme="dark"] .notification-info {
            background: rgba(37, 99, 235, 0.95);
        }
        
        @media (max-width: 640px) {
            .notifications-container {
                left: 20px !important;
                right: 20px !important;
                max-width: none;
                transform: none !important;
            }
            
            .notification {
                margin-bottom: 8px;
                padding: 12px;
            }
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
            .notification {
                transition: opacity 0.2s ease;
            }
            
            .notification-progress-bar {
                animation: none;
                transform: scaleX(0);
            }
        }
    `;
        document.head.appendChild(styles);
    }

    /**
     * Sprawdzenie dostępności ThemeManager (diagnostyka)
     * @returns {Object} Informacje o dostępności
     */
    checkThemeManagerAvailability() {
        return {
            available: typeof window !== 'undefined' && typeof window.ThemeManager !== 'undefined',
            type: typeof window.ThemeManager,
            hasInstance: !!(window.themeManagerInstance)
        };
    }

    /**
     * Cleanup - usunięcie wszystkich powiadomień i event listenerów
     */
    cleanup() {
        this.clear();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        const styles = document.getElementById('notification-styles');
        if (styles) {
            styles.remove();
        }
        
        NotificationManager.instance = null;
        console.log('🧹 NotificationManager wyczyszczony');
    }
}

// Named exports
export { NotificationManager };

// Singleton instance getter
export function getNotificationManager() {
    return NotificationManager.getInstance();
}

// Convenience functions jako named exports
export const showNotification = (message, type, duration, options) => 
    NotificationManager.show(message, type, duration, options);

export const hideNotification = (id) => 
    NotificationManager.getInstance().hide(id);

export const clearNotifications = (typeFilter) => 
    NotificationManager.getInstance().clear(typeFilter);

// Default export
export default NotificationManager;

// 🔧 KOMPATYBILNOŚĆ WSTECZNA: Eksport globalny
if (typeof window !== 'undefined') {
    window.NotificationManager = NotificationManager;
    
    // Auto-inicjalizacja dla kompatybilności
    window.notificationManagerInstance = NotificationManager.getInstance();
}