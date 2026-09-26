/**
 * LogisticsAudio Module
 * WebAudio Synthesizer for logistics mini-game sound effects.
 */

export class LogisticsAudio {
    constructor() {
        this.audioCtx = null;
    }

    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    }

    playTone(freq, duration = 0.1, type = 'sine', vol = 0.2) {
        try {
            if (!this.audioCtx) this.init();
            if (!this.audioCtx || this.audioCtx.state === 'suspended') {
                this.audioCtx?.resume();
            }
            if (!this.audioCtx) return;

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            // Audio ignore on browser restriction
        }
    }

    playPickup(count = 1) {
        this.playTone(380 + count * 60, 0.12, 'sine', 0.25);
    }

    playLoad(count = 1) {
        this.playTone(520 + count * 40, 0.18, 'triangle', 0.3);
    }

    playTurnShock() {
        this.playTone(180, 0.08, 'sawtooth', 0.2);
    }

    playCrash() {
        this.playTone(110, 0.4, 'sawtooth', 0.45);
    }

    playWin() {
        this.playTone(600, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(800, 0.25, 'sine', 0.3), 150);
    }
}