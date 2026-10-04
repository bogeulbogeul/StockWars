import { dayKey } from '../engine/ItemEngine.js';
import { getItemArtwork } from '../data/itemArtwork.js';
import { rumorDecryption } from './inventory/RumorPopup.js';
import { LottoPanel } from './LottoPanel.js';
const statNames = { analysis: '분석', management: '운용', recovery: '회복' };
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const time = ms => new Date(ms).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

export class ItemCenter {
    constructor(engine, onChange) {
        this.engine = engine;
        this.lotto = new LottoPanel(engine);
        this.onChange = onChange;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'item-center';
        this.dialog.innerHTML = '<header><h2>아이템 센터</h2><button data-close>닫기</button></header><p class="item-center-feedback" role="status"></p><main></main>';
        document.body.appendChild(this.dialog);
        this.dialog.querySelector('[data-close]').onclick = () => this.dialog.close();
        this.dialog.addEventListener('keydown', e => e.stopPropagation());
        this.dialog.addEventListener('click', e => this.handle(e));
        this.dialog.addEventListener('close', () => { this.lotto.drafts.clear(); this.lotto.messages.clear(); });
        const button = document.createElement('button');
        button.className = 'item-center-launch';
        button.style.display = 'none';
        button.textContent = '🎒 효과 · 정보 · 우편 · 로또';
        button.onclick = () => this.open();
        document.body.appendChild(button);
        this.launch = button;
        this.banner = document.createElement('div');
        this.banner.className = 'item-event-banner';
        this.banner.setAttribute('role', 'status');
        document.body.appendChild(this.banner);
    }
    open(message = '', section = '') {
        this.dialog.classList.toggle('lotto-only', section === 'lotto');
        this.dialog.querySelector('h2').textContent = section === 'lotto' ? '주간 로또' : '아이템 센터';
        this.render(); this.feedback(message);
        if (!this.dialog.open) this.dialog.showModal();
        if (section === 'lotto') this.dialog.scrollTop = 0;
    }
    feedback(message) { this.dialog.querySelector('[role=status]').textContent = message; }
    refreshStatus() {
        const e = this.engine, s = e.state, stats = e.stats();
        this.launch.title = `분석 ${stats.analysis} / 운용 ${stats.management} / 회복 ${stats.recovery} · 체력 ${s.stamina}/${e.maxStamina()}`;
        const countdown = s.alarm && s.swanAt - e.now() <= 86400000 && !s.swanActive ? `블랙 스완까지 ${Math.max(0, Math.ceil((s.swanAt-e.now())/1000))}초` : '';
        this.banner.textContent = s.swanActive ? `블랙 스완 · ${s.mask ? '방독면: 차트 가독성 70% 복구' : '차트 노이즈 발생'}${e.active('analysis') ? ' · 분석 강화: 글리치 감지' : ''}` : countdown;
        this.banner.hidden = !this.banner.textContent;
        document.body.classList.toggle('item-swan-active', s.swanActive);
        document.body.classList.toggle('item-focus-active', e.active('analysis'));
        document.body.style.setProperty('--item-noise-blur', `${e.chartNoise() * 3}px`);
        document.body.style.setProperty('--item-noise-opacity', `${1 - e.chartNoise() * 0.7}`);
    }
    render() {
        const e = this.engine, s = e.state, now = e.now(), stats = e.stats();
        const reports = s.reports.map(r => {
            const rumor = s.inventory.find(item => item.id === r.id && item.targetStockId);
            if (rumor) {
                const decoded = rumorDecryption(rumor.intelReport, rumor, stats.analysis);
                return `<article><h4>유료 정보원의 찌라시 · 해석 ${decoded.level}단계</h4><p>${escape(decoded.text)}</p></article>`;
            }
            return `<article><h4>${escape(r.id)} · ${Math.round(r.revealed/r.parts.length*100)}% 해독${r.resolved?' · 시장 반영 완료':''}</h4><p>${r.parts.map((part,i) => escape(i < r.revealed ? part : '[REDACTED]')).join('<br>')}</p></article>`;
        }).join('');
        const reportOptions = s.reports.filter(r => r.revealed < r.parts.length).map(r => `<option value="${r.id}">${escape(r.id)} (${r.revealed}/${r.parts.length})</option>`).join('');
        const goods = s.inventory.filter(i => getItemArtwork(i.id)).map(i => `<button data-use="${escape(i.id)}"><img src="${getItemArtwork(i.id)}" alt="">${escape(i.name)} ×${i.quantity} ${i.isEquipped ? '해제' : '사용'}</button>`).join('');
        this.dialog.querySelector('main').innerHTML = `
          <p>데모 시각(KST): ${time(now)} · 날짜 ${dayKey(now)}</p>
          <section><h3>현재 효과</h3><p>체력 ${s.stamina}/${e.maxStamina()} · 분석 ${stats.analysis} / 운용 ${stats.management} / 회복 ${stats.recovery}<br>1회 매수 한도 ${e.orderLimit()}주 · 노동 체력 ${e.laborCost()}칸 · 드링크/카페인 회복 ${e.recoveryAmount()}칸<br>누적 실현 수익 ${s.profit.toLocaleString()}G · 해독 ${s.decryptions}회 · 생존 ${s.survivals}회 · EXP ${s.exp}</p>
          <p>${Object.entries(s.buffs).filter(([,end])=>end>now).map(([key,end])=>`${escape(statNames[key] || key)} +2: ${Math.ceil((end-now)/60000)}분 남음`).join(' / ') || '적용 중인 스탯 강화 없음'}</p>
          <p>퀵-패스: ${s.passUntil>now?time(s.passUntil)+'까지':'없음'} · 탈출 캡슐: ${s.escape?'대기 중':'없음'} · 경보기: ${s.alarm?'켜짐':'꺼짐'} · 방독면: ${s.mask?'장착':'해제'}</p>
          <p>보유 상품 사용</p><div class="item-center-actions">${goods || '가방이 비어 있습니다.'}</div></section>
          <section><h3>정보 · 해독</h3><label>해독 대상 <select id="itemReportTarget">${reportOptions || '<option value="">대상 없음</option>'}</select></label>${reports || '<p>유료 찌라시를 사용하면 보고서가 도착합니다.</p>'}</section>
          <section><h3>우편</h3><p>앞으로 받을 드링크 ${s.deliveries.length}개</p>${s.mail.map(m=>`<p>${time(m.due)} 드링크 1개 <button data-mail="${m.id}" ${m.claimed?'disabled':''}>${m.claimed?'수령 완료':'받기'}</button></p>`).join('') || '도착한 우편 없음'}</section>
          ${this.lotto.render()}
          <section><h3>최근 알림</h3>${s.notices.map(n=>`<p>${escape(n)}</p>`).join('') || '알림 없음'}</section>`;
    }
    handle(event) {
        const button = event.target.closest('button');
        if (!button || button.disabled) return;
        const d = button.dataset, e = this.engine;
        if (d.lotto) {
            const result = this.lotto.act(d.lotto, d.ticketId, Number(d.number));
            this.lotto.messages.set(d.ticketId, result.message);
            if (d.lotto === 'save' && result.success) this.onChange();
            const scroll = this.dialog.scrollTop;
            this.dialog.querySelector('#item-lotto').outerHTML = this.lotto.render();
            this.dialog.scrollTop = scroll;
            const replacement = [...this.dialog.querySelectorAll('[data-lotto]')].find(el => el.dataset.lotto === d.lotto && el.dataset.ticketId === d.ticketId && el.dataset.number === d.number);
            replacement?.focus({ preventScroll:true });
            return;
        }
        let result;
        if (d.use) result = e.use(d.use, { reportId: this.dialog.querySelector('#itemReportTarget')?.value });
        if (d.mail) result = e.claimMail(d.mail);
        if (d.prize) result = e.claimPrize(d.prize);
        if (result) {
            this.onChange();
            if (d.use === 'item_lotto_ticket') this.open(result.message, 'lotto');
            else { this.render(); this.feedback(result.message); }
        }
    }
}
