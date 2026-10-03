const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => new Date(value).toLocaleString('ko-KR', { timeZone:'Asia/Seoul', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
const ball = n => `<span class="lotto-ball lotto-ball-${Math.ceil(n/10)}">${n}</span>`;

// Drafts stay separate from issued tickets until the player confirms six numbers.
export class LottoPanel {
    constructor(engine) { this.engine = engine; this.drafts = new Map(); this.messages = new Map(); }
    selection(ticket) { return this.drafts.get(ticket.id) || ticket.numbers; }
    act(action, id, number) {
        const e = this.engine, ticket = e.state.tickets.find(t => t.id === id);
        if (!ticket) return { success:false, message:'응모권을 찾을 수 없습니다.' };
        if (ticket.confirmed) {
            this.drafts.delete(id);
            return { success:false, message:'이미 확정한 번호는 변경할 수 없습니다.' };
        }
        if (e.now() >= ticket.round - 7200000) {
            this.drafts.delete(id);
            return { success:false, message:'이 회차는 번호 선택이 마감되었습니다.' };
        }
        const selected = [...this.selection(ticket)];
        let result;
        if (action === 'pick') {
            if (!Number.isInteger(number) || number < 1 || number > 45) return { success:false, message:'번호를 확인하세요.' };
            if (selected.includes(number)) selected.splice(selected.indexOf(number), 1);
            else if (selected.length < 6) selected.push(number);
            else return { success:false, message:'6개를 모두 골랐습니다. 바꿀 번호를 먼저 해제하세요.' };
            this.drafts.set(id, selected.sort((a,b)=>a-b));
        } else if (action === 'auto') this.drafts.set(id, e.numbers());
        else if (action === 'clear') this.drafts.set(id, []);
        else if (action === 'save') {
            result = e.changeTicket(id, selected);
            if (result.success) this.drafts.delete(id);
        }
        result ||= { success:true, message:'번호를 고른 뒤 ‘번호 확정’을 눌러 주세요.' };
        this.messages.set(id, result.message);
        return result;
    }
    render() {
        const e = this.engine, s = e.state;
        return `<section class="lotto-panel" id="item-lotto"><div class="lotto-hero"><div><span class="lotto-eyebrow">VIVIAN’S LUCKY DRAW</span><h3>이번 주, 행운의 여섯 숫자</h3><p>1부터 45까지 · 마음에 드는 번호 6개를 골라 보세요.</p></div><img src="assets/items/vivian-front-v1/item_lotto_ticket.png" alt=""></div>
          <div class="lotto-meta"><span>매주 토요일 <strong>21:00 KST 추첨</strong></span><span>이월 금액 <strong>${s.rollover.toLocaleString()} G</strong></span></div>
          <div class="lotto-tickets">${s.tickets.map(t=>this.ticket(t)).join('') || '<div class="lotto-empty">아직 응모권이 없어요.<br><small>비비안 잡화점에서 주간 로또를 구매하면 번호표가 발급됩니다.</small></div>'}</div>
          ${s.draws.length ? `<details class="lotto-history"><summary>지난 추첨 결과 · ${s.draws.length}회</summary>${[...s.draws].reverse().map(d=>`<div><p>제 ${e.lottoRoundNumber(d.round)}회 · ${date(d.round)} · 1등 ${d.winners}장</p><div class="lotto-balls">${d.numbers.map(ball).join('')}</div></div>`).join('')}</details>` : ''}
          <p class="lotto-footnote">로컬 데모 추첨 · 판매/번호 변경 마감 토요일 19:00 · 판매 재개 21:05<br>판매액 50% 적립 · 6개 일치 시 당첨 풀의 75% 배분 · 미당첨 금액 이월</p></section>`;
    }
    ticket(t) {
        const editable = !t.confirmed && this.engine.now() < t.round - 7200000;
        const selected = editable ? this.selection(t) : t.numbers;
        const dirty = editable && this.drafts.has(t.id);
        const drawn = this.engine.state.draws.some(d=>d.round === t.round);
        const id = esc(t.id);
        const status = drawn ? (t.prize ? '당첨' : '추첨 완료') : t.confirmed ? '번호 확정 완료' : editable ? '번호 선택 가능' : '추첨 대기';
        return `<article class="lotto-ticket" data-ticket="${id}"><div class="lotto-ticket-head"><div><span class="lotto-eyebrow">WEEKLY LOTTO · 6 / 45</span><h4>행운의 번호표 <span>제 ${this.engine.lottoRoundNumber(t.round)}회</span></h4></div><span class="lotto-state">${status}</span></div>
          <div class="lotto-ticket-body"><p class="lotto-draw-date">${date(t.round)} 추첨 · ${id}</p>
          <div class="lotto-selection"><div><strong>${t.confirmed?'확정된 번호':dirty?'선택 중인 번호':'발급된 번호'}</strong><span>${selected.length} / 6</span></div><div class="lotto-balls" aria-label="선택한 번호">${Array.from({length:6},(_,i)=>selected[i] ? ball(selected[i]) : '<span class="lotto-ball lotto-ball-empty">?</span>').join('')}</div></div>
          ${editable ? `<div class="lotto-number-grid" role="group" aria-label="${id} 번호 선택">${Array.from({length:45},(_,i)=>`<button type="button" class="lotto-number ${selected.includes(i+1)?'is-selected':''}" aria-label="${i+1}번" aria-pressed="${selected.includes(i+1)}" data-lotto="pick" data-ticket-id="${id}" data-number="${i+1}">${String(i+1).padStart(2,'0')}</button>`).join('')}</div>
          <div class="lotto-controls"><button data-lotto="auto" data-ticket-id="${id}">자동 선택</button><button data-lotto="clear" data-ticket-id="${id}">다시 고르기</button><button class="lotto-confirm" data-lotto="save" data-ticket-id="${id}" ${selected.length!==6?'disabled':''}>번호 확정 <span>→</span></button></div>
          <p class="lotto-hint" role="status">${esc(this.messages.get(t.id) || '원하는 번호를 골라 주세요. 번호 확정 후에는 변경할 수 없습니다.')}</p>${dirty?`<p class="lotto-issued">현재 응모 번호 ${t.numbers.join(' · ')}<br>확정 전까지는 기존 번호로 응모됩니다.</p>`:''}` : `<p class="lotto-hint" role="status">${drawn?'이 회차 추첨이 완료되었습니다.':t.confirmed?'번호가 확정되어 변경할 수 없습니다. 추첨 결과를 기다려 주세요.':'번호 선택이 마감되었습니다. 추첨 결과를 기다려 주세요.'}</p>`}
          ${t.prize?`<div class="lotto-prize"><strong>당첨금 ${t.prize.toLocaleString()} G</strong><button data-prize="${id}" ${t.claimed?'disabled':''}>${t.claimed?'수령 완료':'당첨금 받기'}</button></div>`:''}</div><footer class="lotto-ticket-stub"><span>GOOD LUCK, TRADER</span><span class="lotto-barcode" aria-hidden="true"></span></footer></article>`;
    }
}
