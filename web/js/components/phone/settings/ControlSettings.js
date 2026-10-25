import { settingsStore } from '../../../engine/SettingsStore.js';
import { keyLabel } from '../../../engine/KeyBindings.js';

const labels = { w: '위로 이동', a: '왼쪽으로 이동', s: '아래로 이동', d: '오른쪽으로 이동' };
const presets = { WASD: ['KeyW', 'KeyA', 'KeyS', 'KeyD'], '방향키': ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'], HJKL: ['KeyK', 'KeyH', 'KeyJ', 'KeyL'] };
export function mountControlSettings(phone, host) {
    const section = document.createElement('section');
    section.className = 'phone-settings__card phone-settings__controls';
    section.innerHTML = `<h3>이동키</h3><div class="phone-settings__presets">${Object.keys(presets).map(name => `<button type="button" data-preset="${name}">${name}</button>`).join('')}</div>${Object.entries(labels).map(([action, label]) => `<div class="phone-settings__binding"><span>${label}</span><button type="button" data-bind="${action}" aria-label="${label} 키 변경"></button></div>`).join('')}<p class="phone-settings__help" role="status" aria-live="polite">버튼을 누른 뒤 원하는 키를 눌러주세요.</p><p class="phone-settings__help">E 착석 · F 상호작용 · Space 점프<br>Q/E 카메라 · P 스마트폰은 유지됩니다.</p>`;
    host.append(section);
    let pending = null;
    const status = section.querySelector('[role="status"]');
    const render = () => {
        section.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(presets[button.dataset.preset].every((code, index) => settingsStore.value.keyBindings[Object.keys(labels)[index]] === code))));
        section.querySelectorAll('[data-bind]').forEach(button => { button.textContent = pending === button.dataset.bind ? '키 입력…' : keyLabel(settingsStore.value.keyBindings[button.dataset.bind]); });
    };
    const save = patch => {
        const bindings = { ...settingsStore.value.keyBindings, ...patch };
        if (new Set(Object.values(bindings)).size !== Object.keys(bindings).length) { status.textContent = '이미 다른 조작에 쓰는 키예요. 다른 키를 골라주세요.'; return; }
        pending = null;
        status.textContent = settingsStore.update({ keyBindings: bindings }) ? '이동키를 저장했어요.' : '현재 실행에 적용했어요. 저장 공간을 사용할 수 없어요.';
        render();
    };
    section.onclick = event => {
        const button = event.target.closest('button'); if (!button) return;
        if (button.dataset.preset) { pending = null; save(Object.fromEntries(Object.keys(labels).map((action, index) => [action, presets[button.dataset.preset][index]]))); render(); }
        else { pending = button.dataset.bind; status.textContent = `${labels[pending]} 키를 눌러주세요. Esc로 취소해요.`; render(); }
    };
    const capture = event => {
        if (!pending) return false;
        if (event.code === 'Escape') { pending = null; status.textContent = '키 변경을 취소했어요.'; render(); return true; }
        if (event.repeat) return true;
        if (event.ctrlKey || event.altKey || event.metaKey || !/^(Key[A-Z]|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(event.code) || ['KeyE', 'KeyQ', 'KeyR'].includes(event.code)) {
            status.textContent = '문자 키나 방향키를 골라주세요. Q/E/R은 고정 조작에 사용해요.'; return true;
        }
        save({ [pending]: event.code }); return true;
    };
    phone.captureSettingsKey = capture;
    render();
    return () => { if (phone.captureSettingsKey === capture) phone.captureSettingsKey = null; section.remove(); };
}
