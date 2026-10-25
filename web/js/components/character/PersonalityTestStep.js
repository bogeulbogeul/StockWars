/**
 * PersonalityTestStep Module (Step 2: 투자 성향 진단 TPT)
 * Manages 3 diagnostic investment questions, scoring, and trait outcome evaluation.
 */

export const TPT_QUESTIONS = [
    {
        q: "Q1. 산 주식이 갑자기 떨어졌다면?",
        options: [
            { key: 'analysis', label: "A. 가격이 떨어진 이유부터 찾는다.", stat: "분석력" },
            { key: 'negotiation', label: "B. 투자하는 지인에게 의견을 묻는다.", stat: "협상력" },
            { key: 'management', label: "C. 여윳돈으로 조금 더 사 본다.", stat: "운용력" },
            { key: 'recovery', label: "D. 잠시 화면을 끄고 마음을 가라앉힌다.", stat: "회복력" }
        ]
    },
    {
        q: "Q2. 투자할 여윳돈이 생겼다면?",
        options: [
            { key: 'analysis', label: "A. 관심 있는 회사의 실적을 살펴본다.", stat: "분석력" },
            { key: 'negotiation', label: "B. 수수료와 가입 혜택을 비교한다.", stat: "협상력" },
            { key: 'management', label: "C. 여러 종목에 나눠 투자한다.", stat: "운용력" },
            { key: 'recovery', label: "D. 서두르지 않고 여유가 생길 때 시작한다.", stat: "회복력" }
        ]
    },
    {
        q: "Q3. 주식을 팔아 수익이 났다면?",
        options: [
            { key: 'analysis', label: "A. 잘된 이유를 짧게 기록한다.", stat: "분석력" },
            { key: 'negotiation', label: "B. 수수료를 줄일 방법을 알아본다.", stat: "협상력" },
            { key: 'management', label: "C. 수익 일부를 다음 투자에 보탠다.", stat: "운용력" },
            { key: 'recovery', label: "D. 맛있는 걸 먹으며 잠깐 쉰다.", stat: "회복력" }
        ]
    }
];

export const TRAITS_DATA = {
    analysis: {
        title: "예리한 분석가",
        statName: "투자 성향",
        statColor: "#00e5ff",
        icon: "📊",
        bonusDesc: "성향에 따른 능력치 보너스는 없습니다",
        effect: "분석력은 정보 해석 테스트와 찌라시 퀴즈로 성장해요"
    },
    negotiation: {
        title: "베테랑 협상가",
        statName: "투자 성향",
        statColor: "#ffd600",
        icon: "🤝",
        bonusDesc: "성향에 따른 능력치 보너스는 없습니다",
        effect: "분석력은 정보 해석 테스트와 찌라시 퀴즈로 성장해요"
    },
    management: {
        title: "공격적 자산가",
        statName: "투자 성향",
        statColor: "#ff4081",
        icon: "💰",
        bonusDesc: "성향에 따른 능력치 보너스는 없습니다",
        effect: "분석력은 정보 해석 테스트와 찌라시 퀴즈로 성장해요"
    },
    recovery: {
        title: "불굴의 트레이더",
        statName: "투자 성향",
        statColor: "#00e676",
        icon: "⚡",
        bonusDesc: "성향에 따른 능력치 보너스는 없습니다",
        effect: "분석력은 정보 해석 테스트와 찌라시 퀴즈로 성장해요"
    }
};

export class PersonalityTestStep {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
        this.currentQuestionIdx = 0;
        this.scores = { analysis: 0, negotiation: 0, management: 0, recovery: 0 };
    }

    reset() {
        this.currentQuestionIdx = 0;
        this.scores = { analysis: 0, negotiation: 0, management: 0, recovery: 0 };
        this.renderQuestion();
    }

    renderQuestion() {
        const qData = TPT_QUESTIONS[this.currentQuestionIdx];
        if (!qData) return;

        const progressPct = ((this.currentQuestionIdx + 1) / TPT_QUESTIONS.length) * 100;
        if (this.dom.testProgressFill) this.dom.testProgressFill.style.width = `${progressPct}%`;
        if (this.dom.testStepCount) this.dom.testStepCount.textContent = `문항 ${this.currentQuestionIdx + 1} / ${TPT_QUESTIONS.length}`;
        if (this.dom.testQTitle) this.dom.testQTitle.textContent = qData.q;

        if (this.dom.testOptionsList) {
            this.dom.testOptionsList.innerHTML = qData.options.map((opt) => `
                <button class="test-opt-btn" data-key="${opt.key}">
                    <span class="opt-text">${opt.label}</span>
                </button>
            `).join('');

            this.dom.testOptionsList.querySelectorAll('.test-opt-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    this.scores[key] = (this.scores[key] || 0) + 1;
                    btn.classList.add('selected');

                    setTimeout(() => {
                        this.currentQuestionIdx += 1;
                        if (this.currentQuestionIdx < TPT_QUESTIONS.length) {
                            this.renderQuestion();
                        } else {
                            this.evaluate();
                        }
                    }, 220);
                });
            });
        }
    }

    evaluate() {
        let bestKey = 'analysis';
        let maxScore = -1;

        for (const [k, score] of Object.entries(this.scores)) {
            if (score > maxScore) {
                maxScore = score;
                bestKey = k;
            }
        }

        const chosenTrait = { ...TRAITS_DATA[bestKey], key: bestKey };
        if (this.callbacks.onEvaluated) {
            this.callbacks.onEvaluated(chosenTrait);
        }
    }
}
