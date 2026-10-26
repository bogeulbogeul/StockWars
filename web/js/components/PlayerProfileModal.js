import { resolveCharacterStyle, characterFaceSVG } from './CharacterSprite.js';

const number = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const gold = value => `${number(value).toLocaleString('ko-KR', { maximumFractionDigits: 0 })} G`;

export class PlayerProfileModal {
    constructor(container, { getProfile, getMarketState, getStats, getStamina, getPlayerLevel, getLevelProgress } = {}) {
        this.sources = { getProfile, getMarketState, getStats, getStamina, getPlayerLevel, getLevelProgress };
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'player-profile-dialog';
        this.dialog.setAttribute('aria-labelledby', 'playerProfileTitle');
        this.dialog.innerHTML = `
            <header class="player-profile-header"><div><h2 id="playerProfileTitle">플레이어 프로필</h2></div><button type="button" class="player-profile-close" aria-label="프로필 닫기" autofocus>✕</button></header>
            <section class="player-profile-identity"><div class="player-profile-monogram player-profile-portrait" role="img" aria-label="플레이어 얼굴"></div><div class="player-profile-details"><h3 data-field="nickname"></h3><div class="player-profile-level"><div class="player-profile-level-heading"><span data-field="level"></span><span class="player-profile-exp-current" data-field="currentExp"></span></div><div class="player-profile-exp-row"><progress class="player-profile-exp-bar" aria-label="현재 레벨 경험치" max="100" value="0"></progress><span class="player-profile-exp-max" data-field="maxExp"></span></div></div></div></section>

            <section class="player-profile-section"><h3>분석력과 체력</h3><dl class="player-profile-stats"><div><dt>분석력</dt><dd data-field="analysis"></dd></div><div><dt>체력</dt><dd data-field="stamina"></dd></div></dl><details class="player-profile-stat-help"><summary>성장 안내</summary><p><strong>캐릭터 레벨</strong> · 생활 경험치로 성장해요. 레벨업으로 능력치 포인트를 받지는 않아요.</p><p><strong>분석력</strong> · 찌라시 해석 확인 퀴즈로 성장하며, 더 구체적인 단서를 읽을 수 있어요. 내용의 진실을 보장하지는 않아요.</p><p><strong>체력</strong> · 활동할 때 사용하는 하트예요. 먹거리와 에너지 드링크로 회복할 수 있어요.</p></details></section>
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
        const progress = this.sources.getLevelProgress?.() || { level: this.sources.getPlayerLevel?.() ?? 1, currentExp: 0, maxExp: 150 };
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
            analysis: stats.analysis ?? '—',
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
