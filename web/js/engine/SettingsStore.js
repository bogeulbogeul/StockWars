export const DEFAULT_SETTINGS = Object.freeze({ effectsVolume: 70, reducedMotion: false, showWeather: true });
const KEY = 'stockwars.settings.v1';
export function normalizeSettings(value = {}) {
    return {
        effectsVolume: typeof value?.effectsVolume === 'number' && Number.isFinite(value.effectsVolume) ? Math.round(Math.min(100, Math.max(0, value.effectsVolume))) : DEFAULT_SETTINGS.effectsVolume,
        reducedMotion: typeof value?.reducedMotion === 'boolean' ? value.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
        showWeather: typeof value?.showWeather === 'boolean' ? value.showWeather : DEFAULT_SETTINGS.showWeather
    };
}
export class SettingsStore {
    constructor() {
        this.value = { ...DEFAULT_SETTINGS };
        try { this.value = normalizeSettings(JSON.parse(globalThis.localStorage?.getItem(KEY) || '{}')); } catch { /* Keep defaults if storage is unavailable. */ }
    }
    apply() {
        document.body.classList.toggle('settings-reduced-motion', this.value.reducedMotion);
        document.body.classList.toggle('settings-hide-weather', !this.value.showWeather);
    }
    update(patch) {
        this.value = normalizeSettings({ ...this.value, ...patch });
        this.apply();
        try { globalThis.localStorage?.setItem(KEY, JSON.stringify(this.value)); return !!globalThis.localStorage; } catch { return false; }
    }
}
export const settingsStore = new SettingsStore();
