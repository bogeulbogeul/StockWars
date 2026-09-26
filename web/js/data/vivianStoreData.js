/**
 * Vivian Store Data & Item Registry
 * Reference: MOD_GDD_03_1_VivianStore.md / MOD_GDD_03_4_Bookstore.md / MOD_GDD_03_0_ShopIndex.md
 * Handles daily rotation shelves, weekly special stock, secret shelf conditions, and NPC dialogue scripts.
 */

export const VIVIAN_TABS = {
    daily: { id: 'daily', name: '일일 보급 매대', icon: '⚡', desc: '매일 00:00 갱신 소모품 및 유틸리티 도구' },
    weekly: { id: 'weekly', name: '주간 특수 매대', icon: '📅', desc: '매주 월요일 갱신 기간제 패스 및 배급권' },
    secret: { id: 'secret', name: '비밀 매대 (Under)', icon: '🔒', desc: '트레이더 신뢰도 및 생존 업적 전용 은밀한 보급품' },
    books: { id: 'books', name: '서점 위탁 코너', icon: '📚', desc: '영구 스탯 및 시장 통찰력을 높여주는 투자 전문 서적' }
};

export const VIVIAN_SHOP_CATALOG = [
    // 1. 일일 보급 매대 (Daily Shelf)
    {
        id: 'item_energy_drink',
        tab: 'daily',
        name: '몬스터 에너지 드링크',
        category: 'consumable',
        rarity: 'common',
        icon: '🥤',
        price: 500,
        dailyLimit: 2,
        instantUsable: true,
        desc: '고농축 타우린과 카페인이 함유된 국민 에너지 드링크. 찌뿌둥한 피로를 날려버립니다.',
        effects: ['❤️ 스테미너 하트 1칸 즉시 회복', '⚡ 일일 노동/알바 즉시 재참여 가능'],
        linkedStock: { id: 'MORNINGBREW', name: '모닝 브루', note: '소비 시 모닝 브루 실적 기여' }
    },
    {
        id: 'item_premium_rumor',
        tab: 'daily',
        name: '유료 찌라시 (Premium)',
        category: 'intel',
        rarity: 'rare',
        icon: '📜',
        price: 2000,
        dailyLimit: 3,
        instantUsable: false,
        desc: '다크넷 정보원과 증권가 브로커가 은밀히 교환한 신뢰도 높은 기업 내부 루머.',
        effects: ['🔍 찌라시 텍스트 해독률 50% 보장', '📈 특정 종목 당일 급등 복선 포착'],
        linkedStock: null
    },
    {
        id: 'item_crypto_decoder',
        tab: 'daily',
        name: '암호 해독기 (v1.0)',
        category: 'intel',
        rarity: 'uncommon',
        icon: '💻',
        price: 1200,
        dailyLimit: 2,
        instantUsable: true,
        desc: '모자이크 처리된 [REDACTED] 텍스트를 실시간으로 브루트포스 해독하는 소형 포터블 툴.',
        effects: ['🔓 뉴스/찌라시 [REDACTED] 단어 1개 확정 해독', '⚡ 분석 대기시간 30% 단축'],
        linkedStock: { id: 'CLOUDBERRY', name: '클라우드 베리', note: '분산 암호 인프라 부품 사용' }
    },
    {
        id: 'item_focus_pill',
        tab: 'daily',
        name: '각성제 (Focus Pill)',
        category: 'consumable',
        rarity: 'uncommon',
        icon: '💊',
        price: 1000,
        dailyLimit: 5,
        instantUsable: true,
        desc: '뇌세포의 집중도를 극대화하여 차트의 글리치와 미세 체결 틱을 감지하는 알약.',
        effects: ['🧠 120분간 [분석력] +2 Bonus', '👁️ 호가창 이상 급변동 시각화'],
        linkedStock: { id: 'FORESTLAB', name: '포레스트 랩', note: '천연 바이오 농축액 납품' }
    },
    {
        id: 'item_stabilizer',
        tab: 'daily',
        name: '안정제 (Stabilizer)',
        category: 'consumable',
        rarity: 'uncommon',
        icon: '🧪',
        price: 1000,
        dailyLimit: 5,
        instantUsable: true,
        desc: '극심한 변동성 속에서도 심박수를 안정시켜 뇌동매매를 방지하는 신경안정제.',
        effects: ['💼 120분간 [운용력] +2 Bonus', '📊 1회 매수 한도 +15% 일시 확장'],
        linkedStock: { id: 'FORESTLAB', name: '포레스트 랩', note: '포레스트 랩 바이오 성분' }
    },
    {
        id: 'item_vitamin_complex',
        tab: 'daily',
        name: '비타민 컴플렉스 U',
        category: 'consumable',
        rarity: 'uncommon',
        icon: '💊',
        price: 1000,
        dailyLimit: 5,
        instantUsable: true,
        desc: '필수 비타민과 미네랄이 집약된 영양제. 피로 누적을 방지하고 회복력을 끌어올립니다.',
        effects: ['🛡️ 120분간 [회복력] +2 Bonus', '⚡ 알바 시 스테미너 소모량 -15%'],
        linkedStock: { id: 'FORESTLAB', name: '포레스트 랩', note: '포레스트 랩 정품 납품' }
    },

    // 2. 주간 특수 매대 (Weekly Shelf)
    {
        id: 'item_logistics_quickpass_1d',
        tab: 'weekly',
        name: '비트 물류 퀵-패스 (1일)',
        category: 'consumable',
        rarity: 'uncommon',
        icon: '🎫',
        price: 1500,
        dailyLimit: 1,
        instantUsable: false,
        desc: '하루 동안 번거로운 상하차 미니게임 없이 최고 등급(S급) 정산과 급여를 즉시 수령합니다.',
        effects: ['⚡ 비트 물류 노동 1회 즉시 완료 (S급 보장)', '💰 위탁 수수료 0% 감면'],
        linkedStock: null
    },
    {
        id: 'item_logistics_quickpass_7d',
        tab: 'weekly',
        name: '비트 물류 퀵-패스 (7일 프리미엄)',
        category: 'consumable',
        rarity: 'rare',
        icon: '🎟️',
        price: 8000,
        dailyLimit: 1,
        instantUsable: false,
        desc: '7일간 비트 물류 노동을 원클릭 즉시 완료하며 수수료를 전액 면제받는 VIP 패스권.',
        effects: ['📅 7일간 비트 물류 프리패스 (일일 1회)', '💎 노동 정산 골드 +20% 추가 보너스'],
        linkedStock: null
    },
    {
        id: 'item_weekly_drink_ration',
        tab: 'weekly',
        name: '주간 드링크 정기 배급권 (7일)',
        category: 'consumable',
        rarity: 'rare',
        icon: '📦',
        price: 3000,
        dailyLimit: 1,
        instantUsable: false,
        desc: '비비안 상점의 특제 에너지 드링크를 매일 아침 오피스 메일함으로 직배송해 주는 정기 구독권.',
        effects: ['💌 7일간 매일 00:00 드링크 1캔 자동 배송', '💰 단품 대비 15% 할인 혜택'],
        linkedStock: { id: 'MORNINGBREW', name: '모닝 브루', note: '모닝 브루 정기 구독 납품' }
    },

    // 3. 비밀 매대 (Secret Shelf)
    {
        id: 'item_black_swan_alarm',
        tab: 'secret',
        name: '블랙 스완 조기 경보기',
        category: 'etc',
        rarity: 'legendary',
        icon: '🚨',
        price: 20000,
        dailyLimit: 1,
        instantUsable: false,
        reqUnlock: { level: 2, conditionDesc: '누적 수익 10,000G 이상 & 폭락장 1회 생존' },
        desc: '딥웹 알고리즘이 시장 폭락 전조 징후를 감지하여 24시간 전부터 경보 카운트다운을 울립니다.',
        effects: ['🚨 [블랙 스완] 폭락 발생 24시간 전 카운트다운 표시', '🛡️ 사전 리스크 헷지 알림 활성화'],
        linkedStock: null
    },
    {
        id: 'item_caffeine_shot',
        tab: 'secret',
        name: '초고농축 카페인 앰플',
        category: 'consumable',
        rarity: 'epic',
        icon: '🧪',
        price: 2500,
        dailyLimit: 1,
        instantUsable: true,
        reqUnlock: { level: 3, conditionDesc: '신뢰도 Lv.3 + 누적 수익 20,000G' },
        desc: '비비안의 개인 비밀 연구실에서 증류된 초고순도 각성 앰플. 즉각적인 폭발력을 냅니다.',
        effects: ['💖 스테미너 하트 2칸 즉시 완충', '🎯 당일 체결 수수료 10% 추가 감면'],
        linkedStock: { id: 'FORESTLAB', name: '포레스트 랩', note: '고순도 농축 바이오 앰플' }
    },
    {
        id: 'item_darknet_key',
        tab: 'secret',
        name: '다크넷 마스터 해독키',
        category: 'intel',
        rarity: 'epic',
        icon: '🗝️',
        price: 4000,
        dailyLimit: 1,
        instantUsable: true,
        reqUnlock: { level: 2, conditionDesc: '분석 스탯 Lv.5 + 찌라시 해독 10회' },
        desc: '모든 암호화된 기사와 찌라시 텍스트의 모자이크를 100% 완전 무결하게 복원합니다.',
        effects: ['✨ 모든 찌라시/루머 모자이크 100% 영구 복원', '📊 루머 타겟 종목 및 상승 폭 확정 명시'],
        linkedStock: null
    },
    {
        id: 'item_gas_mask',
        tab: 'secret',
        name: '디지털 방독면 (방화벽)',
        category: 'apparel',
        rarity: 'rare',
        icon: '🎭',
        price: 10000,
        dailyLimit: 1,
        instantUsable: false,
        reqUnlock: { level: 1, conditionDesc: '신뢰도 Lv.2 달성' },
        desc: '폭락장의 패닉 셀 노이즈와 글리치 왜곡을 차단하여 차트의 진짜 저점을 식별하게 합니다.',
        effects: ['🛡️ [블랙 스완] 차트 가독성 70% 복구', '📈 왜곡된 호가창 정상 틱 표시'],
        linkedStock: null
    },

    // 4. 서점 위탁 코너 (Books)
    {
        id: 'item_book_candlestick',
        tab: 'books',
        name: '캔들스틱 차트 마스터북',
        category: 'book',
        rarity: 'rare',
        icon: '📖',
        price: 3500,
        dailyLimit: 1,
        instantUsable: true,
        desc: '월스트리트 전설의 트레이더들이 집대성한 캔들 패턴과 지지/저항선 완벽 해설서.',
        effects: ['📘 영구 스탯: [분석력] +1', '💡 차트 내 지지/저항선 가이드라인 투영'],
        linkedStock: null
    },
    {
        id: 'item_book_risk_management',
        tab: 'books',
        name: '자금 관리의 정석 (Risk Control)',
        category: 'book',
        rarity: 'rare',
        icon: '📕',
        price: 4500,
        dailyLimit: 1,
        instantUsable: true,
        desc: '포트폴리오 비중 조절과 분할 매수/매도로 어떤 하락장에서도 살아남는 자금 관리법.',
        effects: ['📕 영구 스탯: [운용력] +1', '💰 파산 리스크 방어율 +10%'],
        linkedStock: null
    },
    {
        id: 'item_book_mindset',
        tab: 'books',
        name: '트레이더의 멘탈 수양록',
        category: 'book',
        rarity: 'uncommon',
        icon: '📗',
        price: 3000,
        dailyLimit: 1,
        instantUsable: true,
        desc: '공포와 탐욕을 다스리고 냉철한 결정을 내릴 수 있도록 돕는 심리 훈련 교본.',
        effects: ['📗 영구 스탯: [회복력] +1', '💖 일일 스테미너 최대치 +0.5'],
        linkedStock: null
    }
];

export const VIVIAN_DIALOGUES = {
    greet: [
        '증시라는 전쟁터로 다시 들어가시려고요? 제대로 된 보급 없이는 1분도 못 버티고 깡통 차게 될 텐데요.',
        '어서 와요. 오늘의 일일 보급품이 막 도착했습니다. 마진콜 당하기 전에 챙겨두시죠.',
        '차트 보느라 눈이 충혈됐군요. 몬스터 에너지 드링크 한 캔 마시고 정신 차려요.'
    ],
    consume: [
        '뉴로-부스터와 에너지 드링크요? 뇌세포를 가불해서 쓰는 거지만... 뭐, 수익만 난다면 남는 장사 아니겠어요?',
        '기력 회복엔 이게 직효죠. 마시고 곧바로 비트 물류나 증권사로 달려가세요!'
    ],
    hardware: [
        '제 물건들은 단순한 장비가 아니라 당신의 생존 확률 그 자체입니다. 제대로 무장하고 나가시죠.',
        '데이터 해독기와 방독면... 혹시 큰 변동성을 노리고 계신가요? 탁월한 선택입니다.'
    ],
    secret: [
        '쉿... 이건 아무한테나 보여주는 물건이 아니에요. 당신의 트레이딩 실적을 보고 특별히 열어드리는 겁니다.',
        '비밀 매대의 아이템들은 블랙 스완과 폭락장에서도 당신의 시드를 지켜줄 비장의 카드죠.'
    ],
    done: [
        '보급은 끝났습니다. 이제 나가서 그 숫자 조각들이나 잔뜩 긁어모아 오시죠.',
        '좋은 거래였습니다. 매일 00시에 새 보급품이 들어오니 내일 또 들르세요.'
    ],
    poor: [
        '여긴 자선 단체가 아니에요. 빈손으로 올 거면 차라리 관리소장 박씨한테 가서 몸이라도 쓰시든가요.',
        '골드가 부족하군요. 비트 물류에서 상하차라도 뛰고 오시는 게 어때요?'
    ],
    talk: [
        '잡화점 팁: 우리 가게에서 물건을 많이 사면, 납품사인 [모닝 브루]와 [포레스트 랩]의 매출이 올라서 주가도 뛴다는 소문이 있어요.',
        '비밀 매대를 열고 싶다면 꾸준히 수익을 내고 저와의 신뢰도를 쌓아보세요.',
        '요즘 마을 펍이 폐쇄되고 증권사 아레나 쪽으로 사람들이 몰리더군요. 정보의 출처를 잘 가려야 합니다.'
    ]
};
