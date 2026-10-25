import { getTownMusic } from '../../../engine/TownMusic.js';
import { mountControlSettings } from './ControlSettings.js';
import { mountExtraSettings } from './ExtraSettings.js';

export function mountSettingsApp(phone, host) {
    const music = getTownMusic();
    phone.detail.classList.add('cozy-phone__detail--settings');
    host.classList.add('phone-settings');
    host.innerHTML = `<section class="phone-settings__card" aria-label="음악 설정">
        <h3>음악</h3>
        <div class="phone-settings__row"><div><strong>배경음악</strong><p>타이틀과 게임 음악을 켜거나 꺼요.</p></div><button type="button" class="phone-settings__switch" role="switch" aria-label="배경음악" aria-checked="true" data-music-toggle></button></div>
        <label class="phone-settings__volume" for="phoneMusicVolume">음악 크기 <output for="phoneMusicVolume" data-music-volume-label></output></label>
        <input id="phoneMusicVolume" aria-label="음악 크기" type="range" min="0" max="100" step="1" data-music-volume>
        <div class="phone-settings__range-labels" aria-hidden="true"><span>작게</span><span>크게</span></div>
    </section><p class="phone-settings__note">오프닝과 실내에서도 같은 설정이 적용돼요.<br>음악 설정은 다음 실행에도 유지됩니다.</p>`;
    host.querySelector('.phone-settings__note').remove();
    const cleanControls = mountControlSettings(phone, host);
    const cleanExtras = mountExtraSettings(host);
    const note = document.createElement('p'); note.className = 'phone-settings__note';
    note.textContent = '변경한 설정은 바로 적용되고 다음 실행에도 유지돼요.'; host.append(note);
    const toggle = host.querySelector('[data-music-toggle]');
    const volume = host.querySelector('[data-music-volume]');
    const render = () => {
        toggle.setAttribute('aria-checked', String(!music.muted));
        toggle.textContent = music.muted ? '꺼짐' : '켜짐';
        volume.value = Math.round(music.volume * 100);
        host.querySelector('[data-music-volume-label]').textContent = `${volume.value}%`;
        volume.setAttribute('aria-valuetext', `${volume.value}%`);
    };
    toggle.onclick = () => music.setMuted(!music.muted);
    volume.oninput = () => music.setVolume(Number(volume.value) / 100);
    const unsubscribe = music.subscribe(render); render();
    return () => {
        unsubscribe(); cleanControls(); cleanExtras(); toggle.onclick = null; volume.oninput = null;
        host.classList.remove('phone-settings');
        phone.detail.classList.remove('cozy-phone__detail--settings');
    };
}
