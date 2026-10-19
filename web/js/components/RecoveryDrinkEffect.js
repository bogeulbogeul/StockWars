import { settingsStore } from '../engine/SettingsStore.js';

export async function playRecoveryDrinkEffect() {
    const effect = document.createElement('dialog');
    effect.className = 'recovery-drink-effect';
    effect.setAttribute('role', 'status');
    effect.setAttribute('aria-label', '에너지 드링크 캔을 열고 마십니다');
    const sources = Array.from({ length: 10 }, (_, index) => new URL(`../../assets/effects/energy-drink-opening-v2/frame-${index}.png`, import.meta.url).href);
    const frames = sources.map(source => { const img = new Image(); img.src = source; return img; });
    const image = frames[0];
    image.alt = '에너지 드링크 캔 개봉';
    image.style.cssText = 'width:min(280px,65vw);height:auto;object-fit:contain;filter:drop-shadow(0 8px 22px #0008)';
    effect.style.cssText = 'position:fixed;inset:0;margin:0;padding:0;border:0;box-sizing:border-box;width:calc(100 * var(--game-vw, 1vw));height:calc(100 * var(--game-vh, 1vh));max-width:none;max-height:none;z-index:2000000;display:grid;place-content:center;justify-items:center;background:#101621;pointer-events:auto';
    effect.addEventListener('cancel', event => event.preventDefault());
    effect.append(image);
    await Promise.all(frames.map(frame => frame.decode().catch(() => {})));
    document.body.append(effect);
    effect.showModal();
    const timers = sources.slice(1).map((source, index) => setTimeout(() => { image.src = source; }, (index + 1) * 1000 / 12));
    const audio = new Audio(new URL('../../assets/effects/energy-drink-opening-v1/can-open-fizz.wav', import.meta.url).href);
    audio.volume = settingsStore.value.effectsVolume / 100;
    try { if (audio.volume > 0) await audio.play(); } catch {}
    await new Promise(resolve => setTimeout(resolve, 2200));
    timers.forEach(clearTimeout);
    effect.remove();
    audio.pause();
}
