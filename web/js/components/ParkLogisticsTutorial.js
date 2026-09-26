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

        this.steps = [];
        this.render();
        this.initDOM();
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
                            <span class="vn-portrait-emoji">👷‍♂️</span>
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
                                <button class="vn-btn vn-next-btn" id="btnParkVnNext" title="다음 대사">다음 ▶</button>
                            </div>
                        </div>

                        <!-- Dialogue Text Area -->
                        <div class="vn-dialogue-body">
                            <div class="vn-dialogue-text" id="vnParkDialogueText">대사를 불러오는 중...</div>
                            <div class="vn-indicator-row">
                                <div class="vn-step-tracker" id="vnParkStepTracker">물류 현장 가이드 (1/5)</div>
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
        this.speakerName = document.getElementById('vnParkSpeakerName');
        this.dialogueText = document.getElementById('vnParkDialogueText');
        this.stepTracker = document.getElementById('vnParkStepTracker');
        this.nextIndicator = document.getElementById('vnParkNextIndicator');
        this.btnNext = document.getElementById('btnParkVnNext');
        this.btnSkip = document.getElementById('btnParkVnSkip');
        this.btnCollapse = document.getElementById('btnParkVnCollapse');
        this.actionArea = document.getElementById('vnParkActionArea');
        this.btnAction = document.getElementById('btnParkVnAction');
        this.isCollapsed = false;
    }

    initEventListeners() {
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

        // Keyboard navigation: Enter / Space / NumpadEnter to advance dialogue
        window.addEventListener('keydown', (e) => {
            if (!this.isActive || this.overlay?.classList.contains('hidden')) return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

            if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === ' ' || e.code === 'Space') {
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
        return [
            // STEP 1: 박씨의 현장 오리엔테이션
            {
                id: 'park_intro',
                speaker: "관리소장 박씨",
                text: `어이, ${nickname}! 증시에서 제대로 털리고 땡전 한 푼 없어서 찾아온 거냐? 쯧쯧... 여기선 차트 속 가짜 숫자 말고 네 몸뚱이로 정직하게 뛰어 번 돈이 최고다. 장갑 단단히 껴라!`,
                tracker: "1/5 • 현장 오리엔테이션",
                targetSelector: null,
                onEnter: () => {
                    this.cleanupHighlights();
                }
            },

            // STEP 2: 상자 집기 및 최대 4단 스택 조작
            {
                id: 'park_box_stack',
                speaker: "관리소장 박씨",
                text: `우선 [D] 키로 우측 끝 파렛트까지 가라! 상자 앞에서 [W] 키나 [상자 더 쌓기] 버튼을 누르면 최대 4단까지 실을 수 있어. 많이 질수록 효율은 좋지만 무게 때문에 휘청거리니 명심해!`,
                tracker: "2/5 • 상자 집기 & 다중 적재",
                targetSelector: '#logisticsBoxesZone',
                onEnter: () => {
                    this.cleanupHighlights();
                    this.highlightElement('#logisticsBoxesZone');
                    this.highlightElement('#boxesTargetIndicator');
                }
            },

            // STEP 3: 이동 및 파손 위험 게이지 관리
            {
                id: 'park_balance_damage',
                speaker: "관리소장 박씨",
                text: `상자를 들었으면 [A] 키로 좌측 트럭을 향해 달려! [Shift]로 질주할 수 있지만, 급커브를 돌거나 너무 빠르면 [파손 위험] 게이지가 치솟아 박스가 와장창 깨지니까 완급 조절 잘해라!`,
                tracker: "3/5 • 운반 & 파손 게이지 관리",
                targetSelector: '#sensitivityGaugeContainer',
                onEnter: () => {
                    this.cleanupHighlights();
                    this.highlightElement('#sensitivityGaugeContainer');
                }
            },

            // STEP 4: 트럭 하차 및 루프
            {
                id: 'park_truck_unload',
                speaker: "관리소장 박씨",
                text: `좌측 화물 트럭 적재함 앞에 도착하면 자동으로 하차 완료다! 짐을 내리고 빈손이 되면 다시 오른쪽으로 쏜살같이 뛰어가서 새 상자를 채워오는 걸 반복하는 거지!`,
                tracker: "4/5 • 트럭 하차 & 적재",
                targetSelector: '#logisticsTruckZone',
                onEnter: () => {
                    this.cleanupHighlights();
                    this.highlightElement('#logisticsTruckZone');
                    this.highlightElement('#truckTargetIndicator');
                }
            },

            // STEP 5: 정산 등급 및 특급 찌라시 보상
            {
                id: 'park_reward_rumor',
                speaker: "관리소장 박씨",
                text: `제한 시간은 딱 60초다! S등급을 찍으면 일당 800 Gold에 듬뿍 얹어주고, 가끔 화물 상자 속에 숨겨진 '시장 특급 찌라시'도 건질 수 있다. 자, 실력 한번 보여봐라!`,
                tracker: "5/5 • 정산 등급 & 찌라시 보너스",
                actionBtnText: "🚀 60초 실전 상하차 시작!",
                targetSelector: '#logisticsTimerText',
                onEnter: () => {
                    this.cleanupHighlights();
                    this.highlightElement('.logistics-stats-group');
                }
            }
        ];
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

    showStep(idx) {
        if (idx < 0 || idx >= this.steps.length) {
            this.finish();
            return;
        }

        this.currentStepIdx = idx;
        const step = this.steps[idx];

        // Speaker & Tracker
        if (this.speakerName) this.speakerName.textContent = step.speaker || "관리소장 박씨";
        if (this.stepTracker) this.stepTracker.textContent = `물류 가이드 (${step.tracker || (idx + 1) + '/' + this.steps.length})`;

        // Action Button vs Next Indicator
        if (step.actionBtnText) {
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

        // Trigger onEnter hook
        if (step.onEnter) {
            step.onEnter();
        }

        // Run Typewriter
        this.typeWriter(step.text);
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
