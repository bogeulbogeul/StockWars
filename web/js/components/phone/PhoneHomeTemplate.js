import { PHONE_APPS, phoneIcon } from './PhoneHomeData.js';

export function phoneHomeTemplate() {
    return `<div class="cozy-phone__shell">
        <span class="cozy-phone__speaker" aria-hidden="true"></span>
        <button class="cozy-phone__close" type="button" aria-label="스마트폰 닫기">×</button>
        <div class="cozy-phone__screen">
            <div class="cozy-phone__status"><span data-phone-status></span><span aria-hidden="true">▂▄▆ <span class="cozy-phone__battery"></span></span></div>
            <section class="cozy-phone__home" aria-label="홈 화면">
                <div class="cozy-phone__clock"><time data-phone-time></time>
                    <div class="cozy-phone__date"><span data-phone-date></span><span data-phone-weather></span></div>
                </div>
                <nav class="cozy-phone__grid" aria-label="스마트폰 앱">
                    ${PHONE_APPS.map(([id, name, color]) => `<button type="button" class="cozy-phone__app" data-phone-app="${id}"><span class="cozy-phone__tile cozy-phone__tile--${color}">${phoneIcon(id)}</span><span>${name}</span></button>`).join('')}
                </nav>
                <div class="cozy-phone__dots" aria-hidden="true"><i></i><i></i></div>
            </section>
            <section class="cozy-phone__detail" hidden aria-label="앱 화면">
                <button type="button" class="cozy-phone__back">‹ 홈 화면</button>
                <h2 tabindex="-1"></h2><div class="cozy-phone__content"></div>
            </section>
            <button class="cozy-phone__home-key" type="button" aria-label="홈 화면으로"><span></span></button>
        </div>
    </div>`;
}
