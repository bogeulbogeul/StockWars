import { MarketEngine } from '../engine/marketEngine.js';
import { PhoneHome } from '../components/phone/PhoneHome.js';
import { phoneStockSource } from './PhoneStockSource.js';
import { mountStockPhoneApp } from '../components/phone/stock/MountStockApp.js';

export function openTitleSimulation() {
    const engine = new MarketEngine();
    const source = phoneStockSource({ isLocalSession: true, smartphoneUI: {} }, engine);
    source.onStock = () => {};
    source.onFavorites = () => {};
    source.recent = [];
    const phone = new PhoneHome({ renderApp: (id, content) => mountStockPhoneApp(phone, source, id, content) });
    phone.dialog.setAttribute('aria-label', '주식 시뮬레이션 체험');
    phone.dialog.querySelector('.cozy-phone__back').onclick = () => phone.close();
    return new Promise(resolve => {
        phone.dialog.addEventListener('close', () => {
            engine.stopEngine(); phone.destroy(); resolve();
        }, { once: true });
        phone.open(); phone.openApp('stock');
        const title = phone.detail.querySelector('h2');
        title.textContent = '주식 시뮬레이션 체험 · 가상 자금 5,000잎';
    });
}

