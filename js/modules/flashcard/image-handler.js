/**
 * FlashcardImageHandler - Obsługa obrazków dla fiszek
 * UŻYWA: FlashcardTemplates, DOMHelper
 */

// 🎯 IMPORT - pobieramy potrzebne klasy
import FlashcardTemplates from './templates.js';
import DOMHelper from './dom-helper.js';

class FlashcardImageHandler {
    constructor(imageManager) {
        this.imageManager = imageManager;
    }

    addImageSection(container, word) {
        if (!this.imageManager) return;

        const wordId = this.getWordId(word);
        const savedImage = this.imageManager.getImage(wordId);

        if (savedImage) {
            this.addExistingImage(container, savedImage, wordId, word);
        } else {
            this.addImageButton(container, wordId, word);
        }
    }

    addExistingImage(container, savedImage, wordId, word) {
        const imageEl = DOMHelper.createElement('img', 'word-image');
        imageEl.src = savedImage;
        imageEl.alt = `Obrazek dla: ${word.polish}`;
        imageEl.loading = 'lazy';
        
        const imageWrapper = DOMHelper.createElement('div', 'image-wrapper');
        imageWrapper.appendChild(imageEl);
        
        const controls = this.createImageControls(wordId, word);
        imageWrapper.appendChild(controls);
        
        container.appendChild(imageWrapper);
    }

    addImageButton(container, wordId, word) {
        const addImageBtn = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getAddImageButton()
        );
        
        addImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openImageManager(wordId, word);
        });
        
        container.appendChild(addImageBtn);
    }

    createImageControls(wordId, word) {
        const controls = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getImageControls()
        );

        const editBtn = controls.querySelector('.edit-btn');
        const deleteBtn = controls.querySelector('.delete-btn');

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openImageManager(wordId, word);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteWordImage(wordId);
        });

        return controls;
    }

    openImageManager(wordId, word) {
        if (this.imageManager) {
            this.imageManager.openManagerForWord(wordId, word);
        }
    }

    deleteWordImage(wordId) {
        if (this.imageManager && confirm('Czy na pewno chcesz usunąć ten obrazek?')) {
            this.imageManager.deleteImage(wordId);
            if (window.englishFlashcardsApp) {
                window.englishFlashcardsApp.updateCard();
            }
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Obrazek został usunięty', 'info');
            }
        }
    }

    getWordId(word) {
        return `word-${word.id || word.english.toLowerCase().replace(/\s+/g, '-')}`;
    }
}

// 🎯 EXPORT
export default FlashcardImageHandler;