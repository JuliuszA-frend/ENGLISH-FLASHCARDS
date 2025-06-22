/**
 * AudioManager - Zarządzanie audio
 */
class AudioManager {
    constructor() {
        this.audioCache = new Map();
        this.isPlaying = false;
        this.autoPlay = false;
        this.volume = 1.0;
        this.currentAudio = null;
        this.voiceSettings = {
            rate: 1.0,
            pitch: 1.0,
            voice: null
        };
        
        this.initializeSpeechSynthesis();
    }

    /**
     * Inicjalizacja Speech Synthesis API
     */
    initializeSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            this.loadVoices();
            
            // Voices mogą być ładowane asynchronicznie
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    /**
     * Ładowanie dostępnych głosów
     */
    loadVoices() {
        const voices = this.speechSynthesis.getVoices();
        
        // Znajdź angielski głos
        const englishVoices = voices.filter(voice => 
            voice.lang.startsWith('en-') && 
            (voice.lang.includes('US') || voice.lang.includes('GB'))
        );
        
        if (englishVoices.length > 0) {
            this.voiceSettings.voice = englishVoices[0];
        }
    }

    /**
     * Ustawienie automatycznego odtwarzania
     */
    setAutoPlay(enabled) {
        this.autoPlay = enabled;
    }

    /**
     * Ustawienie głośności
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Preloadowanie audio
     */
    async preloadAudio(text) {
        if (!text || this.audioCache.has(text)) return;

        try {
            // Dla krótszych tekstów używaj TTS, dla dłuższych External API
            if (text.length < 50) {
                this.audioCache.set(text, { type: 'tts', text: text });
            } else {
                const audioUrl = await this.getExternalAudioUrl(text);
                if (audioUrl) {
                    const audio = new Audio(audioUrl);
                    this.audioCache.set(text, { type: 'url', audio: audio });
                }
            }
        } catch (error) {
            console.warn('Błąd preloadowania audio:', error);
        }
    }

    /**
     * Odtwarzanie audio
     */
    async playAudio(text, options = {}) {
        if (!text || this.isPlaying) return false;

        try {
            this.isPlaying = true;
            this.updateAudioButton('loading', '⏳ Ładowanie...');

            let success = false;

            // Sprawdź cache
            const cached = this.audioCache.get(text);
            
            if (cached) {
                if (cached.type === 'tts') {
                    success = await this.playTTS(text, options);
                } else if (cached.type === 'url') {
                    success = await this.playAudioFile(cached.audio);
                }
            } else {
                // Spróbuj najpierw TTS
                success = await this.playTTS(text, options);
                
                // Jeśli TTS nie działa, spróbuj external API
                if (!success) {
                    success = await this.playExternalAudio(text);
                }
            }

            if (success) {
                this.updateAudioButton('success', '🔊 Odtwarzanie...');
            } else {
                this.updateAudioButton('error', '❌ Błąd audio');
                setTimeout(() => this.resetAudioButton(), 2000);
            }

            return success;

        } catch (error) {
            console.error('Błąd odtwarzania audio:', error);
            this.updateAudioButton('error', '❌ Błąd audio');
            setTimeout(() => this.resetAudioButton(), 2000);
            return false;
        } finally {
            setTimeout(() => {
                this.isPlaying = false;
                this.resetAudioButton();
            }, 2000);
        }
    }

    /**
     * Odtwarzanie przez Text-to-Speech
     */
    async playTTS(text, options = {}) {
        if (!this.speechSynthesis) return false;

        return new Promise((resolve) => {
            try {
                // Zatrzymaj poprzednie odtwarzanie
                this.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);
                
                // Ustawienia głosu
                utterance.voice = this.voiceSettings.voice;
                utterance.rate = options.rate || this.voiceSettings.rate;
                utterance.pitch = options.pitch || this.voiceSettings.pitch;
                utterance.volume = options.volume || this.volume;
                utterance.lang = options.lang || 'en-US';

                utterance.onend = () => resolve(true);
                utterance.onerror = () => resolve(false);

                this.speechSynthesis.speak(utterance);
                this.currentAudio = utterance;

            } catch (error) {
                console.error('Błąd TTS:', error);
                resolve(false);
            }
        });
    }

    /**
     * Odtwarzanie pliku audio
     */
    async playAudioFile(audio) {
        return new Promise((resolve) => {
            try {
                audio.volume = this.volume;
                
                const handleEnd = () => {
                    audio.removeEventListener('ended', handleEnd);
                    audio.removeEventListener('error', handleError);
                    resolve(true);
                };
                
                const handleError = () => {
                    audio.removeEventListener('ended', handleEnd);
                    audio.removeEventListener('error', handleError);
                    resolve(false);
                };

                audio.addEventListener('ended', handleEnd);
                audio.addEventListener('error', handleError);

                audio.play();
                this.currentAudio = audio;

            } catch (error) {
                console.error('Błąd odtwarzania pliku:', error);
                resolve(false);
            }
        });
    }

    /**
     * Odtwarzanie przez zewnętrzne API
     */
    async playExternalAudio(text) {
        try {
            const audioUrl = await this.getExternalAudioUrl(text);
            if (!audioUrl) return false;

            const audio = new Audio(audioUrl);
            return await this.playAudioFile(audio);

        } catch (error) {
            console.error('Błąd external audio:', error);
            return false;
        }
    }

    /**
     * Pobranie URL audio z zewnętrznego API
     */
    async getExternalAudioUrl(text) {
        // Google Translate TTS jako fallback
        const encodedText = encodeURIComponent(text);
        return `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;
    }

    /**
     * Zatrzymanie odtwarzania
     */
    stopAudio() {
        if (this.currentAudio) {
            if (this.currentAudio instanceof SpeechSynthesisUtterance) {
                this.speechSynthesis.cancel();
            } else if (this.currentAudio instanceof Audio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            this.currentAudio = null;
        }
        this.isPlaying = false;
        this.resetAudioButton();
    }

    /**
     * Aktualizacja przycisku audio
     */
    updateAudioButton(className, text) {
        const audioBtn = document.querySelector('.audio-btn');
        if (audioBtn) {
            audioBtn.className = `audio-btn ${className}`.trim();
            audioBtn.textContent = text;
            audioBtn.disabled = className === 'loading';
        }
    }

    /**
     * Reset przycisku audio
     */
    resetAudioButton() {
        const audioBtn = document.querySelector('.audio-btn');
        if (audioBtn) {
            audioBtn.className = 'audio-btn';
            audioBtn.textContent = '🔊 Posłuchaj';
            audioBtn.disabled = false;
        }
    }

    /**
     * Czyszczenie zasobów
     */
    cleanup() {
        this.stopAudio();
        this.audioCache.clear();
        this.currentAudio = null;
    }
}