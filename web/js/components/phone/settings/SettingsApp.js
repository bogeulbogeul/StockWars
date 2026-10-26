import { mountControlSettings } from './ControlSettings.js';
import { mountExtraSettings } from './ExtraSettings.js';

export function mountSettingsApp(phone, host) {
    phone.detail.classList.add('cozy-phone__detail--settings');
    host.classList.add('phone-settings');
    host.innerHTML = '';
    const cleanControls = mountControlSettings(phone, host);
    const cleanExtras = mountExtraSettings(host);
    const note = document.createElement('p'); note.className = 'phone-settings__note';
    note.textContent = '변경한 설정은 바로 적용되고 다음 실행에도 유지돼요.'; host.append(note);
    return () => {
        cleanControls(); cleanExtras(); note.remove();
        host.classList.remove('phone-settings');
        phone.detail.classList.remove('cozy-phone__detail--settings');
    };
}
