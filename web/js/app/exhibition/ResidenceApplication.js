import { waitForCaption } from './AnimationDialogue.js';
import { el } from './View.js';

export function mountResidenceApplication(panel, { name = '', onSubmit }) {
    panel.classList.add('residence-panel');
    panel.replaceChildren();
    const form = el('form', 'residence-form');
    form.innerHTML = `
        <div class="residence-document-meta"><span>정착 서식 제01호</span><span>입주 신청용</span></div>
        <header class="residence-heading">
            <div class="residence-emblem" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#fff8e7" stroke="#b99a70" stroke-width="4"/><path d="M32 47V38C32 33 33 28 36 24" stroke="#879b70" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="24.7" cy="29" rx="5.9" ry="9.6" transform="rotate(-37.2 24.7 29)" fill="#879b70"/><ellipse cx="39.8" cy="27" rx="5.9" ry="10.3" transform="rotate(37.2 39.8 27)" fill="#879b70"/></svg></div>
            <p class="residence-office">포포리 마을 · 정착 안내소</p>
            <h1>입주 신청서</h1>
            <p class="residence-welcome">아래와 같이 포포리 마을 입주를 신청합니다.</p>
        </header>
        <div class="residence-details"><span>입주 마을</span><strong>포포리 마을</strong><span>안내 담당</span><strong>모아</strong></div>
        <section class="residence-signature">
            <label for="residence-name">신청인 이름 <span>필수</span></label>
            <p id="residence-name-help">마을에서 불리고 싶은 이름을 적어주세요.</p>
            <div class="residence-input-row"><input id="residence-name" name="nickname" type="text" required maxlength="12" autocomplete="off" placeholder="이름을 적어주세요" aria-describedby="residence-name-help residence-name-count"><span aria-hidden="true">서명</span></div>
            <p class="residence-count" id="residence-name-count"></p>
        </section>
        <section class="residence-wish" aria-labelledby="residence-wish-label">
            <h2 id="residence-wish-label">소망</h2>
            <div class="residence-wish-blank" role="img" aria-label="아직 적지 않은 빈 소망 칸"></div>
        </section>
        <p class="residence-narration" role="status" aria-live="polite"></p>
        <button class="residence-submit" type="submit">서명하고 제출하기 <span aria-hidden="true">→</span></button>
        <footer class="residence-footer">포포리 마을 정착 안내소 귀중</footer>`;
    const input = form.elements.nickname;
    const count = form.querySelector('.residence-count');
    input.value = name;
    const update = () => { input.setCustomValidity(''); count.textContent = `${input.value.length} / 12자`; };
    input.addEventListener('input', update); update();
    let submitting = false;
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (submitting) return;
        const value = input.value.trim();
        if (!value) { input.setCustomValidity('이름을 적어주세요.'); input.reportValidity(); return; }
        submitting = true;
        input.value = value; update(); input.readOnly = true;
        const submit = form.querySelector('.residence-submit');
        submit.disabled = true;
        submit.textContent = '신청서를 건네는 중…';
        const wish = form.querySelector('.residence-wish');
        const narration = form.querySelector('.residence-narration');
        narration.textContent = '소망 칸 앞에서 잠시 펜을 멈췄어요.';
        wish.classList.add('residence-wish-pause');
        wish.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        await waitForCaption(narration);
        if (!panel.contains(form)) return;
        narration.textContent = '';
        wish.classList.remove('residence-wish-pause');
        form.classList.add('residence-handed');
        onSubmit(value);
    });
    panel.append(form);
    input.focus({ preventScroll: true });
}



