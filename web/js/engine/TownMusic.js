export const TOWN_MUSIC = Object.freeze({
    dawn: 'dawn-loop.wav', day: 'day-loop.wav',
    sunset: 'sunset-loop.wav', night: 'night-loop.wav'
});
const FADE = 6, VOLUME = .55;
const ASSET_ROOT = new URL('../../assets/audio/town-time-v1/', import.meta.url);
const TITLE_URL = new URL('../../assets/audio/title-theme-v1/small-leaf-tomorrow.wav', import.meta.url);
const MUTE_KEY = 'stockwars-town-music-muted-v1';

// Assets are uncompressed PCM16 WAV. Read samples directly: the packaged
// Electron 28 native decodeAudioData path crashes on these long WAV files.
export function decodeTownWav(context, bytes) {
    const view = new DataView(bytes);
    const text = offset => String.fromCharCode(...new Uint8Array(bytes, offset, 4));
    if (bytes.byteLength < 12 || text(0) !== 'RIFF' || text(8) !== 'WAVE') throw new Error('Invalid music WAV');
    let format, data;
    for (let offset = 12; offset + 8 <= bytes.byteLength;) {
        const size = view.getUint32(offset + 4, true), start = offset + 8;
        if (start + size > bytes.byteLength) throw new Error('Truncated music WAV');
        if (text(offset) === 'fmt ' && size >= 16) {
            format = { codec: view.getUint16(start, true), channels: view.getUint16(start + 2, true),
                rate: view.getUint32(start + 4, true), align: view.getUint16(start + 12, true), bits: view.getUint16(start + 14, true) };
        }
        if (text(offset) === 'data') data = { start, size };
        offset = start + size + (size % 2);
    }
    if (!format || !data || format.codec !== 1 || format.bits !== 16 || format.channels !== 2
        || ![32000, 44100].includes(format.rate) || format.align !== 4 || data.size === 0 || data.size % 4) throw new Error('Unsupported music WAV');
    const frames = data.size / format.align;
    const buffer = context.createBuffer(format.channels, frames, format.rate);
    for (let channel = 0; channel < format.channels; channel++) {
        const samples = buffer.getChannelData(channel);
        for (let i = 0; i < frames; i++) samples[i] = view.getInt16(data.start + i * 4 + channel * 2, true) / 32768;
    }
    return buffer;
}

// One audio clock for every town/room. Sky supplies the stage; no second clock.
export class TownMusic {
    constructor() {
        this.voices = new Map();
        this.buffers = new Map();
        this.loads = new Map();
        this.stage = null;
        this.active = false;
        this.retryAt = 0;
        try { this.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { this.muted = false; }
        this.unlock = event => {
            if (event.isTrusted && !(event.type === 'keydown' && event.repeat)) void this.activate();
        };
        window.addEventListener('pointerdown', this.unlock, true);
        window.addEventListener('keydown', this.unlock, true);
        window.addEventListener('click', this.unlock, true);
        document.addEventListener('visibilitychange', () => this.syncVisibility());
        window.addEventListener('pagehide', () => { void this.context?.suspend(); });
        window.addEventListener('pageshow', () => this.syncVisibility());
    }

    async activate() {
        if (!this.context) {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (!Audio) return;
            try {
                this.context = new Audio();
                this.master = this.context.createGain();
                this.master.gain.value = 0;
                this.master.connect(this.context.destination);
            } catch { return; }
        }
        if (!document.hidden) {
            try { await this.context.resume(); } catch { return; }
            this.updateMaster();
            void this.ensureTrack();
        }
    }

    syncVisibility() {
        if (!this.context) return;
        if (document.hidden) void this.context.suspend().catch(() => {});
        else if (this.active) void this.activate();
    }

    updateMaster() {
        if (!this.master) return;
        const p = this.master.gain, now = this.context.currentTime;
        p.cancelScheduledValues(now);
        p.setTargetAtTime(this.active && !this.muted ? VOLUME * (this.indoors ? .7 : 1) : 0, now, .18);
    }

    installControl() {
        if (this.control) return;
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'town-music-toggle';
        button.addEventListener('click', () => {
            this.muted = !this.muted;
            try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch { /* optional preference */ }
            this.refreshControl(); this.updateMaster();
            void this.activate();
        });
        document.body.append(button); this.control = button; this.refreshControl();
    }

    refreshControl() {
        if (!this.control) return;
        this.control.textContent = this.muted ? '♫ 음악 꺼짐' : '♫ 음악 켜짐';
        this.control.setAttribute('aria-label', this.muted ? '배경음악 켜기' : '배경음악 끄기');
        this.control.setAttribute('aria-pressed', String(!this.muted));
    }

    setTitleActive(active, host = document.body) {
        this.titleActive = active;
        this.installControl();
        host.append(this.control);
        if (!active && this.context) {
            const voice = this.voices.get('title'), now = this.context.currentTime;
            if (voice) {
                const t = voice.end <= voice.start ? 1 : Math.min(1, Math.max(0, (now - voice.start) / (voice.end - voice.start)));
                const value = voice.from + (voice.to - voice.from) * t;
                voice.gain.gain.cancelScheduledValues(now);
                voice.gain.gain.setValueAtTime(value, now);
                voice.gain.gain.linearRampToValueAtTime(0, now + .8);
                Object.assign(voice, { from: value, to: 0, start: now, end: now + .8 });
            }
            this.currentStage = null;
        }
        this.update(this.worldStage || 'day', this.worldOptions || { active: false });
        // Browsers may suspend until the first gesture; Electron may allow
        // immediate playback. The existing capture handlers resume either case.
        if (active) void this.activate();
    }

    update(stage, { active = true, indoors = false } = {}) {
        if (!TOWN_MUSIC[stage]) return;
        this.worldStage = stage; this.worldOptions = { active, indoors };
        if (this.titleActive) { stage = 'title'; active = true; indoors = false; }
        const changed = active !== this.active || indoors !== this.indoors;
        this.stage = stage; this.active = active; this.indoors = indoors;
        if (active) this.installControl();
        if (this.control) this.control.hidden = !active;
        if (changed) this.updateMaster();
        if (!active || !this.context || document.hidden) return;
        const now = this.context.currentTime;
        for (const [key, voice] of this.voices) {
            if (voice.to === 0 && now >= voice.end) {
                voice.source.stop(); voice.source.disconnect(); voice.gain.disconnect();
                this.voices.delete(key);
            }
        }
        void this.ensureTrack();
    }

    async load(stage) {
        if (this.buffers.has(stage)) return this.buffers.get(stage);
        if (!this.loads.has(stage)) {
            const promise = (async () => {
                const response = await fetch(stage === 'title' ? TITLE_URL : new URL(TOWN_MUSIC[stage], ASSET_ROOT), { signal: AbortSignal.timeout(30000) });
                if (!response.ok) throw new Error(`Music HTTP ${response.status}`);
                const buffer = decodeTownWav(this.context, await response.arrayBuffer());
                this.buffers.set(stage, buffer);
                return buffer;
            })();
            this.loads.set(stage, promise);
        }
        try { return await this.loads.get(stage); }
        finally { this.loads.delete(stage); }
    }

    async ensureTrack() {
        const stage = this.stage;
        if (!this.active || !stage || !this.context || this.context.state !== 'running'
            || this.currentStage === stage || this.pending || performance.now() < this.retryAt) return;
        this.pending = stage;
        try {
            const buffer = await this.load(stage);
            // A late download must never override the newest scene or track.
            if (this.stage !== stage || !this.active || document.hidden) return;
            const now = this.context.currentTime;
            let target = this.voices.get(stage);
            if (!target) {
                const source = this.context.createBufferSource(), gain = this.context.createGain();
                source.buffer = buffer; source.loop = true;
                source.loopStart = 0; source.loopEnd = buffer.duration;
                gain.gain.value = 0; source.connect(gain); gain.connect(this.master);
                target = { source, gain, from: 0, to: 0, start: now, end: now };
                this.voices.set(stage, target); source.start(now);
            }
            for (const [key, voice] of this.voices) {
                const progress = voice.end <= voice.start ? 1 : Math.min(1, Math.max(0, (now - voice.start) / (voice.end - voice.start)));
                const value = voice.from + (voice.to - voice.from) * progress;
                voice.from = value; voice.to = key === stage ? 1 : 0;
                voice.start = now; voice.end = now + FADE;
                const param = voice.gain.gain;
                param.cancelScheduledValues(now); param.setValueAtTime(value, now);
                param.linearRampToValueAtTime(voice.to, voice.end);
            }
            this.currentStage = stage;
        } catch (error) {
            this.retryAt = performance.now() + 15000;
            console.warn('마을 음악을 불러오지 못했습니다. 기존 곡을 유지하고 재시도합니다.', error.message);
        } finally { this.pending = null; }
    }
}

let music;
export function getTownMusic() { return music ||= new TownMusic(); }
