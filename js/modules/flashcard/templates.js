/**
 * FlashcardTemplates - HTML szablony
 * Wszystkie funkcje statyczne do generowania HTML
 */

class FlashcardTemplates {
    static getWordTypeElement(type) {
        const typeClass = FlashcardTemplates.getTypeClass(type);
        return `<div class="word-type ${typeClass}">${type}</div>`;
    }

    static getDifficultyBadge(difficulty) {
        const label = FlashcardTemplates.getDifficultyLabel(difficulty);
        return `<div class="difficulty-badge difficulty-${difficulty}">${label}</div>`;
    }

    static getFrequencyBadge(frequency) {
        const label = FlashcardTemplates.getFrequencyLabel(frequency);
        return `<div class="frequency-badge frequency-${frequency}">${label}</div>`;
    }

    static getExampleSection(examples) {
        return `
            <div class="example-sentence">
                <div class="sentence-english">${examples.english}</div>
                <div class="sentence-polish">${examples.polish}</div>
            </div>
        `;
    }

    static getRelatedWordsSection(word) {
        let html = '';
        
        if (word.synonyms && word.synonyms.length > 0) {
            html += `
                <div class="synonyms">
                    <span class="label">Synonimy:</span>
                    <span class="words">${word.synonyms.join(', ')}</span>
                </div>
            `;
        }

        if (word.antonyms && word.antonyms.length > 0) {
            html += `
                <div class="antonyms">
                    <span class="label">Antonimy:</span>
                    <span class="words">${word.antonyms.join(', ')}</span>
                </div>
            `;
        }

        return html ? `<div class="related-words">${html}</div>` : '';
    }

    static getAudioButton(text, type = 'word') {
        const buttonClass = type === 'sentence' ? 'sentence-audio-btn' : 'word-audio-btn';
        const icon = type === 'sentence' ? '🎵' : '🔊';
        const textLabel = type === 'sentence' ? 'Posłuchaj zdania' : 'Posłuchaj słowa';
        
        return `
            <button class="audio-btn ${buttonClass}" data-audio-text="${text}" data-audio-type="${type}">
                <span class="icon">${icon}</span>
                <span class="text">${textLabel}</span>
            </button>
        `;
    }

    static getDifficultyButton(difficulty) {
        const config = {
            'easy': { icon: '⭐', text: 'Łatwe', class: 'easy' },
            'medium': { icon: '⭐⭐', text: 'Średnie', class: 'medium' },
            'hard': { icon: '⭐⭐⭐', text: 'Trudne', class: 'hard' }
        };
        
        const btnConfig = config[difficulty] || config['medium'];
        
        return `
            <button class="control-btn difficulty-btn ${btnConfig.class}" 
                    aria-label="Poziom trudności: ${btnConfig.text}" 
                    title="Poziom trudności: ${btnConfig.text}. Kliknij aby zmienić.">
                <span class="icon">${btnConfig.icon}</span>
                <span class="text">${btnConfig.text}</span>
            </button>
        `;
    }

    static getBookmarkButton(isBookmarked) {
        const icon = isBookmarked ? '🔖' : '⚪';
        const text = isBookmarked ? 'Usuń z trybu powtórki' : 'Dodaj do powtórek';
        const className = isBookmarked ? 'bookmarked' : 'not-bookmarked';
        
        return `
            <button class="control-btn bookmark-btn ${className}" 
                    aria-pressed="${isBookmarked}" 
                    title="${text}">
                <span class="icon">${icon}</span>
                <span class="text">${text}</span>
            </button>
        `;
    }

    static getAddImageButton() {
        return `
            <button class="add-image-btn">
                <span class="icon">📷</span>
                <span class="text">Dodaj obrazek</span>
            </button>
        `;
    }

    static getImageControls() {
        return `
            <div class="image-controls">
                <button class="image-control-btn edit-btn" title="Zmień obrazek">✏️</button>
                <button class="image-control-btn delete-btn" title="Usuń obrazek">🗑️</button>
            </div>
        `;
    }

    static getSentenceHeader() {
        return '<div class="sentence-header">Przykład użycia:</div>';
    }

    static getWordContext(word) {
        return `
            <div class="word-context">
                Słowo: <strong>${word.english}</strong> → <strong>${word.polish}</strong>
            </div>
        `;
    }

    static getWordDetails(word) {
        let html = `
            <div class="word-details">
                <div class="word-info">
                    <div class="detail-item">
                        <span class="label">Słowo:</span>
                        <span class="value">${word.english} → ${word.polish}</span>
                    </div>
        `;

        if (word.type) {
            html += `
                <div class="detail-item">
                    <span class="label">Typ:</span>
                    <span class="value">${word.type}</span>
                </div>
            `;
        }

        if (word.pronunciation) {
            html += `
                <div class="detail-item">
                    <span class="label">Wymowa:</span>
                    <span class="value">${word.pronunciation}</span>
                </div>
            `;
        }

        html += '</div></div>';
        return html;
    }

    // Pomocnicze metody statyczne
    static getTypeClass(type) {
        const typeMap = {
            'adjective': 'type-adjective',
            'noun': 'type-noun',
            'verb': 'type-verb',
            'adverb': 'type-adverb'
        };
        return typeMap[type] || 'type-default';
    }

    static getDifficultyLabel(difficulty) {
        const labels = {
            'easy': 'Łatwy',
            'medium': 'Średni',
            'hard': 'Trudny'
        };
        return labels[difficulty] || difficulty;
    }

    static getFrequencyLabel(frequency) {
        const labels = {
            'high': 'Częste',
            'medium': 'Średnie',
            'low': 'Rzadkie'
        };
        return labels[frequency] || frequency;
    }
}

// 🎯 EXPORT - udostępniamy klasę innym plikom
export default FlashcardTemplates;