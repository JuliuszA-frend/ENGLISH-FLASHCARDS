/**
 * AudioManager - Zarządzanie audio (NAPRAWIONA WERSJA)
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
        console.log('🔊 AudioManager zainicjalizowany');
    }

    /**
     * Inicjalizacja Speech Synthesis API
     */
    initializeSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            
            // Załaduj głosy po załadowaniu
            this.loadVoices();
            
            // Voices mogą być ładowane asynchronicznie
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => {
                    this.loadVoices();
                };
            }
            
            console.log('✅ Speech Synthesis API dostępne');
        } else {
            console.warn('⚠️ Speech Synthesis API nie jest dostępne');
        }
    }

    /**
     * Ładowanie dostępnych głosów
     */
    loadVoices() {
        if (!this.speechSynthesis) return;
        
        const voices = this.speechSynthesis.getVoices();
        console.log(`📢 Dostępne głosy: ${voices.length}`);
        
        // Znajdź angielski głos (preferuj US, potem UK, potem inne)
        const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
        
        if (englishVoices.length > 0) {
            // Preferuj kolejność: en-US > en-GB > inne
            const priorities = ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en'];
            
            for (const lang of priorities) {
                const voice = englishVoices.find(v => v.lang.startsWith(lang));
                if (voice) {
                    this.voiceSettings.voice = voice;
                    console.log(`🎤 Wybrany głos: ${voice.name} (${voice.lang})`);
                    break;
                }
            }
            
            if (!this.voiceSettings.voice) {
                this.voiceSettings.voice = englishVoices[0];
                console.log(`🎤 Domyślny głos: ${englishVoices[0].name}`);
            }
        } else {
            console.warn('⚠️ Brak dostępnych głosów angielskich');
        }
    }

    /**
     * Główna metoda odtwarzania audio
     */
    async playAudio(text, options = {}, buttonSelector = null) {
        if (!text || this.isPlaying) {
            console.log('Audio już odtwarzane lub brak tekstu');
            return false;
        }

        console.log(`🔊 Próba odtworzenia: "${text}"`);
        
        try {
            this.isPlaying = true;
            this.updateAudioButton('loading', '⏳ Ładowanie...', buttonSelector);

            let success = false;

            // 1. Najpierw próbuj Speech Synthesis (najszybsze)
            if (this.speechSynthesis && this.voiceSettings.voice) {
                console.log('🎤 Próbuję Speech Synthesis...');
                success = await this.playTTS(text, options);
            }

            // 2. Jeśli TTS nie działa, próbuj Google TTS
            if (!success) {
                console.log('🌐 Próbuję Google TTS...');
                success = await this.playGoogleTTS(text, options);
            }

            // 3. Ostatnia szansa - ResponsiveVoice CDN
            if (!success) {
                console.log('📻 Próbuję ResponsiveVoice...');
                success = await this.playResponsiveVoice(text, options);
            }

            if (success) {
                this.updateAudioButton('success', '🔊 Odtwarzam...', buttonSelector);
                
                // Powiadomienie o sukcesie
                if (window.NotificationManager) {
                    window.NotificationManager.show('Audio odtworzone pomyślnie', 'success', 2000);
                }
            } else {
                throw new Error('Wszystkie metody audio nie powiodły się');
            }

            return success;

        } catch (error) {
            console.error('❌ Błąd odtwarzania audio:', error);
            this.updateAudioButton('error', '❌ Błąd audio', buttonSelector);
            
            if (window.NotificationManager) {
                window.NotificationManager.show('Nie można odtworzyć audio', 'error');
            }
            
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
     * Speech Synthesis (wbudowane w przeglądarkę)
     */
    async playTTS(text, options = {}) {
        if (!this.speechSynthesis || !this.voiceSettings.voice) {
            return false;
        }

        return new Promise((resolve) => {
            try {
                // Zatrzymaj poprzednie odtwarzanie
                this.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);
                
                // Konfiguracja głosu
                utterance.voice = this.voiceSettings.voice;
                utterance.rate = options.rate || 0.9; // Trochę wolniej dla lepszego zrozumienia
                utterance.pitch = options.pitch || 1.0;
                utterance.volume = options.volume || this.volume;
                utterance.lang = options.lang || 'en-US';

                // Event handlers
                utterance.onstart = () => {
                    console.log('🎤 TTS rozpoczęte');
                };

                utterance.onend = () => {
                    console.log('✅ TTS zakończone');
                    resolve(true);
                };

                utterance.onerror = (event) => {
                    console.error('❌ TTS błąd:', event.error);
                    resolve(false);
                };

                // Rozpocznij odtwarzanie
                this.speechSynthesis.speak(utterance);
                this.currentAudio = utterance;

                // Timeout zabezpieczający (10 sekund)
                setTimeout(() => {
                    if (utterance && !utterance.ended) {
                        this.speechSynthesis.cancel();
                        resolve(false);
                    }
                }, 10000);

            } catch (error) {
                console.error('❌ TTS exception:', error);
                resolve(false);
            }
        });
    }

    /**
     * Google Translate TTS (nowy sposób)
     */
    async playGoogleTTS(text, options = {}) {
        try {
            // Nowy, działający URL Google TTS
            const lang = options.lang || 'en';
            const encodedText = encodeURIComponent(text);
            
            // Różne URL-e do wypróbowania
            const urls = [
                `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=gtx`,
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=gtx&tk=421659.421659`,
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`
            ];

            for (const url of urls) {
                try {
                    console.log(`🌐 Próbuję URL: ${url}`);
                    const success = await this.playAudioFromUrl(url);
                    if (success) {
                        console.log('✅ Google TTS sukces');
                        return true;
                    }
                } catch (error) {
                    console.warn(`⚠️ URL nie powiódł się: ${error.message}`);
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
     * ResponsiveVoice jako fallback
     */
    async playResponsiveVoice(text, options = {}) {
        return new Promise((resolve) => {
            try {
                // Sprawdź czy ResponsiveVoice jest dostępne
                if (typeof responsiveVoice === 'undefined') {
                    // Załaduj ResponsiveVoice dynamicznie
                    this.loadResponsiveVoice().then(() => {
                        this.playResponsiveVoiceActual(text, options, resolve);
                    }).catch(() => {
                        resolve(false);
                    });
                } else {
                    this.playResponsiveVoiceActual(text, options, resolve);
                }
            } catch (error) {
                console.error('❌ ResponsiveVoice błąd:', error);
                resolve(false);
            }
        });
    }

    /**
     * Ładowanie ResponsiveVoice CDN
     */
    loadResponsiveVoice() {
        return new Promise((resolve, reject) => {
            if (typeof responsiveVoice !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=FREE';
            script.onload = () => {
                console.log('📻 ResponsiveVoice załadowane');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Nie można załadować ResponsiveVoice');
                reject();
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Właściwe odtwarzanie ResponsiveVoice
     */
    playResponsiveVoiceActual(text, options, resolve) {
        try {
            responsiveVoice.speak(text, "UK English Female", {
                rate: options.rate || 0.9,
                pitch: options.pitch || 1,
                volume: options.volume || this.volume,
                onstart: () => {
                    console.log('📻 ResponsiveVoice rozpoczęte');
                },
                onend: () => {
                    console.log('✅ ResponsiveVoice zakończone');
                    resolve(true);
                },
                onerror: () => {
                    console.error('❌ ResponsiveVoice błąd');
                    resolve(false);
                }
            });
        } catch (error) {
            console.error('❌ ResponsiveVoice exception:', error);
            resolve(false);
        }
    }

    /**
     * Odtwarzanie audio z URL
     */
    async playAudioFromUrl(url) {
        return new Promise((resolve) => {
            try {
                const audio = new Audio();
                
                // Event handlers
                audio.oncanplaythrough = () => {
                    audio.play().then(() => {
                        console.log('✅ Audio z URL odtworzone');
                        resolve(true);
                    }).catch(() => {
                        resolve(false);
                    });
                };

                audio.onerror = () => {
                    console.error('❌ Błąd ładowania audio z URL');
                    resolve(false);
                };

                audio.onended = () => {
                    console.log('✅ Audio zakończone');
                };

                // Ustaw źródło
                audio.volume = this.volume;
                audio.src = url;
                this.currentAudio = audio;

                // Timeout
                setTimeout(() => {
                    if (audio.readyState < 3) { // HAVE_FUTURE_DATA
                        resolve(false);
                    }
                }, 5000);

            } catch (error) {
                console.error('❌ Błąd odtwarzania z URL:', error);
                resolve(false);
            }
        });
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

        // Odtwarzaj tylko angielskie zdanie
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
        
        if (this.currentAudio) {
            if (this.speechSynthesis && this.currentAudio instanceof SpeechSynthesisUtterance) {
                this.speechSynthesis.cancel();
            } else if (this.currentAudio instanceof Audio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            } else if (typeof responsiveVoice !== 'undefined') {
                responsiveVoice.cancel();
            }
            this.currentAudio = null;
        }
        
        this.isPlaying = false;
        this.resetAudioButton();
    }

    /**
     * Aktualizacja przycisku audio
     */
    updateAudioButton(state, text, targetSelector = null) {
        // Jeśli podano konkretny selektor, aktualizuj tylko ten przycisk
        if (targetSelector) {
            const button = document.querySelector(targetSelector);
            if (button) {
                button.className = button.className.replace(/\b(loading|success|error)\b/g, '').trim();
                if (state !== 'reset') {
                    button.className += ` ${state}`;
                }
                button.textContent = text;
                button.disabled = (state === 'loading');
            }
            return;
        }

        // Stara logika - aktualizuj wszystkie (fallback)
        const audioButtons = document.querySelectorAll('.audio-btn, .sentence-audio-btn');
        audioButtons.forEach(btn => {
            btn.className = btn.className.replace(/\b(loading|success|error)\b/g, '').trim();
            if (state !== 'reset') {
                btn.className += ` ${state}`;
            }
            btn.textContent = text;
            btn.disabled = (state === 'loading');
        });
    }

    /**
     * Reset przycisku audio
     */
    resetAudioButton(targetSelector = null) {
        if (targetSelector) {
            const button = document.querySelector(targetSelector);
            if (button) {
                button.className = button.className.replace(/\b(loading|success|error)\b/g, '').trim();
                
                // Ustaw odpowiedni tekst w zależności od typu przycisku
                if (button.classList.contains('sentence-audio-btn')) {
                    button.textContent = '🎵 Posłuchaj zdania';
                } else {
                    button.textContent = '🔊 Posłuchaj słowa';
                }
                button.disabled = false;
            }
            return;
        }

        // Stara logika - resetuj wszystkie
        const audioButtons = document.querySelectorAll('.audio-btn, .sentence-audio-btn');
        audioButtons.forEach(btn => {
            btn.className = btn.className.replace(/\b(loading|success|error)\b/g, '').trim();
            if (btn.classList.contains('sentence-audio-btn')) {
                btn.textContent = '🎵 Posłuchaj zdania';
            } else {
                btn.textContent = '🔊 Posłuchaj słowa';
            }
            btn.disabled = false;
        });
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
        try {
            results.speechSynthesis = await this.playTTS(testText);
            console.log(`🎤 Speech Synthesis: ${results.speechSynthesis ? '✅' : '❌'}`);
        } catch (e) {
            console.log('🎤 Speech Synthesis: ❌');
        }

        // Test Google TTS
        try {
            results.googleTTS = await this.playGoogleTTS(testText);
            console.log(`🌐 Google TTS: ${results.googleTTS ? '✅' : '❌'}`);
        } catch (e) {
            console.log('🌐 Google TTS: ❌');
        }

        // Test ResponsiveVoice
        try {
            results.responsiveVoice = await this.playResponsiveVoice(testText);
            console.log(`📻 ResponsiveVoice: ${results.responsiveVoice ? '✅' : '❌'}`);
        } catch (e) {
            console.log('📻 ResponsiveVoice: ❌');
        }

        return results;
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
        this.voiceSettings.rate = Math.max(0.1, Math.min(2, rate));
        console.log(`⚡ Szybkość: ${this.voiceSettings.rate}`);
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
    }
}

// Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}

// Globalne udostępnienie
if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
    console.log('✅ AudioManager dostępny globalnie');
}