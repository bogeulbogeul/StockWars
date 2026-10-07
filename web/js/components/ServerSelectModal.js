
export class ServerSelectModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        
        this.maxCapacity = 50;
        // Counts are unknown until the installed app receives a server snapshot.
        this.totalCCU = null;
        this.townChannels = [
            { id: 'town-1', name: '타운 1', users: null, ping: null, isNew: false }
        ];
        this.currentChannel = { id: 'town-1', name: '타운 1', ping: null, statusLabel: '집계 대기' };

        this.render();
        this.initDOM();
        this.initEventListeners();
        this.updateStats();
        if (window.stockWarsPresence) {
            void this.refreshPresence();
            this.presenceTimer = setInterval(() => { void this.refreshPresence(); }, 3000);
        }
    }

    getChannelStatus(users) {
        if (users === null) return { status: 'unknown', label: '집계 대기', pct: 0 };
        const pct = Math.round((users / this.maxCapacity) * 100);
        if (pct >= 85) return { status: 'busy', label: '혼잡', pct };
        if (pct >= 45) return { status: 'normal', label: '보통', pct };
        return { status: 'smooth', label: '쾌적', pct };
    }

    getRecommendedChannel() {
        if (!this.townChannels.length) return null;
        return [...this.townChannels].sort((a, b) => {
            const pctA = a.users / this.maxCapacity;
            const pctB = b.users / this.maxCapacity;
            return (pctA + a.ping / 100) - (pctB + b.ping / 100);
        })[0];
    }

    render() {
        const rec = this.getRecommendedChannel();


        const html = `
            <div id="serverSelectModal" class="modal-overlay hidden">
                <div class="modal-card cyber-channel-card town-only-card">
                    <!-- Modal Header -->
                    <div class="cyber-modal-header">
                        <div class="cyber-header-info">
                            <div class="cyber-header-badge">🚪 TOWN GATEWAY</div>
                            <div class="cyber-title-row">
                                <h2 class="cyber-modal-title">사이퍼 타운 채널 선택</h2>
                                <div class="cyber-current-chip">
                                    <span class="pulse-indicator"></span>
                                    <span class="chip-label">선택 채널:</span>
                                    <b id="currentChannelNameText" class="chip-val">${this.currentChannel.name}</b>
                                    <span class="chip-sub" id="currentChannelSubText">${this.currentChannel.statusLabel}</span>
                                </div>
                            </div>
                        </div>
                        <button class="cyber-modal-close" id="btnServerModalClose" title="닫기 (ESC)">✕</button>
                    </div>

                    <!-- Auto-Scale Live Status Monitor Bar -->
                    <div class="town-autoscale-status-bar">
                        <div class="autoscale-stat-pill">
                            <span>📡 동시 접속자:</span>
                            <b id="txtTotalCCU">${this.totalCCU === null ? '집계 대기' : `${this.totalCCU}명`}</b>
                        </div>
                        <div class="autoscale-stat-pill">
                            <span>🏙️ 활성 채널:</span>
                            <b id="txtActiveChannelsCount">${this.totalCCU === null ? '확인 대기' : `${this.townChannels.length}개`}</b>
                        </div>
                        <div class="autoscale-stat-pill">
                            <span class="autoscale-mode-tag">
                                <i class="pulse-dot"></i> 실제 이용자 기준
                            </span>
                        </div>
                    </div>

                    <!-- Town Channel Description & Action Controls -->
                    <div class="town-channel-intro">
                        <div class="intro-left">
                            <span class="intro-icon">🏙️</span>
                            <div class="intro-text">
                                <h3 class="intro-title">퍼블릭 타운 채널</h3>
                                <p class="intro-desc" id="presenceStatusText">서버 접속 인원 집계 연결 대기 중입니다.</p>
                            </div>
                        </div>
                        <div class="intro-actions-group">
                            <button class="btn-autoscale-action" id="btnQuickConnect" title="가장 쾌적한 추천 채널로 즉시 접속">
                                <span>🚀 <b id="txtRecChannelBtn">${rec ? rec.name : '추천 채널'}</b> 빠른 접속</span>
                            </button>
                        </div>
                    </div>

                    <!-- Dynamic Town Channels Grid -->
                    <div class="town-channels-grid" id="townChannelsGrid">
                        ${this.renderTownCards()}
                    </div>

                    <!-- Modal Footer -->
                    <div class="cyber-modal-footer">
                        <div class="footer-legend">
                            <span class="legend-item"><i class="dot dot-smooth"></i> 쾌적 (0~44%)</span>
                            <span class="legend-item"><i class="dot dot-normal"></i> 보통 (45~84%)</span>
                            <span class="legend-item"><i class="dot dot-busy"></i> 혼잡 (85%+)</span>
                        </div>
                        <div class="footer-hint">
                            <span class="hint-key">클릭 시 즉시 이동</span> • <span class="hint-key">ESC 닫기</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    renderTownCards() {
        return this.townChannels.map(ch => {
            const isSelected = ch.id === this.currentChannel.id;
            const { status, label, pct } = this.getChannelStatus(ch.users);
            return `
                <div class="town-channel-card ${isSelected ? 'active' : ''}" 
                     data-channel-id="${ch.id}" 
                     data-channel-name="${ch.name}" 
                     data-users="${ch.users}" 
                     data-ping="${ch.ping}"
                     data-status-label="${label}">
                    <div class="card-header-row">
                        <div class="channel-title-group">
                            <span class="channel-index-dot dot-${status}"></span>
                            <span class="channel-name">${ch.name}</span>
                            ${ch.isNew ? '<span class="badge-new-channel">NEW</span>' : ''}
                        </div>
                        <span class="traffic-tag status-${status}">${label}</span>
                    </div>
                    <div class="traffic-bar-wrapper">
                        <div class="traffic-bar-fill bar-${status}" style="width: ${pct}%;"></div>
                    </div>
                    <div class="card-footer-row">
                        <span class="ping-text">${ch.ping === null ? '지연 측정 대기' : `📶 ${ch.ping}ms`}</span>
                        <span class="density-text">${ch.users === null ? '인원 집계 대기' : `${ch.users}/${this.maxCapacity}명 (${pct}%)`}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    initDOM() {
        this.modalOverlay = document.getElementById('serverSelectModal');
        this.btnClose = document.getElementById('btnServerModalClose');
        this.currentChannelText = document.getElementById('currentChannelNameText');
        this.currentChannelSubText = document.getElementById('currentChannelSubText');
        this.townChannelsGrid = document.getElementById('townChannelsGrid');
        this.txtTotalCCU = document.getElementById('txtTotalCCU');
        this.txtActiveChannelsCount = document.getElementById('txtActiveChannelsCount');
        this.txtRecChannelBtn = document.getElementById('txtRecChannelBtn');
        this.btnQuickConnect = document.getElementById('btnQuickConnect');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        
        this.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.close();
            }
        });

        // Quick Connect Button
        this.btnQuickConnect?.addEventListener('click', (e) => {
            e.stopPropagation();
            const rec = this.getRecommendedChannel();
            if (rec) {
                const info = this.getChannelStatus(rec.users);
                this.selectAndConnectChannel({
                    id: rec.id,
                    name: rec.name,
                    ping: rec.ping,
                    statusLabel: info.label
                });
            }
        });

        // Click Town Channel Card
        this.townChannelsGrid?.addEventListener('click', (e) => {
            const card = e.target.closest('.town-channel-card');
            if (card) {
                const channelId = card.dataset.channelId;
                const channelName = card.dataset.channelName;
                const ping = (card.dataset.ping === 'null' ? null : Number(card.dataset.ping));
                const statusLabel = card.dataset.statusLabel || '원활';

                this.selectAndConnectChannel({
                    id: channelId,
                    name: channelName,
                    ping,
                    statusLabel
                });
            }
        });

        // ESC Key to close
        window.addEventListener('keydown', (e) => {
            if (this.isOpen() && e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });
    }

    updateStats() {
        if (this.townChannelsGrid) {
            this.townChannelsGrid.innerHTML = this.renderTownCards();
        }
        if (this.txtTotalCCU) {
            this.txtTotalCCU.textContent = this.totalCCU === null ? '집계 대기' : `${this.totalCCU}명`;
        }
        if (this.txtActiveChannelsCount) {
            this.txtActiveChannelsCount.textContent = this.totalCCU === null ? '확인 대기' : `${this.townChannels.length}개`;
        }
        const rec = this.getRecommendedChannel();
        if (this.txtRecChannelBtn && rec) {
            this.txtRecChannelBtn.textContent = rec.name;
        }
    }

    async refreshPresence() {
        try { this.applyPresence(await window.stockWarsPresence.state()); }
        catch { this.applyPresence({ error: '서버 연결 확인 중' }); }
    }

    applyPresence({ snapshot, error }) {
        const status = this.modalOverlay?.querySelector('#presenceStatusText');
        if (snapshot) {
            this.totalCCU = snapshot.totalCCU;
            this.maxCapacity = snapshot.capacity;
            this.townChannels = snapshot.channels.map(ch => ({ ...ch, ping: snapshot.ping, isNew: false }));
            const current = this.townChannels.find(ch => ch.id === snapshot.currentChannelId);
            this.currentChannel = current
                ? { ...current, statusLabel: this.getChannelStatus(current.users).label }
                : { id: null, name: '오피스 / 대기', ping: null, statusLabel: '마을 미입장' };
            if (status) status.textContent = snapshot.local ? '로컬 개발자 모드 · 나만 입장하는 마을입니다.' : '실제 앱 접속 기준 · 채널 인원은 마을 입장자 · 연결 종료 시 자동 갱신';
        } else {
            this.totalCCU = null;
            this.townChannels = this.townChannels.map(ch => ({ ...ch, users: null, ping: null }));
            this.currentChannel = { ...this.currentChannel, ping: null, statusLabel: '집계 대기' };
            if (status) status.textContent = error || '서버 연결 확인 중';
        }
        if (this.currentChannelText) this.currentChannelText.textContent = this.currentChannel.name;
        if (this.currentChannelSubText) this.currentChannelSubText.textContent = this.currentChannel.statusLabel;
        this.updateStats();
    }

    async selectAndConnectChannel(channel) {
        if (this.connecting) return;
        this.connecting = true;
        try {
            const connected = await this.callbacks.onConnect?.(channel);
            if (connected === false) return;
        } finally { this.connecting = false; }
        this.currentChannel = channel;

        // Highlight updated card
        const allCards = this.townChannelsGrid?.querySelectorAll('.town-channel-card');
        allCards?.forEach(card => {
            if (card.dataset.channelId === channel.id) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        if (this.currentChannelText) {
            this.currentChannelText.textContent = channel.name;
        }
        if (this.currentChannelSubText) {
            this.currentChannelSubText.textContent = channel.ping === null ? channel.statusLabel : `(${channel.ping}ms • ${channel.statusLabel})`;
        }

        this.close();
    }

    open() {
        if (!this.modalOverlay) return;
        this.modalOverlay.classList.remove('hidden');
        document.body.classList.add('modal-open');
        this.updateStats();
    }

    close() {
        if (!this.modalOverlay) return;
        this.modalOverlay.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }

    isOpen() {
        return this.modalOverlay && !this.modalOverlay.classList.contains('hidden');
    }
}
