/**
 * Town World Geometry & Static Definitions
 * Contains canonical building specifications, interactive props, street decoration assets, and billboard news.
 */

export const TOWN_BUILDINGS = [
    {
        id: 'home_office_tower',
        name: '홈 오피스텔',
        sign: '홈 오피스텔',
        category: '레지던스',
        icon: '🏢',
        x: 150,
        width: 280,
        height: 350,
        colorTheme: 'home-officetel',
        desc: '파트너 안나가 상주하는 나만의 오피스텔 펜트하우스 트레이딩 룸입니다.',
        actionText: '내 오피스 들어가기',
        isOfficetel: true
    },
    {
        id: 'bit_logistics',
        name: '비트 물류센터',
        sign: '비트 물류',
        category: '물류 / 노동',
        icon: '📦',
        x: 720,
        width: 280,
        height: 230,
        colorTheme: 'yellow',
        desc: '초기 시드머니 확보를 위한 60초 화물 운송 노동소 (관리소장 박씨)',
        actionText: '물류창고 진입'
    },
    {
        id: 'vivian_store',
        name: '비비안 잡화점',
        sign: '비비안 잡화점',
        category: '잡화 / 소모품',
        icon: '🏪',
        x: 1280,
        width: 240,
        height: 210,
        colorTheme: 'green',
        desc: '에너지 드링크(기력 회복) 및 데모 편의 소모품 구매 (상점주 비비안)',
        actionText: '잡화점 입장'
    },
    {
        id: 'julian_furniture',
        name: '모던 프레임 가구점',
        sign: '모던 프레임',
        category: '가구 / 인테리어',
        icon: '🛋️',
        x: 1860,
        width: 250,
        height: 230,
        colorTheme: 'amber',
        desc: '8x8 오피스 맞춤형 가구, 책상 및 인테리어 데코 쇼룸 (디자이너 줄리안 & 레오)',
        actionText: '가구점 입장'
    },
    {
        id: 'claire_apparel',
        name: '테일러드 의상실',
        sign: '테일러드',
        category: '의상 / 스타일',
        icon: '👗',
        x: 2370,
        width: 240,
        height: 230,
        colorTheme: 'magenta',
        desc: '트레이더 전용 스탯 의상 및 명품 커스텀 코스튬 (디자이너 클레어)',
        actionText: '의상실 입장'
    },
    {
        id: 'data_ink_bookstore',
        name: '데이터 잉크 서점',
        sign: '데이터 잉크',
        category: '서점 / 지식',
        icon: '📚',
        x: 2870,
        width: 240,
        height: 220,
        colorTheme: 'indigo',
        desc: '영구 스탯 강화 전문 도서 및 섹터별 인사이트 리포트 (사서 소피아)',
        actionText: '서점 입장'
    },
    {
        id: 'cipher_securities',
        name: '사이퍼 증권 본점',
        sign: '사이퍼 증권',
        category: '금융 / 트레이딩',
        icon: '🏛️',
        x: 3570,
        width: 440,
        height: 360,
        isMainLandmark: true,
        colorTheme: 'violet',
        desc: '중앙 거대 객장, 실시간 전광판 틱 시세판, 아레나 배틀룸 및 서밋 라운지 (에이전트 K)',
        actionText: '증권사 객장 입장'
    },
    {
        id: 'node_finance',
        name: '노드 파이낸스 은행',
        sign: '노드 파이낸스',
        category: '은행 / 금융',
        icon: '🏦',
        x: 4390,
        width: 300,
        height: 260,
        colorTheme: 'blue',
        desc: '4주 정기 적금, 긴급 신용 대출 및 부채 자산 관리 (지점장 샤일록)',
        actionText: '은행 창구 이용'
    },
    {
        id: 'midnight_pub',
        name: '미드나잇 펍',
        sign: '미드나잇 펍',
        category: '사교 / 정보',
        icon: '🍸',
        x: 4970,
        width: 260,
        height: 230,
        colorTheme: 'purple',
        desc: '확정형 고급 찌라시 정보 거래, 지하 정통 블랙잭 테이블 (브로커 안드레)',
        actionText: '펍 입장'
    }
];

export const TOWN_INTERACTIVE_PROPS = [
    {
        id: 'bench_west',
        type: 'bench',
        name: '서부 공원 힐링 벤치',
        icon: '🪑',
        x: 1590,
        width: 100,
        height: 52,
        desc: '도심 속 녹음이 어우러진 휴식 공간입니다. 잠시 앉아 피로와 기력/체력을 100% 충전할 수 있습니다.',
        actionText: '벤치에 앉아 체력 회복'
    },
    {
        id: 'billboard_central',
        type: 'billboard',
        name: '사이퍼 센트럴 미디어 전광판',
        icon: '📺',
        x: 3200,
        width: 260,
        height: 275,
        desc: '실시간 긴급 뉴스 속보, 상점 특별 할인 광고 및 아레나 대회 공지가 송출되는 타운 대형 LED 전광판입니다.',
        actionText: '실시간 속보 & 광고 브리핑'
    },
    {
        id: 'bench_east',
        type: 'bench',
        name: '동부 광장 쉼터 벤치',
        icon: '🪑',
        x: 4130,
        width: 100,
        height: 52,
        desc: '증권가와 은행가 사이 위치한 휴식 벤치입니다. 지친 트레이더들의 체력과 기력을 빠르게 회복시킵니다.',
        actionText: '벤치에 앉아 체력 회복'
    }
];

export const TOWN_STREET_LAMPS = [80, 480, 1060, 1530, 1750, 2190, 2690, 3140, 3500, 4060, 4290, 4770, 5320, 5800];
export const TOWN_URBAN_TREES = [580, 1720, 2260, 3120, 4230, 5380];
export const TOWN_DIRECTION_SIGNS = [
    { x: 490, text: '← 홈 오피스텔 | 센트럴 상점가 →' },
    { x: 3500, text: '← 데이터 서점 | 증권사 • 금융가 →' }
];

export const TOWN_BILLBOARD_NEWS = [
    { badge: '🔥 긴급 속보', type: 'breaking', text: '바이오닉스, 차세대 AI 신약 임상 3상 돌파 루머에 거래량 폭증!' },
    { badge: '📢 상점 특가', type: 'ad', text: '비비안 잡화점: 오늘 하루 몬스터 에너지 드링크 20% 특별 타임세일!' },
    { badge: '📈 시장 시황', type: 'market', text: '코스닥 반도체 & AI 테마주 일제히 급등... 외인 대규모 순매수 유입' },
    { badge: '🏆 아레나 공지', type: 'event', text: '사이퍼 증권배 실전투자대회 시즌 1 참가자 접수 중! (총상금 10억 크레딧)' },
    { badge: '🛋️ 가구 신상', type: 'ad', text: '모던 프레임 가구점: 8x8 오피스 맞춤형 사이버 트레이딩 데스크 세트 입고' }
];