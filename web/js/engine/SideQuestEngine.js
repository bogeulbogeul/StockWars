import { SIDE_QUESTS } from '../data/sideQuests.js';
import { PLAYER_TITLES, titleName } from '../data/playerTitles.js';

// Progress lives in the existing item save, so reset and continue share its lifecycle.
export class SideQuestEngine {
    constructor(getState, market) { this.getState = getState; this.market = market; }
    state() {
        const state=this.getState().sideQuests ??= {}, occupied=new Set();
        // Preserve earlier saves' extra contracts and progress until their turn comes.
        for(const quest of SIDE_QUESTS){const entry=state[quest.id];if(!entry?.accepted||entry.claimed)continue;
            if(occupied.has(quest.giver)){entry.accepted=false;entry.queued=true;}else occupied.add(quest.giver);
        }
        return state;
    }
    list() {
        const state = this.state();
        return SIDE_QUESTS.map(quest => {
            const entry = state[quest.id] || {};
            const accepted = entry.accepted === true;
            const count = accepted ? Math.max(0, Number(entry.count) || 0) : 0;
            return { ...quest, accepted, count: Math.min(quest.target, count), ready: accepted && (entry.completed === true || count >= quest.target), claimed: entry.claimed === true };
        });
    }
    active() { return this.list().filter(quest => quest.accepted); }
    ownsTitle(id) {
        const title = PLAYER_TITLES[id];
        return !!title && (title.trait ? this.getState().appliedTrait === title.trait : this.state()[id]?.claimed === true);
    }
    titleCollection() {
        const english = titleName('trait_analysis') === PLAYER_TITLES.trait_analysis.names.en;
        return [
            ...Object.entries(PLAYER_TITLES).filter(([, title]) => title.trait).map(([id]) => ({
                id, event: 'trait', target: 1, count: this.ownsTitle(id) ? 1 : 0, claimed: this.ownsTitle(id),
                description: english ? `Start with the ${titleName(id)} investment personality. Cosmetic title changes do not change your starting ability.`
                    : `캐릭터 생성 시 투자 성향 진단에서 [${titleName(id)}] 유형으로 시작하면 획득해요. 칭호를 바꿔도 시작 능력은 유지돼요.`
            })),
            ...this.list()
        ];
    }
    equippedTitle() {
        const id = this.getState().equippedTitle;
        return this.ownsTitle(id) ? id : null;
    }
    equipTitle(id) {
        if (id !== null && !this.ownsTitle(id)) return { success: false };
        this.getState().equippedTitle = id;
        return { success: true };
    }
    offers(giver) {
        const quests=this.list().filter(quest=>quest.giver===giver&&!quest.claimed);
        if(quests.some(quest=>quest.accepted))return [];
        return quests.slice(0,1);
    }
    accept(id, giver) {
        const quest = this.offers(giver).find(entry => entry.id === id);
        if (!quest) return { success: false, message: '수락할 수 없는 의뢰예요.' };
        // Legacy automatic progress is not an accepted contract. Start fresh on explicit acceptance.
        const previous=this.state()[id];
        this.state()[id] = previous?.queued ? {...previous,accepted:true,queued:false} : { accepted: true, count: 0, completed: false, claimed: false };
        return { success: true, message: `${quest.title} 의뢰를 수락했어요.` };
    }
    record(event, result) {
        let changed = false;
        const state = this.state();
        for (const quest of SIDE_QUESTS.filter(q => q.event === event)) {
            const entry = state[quest.id];
            if (!entry?.accepted || entry.claimed || entry.completed) continue;
            let next = Number(entry.count) || 0;
            if (event === 'trade') {
                if (!result || !['sell', 'liquidate'].includes(result.side) || !(result.quantity > 0) || !Number.isFinite(result.profit)) continue;
                if (quest.mode === 'netProfit') next += result.profit;
                else next = result.side === 'sell' && result.profit >= 100 ? next + 1 : 0;
            } else if (event === 'arena') {
                if (!['토리', '에이전트 K'].includes(result?.opponent) || result.completed !== true
                    || !Number.isFinite(result.playerAssets) || !Number.isFinite(result.opponentAssets)
                    || result.playerAssets <= result.opponentAssets) continue;
                next = 1;
            } else if (event === 'labor') {
                if (!result || !Number.isFinite(result.score) || result.score < 0) continue;
                if (quest.mode === 'flawlessScore' && result.brokenCount !== 0) continue;
                next = Math.max(next, result.score);
            }
            if (next === entry.count) continue;
            entry.count = next;
            entry.completed = next >= quest.target;
            changed = true;
        }
        return changed;
    }
    claim(id) {
        const quest = this.list().find(q => q.id === id);
        if (!quest?.ready || quest.claimed) return { success: false, message: '아직 받을 보상이 없어요.' };
        this.state()[id].claimed = true;
        this.market.cash += quest.gold;
        const state = this.getState();
        state.exp = Math.max(0, Number(state.exp) || 0) + quest.exp;
        if (!this.equippedTitle()) this.equipTitle(id);
        return { success: true, message: `${quest.title} 완료 · +${quest.gold}G / +${quest.exp} EXP · 칭호 [${titleName(id)}] 획득` };
    }
}
