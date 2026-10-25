import { PhoneHome } from '../components/phone/PhoneHome.js';
import { installDiary } from './InstallDiary.js';
import { decoratePhoneLauncher } from '../components/phone/PhoneLauncher.js';
import { phoneStockSource } from './PhoneStockSource.js';
import { mountStockPhoneApp } from '../components/phone/stock/MountStockApp.js';

export function installPhoneHome(app) {
    installDiary(app);
    const source = phoneStockSource(app);
    const phone = new PhoneHome({ renderApp: (id, content) => mountStockPhoneApp(phone, source, id, content), onOpen: () => {
        app.townStage?.playerController?.keysHeld.clear();
        app.officeStage?.keysHeld.clear();
    } });
    app.phoneHome = phone;
    const launch = document.createElement('button');
    launch.className = 'cozy-phone-launch'; launch.type = 'button';
    decoratePhoneLauncher(launch);
    launch.onclick = () => phone.open(); document.body.append(launch);
    const oldBlocked = app.townStage?.callbacks?.isInputBlocked;
    if (app.townStage?.callbacks) app.townStage.callbacks.isInputBlocked = () => phone.dialog.open || oldBlocked?.();
    window.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey
            || document.body.classList.contains('title-screen-active')
            || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        if (event.code === 'KeyP') {
            event.preventDefault(); event.stopImmediatePropagation(); phone.open();
        }
    }, true);
}
