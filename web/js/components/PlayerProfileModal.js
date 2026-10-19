import { resolveCharacterStyle, characterFaceSVG } from './CharacterSprite.js';
import { createTitleBadge } from './TitleBadge.js';

const number = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const gold = value => `${number(value).toLocaleString('ko-KR', { maximumFractionDigits: 0 })} G`;

export class PlayerProfileModal {
    constructor(container, { getProfile, getMarketState, getStats, getStamina, getPlayerLevel, getLevelProgress, getTitles } = {}) {
        this.sources = { getProfile, getMarketState, getStats, getStamina, getPlayerLevel, getLevelProgress, getTitles };
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'player-profile-dialog';
        this.dialog.setAttribute('aria-labelledby', 'playerProfileTitle');
        this.dialog.innerHTML = `
            <header class="player-profile-header"><div><h2 id="playerProfileTitle">플레이어 프로필</h2></div><button type="button" class="player-profile-close" aria-label="프로필 닫기" autofocus>✕</button></header>
            <section class="player-profile-identity"><div class="player-profile-monogram player-profile-portrait" role="img" aria-label="플레이어 얼굴"></div><div class="player-profile-details"><h3 data-field="nickname"></h3><div class="player-profile-level"><div class="player-profile-level-heading"><span data-field="level"></span><span class="player-profile-exp-current" data-field="currentExp"></span></div><div class="player-profile-exp-row"><progress class="player-profile-exp-bar" aria-label="현재 레벨 경험치" max="100" value="0"></progress><span class="player-profile-exp-max" data-field="maxExp"></span></div></div><div class="player-profile-current-title" data-field="equippedTitle"></div></div></section>

            <section class="player-profile-section"><h3>현재 능력치</h3><dl class="player-profile-stats"><div><dt>분석력</dt><dd data-field="analysis"></dd></div><div><dt>협상력</dt><dd data-field="negotiation"></dd></div><div><dt>운용력</dt><dd data-field="management"></dd></div><div><dt>회복력</dt><dd data-field="recovery"></dd></div><div><dt>체력</dt><dd data-field="stamina"></dd></div></dl><details class="player-profile-stat-help"><summary>능력치·투자 성향 안내</summary><p><strong data-field="trait"></strong> · <span data-field="bonus"></span></p><p>현재 적용 중인 아이템 효과를 포함한 능력치입니다.</p><p><strong>분석력</strong> · 같은 찌라시에서 더 구체적인 단서를 읽을 수 있어요. 내용의 진실을 보장하지는 않아요.</p><p><strong>협상력</strong> · 거래 수수료를 낮추고 물류 일의 보상을 늘려 줘요.</p><p><strong>운용력</strong> · 동시에 보유할 수 있는 종목 수를 늘려 줘요.</p><p><strong>회복력</strong> · 물류 작업을 더 수월하게 하고, 2단계부터 최대 체력이 늘어나요.</p><p><strong>체력</strong> · 물류 일을 할 때 사용하는 하트예요. 에너지 드링크로 회복할 수 있어요.</p></details></section>
            <section class="player-profile-section"><h3>자산 현황 <span data-field="day"></span></h3><dl class="player-profile-finances"><div><dt>총 평가 자산</dt><dd data-field="totalNetWorth"></dd></div><div><dt>보유 현금</dt><dd data-field="cash"></dd></div><div><dt>포트폴리오 평가액</dt><dd data-field="portfolioValue"></dd></div><div><dt>보유 포지션 평가 손익</dt><dd data-field="profitLoss"></dd></div></dl></section>`;
        container.append(this.dialog);
        this.dialog.querySelector('button').addEventListener('click', () => this.close());
        this.dialog.addEventListener('click', event => {
            const bounds = this.dialog.getBoundingClientRect();
            if (event.target === this.dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) this.close();
        });
        this.dialog.addEventListener('keydown', event => event.stopPropagation());
        this.dialog.addEventListener('close', () => {
            clearInterval(this.refreshTimer);
            this.returnFocus?.focus();
        });
    }

    update() {
        const profile = this.sources.getProfile?.() || {};
        const market = this.sources.getMarketState?.() || {};
        const stats = this.sources.getStats?.() || {};
        const stamina = this.sources.getStamina?.() || {};
        const nickname = profile.nickname || '사이퍼 트레이더';
        const progress = this.sources.getLevelProgress?.() || { level: this.sources.getPlayerLevel?.() ?? 1, currentExp: 0, maxExp: 100 };
        const isMaxLevel = progress.maxExp === null;
        const maxExp = Math.max(1, number(progress.maxExp));
        const currentExp = Math.min(maxExp, Math.max(0, number(progress.currentExp)));
        const gauge = this.dialog.querySelector('.player-profile-exp-bar');
        gauge.max = maxExp;
        gauge.value = isMaxLevel ? maxExp : currentExp;
        gauge.title = isMaxLevel ? '최고 레벨 달성' : `${Math.floor(currentExp).toLocaleString('ko-KR')} / ${Math.ceil(maxExp).toLocaleString('ko-KR')} EXP`;
        gauge.ariaValueText = gauge.title;
        const values = {
            nickname,
            level: `Lv. ${progress.level}`,
            currentExp: isMaxLevel ? '최고 레벨' : `${Math.floor(currentExp).toLocaleString('ko-KR')} EXP`,
            maxExp: isMaxLevel ? 'MAX' : `${Math.ceil(maxExp).toLocaleString('ko-KR')} EXP`,
            trait: profile.trait?.title || '투자 성향 미등록',
            bonus: profile.trait?.bonusDesc || '캐릭터 생성 시 선택한 투자 성향이 표시됩니다.',
            analysis: stats.analysis ?? '—', negotiation: stats.negotiation ?? '—', management: stats.management ?? '—', recovery: stats.recovery ?? '—',
            stamina: `${number(stamina.current)} / ${number(stamina.max)}`,
            day: `DAY ${market.day ?? 1}`,
            totalNetWorth: gold(market.totalNetWorth), cash: gold(market.cash), portfolioValue: gold(market.portfolioValue),
            profitLoss: `${number(market.totalProfitLoss) > 0 ? '+' : ''}${gold(market.totalProfitLoss)}`
        };
        for (const [key, value] of Object.entries(values)) this.dialog.querySelector(`[data-field="${key}"]`).textContent = value;
        const portrait = this.dialog.querySelector('.player-profile-portrait');
        portrait.setAttribute('aria-label', nickname + '의 얼굴');
        const style = resolveCharacterStyle(profile.styleId);
        if (portrait.dataset.style !== style.id) {
            portrait.innerHTML = characterFaceSVG(style.id);
            portrait.dataset.style = style.id;
        }
        const titles = this.sources.getTitles?.() || { owned: [], equipped: null };
        const titleSlot = this.dialog.querySelector('[data-field="equippedTitle"]');
        const titleSignature = `${titles.equipped || ''}:${document.documentElement.lang}`;
        if (titleSlot.dataset.signature !== titleSignature) {
            titleSlot.replaceChildren();
            const badge = createTitleBadge(titles.equipped);
            if (badge) titleSlot.append(badge);
            else titleSlot.textContent = '칭호 없음';
            titleSlot.dataset.signature = titleSignature;
        }
        this.dialog.querySelector('[data-field="profitLoss"]').dataset.direction = number(market.totalProfitLoss) > 0 ? 'positive' : number(market.totalProfitLoss) < 0 ? 'negative' : 'neutral';
    }

    open() {
        if (this.dialog.open) return;
        this.returnFocus = document.activeElement;
        this.update();
        this.dialog.showModal();
        this.refreshTimer = setInterval(() => this.update(), 1000);
    }

    close() { this.dialog.close(); }
}
