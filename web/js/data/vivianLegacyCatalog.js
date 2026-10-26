// Historical definitions support owned items, vending and deliveries; never a shop sale list.
export const VIVIAN_LEGACY_CATALOG = [
    // 1. 일일 보급 매대 (Daily Shelf)
    {
        id: 'item_energy_drink',
        tab: 'daily',
        name: '에너지 드링크',
        category: 'consumable',
        rarity: 'common',
        icon: '🥤',
        price: 500,
        dailyLimit: 2,
        instantUsable: true,
        desc: '고농축 타우린과 카페인이 함유된 국민 에너지 드링크. 찌뿌둥한 피로를 날려버립니다.',
        effects: ['❤️ 하트 1개 즉시 회복', '⚡ 공통 최대 하트 3개'],
        linkedStock: { id: 'MORNINGBREW', name: '모닝브루', note: '소비 시 모닝브루 실적 기여' }
    },
    {
        id: 'item_premium_rumor',
        tab: 'daily',
        name: '유료 찌라시 (Premium)',
        category: 'intel',
        rarity: 'rare',
        icon: '📜',
        price: 2000,
        instantUsable: false,
        desc: '다크넷 정보원과 증권가 브로커가 은밀히 교환한 신뢰도 높은 기업 내부 루머.',
        effects: ['🔍 신뢰도 높은 정보 — 찌라시 해독률 50% 보장'],
        linkedStock: null
    },
    {
        id: 'item_crypto_decoder',
        tab: 'daily',
        name: '암호 해독기',
        category: 'intel',
        rarity: 'uncommon',
        icon: '💻',
        price: 1200,
        instantUsable: true,
        desc: '찌라시의 비유와 은어를 더 구체적인 단서로 풀어주는 소형 도구. 보관함에서 확인하기를 눌러 열람한 찌라시 한 건을 선택하면 해석 단계가 1 올라가며 해당 정보에 유지됩니다. 분석력 자체와 정보의 진위는 바뀌지 않습니다.',
        effects: ['🔎 열람 찌라시 1건 해석 +1단계 (최대 5)', '📌 해당 정보에 유지 · 진위 보장 없음'],
        linkedStock: { id: 'CLOUDBERRY', name: '베리클라우드', note: '분산 암호 인프라 부품 사용' }
    },
    {
        id: 'item_focus_pill',
        tab: 'daily',
        name: '각성제 (Focus Pill)',
        category: 'consumable',
        rarity: 'uncommon',
        icon: '💊',
        price: 3000,
        instantUsable: true,
        desc: '뇌세포의 집중도를 극대화하여 차트의 글리치와 미세 체결 틱을 감지하는 알약.',
        effects: ['🧠 120분간 [분석력] +2 Bonus', '👁️ 글리치 감지 강화'],
        linkedStock: { id: 'FORESTLAB', name: '포레바이오', note: '천연 바이오 농축액 납품' }
    },
    {
        id: 'item_stabilizer',
        tab: 'daily',
        name: '안정제 (Stabilizer)',
        category: 'consumable',
        rarity: 'uncommon',
        icon: '🧪',
        price: 3000,
        instantUsable: true,
        desc: '극심한 변동성 속에서도 심박수를 안정시켜 뇌동매매를 방지하는 신경안정제.',
        effects: ['사용 종료 · 보유 기록 보존'],
        linkedStock: { id: 'FORESTLAB', name: '포레바이오', note: '포레바이오 바이오 성분' }
    },
    {
        id: 'item_vitamin_complex',
        tab: 'daily',
        name: '비타민 컴플렉스',
        category: 'consumable',
        rarity: 'uncommon',
        icon: '💊',
        price: 3000,
        instantUsable: true,
        desc: '이전 능력치 강화 상품입니다. 사용은 종료되었으며 보유 기록은 유지됩니다.',
        effects: ['사용 종료 · 보유 기록 보존'],
        linkedStock: { id: 'FORESTLAB', name: '포레바이오', note: '포레바이오 정품 납품' }
    },

    // 2. 주간 특수 매대 (Weekly Shelf)
    {
        id: 'item_weekly_drink_ration',
        tab: 'weekly',
        name: '주간 드링크 배급권',
        category: 'consumable',
        rarity: 'rare',
        icon: '📦',
        price: 3000,
        instantUsable: false,
        desc: '봉봉 상점의 특제 에너지 드링크를 매일 아침 오피스 메일함으로 직배송해 주는 정기 구독권.',
        effects: ['💌 7일간 매일 드링크 1개 Mail 지급'],
        linkedStock: { id: 'MORNINGBREW', name: '모닝브루', note: '모닝브루 정기 구독 납품' }
    },

    {
        id: 'item_lotto_ticket',
        tab: 'weekly',
        name: '주간 로또',
        category: 'etc',
        rarity: 'common',
        icon: '🎟️',
        price: 1000, // Temporary demo price; not specified by the Lotto GDD.
        instantUsable: false,
        actionType: 'lotto',
        actionLabel: '번호·당첨 확인',
        desc: '구매 즉시 자동 번호 발급. 아이템 센터에서 판매 마감 전 번호를 직접 변경할 수 있습니다. 현재는 저장 파일별 로컬 데모 추첨이며 가격은 임시 1,000G입니다.',
        effects: ['🎲 1~45 중 서로 다른 6개 번호', '📅 토요일 21:00 추첨 (데모 시각 KST)', '🏆 6개 일치 시 1등, 미당첨 시 이월 · 토요일 19:00~21:05 판매 중지'],
        linkedStock: null
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
        instantUsable: false,
        reqUnlock: { profit: 10000, survivals: 1, conditionDesc: '수익 10,000G + 블랙 스완 1회 생존' },
        desc: '딥웹 알고리즘이 시장 폭락 전조 징후를 감지하여 24시간 전부터 경보 카운트다운을 울립니다.',
        effects: ['🚨 [블랙 스완] 발생 24시간 전부터 실시간 카운트다운 표시'],
        linkedStock: null
    },
    {
        id: 'item_caffeine_shot',
        tab: 'secret',
        name: '초고농축 카페인',
        category: 'consumable',
        rarity: 'epic',
        icon: '🧪',
        price: 2500,
        dailyLimit: 1,
        instantUsable: true,
        reqUnlock: { trustLevel: 3, profit: 20000, conditionDesc: '수익 20,000G + 신뢰 Lv.3' },
        desc: '봉봉의 개인 비밀 연구실에서 증류된 초고순도 각성 앰플. 즉각적인 폭발력을 냅니다.',
        effects: ['💖 하트 1개 즉시 회복 (일일 1회)'],
        linkedStock: { id: 'FORESTLAB', name: '포레바이오', note: '고순도 농축 바이오 앰플' }
    },
    {
        id: 'item_darknet_key',
        tab: 'secret',
        name: '다크넷 해독키',
        category: 'intel',
        rarity: 'epic',
        icon: '🗝️',
        price: 4000,
        instantUsable: true,
        reqUnlock: { analysisLevel: 5, decryptions: 50, conditionDesc: '분석 Lv.5 + 해독 50회' },
        desc: '모든 암호화된 기사와 찌라시 텍스트의 모자이크를 100% 완전 무결하게 복원합니다.',
        effects: ['✨ 암호화된 텍스트 100% 완벽 복원'],
        linkedStock: null
    },
    {
        id: 'item_gas_mask',
        tab: 'secret',
        name: '디지털 방독면',
        category: 'apparel',
        rarity: 'rare',
        icon: '🎭',
        price: 10000,
        instantUsable: false,
        desc: '폭락장의 패닉 셀 노이즈와 글리치 왜곡을 차단하여 차트의 진짜 저점을 식별하게 합니다.',
        effects: ['🛡️ [블랙 스완] 발생 시 차트 가독성 70% 복구'],
        linkedStock: null
    },
    {
        id: 'item_escape_capsule',
        tab: 'secret',
        name: '긴급 탈출 캡슐',
        category: 'consumable',
        rarity: 'rare',
        icon: '🛟',
        price: 5000,
        instantUsable: false,
        desc: '블랙 스완 대폭락 시 최적 지점에서 자동 손절하는 비상 도구.',
        effects: ['🛟 [블랙 스완] 대폭락 시 최적 지점 자동 손절'],
        linkedStock: null
    }
];

