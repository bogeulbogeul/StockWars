import { PHONE_APPS, phoneIcon } from './PhoneHomeData.js';

export function phoneHomeTemplate() {
    return `<div class="cozy-phone__shell">
        <span class="cozy-phone__speaker" aria-hidden="true"></span>
        <div class="cozy-phone__screen">
            <div class="cozy-phone__status"><span data-phone-status></span><span aria-hidden="true">▂▄▆ <span class="cozy-phone__battery"></span></span></div>
            <section class="cozy-phone__home" aria-label="홈 화면">
                <div class="cozy-phone__clock"><time data-phone-time></time>
                    <div class="cozy-phone__date"><span data-phone-date></span><span data-phone-weather></span></div>
                </div>
                <nav class="cozy-phone__grid" aria-label="스마트폰 앱">
                    ${PHONE_APPS.map(([id, name, color]) => `<button type="button" class="cozy-phone__app" data-phone-app="${id}"><span class="cozy-phone__tile cozy-phone__tile--${color}">${phoneIcon(id)}${id === 'stock' ? `<span class="cozy-phone__lock" hidden>${phoneIcon('lock')}</span>` : ''}</span><span>${name}</span></button>`).join('')}
                </nav>
                <p class="cozy-phone__notice" data-phone-notice role="status" hidden></p>
            </section>
            <section class="cozy-phone__detail" hidden aria-label="앱 화면">
                <button type="button" class="cozy-phone__back">‹ 홈 화면</button>
                <h2 tabindex="-1"></h2><div class="cozy-phone__content"></div>
            </section>
        </div>
    </div>`;
}
