import { drawExamQuestionIds, examQuestions, EXAM_QUESTION_COUNT } from './Quiz.js';
import { signProfileDocument } from '../../components/phone/profile/ProfileData.js';
import { COMMON_PLAYER_RULES } from '../../engine/AbilityRetirement.js';

export const SAVE_KEY = 'stockwars.exhibition.first-day.v1';
// Exhibition balancing only. These are not the long-term economy specification.
export const EXHIBITION = Object.freeze({ wage: 300, pot: 100, loan: 5000, grant: 2000 });
export function freshState() {
    return { version: 1, cursor: 0, tourDialogueVersion: 4, clothingStoreRemoved: true, nickname: '', order: 'packing', cash: 0, debt: 0,
        shares: [], trades: [], flags: {}, stamina: COMMON_PLAYER_RULES.maxStamina,
        analysis: 1, answers: [], examQuestionIds: drawExamQuestionIds() };
}
export function loadState(storage) {
    try {
        const s = JSON.parse(storage.getItem(SAVE_KEY));
        if (s?.version !== 1 || !Number.isInteger(s.cursor) || s.cursor < 0
            || !Number.isFinite(s.cash) || s.cash < 0 || !Array.isArray(s.shares)
            || !Array.isArray(s.trades) || !s.flags || typeof s.flags !== 'object'
            || typeof s.nickname !== 'string' || !['packing', 'stock'].includes(s.order)) return null;
        if (!examQuestions(s)) return null;
        return s;
    } catch { return null; }
}
export function persist(storage, state) { storage.setItem(SAVE_KEY, JSON.stringify(state)); }
export function complete(state, id, data = {}) {
    if (state.flags[id]) return false;
    const f = state.flags;
    if (id === 'packing') state.stamina = Math.max(0,
        (state.stamina ?? COMMON_PLAYER_RULES.maxStamina) - COMMON_PLAYER_RULES.laborCost);
    if (id === 'loan') { if (!f.bank) return false; state.cash += EXHIBITION.loan; state.debt = EXHIBITION.loan; }
    if (id === 'wage') { if (!f.packing) return false; state.cash += EXHIBITION.wage; }
    if (id === 'envelope' && !f.wage) return false;
    if (id === 'certificate') {
        const questions = examQuestions(state);
        if (!f.bank || !questions || state.answers.length !== EXAM_QUESTION_COUNT) return false;
        const correct = state.answers.filter((a, i) => a === questions[i].answer).length;
        state.analysis = correct === EXAM_QUESTION_COUNT ? 2 : 1;
    }
    if (id === 'trade') {
        if (!f.certificate || !Number.isFinite(data.price) || data.price <= 0 || data.price > state.cash) return false;
        state.cash -= data.price;
        state.shares.push({ id: data.id, name: data.name, price: data.price, quantity: 1 });
        state.trades.push({ ...data, quantity: 1, side: 'buy' });
    }
    if (id === 'cookie' && !(f.trade && f.packing && f.rumor)) return false;
    if (id === 'cookie') state.stamina = Math.min(COMMON_PLAYER_RULES.maxStamina,
        (state.stamina ?? COMMON_PLAYER_RULES.maxStamina) + 1);
    if (id === 'grant') { if (!f.cookie) return false; state.cash += EXHIBITION.grant; }
    if (id === 'pot') { if (!f.grant || state.cash < EXHIBITION.pot) return false; state.cash -= EXHIBITION.pot; }
    if (id === 'planted' && !f.pot) return false;
    if (id === 'diaryWritten' && !f.planted) return false;
    if (id === 'asleep' && !(f.diaryWritten && f.planted && f.trade && f.packing)) return false;
    signProfileDocument(state, id);
    if (id === 'phone') f.phoneReady = true;
    f[id] = true;
    return true;
}
export function assets(state) { return state.cash + state.shares.reduce((sum, s) => sum + s.price * s.quantity, 0); }
