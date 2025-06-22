/**
 * NotificationManager - Zarządzanie powiadomieniami
 */
class NotificationManager {
    constructor() {
        this.notifications = new Map();
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
        this.positions = {
            'top-right': 'top-right',
            'top-left': 'top-left',
            'bottom-right': 'bottom-right',
            'bottom-left': 'bottom-left',
            'top-center': 'top-center',
            'bottom-center': 'bottom-center'
        };
        this.currentPosition = 'top-right';
        
        this.init();
    }

    /**
     * Inicjalizacja kontenera powiadomień
     */
    init() {
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }
        
        this.updateContainerPosition();
    }

    /**
     * Wyświetlenie powiadomienia
     */
    static show(message, type = 'info', duration = 4000, options = {}) {
        if (!window.notificationManager) {
            window.notificationManager = new NotificationManager();
        }
        return window.notificationManager.show(message, type, duration, options);
    }

    /**
     * Wyświetlenie powiadomienia (instancja)
     */
    show(message, type = 'info', duration = this.defaultDuration, options = {}) {
        const id = this.generateId();
        const notification = this.createNotification(id, message, type, duration, options);
        
        // Usuń najstarsze powiadomienia jeśli przekroczono limit
        this.limitNotifications();
        
        // Dodaj do kontenera
        this.container.appendChild(notification);
        
        // Animacja wejścia
        requestAnimationFrame(() => {
            notification.classList.add('visible');
        });
        
        // Auto-usuwanie
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
        
        // Zapisz referencję
        this.notifications.set(id, {
            element: notification,
            type: type,
            timestamp: Date.now()
        });
        
        return id;
    }

    /**
     * Tworzenie elementu powiadomienia
     */
    createNotification(id, message, type, duration, options) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-id', id);
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        // Ikony dla różnych typów
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'loading': '⏳'
        };
        
        const icon = options.icon || icons[type] || icons.info;
        
        // Przycisk zamknięcia
        const closeButton = options.closable !== false ? `
            <button class="notification-close" aria-label="Zamknij powiadomienie">×</button>
        ` : '';
        
        // Pasek postępu (jeśli duration > 0)
        const progressBar = duration > 0 && options.showProgress !== false ? `
            <div class="notification-progress">
                <div class="notification-progress-bar" style="animation-duration: ${duration}ms;"></div>
            </div>
        ` : '';
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${this.sanitizeMessage(message)}</div>
                ${closeButton}
            </div>
            ${progressBar}
        `;
        
        // Event listeners
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.remove(id));
        }
        
        // Click to dismiss (jeśli włączone)
        if (options.clickToDismiss !== false) {
            notification.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-close')) {
                    this.remove(id);
                }
            });
        }
        
        return notification;
    }

    /**
     * Usunięcie powiadomienia
     */
    remove(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        const element = notification.element;
        
        // Animacja wyjścia
        element.classList.add('removing');
        element.classList.remove('visible');
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
        
        return true;
    }

    /**
     * Usunięcie wszystkich powiadomień
     */
    removeAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.remove(id));
    }

    /**
     * Usunięcie powiadomień określonego typu
     */
    removeByType(type) {
        const toRemove = [];
        this.notifications.forEach((notification, id) => {
            if (notification.type === type) {
                toRemove.push(id);
            }
        });
        toRemove.forEach(id => this.remove(id));
    }

    /**
     * Ograniczenie liczby powiadomień
     */
    limitNotifications() {
        if (this.notifications.size >= this.maxNotifications) {
            const oldest = this.getOldestNotification();
            if (oldest) {
                this.remove(oldest);
            }
        }
    }

    /**
     * Pobranie najstarszego powiadomienia
     */
    getOldestNotification() {
        let oldestId = null;
        let oldestTime = Date.now();
        
        this.notifications.forEach((notification, id) => {
            if (notification.timestamp < oldestTime) {
                oldestTime = notification.timestamp;
                oldestId = id;
            }
        });
        
        return oldestId;
    }

    /**
     * Aktualizacja pozycji kontenera
     */
    updateContainerPosition() {
        if (this.container) {
            this.container.className = `notifications-container position-${this.currentPosition}`;
        }
    }

    /**
     * Ustawienie pozycji powiadomień
     */
    setPosition(position) {
        if (this.positions[position]) {
            this.currentPosition = position;
            this.updateContainerPosition();
        }
    }

    /**
     * Sanityzacja wiadomości
     */
    sanitizeMessage(message) {
        const div = document.createElement('div');
        div.textContent = message;
        return div.innerHTML;
    }

    /**
     * Generowanie unikalnego ID
     */
    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Skróty dla różnych typów powiadomień
     */
    static success(message, duration, options) {
        return NotificationManager.show(message, 'success', duration, options);
    }

    static error(message, duration, options) {
        return NotificationManager.show(message, 'error', duration, options);
    }

    static warning(message, duration, options) {
        return NotificationManager.show(message, 'warning', duration, options);
    }

    static info(message, duration, options) {
        return NotificationManager.show(message, 'info', duration, options);
    }

    static loading(message, options) {
        return NotificationManager.show(message, 'loading', 0, options);
    }

    /**
     * Aktualizacja istniejącego powiadomienia
     */
    update(id, message, type, options = {}) {
        const notification = this.notifications.get(id);
        if (!notification) return false;
        
        const element = notification.element;
        const messageEl = element.querySelector('.notification-message');
        const iconEl = element.querySelector('.notification-icon');
        
        if (messageEl) {
            messageEl.innerHTML = this.sanitizeMessage(message);
        }
        
        if (type && type !== notification.type) {
            element.className = element.className.replace(
                `notification-${notification.type}`, 
                `notification-${type}`
            );
            notification.type = type;
            
            // Aktualizuj ikonę
            const icons = {
                'success': '✅',
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️',
                'loading': '⏳'
            };
            
            if (iconEl) {
                iconEl.textContent = options.icon || icons[type] || icons.info;
            }
        }
        
        return true;
    }

    /**
     * Sprawdzenie czy powiadomienie istnieje
     */
    exists(id) {
        return this.notifications.has(id);
    }

    /**
     * Pobranie statystyk
     */
    getStats() {
        return {
            total: this.notifications.size,
            types: this.getTypeCounts(),
            position: this.currentPosition,
            maxNotifications: this.maxNotifications
        };
    }

    getTypeCounts() {
        const counts = {};
        this.notifications.forEach(notification => {
            counts[notification.type] = (counts[notification.type] || 0) + 1;
        });
        return counts;
    }

    /**
     * Czyszczenie zasobów
     */
    cleanup() {
        this.removeAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.notifications.clear();
    }
}

// Dodaj style CSS dla powiadomień jeśli nie istnieją
if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
        .notifications-container {
            position: fixed;
            z-index: 1080;
            pointer-events: none;
            max-width: 400px;
        }
        
        .notifications-container.position-top-right {
            top: 20px;
            right: 20px;
        }
        
        .notifications-container.position-top-left {
            top: 20px;
            left: 20px;
        }
        
        .notifications-container.position-bottom-right {
            bottom: 20px;
            right: 20px;
        }
        
        .notifications-container.position-bottom-left {
            bottom: 20px;
            left: 20px;
        }
        
        .notifications-container.position-top-center {
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .notifications-container.position-bottom-center {
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .notification {
            pointer-events: auto;
            margin-bottom: 10px;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(10px);
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            cursor: pointer;
        }
        
        .notification.visible {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.removing {
            transform: scale(0.9);
            opacity: 0;
        }
        
        .notification-success {
            background: rgba(16, 185, 129, 0.9);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: white;
        }
        
        .notification-error {
            background: rgba(239, 68, 68, 0.9);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: white;
        }
        
        .notification-warning {
            background: rgba(245, 158, 11, 0.9);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: white;
        }
        
        .notification-info {
            background: rgba(59, 130, 246, 0.9);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: white;
        }
        
        .notification-loading {
            background: rgba(107, 114, 128, 0.9);
            border: 1px solid rgba(107, 114, 128, 0.3);
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
        
        .notification-close:hover {
            background: rgba(255, 255, 255, 0.2);
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
    `;
    document.head.appendChild(styles);
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, ImageManager, NotificationManager };
}

// Globalne instancje
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
    window.ImageManager = ImageManager;
    window.NotificationManager = NotificationManager;
}