/**
 * Audio Configuration
 * Konfiguracja dla AudioManager
 */

export const AUDIO_CONFIG = {
    // Domyślne ustawienia
    defaults: {
        volume: 1.0,
        rate: 1.0,
        pitch: 1.0,
        autoPlay: false
    },

    // Ustawienia głosów
    voice: {
        priorities: ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en'],
        fallbackLang: 'en-US'
    },

    // Timeouty
    timeouts: {
        speechSynthesis: 10000,
        audioLoad: 5000,
        responsiveVoice: 8000
    },

    // URL-e Google TTS
    googleTTS: {
        urls: [
            'https://translate.googleapis.com/translate_tts?ie=UTF-8&q={text}&tl={lang}&client=gtx',
            'https://translate.google.com/translate_tts?ie=UTF-8&q={text}&tl={lang}&client=gtx&tk=421659.421659',
            'https://translate.google.com/translate_tts?ie=UTF-8&q={text}&tl={lang}&client=tw-ob'
        ]
    },

    // ResponsiveVoice
    responsiveVoice: {
        scriptUrl: 'https://code.responsivevoice.org/responsivevoice.js?key=FREE',
        voiceName: 'UK English Female'
    },

    // UI selektory i teksty
    ui: {
        selectors: {
            audioBtn: '.audio-btn',
            sentenceAudioBtn: '.sentence-audio-btn'
        },
        texts: {
            loading: '⏳ Ładowanie...',
            playing: '🔊 Odtwarzam...',
            error: '❌ Błąd audio',
            wordAudio: '🔊 Posłuchaj słowa',
            sentenceAudio: '🎵 Posłuchaj zdania'
        },
        states: {
            loading: 'loading',
            success: 'success',
            error: 'error'
        }
    }
};

export default AUDIO_CONFIG;