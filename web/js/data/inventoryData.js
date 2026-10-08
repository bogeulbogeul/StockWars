/**
 * Inventory Data & Default Item Registry (Consumables, Apparel, Books, Intel)
 * Defines item categories, rarities, and default player starting inventory items.
 * (Note: Furniture items are managed separately in furnitureData.js & FurnitureEditModal)
 */

import { ADDITIONAL_RUMORS } from './additionalRumors.js';
import { ORDINARY_RUMORS } from './ordinaryRumors.js';
import { RUMOR_BALANCE, RUMOR_RARITY_OVERRIDES } from './rumorBalance.js';

export const ITEM_CATEGORIES = {
    all: { key: 'all', name: '전체', icon: '📦' },
    consumable: { key: 'consumable', name: '소모품', icon: '🥤' },
    apparel: { key: 'apparel', name: '의상 / 코스튬', icon: '👗' },

    book: { key: 'book', name: '도서 / 지식', icon: '📚' },
    intel: { key: 'intel', name: '정보 / 찌라시', icon: '📜' },
    etc: { key: 'etc', name: '기타 / 재료', icon: '💎' }
};

export const ITEM_RARITIES = {
    common: { key: 'common', name: '일반', color: '#90a4ae', glow: 'rgba(144, 164, 174, 0.3)' },
    uncommon: { key: 'uncommon', name: '고급', color: '#00e676', glow: 'rgba(0, 230, 118, 0.4)' },
    rare: { key: 'rare', name: '희귀', color: '#00e5ff', glow: 'rgba(0, 229, 255, 0.5)' },
    epic: { key: 'epic', name: '영웅', color: '#d500f9', glow: 'rgba(213, 0, 249, 0.5)' },
    legendary: { key: 'legendary', name: '전설', color: '#ffd600', glow: 'rgba(255, 214, 0, 0.6)' }
};

export const DEFAULT_INVENTORY_ITEMS = [];

export const ITEM_CATALOG_DB = [
    ...ADDITIONAL_RUMORS,
    ...ORDINARY_RUMORS,
    {
        id: 'item_energy_drink',
        name: '에너지 드링크',
        category: 'consumable',
        rarity: 'common',
        icon: '🥤',
        quantity: 2,
        maxStack: 99,
        price: 500,
        desc: '고카페인과 타우린이 함유된 국민 에너지 드링크. 찌뿌둥한 몸을 깨워 즉시 활력을 불어넣습니다.',
        effects: ['❤️ 스테미너 하트 1칸 즉시 회복', '⚡ 일일 노동/알바 즉시 가능'],
        actionType: 'use',
        actionLabel: '사용하기'
    },
    {
        id: 'item_caffeine_shot',
        name: '초고농축 카페인',
        category: 'consumable',
        rarity: 'epic',
        icon: '🧪',
        quantity: 1,
        maxStack: 10,
        price: 2500,
        desc: '비비안 잡화점의 히든 레시피로 제조된 농축 앰플. 마시는 즉시 극도의 집중력과 활력을 제공합니다.',
        effects: ['❤️ 스테미너 하트 1칸 즉시 회복 (일일 1회)'],
        actionType: 'use',
        actionLabel: '사용하기'
    },
    {
        id: 'item_vitamin_complex',
        name: '비타민 컴플렉스',
        category: 'consumable',
        rarity: 'uncommon',
        icon: '💊',
        quantity: 3,
        maxStack: 50,
        price: 3000,
        desc: '필수 비타민과 미네랄이 집약된 영양제. [회복력] 보너스와 함께 스테미너 소모량을 줄여줍니다.',
        effects: ['🛡️ 120분간 [회복력] +2 Bonus', '⚡ 스테미너 소모량 감소'],
        actionType: 'use',
        actionLabel: '사용하기'
    },
    {
        id: 'item_trader_suit',
        name: '네오 슬림 트레이더 슈트',
        category: 'apparel',
        rarity: 'rare',
        icon: '👔',
        quantity: 1,
        maxStack: 1,
        price: 8500,
        desc: '테일러드 의상실에서 맞춤 제작한 하이엔드 트레이더 정장. 냉철한 판단력과 전문성을 돋보이게 합니다.',
        effects: ['👔 트레이더 품격 상승', '📈 주식 매수 체결 성공률 보정'],
        isEquipped: true,
        actionType: 'equip',
        actionLabel: '장착 해제'
    },
    {
        id: 'item_cyber_goggles',
        name: '사이버 틱 차트 고글',
        category: 'apparel',
        rarity: 'epic',
        icon: '🥽',
        quantity: 1,
        maxStack: 1,
        price: 18000,
        desc: '실시간 호가창 틱 데이터와 이동평균선이 망막에 직접 투영되는 최첨단 트레이딩 고글.',
        effects: ['👁️ 호가창 체결 틱 알림 가시화', '⚡ 급등주 포착 반응속도 +15%'],
        isEquipped: false,
        actionType: 'equip',
        actionLabel: '장착하기'
    },
    {
        id: 'item_gold_watch',
        name: '골드 크로노그래프 워치',
        category: 'apparel',
        rarity: 'legendary',
        icon: '⌚',
        quantity: 1,
        maxStack: 1,
        price: 55000,
        desc: '펜트하우스 트레이더를 상징하는 18K 순금 시계. 초단타 스캘핑 시 정밀한 틱 매매 타이밍을 잡아냅니다.',
        effects: ['✨ 트레이더 럭셔리 +50', '⏳ 틱 캔들 분석 시간 2배 보정'],
        isEquipped: false,
        actionType: 'equip',
        actionLabel: '장착하기'
    },
    {
        id: 'item_bit_logistics_rumor',
        name: '비트 물류 현장 찌라시',
        category: 'intel',
        rarity: 'rare',
        icon: '📜',
        quantity: 1,
        maxStack: 5,
        price: 2000,
        targetStockId: 'CLOUDBERRY',
        targetStockName: '클라우드 베리',
        targetSector: 'IT/기술',
        targetChange: '+18.5% ~ +25.0% 급등 예상',
        targetTimeframe: '내일(Day +1) 장중 공시 반영',
        intelReport: '비트 물류 3번 허브에서 [클라우드 베리]의 차세대 분산 데이터 서버 부품이 전량 독점 출하되는 현장을 포착했습니다. 정부 스마트시티 인프라 단독 납품 계약이 확정적이며, 내일 공시 발표와 함께 주가가 +20% 이상 폭등할 것이 확실시됩니다!',
        desc: '[클라우드 베리] IT 부품 독점 출하 포착. 정부 스마트시티 수주 공시 임박 및 주가 급등 복선.',
        effects: [
            '🎯 대상 기업: 클라우드 베리 (CLOUDBERRY • IT/기술)',
            '📈 주가 예측: 단기 +20% 상승 탄력 (목표가 1,020G 돌파)',
            '💡 추천 전략: 내일 장 개장 즉시 적극 매수(BUY) 권장'
        ],
        actionType: 'read',
        actionLabel: '확인하기'
    },
    {
        id: 'item_bionics_rumor',
        name: '바이오닉스 임상 3상 찌라시',
        category: 'intel',
        rarity: 'epic',
        icon: '📜',
        quantity: 1,
        maxStack: 5,
        price: 12000,
        targetStockId: 'BIONICS',
        targetStockName: '바이오닉스',
        targetSector: '바이오/제약',
        targetChange: '+30.0% 이상 상한가 폭등',
        targetTimeframe: '2일 뒤 글로벌 바이오 포럼',
        intelReport: '미드나잇 펍의 정보 브로커 안드레에게 입수한 극비 첩보입니다. [바이오닉스]가 개발 중인 3세대 인공 신경 이식 기술이 글로벌 임상 3상을 완벽하게 통과했습니다. 2일 뒤 해외 학회 발표와 함께 상한가 직행이 예정되어 있으니 미리 물량을 선점하세요.',
        desc: '[바이오닉스] 인공 신경 임상 3상 극비 통과. 글로벌 학회 발표 시 상한가 폭등 복선.',
        effects: [
            '🎯 대상 기업: 바이오닉스 (BIONICS • 바이오/제약)',
            '📈 주가 예측: 2일 뒤 +30% 상한가 폭등',
            '💡 추천 전략: 발표 전 저점 분할 매수 후 고점 차익 실현'
        ],
        actionType: 'read',
        actionLabel: '확인하기'
    },
    {
        id: 'item_ecobattery_rumor',
        name: '에코 배터리 수주 찌라시',
        category: 'intel',
        rarity: 'rare',
        icon: '📜',
        quantity: 1,
        maxStack: 5,
        price: 2200,
        targetStockId: 'ECOBATTERY',
        targetStockName: '에코 배터리',
        targetSector: '에너지/친환경',
        targetChange: '+15.0% ~ +22.0% 상승 예상',
        targetTimeframe: '2일 뒤 글로벌 모빌리티 엑스포',
        intelReport: '글로벌 완성차 메이커 1위 업체와의 차세대 전고체 배터리 5조 원 독점 공급 계약 비공개 체결 소식 포착! 엑스포 개막 발표와 함께 강력한 주가 상승 탄력이 예상됩니다.',
        desc: '[에코 배터리] 전고체 배터리 5조 원 납품 계약 체결 임박. 친환경 에너지 대장주 급등 복선.',
        effects: [
            '🎯 대상 기업: 에코 배터리 (ECOBATTERY • 에너지/친환경)',
            '📈 주가 예측: 2일 내 +20% 가파른 상승 탄력',
            '💡 추천 전략: 조정 눌림목 시 저점 매수 권장'
        ],
        actionType: 'read',
        actionLabel: '확인하기'
    },
    {
        id: 'item_studioluna_rumor',
        name: '스튜디오 루나 사전예약 찌라시',
        category: 'intel',
        rarity: 'rare',
        icon: '📜',
        quantity: 1,
        maxStack: 5,
        price: 2500,
        targetStockId: 'STUDIOLUNA',
        targetStockName: '스튜디오 루나',
        targetSector: '엔터/미디어',
        targetChange: '+20.0% ~ +28.0% 폭등 예상',
        targetTimeframe: '내일 신작 글로벌 출시일',
        intelReport: '비공개 신작 서브컬처 RPG 사전 예약자가 350만 명을 돌파했습니다! 구글/스토어 글로벌 매출 1위 랭크가 유력하여 출시 당일 급폭등 모멘텀이 기대됩니다.',
        desc: '[스튜디오 루나] 신작 글로벌 사전예약 350만 돌파. 스토어 1위 및 어닝 서프라이즈 복선.',
        effects: [
            '🎯 대상 기업: 스튜디오 루나 (STUDIOLUNA • 엔터/미디어)',
            '📈 주가 예측: 신작 출시 당일 +25% 급등 모멘텀',
            '💡 추천 전략: 출시 전 장 초반 강력 매수 권장'
        ],
        actionType: 'read',
        actionLabel: '확인하기'
    },
    {
        id: 'item_cozypay_rumor',
        name: '코지 페이 지분 교환 찌라시',
        category: 'intel',
        rarity: 'epic',
        icon: '📜',
        quantity: 1,
        maxStack: 5,
        price: 3500,
        targetStockId: 'COZYPAY',
        targetStockName: '코지 페이',
        targetSector: '금융/핀테크',
        targetChange: '+25.0% 이상 폭등 예상',
        targetTimeframe: '3일 뒤 금융위원회 발표',
        intelReport: '상업 은행 1위 세이프 뱅크와의 메가 핀테크 지분 교환 합작법인 출범 비공개 합의! 양사 인프라 통합으로 간편결제 시장 점유율 60%를 독점할 것이 확실시됩니다.',
        desc: '[코지 페이] 상업 은행 1위와의 지분 교환 및 핀테크 유니콘 결성 극비 첩보.',
        effects: [
            '🎯 대상 기업: 코지 페이 (COZYPAY • 금융/핀테크)',
            '📈 주가 예측: 3일 내 +25% 이상 강한 폭등 탄력',
            '💡 추천 전략: 공시 발표 전 물량 매집 권장'
        ],
        actionType: 'read',
        actionLabel: '확인하기'
    },
    {
        id: 'item_chart_book',
        name: '실전 차트 패턴 분석 101',
        category: 'book',
        rarity: 'common',
        icon: '📖',
        quantity: 1,
        maxStack: 1,
        price: 3000,
        desc: '데이터 잉크 서점의 사서 소피아가 추천하는 주식 투자 기초 입문서.',
        effects: ['🧠 [분석력] 스탯 영구 +1', '📚 속독 시 스테미너 1칸 소모'],
        actionType: 'read',
        actionLabel: '사용하기'
    }
];

for (const item of ITEM_CATALOG_DB.filter(item => item.category === 'intel' && item.targetStockId)) {
    item.rarity = RUMOR_RARITY_OVERRIDES[item.id] || item.rarity;
    item.price = RUMOR_BALANCE[item.rarity].price;
}

export function getRandomRumorItem(random = Math.random) {
    const rumors = ITEM_CATALOG_DB.filter(i => i.category === 'intel');
    const roll = random() * 100;
    let cumulative = 0;
    const rarity = Object.entries(RUMOR_BALANCE).find(([, balance]) => {
        cumulative += balance.weight;
        return roll < cumulative;
    })?.[0] || 'legendary';
    const pool = rumors.filter(item => item.rarity === rarity);
    const item = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
    return {
        ...JSON.parse(JSON.stringify(item)),
        quantity: 1,
        actionType: 'read',
        actionLabel: '확인하기'
    };
}
