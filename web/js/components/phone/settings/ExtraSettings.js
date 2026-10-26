import { settingsStore } from '../../../engine/SettingsStore.js';

export function mountExtraSettings(host) {
    const section = document.createElement('section');
    section.className = 'phone-settings__card phone-settings__extras';
    section.innerHTML = `<h3>화면</h3><div class="phone-settings__row"><div><strong>화면 효과 줄이기</strong><p>화면 전환과 구름·비·눈의 움직임을 줄여요.</p></div><button type="button" class="phone-settings__switch" role="switch" aria-label="화면 효과 줄이기"></button></div>`;
    host.append(section);
    const toggle = section.querySelector('button');
    const render = () => {
        toggle.setAttribute('aria-checked', String(settingsStore.value.reducedMotion));
        toggle.textContent = settingsStore.value.reducedMotion ? '켜짐' : '꺼짐';
    };
    toggle.onclick = () => { settingsStore.update({ reducedMotion: !settingsStore.value.reducedMotion }); render(); };
    render();
    return () => section.remove();
}
