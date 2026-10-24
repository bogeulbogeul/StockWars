import { VIVIAN_LEGACY_CATALOG } from './vivianLegacyCatalog.js';

// 2026-10-24: one continuous shelf. Prices adopt the 2026-10-22 draft.
const foods = [
    ['honey_cookie', '꿀 쿠키', '🍪'], ['petal_tea', '꽃잎 차', '🌸'],
    ['apple_juice', '사과 주스', '🍎'], ['popori_bread', '포포리빵', '🍞'],
    ['berry_juice', '꽃꿀 베리 주스', '🫐'], ['herb_tea', '허브 차', '🌿'],
    ['dew_jelly', '이슬 젤리', '🍮'], ['honey_candy', '꽃꿀 사탕', '🍬']
].map(([key, name, icon]) => ({
    id: `item_${key}`, name, icon, category: 'consumable', rarity: 'common',
    price: key === 'honey_cookie' ? 800 : 200, instantUsable: true, recoveryFood: true,
    ...(key === 'honey_cookie' ? { packSize: 4, purchaseUnit: '상자', inventoryName: '꿀 쿠키 4개입 세트' } : {}),
    desc: key === 'honey_cookie' ? '꿀 쿠키 4개입 한 상자예요. 가방에는 세트로 담기며 하나씩 꺼내 먹을 때마다 하트 1칸을 회복해요.' : `${name}. 잠시 쉬며 즐길 수 있는 포포리 마을의 먹거리예요.`,
    effects: key === 'honey_cookie' ? ['1상자 4개입 · 800잎', '낱개 1개 사용 시 하트 1칸 회복'] : ['하트 1칸 회복'], linkedStock: null
}));
const previous = id => VIVIAN_LEGACY_CATALOG.find(item => item.id === id);
export const VIVIAN_SHOP_CATALOG = [
    ...foods,
    { ...previous('item_crypto_decoder'), name: '별가루', price: 500, icon: '✨',
      desc: '열람한 찌라시 한 건을 골라 해석을 돕는 가루예요. 소문의 진위는 보장하지 않아요.',
      effects: ['선택한 찌라시 한 건의 해석 단계 +1'], linkedStock: null },
    { id: 'item_moon_powder', name: '달가루', price: 2000, icon: '🌙', category: 'intel', rarity: 'rare', instantUsable: true,
      desc: '선택한 찌라시 한 건을 분석력 MAX 기준으로 해석하는 가루예요. 플레이어의 분석력은 바뀌지 않으며 소문의 진위를 보장하지 않아요.',
      effects: ['찌라시 한 건을 분석력 MAX 기준으로 해석'], linkedStock: null },
    { ...previous('item_lotto_ticket'), price: 500,
      desc: '번호 6개가 발급되는 마을 로또예요. 번호 변경과 당첨 확인은 아이템 센터에서 할 수 있어요.' },
    { ...previous('item_premium_rumor'), name: '봉인된 소식 봉투', price: 1000, icon: '✉️',
      desc: '마을에 도착한 기업 소식을 담은 봉투예요. 열어 보아도 소문의 진위는 따로 확인해야 해요.',
      effects: ['봉투를 열어 기업 소식 확인'], actionType: 'use', actionLabel: '봉투 열기' }
].map(({ tab, reqUnlock, ...item }) => item);

// Preserve old ownership and use behavior without putting retired goods back on sale.
export const VIVIAN_ITEM_REGISTRY = [...new Map([...VIVIAN_LEGACY_CATALOG, ...VIVIAN_SHOP_CATALOG].map(item => [item.id, item])).values()];
export const VIVIAN_DIALOGUES = {
    greet: ['어서 와요. 선반에 물건들을 채워 두었어요. 천천히 둘러보세요.'],
    consume: ['잠깐 쉬어 가도 괜찮아요. 맛있게 드세요.'],
    hardware: ['찌라시 해석에는 별가루가 도움이 될 거예요. 소문의 진위는 따로 살펴보세요.'],
    secret: ['모든 판매 상품은 같은 선반에 있어요. 마음에 드는 물건을 골라 주세요.'],
    done: ['고마워요. 오늘도 좋은 하루 보내세요!'],
    poor: ['가진 잎에 맞춰 필요한 물건부터 골라 보세요.'],
    talk: ['달콤한 간식과 따뜻한 차를 준비했어요. 편하게 둘러보세요.']
};
