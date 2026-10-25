export const SAVE_KEY = 'stockwars.exhibition.first-day.v1';
// Exhibition balancing only. These are not the long-term economy specification.
export const EXHIBITION = Object.freeze({ wage: 500, pot: 100, loan: 5000, grant: 2000 });
export function freshState() {
    return { version: 1, cursor: 0, tourDialogueVersion: 1, clothingStoreRemoved: true, nickname: '', order: 'packing', cash: 0, debt: 0,
        shares: [], trades: [], flags: {}, analysis: 1, answers: [] };
}
export function loadState(storage) {
    try {
        const s = JSON.parse(storage.getItem(SAVE_KEY));
        if (s?.version !== 1 || !Number.isInteger(s.cursor) || s.cursor < 0
            || !Number.isFinite(s.cash) || s.cash < 0 || !Array.isArray(s.shares)
            || !Array.isArray(s.trades) || !s.flags || typeof s.flags !== 'object'
            || typeof s.nickname !== 'string' || !['packing', 'stock'].includes(s.order)) return null;
        return s;
    } catch { return null; }
}
export function persist(storage, state) { storage.setItem(SAVE_KEY, JSON.stringify(state)); }
export function complete(state, id, data = {}) {
    if (state.flags[id]) return false;
    const f = state.flags;
    if (id === 'loan') { if (!f.bank) return false; state.cash += EXHIBITION.loan; state.debt = EXHIBITION.loan; }
    if (id === 'wage') { if (!f.packing) return false; state.cash += EXHIBITION.wage; }
    if (id === 'envelope' && !f.wage) return false;
    if (id === 'certificate') {
        if (!f.bank || state.answers.length !== 3) return false;
        const correct = state.answers.filter((a, i) => a === [2, 1, 3][i]).length;
        state.analysis = correct === 3 ? 3 : correct === 2 ? 2 : 1;
    }
    if (id === 'trade') {
        if (!f.certificate || !Number.isFinite(data.price) || data.price <= 0 || data.price > state.cash) return false;
        state.cash -= data.price;
        state.shares.push({ id: data.id, name: data.name, price: data.price, quantity: 1 });
        state.trades.push({ ...data, quantity: 1, side: 'buy' });
    }
    if (id === 'cookie' && !(f.trade && f.packing && f.rumor)) return false;
    if (id === 'grant') { if (!f.cookie) return false; state.cash += EXHIBITION.grant; }
    if (id === 'pot') { if (!f.grant || state.cash < EXHIBITION.pot) return false; state.cash -= EXHIBITION.pot; }
    if (id === 'planted' && !f.pot) return false;
    if (id === 'diaryWritten' && !f.planted) return false;
    if (id === 'asleep' && !(f.diaryWritten && f.planted && f.trade && f.packing)) return false;
    f[id] = true;
    return true;
}
export function assets(state) { return state.cash + state.shares.reduce((sum, s) => sum + s.price * s.quantity, 0); }
