export const COOKIE_ID = 'item_honey_cookie';
export function normalizeCookieSet(entry) {
    if (!entry || entry.id !== COOKIE_ID || entry.cookieSet) return;
    const count = entry.quantity;
    entry.quantity = Math.ceil(count / 4);
    entry.openedRemaining = (count - 1) % 4 + 1;
    entry.cookieSet = true;
    entry.name = '꿀 쿠키 4개입 세트';
    entry.price = 800;
    entry.actionLabel = '쿠키 1개 꺼내 먹기';
}
export function cookieCount(entry) { return (entry.quantity - 1) * 4 + entry.openedRemaining; }
export function eatCookie(inventory) {
    const entry = inventory.find(item => item.id === COOKIE_ID);
    if (!entry) return;
    entry.openedRemaining--;
    if (entry.openedRemaining === 0) {
        entry.quantity--;
        entry.openedRemaining = 4;
        if (!entry.quantity) inventory.splice(inventory.indexOf(entry), 1);
    }
}
export function cookiePresentation(item) {
    return { ...item, name: '꿀 쿠키 4개입 세트',
        desc: `${item.quantity}세트 보유 · 현재 세트 ${item.openedRemaining}/4개 남음 · 총 ${cookieCount(item)}개. 세트에서 쿠키를 하나씩 꺼내 먹어요.`,
        effects: ['쿠키 1개 꺼내 먹기 → 하트 1칸 회복'] };
}
