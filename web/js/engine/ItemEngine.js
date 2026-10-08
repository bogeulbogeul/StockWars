import { VIVIAN_SHOP_CATALOG } from '../data/vivianStoreData.js';

export const DAY = 86400000;
export const ITEM_BALANCE = { buffMs: 120 * 60000, baseOrderLimit: 100, managementBonus: 0.1, quickGold: 560, quickExp: 70, swanDrop: 0.2, swanDuration: 60000 };
const catalog = new Map(VIVIAN_SHOP_CATALOG.map(i => [i.id, i]));
const buffs = { item_focus_pill: 'analysis', item_stabilizer: 'management', item_vitamin_complex: 'recovery' };
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
            baseStats: { analysis: 0, negotiation: 0, management: 0, recovery: 0 }, statSchema: 2, exp: 0,
            alarm: false, mask: false, escape: false, survivals: 0,
            swanAt: clock() + 2 * DAY, swanEnd: 0, swanActive: false,
            tickets: [], draws: [], pools: {}, rollover: 0, notices: []
        };
        if (this.state.statSchema !== 2) {
            // Remove the old starting point while preserving earned growth and trait bonuses.
            this.state.baseStats = Object.fromEntries(['analysis', 'negotiation', 'management', 'recovery'].map(key =>
                [key, Math.max(0, (Number(this.state.baseStats?.[key]) || 0) - (key === 'negotiation' ? 0 : 1))]));
            // Reconcile legacy traits after the saved profile becomes available.
            delete this.state.appliedTrait;
            this.state.statSchema = 2;
        }
        // Preserve a local game's weekly numbering, including older saved tickets.
        this.state.lottoFirstRound ??= [...this.state.tickets, ...this.state.draws]
            .reduce((first, entry) => Math.min(first, entry.round), nextDraw(this.state.lastNow));
        if (!this.blackSwanEnabled) {
            this.state.swanActive = false;
            this.state.swanEnd = 0;
        }
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
        return Object.fromEntries(['analysis', 'negotiation', 'management', 'recovery'].map(key => [key, this.state.baseStats[key] + (this.active(key) ? 2 : 0)]));
    }
    playerLevel() { return this.playerLevelProgress().level; }
    addDeveloperLevel() {
        const { level, currentExp, maxExp } = this.playerLevelProgress();
        if (maxExp === null) return fail('이미 최고 레벨(Lv. 20)입니다.');
        // Add only the remaining EXP; rounding up safely crosses fractional thresholds.
        this.state.exp = Math.max(0, Number(this.state.exp) || 0) + Math.ceil(maxExp - currentExp);
        return ok(`개발자 모드 · Lv. ${level} → Lv. ${this.playerLevel()}`);
    }
    pendingStatPoints() { return Math.max(0, this.playerLevel() - 1 - (this.state.spentLevelPoints || 0)); }
    allocateLevelStat(key) {
        if (!['analysis', 'negotiation', 'management', 'recovery'].includes(key)) return fail('능력치를 선택해 주세요.');
        if (this.pendingStatPoints() < 1) return fail('사용할 성장 포인트가 없습니다.');
        this.state.baseStats[key] += 1;
        this.state.spentLevelPoints = (this.state.spentLevelPoints || 0) + 1;
        return ok('능력치가 1 증가했습니다.');
    }
    playerLevelProgress() {
        let exp = Number(this.state.exp);
        if (!Number.isFinite(exp) || exp < 0) exp = 0;
        let level = 1;
        while (level < 20 && exp >= 100 * level ** 1.5) {
            exp -= 100 * level ** 1.5;
            level++;
        }
        return { level, currentExp: exp, maxExp: level < 20 ? 100 * level ** 1.5 : null };
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
    orderLimit() { return Math.floor(ITEM_BALANCE.baseOrderLimit * (this.active('management') ? 1 + ITEM_BALANCE.managementBonus : 1)); }
    maxStamina() { const recovery = this.stats().recovery; return recovery >= 4 ? 5 : recovery >= 2 ? 4 : 3; }
    normalizeStamina() {
        // Round old fractional saves up once so the migration does not lose a partial heart.
        this.state.stamina = Math.max(0, Math.min(this.maxStamina(), Math.ceil(this.state.stamina)));
    }
    recoveryAmount() { return 1; }
    laborCost() { return 1; }
    canAdd(id, qty = 1) {
        const entry = this.state.inventory.find(i => i.id === id);
        return entry ? entry.quantity + qty <= 99 : this.state.inventory.length < 24 && qty <= 99;
    }
    add(id, qty = 1) {
        if (!this.canAdd(id, qty)) return false;
        const entry = this.state.inventory.find(i => i.id === id);
        if (entry) entry.quantity += qty;
        else this.state.inventory.push({ ...catalog.get(id), id, quantity: qty, maxStack: 99 });
        return true;
    }
    consume(id, qty = 1) {
        const entry = this.state.inventory.find(i => i.id === id);
        if (!entry || entry.quantity < qty) return false;
        entry.quantity -= qty;
        if (!entry.quantity) this.state.inventory.splice(this.state.inventory.indexOf(entry), 1);
        return true;
    }
    purchase(id, quantity = 1, instant = false) {
        this.tick();
        const item = catalog.get(id);
        if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return fail('구매 수량을 확인하세요.');
        if (!this.unlocked(item)) return fail(item.reqUnlock.conditionDesc);
        if (item.dailyLimit && (this.state.purchases[id] || 0) + quantity > item.dailyLimit) return fail('일일 구매 제한을 초과했습니다.');
        if (id === 'item_lotto_ticket' && lottoClosed(this.now())) return fail('로또 판매 중지: 토요일 19:00~21:05 (데모 KST).');
        if (this.market.cash < item.price * quantity) return fail('골드가 부족합니다.');
        if (!this.canAdd(id, quantity)) return fail('가방 공간 또는 묶음 수량이 부족합니다.');
        if (instant) {
            if (quantity !== 1) return fail('즉시 사용은 한 번에 1개씩 가능합니다.');
            const check = this.canUse(id);
            if (!check.success) return check;
        }
        this.market.cash -= item.price * quantity;
        this.add(id, quantity);
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
            && Math.max(this.stats().analysis, item.interpretationLevel || 1) < 5);
    }
    canUse(id) {
        const s = this.state;
        if (!catalog.has(id)) return fail('사용 기능이 없는 아이템입니다.');
        if (id === 'item_energy_drink' || id === 'item_caffeine_shot') {
            if (s.stamina >= this.maxStamina()) return fail('체력이 가득 찼습니다. 아이템은 보관됩니다.');
            if (id === 'item_caffeine_shot' && s.caffeineDay === dayKey(this.now())) return fail('카페인은 하루 1회만 사용할 수 있습니다.');
        }
        if (buffs[id] && this.active(buffs[id])) return fail('같은 강화 효과가 이미 적용 중입니다.');
        if (id.startsWith('item_logistics_quickpass') && s.passUntil > this.now()) return fail('퀵-패스가 이미 적용 중입니다.');
        if (id === 'item_weekly_drink_ration' && s.deliveries.length) return fail('드링크 배급권이 이미 적용 중입니다.');
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
        let consume = true;
        if (id === 'item_energy_drink' || id === 'item_caffeine_shot') {
            const before = s.stamina;
            s.stamina = Math.min(this.maxStamina(), s.stamina + this.recoveryAmount());
            if (id === 'item_caffeine_shot') s.caffeineDay = dayKey(now);
            message = `하트 ${s.stamina - before}개 회복 (${s.stamina}/${this.maxStamina()} · 회복력 ${this.stats().recovery})`;
        } else if (buffs[id]) {
            s.buffs[buffs[id]] = now + ITEM_BALANCE.buffMs;
            message += ' · 120분간 스탯 +2';
        } else if (id.startsWith('item_logistics_quickpass')) {
            s.passUntil = now + (id.endsWith('7d') ? 7 : 1) * DAY;
            message += ' · 비트 물류에서 즉시 완료 선택 가능';
        } else if (id === 'item_weekly_drink_ration') {
            const tomorrow = Date.parse(dayKey(now) + 'T00:00:00+09:00') + DAY;
            s.deliveries = Array.from({ length: 7 }, (_, i) => tomorrow + i * DAY);
            message += ' · 다음 자정부터 7일간 우편 지급';
        } else if (id === 'item_premium_rumor') {
            const stocks = [...this.market.stocks.values()];
            const stock = stocks[Math.floor(this.random() * stocks.length)];
            if (!stock) return fail('종목 데이터가 없습니다.');
            const report = { id: this.id('report'), stockId: stock.id, name: stock.name, at: now + DAY,
                parts: [`대상 기업: ${stock.name}`, '촉매: 신규 공급 계약', '방향: 호재', '반영 시점: 24시간 후', '시장 충격: +8%', '정보 신뢰도: 확정된 데모 이벤트'], revealed: this.active('analysis') ? 4 : 3, resolved: false };
            s.reports.push(report);
            rumorId = report.id;
            s.inventory.push({
                id: rumorId, category: 'intel', name: '유료 정보원의 찌라시', icon: '📜', rarity: 'rare',
                quantity: 1, maxStack: 1, price: 1000, isRead: true, readCount: 1,
                actionType: 'read', actionLabel: '열람하기',
                targetStockId: stock.id, targetStockName: stock.name, targetSector: stock.sector || '업종 정보',
                targetChange: '+8% 상승 예상', interpretationLevel: 3,
                intelReport: `${stock.name}에 신규 공급 계약 소식이 돌고 있어. 24시간 뒤 발표가 나면 주가가 약 8% 상승할 거라는 제보야. 돈 주고 산 얘기라도 진위는 따로 따져봐.`,
                desc: '유료 정보원이 전한 신규 공급 계약 소문.',
                rumorClues: [
                    '어느 집 문 앞에 새 짐수레가 섰대. 빈손으로 온 손님은 아니라더라. 하루쯤 지나 장부가 펼쳐지면 그 집 간판도 조금 들썩일 수 있겠지. 돈 주고 들은 얘기지만 네 눈으로 확인해 봐.',
                    `${stock.sector || '한 업종'}에서 새 납품처를 잡았다는 소문이야. 하루 뒤 계약 이야기가 밖으로 나올 거래. 바람은 위쪽이라는데 아직 이름과 숫자는 또렷하지 않아.`,
                    `${stock.sector || '해당 업종'} 쪽 호재야. 한 업체가 신규 공급 계약을 따냈다는 제보지. 24시간 뒤 발표가 상승의 계기가 될 거라는 얘기야. 기업명과 상승 폭은 더 풀어봐야 해.`,
                    `${stock.name}이 신규 공급 계약을 따냈다는 소문이야. 24시간 뒤 발표가 예정돼 있고 상승을 기대하는 분위기래. 정확한 폭은 마지막 단서를 더 확인해야 해.`
                ],
                effects: ['신규 공급 계약 · 24시간 후 반영 예상', '예상 상승 폭 +8% · 제보의 진위는 별도 확인']
            });
            s.decryptions++;
            // Demo progression supplies a route to analysis Lv.5 without an unimplemented bookstore.
            s.baseStats.analysis = Math.max(s.baseStats.analysis, (s.appliedTrait === 'analysis' ? 1 : 0) + Math.floor(s.decryptions / 10));
            message += ' · 해석 3단계의 찌라시가 보관함에 도착했습니다.';
        } else if (id === 'item_crypto_decoder' && !options.reportId && this.decoderTargets().length) {
            const target = options.rumorId ? this.decoderTargets().find(i => i.id === options.rumorId) : this.decoderTargets()[0];
            if (!target) return fail('해석할 찌라시를 선택하세요.');
            const before = Math.min(5, Math.max(1, this.stats().analysis, target.interpretationLevel || 1));
            target.interpretationLevel = before + 1;
            s.decryptions++;
            message = `찌라시 한 건의 해석 단계 ${before} → ${target.interpretationLevel} · 해당 정보에 유지됩니다. 진위는 보장하지 않습니다.`;
        } else if (id === 'item_crypto_decoder' || id === 'item_darknet_key') {
            const report = options.reportId ? s.reports.find(r => r.id === options.reportId && r.revealed < r.parts.length) : s.reports.find(r => r.revealed < r.parts.length);
            if (!report) return fail('해독 대상 보고서를 선택하세요.');
            const before = report.revealed;
            report.revealed = id === 'item_darknet_key' ? report.parts.length : before + 1;
            const linkedRumor = s.inventory.find(item => item.id === report.id && item.targetStockId);
            if (linkedRumor) linkedRumor.interpretationLevel = id === 'item_darknet_key' ? 5 : Math.min(5, Math.max(this.stats().analysis, linkedRumor.interpretationLevel || 3) + 1);
            s.decryptions += report.revealed - before;
            s.baseStats.analysis = Math.max(s.baseStats.analysis, (s.appliedTrait === 'analysis' ? 1 : 0) + Math.floor(s.decryptions / 10));
            message += ` · 보고서 단서 ${report.revealed}/${report.parts.length} 확인 · 진위 보장 없음`;
        } else if (id === 'item_black_swan_alarm') { s.alarm = !s.alarm; consume = false; message = `조기 경보기 ${s.alarm ? '활성화' : '해제'}`;
        } else if (id === 'item_gas_mask') { s.mask = !s.mask; consume = false; message = `디지털 방독면 ${s.mask ? '장착' : '해제'}`;
        } else if (id === 'item_escape_capsule') { s.escape = true; message += ' · 다음 폭락 직전 자동 청산 대기';
        } else if (id === 'item_lotto_ticket') { consume = false; message = '아이템 센터의 로또 탭에서 번호·결과·당첨금을 확인하세요.'; }
        if (consume) this.consume(id);
        else { const entry = s.inventory.find(i => i.id === id); entry.isEquipped = id === 'item_gas_mask' ? s.mask : id === 'item_black_swan_alarm' ? s.alarm : false; }
        return { ...ok(message), ...(rumorId ? { rumorId } : {}) };
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
    quickJob() {
        this.tick();
        if (this.state.passUntil <= this.now()) return fail('사용 중인 퀵-패스가 없습니다.');
        if (this.state.stamina < this.laborCost()) return fail('노동에 필요한 체력이 부족합니다.');
        this.finishLabor(ITEM_BALANCE.quickGold, ITEM_BALANCE.quickExp);
        return { ...ok(`물류 즉시 완료 · ${ITEM_BALANCE.quickGold}G / ${ITEM_BALANCE.quickExp} EXP · 수수료 0%`), goldReward: ITEM_BALANCE.quickGold, expReward: ITEM_BALANCE.quickExp, hasRumor: false };
    }
    finishLabor(gold, exp = 0) {
        this.market.cash += gold;
        this.state.exp += exp;
        this.normalizeStamina();
        this.state.stamina = Math.max(0, this.state.stamina - this.laborCost());
    }
    claimTutorialReward(skipped = false) {
        if (skipped || this.state.tutorialRewardClaimed) return 0;
        this.state.tutorialRewardClaimed = true;
        this.market.cash += 2000;
        return 2000;
    }
    tick() {
        this.normalizeStamina();
        const s = this.state, now = this.now();
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
