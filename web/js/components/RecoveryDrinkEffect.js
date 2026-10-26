import { waitForCaption } from '../app/exhibition/AnimationDialogue.js';
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
    const caption = document.createElement('p');
    caption.textContent = '꿀꺽…… 기운이 조금 돌아오는 것 같아.';
    caption.style.cssText = 'padding:14px 22px;border-radius:14px;background:#fff6e6;color:#302419;cursor:pointer;max-width:85vw;text-align:center';
    effect.append(caption);
    await waitForCaption(caption);
    timers.forEach(clearTimeout);
    effect.remove();
}
