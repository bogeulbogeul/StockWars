import { initializePlayerGrowth, playerLevelProgress } from './PlayerGrowth.js';
import { migrateRumorStages } from './RumorStageMigration.js';
import { reduceRumorPowderValue } from './RumorPowderValue.js';
import { COMMON_PLAYER_RULES, RETIRED_ABILITY_ITEMS, preserveLegacyAbilities } from './AbilityRetirement.js';
import { initializeAnalysisGrowth, analysisProgress, beginInterpretationQuiz, submitInterpretationQuiz } from './AnalysisGrowth.js';
import { AUTHORED_RUMOR_ITEMS, drawAuthoredRumor } from '../data/rumorCatalog.js';
import { clampAnalysis, maxRumorLevel, rumorLevel, openAuthoredEnvelope } from './RumorInterpretation.js';
import { COOKIE_ID, normalizeCookieSet, eatCookie } from './CookieSets.js';
import { VIVIAN_SHOP_CATALOG, VIVIAN_ITEM_REGISTRY } from '../data/vivianStoreData.js';

export const DAY = 86400000;
export const ITEM_BALANCE = { buffMs: 120 * 60000, baseOrderLimit: 100, managementBonus: 0.1, quickGold: 560, quickExp: 70, swanDrop: 0.2, swanDuration: 60000 };
const catalog = new Map([...VIVIAN_ITEM_REGISTRY, ...AUTHORED_RUMOR_ITEMS].map(i => [i.id, i]));
const buffs = { item_focus_pill: 'analysis' };
const statNames = { analysis: '분석력' };
const fail = message => ({ success: false, message });
const ok = message => ({ success: true, message });
const kst = time => new Date(time + 9 * 3600000);
export const dayKey = time => kst(time).toISOString().slice(0, 10);
export function lottoClosed(time) {
    const d = kst(time), minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
    return d.getUTCDay() === 6 && minutes >= 1140 && minutes < 1265;
}
export function nextDraw(time) {
    const d = kst(time);
    const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - 9 * 3600000;
    let draw = midnight + ((6 - d.getUTCDay() + 7) % 7) * DAY + 21 * 3600000;
    if (draw <= time) draw += 7 * DAY;
    return draw;
}
export function validateNumbers(numbers) {
    return Array.isArray(numbers) && numbers.length === 6 && new Set(numbers).size === 6 && numbers.every(n => Number.isInteger(n) && n >= 1 && n <= 45);
}
function randomUnit() {
    if (globalThis.crypto?.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    return Math.random();
}

// Local demo simulation. No real-money purchase or server-wide lottery pool.
export class ItemEngine {
    constructor({ market, clock = Date.now, random = randomUnit, state, blackSwanEnabled = true } = {}) {
        this.market = market;
        this.blackSwanEnabled = blackSwanEnabled;
        this.clock = clock;
        this.random = random;
        this.state = state || {
            version: 1, offset: 0, lastNow: clock(), inventory: [], stamina: 3, affinity: 35,
            purchases: {}, purchaseDay: '', caffeineDay: '', buffs: {}, passUntil: 0,
            deliveries: [], mail: [], reports: [], nextId: 1, decryptions: 0, profit: 0,
            baseStats: { analysis: 0, negotiation: 0, management: 0, recovery: 0 }, statSchema: 2, exp: 0, playerExpCurveVersion: 2,
            alarm: false, mask: false, escape: false, survivals: 0,
            swanAt: clock() + 2 * DAY, swanEnd: 0, swanActive: false,
            tickets: [], draws: [], pools: {}, rollover: 0, notices: []
        };
        initializePlayerGrowth(this.state);
        preserveLegacyAbilities(this.state, this.playerLevel());
        // Preserve a local game's weekly numbering, including older saved tickets.
        this.state.lottoFirstRound ??= [...this.state.tickets, ...this.state.draws]
            .reduce((first, entry) => Math.min(first, entry.round), nextDraw(this.state.lastNow));
        if (!this.blackSwanEnabled) {
            this.state.swanActive = false;
            this.state.swanEnd = 0;
        }
        this.state.inventory.forEach(normalizeCookieSet);
        for (const item of this.state.inventory) {
            if (item.id === 'item_crypto_decoder') {
                const current = catalog.get(item.id);
                Object.assign(item, { name: current.name, desc: current.desc, effects: current.effects });
            }
        }
        migrateRumorStages(this.state);
        initializeAnalysisGrowth(this.state);
        this.normalizeStamina();
    }
    lottoRoundNumber(round = nextDraw(this.now())) {
        return Math.floor((round - this.state.lottoFirstRound) / (7 * DAY)) + 1;
    }
    now() { return Math.max(this.clock() + this.state.offset, this.state.lastNow); }
    id(prefix) { return `${prefix}_${this.state.nextId++}`; }
    numbers() {
        const pool = Array.from({ length: 45 }, (_, i) => i + 1);
        const result = [];
        for (let i = 0; i < 6; i++) result.push(pool.splice(Math.min(pool.length - 1, Math.floor(this.random() * pool.length)), 1)[0]);
        return result.sort((a, b) => a - b);
    }
    notice(message) { this.state.notices.unshift(message); this.state.notices.length = Math.min(20, this.state.notices.length); }
    active(stat) { return (this.state.buffs[stat] || 0) > this.now(); }
    stats() {
        return { analysis: clampAnalysis(this.analysisProgress().level + (this.active('analysis') ? 2 : 0)) };
    }
    analysisProgress() { return analysisProgress(this.state); }
    beginRumorQuiz(itemId) { return beginInterpretationQuiz(this, itemId); }
    submitRumorQuiz(itemId, questionKey, choiceIndex) { return submitInterpretationQuiz(this, itemId, questionKey, choiceIndex); }
    playerLevel() { return this.playerLevelProgress().level; }
    pendingStatPoints() { return 0; }
    allocateLevelStat(key) {
        return fail(key === 'analysis' ? '분석력은 찌라시 해석 확인 퀴즈로 성장해요.' : '레벨업 능력치 포인트 배분은 종료되었어요.');
    }
    playerLevelProgress() {
        return playerLevelProgress(this.state);
    }
    progress() { return { profit: this.state.profit, survivals: this.state.survivals, analysisLevel: this.stats().analysis, decryptions: this.state.decryptions, trustLevel: this.state.affinity >= 200 ? 3 : this.state.affinity >= 100 ? 2 : 1 }; }
    unlocked(item) { const p = this.progress(); return !item.reqUnlock || Object.entries(item.reqUnlock).every(([key, n]) => key === 'conditionDesc' || p[key] >= n); }
    syncDay() {
        const today = dayKey(this.now());
        if (today !== this.state.purchaseDay) { this.state.purchases = {}; this.state.purchaseDay = today; }
    }
    restOnBench() {
        const today = dayKey(this.now());
        if (this.state.benchRecoveryDay === today) return fail('오늘의 벤치 회복은 이미 사용했습니다.');
        this.state.benchRecoveryDay = today;
        this.state.stamina = this.maxStamina();
        return ok('벤치에서 기력을 모두 회복했습니다.');
    }
    orderLimit() { return ITEM_BALANCE.baseOrderLimit; }
    statLevel(key) { return key === 'analysis' ? this.analysisProgress().level : 0; }
    portfolioSlots() { return COMMON_PLAYER_RULES.portfolioSlots; }
    buyCap() { return Infinity; }
    feeRate(baseRate) { return Math.max(0, baseRate); }
    laborReward(gold) { return Math.round(gold); }
    maxStamina() { return COMMON_PLAYER_RULES.maxStamina; }
    normalizeStamina() {
        // Round old fractional saves up once so the migration does not lose a partial heart.
        this.state.stamina = Math.max(0, Math.min(this.maxStamina(), Math.ceil(this.state.stamina)));
    }
    recoveryAmount() { return 1; }
    laborCost() { return COMMON_PLAYER_RULES.laborCost; }
    canAdd(id, qty = 1) {
        return Number.isInteger(qty) && qty > 0 && this.state.inventory.reduce((n, item) => n + (item.quantity ?? 1), 0) + qty <= 30;
    }
    add(id, qty = 1) {
        if (!this.canAdd(id, qty)) return false;
        const entry = this.state.inventory.find(i => i.id === id);
        if (entry) entry.quantity += qty;
        else {
            const item = catalog.get(id) || {};
            this.state.inventory.push({ ...item, id, name: item.inventoryName || item.name, price: item.price, ...(item.packSize ? {cookieSet: true, openedRemaining: 4, actionLabel: '쿠키 1개 꺼내 먹기'} : {}), quantity: qty, maxStack: 99 });
        }
        return true;
    }
    consume(id, qty = 1) {
        const entry = this.state.inventory.find(i => i.id === id);
        if (!entry || entry.quantity < qty) return false;
        entry.quantity -= qty;
        if (!entry.quantity) this.state.inventory.splice(this.state.inventory.indexOf(entry), 1);
        return true;
    }
    purchase(id, quantity = 1, instant = false, { vending = false } = {}) {
        this.tick();
        const item = catalog.get(id);
        if (!(vending && id === 'item_energy_drink') && !VIVIAN_SHOP_CATALOG.some(product => product.id === id)) return fail('현재 잡화점에서 판매하지 않는 상품입니다.');
        if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return fail('구매 수량을 확인하세요.');
        if (!this.unlocked(item)) return fail(item.reqUnlock.conditionDesc);
        if (item.dailyLimit && (this.state.purchases[id] || 0) + quantity > item.dailyLimit) return fail('일일 구매 제한을 초과했습니다.');
        if (id === 'item_lotto_ticket' && lottoClosed(this.now())) return fail('로또 판매 중지: 토요일 19:00~21:05 (데모 KST).');
        if (this.market.cash < item.price * quantity) return fail('골드가 부족합니다.');
        const delivered = quantity;
        if (!this.canAdd(id, delivered)) return fail('가방 공간 또는 묶음 수량이 부족합니다.');
        if (instant) {
            if (quantity !== 1) return fail('즉시 사용은 한 번에 1개씩 가능합니다.');
            const check = this.canUse(id);
            if (!check.success) return check;
        }
        this.market.cash -= item.price * quantity;
        this.add(id, delivered);
        this.state.purchases[id] = (this.state.purchases[id] || 0) + quantity;
        this.state.affinity = Math.min(300, this.state.affinity + 5 * quantity);
        if (id === 'item_lotto_ticket') {
            const round = nextDraw(this.now());
            for (let i = 0; i < quantity; i++) this.state.tickets.push({ id: this.id('ticket'), round, numbers: this.numbers(), prize: 0, claimed: false });
            this.state.pools[round] = (this.state.pools[round] || 0) + item.price * quantity * 0.5;
        }
        const result = instant ? this.use(id) : ok(`${item.name} ${quantity}개 구매 완료${id === 'item_lotto_ticket' ? ' · 자동 번호 발급 (아이템 센터에서 변경 가능)' : ''}`);
        const stock = this.market.stocks?.get(item.linkedStock?.id);
        if (stock) stock.price = Math.round(stock.price * 1.005);
        return result;
    }
    decoderTargets() {
        return this.state.inventory.filter(item => item.category === 'intel' && item.isRead && item.targetStockId
            && rumorLevel(item, this.stats().analysis) < maxRumorLevel(item));
    }
    canUse(id) {
        const s = this.state;
        if (RETIRED_ABILITY_ITEMS.has(id)) return fail('이전 능력치 강화 상품은 사용이 종료되었어요. 보유 기록은 유지돼요.');
        if (!catalog.has(id)) return fail('사용 기능이 없는 아이템입니다.');
        if (catalog.get(id)?.recoveryFood || id === 'item_energy_drink' || id === 'item_caffeine_shot') {
            if (id === 'item_caffeine_shot' && s.stamina >= this.maxStamina()) return fail('체력이 가득 찼습니다. 아이템은 보관됩니다.');
            if (id === 'item_caffeine_shot' && s.caffeineDay === dayKey(this.now())) return fail('카페인은 하루 1회만 사용할 수 있습니다.');
        }
        if (catalog.get(id)?.recoveryFood && s.stamina >= this.maxStamina()) return fail('체력이 가득 찼습니다. 먹거리는 보관됩니다.');
        if (buffs[id] && this.active(buffs[id])) return fail('같은 강화 효과가 이미 적용 중입니다.');
        if (id.startsWith('item_logistics_quickpass')) return fail('폐기된 물류 패스입니다. 보유 기록만 유지됩니다.');
        if (id === 'item_weekly_drink_ration' && s.deliveries.length) return fail('드링크 배급권이 이미 적용 중입니다.');
        if (id === 'item_moon_powder' && !this.decoderTargets().length) return fail('해석할 찌라시를 먼저 열람하세요. 이미 최대 해석인 찌라시는 제외됩니다.');
        if (id === 'item_crypto_decoder' && !this.decoderTargets().length && !s.reports.some(r => r.revealed < r.parts.length)) return fail('더 풀어볼 정보가 없습니다. 찌라시를 먼저 열람하세요.');
        if (id === 'item_darknet_key' && !s.reports.some(r => r.revealed < r.parts.length)) return fail('해독할 보고서가 없습니다. 유료 찌라시를 먼저 사용하세요.');
        if (id === 'item_escape_capsule' && s.escape) return fail('탈출 캡슐이 이미 대기 중입니다.');
        return ok('사용 가능');
    }
    use(id, options = {}) {
        this.tick();
        if (!this.state.inventory.some(i => i.id === id && i.quantity > 0)) return fail('보유하지 않은 아이템입니다.');
        const check = this.canUse(id);
        if (!check.success) return check;
        const s = this.state, now = this.now();
        let message = `${catalog.get(id).name} 사용 완료`;
        let rumorId;
        let statBoost;
        let consume = true;
        if (catalog.get(id)?.recoveryFood || id === 'item_energy_drink' || id === 'item_caffeine_shot') {
            const before = s.stamina;
            s.stamina = Math.min(this.maxStamina(), s.stamina + this.recoveryAmount());
            if (id === 'item_caffeine_shot') s.caffeineDay = dayKey(now);
            message = `하트 ${s.stamina - before}개 회복 (${s.stamina}/${this.maxStamina()})`;
        } else if (buffs[id]) {
            const stat = buffs[id], before = this.stats()[stat];
            s.buffs[stat] = now + ITEM_BALANCE.buffMs;
            statBoost = { stat, name: statNames[stat], before, after: this.stats()[stat], amount: this.stats()[stat] - before, durationMinutes: ITEM_BALANCE.buffMs / 60000 };
            message = `${statNames[stat]} +${statBoost.amount} (${before} → ${statBoost.after}) · ${statBoost.durationMinutes}분간 적용 · 최대 Lv.5`;
        } else if (id === 'item_weekly_drink_ration') {
            const tomorrow = Date.parse(dayKey(now) + 'T00:00:00+09:00') + DAY;
            s.deliveries = Array.from({ length: 7 }, (_, i) => tomorrow + i * DAY);
            message += ' · 다음 자정부터 7일간 우편 지급';
        } else if (id === 'item_premium_rumor') {
            const opened = openAuthoredEnvelope(this, drawAuthoredRumor);
            if (!opened.success) return opened;
            rumorId = opened.rumorId;
            message = opened.message;
        } else if ((id === 'item_crypto_decoder' || id === 'item_moon_powder') && !options.reportId && this.decoderTargets().length) {
            const target = options.rumorId ? this.decoderTargets().find(i => i.id === options.rumorId) : this.decoderTargets()[0];
            if (!target) return fail('해석할 찌라시를 선택하세요.');
            const before = rumorLevel(target, this.stats().analysis);
            target.interpretationLevel = id === 'item_moon_powder' ? maxRumorLevel(target) : before + 1;
            const value = reduceRumorPowderValue(target);
            s.decryptions++;
            message = `해석 ${before} → ${target.interpretationLevel} · 매각 가치 ${value.before.toLocaleString()} → ${value.after.toLocaleString()}잎 · 진위는 보장하지 않습니다.`;
        } else if (id === 'item_crypto_decoder' || id === 'item_darknet_key') {
            const report = options.reportId ? s.reports.find(r => r.id === options.reportId && r.revealed < r.parts.length) : s.reports.find(r => r.revealed < r.parts.length);
            if (!report) return fail('해독 대상 보고서를 선택하세요.');
            const before = report.revealed;
            report.revealed = id === 'item_darknet_key' ? report.parts.length : before + 1;
            const linkedRumor = s.inventory.find(item => item.id === report.id && item.targetStockId);
            if (linkedRumor) linkedRumor.interpretationLevel = id === 'item_darknet_key' ? 5 : Math.min(5, Math.max(this.stats().analysis, linkedRumor.interpretationLevel || 3) + 1);
            s.decryptions += report.revealed - before;
            message += ` · 보고서 단서 ${report.revealed}/${report.parts.length} 확인 · 진위 보장 없음`;
        } else if (id === 'item_black_swan_alarm') { s.alarm = !s.alarm; consume = false; message = `조기 경보기 ${s.alarm ? '활성화' : '해제'}`;
        } else if (id === 'item_gas_mask') { s.mask = !s.mask; consume = false; message = `디지털 방독면 ${s.mask ? '장착' : '해제'}`;
        } else if (id === 'item_escape_capsule') { s.escape = true; message += ' · 다음 폭락 직전 자동 청산 대기';
        } else if (id === 'item_lotto_ticket') { consume = false; message = '아이템 센터의 로또 탭에서 번호·결과·당첨금을 확인하세요.'; }
        if (consume) {
            if (id === COOKIE_ID) eatCookie(s.inventory);
            else this.consume(id);
        }
        else { const entry = s.inventory.find(i => i.id === id); entry.isEquipped = id === 'item_gas_mask' ? s.mask : id === 'item_black_swan_alarm' ? s.alarm : false; }
        return { ...ok(message), ...(rumorId ? { rumorId } : {}), ...(statBoost ? { statBoost } : {}) };
    }
    discard(id) {
        if (id === 'item_lotto_ticket') return fail('응모권은 추첨 기록과 연결되어 버릴 수 없습니다.');
        const index = this.state.inventory.findIndex(i => i.id === id);
        if (index < 0) return fail('아이템이 없습니다.');
        this.state.inventory.splice(index, 1);
        if (id === 'item_gas_mask') this.state.mask = false;
        if (id === 'item_black_swan_alarm') this.state.alarm = false;
        return ok('아이템을 버렸습니다.');
    }
    claimMail(id) {
        const mail = this.state.mail.find(m => m.id === id && !m.claimed);
        if (!mail) return fail('이미 받은 우편입니다.');
        if (!this.add('item_energy_drink')) return fail('가방을 비운 후 다시 받으세요.');
        mail.claimed = true;
        return ok('드링크 1개를 받았습니다.');
    }
    changeTicket(id, numbers) {
        this.tick();
        const ticket = this.state.tickets.find(t => t.id === id);
        if (!ticket || this.now() >= ticket.round - 2 * 3600000) return fail('번호 변경은 해당 회차 토요일 19:00 전에만 가능합니다.');
        if (ticket.confirmed) return fail('이미 확정한 번호는 변경할 수 없습니다.');
        if (!validateNumbers(numbers)) return fail('1~45 사이의 서로 다른 정수 6개를 입력하세요.');
        ticket.numbers = [...numbers].sort((a,b) => a-b);
        ticket.confirmed = true;
        return ok('로또 번호가 확정되었습니다. 이후에는 변경할 수 없습니다.');
    }
    claimPrize(id) {
        const ticket = this.state.tickets.find(t => t.id === id && t.prize > 0 && !t.claimed);
        if (!ticket) return fail('수령할 당첨금이 없습니다.');
        this.market.cash += ticket.prize;
        ticket.claimed = true;
        return ok(`${ticket.prize.toLocaleString()}G 당첨금 수령`);
    }
    settleRound(round) {
        if (this.state.draws.some(d => d.round === round)) return;
        const numbers = this.numbers(), tickets = this.state.tickets.filter(t => t.round === round);
        const winners = tickets.filter(t => t.numbers.every(n => numbers.includes(n)));
        const pool = this.state.rollover + (this.state.pools[round] || 0);
        const prize = winners.length ? Math.floor(pool * 0.75 / winners.length) : 0;
        winners.forEach(t => { t.prize = prize; });
        this.state.rollover = pool - prize * winners.length;
        this.state.draws.push({ round, numbers, pool, winners: winners.length, prize });
        if (tickets.length) this.consume('item_lotto_ticket', tickets.length);
        this.notice(`로또 추첨: ${numbers.join(', ')} · ${winners.length ? `1등 ${winners.length}장` : '당첨자 없음, 이월'}`);
    }
    finishLabor(gold, exp = 0, adjusted = false) {
        const reward = adjusted ? gold : this.laborReward(gold);
        this.market.cash += reward;
        this.state.exp += exp;
        this.normalizeStamina();
        const cost = this.laborCost();
        this.state.stamina = Math.max(0, this.state.stamina - cost);
        return { goldReward: reward, staminaCost: cost };
    }
    claimTutorialRecoveryDrink() {
        if (this.state.tutorialRecoveryDrinkClaimed) return { ...ok('이미 모아의 회복 선물을 받았습니다.'), recovered: 0 };
        this.tick();
        const id = 'item_energy_drink';
        if (!this.add(id)) return fail('가방 공간 또는 드링크 묶음 수량이 부족해요. 소지품을 정리한 뒤 선물을 다시 받아 주세요.');
        const before = this.state.stamina;
        const stored = false;
        if (!stored) {
            const result = this.use(id);
            if (!result.success) { this.consume(id); return result; }
        }
        this.state.tutorialRecoveryDrinkClaimed = true;
        return { ...ok(stored ? '체력이 가득 차서 선물한 에너지 드링크 1개를 소지품에 보관했어요.'
            : `선물한 에너지 드링크를 마셔 하트 ${this.state.stamina - before}개를 회복했어요! (${this.state.stamina}/${this.maxStamina()})`),
            recovered: this.state.stamina - before, stored };
    }
    claimTutorialReward(skipped = false) {
        if (this.state.tutorialRewardClaimed) return 0;
        this.state.tutorialRewardClaimed = true;
        this.market.cash += 2000;
        return 2000;
    }
    tick() {
        this.normalizeStamina();
        const s = this.state, now = this.now();
        delete s.recoveryAt; // Remove obsolete natural-recovery timestamps from saves.
        this.syncDay();
        for (const due of s.deliveries.filter(t => t <= now)) s.mail.push({ id: this.id('mail'), due, claimed: false });
        s.deliveries = s.deliveries.filter(t => t > now);
        for (const report of s.reports) if (!report.resolved && report.at <= now) {
            const stock = this.market.stocks.get(report.stockId);
            if (stock) { stock.prevPrice = stock.price; stock.price = Math.round(stock.price * 1.08); this.recordPrice(stock); }
            report.resolved = true;
            this.notice(`${report.name}: 보고서의 공급 계약 호재 반영`);
        }
        for (const round of [...new Set(s.tickets.filter(t => t.round <= now).map(t => t.round))].sort((a,b)=>a-b)) this.settleRound(round);
        if (this.blackSwanEnabled && !s.swanActive && now >= s.swanAt) {
            if (s.escape) { this.market.liquidateForEscape?.(); s.escape = false; this.notice('탈출 캡슐: 폭락 충격 직전 보유 포지션 자동 청산'); }
            for (const stock of this.market.stocks.values()) { stock.prevPrice = stock.price; stock.price = Math.max(10, Math.round(stock.price * (1 - ITEM_BALANCE.swanDrop))); this.recordPrice(stock); }
            s.swanActive = true;
            s.swanEnd = now + ITEM_BALANCE.swanDuration;
            this.notice('블랙 스완 발생 · 시장 급락 및 차트 노이즈');
        }
        if (this.blackSwanEnabled && s.swanActive && now >= s.swanEnd) {
            s.swanActive = false;
            if (this.market.cash + (this.market.getPortfolioValue?.() || 0) > 0) s.survivals++;
            s.swanAt = now + 7 * DAY;
            this.notice('블랙 스완 종료');
        }
        s.lastNow = now;
    }
    recordPrice(stock) { const h = this.market.priceHistory?.get(stock.id); if (h) { h.push(stock.price); if (h.length > 50) h.shift(); } }
    advanceDay() { this.state.offset += DAY; this.tick(); this.state.stamina = this.maxStamina(); }
    chartNoise() { return this.blackSwanEnabled && this.state.swanActive ? (this.state.mask ? 0.3 : 1) : 0; }
}
