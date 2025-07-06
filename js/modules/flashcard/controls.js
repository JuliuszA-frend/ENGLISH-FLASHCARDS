/**
 * FlashcardControls - Kontrolki fiszek (trudność, bookmark)
 * UŻYWA: FlashcardTemplates, DOMHelper
 */

// 🎯 IMPORT
import FlashcardTemplates from './templates.js';
import DOMHelper from './dom-helper.js';

class FlashcardControls {
    constructor() {
        this.progressManager = null;
    }

    setProgressManager(progressManager) {
        this.progressManager = progressManager;
    }

    addWordControls(container, word) {
        const controlsEl = DOMHelper.createElement('div', 'word-controls');

        // Przycisk trudności
        const difficultyBtn = this.createDifficultyButton(word);
        
        // Przycisk bookmark
        const bookmarkBtn = this.createBookmarkButton(word);

        controlsEl.appendChild(difficultyBtn);
        controlsEl.appendChild(bookmarkBtn);
        container.appendChild(controlsEl);
    }

    createDifficultyButton(word) {
        const currentDifficulty = this.getWordDifficulty(word);
        const difficultyBtn = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getDifficultyButton(currentDifficulty)
        );
        
        difficultyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`⭐ Kliknięto przycisk trudności dla słowa: ${word.english}`);
            
            DOMHelper.addClickAnimation(difficultyBtn);
            
            const newDifficulty = this.toggleDifficulty(word);
            
            setTimeout(() => {
                this.updateDifficultyButton(difficultyBtn, newDifficulty);
                DOMHelper.addChangeAnimation(difficultyBtn);
                this.updateDifficultyBadge(word);
            }, 100);
            
            this.showDifficultyNotification(word, newDifficulty);
            
            console.log(`✅ Trudność zmieniona na: ${newDifficulty} dla słowa: ${word.english}`);
        });

        return difficultyBtn;
    }

    createBookmarkButton(word) {
        const isBookmarked = this.isWordBookmarked(word);
        const bookmarkBtn = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getBookmarkButton(isBookmarked)
        );
        
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`🔖 Kliknięto bookmark dla słowa: ${word.english}`);
            
            DOMHelper.addClickAnimation(bookmarkBtn);
            
            const newState = this.toggleBookmark(word);
            
            setTimeout(() => {
                this.updateBookmarkButton(bookmarkBtn, newState);
                DOMHelper.addChangeAnimation(bookmarkBtn);
            }, 100);
            
            this.showBookmarkNotification(word, newState);
            
            if (window.englishFlashcardsApp) {
                window.englishFlashcardsApp.updateStats();
            }
            
            console.log(`✅ Bookmark ${newState ? 'dodany' : 'usunięty'} dla słowa: ${word.english}`);
        });

        return bookmarkBtn;
    }

    getWordDifficulty(word) {
        if (this.progressManager && typeof this.progressManager.getWordDifficulty === 'function') {
            try {
                return this.progressManager.getWordDifficulty(word);
            } catch (error) {
                console.warn('⚠️ Błąd pobierania trudności z ProgressManager:', error);
            }
        }
        return word.difficulty || 'medium';
    }

    isWordBookmarked(word) {
        if (this.progressManager && typeof this.progressManager.isWordBookmarked === 'function') {
            try {
                const isBookmarked = this.progressManager.isWordBookmarked(word);
                console.log(`🔍 Sprawdzam bookmark dla ${word.english}: ${isBookmarked}`);
                return isBookmarked;
            } catch (error) {
                console.error('❌ Błąd podczas sprawdzania bookmark:', error);
                return false;
            }
        }
        console.warn('⚠️ ProgressManager nie jest dostępny');
        return false;
    }

    toggleDifficulty(word) {
        if (!this.progressManager) {
            console.error('❌ ProgressManager nie jest dostępny');
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Błąd: Nie można zmienić trudności', 'error');
            }
            return this.getWordDifficulty(word);
        }
        
        try {
            const oldDifficulty = this.getWordDifficulty(word);
            const newDifficulty = this.progressManager.toggleWordDifficulty(word);
            
            console.log(`🔄 Toggle difficulty: ${word.english} → ${oldDifficulty} → ${newDifficulty}`);
            
            if (window.englishFlashcardsApp && window.englishFlashcardsApp.updateDifficultyQuizUI) {
                console.log('🎨 Aktualizuję UI quizów trudności...');
                window.englishFlashcardsApp.updateDifficultyQuizUI();
            }
            
            document.dispatchEvent(new CustomEvent('wordDifficultyChanged', {
                detail: { 
                    word: word, 
                    oldDifficulty: oldDifficulty,
                    newDifficulty: newDifficulty,
                    wordKey: this.progressManager.getWordKey(word)
                }
            }));
            
            console.log(`📢 Event wordDifficultyChanged wysłany dla: ${word.english}`);
            
            return newDifficulty;
            
        } catch (error) {
            console.error('❌ Błąd podczas toggle difficulty:', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Błąd podczas zmiany trudności', 'error');
            }
            
            return this.getWordDifficulty(word);
        }
    }

    toggleBookmark(word) {
        if (!this.progressManager) {
            console.error('❌ ProgressManager nie jest dostępny');
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Błąd: Nie można zapisać do powtórki', 'error');
            }
            return false;
        }
        
        try {
            const wasInBookmarksMode = window.englishFlashcardsApp?.state?.bookmarksOnlyMode || false;
            const bookmarksCountBefore = this.progressManager.getAllBookmarkedWords().length;
            const isCurrentlyBookmarked = this.progressManager.isWordBookmarked(word);
            
            console.log(`🔖 Stan przed toggle: tryb=${wasInBookmarksMode}, liczba=${bookmarksCountBefore}, będzie_usunięte=${isCurrentlyBookmarked}`);
            
            const willBeLastBookmark = isCurrentlyBookmarked && bookmarksCountBefore === 1;
            const newState = this.progressManager.toggleWordBookmark(word);
            
            console.log(`🔄 Toggle bookmark: ${word.english} → ${newState ? 'dodany' : 'usunięty'}`);
            
            if (wasInBookmarksMode && willBeLastBookmark && !newState && window.englishFlashcardsApp) {
                console.log('🚪 To było ostatnie słowo w trybie powtórki - wychodzimy z trybu');
                
                if (window.englishFlashcardsApp.exitBookmarksOnlyMode) {
                    window.englishFlashcardsApp.exitBookmarksOnlyMode();
                    
                    setTimeout(() => {
                        if (typeof NotificationManager !== 'undefined') {
                            NotificationManager.show(
                                '🚪 Wyszedłeś z trybu powtórki - brak słów do nauki', 
                                'info', 
                                4000
                            );
                        }
                    }, 800);
                }
            }
            
            return newState;
            
        } catch (error) {
            console.error('❌ Błąd podczas toggle bookmark:', error);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Błąd podczas zapisywania powtórki', 'error');
            }
            
            return false;
        }
    }

    updateDifficultyButton(button, difficulty) {
        const difficultyConfig = {
            'easy': { icon: '⭐', text: 'Łatwe', class: 'easy' },
            'medium': { icon: '⭐⭐', text: 'Średnie', class: 'medium' },
            'hard': { icon: '⭐⭐⭐', text: 'Trudne', class: 'hard' }
        };
        
        const config = difficultyConfig[difficulty] || difficultyConfig['medium'];
        
        const currentIcon = button.querySelector('.icon');
        const currentText = button.querySelector('.text');
        
        if (currentIcon && currentText) {
            button.style.transform = 'scale(0.95)';
            button.style.opacity = '0.7';
            
            setTimeout(() => {
                currentIcon.textContent = config.icon;
                currentText.textContent = config.text;
                
                button.classList.remove('easy', 'medium', 'hard');
                button.classList.add(config.class);
                
                button.style.transform = 'scale(1)';
                button.style.opacity = '1';
            }, 150);
        } else {
            button.innerHTML = `
                <span class="icon">${config.icon}</span>
                <span class="text">${config.text}</span>
            `;
            
            button.classList.remove('easy', 'medium', 'hard');
            button.classList.add(config.class);
        }
        
        button.setAttribute('aria-label', `Poziom trudności: ${config.text}`);
        button.setAttribute('title', `Poziom trudności: ${config.text}. Kliknij aby zmienić.`);
        
        console.log(`🎨 Zaktualizowano przycisk trudności: ${difficulty} (${config.text})`);
    }

    updateBookmarkButton(button, isBookmarked) {
        const icon = isBookmarked ? '🔖' : '⚪';
        const text = isBookmarked ? 'Usuń z trybu powtórki' : 'Dodaj do powtórek';
        
        button.innerHTML = `
            <span class="icon">${icon}</span>
            <span class="text">${text}</span>
        `;
        
        button.classList.toggle('active', isBookmarked);
        button.classList.toggle('bookmarked', isBookmarked);
        
        button.setAttribute('aria-pressed', isBookmarked);
        button.setAttribute('title', text);
    }

    updateDifficultyBadge(word) {
        const difficultyBadge = document.querySelector('.difficulty-badge');
        if (!difficultyBadge || !word) return;
        
        const currentDifficulty = this.getWordDifficulty(word);
        
        difficultyBadge.className = 'difficulty-badge';
        difficultyBadge.classList.add(`difficulty-${currentDifficulty}`);
        difficultyBadge.textContent = FlashcardTemplates.getDifficultyLabel(currentDifficulty);
        
        difficultyBadge.style.transform = 'scale(1.1)';
        difficultyBadge.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            difficultyBadge.style.transform = 'scale(1)';
        }, 300);
        
        console.log(`🎨 Zaktualizowano badge trudności na przodzie: ${currentDifficulty}`);
    }

    showDifficultyNotification(word, newDifficulty) {
        if (typeof NotificationManager !== 'undefined') {
            const difficultyLabels = {
                'easy': 'Łatwe',
                'medium': 'Średnie', 
                'hard': 'Trudne'
            };
            
            const label = difficultyLabels[newDifficulty] || newDifficulty;
            const icon = {
                'easy': '⭐',
                'medium': '⭐⭐', 
                'hard': '⭐⭐⭐'
            }[newDifficulty] || '⭐';
            
            const message = `${icon} "${word.english}" → ${label}`;
            NotificationManager.show(message, 'info', 2000);
        }
    }

    showBookmarkNotification(word, isBookmarked) {
        if (typeof NotificationManager !== 'undefined') {
            const message = isBookmarked 
                ? `"${word.english}" dodane do powtórek 🔖`
                : `"${word.english}" usunięte z powtórek ⚪`;
            
            const type = isBookmarked ? 'success' : 'info';
            NotificationManager.show(message, type, 3000);
        }
    }

    refreshDifficultyState(word) {
        const difficultyBtn = document.querySelector('.difficulty-btn');
        if (difficultyBtn && word) {
            const currentDifficulty = this.getWordDifficulty(word);
            this.updateDifficultyButton(difficultyBtn, currentDifficulty);
        }
    }

    refreshBookmarkState(word) {
        const bookmarkBtn = document.querySelector('.bookmark-btn');
        if (bookmarkBtn && word) {
            const isBookmarked = this.isWordBookmarked(word);
            this.updateBookmarkButton(bookmarkBtn, isBookmarked);
        }
    }
}

// 🎯 EXPORT
export default FlashcardControls;