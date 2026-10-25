export const STORY_RUMOR_QUIZ = Object.freeze({
    question: '이 소식에서 아직 확인되지 않은 것은 무엇일까요?',
    choices: ['코지페이가 새 결제 서비스를 준비한다는 이야기', '새 서비스 출시가 공식적으로 확정됐다는 사실', '거래가 늘 수 있다는 기대'],
    answer: 1,
    explanation: '아직 공식 발표가 없으므로 서비스 출시와 거래 증가를 확정된 사실로 받아들이면 안 돼요.'
});
export function showStoryRumorQuiz(popup, app) {
    const host = popup.quizCard.host; host.hidden = false; host.replaceChildren();
    const heading = document.createElement('h3'); heading.textContent = '단서를 짚어볼까?';
    const question = document.createElement('p'); question.className = 'rumor-quiz-question'; question.textContent = STORY_RUMOR_QUIZ.question;
    const choices = document.createElement('div'); choices.className = 'rumor-quiz-choices';
    const feedback = document.createElement('p'); feedback.className = 'rumor-quiz-feedback'; feedback.setAttribute('role', 'status');
    for (const [index, label] of STORY_RUMOR_QUIZ.choices.entries()) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'rumor-quiz-choice'; button.textContent = label;
        button.onclick = () => {
            if (index !== STORY_RUMOR_QUIZ.answer) { feedback.textContent = '공식 발표가 있었는지 다시 살펴보세요. 다시 골라도 괜찮아요.'; return; }
            app.state.flags.storyRumorQuizPassed = true; app.save();
            choices.querySelectorAll('button').forEach(b => { b.disabled = true; });
            feedback.textContent = `정답이에요. ${STORY_RUMOR_QUIZ.explanation}`;
            popup.btnConfirm.textContent = '확인 완료'; popup.storyQuiz = () => popup.close();
        };
        choices.append(button);
    }
    host.append(heading, question, choices, feedback);
    popup.btnConfirm.textContent = '소식 다시 읽기';
    popup.storyQuiz = () => { host.hidden = true; popup.btnConfirm.textContent = '내용 확인 퀴즈'; popup.storyQuiz = () => showStoryRumorQuiz(popup, app); };
    host.scrollIntoView({ block: 'nearest' });
}
