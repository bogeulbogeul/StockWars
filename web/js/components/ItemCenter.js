import { dayKey, nextDraw, lottoClosed } from '../engine/ItemEngine.js';
import { getItemArtwork } from '../data/itemArtwork.js';
const statNames = { analysis: '분석', management: '운용', recovery: '회복' };
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const time = ms => new Date(ms).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

export class ItemCenter {
    constructor(engine, onChange) {
        this.engine = engine;
        this.onChange = onChange;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'item-center';
        this.dialog.innerHTML = '<header><h2>아이템 센터</h2><button data-close>닫기</button></header><p class="item-center-feedback" role="status"></p><main></main>';
        document.body.appendChild(this.dialog);
        this.dialog.querySelector('[data-close]').onclick = () => this.dialog.close();
        this.dialog.addEventListener('keydown', e => e.stopPropagation());
        this.dialog.addEventListener('click', e => this.handle(e));
        const button = document.createElement('button');
        button.className = 'item-center-launch';
        button.textContent = '🎒 효과 · 정보 · 우편 · 로또';
        button.onclick = () => this.open();
        document.body.appendChild(button);
        this.launch = button;
        this.banner = document.createElement('div');
        this.banner.className = 'item-event-banner';
        this.banner.setAttribute('role', 'status');
        document.body.appendChild(this.banner);
    }
    open(message = '') { this.render(); this.feedback(message); if (!this.dialog.open) this.dialog.showModal(); }
    feedback(message) { this.dialog.querySelector('[role=status]').textContent = message; }
    refreshStatus() {
        const e = this.engine, s = e.state, stats = e.stats();
        this.launch.title = `분석 ${stats.analysis} / 운용 ${stats.management} / 회복 ${stats.recovery} · 체력 ${s.stamina.toFixed(1)}/3`;
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
        const reports = s.reports.map(r => `<article><h4>${escape(r.id)} · ${Math.round(r.revealed/r.parts.length*100)}% 해독${r.resolved?' · 시장 반영 완료':''}</h4><p>${r.parts.map((part,i) => escape(i < r.revealed ? part : '[REDACTED]')).join('<br>')}</p></article>`).join('');
        const reportOptions = s.reports.filter(r => r.revealed < r.parts.length).map(r => `<option value="${r.id}">${escape(r.id)} (${r.revealed}/${r.parts.length})</option>`).join('');
        const goods = s.inventory.filter(i => getItemArtwork(i.id)).map(i => `<button data-use="${escape(i.id)}"><img src="${getItemArtwork(i.id)}" alt="">${escape(i.name)} ×${i.quantity} ${i.isEquipped ? '해제' : '사용'}</button>`).join('');
        this.dialog.querySelector('main').innerHTML = `
          <p>데모 시각(KST): ${time(now)} · 날짜 ${dayKey(now)}</p>
          <section><h3>현재 효과</h3><p>체력 ${s.stamina.toFixed(1)}/3 · 분석 ${stats.analysis} / 운용 ${stats.management} / 회복 ${stats.recovery}<br>1회 매수 한도 ${e.orderLimit()}주 · 노동 체력 ${e.laborCost()}칸 · 누적 실현 수익 ${s.profit.toLocaleString()}G · 해독 ${s.decryptions}회 · 생존 ${s.survivals}회 · EXP ${s.exp}</p>
          <p>${Object.entries(s.buffs).filter(([,end])=>end>now).map(([key,end])=>`${escape(statNames[key] || key)} +2: ${Math.ceil((end-now)/60000)}분 남음`).join(' / ') || '적용 중인 스탯 강화 없음'}</p>
          <p>퀵-패스: ${s.passUntil>now?time(s.passUntil)+'까지':'없음'} · 탈출 캡슐: ${s.escape?'대기 중':'없음'} · 경보기: ${s.alarm?'켜짐':'꺼짐'} · 방독면: ${s.mask?'장착':'해제'}</p>
          <p>보유 상품 사용</p><div class="item-center-actions">${goods || '가방이 비어 있습니다.'}</div></section>
          <section><h3>정보 · 해독</h3><label>해독 대상 <select id="itemReportTarget">${reportOptions || '<option value="">대상 없음</option>'}</select></label>${reports || '<p>유료 찌라시를 사용하면 보고서가 도착합니다.</p>'}</section>
          <section><h3>우편</h3><p>앞으로 받을 드링크 ${s.deliveries.length}개</p>${s.mail.map(m=>`<p>${time(m.due)} 드링크 1개 <button data-mail="${m.id}" ${m.claimed?'disabled':''}>${m.claimed?'수령 완료':'받기'}</button></p>`).join('') || '도착한 우편 없음'}</section>
          <section><h3>주간 로또 — 로컬 데모 추첨</h3><p>추첨: ${time(nextDraw(now))} · ${lottoClosed(now)?'판매 중지':'판매 중'}<br>판매액 50% 적립, 1등에 풀의 75% 배분. 이월 ${s.rollover.toLocaleString()}G. 서버 공용 추첨이 아닌 이 저장 파일 내 추첨입니다.</p>
          ${s.tickets.map(t=>`<article><p>${escape(t.id)} · ${time(t.round)}<br>번호: ${t.numbers.join(' · ')}${t.prize?' · 당첨 '+t.prize.toLocaleString()+'G':''}</p>
          ${now<t.round-7200000?`<input aria-label="${t.id} 번호" id="numbers-${t.id}" value="${t.numbers.join(', ')}"><button data-numbers="${t.id}">번호 변경</button><button data-auto="${t.id}">자동 선택</button>`:''}
          ${t.prize?`<button data-prize="${t.id}" ${t.claimed?'disabled':''}>${t.claimed?'수령 완료':'당첨금 받기'}</button>`:''}</article>`).join('') || '<p>상점에서 구매하면 자동 번호가 발급됩니다. 판매 마감 전 직접 번호로 변경할 수 있습니다.</p>'}
          ${s.draws.map(d=>`<p>${time(d.round)} 추첨: ${d.numbers.join(' · ')} / 1등 ${d.winners}장</p>`).join('')}</section>
          <section><h3>최근 알림</h3>${s.notices.map(n=>`<p>${escape(n)}</p>`).join('') || '알림 없음'}</section>`;
    }
    handle(event) {
        const button = event.target.closest('button');
        if (!button || button.disabled) return;
        const d = button.dataset, e = this.engine;
        let result;
        if (d.use) result = e.use(d.use, { reportId: this.dialog.querySelector('#itemReportTarget')?.value });
        if (d.mail) result = e.claimMail(d.mail);
        if (d.prize) result = e.claimPrize(d.prize);
        if (d.numbers) result = e.changeTicket(d.numbers, this.dialog.querySelector(`#numbers-${d.numbers}`).value.split(/[\s,]+/).filter(Boolean).map(Number));
        if (d.auto) result = e.changeTicket(d.auto, e.numbers());
        if (result) { this.onChange(); this.render(); this.feedback(result.message); }
    }
}
