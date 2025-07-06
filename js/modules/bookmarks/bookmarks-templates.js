/**
 * BookmarksTemplates - Szablony HTML dla modułu bookmarks
 * Wszystkie funkcje statyczne do generowania HTML
 */

class BookmarksTemplates {
    /**
     * 📋 Template dla pojedynczego elementu bookmark
     */
    static getBookmarkItemTemplate(word, index) {
        const bookmarkDate = word.bookmarkedAt 
            ? new Date(word.bookmarkedAt).toLocaleDateString('pl-PL')
            : 'Nieznana';
        
        return `
            <div class="bookmark-item" data-word-key="${word.wordKey}">
                <div class="bookmark-word">
                    <div class="word-main">
                        <div class="word-english">${word.english}</div>
                        <div class="word-polish">${word.polish}</div>
                    </div>
                    <div class="bookmark-actions-item">
                        <button class="bookmark-action-btn study-btn" title="Ucz się tego słowa">
                            📚
                        </button>
                        <button class="bookmark-action-btn remove-btn" title="Usuń z powtórek">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="bookmark-meta">
                    <span class="category-tag">
                        <span>${word.categoryIcon}</span>
                        <span>${word.categoryName}</span>
                    </span>
                    <span class="bookmark-date">Dodano: ${bookmarkDate}</span>
                </div>
            </div>
        `;
    }

    /**
     * 📭 Template dla placeholder gdy brak bookmarks
     */
    static getEmptyStateTemplate(isFiltered = false) {
        if (isFiltered) {
            return `
                <div class="placeholder">
                    <div class="placeholder-icon">🔍</div>
                    <h4>Brak wyników</h4>
                    <p>Brak wyników dla podanych kryteriów wyszukiwania</p>
                </div>
            `;
        }

        return `
            <div class="placeholder">
                <div class="placeholder-icon">🔖</div>
                <h4>Brak słówek do powtórzenia</h4>
                <p>Dodaj słowa do powtórek klikając przycisk 🔖 na fiszce</p>
                <button class="btn primary" onclick="closeBookmarksModal()">
                    <span class="text">Zacznij naukę</span>
                </button>
            </div>
        `;
    }

    /**
     * 📊 Template dla statystyk bookmarks
     */
    static getStatsTemplate(stats) {
        return `
            <div class="bookmark-stats">
                <div class="stat-item">
                    <span class="label">Łącznie:</span>
                    <span class="value">${stats.totalBookmarks}</span>
                </div>
                <div class="stat-item">
                    <span class="label">Kategorie:</span>
                    <span class="value">${stats.totalCategories}</span>
                </div>
                <div class="stat-item">
                    <span class="label">Ostatnio dodane:</span>
                    <span class="value">${stats.recentlyAdded.length > 0 ? stats.recentlyAdded[0].english : '-'}</span>
                </div>
            </div>
        `;
    }

    /**
     * 🏷️ Template dla opcji filtru kategorii
     */
    static getCategoryFilterOptionsTemplate(categoryStats) {
        let options = '';
        
        Object.entries(categoryStats).forEach(([key, category]) => {
            options += `
                <option value="${key}">
                    ${category.categoryIcon} ${category.categoryName} (${category.count})
                </option>
            `;
        });

        return options;
    }

    /**
     * 📄 Template dla paginacji
     */
    static getPaginationTemplate(currentPage, totalPages) {
        return `
            <button id="prev-page" class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''}>
                ‹ Poprzednie
            </button>
            <span id="page-info" class="page-info">
                Strona ${currentPage} z ${totalPages}
            </span>
            <button id="next-page" class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''}>
                Następne ›
            </button>
        `;
    }

    /**
     * ❌ Template dla błędu
     */
    static getErrorTemplate(message) {
        return `
            <div class="placeholder error-state">
                <div class="placeholder-icon">❌</div>
                <h4>Błąd</h4>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * 🔄 Template dla loading state
     */
    static getLoadingTemplate() {
        return `
            <div class="placeholder loading-state">
                <div class="placeholder-icon">⏳</div>
                <h4>Ładowanie...</h4>
                <p>Pobieranie słów do powtórek...</p>
            </div>
        `;
    }

    /**
     * 🎯 Template dla akcji w trybie batch
     */
    static getBatchActionsTemplate(selectedCount) {
        return `
            <div class="batch-actions" style="display: ${selectedCount > 0 ? 'flex' : 'none'}">
                <div class="batch-info">
                    <span>Wybrano: <strong>${selectedCount}</strong> słów</span>
                </div>
                <div class="batch-buttons">
                    <button class="btn secondary batch-study-btn">
                        <span class="icon">📚</span>
                        <span class="text">Ucz się wybranych</span>
                    </button>
                    <button class="btn danger batch-remove-btn">
                        <span class="icon">🗑️</span>
                        <span class="text">Usuń wybrane</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 📱 Template dla trybu mobilnego (kompaktowy)
     */
    static getCompactBookmarkItemTemplate(word) {
        return `
            <div class="bookmark-item compact" data-word-key="${word.wordKey}">
                <div class="compact-word">
                    <div class="word-pair">
                        <span class="english">${word.english}</span>
                        <span class="polish">${word.polish}</span>
                    </div>
                    <div class="compact-actions">
                        <button class="action-btn study-btn" title="Ucz się">📚</button>
                        <button class="action-btn remove-btn" title="Usuń">🗑️</button>
                    </div>
                </div>
                <div class="compact-meta">
                    <span class="category">${word.categoryIcon} ${word.categoryName}</span>
                </div>
            </div>
        `;
    }

    /**
     * 🔍 Helper: Escape HTML dla bezpieczeństwa
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 📅 Helper: Formatowanie daty
     */
    static formatDate(dateString) {
        if (!dateString) return 'Nieznana';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Nieprawidłowa data';
        }
    }

    /**
     * 🏷️ Helper: Generowanie klasy CSS dla kategorii
     */
    static getCategoryClass(categoryKey) {
        return `category-${categoryKey.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
    }

    /**
     * 🎨 Helper: Generowanie koloru dla kategorii
     */
    static getCategoryColor(categoryKey) {
        const colors = [
            '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b',
            '#10b981', '#06b6d4', '#84cc16', '#f97316'
        ];
        
        // Prosty hash z nazwy kategorii
        let hash = 0;
        for (let i = 0; i < categoryKey.length; i++) {
            hash = categoryKey.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }
}

// 🎯 EXPORT
export default BookmarksTemplates;