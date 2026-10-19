import { EMPTY_CHARACTER_IMAGE } from '../data/characterAsset.js';
import { gameKey } from '../app/GameKeys.js';
import { renderAnnaLesson } from './tutorial/compactAnnaLessons.js';
/**
 * ParkLogisticsTutorial Component
 * Manager Park (비트 물류 관리소장 박씨) Visual Novel Onboarding Guide for Logistics Mini-Game
 * GDD Reference: CORE_GDD_10, MOD_GDD_02, MOD_GDD_06, MOD_GDD_07_2
 */

export class ParkLogisticsTutorial {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks; // { onComplete: () => {}, onSkip: () => {} }
        this.isActive = false;
        this.currentStepIdx = 0;
        this.typewriterTimer = null;
        this.isTyping = false;
        this.currentText = '';

        this.reviewStepIdx = null;
        this.steps = [];
        this.render();
        this.initDOM();
        this.installPanelWidth();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="parkTutorialOverlay" class="vn-tutorial-overlay vn-theme-park hidden">
                <!-- Visual Novel Dialogue Box (Bottom Floating) -->
                <div class="vn-dialogue-box" id="vnParkDialogueBox">
                    <!-- Left: Park Portrait Frame -->
                    <div class="vn-portrait-frame" id="vnParkPortraitFrame">
                        <div class="vn-portrait-avatar" id="vnParkPortraitAvatar">
                            <img id="vnParkPortrait" src="${EMPTY_CHARACTER_IMAGE}" alt="관리소장 박씨 — 무뚝뚝한 표정" draggable="false">
                        </div>
                        <div class="vn-portrait-badge">MANAGER PARK</div>
                    </div>

                    <!-- Right: Dialogue & Nameplate Content -->
                    <div class="vn-content-wrapper">
                        <!-- Top Nameplate & Controls Bar -->
                        <div class="vn-top-bar">
                            <div class="vn-nameplate">
                                <span class="vn-status-dot"></span>
                                <span class="vn-speaker-name" id="vnParkSpeakerName">관리소장 박씨</span>
                                <span class="vn-speaker-title">Bit Logistics Hub</span>
                            </div>
                            <div class="vn-controls">
                                <button class="vn-btn vn-collapse-btn" id="btnParkVnCollapse" title="대화창 접기/펼치기">➖</button>
                                <button class="vn-btn vn-skip-btn" id="btnParkVnSkip" title="튜토리얼 건너뛰기">⏩ 스킵</button>
                                <button class="vn-btn" id="btnParkVnPrevious" disabled>◀ 이전</button>
                                <button class="vn-btn vn-next-btn" id="btnParkVnNext" title="다음 대사">다음 ▶</button>
                            </div>
                        </div>

                        <!-- Dialogue Text Area -->
                        <div class="vn-dialogue-body">
                            <div class="vn-dialogue-text" id="vnParkDialogueText">대사를 불러오는 중...</div>
                            <div class="vn-indicator-row">
                                <div class="vn-step-tracker" id="vnParkStepTracker">물류 현장 가이드</div>
                                <span class="vn-next-indicator" id="vnParkNextIndicator">▼</span>
                            </div>
                        </div>

                        <!-- Interactive Step Action Button -->
                        <div class="vn-action-area hidden" id="vnParkActionArea">
                            <button class="vn-action-btn pulse-glow" id="btnParkVnAction">🚀 실전 상하차 시작!</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.overlay = document.getElementById('parkTutorialOverlay');
        this.dialogueBox = document.getElementById('vnParkDialogueBox');
        this.portraitAvatar = document.getElementById('vnParkPortraitAvatar');
        this.portraitImage = document.getElementById('vnParkPortrait');
        this.speakerName = document.getElementById('vnParkSpeakerName');
        this.dialogueText = document.getElementById('vnParkDialogueText');
        this.stepTracker = document.getElementById('vnParkStepTracker');
        this.nextIndicator = document.getElementById('vnParkNextIndicator');
        this.btnNext = document.getElementById('btnParkVnNext');
        this.btnPrevious = document.getElementById('btnParkVnPrevious');
        this.btnSkip = document.getElementById('btnParkVnSkip');
        this.btnCollapse = document.getElementById('btnParkVnCollapse');
        this.actionArea = document.getElementById('vnParkActionArea');
        this.btnAction = document.getElementById('btnParkVnAction');
        this.isCollapsed = false;
    }

    installPanelWidth() {
        const panel = document.querySelector('.logistics-game-window');
        if (!panel || !this.overlay) return;
        const update = () => {
            const bounds = this.overlay.getBoundingClientRect();
            const scale = bounds.width / this.overlay.offsetWidth || 1;
            const width = panel.getBoundingClientRect().width / scale;
            if (width > 0) this.overlay.style.setProperty('--park-panel-width', width + 'px');
        };
        this.panelResizeObserver = new ResizeObserver(update);
        this.panelResizeObserver.observe(panel);
        window.addEventListener('resize', update);
    }

    initEventListeners() {
        this.btnPrevious?.addEventListener('click', event => {
            event.stopPropagation();
            const index = this.reviewStepIdx ?? this.currentStepIdx;
            if (index > 0) this.showStep(index - 1, true);
        });
        // Click dialogue box to advance or speed up text
        this.dialogueBox?.addEventListener('click', (e) => {
            if (this.isCollapsed) {
                this.toggleCollapse();
                return;
            }
            if (e.target.closest('#btnParkVnSkip') || e.target.closest('#btnParkVnAction') || e.target.closest('#btnParkVnCollapse')) {
                return;
            }
            this.handleAdvance();
        });

        this.btnCollapse?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCollapse();
        });

        this.btnNext?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleAdvance();
        });

        this.btnSkip?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.skip();
        });

        this.btnAction?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.finish();
        });

        // Keyboard navigation: Enter to advance dialogue
        window.addEventListener('keydown', (e) => {
            if (!this.isActive || this.overlay?.classList.contains('hidden')) return;
            if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

            if (gameKey(e) === 'enter' && !e.repeat) {
                e.preventDefault();
                e.stopPropagation();
                this.handleAdvance();
            }
        });
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.dialogueBox?.classList.toggle('collapsed', this.isCollapsed);
        if (this.btnCollapse) {
            this.btnCollapse.textContent = this.isCollapsed ? '➕' : '➖';
            this.btnCollapse.title = this.isCollapsed ? '대화창 펼치기' : '대화창 접기';
        }
    }

    buildScenario(nickname = '신입') {
        const base = { speaker: '관리소장 박씨', expression: 'neutral' };
        const steps = [{ ...base, id: 'park_intro', tracker: '준비 • 운반 연습',
            text: nickname + '! 처음엔 상자 하나부터 옮겨 보자. 네 번 왕복하며 익힐 거다. 연습 중엔 시간이 줄지 않고, 연습 물량은 실전 점수에 들어가지 않아. [다음 ▶]을 눌러 시작해.' }];
        for (const [index, count] of [1, 2, 3, 4].entries()) {
            steps.push({ ...base, id: 'practice_pickup_' + index, tracker: (index + 1) + '/4 • 상자 ' + count + '개 싣기',
                practice: 'pickup', count,
                text: (index === 0 ? '오른쪽 상자 앞에 서 있어. ' : '잘 내렸다! [D] 키로 오른쪽 상자까지 돌아가. ')
                    + '[W] 키를 ' + count + '번 눌러 상자 ' + count + '개를 실어 봐. 한 번 누르면 하나씩 올라간다.',
                targetSelector: '#logisticsBoxesZone' });
            steps.push({ ...base, id: 'practice_deliver_' + index, tracker: (index + 1) + '/4 • 트럭까지 운반',
                practice: 'deliver', count,
                text: count + '개 실었군! [A] 키로 왼쪽 트럭까지 옮겨. 트럭 앞에 닿으면 자동으로 내려놓는다. '
                    + (count >= 3 ? (count === 4 ? '4개가 최대 적재량이다. ' : '') + '그냥 걸어도 계속 움직이면 무너질 수 있다. Shift는 누르지 말고, 게이지가 70%쯤 되면 이동 키를 놓아 30% 아래로 낮춘 뒤 다시 출발해.' : count === 2 ? '많이 쌓을수록 흔들리니 [파손 위험] 게이지를 봐. 처음엔 Shift 없이 천천히 가.' : '처음엔 Shift를 누르지 말고 천천히 가 봐.'),
                targetSelector: '#logisticsTruckZone' });
        }
        steps.push({ ...base, expression: 'smile', id: 'park_ready', tracker: '연습 완료 • 실전 준비',
            text: '이제 실전이다! 1개는 1점, 2개는 3점, 3개는 6점, 4개는 8점이다. 배송 횟수 조건 없이 30점이면 S등급! 흔들리면 잠깐 멈춰. 준비됐으면 아래 버튼을 눌러 60초 작업을 시작해!',
            actionBtnText: '🚀 60초 실전 상하차 시작!' });
        return steps.map(step => {
            const compact = { ...step };
            if (step.id === 'park_intro') {
                compact.text = nickname + '! 상자 하나부터 옮겨 보자. [다음 ▶]을 눌러 시작해.';
                compact.cards = [['연습', '시간 제한 없음'], ['연습 물량', '실전 점수 제외']];
            } else if (step.practice === 'pickup') {
                compact.text = '오른쪽 상자에서 [W]를 ' + step.count + '번 눌러 ' + step.count + '개를 실어 봐.';
                compact.cards = [['D →', '상자로 이동'], ['W × ' + step.count, '상자 싣기']];
            } else if (step.practice === 'deliver') {
                compact.text = '[A]로 왼쪽 트럭까지 옮겨. 닿으면 자동으로 내려놓는다.';
                compact.cards = step.count >= 3 ? [['Shift 금지', '걷기로 운반'], ['게이지 70%', '이동 키 놓기'], ['30% 아래', '다시 출발']] : [['A ←', '트럭으로 이동'], ['Shift 없이', '천천히 운반']];
            } else if (step.id === 'park_ready') {
                compact.text = '연습 끝! 준비됐으면 60초 실전을 시작해.';
                compact.cards = [['많이 실어 운반', '점수 증가'], ['흔들리면', '잠깐 멈추기']];
            }
            return compact;
        });
    }

    get isPracticeStep() { return this.isActive && !!this.steps[this.currentStepIdx]?.practice; }
    get practiceCount() { return this.steps[this.currentStepIdx]?.count || 1; }
    observePractice(carriedCount) {
        const step = this.steps[this.currentStepIdx];
        if (this.isActive && step?.practice === 'pickup' && carriedCount === step.count) this.nextStep();
    }
    notifyDelivery(count) {
        const step = this.steps[this.currentStepIdx];
        if (!this.isActive || step?.practice !== 'deliver') return;
        if (count === step.count) this.nextStep();
        else this.showStep(this.currentStepIdx - 1);
    }
    notifyCrash() {
        if (this.isPracticeStep && this.steps[this.currentStepIdx].practice === 'deliver') this.showStep(this.currentStepIdx - 1);
    }

    start(nickname = '신입') {
        this.isActive = true;
        this.currentStepIdx = 0;
        this.steps = this.buildScenario(nickname);

        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }

        this.showStep(0);
    }

    showStep(idx, reviewing = false) {
        if (idx < 0 || idx >= this.steps.length) {
            this.finish();
            return;
        }

        this.reviewStepIdx = reviewing ? idx : null;
        if (!reviewing) this.currentStepIdx = idx;
        const step = this.steps[idx];
        renderAnnaLesson(this.dialogueBox?.querySelector('.vn-dialogue-body'), step);
        this.cleanupHighlights();
        if (!reviewing) this.callbacks.onStepChanged?.(step);
        if (step.targetSelector) this.highlightElement(step.targetSelector, false);
        if (this.portraitImage) {
            const expression = step.expression || 'neutral';
            this.portraitImage.src = EMPTY_CHARACTER_IMAGE;
            this.portraitImage.alt = `관리소장 박씨 — ${{ neutral: '무뚝뚝한 표정', smile: '흡족한 미소', angry: '호통', worried: '걱정' }[expression]}`;
        }

        // Speaker & Tracker
        if (this.speakerName) this.speakerName.textContent = step.speaker || "관리소장 박씨";
        if (this.stepTracker) this.stepTracker.textContent = `물류 가이드 (${step.tracker || (idx + 1) + '/' + this.steps.length})`;

        // Action Button vs Next Indicator
        if (step.actionBtnText && !reviewing) {
            if (this.actionArea) {
                this.actionArea.classList.remove('hidden');
                if (this.btnAction) this.btnAction.textContent = step.actionBtnText;
            }
            if (this.nextIndicator) this.nextIndicator.classList.add('hidden');
            if (this.btnNext) this.btnNext.classList.add('hidden');
        } else {
            if (this.actionArea) this.actionArea.classList.add('hidden');
            if (this.nextIndicator) this.nextIndicator.classList.remove('hidden');
            if (this.btnNext) this.btnNext.classList.remove('hidden');
        }

        if (step.practice && !reviewing) {
            if (this.btnNext) this.btnNext.disabled = true;
            this.nextIndicator?.classList.add('hidden');
        } else if (this.btnNext) this.btnNext.disabled = false;

        if (this.btnPrevious) this.btnPrevious.disabled = idx === 0;
        if (this.btnNext) this.btnNext.textContent = reviewing ? '현재 안내로 →' : '다음 ▶';

        // Trigger onEnter hook
        if (step.onEnter && !reviewing) {
            step.onEnter();
        }

        // Run Typewriter
        this.typeWriter(step.text);
        if (this.dialogueBox) this.dialogueBox.scrollTop = 0;
    }

    typeWriter(fullText) {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }

        this.isTyping = true;
        this.currentText = fullText;
        if (!this.dialogueText) return;

        this.dialogueText.textContent = '';
        let charIdx = 0;
        const speed = 18; // ms per char

        this.typewriterTimer = setInterval(() => {
            if (charIdx < fullText.length) {
                this.dialogueText.textContent += fullText.charAt(charIdx);
                charIdx++;
            } else {
                this.completeTyping();
            }
        }, speed);
    }

    completeTyping() {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        this.isTyping = false;
        if (this.dialogueText) {
            this.dialogueText.textContent = this.currentText;
        }
    }

    handleAdvance() {
        if (!this.isActive) return;

        if (this.isTyping) {
            this.completeTyping();
            return;
        }

        const step = this.steps[this.currentStepIdx];
        if (step?.practice) return;
        if (step?.actionBtnText) {
            this.finish();
            return;
        }

        this.nextStep();
    }

    nextStep() {
        if (this.currentStepIdx + 1 < this.steps.length) {
            this.showStep(this.currentStepIdx + 1);
        } else {
            this.finish();
        }
    }

    highlightElement(selector, pulse = true) {
        if (!selector) return;
        try {
            const el = document.querySelector(selector);
            if (el) {
                el.classList.add('tutorial-pulse-target');
                if (pulse) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        } catch (e) {
            // selector error guard
        }
    }

    cleanupHighlights() {
        const highlighted = document.querySelectorAll('.tutorial-pulse-target');
        highlighted.forEach(el => {
            el.classList.remove('tutorial-pulse-target');
            el.classList.remove('tutorial-target-shake');
        });
    }

    finish() {
        this.cleanupHighlights();
        this.isActive = false;
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
        if (this.callbacks.onComplete) {
            this.callbacks.onComplete();
        }
    }

    skip() {
        this.cleanupHighlights();
        this.isActive = false;
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
        if (this.callbacks.onSkip) {
            this.callbacks.onSkip();
        } else if (this.callbacks.onComplete) {
            this.callbacks.onComplete();
        }
    }
}
