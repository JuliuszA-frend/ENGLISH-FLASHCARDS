/**
 * AudioManager - Modularny zarządzanie audio ES6
 * Wersja refaktoryzowana z podziałem na moduły
 */

import { AUDIO_CONFIG } from './audio-config.js';
import { 
    SpeechSynthesisEngine, 
    GoogleTTSEngine, 
    ResponsiveVoiceEngine,
    TTSEngineFactory 
} from './tts-engines.js';

/**
 * Główna klasa AudioManager
 */
export class AudioManager {
    constructor() {
        this.audioCache = new Map();
        this.isPlaying = false;
        this.autoPlay = false;
        this.volume = AUDIO_CONFIG.defaults.volume;
        this.rate = AUDIO_CONFIG.defaults.rate;
        this.currentAudio = null;
        
        // Silniki TTS
        this.engines = {
            speechSynthesis: null,
            googleTTS: null,
            responsiveVoice: null
        };
        
        // Stan inicjalizacji
        this.isInitialized = false;
        
        console.log('🔊 AudioManager (ES6) zainicjalizowany');
    }

    /**
     * Inicjalizacja AudioManager
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ AudioManager już zainicjalizowany');
            return;
        }

        console.log('🔄 Inicjalizuję silniki TTS...');

        try {
            // Inicjalizuj silniki TTS
            this.engines.speechSynthesis = await TTSEngineFactory.createAndInitialize('speechSynthesis');
            this.engines.googleTTS = TTSEngineFactory.createEngine('googleTTS');
            this.engines.responsiveVoice = TTSEngineFactory.createEngine('responsiveVoice');

            this.isInitialized = true;
            console.log('✅ AudioManager w pełni zainicjalizowany');

            // Wykonaj test po chwili
            setTimeout(() => this.performDelayedTest(), 2000);

        } catch (error) {
            console.error('❌ Błąd inicjalizacji AudioManager:', error);
        }
    }

    /**
     * Test audio z opóźnieniem
     */
    async performDelayedTest() {
        try {
            const testResults = await this.testAudio();
            const workingMethods = Object.entries(testResults)
                .filter(([_, works]) => works)
                .map(([method, _]) => method);
                
            if (workingMethods.length > 0) {
                console.log(`✅ Działające metody audio: ${workingMethods.join(', ')}`);
            } else {
                console.warn('⚠️ Żadna metoda audio nie działa - sprawdź ustawienia przeglądarki');
            }
        } catch (error) {
            console.warn('⚠️ Błąd testu audio:', error);
        }
    }

    /**
     * Główna metoda odtwarzania audio
     */
    async playAudio(text, options = {}, buttonSelector = null) {
        if (!text || this.isPlaying) {
            console.log('⚠️ Audio już odtwarzane lub brak tekstu');
            return false;
        }

        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`🔊 Próba odtworzenia: "${text}"`);
        
        try {
            this.isPlaying = true;
            this.updateAudioButton('loading', AUDIO_CONFIG.ui.texts.loading, buttonSelector);

            let success = false;

            // 1. Najpierw próbuj Speech Synthesis (najszybsze)
            if (this.engines.speechSynthesis) {
                console.log('🎤 Próbuję Speech Synthesis...');
                success = await this.engines.speechSynthesis.speak(text, {
                    ...options,
                    volume: this.volume,
                    rate: this.rate
                });
            }

            // 2. Jeśli TTS nie działa, próbuj Google TTS
            if (!success && this.engines.googleTTS) {
                console.log('🌐 Próbuję Google TTS...');
                success = await this.engines.googleTTS.speak(text, {
                    ...options,
                    volume: this.volume
                });
            }

            // 3. Ostatnia szansa - ResponsiveVoice
            if (!success && this.engines.responsiveVoice) {
                console.log('📻 Próbuję ResponsiveVoice...');
                success = await this.engines.responsiveVoice.speak(text, {
                    ...options,
                    volume: this.volume,
                    rate: this.rate
                });
            }

            if (success) {
                this.updateAudioButton('success', AUDIO_CONFIG.ui.texts.playing, buttonSelector);
                this.notifySuccess();
            } else {
                throw new Error('Wszystkie metody audio nie powiodły się');
            }

            return success;

        } catch (error) {
            console.error('❌ Błąd odtwarzania audio:', error);
            this.updateAudioButton('error', AUDIO_CONFIG.ui.texts.error, buttonSelector);
            this.notifyError();
            return false;

        } finally {
            // Reset po 3 sekundach
            setTimeout(() => {
                this.isPlaying = false;
                this.resetAudioButton(buttonSelector);
            }, 3000);
        }
    }

    /**
     * Odtwarzanie zdania przykładowego
     */
    async playSentence(englishSentence, polishSentence = null) {
        console.log('📝 Odtwarzam zdanie przykładowe...');
        
        if (!englishSentence) {
            console.warn('⚠️ Brak zdania do odtworzenia');
            return false;
        }

        return await this.playAudio(englishSentence, { 
            rate: 0.8, // Wolniej dla zdań
            lang: 'en' 
        });
    }

    /**
     * Zatrzymanie odtwarzania
     */
    stopAudio() {
        console.log('⏹️ Zatrzymuję audio...');
        
        // Zatrzymaj wszystkie silniki
        Object.values(this.engines).forEach(engine => {
            if (engine && typeof engine.stop === 'function') {
                engine.stop();
            }
        });
        
        this.currentAudio = null;
        this.isPlaying = false;
        this.resetAudioButton();
    }

    /**
     * Testowanie dostępności audio
     */
    async testAudio() {
        console.log('🧪 Testowanie systemów audio...');
        
        const testText = "Hello, this is a test.";
        const results = {
            speechSynthesis: false,
            googleTTS: false,
            responsiveVoice: false
        };

        // Test Speech Synthesis
        if (this.engines.speechSynthesis) {
            try {
                results.speechSynthesis = await this.engines.speechSynthesis.speak(testText);
                console.log(`🎤 Speech Synthesis: ${results.speechSynthesis ? '✅' : '❌'}`);
            } catch (e) {
                console.log('🎤 Speech Synthesis: ❌');
            }
        }

        // Test Google TTS
        if (this.engines.googleTTS) {
            try {
                results.googleTTS = await this.engines.googleTTS.speak(testText);
                console.log(`🌐 Google TTS: ${results.googleTTS ? '✅' : '❌'}`);
            } catch (e) {
                console.log('🌐 Google TTS: ❌');
            }
        }

        // Test ResponsiveVoice
        if (this.engines.responsiveVoice) {
            try {
                results.responsiveVoice = await this.engines.responsiveVoice.speak(testText);
                console.log(`📻 ResponsiveVoice: ${results.responsiveVoice ? '✅' : '❌'}`);
            } catch (e) {
                console.log('📻 ResponsiveVoice: ❌');
            }
        }

        return results;
    }

    /**
     * Aktualizacja przycisku audio
     */
    updateAudioButton(state, text, targetSelector = null) {
        const config = AUDIO_CONFIG.ui;
        
        // Jeśli podano konkretny selektor, aktualizuj tylko ten przycisk
        if (targetSelector) {
            const button = document.querySelector(targetSelector);
            if (button) {
                this.updateSingleButton(button, state, text, config);
            }
            return;
        }

        // Aktualizuj wszystkie przyciski audio
        const selectors = [config.selectors.audioBtn, config.selectors.sentenceAudioBtn];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(btn => {
                this.updateSingleButton(btn, state, text, config);
            });
        });
    }

    /**
     * Aktualizacja pojedynczego przycisku
     */
    updateSingleButton(button, state, text, config) {
        // Usuń poprzednie klasy stanów
        Object.values(config.states).forEach(stateClass => {
            button.classList.remove(stateClass);
        });

        // Dodaj nową klasę stanu
        if (state !== 'reset') {
            button.classList.add(config.states[state] || state);
        }

        button.textContent = text;
        button.disabled = (state === 'loading');
    }

    /**
     * Reset przycisku audio
     */
    resetAudioButton(targetSelector = null) {
        const config = AUDIO_CONFIG.ui;

        if (targetSelector) {
            const button = document.querySelector(targetSelector);
            if (button) {
                this.resetSingleButton(button, config);
            }
            return;
        }

        // Reset wszystkich przycisków
        const selectors = [config.selectors.audioBtn, config.selectors.sentenceAudioBtn];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(btn => {
                this.resetSingleButton(btn, config);
            });
        });
    }

    /**
     * Reset pojedynczego przycisku
     */
    resetSingleButton(button, config) {
        // Usuń klasy stanów
        Object.values(config.states).forEach(stateClass => {
            button.classList.remove(stateClass);
        });

        // Ustaw odpowiedni tekst w zależności od typu przycisku
        if (button.classList.contains('sentence-audio-btn')) {
            button.textContent = config.texts.sentenceAudio;
        } else {
            button.textContent = config.texts.wordAudio;
        }
        
        button.disabled = false;
    }

    /**
     * Powiadomienia
     */
    notifySuccess() {
        if (typeof window !== 'undefined' && window.NotificationManager) {
            window.NotificationManager.show('Audio odtworzone pomyślnie', 'success', 2000);
        }
    }

    notifyError() {
        if (typeof window !== 'undefined' && window.NotificationManager) {
            window.NotificationManager.show('Nie można odtworzyć audio', 'error');
        }
    }

    /**
     * Ustawienia
     */
    setAutoPlay(enabled) {
        this.autoPlay = enabled;
        console.log(`🔄 AutoPlay: ${enabled ? 'włączone' : 'wyłączone'}`);
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 Głośność: ${Math.round(this.volume * 100)}%`);
    }

    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(2, rate));
        console.log(`⚡ Szybkość: ${this.rate}`);
    }

    /**
     * Czyszczenie zasobów
     */
    cleanup() {
        console.log('🧹 Czyszczenie AudioManager...');
        this.stopAudio();
        this.audioCache.clear();
        this.currentAudio = null;
        this.isPlaying = false;
        
        // Cleanup silników
        Object.values(this.engines).forEach(engine => {
            if (engine && typeof engine.cleanup === 'function') {
                engine.cleanup();
            }
        });
    }
}

// Export jako domyślny
export default AudioManager;

// Zachowanie kompatybilności z poprzednią wersją
if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
    console.log('✅ AudioManager (ES6) dostępny globalnie dla kompatybilności');
}