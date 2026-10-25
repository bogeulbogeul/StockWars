import { settingsStore } from '../../engine/SettingsStore.js';

// Sound follows the cutscene clock, including its pause and skip lifecycle.
export function createBusArrivalAudio() {
    const engine = new Audio(new URL('../../../assets/cinematics/bus/audio/engine-loop.wav', import.meta.url).href);
    const brake = new Audio(new URL('../../../assets/cinematics/bus/audio/air-brake.wav', import.meta.url).href);
    engine.loop = true;
    engine.preservesPitch = false;
    engine.preload = brake.preload = 'auto';
    let disposed = false, stopped = false, departed = false, gain = 0;
    let playing = false, blocked = false, brakePending = false;
    const volume = () => settingsStore.value.effectsVolume / 100;
    const sync = () => {
        if (disposed) return;
        engine.volume = Math.min(1, gain * volume());
        brake.volume = .48 * volume();
        if (document.hidden || departed || !volume()) {
            engine.pause(); brake.pause(); playing = false;
            return;
        }
        if (!playing && !blocked) {
            playing = true;
            engine.play()?.catch(() => { playing = false; blocked = true; });
        }
        if (brakePending) {
            brakePending = false;
            brake.play()?.catch(() => {});
        }
    };
    document.addEventListener('visibilitychange', sync);
    globalThis.addEventListener('stockwars-settings-changed', sync);
    return {
        update({ progress, departure, departed: hasDeparted }) {
            if (disposed) return;
            departed = hasDeparted;
            if (progress === 1 && !stopped) {
                stopped = true;
                brakePending = !document.hidden && volume() > 0;
            }
            gain = departure > 0 ? .55 * Math.exp(-departure * .24) : progress < 1 ? .12 + .38 * progress : .18;
            engine.playbackRate = departure > 0 ? Math.min(1.35, .75 + departure * .15) : 1.1 - progress * .35;
            sync();
        },
        dispose() {
            disposed = true;
            document.removeEventListener('visibilitychange', sync);
            globalThis.removeEventListener('stockwars-settings-changed', sync);
            for (const audio of [engine, brake]) {
                audio.pause();
                audio.removeAttribute('src');
                audio.load();
            }
        }
    };
}
