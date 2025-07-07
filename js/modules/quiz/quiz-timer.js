/**
 * QuizTimer - Zarządzanie timerem dla Speed Quiz
 */
class QuizTimer {
    constructor() {
        this.timer = null;
        this.timeLeft = 0;
        this.startTime = null;
        this.isActive = false;
        this.timeLimit = 10; // domyślny limit
        this.onTimeExpired = null;
    }

    /**
     * Pokazanie timera w UI
     */
    show() {
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) {
            timerEl.style.display = 'block';
            console.log('⏰ Timer został pokazany');
        }
    }

    /**
     * Ukrycie timera
     */
    hide() {
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) {
            timerEl.style.display = 'none';
            console.log('⏰ Timer został ukryty');
        }
    }

    /**
     * Rozpoczęcie odliczania
     */
    start(timeLimit, onExpiredCallback) {
        console.log('⏰ Rozpoczynam timer pytania...');
        
        // Zatrzymaj poprzedni timer jeśli istnieje
        this.stop();
        
        // Ustaw parametry
        this.timeLimit = timeLimit || 10;
        this.timeLeft = this.timeLimit;
        this.startTime = Date.now();
        this.isActive = true;
        this.onTimeExpired = onExpiredCallback;
        
        // Zaktualizuj wyświetlanie
        this.updateDisplay();
        
        // Rozpocznij odliczanie (co 100ms dla płynności)
        this.timer = setInterval(() => {
            this.update();
        }, 100);
        
        console.log(`⏰ Timer uruchomiony na ${this.timeLeft} sekund`);
    }

    /**
     * Zatrzymanie timera
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            this.isActive = false;
            console.log('⏰ Timer zatrzymany');
        }
    }

    /**
     * Aktualizacja timera
     */
    update() {
        if (!this.isActive) return;
        
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.timeLeft = Math.max(0, this.timeLimit - elapsed);
        
        // Aktualizuj wyświetlanie
        this.updateDisplay();
        
        // Sprawdź czy czas się skończył
        if (this.timeLeft <= 0) {
            console.log('⏰ Czas się skończył!');
            this.onExpired();
        }
    }

    /**
     * Aktualizacja wyświetlania timera
     */
    updateDisplay() {
        const timerValueEl = document.getElementById('timer-value');
        const timerFillEl = document.getElementById('timer-fill');
        
        if (timerValueEl) {
            timerValueEl.textContent = Math.ceil(this.timeLeft);
        }
        
        if (timerFillEl) {
            const percentage = (this.timeLeft / this.timeLimit) * 100;
            timerFillEl.style.width = `${percentage}%`;
            
            // Zmień kolor w zależności od pozostałego czasu
            if (percentage > 50) {
                timerFillEl.style.background = '#22c55e'; // Zielony
            } else if (percentage > 25) {
                timerFillEl.style.background = '#f59e0b'; // Pomarańczowy
            } else {
                timerFillEl.style.background = '#ef4444'; // Czerwony
            }
        }
    }

    /**
     * Obsługa wygaśnięcia timera
     */
    onExpired() {
        // Zatrzymaj timer
        this.stop();
        
        // Wywołaj callback jeśli istnieje
        if (this.onTimeExpired && typeof this.onTimeExpired === 'function') {
            this.onTimeExpired();
        }
    }

    /**
     * Sprawdzenie czy timer jest aktywny
     */
    get active() {
        return this.isActive;
    }

    /**
     * Pobranie pozostałego czasu
     */
    get remainingTime() {
        return this.timeLeft;
    }

    /**
     * Cleanup timera
     */
    cleanup() {
        this.stop();
        this.timeLeft = 0;
        this.startTime = null;
        this.onTimeExpired = null;
    }
}

// Export dla ES6 modules
export { QuizTimer };

// Export default dla wygody
export default QuizTimer;

console.log('✅ QuizTimer załadowany');