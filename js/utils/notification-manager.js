/**
 * NotificationManager - Zarządzanie powiadomieniami
 * Wersja bezpieczna - nie wywala się gdy ThemeManager nie jest dostępny
 */
class NotificationManager {
    static instance = null;
    
    constructor() {
        if (NotificationManager.instance) {
            return NotificationManager.instance;
        }
        
        this.container = null;
        this.notifications = new Map();
        this.defaultDuration = 4000;
        this.maxNotifications = 5;
        this.init();
        
        NotificationManager.instance = this;
    }

    /**
     * Inicjalizacja menedżera powiadomień
     */
    init() {
        this.createContainer();
        this.injectStyles();
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
     */
    static show(message, type = 'info', duration = null, options = {}) {
        return NotificationManager.getInstance().show(message, type, duration, options);
    }

    /**
     * Pobranie instancji (singleton)
     */
    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    /**
     * Pokazanie powiadomienia (instancyjna)
     */
    show(message, type = 'info', duration = null, options = {}) {
        const id = this.generateId();
        const actualDuration = duration !== null ? duration : 
                             (duration === 0 ? 0 : this.defaultDuration);
        
        // Opcje powiadomienia
        const {
            closable = true,
            persistent = duration === 0,
            position = 'top-right'
        } = options;

        // Ogranicz liczbę powiadomień
        this.limitNotifications();

        // Stwórz element powiadomienia
        const notification = this.createNotificationElement(
            id, message, type, actualDuration, closable
        );

        // Dodaj do kontenera
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

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

        return id;
    }

    /**
     * Tworzenie elementu powiadomienia
     */
    createNotificationElement(id, message, type, duration, closable) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-id', id);
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon" aria-hidden="true">${icons[type] || icons.info}</span>
                <div class="notification-message">${this.sanitizeMessage(message)}</div>
                ${closable ? '<button class="notification-close" aria-label="Zamknij powiadomienie">×</button>' : ''}
            </div>
            ${duration > 0 ? '<div class="notification-progress"><div class="notification-progress-bar" style="animation-duration: ' + duration + 'ms"></div></div>' : ''}
        `;

        // Obsługa zamykania
        if (closable) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                this.hide(id);
            });
        }

        return notification;
    }

    /**
     * Bezpieczne sanityzowanie wiadomości
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
     */
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        notification.classList.add('hide');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Wyczyszczenie wszystkich powiadomień
     */
    clear() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }

    /**
     * Ograniczenie liczby powiadomień
     */
    limitNotifications() {
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }
    }

    /**
     * Generowanie unikalnego ID
     */
    generateId() {
        return 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Sprawdzenie czy aktualnie jest ciemny motyw (BEZPIECZNE)
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
    `;
        document.head.appendChild(styles);
    }

    /**
     * Sprawdzenie dostępności ThemeManager (diagnostyka)
     */
    checkThemeManagerAvailability() {
        return {
            available: typeof window !== 'undefined' && typeof window.ThemeManager !== 'undefined',
            type: typeof window.ThemeManager,
            hasInstance: !!(window.themeManagerInstance)
        };
    }
}

/**
 * ImageManager - Zarządzanie obrazkami dla słówek
 */
class ImageManager {
    constructor() {
        this.storageKey = 'english-flashcards-images';
        this.defaultImageSize = { width: 300, height: 200 };
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
    }

    /**
     * Dodanie obrazka dla słówka
     */
    async addImage(wordId, file) {
        try {
            // Walidacja pliku
            this.validateImageFile(file);

            // Konwersja do base64
            const base64 = await this.fileToBase64(file);

            // Optymalizacja obrazka
            const optimizedImage = await this.optimizeImage(base64, file.type);

            // Zapisz obrazek
            const imageData = {
                id: wordId,
                data: optimizedImage,
                type: file.type,
                size: optimizedImage.length,
                timestamp: new Date().toISOString(),
                filename: file.name
            };

            this.saveImage(wordId, imageData);
            
            // Pokaż powiadomienie o sukcesie - BEZPIECZNE WYWOŁANIE
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Obrazek został dodany pomyślnie!', 'success');
            }

            return imageData;

        } catch (error) {
            console.error('Błąd dodawania obrazka:', error);
            
            // Pokaż powiadomienie o błędzie - BEZPIECZNE WYWOŁANIE
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Błąd dodawania obrazka: ' + error.message, 'error');
            }
            
            throw error;
        }
    }

    /**
     * Pobranie obrazka dla słówka
     */
    getImage(wordId) {
        const images = this.loadImages();
        return images[wordId] || null;
    }

    /**
     * Usunięcie obrazka
     */
    removeImage(wordId) {
        const images = this.loadImages();
        
        if (images[wordId]) {
            delete images[wordId];
            this.saveImages(images);
            
            // BEZPIECZNE WYWOŁANIE
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Obrazek został usunięty', 'info');
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * Walidacja pliku obrazka
     */
    validateImageFile(file) {
        if (!file) {
            throw new Error('Nie wybrano pliku');
        }

        if (!this.supportedFormats.includes(file.type)) {
            throw new Error('Nieobsługiwany format pliku. Wybierz JPG, PNG, GIF lub WebP.');
        }

        if (file.size > this.maxFileSize) {
            throw new Error('Plik jest za duży. Maksymalny rozmiar to 5MB.');
        }
    }

    /**
     * Konwersja pliku do base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Optymalizacja obrazka
     */
    async optimizeImage(base64, type) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Oblicz nowe wymiary zachowując proporcje
                const { width, height } = this.calculateOptimalSize(
                    img.width, 
                    img.height, 
                    this.defaultImageSize.width, 
                    this.defaultImageSize.height
                );

                canvas.width = width;
                canvas.height = height;

                // Narysuj zoptymalizowany obrazek
                ctx.drawImage(img, 0, 0, width, height);

                // Konwertuj z kompresją
                const quality = type === 'image/jpeg' ? 0.8 : undefined;
                const optimized = canvas.toDataURL(type, quality);
                
                resolve(optimized);
            };
            img.src = base64;
        });
    }

    /**
     * Obliczenie optymalnego rozmiaru
     */
    calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
        
        if (ratio >= 1) {
            return { width: originalWidth, height: originalHeight };
        }
        
        return {
            width: Math.round(originalWidth * ratio),
            height: Math.round(originalHeight * ratio)
        };
    }

    /**
     * Zapis/odczyt obrazków z localStorage
     */
    saveImage(wordId, imageData) {
        const images = this.loadImages();
        images[wordId] = imageData;
        this.saveImages(images);
    }

    loadImages() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.warn('Błąd ładowania obrazków:', error);
            return {};
        }
    }

    saveImages(images) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(images));
        } catch (error) {
            console.error('Błąd zapisywania obrazków:', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Błąd zapisywania obrazków. Sprawdź miejsce w pamięci.', 'error');
            }
        }
    }

    /**
     * Pobranie listy wszystkich obrazków
     */
    getAllImages() {
        return this.loadImages();
    }

    /**
     * Sprawdzenie rozmiaru zajętego przez obrazki
     */
    getStorageInfo() {
        const images = this.loadImages();
        const imageKeys = Object.keys(images);
        const totalSize = JSON.stringify(images).length;
        
        return {
            count: imageKeys.length,
            totalSize: totalSize,
            averageSize: imageKeys.length > 0 ? Math.round(totalSize / imageKeys.length) : 0
        };
    }
}

// =====================================
// BEZPIECZNY EKSPORT GLOBALNY - POPRAWIONY
// =====================================

/**
 * Bezpieczne przypisywanie klas do window
 * Sprawdza czy klasa istnieje przed przypisaniem
 */
function safeGlobalExport() {
    if (typeof window === 'undefined') return;

    // NotificationManager - zawsze dostępny w tym pliku
    if (typeof NotificationManager !== 'undefined') {
        window.NotificationManager = NotificationManager;
        console.log('✅ NotificationManager → window.NotificationManager');
    }

    // ImageManager - jeśli istnieje w tym pliku
    if (typeof ImageManager !== 'undefined') {
        window.ImageManager = ImageManager;
        console.log('✅ ImageManager → window.ImageManager');
    }

    // ThemeManager - BEZPIECZNE SPRAWDZENIE BEZ WYWOŁYWANIA BŁĘDU
    try {
        if (typeof window.ThemeManager !== 'undefined') {
            console.log('✅ ThemeManager już dostępny');
        } else {
            console.log('⏳ ThemeManager zostanie załadowany później');
        }
    } catch (error) {
        console.log('⏳ ThemeManager nie jest jeszcze dostępny');
    }
}

// Bezpieczny eksport do window
if (typeof window !== 'undefined') {
    // NotificationManager - zawsze dostępny
    window.NotificationManager = NotificationManager;
    
    // ImageManager - zawsze dostępny
    window.ImageManager = ImageManager;
    
    console.log('✅ NotificationManager i ImageManager załadowane');
}

// Export dla modułów Node.js
if (typeof module !== 'undefined' && module.exports) {
    // Eksportuj tylko to co istnieje
    const exports = {};
    if (typeof NotificationManager !== 'undefined') exports.NotificationManager = NotificationManager;
    if (typeof ImageManager !== 'undefined') exports.ImageManager = ImageManager;
    module.exports = exports;
}

// Uruchom bezpieczny eksport
safeGlobalExport();

// =====================================
// AUTO-INICJALIZACJA NOTIFICATION MANAGER
// =====================================

/**
 * Automatyczna inicjalizacja NotificationManager
 */
function initNotificationManager() {
    if (typeof window !== 'undefined' && !window.notificationManagerInstance) {
        try {
            window.notificationManagerInstance = new NotificationManager();
            console.log('✅ NotificationManager zainicjalizowany automatycznie');
        } catch (error) {
            console.error('❌ Błąd inicjalizacji NotificationManager:', error);
        }
    }
}

// Inicjalizacja gdy DOM będzie gotowy
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotificationManager);
} else {
    // DOM już gotowy
    initNotificationManager();
}

// =====================================
// DIAGNOSTYKA - POMOCNE DO DEBUGOWANIA
// =====================================

/**
 * Sprawdzenie dostępności klas (uruchom w konsoli)
 */
window.checkClassAvailability = function() {
    console.log('🔍 SPRAWDZENIE DOSTĘPNOŚCI KLAS:');
    
    const classes = [
        'NotificationManager',
        'ImageManager', 
        'ThemeManager',
        'DataLoader',
        'AudioManager',
        'ProgressManager',
        'FlashcardManager',
        'QuizManager'
    ];
    
    classes.forEach(className => {
        const isAvailable = typeof window[className] !== 'undefined';
        const status = isAvailable ? '✅' : '❌';
        const type = typeof window[className];
        console.log(`${status} ${className}: ${type}`);
    });
    
    console.log('\n📋 Instancje:');
    console.log(`notificationManagerInstance: ${typeof window.notificationManagerInstance}`);
    console.log(`themeManagerInstance: ${typeof window.themeManagerInstance}`);
};

console.log('💡 Uruchom window.checkClassAvailability() w konsoli aby sprawdzić dostępność klas');