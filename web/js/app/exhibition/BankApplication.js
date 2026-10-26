import { el } from './View.js';

export function mountBankApplication(panel, { name = '', onSubmit, loanAmount = null }) {
    const isLoan = loanAmount !== null;
    panel.classList.add('residence-panel', 'bank-application-panel');
    panel.replaceChildren();
    const form = el('form', 'residence-form bank-application');
    form.innerHTML = `
        <div class="residence-document-meta"><span>은행 서식 제01호</span><span>계좌 개설용</span></div>
        <header class="residence-heading">
            <div class="residence-emblem" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#e9ce8a" stroke="#b79a58" stroke-width="3"/><circle cx="32" cy="32" r="23" stroke="#c3a565"/><path d="M32 47V30" stroke="#ad8d48" stroke-width="3" stroke-linecap="round"/><ellipse cx="25" cy="27" rx="5.5" ry="9" transform="rotate(-37 25 27)" fill="#ad8d48"/><ellipse cx="39" cy="27" rx="5.5" ry="9" transform="rotate(37 39 27)" fill="#ad8d48"/></svg></div>
            <p class="residence-office">차곡 은행 · 포포리 마을</p>
            <h1>계좌 개설 신청서</h1>
            <p class="residence-welcome">아래와 같이 생활 계좌 개설을 신청합니다.</p>
        </header>
        <div class="residence-details bank-application-details">
            <span>예금주</span><strong class="bank-account-holder"></strong>
            <span>계좌 종류</span><strong>생활 계좌</strong>
            <span>이용 목적</span><strong>생활에 쓰는 잎 보관</strong>
            <span>담당 직원</span><strong>차곡이</strong>
        </div>
        <section class="bank-application-signature">
            <p>위 내용을 확인하고 계좌 개설을 신청합니다.</p>
            <div><span>신청인</span><strong class="bank-signature-name"></strong><span class="bank-signature-mark">(서명)</span></div>
        </section>
        <p class="bank-application-status" role="status" aria-live="polite"></p>
        <button class="residence-submit" type="submit">서명하고 계좌 만들기 <span aria-hidden="true">→</span></button>
        <footer class="residence-footer">차곡 은행 귀중</footer>`;
    if (isLoan) {
        form.querySelector('.residence-document-meta').innerHTML = '<span>은행 서식 제02호</span><span>정착 자금 대출용</span>';
        form.querySelector('h1').textContent = '대출 신청서';
        form.querySelector('.residence-welcome').textContent = '아래와 같이 정착 자금 대출을 신청합니다.';
        const details = form.querySelector('.bank-application-details');
        details.replaceChildren();
        for (const [label, value] of [
            ['신청인', name], ['대출 종류', '정착 자금'],
            ['신청 금액', `${loanAmount.toLocaleString()}잎`], ['담당 직원', '차곡이']
        ]) details.append(el('span', '', label), el('strong', 'bank-account-holder', value));
        const terms = el('section', 'bank-loan-terms');
        terms.setAttribute('aria-label', '대출 안내');
        terms.append(el('h2', '', '대출 안내'),
            el('p', '', '빌린 잎은 선물이나 정착 지원금이 아닌, 갚아야 할 대출 원금으로 기록됩니다.'),
            el('p', '', '이자와 상환 일정은 아직 설계 중이며, 이번 첫날 체험에서는 청구하지 않습니다.'));
        details.after(terms);
        const confirmation = form.querySelector('.bank-application-signature > p');
        confirmation.replaceChildren();
        const label = el('label', 'bank-loan-confirm');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.required = true;
        label.append(checkbox, el('span', '', '대출 안내를 확인하고 정착 자금 대출을 신청합니다.'));
        confirmation.append(label);
        form.querySelector('.residence-submit').textContent = '서명하고 대출 신청하기';
    }
    // Read the resident's established name without changing their identity or save schema.
    if (!isLoan) form.querySelector('.bank-account-holder').textContent = name;
    const signature = form.querySelector('.bank-signature-name');
    let submitting = false;
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (submitting) return;
        if (!name.trim()) {
            form.querySelector('.bank-application-status').textContent = '입주 신청서의 이름을 먼저 확인해주세요.';
            return;
        }
        submitting = true;
        signature.textContent = name;
        const button = form.querySelector('button');
        button.disabled = true;
        button.textContent = '신청서를 건네는 중…';
        form.querySelector('.bank-application-status').textContent = '이름을 서명하고 차곡이에게 신청서를 건넸어요.';
        signature.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (!panel.contains(form)) return;
        onSubmit();
        // Restore the form if saving failed and the controller kept this step open.
        if (panel.contains(form)) {
            submitting = false; button.disabled = false; button.textContent = '다시 제출하기';
        }
    });
    panel.append(form);
    form.querySelector('button').focus({ preventScroll: true });
}
