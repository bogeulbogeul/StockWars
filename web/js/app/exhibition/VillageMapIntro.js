import { mapSVG } from '../../components/phone/map/MapSvg.js';

export const VILLAGE_MAP_STEPS = [
    ['home_office_tower', '이곳이 앞으로 지낼 집이에요.'],
    ['node_finance', '차곡 은행에서는 생활 계좌와 대출을 상담할 수 있어요.'],
    ['vivian_store', '봉봉 잡화점에서는 물건을 사고 포장 알바를 할 수 있어요.'],
    ['cipher_securities', '토리 증권사에서는 주식을 배울 수 있어요.']
];

export function presentVillageMap(app, beat) {
    if (!beat.mapIntro) { app.villageMap?.remove(); app.villageMap = null; return; }
    const index = beat.mapIntro - 1, [selected] = VILLAGE_MAP_STEPS[index];
    if (!app.villageMap) {
        app.villageMap = document.createElement('aside');
        app.villageMap.className = 'village-map-intro';
        app.villageMap.setAttribute('aria-label', '모아의 마을 지도 안내');
        app.view.root.append(app.villageMap);
    }
    app.villageMap.innerHTML = `<h2>모아의 마을 안내 <span>${index + 1} / 4</span></h2>${mapSVG({ selected })}`;
    for (const marker of app.villageMap.querySelectorAll('[data-place]')) {
        marker.removeAttribute('role'); marker.removeAttribute('tabindex');
    }
}
