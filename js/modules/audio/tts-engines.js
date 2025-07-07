/**
 * TTS Engines
 * Silniki Text-to-Speech dla AudioManager
 */

import { AUDIO_CONFIG } from './audio-config.js';

/**
 * Speech Synthesis API Engine
 */
export class SpeechSynthesisEngine {
    constructor() {
        this.speechSynthesis = null;
        this.voices = [];
        this.selectedVoice = null;
        this.isInitialized = false;
    }

    /**
     * Inicjalizacja Speech Synthesis
     */
    async initialize() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            await this.loadVoices();
            this.isInitialized = true;
            console.log('✅ SpeechSynthesis zainicjalizowany');
            return true;
        } else {
            console.warn('⚠️ SpeechSynthesis nie jest dostępny');
            return false;
        }
    }

    /**
     * Ładowanie głosów
     */
    async loadVoices() {
        return new Promise((resolve) => {
            const loadVoicesNow = () => {
                this.voices = this.speechSynthesis.getVoices();
                console.log(`📢 Dostępne głosy: ${this.voices.length}`);
                
                if (this.voices.length > 0) {
                    this.selectBestVoice();
                    resolve();
                } else {
                    // Spróbuj ponownie za chwilę
                    setTimeout(loadVoicesNow, 100);
                }
            };

            // Głosy mogą być ładowane asynchronicznie
            if (this.speechSynthesis.onvoiceschanged !== undefined) {
                this.speechSynthesis.onvoiceschanged = loadVoicesNow;
            }
            
            loadVoicesNow();
        });
    }

    /**
     * Wybór najlepszego głosu
     */
    selectBestVoice() {
        const englishVoices = this.voices.filter(voice => voice.lang.startsWith('en'));
        
        if (englishVoices.length > 0) {
            const priorities = AUDIO_CONFIG.voice.priorities;
            
            for (const lang of priorities) {
                const voice = englishVoices.find(v => v.lang.startsWith(lang));
                if (voice) {
                    this.selectedVoice = voice;
                    console.log(`🎤 Wybrany głos: ${voice.name} (${voice.lang})`);
                    return;
                }
            }
            
            // Fallback do pierwszego dostępnego
            this.selectedVoice = englishVoices[0];
            console.log(`🎤 Fallback głos: ${englishVoices[0].name}`);
        } else {
            console.warn('⚠️ Brak dostępnych głosów angielskich');
        }
    }

    /**
     * Odtwarzanie tekstu
     */
    async speak(text, options = {}) {
        if (!this.isInitialized || !this.selectedVoice) {
            return false;
        }

        return new Promise((resolve) => {
            try {
                // Zatrzymaj poprzednie odtwarzanie
                this.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);
                
                // Konfiguracja głosu
                utterance.voice = this.selectedVoice;
                utterance.rate = options.rate || AUDIO_CONFIG.defaults.rate;
                utterance.pitch = options.pitch || AUDIO_CONFIG.defaults.pitch;
                utterance.volume = options.volume || AUDIO_CONFIG.defaults.volume;
                utterance.lang = options.lang || AUDIO_CONFIG.voice.fallbackLang;

                // Event handlers
                utterance.onstart = () => {
                    console.log('🎤 SpeechSynthesis rozpoczęty');
                };

                utterance.onend = () => {
                    console.log('✅ SpeechSynthesis zakończony');
                    resolve(true);
                };

                utterance.onerror = (event) => {
                    console.error('❌ SpeechSynthesis błąd:', event.error);
                    resolve(false);
                };

                // Rozpocznij odtwarzanie
                this.speechSynthesis.speak(utterance);

                // Timeout zabezpieczający
                setTimeout(() => {
                    if (!utterance.ended) {
                        this.speechSynthesis.cancel();
                        resolve(false);
                    }
                }, AUDIO_CONFIG.timeouts.speechSynthesis);

            } catch (error) {
                console.error('❌ SpeechSynthesis exception:', error);
                resolve(false);
            }
        });
    }

    /**
     * Zatrzymanie odtwarzania
     */
    stop() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
    }
}

/**
 * Google TTS Engine
 */
export class GoogleTTSEngine {
    constructor() {
        this.isAvailable = true;
    }

    /**
     * Odtwarzanie tekstu przez Google TTS
     */
    async speak(text, options = {}) {
        try {
            const lang = options.lang || 'en';
            const encodedText = encodeURIComponent(text);
            
            // Próbuj różne URL-e
            for (const urlTemplate of AUDIO_CONFIG.googleTTS.urls) {
                try {
                    const url = urlTemplate
                        .replace('{text}', encodedText)
                        .replace('{lang}', lang);
                    
                    console.log(`🌐 Próbuję Google TTS: ${url}`);
                    const success = await this.playAudioFromUrl(url, options.volume);
                    
                    if (success) {
                        console.log('✅ Google TTS sukces');
                        return true;
                    }
                } catch (error) {
                    console.warn(`⚠️ Google TTS URL nie powiódł się: ${error.message}`);
                    continue;
                }
            }

            return false;

        } catch (error) {
            console.error('❌ Google TTS błąd:', error);
            return false;
        }
    }

    /**
     * Odtwarzanie audio z URL
     */
    async playAudioFromUrl(url, volume = 1.0) {
        return new Promise((resolve) => {
            try {
                const audio = new Audio();
                
                audio.oncanplaythrough = () => {
                    audio.play().then(() => {
                        console.log('✅ Google TTS audio odtworzone');
                        resolve(true);
                    }).catch(() => {
                        resolve(false);
                    });
                };

                audio.onerror = () => {
                    console.error('❌ Błąd ładowania Google TTS audio');
                    resolve(false);
                };

                audio.volume = volume;
                audio.src = url;

                // Timeout
                setTimeout(() => {
                    if (audio.readyState < 3) {
                        resolve(false);
                    }
                }, AUDIO_CONFIG.timeouts.audioLoad);

            } catch (error) {
                console.error('❌ Błąd odtwarzania Google TTS:', error);
                resolve(false);
            }
        });
    }

    stop() {
        // Google TTS nie ma bezpośredniego sposobu na zatrzymanie
        // Audio elementy zatrzymują się same po zakończeniu
    }
}

/**
 * ResponsiveVoice Engine
 */
export class ResponsiveVoiceEngine {
    constructor() {
        this.isLoaded = false;
        this.isLoading = false;
    }

    /**
     * Ładowanie ResponsiveVoice
     */
    async loadScript() {
        if (typeof responsiveVoice !== 'undefined') {
            this.isLoaded = true;
            return true;
        }

        if (this.isLoading) {
            // Czekaj na zakończenie ładowania
            while (this.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.isLoaded;
        }

        this.isLoading = true;

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = AUDIO_CONFIG.responsiveVoice.scriptUrl;
            
            script.onload = () => {
                console.log('📻 ResponsiveVoice załadowany');
                this.isLoaded = true;
                this.isLoading = false;
                resolve(true);
            };
            
            script.onerror = () => {
                console.error('❌ Nie można załadować ResponsiveVoice');
                this.isLoading = false;
                resolve(false);
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Odtwarzanie tekstu przez ResponsiveVoice
     */
    async speak(text, options = {}) {
        if (!this.isLoaded) {
            const loaded = await this.loadScript();
            if (!loaded) return false;
        }

        return new Promise((resolve) => {
            try {
                responsiveVoice.speak(text, AUDIO_CONFIG.responsiveVoice.voiceName, {
                    rate: options.rate || AUDIO_CONFIG.defaults.rate,
                    pitch: options.pitch || AUDIO_CONFIG.defaults.pitch,
                    volume: options.volume || AUDIO_CONFIG.defaults.volume,
                    onstart: () => {
                        console.log('📻 ResponsiveVoice rozpoczęty');
                    },
                    onend: () => {
                        console.log('✅ ResponsiveVoice zakończony');
                        resolve(true);
                    },
                    onerror: () => {
                        console.error('❌ ResponsiveVoice błąd');
                        resolve(false);
                    }
                });

                // Timeout zabezpieczający
                setTimeout(() => {
                    resolve(false);
                }, AUDIO_CONFIG.timeouts.responsiveVoice);

            } catch (error) {
                console.error('❌ ResponsiveVoice exception:', error);
                resolve(false);
            }
        });
    }

    /**
     * Zatrzymanie ResponsiveVoice
     */
    stop() {
        if (typeof responsiveVoice !== 'undefined') {
            responsiveVoice.cancel();
        }
    }
}

/**
 * Factory do tworzenia silników TTS
 */
export class TTSEngineFactory {
    static createEngine(type) {
        switch (type) {
            case 'speechSynthesis':
                return new SpeechSynthesisEngine();
            case 'googleTTS':
                return new GoogleTTSEngine();
            case 'responsiveVoice':
                return new ResponsiveVoiceEngine();
            default:
                throw new Error(`Nieznany typ silnika TTS: ${type}`);
        }
    }

    static async createAndInitialize(type) {
        const engine = this.createEngine(type);
        
        if (typeof engine.initialize === 'function') {
            await engine.initialize();
        }
        
        return engine;
    }
}