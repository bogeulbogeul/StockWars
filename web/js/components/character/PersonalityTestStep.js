/**
 * PersonalityTestStep Module (Step 2: 투자 성향 진단 TPT)
 * Manages 3 diagnostic investment questions, scoring, and trait outcome evaluation.
 */

export const TPT_QUESTIONS = [
    {
        q: "Q1. 시장 대폭락 상황, 당신의 첫 행동은?",
        options: [
            { key: 'analysis', label: "A. 차트의 기술적 지표를 정밀 분석한다.", stat: "분석력" },
            { key: 'negotiation', label: "B. 금융권 지인에게 연락해 대출 한도를 체크한다.", stat: "협상력" },
            { key: 'management', label: "C. 저점 매수 기회로 보고 남은 자산을 투입한다.", stat: "운용력" },
            { key: 'recovery', label: "D. 일단 휴식을 취하며 시장의 평정심을 기다린다.", stat: "회복력" }
        ]
    },
    {
        q: "Q2. 당신이 가장 신뢰하는 정보의 원천은?",
        options: [
            { key: 'analysis', label: "A. 수치와 데이터가 증명된 공식 리포트", stat: "분석력" },
            { key: 'negotiation', label: "B. 업계 핵심 관계자로부터 들은 은밀한 찌라시", stat: "협상력" },
            { key: 'management', label: "C. 시장의 전체적인 거래량과 유동성 흐름", stat: "운용력" },
            { key: 'recovery', label: "D. 직접 발로 뛰며 체감한 시장의 분위기", stat: "회복력" }
        ]
    },
    {
        q: "Q3. 큰 수익을 낸 후 가장 먼저 하고 싶은 일은?",
        options: [
            { key: 'analysis', label: "A. 매매 일지를 작성하며 승리 요인을 복기한다.", stat: "분석력" },
            { key: 'negotiation', label: "B. 더 좋은 고급 정보를 얻기 위해 업계 지인들과 식사한다.", stat: "협상력" },
            { key: 'management', label: "C. 수익금으로 오피스를 확장하거나 고급 가구를 산다.", stat: "운용력" },
            { key: 'recovery', label: "D. 스파나 여행을 통해 쌓인 스트레스를 해소한다.", stat: "회복력" }
        ]
    }
];

export const TRAITS_DATA = {
    analysis: {
        title: "예리한 분석가",
        statName: "분석력 +1",
        statColor: "#00e5ff",
        icon: "📊",
        bonusDesc: "찌라시 해독률 보너스 및 노이즈 필터링 강화",
        effect: "정보 신뢰도 판별 성공률 +20%"
    },
    negotiation: {
        title: "베테랑 협상가",
        statName: "협상력 +1",
        statColor: "#ffd600",
        icon: "🤝",
        bonusDesc: "대출 이율 감면 및 매매 수수료 할인",
        effect: "거래 수수료 -30% & 대출 이자 감면"
    },
    management: {
        title: "공격적 자산가",
        statName: "운용력 +1",
        statColor: "#ff4081",
        icon: "💰",
        bonusDesc: "보유 가능 종목 수 및 매수 한도 증대",
        effect: "포트폴리오 종목 슬롯 +2개"
    },
    recovery: {
        title: "불굴의 트레이더",
        statName: "회복력 +1",
        statColor: "#00e676",
        icon: "⚡",
        bonusDesc: "스테미너 회복 속도 보너스 및 알바 보상 상향",
        effect: "당일 피로도 회복 속도 2배"
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

        const chosenTrait = TRAITS_DATA[bestKey];
        if (this.callbacks.onEvaluated) {
            this.callbacks.onEvaluated(chosenTrait);
        }
    }
}