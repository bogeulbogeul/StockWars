import { dialogue, segment } from './Script.js';
import { TOUR_ORDER } from './TourOrder.js';

// Keep original dialogue; only implement its missing interactive connections here.
export function buildPlan(chapters, order = 'packing', includeRetiredTour = false) {
    const plan = [];
    const action = (id, place, title, extra = {}) => plan.push({ kind: 'action', id, place, title, ...extra });
    const add = (n, place, from, to) => {
        const lines = dialogue(segment(chapters.get(n).lines, from, to), { place, chapter: n });
        // Later adopted information-reading quiz supersedes the old personality test.
        for (const line of lines) if (n === 14 && line.text.startsWith('정답을 맞히는 시험은 아닙니다.')) {
            line.text = '몇 가지 정보를 함께 읽어볼 겁니다. 결과와 관계없이 계좌를 만들 수 있으니 편하게 답해주세요.';
        }
        if (n === 2 && !includeRetiredTour) for (const line of lines) {
            if (line.text === '준비됐어요? 먼저 마을 가운데로 가볼까요?') {
                line.text = '준비됐어요? 가까운 가구점부터 둘러볼까요?';
            }
        }
        plan.push(...lines);
    };
    add(1, 'arrival'); add(2, 'arrival');
    const tour = [['포포리 나무', 'tree'], ['소망이네 집', 'homeOutside'], ['봉봉 잡화점', 'storeOutside'],
        ['우디 가구점', 'furniture'], ['보니 옷장', includeRetiredTour ? 'retiredClothing' : null], ['도란 쉼터', 'pub'], ['소담 서점', 'bookstore'],
        ['두리 우체국', 'post'], ['토리 증권사', 'stockOutside'], ['차곡 은행', 'bankOutside'], ['모아 안내소', 'informationOutside']];
    const orderedTour = includeRetiredTour ? tour : TOUR_ORDER.map(place => tour.find(stop => stop[1] === place));
    action('walk', orderedTour[0][1], `${orderedTour[0][0]}으로 가기`);
    orderedTour.forEach(([name, place]) => {
        const sourceIndex = tour.findIndex(stop => stop[0] === name);
        if (place) add(3, place, `### ${name}`, tour[sourceIndex + 1] ? `### ${tour[sourceIndex + 1][0]}` : undefined);
    });
    add(4, 'information', undefined, '[화면]'); action('nickname', 'information', '입주 신청서에 서명하기');
    add(4, 'information', '[화면]');
    add(5, 'information', undefined, '[화면]'); action('phone', 'information', '휴대폰 받기');
    add(5, 'information', '[화면]', '[조작]'); action('openPhone', 'information', '휴대폰 열어보기');
    add(5, 'information', '[조작]'); add(6, 'information');
    add(7, 'bank', undefined, '[진행] 계좌'); action('bank', 'bank', '생활 계좌 개설하기');
    add(7, 'bank', '[진행] 계좌', '[대출 조건 안내');
    action('loan', 'bank', '정착 자금 확인하기');
    add(7, 'bank', '[대출 조건 안내', '[진행] 대출 조건 확인');
    add(7, 'bank', '[진행] 대출 조건 확인'); add(8, 'bankOutside');
    add(9, 'home', undefined, '[선택지]'); action('order', 'home', '오늘 먼저 해볼 일');
    add(9, 'home', order === 'packing' ? '### 주민 부탁' : '### 주식 투자', order === 'packing' ? '### 주식 투자' : '### 선택 후');
    add(9, 'home', '### 선택 후');
    const packing = () => {
        action('notice', 'notice', '봉봉 잡화점 구인 공고 읽기');
        add(11, 'store', undefined, '[선택지]');
        add(11, 'store', '### 해볼게', '[화면]'); action('packing', 'store', '포장 알바 시작하기');
        add(11, 'store', '[첫 상자를', '### 보수');
        add(11, 'store', '### 보수', '[화면] 보수'); action('wage', 'store', '일한 보수 받기');
        add(11, 'store', '[화면] 보수', '### 찌라시');
        add(11, 'store', '### 찌라시', '[화면] 봉투'); action('envelope', 'store', '손님이 맡긴 봉투 받기');
        add(11, 'store', '[화면] 봉투');
        add(12, 'bench', undefined, '[첫 찌라시'); action('rumor', 'bench', '봉투 열어보기');
        add(12, 'bench', '[첫 찌라시', '### 포장 알바');
        if (order === 'packing') add(12, 'bench', '### 포장 알바', '### 주식 활동');
    };
    const stock = () => {
        add(13, 'stock', order === 'packing' ? '### 포장 알바' : '### 주식 배우기', order === 'packing' ? '### 주식 배우기' : '### 공통');
        add(13, 'stock', '### 공통');
        add(14, 'stock', undefined, '[진행] 기존 투자');
        action('certificate', 'stock', '투자 자격증 발급하기');
        add(14, 'stock', '[진행] 기존 투자', '[후속 작성]');
        action('trade', 'stock', '토리 주식앱에서 첫 매수하기');
        action('tradeHistory', 'stock', '매수 내역 확인하기');
        if (order === 'stock') add(15, 'bench');
    };
    if (order === 'packing') { packing(); stock(); add(16, 'bench', '### 주식 활동', '### 포장 알바'); }
    else { stock(); packing(); }
    action('sunset', 'bench', '포포리의 첫 저녁');
    add(16, 'bench', '### 마지막 재회', '[모션] 모아가 꿀'); action('cookie', 'bench', '꿀 쿠키 나눠 먹기');
    add(16, 'bench', '[모션] 모아가 꿀');
    add(17, 'information', undefined, '[지급]'); action('grant', 'information', '정착 지원금 2,000잎 받기');
    add(17, 'information', '[지급]'); action('diary', 'information', '다이어리 받기');
    add(18, 'information', undefined, '### 귀가');
    add(19, 'store', undefined, '[화면]'); action('pot', 'store', '씨앗용 화분 구매하기');
    add(19, 'store', '[화면]', '[후속 설계]');
    add(20, 'home', undefined, '[선택 버튼]'); action('planted', 'home', '씨앗 심기');
    add(20, 'home', '[선택 버튼]', '[다이어리 첫 기록');
    action('diaryWritten', 'home', '첫 기록 남기기');
    add(20, 'home', '[다이어리 첫 기록', '[선택지]'); action('asleep', 'home', '오늘은 쉬기');
    return plan;
}

// Old saves used numeric scene positions. Remove only the retired tour's offset.
export function migrateClothingTour(state, chapters) {
    if (state.clothingStoreRemoved) return;
    const oldPlan = buildPlan(chapters, state.order, true);
    const removedBefore = oldPlan.slice(0, state.cursor).filter(scene => scene.place === 'retiredClothing').length;
    state.cursor = Math.max(0, state.cursor - removedBefore);
    state.clothingStoreRemoved = true;
}
