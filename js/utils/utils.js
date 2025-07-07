/**
 * utils.js - Funkcje pomocnicze ES6
 * Named exports dla lepszej modularności
 */

/**
 * Debounce funkcji
 * @param {Function} func - Funkcja do wykonania
 * @param {number} wait - Czas oczekiwania w ms
 * @returns {Function} Zdebouncowana funkcja
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle funkcji
 * @param {Function} func - Funkcja do wykonania
 * @param {number} limit - Limit czasu w ms
 * @returns {Function} Zthrottlowana funkcja
 */
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Mieszanie tablicy (Fisher-Yates)
 * @param {Array} array - Tablica do wymieszania
 * @returns {Array} Nowa wymieszana tablica
 */
export function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Głębokie klonowanie obiektu
 * @param {any} obj - Obiekt do sklonowania
 * @returns {any} Sklonowany obiekt
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * Formatowanie daty
 * @param {Date|string} date - Data do sformatowania
 * @param {string} format - Format daty (domyślnie 'YYYY-MM-DD')
 * @returns {string} Sformatowana data
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
}

/**
 * Sprawdzenie czy jest mobile
 * @returns {boolean} True jeśli urządzenie mobilne
 */
export function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Sprawdzenie czy urządzenie obsługuje touch
 * @returns {boolean} True jeśli obsługuje dotyk
 */
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Lazy loading obrazków
 * Konfiguruje IntersectionObserver dla obrazków z data-src
 */
export function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

/**
 * Sanitizacja HTML
 * @param {string} str - String do sanityzacji
 * @returns {string} Bezpieczny HTML
 */
export function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Generowanie unikalnego ID
 * @param {string} prefix - Prefiks ID (domyślnie 'id')
 * @returns {string} Unikalny ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sprawdzenie czy wartość jest pusta
 * @param {any} value - Wartość do sprawdzenia
 * @returns {boolean} True jeśli wartość jest pusta
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Delay/sleep funkcja
 * @param {number} ms - Milisekundy do odczekania
 * @returns {Promise} Promise która się resolve po określonym czasie
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry funkcja z exponential backoff
 * @param {Function} fn - Funkcja do powtórzenia
 * @param {number} retries - Liczba prób (domyślnie 3)
 * @param {number} delay - Początkowe opóźnienie w ms (domyślnie 1000)
 * @returns {Promise} Promise z wynikiem funkcji
 */
export async function retry(fn, retries = 3, delayMs = 1000) {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await delay(delayMs);
            return retry(fn, retries - 1, delayMs * 2);
        }
        throw error;
    }
}

/**
 * Formatowanie rozmiaru pliku
 * @param {number} bytes - Rozmiar w bajtach
 * @param {number} decimals - Liczba miejsc po przecinku (domyślnie 2)
 * @returns {string} Sformatowany rozmiar
 */
export function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Sprawdzenie czy string jest prawidłowym URL
 * @param {string} string - String do sprawdzenia
 * @returns {boolean} True jeśli jest prawidłowym URL
 */
export function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Escape HTML entities
 * @param {string} text - Tekst do escapowania
 * @returns {string} Bezpieczny tekst
 */
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Capitalize first letter of each word
 * @param {string} str - String do przekształcenia
 * @returns {string} String z wielkimi literami
 */
export function capitalizeWords(str) {
    return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

/**
 * Truncate text do określonej długości
 * @param {string} text - Tekst do skrócenia
 * @param {number} length - Maksymalna długość
 * @param {string} suffix - Suffix do dodania (domyślnie '...')
 * @returns {string} Skrócony tekst
 */
export function truncateText(text, length, suffix = '...') {
    if (text.length <= length) return text;
    return text.substring(0, length - suffix.length) + suffix;
}

/**
 * Pobierz parametr URL
 * @param {string} name - Nazwa parametru
 * @param {string} url - URL (domyślnie window.location.href)
 * @returns {string|null} Wartość parametru lub null
 */
export function getUrlParameter(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Download pliku z data URL
 * @param {string} dataUrl - Data URL
 * @param {string} filename - Nazwa pliku
 */
export function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Copy text do schowka
 * @param {string} text - Tekst do skopiowania
 * @returns {Promise<boolean>} Promise z wynikiem operacji
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback dla starszych przeglądarek
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const result = document.execCommand('copy');
            textArea.remove();
            return result;
        }
    } catch (error) {
        console.error('Failed to copy text: ', error);
        return false;
    }
}

// 🔧 Default export z wszystkimi funkcjami (dla kompatybilności)
export default {
    debounce,
    throttle,
    shuffle,
    deepClone,
    formatDate,
    isMobile,
    isTouchDevice,
    setupLazyLoading,
    sanitizeHTML,
    generateId,
    isEmpty,
    delay,
    retry,
    formatFileSize,
    isValidUrl,
    escapeHtml,
    capitalizeWords,
    truncateText,
    getUrlParameter,
    downloadFile,
    copyToClipboard
};

// 🔧 KOMPATYBILNOŚĆ WSTECZNA: Eksport globalny klasy Utils
if (typeof window !== 'undefined') {
    window.Utils = {
        debounce,
        throttle,
        shuffle,
        deepClone,
        formatDate,
        isMobile: isMobile,
        setupLazyLoading,
        sanitizeHTML,
        generateId
    };
}