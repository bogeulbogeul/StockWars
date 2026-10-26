import { el } from './View.js';

export function mountInvestmentExam(panel, { name, question, index, total, onAnswer, onNext }) {
    panel.classList.add('residence-panel', 'investment-exam-panel');
    panel.replaceChildren();
    const form = el('form', 'investment-exam');
    form.innerHTML = `
        <div class="residence-document-meta"><span>토리 증권사 · 정보 읽기</span><span>투자 입문 과정</span></div>
        <header class="exam-heading"><p>첫 투자 준비</p><h1>투자 자격시험</h1><div class="exam-candidate"><span>응시자 <strong></strong></span><span class="exam-progress"></span></div></header>
        <progress class="exam-progress-bar" aria-label="현재 문항"></progress>
        <p class="exam-guide">15종 중 무작위로 뽑힌 세 문항을 모두 맞히면 분석력 2로 시작해요. 그 외에는 분석력 1로 시작하며, 자격증은 정답 수와 관계없이 받아요.</p>
        <section class="exam-passage"><h2>자료 읽기</h2><p></p></section>
        <fieldset class="exam-options"><legend></legend></fieldset>
        <p class="exam-error" role="alert"></p>
        <section class="exam-feedback" aria-live="polite" hidden><h2></h2><p class="exam-correct-answer"></p><p class="exam-explanation"></p></section>
        <button class="exam-submit" type="submit">답안 확인하기</button>
        <footer class="exam-footer">한 문항씩 천천히 읽어보세요.</footer>`;
    form.querySelector('.exam-candidate strong').textContent = name;
    form.querySelector('.exam-progress').textContent = `${index + 1} / ${total} 문항`;
    const progress = form.querySelector('progress'); progress.max = total; progress.value = index + 1;
    form.querySelector('.exam-passage p').textContent = question.passage;
    const options = form.querySelector('fieldset');
    options.querySelector('legend').textContent = `${index + 1}. ${question.question}`;
    question.choices.forEach((text, i) => {
        const label = el('label', 'exam-option');
        const input = document.createElement('input');
        input.type = 'radio'; input.name = 'answer'; input.value = String(i); input.required = true;
        label.append(input, el('span', 'exam-option-number', String(i + 1)), el('span', '', text));
        options.append(label);
    });
    const submit = form.querySelector('button');
    const error = form.querySelector('.exam-error');
    let answered = false;
    form.addEventListener('submit', event => {
        event.preventDefault();
        if (answered) { onNext(); return; }
        const selected = form.querySelector('input:checked');
        if (!selected) return;
        const choice = Number(selected.value);
        if (onAnswer(choice) === false) {
            error.textContent = '답안을 저장하지 못했어요. 다시 확인해주세요.';
            return;
        }
        error.textContent = ''; answered = true;
        options.querySelectorAll('input').forEach(input => { input.disabled = true; });
        const feedback = form.querySelector('.exam-feedback');
        feedback.hidden = false;
        feedback.querySelector('h2').textContent = choice === question.answer ? '잘 읽었어요' : '함께 살펴봐요';
        feedback.querySelector('.exam-correct-answer').textContent = `정답 ${question.answer + 1} · ${question.choices[question.answer]}`;
        feedback.querySelector('.exam-explanation').textContent = question.explanation;
        options.querySelectorAll('label')[question.answer].classList.add('exam-option-correct');
        submit.textContent = index + 1 === total ? '투자 자격증 확인하기' : '다음 문항으로';
        feedback.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        submit.focus({ preventScroll: true });
    });
    panel.append(form);
    options.querySelector('input').focus({ preventScroll: true });
}
