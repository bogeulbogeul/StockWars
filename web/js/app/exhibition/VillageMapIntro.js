import { mapSVG } from '../../components/phone/map/MapSvg.js';

export const VILLAGE_MAP_STEPS = [
    ['home_office_tower', '이곳이 앞으로 지낼 집이에요. 안내를 마치면 바로 가서 안쪽도 보여드릴게요.'],
    ['node_finance', '차곡 은행에서는 생활 계좌와 정착 자금을 상담할 수 있어요. 집을 본 뒤 함께 들러요.'],
    ['vivian_store', '봉봉 잡화점에서는 물건을 사고 포장 알바도 할 수 있어요. 일을 해보고 싶으면 게시판 공고부터 살펴보세요.'],
    ['cipher_securities', '여기는 토리 증권사예요. 주식이 궁금하면 토리에게 배울 수 있어요. 다른 장소는 필요할 때 천천히 찾아가 봐요.']
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
