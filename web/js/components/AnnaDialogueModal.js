/**
 * AnnaDialogueModal.js
 * StockWars Manager Anna Interactive Dialogue System (MOD_GDD_07_1)
 * Renders Anna's dialogues in Visual Novel Dialogue Box style.
 */
import { marketEngine } from '../engine/marketEngine.js';
import { toastManager } from './ToastManager.js';

export class AnnaDialogueModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="annaDialogueModalOverlay" class="vn-tutorial-overlay hidden" style="z-index: 9998;">
                <div class="vn-dialogue-box" id="annaVnBox" style="pointer-events: auto;">
                    <!-- Left: Anna Expression Portrait -->
                    <div class="vn-portrait-frame">
                        <div class="vn-portrait-avatar">
                            <span class="anna-portrait" id="annaVnPortrait" data-expression="Smile" role="img" aria-label="안나"></span>
                        </div>
                        <div class="vn-portrait-badge">MANAGER ANNA</div>
                    </div>

                    <!-- Right: Content & Controls -->
                    <div class="vn-content-wrapper">
                        <div class="vn-top-bar">
                            <div class="vn-nameplate">
                                <span class="vn-status-dot"></span>
                                <span class="vn-speaker-name">전담 매니저 안나</span>
                                <span class="vn-speaker-title">Cipher Securities</span>
                            </div>
                            <div class="vn-controls">
                                <button class="vn-btn vn-collapse-btn" id="btnCloseAnnaVn" title="대화 마치기">✕ 닫기</button>
                            </div>
                        </div>

                        <div class="vn-dialogue-body">
                            <div class="vn-dialogue-text" id="annaSpeechText">
                                "어서 오세요, 파트너님! 오늘 시장 준비는 잘 되고 계신가요? 어떤 도움이 필요하신가요?"
                            </div>
                        </div>

                        <div class="anna-vn-options" id="annaVnOptions">
                            <button class="anna-vn-choice" data-action="briefing">📊 일일 시장 브리핑</button>
                            <button class="anna-vn-choice" data-action="advice">💼 포트폴리오 진단</button>
                            <button class="anna-vn-choice" data-action="chat">💬 일상 대화 나눈다</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modalOverlay = document.getElementById('annaDialogueModalOverlay');
        this.btnCloseModal = document.getElementById('btnCloseAnnaVn');
        this.speechText = document.getElementById('annaSpeechText');
        this.portrait = document.getElementById('annaVnPortrait');
        this.optionBtns = this.modalOverlay.querySelectorAll('.anna-vn-choice');
    }

    initEventListeners() {
        this.btnCloseModal?.addEventListener('click', () => this.hide());
        this.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.hide();
        });

        this.optionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleAction(action);
            });
        });
    }

    setExpression(exp) {
        if (this.portrait) {
            this.portrait.dataset.expression = exp;
        }
    }

    show(initialMsg = null) {
        this.setExpression('Smile');
        if (initialMsg) {
            this.speechText.textContent = `"${initialMsg}"`;
        } else {
            this.speechText.textContent = `"어서 오세요, 파트너님! 오늘 시장 준비는 잘 되고 계신가요? 어떤 도움이 필요하신가요?"`;
        }
        this.modalOverlay.classList.remove('hidden');
    }

    hide() {
        this.modalOverlay.classList.add('hidden');
    }

    toggle() {
        if (this.modalOverlay.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    handleAction(action) {
        if (action === 'briefing') {
            const stocks = Array.from(marketEngine.stocks.values());
            const gainers = stocks.filter(s => s.changeRate > 0);
            if (gainers.length > 0) {
                const top = gainers.sort((a, b) => b.changeRate - a.changeRate)[0];
                this.setExpression('Happy');
                this.speechText.textContent = `"오늘 시장에서 '${top.name}' 종목이 +${top.changeRate.toFixed(1)}%로 가장 강한 수급을 받고 있어요. 분할 매도로 수익을 잘 챙겨보세요!"`;
            } else {
                this.setExpression('Standard');
                this.speechText.textContent = `"오늘 증시는 전체적으로 조심스러운 횡보/하락 양상이에요. 방어적으로 현금을 유지하며 기회를 관망하는 것이 현명합니다."`;
            }
        } else if (action === 'advice') {
            const total = marketEngine.totalAsset || 5000000;
            const cashRatio = (marketEngine.cash / total) * 100;

            if (cashRatio > 60) {
                this.setExpression('Smile');
                this.speechText.textContent = `"현금 비중이 ${cashRatio.toFixed(0)}%로 넉넉하네요! 저평가 우량주가 유의미한 지지선에 도달했을 때 매수를 검토해 보세요."`;
            } else if (cashRatio < 20) {
                this.setExpression('Pain');
                this.speechText.textContent = `"주식 비중이 매우 높아 예상치 못한 하락장에 위험할 수 있어요. 일부 종목을 정리해 최소 20~30% 현금을 확보해 두시는 걸 추천해요."`;
            } else {
                this.setExpression('Happy');
                this.speechText.textContent = `"현재 포트폴리오 밸런스가 안정적이에요! 당일 손익 흐름을 체크하며 꾸준히 관리를 이어가 봅시다."`;
            }
        } else if (action === 'chat') {
            const friendlyDialogues = [
                { exp: 'Happy', txt: "파트너님과 함께 일하게 되어 매일매일이 기대돼요. 우리 7일 차 정산 목표까지 화이팅해봐요!" },
                { exp: 'Standard', txt: "시장의 소음이 심할 때는 잠시 창밖을 바라보며 마음을 다잡는 것도 훌륭한 트레이딩 전략이에요." },
                { exp: 'Smile', txt: "당신 곁에 있으면 차트 수치가 아무리 흔들려도 든든한 기분이 든답니다. 제 조언이 항상 도움되었으면 좋겠어요." },
                { exp: 'Smile', txt: "가끔 멍하니 차트를 지켜보는 것도 좋은 명상이 되곤 하죠. 지금 우리처럼요!" }
            ];
            const rand = friendlyDialogues[Math.floor(Math.random() * friendlyDialogues.length)];
            this.setExpression(rand.exp);
            this.speechText.textContent = `"${rand.txt}"`;
        }
    }
}
