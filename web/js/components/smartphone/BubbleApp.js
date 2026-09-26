/**
 * BubbleApp Component (스마트폰 Bubble 메신저 앱)
 * Handles secret rumor channels (여의도 참새방앗간), Mentor Anna 1:1 chat, and Quant AI signal feeds.
 */

export class BubbleApp {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
        this.currentBubbleChannel = 'rumor';
        this.bubbleUserMessages = { rumor: [], anna: [], quant: [] };
        this.latestState = null;

        this.initEventListeners();
    }

    initEventListeners() {
        // Channel Tabs
        if (this.dom.bubbleApp) {
            this.dom.bubbleApp.querySelectorAll('.bubble-chan-tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.dom.bubbleApp.querySelectorAll('.bubble-chan-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentBubbleChannel = btn.dataset.channel;
                    if (this.dom.bubbleActiveChannelName) {
                        const names = {
                            rumor: '🔥 여의도 참새방앗간 (익명 찌라시 룸)',
                            anna: '💼 전담 매니저 안나 (1:1 VIP 상담실)',
                            quant: '⚡ 퀀트 AI 초단타 시그널'
                        };
                        this.dom.bubbleActiveChannelName.textContent = names[this.currentBubbleChannel] || 'Bubble Secret Channel';
                    }
                    this.renderBubbleChannel(this.currentBubbleChannel);
                });
            });
        }

        // Send Button & Enter Key
        this.dom.btnBubbleSend?.addEventListener('click', () => this.handleSendBubbleMessage());
        this.dom.bubbleMsgInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleSendBubbleMessage();
        });

        // Refresh Button
        this.dom.btnBubbleRefresh?.addEventListener('click', () => {
            this.renderBubbleChannel(this.currentBubbleChannel);
        });
    }

    updateState(state) {
        this.latestState = state;
        const rumorCount = (state.news || []).filter(n => n.type === '찌라시').length;
        if (this.dom.badgeRumorCount) this.dom.badgeRumorCount.textContent = rumorCount;
        if (this.dom.bubbleBadgeHome) this.dom.bubbleBadgeHome.textContent = rumorCount;

        if (this.dom.bubbleApp && this.dom.bubbleApp.classList.contains('active')) {
            this.renderBubbleChannel(this.currentBubbleChannel || 'rumor');
        }
    }

    renderBubbleChannel(channel = 'rumor') {
        if (!this.dom.bubbleChatFeed) return;
        const state = this.latestState;
        const stocksMap = state ? new Map(state.stocks.map(s => [s.id, s])) : new Map();

        let html = '';

        if (channel === 'rumor') {
            const rawRumors = (state?.news || []).filter(n => n.type === '찌라시');
            
            html += `
                <div class="bubble-date-divider">
                    <span>📅 오늘 • 익명 찌라시 라운지 (1,420명 참여 중)</span>
                </div>
                <div class="bubble-system-notice">
                    ⚠️ <b>주의:</b> 본 채널의 정보는 시장 루머(찌라시)입니다. 공식 뉴스는 주식앱에서 확인하세요.
                </div>
            `;

            rawRumors.forEach((r, idx) => {
                const stock = stocksMap.get(r.stockId);
                const stockName = stock ? stock.name : r.stockId;
                const isPos = r.isPositive !== false;
                const senders = [
                    { name: '여의도 우주갈매기', avatar: '🦅', role: '세력 포착' },
                    { name: '익명의 펀드매니저', avatar: '🕵️‍♂️', role: 'VIP 소식통' },
                    { name: '증권가 찌라시통', avatar: '📡', role: '루머 헌터' }
                ];
                const s = senders[idx % senders.length];

                html += `
                    <div class="bubble-msg-row">
                        <div class="bubble-avatar">${s.avatar}</div>
                        <div class="bubble-msg-content">
                            <div class="bubble-msg-author">
                                <span class="author-name">${s.name}</span>
                                <span class="author-role">${s.role}</span>
                                <span class="msg-time">${r.time || '방금 전'}</span>
                            </div>
                            <div class="bubble-bubble rumor-bubble">
                                <div class="rumor-headline">
                                    <span class="rumor-badge">${isPos ? '🔥 급등 찌라시' : '⚠️ 급락 루머'}</span>
                                    <span class="rumor-impact ${isPos ? 'gainer' : 'loser'}">${r.impact}</span>
                                </div>
                                <div class="rumor-text">${r.content}</div>
                                <div class="rumor-meta">
                                    <span>🔍 신뢰도: ${r.credibility || 'Tier 1 Rumor'}</span>
                                </div>
                                <div class="rumor-actions">
                                    <button class="bubble-trade-btn" data-stock-id="${r.stockId}">
                                        📈 [${stockName}] 차트 & 매매 바로가기 ➔
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            // Append user custom chat in rumor channel
            (this.bubbleUserMessages.rumor || []).forEach(msg => {
                html += `
                    <div class="bubble-msg-row user-row">
                        <div class="bubble-msg-content user-content">
                            <div class="bubble-bubble user-bubble">${msg.text}</div>
                            <div class="msg-time user-time">${msg.time}</div>
                        </div>
                    </div>
                `;
                if (msg.reply) {
                    html += `
                        <div class="bubble-msg-row">
                            <div class="bubble-avatar">🦅</div>
                            <div class="bubble-msg-content">
                                <div class="bubble-msg-author">
                                    <span class="author-name">여의도 우주갈매기</span>
                                    <span class="msg-time">${msg.time}</span>
                                </div>
                                <div class="bubble-bubble">${msg.reply}</div>
                            </div>
                        </div>
                    `;
                }
            });

        } else if (channel === 'anna') {
            html += `
                <div class="bubble-date-divider">
                    <span>📅 오늘 • 매니저 안나 1:1 상담실</span>
                </div>
                <div class="bubble-msg-row">
                    <div class="bubble-avatar">👩‍💼</div>
                    <div class="bubble-msg-content">
                        <div class="bubble-msg-author">
                            <span class="author-name">전담 매니저 안나</span>
                            <span class="author-role">멘토</span>
                            <span class="msg-time">09:00</span>
                        </div>
                        <div class="bubble-bubble anna-bubble">
                            파트너님, 좋은 아침이에요! ☀️<br>
                            오늘도 시장 수급을 잘 파악해서 7일차 정산 목표(5,000G)를 완수해 보아요!
                        </div>
                    </div>
                </div>
                <div class="bubble-msg-row">
                    <div class="bubble-avatar">👩‍💼</div>
                    <div class="bubble-msg-content">
                        <div class="bubble-msg-author">
                            <span class="author-name">전담 매니저 안나</span>
                            <span class="author-role">멘토</span>
                            <span class="msg-time">09:15</span>
                        </div>
                        <div class="bubble-bubble anna-bubble">
                            💡 <b>투자 가이드:</b><br>
                            스마트폰의 [공식 뉴스] 탭은 정식 검증된 기업 공시만 제공되며,<br>
                            이곳 [Bubble 참새방앗간]에는 빠르고 은밀한 시장 찌라시가 올라옵니다. 둘을 교차 확인하며 매매 기회를 잡아보세요!
                        </div>
                    </div>
                </div>
            `;

            // Append user custom chat in anna channel
            (this.bubbleUserMessages.anna || []).forEach(msg => {
                html += `
                    <div class="bubble-msg-row user-row">
                        <div class="bubble-msg-content user-content">
                            <div class="bubble-bubble user-bubble">${msg.text}</div>
                            <div class="msg-time user-time">${msg.time}</div>
                        </div>
                    </div>
                `;
                if (msg.reply) {
                    html += `
                        <div class="bubble-msg-row">
                            <div class="bubble-avatar">👩‍💼</div>
                            <div class="bubble-msg-content">
                                <div class="bubble-msg-author">
                                    <span class="author-name">전담 매니저 안나</span>
                                    <span class="msg-time">${msg.time}</span>
                                </div>
                                <div class="bubble-bubble anna-bubble">${msg.reply}</div>
                            </div>
                        </div>
                    `;
                }
            });

        } else if (channel === 'quant') {
            html += `
                <div class="bubble-date-divider">
                    <span>⚡ AI 퀀트 알고리즘 실시간 탐지 피드</span>
                </div>
                <div class="bubble-msg-row">
                    <div class="bubble-avatar">🤖</div>
                    <div class="bubble-msg-content">
                        <div class="bubble-msg-author">
                            <span class="author-name">Cipher Quant AI</span>
                            <span class="author-role">시스템</span>
                            <span class="msg-time">실시간</span>
                        </div>
                        <div class="bubble-bubble quant-bubble">
                            📊 <b>[시그널 감지]</b> 글로벌 사이퍼 지수 모멘텀 우상향 지속 중.<br>
                            우량주 중심의 기관 순매수 유입 확인.
                        </div>
                    </div>
                </div>
                <div class="bubble-msg-row">
                    <div class="bubble-avatar">🤖</div>
                    <div class="bubble-msg-content">
                        <div class="bubble-msg-author">
                            <span class="author-name">Cipher Quant AI</span>
                            <span class="author-role">시스템</span>
                            <span class="msg-time">실시간</span>
                        </div>
                        <div class="bubble-bubble quant-bubble">
                            ⚡ <b>[변동성 경보]</b> 찌라시 유입 종목 단기 거래량 급증 포착.<br>
                            호가 스프레드가 확대될 수 있으니 분할 매매 권장.
                        </div>
                    </div>
                </div>
            `;

            (this.bubbleUserMessages.quant || []).forEach(msg => {
                html += `
                    <div class="bubble-msg-row user-row">
                        <div class="bubble-msg-content user-content">
                            <div class="bubble-bubble user-bubble">${msg.text}</div>
                            <div class="msg-time user-time">${msg.time}</div>
                        </div>
                    </div>
                `;
            });
        }

        this.dom.bubbleChatFeed.innerHTML = html;
        this.dom.bubbleChatFeed.scrollTop = this.dom.bubbleChatFeed.scrollHeight;

        // Wire trade action buttons inside rumors
        this.dom.bubbleChatFeed.querySelectorAll('.bubble-trade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const stockId = btn.dataset.stockId;
                if (stockId && this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(stockId);
                }
            });
        });
    }

    handleSendBubbleMessage() {
        if (!this.dom.bubbleMsgInput) return;
        const text = this.dom.bubbleMsgInput.value.trim();
        if (!text) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const chan = this.currentBubbleChannel || 'rumor';

        let reply = null;
        if (chan === 'rumor') {
            const replies = [
                'ㅋㅋㅋ 그 정보 진짜야? 세력 붙은 것 같은데 가보자!',
                '차트 5일선 지지받는 거 보니까 찌라시 힘 받겠네',
                '익명 형님들 풀매수 때립니다 가즈아!',
                '단타 치고 빠질 각 재야겠음 ㄷㄷ'
            ];
            reply = replies[Math.floor(Math.random() * replies.length)];
        } else if (chan === 'anna') {
            const replies = [
                '네 파트너님! 언제나 무리한 베팅보다는 분할 매수로 안전하게 수익을 챙기세요!',
                '좋은 판단이에요! 포트폴리오 탭에서 평가 손익을 꾸준히 확인해 주세요.',
                '응원하고 있어요! 파트너님의 성공적인 7일 생존을 믿어요 ✨'
            ];
            reply = replies[Math.floor(Math.random() * replies.length)];
        }

        this.bubbleUserMessages[chan].push({ text, time, reply });
        this.dom.bubbleMsgInput.value = '';
        this.renderBubbleChannel(chan);
    }
}