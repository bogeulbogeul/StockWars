import { shortenDemoDialogue } from './ShortDialogue.js';
import { dialogue, segment } from './Script.js';
import { TOUR_ORDER } from './TourOrder.js';
import { VILLAGE_MAP_STEPS } from './VillageMapIntro.js';

// Keep original dialogue; only implement its missing interactive connections here.
export function buildPlan(chapters, order = 'packing', includeRetiredTour = false, walkingTour = false) {
    const legacy = includeRetiredTour || walkingTour;
    const plan = [];
    const action = (id, place, title, extra = {}) => plan.push({ kind: 'action', id, place, title, ...extra });
    const add = (n, place, from, to) => {
        const lines = dialogue(segment(chapters.get(n).lines, from, to), { place, chapter: n });
        if (place === 'bench' && [12, 15, 16].includes(n) && !plan.some(b => b.chapter === n && b.place === 'bench') && lines[0])
            lines[0].plazaTalk = true;
        for (const line of lines) if (n === 5 && line.text === '한번 열어볼래요?') {
            line.text = '필요한 일이 생기면 스마트폰으로 저에게 연락해도 돼요.';
        }
        for (const line of lines) if (!legacy && line.text === '마을을 둘러보는 동안 이름은 생각해봤어요?')
            line.text = '안내소로 오는 동안 이름은 생각해봤어요?';
        for (const line of lines) if (n === 18 && line.text === '네. 저도 정리하고 들어가려고요.')
            line.text = '저는 안내소로 돌아가서 남은 일을 정리하려고요. 오늘은 푹 쉬어요.';
        // Later adopted information-reading quiz supersedes the old personality test.
        for (const line of lines) if (n === 14 && line.text.startsWith('정답을 맞히는 시험은 아닙니다.')) {
            line.text = '몇 가지 정보를 함께 읽어볼 겁니다. 결과와 관계없이 계좌를 만들 수 있으니 편하게 답해주세요.';
        }
        plan.push(...lines);
    };
    add(1, 'arrival');
    if (legacy) add(2, 'arrival');
    else for (const [speaker, text] of [['모아', '이름은 안내소에서 천천히 정해도 돼요.'],
        ['소망이', '좋아. 같이 가자.'], ['모아', '먼저 제가 일하는 안내소로 가요. 마을은 지도를 보면서 짧게 소개해 드릴게요.']])
        plan.push({ kind: 'line', speaker, text, chapter: 2, place: 'arrival' });
    const tour = [['포포리 나무', 'tree'], ['소망이네 집', 'homeOutside'], ['봉봉 잡화점', 'storeOutside'],
        ['우디 가구점', 'furniture'], ['보니 옷장', includeRetiredTour ? 'retiredClothing' : null], ['도란 쉼터', 'pub'], ['소담 서점', 'bookstore'],
        ['두리 우체국', 'post'], ['토리 증권사', 'stockOutside'], ['차곡 은행', 'bankOutside'],
        ['주민 게시판', 'notice'], ['모아 안내소', 'informationOutside']];
    const orderedTour = includeRetiredTour ? tour : TOUR_ORDER.map(place => tour.find(stop => stop[1] === place));
    action('walk', legacy ? orderedTour[0][1] : 'informationOutside', legacy ? `${orderedTour[0][0]}으로 가기` : '모아를 따라 안내소로 가기');
    if (legacy) orderedTour.forEach(([name, place]) => {
        const headings = chapters.get(3).lines.filter(line => line.startsWith('### '));
        const sourceIndex = headings.indexOf(`### ${name}`);
        if (place && sourceIndex >= 0) add(3, place, `### ${name}`, headings[sourceIndex + 1]);
    });
    add(4, 'information', undefined, '[화면]'); action('nickname', 'information', '입주 신청서에 서명하기');
    add(4, 'information', '[화면]');
    add(5, 'information', undefined, '[화면]'); action('phone', 'information', '휴대폰 받기');
    action('openPhone', 'information', '휴대폰 열어보기');
    add(5, 'information', '[화면]', '[조작]');
    add(5, 'information', '[조작]');
    if (!legacy) {
        VILLAGE_MAP_STEPS.forEach(([, text], i) => plan.push({ kind: 'line', speaker: '모아', text,
            place: 'information', mapIntro: i + 1 }));
        plan.push({ kind: 'line', speaker: '모아', text: '그럼 먼저 집으로 가 볼까요? 제가 문을 열고 안쪽을 보여드릴게요.', place: 'information' });
        add(9, 'home', undefined, '모아: “그럼 어떤');
    }
    add(6, legacy ? 'information' : 'home');
    add(7, 'bank', undefined, '[진행] 계좌'); action('bank', 'bank', '생활 계좌 개설하기');
    add(7, 'bank', '[진행] 계좌', '[대출 조건 안내');
    action('loan', 'bank', '정착 자금 확인하기');
    add(7, 'bank', '[대출 조건 안내', '[진행] 대출 조건 확인');
    add(7, 'bank', '[진행] 대출 조건 확인'); add(8, 'bankOutside', undefined, legacy ? undefined : '모아: “한꺼번에');
    if (legacy) add(9, 'home', undefined, '[선택지]');
    else plan.push({ kind: 'line', speaker: '모아', text: '집도 둘러보고 생활에 필요한 준비도 마쳤네요. 이제 어떤 것부터 해볼까요?', place: 'bankOutside' });
    const choicePlace = legacy ? 'home' : 'bankOutside';
    action('order', choicePlace, '오늘 먼저 해볼 일');
    add(9, choicePlace, order === 'packing' ? '### 주민 부탁' : '### 주식 투자', order === 'packing' ? '### 주식 투자' : '### 선택 후');
    if (!legacy) {
        const destination = order === 'stock' ? '증권사를' : '잡화점을';
        plan.push({ kind: 'line', speaker: '모아', chapter: 9, place: choicePlace,
            text: `${destination} 찾기 어려우면 스마트폰의 지도앱을 열어보세요. 지도에서 ${destination} 선택하면 위치를 확인할 수 있어요.` });
    }
    add(9, choicePlace, '### 선택 후');
    if (!legacy) action('moaFarewell', choicePlace, '모아와 인사하기');
    const packing = () => {
        action('notice', 'notice', '봉봉 잡화점 구인 공고 읽기');
        add(11, 'store', undefined, '[모션] 봉봉이 포장할');
        plan.push({ kind: 'line', speaker: '봉봉', text: '상자 3개를 포장하면 보수 300잎을 드릴게요. 시작해볼까요?',
            chapter: 11, place: 'store', packingOffer: true });
        add(11, 'store', '### 해볼게', '봉봉: “그럼 첫 상자'); action('packing', 'store', '포장 알바 시작하기');
        const rewardStart = plan.length;
        add(11, 'store', '[첫 상자를', '### 보수');
        add(11, 'store', '### 보수', '[화면] 보수'); action('wage', 'store', '일한 보수 받기');
        add(11, 'store', '[화면] 보수', '### 찌라시');
        add(11, 'store', '### 찌라시', '[화면] 봉투'); action('envelope', 'store', '손님이 맡긴 봉투 받기');
        add(11, 'store', '[화면] 봉투');
        for (const beat of plan.slice(rewardStart)) beat.storeRewardConversation = true;
        add(12, 'bench', undefined, '[첫 찌라시'); action('rumor', 'bench', '봉투 열어보기');
        add(12, 'bench', '[첫 찌라시', '### 포장 알바');
        if (order === 'packing') add(12, 'bench', '### 포장 알바', '### 주식 활동');
    };
    const stock = () => {
        add(13, 'stock', order === 'packing' ? '### 포장 알바' : '### 주식 배우기', order === 'packing' ? '### 주식 배우기' : '### 공통');
        action('stockCounter', 'stock', '안내데스크에서 토리에게 말 걸기');
        add(14, 'stock', undefined, '[진행] 기존 투자');
        action('certificate', 'stock', '투자 자격증 발급하기');
        const lessonStart = plan.length;
        add(13, 'stock', '### 공통');
        plan[lessonStart].trainingLesson = true;
        action('trade', 'stock', '컴퓨터에서 첫 매수하기');
        action('tradeHistory', 'stock', '매수 내역 확인하기');
        if (order === 'stock') add(15, 'bench');
    };
    if (order === 'packing') { packing(); stock(); add(16, 'bench', '### 주식 활동', '### 포장 알바'); }
    else { stock(); packing(); }
    action('sunset', 'bench', '포포리의 첫 저녁');
    add(16, 'bench', '### 마지막 재회', '[모션] 모아가 꿀'); action('cookie', 'bench', '꿀 쿠키 나눠 먹기');
    add(16, 'bench', '[모션] 모아가 꿀', '모아: “다 먹었으면 안내소');
    add(17, 'bench', undefined, '[지급]'); action('grant', 'bench', '정착 지원금 2,000잎 받기');
    add(17, 'bench', '[지급]', '[모션] 모아가 다이어리');
    action('diary', 'bench', '다이어리 받기');
    add(17, 'bench', '[모션] 모아가 다이어리');
    add(18, 'bench', undefined, '### 귀가');
    action('moaReturn', 'bench', '모아와 인사하기', { chapter: 18 });
    add(19, 'store', undefined, '[화면]');
    action('pot', 'store', '씨앗용 화분 구매하기');
    add(19, 'store', '[화면]', '[후속 설계]');
    plan.push({ kind: 'line', chapter: 19, place: 'storeOutside', speaker: '소망이', text: '하아암…… 피곤하다. 이제 집에 가서 쉬어야겠어.', yawn: true });
    add(20, 'home', undefined, '[선택 버튼]'); action('planted', 'home', '씨앗 심기');
    add(20, 'home', '[선택 버튼]', '[다이어리 첫 기록');
    action('diaryWritten', 'home', '첫 기록 남기기');
    action('asleep', 'home', '잠자기');
    return legacy ? plan : shortenDemoDialogue(plan, order);
}

// Old saves used numeric scene positions. Remove only the retired tour's offset.
export function migrateClothingTour(state, chapters) {
    if (state.clothingStoreRemoved) return;
    const oldPlan = buildPlan(chapters, state.order, true);
    const current = buildPlan(chapters, state.order, false, true);
    const scene = oldPlan.slice(state.cursor).find(beat => beat.place !== 'retiredClothing');
    const index = current.findIndex(beat => scene?.kind === 'action'
        ? beat.id === scene.id : JSON.stringify(beat) === JSON.stringify(scene));
    state.cursor = index >= 0 ? index : current.length;
    state.clothingStoreRemoved = true;
}

export function migrateTourDialogue(state, chapters) {
    if (state.tourDialogueVersion === 2) return;
    const old = buildPlan(chapters, state.order, false, true), current = buildPlan(chapters, state.order);
    const walk = old.findIndex(beat => beat.id === 'walk');
    if (state.tourDialogueVersion !== 1) {
        if (state.cursor >= old.findIndex(beat => beat.id === 'nickname') - 3) state.cursor += 3;
        else if (state.cursor >= walk) state.cursor = walk;
    }
    const beat = old[state.cursor];
    let index;
    if (beat?.chapter === 3 || beat?.id === 'walk') index = current.findIndex(b => b.id === 'walk');
    else if (beat?.chapter === 2) index = current.findIndex(b => b.chapter === 2);
    else index = current.findIndex(b => beat?.kind === 'action' ? b.id === beat.id
        : b.chapter === beat?.chapter && b.speaker === beat?.speaker && b.text === beat?.text);
    if (index < 0) index = state.flags.nickname ? current.findIndex(b => b.mapIntro) : current.findIndex(b => b.id === 'walk');
    state.cursor = index; state.tourDialogueVersion = 2;
}

