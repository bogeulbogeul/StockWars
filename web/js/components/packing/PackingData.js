// Packing-only catalogue. Does not migrate shop IDs, inventory, or economy data.
export const PACKING_ITEMS = {
    A: { name: '꿀 쿠키', width: 2, height: 2, art: 0 },
    B: { name: '꽃잎 차', width: 2, height: 2, art: 1 },
    C: { name: '사과 주스', width: 1, height: 3, art: 2 },
    D: { name: '포포리빵', width: 3, height: 1, art: 3 },
    E: { name: '꽃꿀 베리 주스', width: 1, height: 2, art: 4 },
    F: { name: '허브 차', width: 2, height: 1, art: 5 },
    G: { name: '반짝가루', width: 1, height: 1, art: 6 },
    H: { name: '달빛가루', width: 1, height: 1, art: 7 },
    I: { name: '이슬 젤리', width: 1, height: 1, art: 8 },
    J: { name: '꽃꿀 사탕', width: 2, height: 1, art: 9 },
    // Separate instance of the same jelly, so two pieces can move independently.
    K: { name: '이슬 젤리', width: 1, height: 1, art: 8 }
};

export const PACKING_PATTERNS = [
    ['AAE', 'AAE', 'FFI'],
    ['AAE', 'AAE', 'DDD', 'GHI'],
    ['AABB', 'AABB', 'HIJJ'],
    ['AACG', 'AACI', 'BBCK', 'BBJJ'],
    ['AACEG', 'AACEH', 'IKCJJ'],
    ['AAC', 'AAC', 'BBC', 'BBG', 'HJJ'],
    ['AABBC', 'AABBC', 'EFFGC', 'EHIJJ'],
    ['AABB', 'AABB', 'CDDD', 'CGHI', 'CJJK'],
    ['AACE', 'AACE', 'BBCG', 'BBJJ'],
    ['AACEG', 'AACEH', 'FFCIK', 'DDDJJ'],
    ['BBE', 'BBE', 'FFH'],
    ['CDDD', 'CEFF', 'CEJJ'],
    ['BBC', 'BBC', 'GHC', 'IJJ'],
    ['AADDD', 'AAEGH', 'IKEJJ'],
    ['BBE', 'BBE', 'DDD', 'FFG', 'HJJ'],
    ['BBCG', 'BBCH', 'JJCI', 'DDDK'],
    ['AABB', 'AABB', 'CDDD', 'CFFH', 'CIJJ'],
    ['AABBC', 'AABBC', 'DDDEC', 'GJJEH'],
    ['AABB', 'AABB', 'CDDD', 'CFFG', 'CHIK'],
    ['AABBC', 'AABBC', 'DDDEC', 'IJJEK']
];

export const PACKING_GOAL = 5; // Playtest length, not an economic balance value.

export function shuffled(values, random = Math.random) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function createOrder(patternIndex, random = Math.random) {
    const rows = PACKING_PATTERNS[patternIndex];
    return {
        patternIndex, width: rows[0].length, height: rows.length,
        items: shuffled([...new Set(rows.join('').replaceAll('.', ''))], random)
            .map(id => {
                const item = PACKING_ITEMS[id];
                return { id, ...item, rotated: false, x: null, y: null };
            })
    };
}

export function createSession(random = Math.random) {
    // Mix compact and fuller orders, then shuffle; no difficulty progression.
    const ids = PACKING_PATTERNS.map((_, i) => i);
    const compact = shuffled(ids.filter(i => PACKING_PATTERNS[i].length * PACKING_PATTERNS[i][0].length <= 16), random).slice(0, 3);
    const fuller = shuffled(ids.filter(i => PACKING_PATTERNS[i].length * PACKING_PATTERNS[i][0].length > 16), random).slice(0, 2);
    const orders = shuffled([...compact, ...fuller], random).map(id => createOrder(id, random));
    return { orders, completed: 0, awaitingNext: false };
}
