const number = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const gold = value => `${number(value).toLocaleString('ko-KR', { maximumFractionDigits: 0 })} G`;

export class PlayerProfileModal {
    constructor(container, { getProfile, getMarketState, getStats, getStamina } = {}) {
        this.sources = { getProfile, getMarketState, getStats, getStamina };
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'player-profile-dialog';
        this.dialog.setAttribute('aria-labelledby', 'playerProfileTitle');
        this.dialog.innerHTML = `
            <header class="player-profile-header"><div><span class="player-profile-eyebrow">CIPHER SECURITIES</span><h2 id="playerProfileTitle">플레이어 프로필</h2></div><button type="button" class="player-profile-close" aria-label="프로필 닫기" autofocus>✕</button></header>
            <section class="player-profile-identity"><div class="player-profile-monogram" aria-hidden="true"></div><div><h3 data-field="nickname"></h3><p data-field="trait"></p><code data-field="traderCode"></code></div></section>
            <section class="player-profile-section"><h3>투자 성향</h3><p data-field="bonus"></p></section>
            <section class="player-profile-section"><h3>현재 능력치</h3><dl class="player-profile-stats"><div><dt>분석력</dt><dd data-field="analysis"></dd></div><div><dt>운용력</dt><dd data-field="management"></dd></div><div><dt>회복력</dt><dd data-field="recovery"></dd></div><div><dt>체력</dt><dd data-field="stamina"></dd></div></dl><p class="player-profile-note">능력치는 현재 적용 중인 아이템 효과를 포함합니다.</p></section>
            <section class="player-profile-section"><h3>자산 현황 <span data-field="day"></span></h3><dl class="player-profile-finances"><div><dt>총 평가 자산</dt><dd data-field="totalNetWorth"></dd></div><div><dt>보유 현금</dt><dd data-field="cash"></dd></div><div><dt>포트폴리오 평가액</dt><dd data-field="portfolioValue"></dd></div><div><dt>보유 포지션</dt><dd data-field="positions"></dd></div><div><dt>보유 포지션 평가 손익</dt><dd data-field="profitLoss"></dd></div></dl></section>`;
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
        const values = {
            nickname,
            trait: profile.trait?.title || '투자 성향 미등록',
            traderCode: profile.traderCode || '출입증 발급 전',
            bonus: profile.trait?.bonusDesc || '캐릭터 생성 시 선택한 투자 성향이 표시됩니다.',
            analysis: stats.analysis ?? '—', management: stats.management ?? '—', recovery: stats.recovery ?? '—',
            stamina: `${number(stamina.current)} / ${number(stamina.max)}`,
            day: `DAY ${market.day ?? 1}`,
            totalNetWorth: gold(market.totalNetWorth), cash: gold(market.cash), portfolioValue: gold(market.portfolioValue),
            positions: `${market.portfolio?.length || 0}개`,
            profitLoss: `${number(market.totalProfitLoss) > 0 ? '+' : ''}${gold(market.totalProfitLoss)}`
        };
        for (const [key, value] of Object.entries(values)) this.dialog.querySelector(`[data-field="${key}"]`).textContent = value;
        this.dialog.querySelector('.player-profile-monogram').textContent = Array.from(nickname)[0];
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
