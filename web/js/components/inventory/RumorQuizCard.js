import { createRumorQuizStamp } from './RumorQuizStamp.js';

const button = (label, action, className = '') => {
    const element = document.createElement('button');
    element.type = 'button'; element.textContent = label; element.className = className;
    element.addEventListener('click', action);
    return element;
};

export class RumorQuizCard {
    constructor(popup) {
        this.popup = popup;
        this.host = document.createElement('section');
        this.host.className = 'rumor-quiz';
        this.host.setAttribute('aria-label', '찌라시 해석 확인');
        popup.modal.querySelector('.rumor-body').append(this.host);
    }
    reset(item, decoded) {
        this.itemId = item.id;
        this.host.replaceChildren();
        if (decoded.legacy) {
            const note = document.createElement('p');
            note.textContent = '이전 보유 원고는 열람을 유지해요. 해석 확인 퀴즈는 회사별 5단계 원고에서 풀 수 있어요.';
            this.host.append(note); return;
        }
        if (!this.popup.callbacks.beginRumorQuiz || !this.popup.callbacks.submitRumorQuiz) return;
        this.host.append(button('퀴즈 풀기', () => this.open(), 'rumor-quiz-start'));
    }
    open() {
        const quiz = this.popup.callbacks.beginRumorQuiz(this.itemId);
        if (!quiz.success) { this.host.textContent = quiz.message; return; }
        this.quiz = quiz;
        this.host.replaceChildren();
        const heading = document.createElement('h3'); heading.textContent = '단서를 짚어볼까?';
        const question = document.createElement('p'); question.className = 'rumor-quiz-question'; question.textContent = quiz.question;
        const choices = document.createElement('div'); choices.className = 'rumor-quiz-choices';
        this.choices = quiz.choices.map((label, index) => button(label, () => this.answer(index), 'rumor-quiz-choice'));
        choices.append(...this.choices);
        const feedback = document.createElement('p'); feedback.className = 'rumor-quiz-feedback';
        feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite'); this.feedback = feedback;
        this.stamp = createRumorQuizStamp();
        this.laterButton = button('나중에 확인하기', () => this.reset(this.popup.currentItem, { legacy: false }), 'rumor-quiz-later');
        this.host.append(heading, question, choices, this.stamp, feedback,
            this.laterButton);
        this.host.scrollIntoView({ block: 'nearest' });
        if (quiz.resolution) this.showResolution(quiz.resolution);
    }
    showResolution(result) {
        this.laterButton?.remove();
        this.choices.forEach((choice, index) => {
            choice.disabled = true;
            if (index === result.correctIndex) choice.textContent = `✓ 정답 · ${this.quiz.choices[index]}`;
        });
        this.feedback.textContent = `정답: ${result.answer}\n${result.explanation}`;
        this.stamp.hidden = true;
        requestAnimationFrame(() => this.feedback.scrollIntoView({ block: 'nearest' }));
    }
    answer(index) {
        const result = this.popup.callbacks.submitRumorQuiz(this.itemId, this.quiz.key, index);
        this.feedback.textContent = result.success && result.correct
            ? '' : [result.message, result.explanation].filter(Boolean).join(' ');
        if (!result.success) return;
        if (result.concluded && !result.correct) { this.showResolution(result); return; }
        if (result.correct) {
            this.laterButton?.remove();
            this.stamp.hidden = false;
            this.choices.forEach(choice => { choice.disabled = true; });
            // Do not reopen: reopening would change read counts and the current question snapshot.
            this.popup.refreshInterpretation();
            requestAnimationFrame(() => this.stamp.scrollIntoView({ block: 'nearest' }));
        }
    }
}
