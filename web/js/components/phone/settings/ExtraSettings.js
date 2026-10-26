import { settingsStore } from '../../../engine/SettingsStore.js';

export function mountExtraSettings(host) {
    const section = document.createElement('section');
    section.className = 'phone-settings__card phone-settings__extras';
    section.innerHTML = `<h3>소리와 화면</h3><label class="phone-settings__volume" for="phoneEffectsVolume">효과음 크기 <output data-effects-label></output></label><input id="phoneEffectsVolume" aria-label="효과음 크기" type="range" min="0" max="100" step="1"><div class="phone-settings__row"><div><strong>화면 효과 줄이기</strong><p>화면 전환과 구름·비·눈의 움직임을 줄여요.</p></div><button type="button" class="phone-settings__switch" role="switch" aria-label="화면 효과 줄이기"></button></div>`;
    host.append(section);
    const input = section.querySelector('input'), toggle = section.querySelector('button');
    const render = () => {
        input.value = settingsStore.value.effectsVolume;
        section.querySelector('output').textContent = `${input.value}%`;
        toggle.setAttribute('aria-checked', String(settingsStore.value.reducedMotion));
        toggle.textContent = settingsStore.value.reducedMotion ? '켜짐' : '꺼짐';
    };
    input.oninput = () => { settingsStore.update({ effectsVolume: Number(input.value) }); render(); };
    toggle.onclick = () => { settingsStore.update({ reducedMotion: !settingsStore.value.reducedMotion }); render(); };
    render();
    return () => section.remove();
}
