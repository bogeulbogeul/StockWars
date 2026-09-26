/**
 * Furniture Data & 8x8 Office Housing Catalog
 * GDD Reference: [MOD_GDD_03_2] Julian Furniture & 8x8 Room Specification
 */

export const FURNITURE_CATEGORIES = {
    all: { key: 'all', name: '전체', icon: '🛋️' },
    desk_chair: { key: 'desk_chair', name: '책상 & 의자', icon: '🪑' },
    bed_relax: { key: 'bed_relax', name: '침대 & 휴식', icon: '🛏️' },
    decor: { key: 'decor', name: '조명 & 데코', icon: '💡' },
    storage_wall: { key: 'storage_wall', name: '수납 & 벽장식', icon: '🚪' },
    skin: { key: 'skin', name: '벽지 & 바닥', icon: '🎨' }
};

export const FURNITURE_THEMES = {
    ModernDark: { name: '모던 다크', color: '#00e5ff', icon: '💻' },
    RetroArcade: { name: '레트로 아케이드', color: '#ff007f', icon: '👾' },
    PenthouseGold: { name: '펜트하우스 골드', color: '#ffd600', icon: '✨' },
    NaturalWood: { name: '내추럴 우드', color: '#a1887f', icon: '🪵' }
};

export const DEFAULT_FURNITURE_CATALOG = [
    {
        id: 'furn_classic_desk',
        name: '사이버 트레이더 모션 데스크',
        category: 'desk_chair',
        theme: 'ModernDark',
        scale: 'M',
        sizeW: 2,
        sizeH: 2,
        icon: '🖥️',
        price: 15000,
        desc: '트리플 모니터 암과 실시간 호가창 틱 차트가 장착된 8x8 오피스 핵심 워크스테이션.',
        buffs: ['📊 주식 매매 체결 딜레이 20% 단축', '⚡ 데스크탑 분석 효율 +15%'],
        placed: true,
        gridX: 2,
        gridY: 2,
        rotation: 0
    },
    {
        id: 'furn_gaming_chair',
        name: '컴포트 오피스 게이밍 체어',
        category: 'desk_chair',
        theme: 'ModernDark',
        scale: 'S',
        sizeW: 1,
        sizeH: 1,
        icon: '🪑',
        price: 8000,
        desc: '장시간 모니터링에도 피로를 최소화하는 인체공학적 트레이더 체어.',
        buffs: ['❤️ 스테미너 회복 효율 +10%', '☕ 피로 누적 속도 감소'],
        placed: true,
        gridX: 3,
        gridY: 1,
        rotation: 0
    },
    {
        id: 'furn_wood_bed',
        name: '포근한 네온 킹 사이즈 베드',
        category: 'bed_relax',
        theme: 'ModernDark',
        scale: 'M',
        sizeW: 2,
        sizeH: 3,
        icon: '🛏️',
        price: 25000,
        desc: '오피스 내에서 숙면을 취해 모든 스테미너 하트를 즉시 완충시키는 최고급 침대.',
        buffs: ['💖 수면 시 모든 하트(3/3) 즉시 완충', '🌟 일일 첫 로그인 시 행운 버프'],
        placed: true,
        gridX: 5,
        gridY: 4,
        rotation: 0
    },
    {
        id: 'furn_heart_lamp',
        name: '도트 하트 미니 무드등',
        category: 'decor',
        theme: 'RetroArcade',
        scale: 'S',
        sizeW: 1,
        sizeH: 1,
        icon: '💖',
        price: 2500,
        desc: '픽셀 하트가 은은한 핑크빛으로 반짝이는 1x1 미니 인테리어 조명.',
        buffs: ['✨ 오피스 스트레스 지수 -10%', '🏠 인테리어 점수 +15'],
        placed: true,
        gridX: 1,
        gridY: 5,
        rotation: 0
    },
    {
        id: 'furn_storage_cabinet',
        name: '시공 대형 데이터 수납장',
        category: 'storage_wall',
        theme: 'ModernDark',
        scale: 'S',
        sizeW: 2,
        sizeH: 1,
        icon: '🗄️',
        price: 6000,
        desc: '각종 주식 분석 보고서 및 소모품을 넉넉하게 보관할 수 있는 수납장.',
        buffs: ['📦 인벤토리 보관 슬롯 +10칸 확장'],
        placed: false,
        gridX: null,
        gridY: null,
        rotation: 0
    },
    {
        id: 'furn_penthouse_sofa',
        name: '펜트하우스 럭셔리 소파',
        category: 'bed_relax',
        theme: 'PenthouseGold',
        scale: 'M',
        sizeW: 3,
        sizeH: 1,
        icon: '🛋️',
        price: 35000,
        desc: 'VIP 고객 영접 및 휴식을 위한 금빛 스티치 가죽 소파.',
        buffs: ['☕ 휴식 시 기력 회복 속도 1.5배', '✨ NPC 방문 호감도 보너스'],
        placed: false,
        gridX: null,
        gridY: null,
        rotation: 0
    },
    {
        id: 'furn_monstera_plant',
        name: '사이버 네온 몬스테라 화분',
        category: 'decor',
        theme: 'NaturalWood',
        scale: 'S',
        sizeW: 1,
        sizeH: 1,
        icon: '🪴',
        price: 3500,
        desc: '실내 공기를 정화하고 삭막한 트레이딩 룸에 생기를 불어넣는 화분.',
        buffs: ['🌿 멘탈 안정 및 피로도 5% 경감'],
        placed: false,
        gridX: null,
        gridY: null,
        rotation: 0
    },
    {
        id: 'furn_server_rack',
        name: '초고속 데이터 서버 랙',
        category: 'storage_wall',
        theme: 'ModernDark',
        scale: 'M',
        sizeW: 2,
        sizeH: 2,
        icon: '🖲️',
        price: 45000,
        desc: '전 종목 실시간 틱 데이터와 퀀트 알고리즘을 연산하는 독립 서버 랙.',
        buffs: ['📈 프로그램 매매 자동 체결 활성화', '⚡ 찌라시 입수 확률 +20%'],
        placed: false,
        gridX: null,
        gridY: null,
        rotation: 0
    }
];
