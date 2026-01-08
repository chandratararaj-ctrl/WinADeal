// Sound Notification Service for Order Alerts

class SoundNotificationService {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;
    private volume: number = 0.7;

    constructor() {
        // Initialize audio context on user interaction
        if (typeof window !== 'undefined') {
            this.enabled = localStorage.getItem('orderSoundsEnabled') !== 'false';
            const savedVolume = localStorage.getItem('orderSoundsVolume');
            if (savedVolume) {
                this.volume = parseFloat(savedVolume);
            }
        }
    }

    private initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    // Play a pleasant notification sound using Web Audio API
    private playBeep(frequency: number, duration: number, delay: number = 0) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope for smooth sound
        const now = this.audioContext.currentTime + delay;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Play new order notification (pleasant chime)
    playNewOrderSound() {
        this.initAudioContext();
        if (!this.audioContext) return;

        // Play a pleasant three-tone chime
        this.playBeep(523.25, 0.15, 0);    // C5
        this.playBeep(659.25, 0.15, 0.15); // E5
        this.playBeep(783.99, 0.3, 0.3);   // G5
    }

    // Play order accepted sound
    playOrderAcceptedSound() {
        this.initAudioContext();
        if (!this.audioContext) return;

        // Play a quick success sound
        this.playBeep(659.25, 0.1, 0);    // E5
        this.playBeep(783.99, 0.2, 0.1);  // G5
    }

    // Play order completed sound
    playOrderCompletedSound() {
        this.initAudioContext();
        if (!this.audioContext) return;

        // Play a celebratory sound
        this.playBeep(523.25, 0.1, 0);    // C5
        this.playBeep(659.25, 0.1, 0.1);  // E5
        this.playBeep(783.99, 0.1, 0.2);  // G5
        this.playBeep(1046.5, 0.3, 0.3);  // C6
    }

    // Play error/cancelled sound
    playErrorSound() {
        this.initAudioContext();
        if (!this.audioContext) return;

        // Play a descending tone
        this.playBeep(392.00, 0.15, 0);   // G4
        this.playBeep(329.63, 0.3, 0.15); // E4
    }

    // Enable/disable sounds
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        localStorage.setItem('orderSoundsEnabled', enabled.toString());
    }

    // Set volume (0 to 1)
    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('orderSoundsVolume', this.volume.toString());
    }

    // Get current settings
    getSettings() {
        return {
            enabled: this.enabled,
            volume: this.volume,
        };
    }

    // Test sound
    testSound() {
        this.playNewOrderSound();
    }
}

// Create singleton instance
const soundNotificationService = new SoundNotificationService();

export default soundNotificationService;
