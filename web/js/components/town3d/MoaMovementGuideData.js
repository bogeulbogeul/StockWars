import { bindingLabel } from '../../app/GameKeys.js';
export function movementGuideContent({ follow, door, receive, smartphone, bankTalk, storeTalk, packingWork, moaTalk, computer, stockCounter, inventoryRumor, finalePot, firstDiary }) {
    const movement = { keys: ['w', 'a', 's', 'd'].map(bindingLabel), text: '이동' };
    if (finalePot) return { label: '씨앗 심기 안내', title: '가방에서 화분을 사용해 보자',
        rows: [{ keys: [bindingLabel('i')], text: '가방 열기' }, { text: '씨앗용 화분을 선택하고 사용하기를 눌러 주세요.' }] };
    if (firstDiary) return { label: '첫 일기 쓰기 안내', title: '오늘을 일기에 남겨 보자',
        rows: [{ keys: ['J'], text: '다이어리 열기' }, { text: '오늘의 기록 남기기를 눌러 첫 일기를 써 보세요.' }] };
    if (inventoryRumor) return { label: '찌라시 열기 안내', title: '가방에서 소식봉투를 열어보자',
        rows: [{ keys: [bindingLabel('i')], text: '가방 열기' }, { text: '소식봉투를 선택하고 찌라시 열기를 눌러 주세요.' }] };
    if (stockCounter) return { label: '증권사 안내데스크 안내', title: '안내데스크에서 토리에게 말을 걸어보자',
        rows: [movement, { keys: ['F'], text: '안내데스크 앞에서 토리에게 말 걸기' }] };
    if (computer) return { label: '컴퓨터 이용 안내', title: '책상 앞에 앉아 컴퓨터를 켜보자',
        rows: [movement, { keys: ['E'], text: '책상 앞 의자에 앉기' }, { keys: ['F'], text: '앉은 뒤 컴퓨터 켜기' }] };
    if (moaTalk) return { label: '모아 대화 안내', title: '모아에게 말을 걸어보자',
        rows: [movement, { keys: ['F'], text: '모아 가까이에서 말 걸기' }] };
    if (packingWork) return { label: '포장 작업대 안내', title: '작업대에서 포장을 시작해보자',
        rows: [movement, { keys: ['F'], text: '작업대 가까이에서 포장 시작' }, { text: '일을 마치면 체력 1칸을 사용해요.' }] };
    if (storeTalk) return { label: '봉봉 대화 안내', title: '봉봉에게 말을 걸어보자',
        rows: [movement, { keys: ['F'], text: '봉봉 가까이에서 말 걸기' }] };
    if (bankTalk) return { label: '은행 대화 안내', title: '차곡이에게 말을 걸어보자',
        rows: [movement, { keys: ['F'], text: '창구 가까이에서 차곡이에게 말 걸기' }] };
    if (smartphone) return { label: '스마트폰 열기 안내', title: '스마트폰을 열어보자',
        rows: [{ text: '화면 오른쪽 아래의 스마트폰 버튼을 눌러 주세요.' }] };
    if (receive) {
        const item = ({ phone: '휴대폰', wage: '보수주머니', envelope: '소식봉투', cookie: '꿀쿠키', grant: '정착금 주머니', diary: '다이어리' })[receive] || '서류';
        return { label: `${item} 받기 안내`, title: `${item}${receive === 'phone' ? '을' : '를'} 받아보자`,
            rows: [{ keys: ['F'], text: `${item} 받기` }] };
    }
    if (door) return { label: '이동 안내', title: '문 앞에서 들어가 보자',
        rows: [movement, { keys: ['F'], text: '문 가까이에서 출입하기' }] };
    if (follow) return { label: '이동 안내', title: '모아를 따라가 보자', rows: [movement] };
    return { label: '이동 안내', title: '모아에게 다가가 보세요',
        rows: [movement, { keys: ['F'], text: '가까이에서 세 번 눌러 모아 깨우기' }] };
}
