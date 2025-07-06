/**
 * FlashcardAudioHandler - Obsługa audio dla fiszek
 * UŻYWA: FlashcardTemplates, DOMHelper
 */

// 🎯 IMPORT - pobieramy klasy z innych plików
import FlashcardTemplates from './templates.js';
import DOMHelper from './dom-helper.js';

class FlashcardAudioHandler {
    constructor(audioManager) {
        this.audioManager = audioManager;
    }

    addAudioButton(container, text, type = 'word') {
        // Używamy FlashcardTemplates z innego pliku!
        const audioBtn = DOMHelper.createElementFromHTML(
            FlashcardTemplates.getAudioButton(text, type)
        );
        
        audioBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            console.log(`${type === 'sentence' ? '🎵' : '🔊'} Kliknięto przycisk audio dla ${type}: "${text}"`);
            
            if (this.audioManager) {
                const selector = type === 'sentence' ? '.sentence-audio-btn' : '.word-audio-btn';
                const options = type === 'sentence' ? { rate: 0.8 } : {};
                
                const success = await this.audioManager.playAudio(text, options, selector);
                if (!success) {
                    console.error(`❌ Nie udało się odtworzyć audio ${type}`);
                }
            } else {
                console.error('❌ AudioManager nie jest dostępny');
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.show('AudioManager nie jest zainicjalizowany', 'error');
                }
            }
        });

        container.appendChild(audioBtn);
    }

    async autoPlayAudio(text) {
        if (this.audioManager && this.audioManager.autoPlay && text) {
            setTimeout(() => {
                this.audioManager.playAudio(text);
            }, 500);
        }
    }

    async testCurrentWordAudio(currentWord) {
        if (!currentWord || !this.audioManager) {
            console.warn('⚠️ Brak słowa lub AudioManager do testu');
            return false;
        }

        console.log('🧪 Testuję audio dla bieżącego słowa...');
        
        const success = await this.audioManager.playAudio(currentWord.english);
        
        if (success) {
            console.log('✅ Test audio pomyślny');
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Audio działa poprawnie!', 'success');
            }
        } else {
            console.error('❌ Test audio nieudany');
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show('Problem z audio. Sprawdź konsole.', 'error');
            }
        }
        
        return success;
    }

    toggleAutoPlay() {
        if (this.audioManager) {
            const newState = !this.audioManager.autoPlay;
            this.audioManager.setAutoPlay(newState);
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.show(
                    `Auto-play ${newState ? 'włączone' : 'wyłączone'}`, 
                    'info'
                );
            }
            
            return newState;
        }
        return false;
    }
}

// 🎯 EXPORT - udostępniamy klasę
export default FlashcardAudioHandler;