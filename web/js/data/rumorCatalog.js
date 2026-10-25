import { AUTHORED_RUMORS } from './authoredRumors.js';
import { RUMOR_BALANCE } from './rumorBalance.js';

// Preserve the existing rarity weights/prices. Rarity does not encode truth or returns.
export const AUTHORED_RUMOR_ITEMS = AUTHORED_RUMORS.map((event, index) => {
    const roll = (index * 37) % 100;
    let total = 0;
    const rarity = Object.keys(RUMOR_BALANCE).find(key => {
        total += RUMOR_BALANCE[key].weight;
        return roll < total;
    });
    return {
        ...event, id: event.rumorId, category: 'intel', icon: '📜', rarity,
        quantity: 1, maxStack: 1, price: RUMOR_BALANCE[rarity].price,
        rumorSchema: 3, interpretationLevel: 1,
        desc: '봉인된 현장 제보예요. 단서를 읽고 뉴스와 비교해 보세요.',
        intelReport: event.rumorStages[4], effects: ['자세한 해석도 진위나 수익을 보장하지 않아요.'],
        actionType: 'read', actionLabel: '열람하기'
    };
});

export function drawAuthoredRumor(random = Math.random, eligible = () => true) {
    const available = AUTHORED_RUMOR_ITEMS.filter(eligible);
    if (!available.length) return null;
    const rarities = Object.entries(RUMOR_BALANCE).filter(([key]) => available.some(item => item.rarity === key));
    const unit = () => Math.max(0, Math.min(0.999999999, Number(random()) || 0));
    const roll = unit() * rarities.reduce((sum, [, balance]) => sum + balance.weight, 0);
    let total = 0;
    const rarity = rarities.find(([, balance]) => { total += balance.weight; return roll < total; })[0];
    const pool = available.filter(item => item.rarity === rarity);
    return JSON.parse(JSON.stringify(pool[Math.floor(unit() * pool.length)]));
}
