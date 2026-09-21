/**
 * SettlementModal Component
 * Unity equivalent: UISettlementReport.cs / DebtKernel.cs
 * Renders the 7-day weekly financial settlement report card with stamps and grading.
 */

export class SettlementModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <!-- Settlement Result Modal (7일차 정산 리포트) -->
            <div id="settlementModal" class="modal-overlay hidden">
                <div class="modal-card settlement-card">
                    <div class="receipt-header">
                        <div class="receipt-logo">🏛️ Node Finance</div>
                        <div class="receipt-title">제 1차 주간 금융 정산 보고서</div>
                        <div class="receipt-sub" id="settlementDayText">Day 7 / 7 정산 완료</div>
                    </div>

                    <div class="receipt-body">
                        <div class="receipt-row">
                            <span>초기 지원금</span>
                            <span>5,000 G</span>
                        </div>
                        <div class="receipt-row">
                            <span>최종 현금 잔고</span>
                            <span id="settleCash">0 G</span>
                        </div>
                        <div class="receipt-row">
                            <span>보유 주식 평가액</span>
                            <span id="settlePortfolio">0 G</span>
                        </div>
                        <div class="receipt-divider"></div>
                        <div class="receipt-row total">
                            <span>총 자산 (Net Worth)</span>
                            <span id="settleTotalWorth">0 G</span>
                        </div>
                        <div class="receipt-row rent-deduct">
                            <span>월세 및 부채 이자 차감</span>
                            <span id="settleRentDeduction">-5,000 G</span>
                        </div>
                        <div class="receipt-divider"></div>
                        <div class="receipt-row final-net">
                            <span>정산 후 순 남은 자산</span>
                            <span id="settleFinalRemain">0 G</span>
                        </div>

                        <!-- Result Stamp Badge -->
                        <div class="result-stamp-container">
                            <div class="result-stamp" id="resultStamp">SUCCESS</div>
                            <div class="result-grade" id="resultGrade">Grade S</div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="demo-btn accent-btn full-btn" id="btnCloseSettlement">
                            확인 및 데모 클리어
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modal = document.getElementById('settlementModal');
        this.btnClose = document.getElementById('btnCloseSettlement');
        this.settlementDayText = document.getElementById('settlementDayText');
        this.settleCash = document.getElementById('settleCash');
        this.settlePortfolio = document.getElementById('settlePortfolio');
        this.settleTotalWorth = document.getElementById('settleTotalWorth');
        this.settleRentDeduction = document.getElementById('settleRentDeduction');
        this.settleFinalRemain = document.getElementById('settleFinalRemain');
        this.resultStamp = document.getElementById('resultStamp');
        this.resultGrade = document.getElementById('resultGrade');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => {
            this.close();
            if (this.callbacks.onClose) this.callbacks.onClose();
        });

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    open(state) {
        if (!state) return;
        const finalRemain = state.totalNetWorth - state.targetRent;
        const isSuccess = finalRemain >= 0;

        if (this.settlementDayText) {
            this.settlementDayText.textContent = `Day ${state.day} / ${state.maxDays} 정산 완료`;
        }
        if (this.settleCash) this.settleCash.textContent = `${state.cash.toLocaleString()} G`;
        if (this.settlePortfolio) this.settlePortfolio.textContent = `${state.portfolioValue.toLocaleString()} G`;
        if (this.settleTotalWorth) this.settleTotalWorth.textContent = `${state.totalNetWorth.toLocaleString()} G`;
        if (this.settleRentDeduction) this.settleRentDeduction.textContent = `-${state.targetRent.toLocaleString()} G`;
        if (this.settleFinalRemain) this.settleFinalRemain.textContent = `${finalRemain.toLocaleString()} G`;

        if (this.resultStamp) {
            this.resultStamp.textContent = isSuccess ? 'SUCCESS' : 'BANKRUPT';
            this.resultStamp.style.color = isSuccess ? 'var(--accent-cyan)' : 'var(--accent-red)';
            this.resultStamp.style.borderColor = isSuccess ? 'var(--accent-cyan)' : 'var(--accent-red)';
        }

        if (this.resultGrade) {
            let grade = 'Grade B';
            if (finalRemain >= 10000) grade = 'Grade S+ (최고 성과)';
            else if (finalRemain >= 5000) grade = 'Grade S (우수 성과)';
            else if (finalRemain >= 2000) grade = 'Grade A (안정적)';
            else if (!isSuccess) grade = 'Grade F (조기 파산)';

            this.resultGrade.textContent = grade;
            this.resultGrade.style.color = isSuccess ? 'var(--accent-yellow)' : 'var(--accent-red)';
        }

        this.modal?.classList.remove('hidden');
    }

    close() {
        this.modal?.classList.add('hidden');
    }
}
