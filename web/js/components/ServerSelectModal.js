import { toastManager } from './ToastManager.js';

export class ServerSelectModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        
        // GDD Spec Capacity (Max 50 players per channel)
        this.maxCapacity = 50;
        this.totalCCU = 138; // Real-time concurrent players across town
        this.autoScaleThreshold = 0.72; // Auto-scale when load > 72% or single channel > 84%
        this.jitterTimer = null;

        // Dynamic Channel Pool (Initial active channels)
        this.townChannels = [
            { id: 'town-1', name: '타운 1', users: 44, ping: 12, isNew: false },
            { id: 'town-2', name: '타운 2', users: 26, ping: 14, isNew: false },
            { id: 'town-3', name: '타운 3', users: 14, ping: 13, isNew: false }
        ];

        this.totalCCU = this.townChannels.reduce((sum, ch) => sum + ch.users, 0);
        this.currentChannel = { id: 'town-2', name: '타운 2', ping: 14, statusLabel: '보통' };

        this.render();
        this.initDOM();
        this.initEventListeners();
        this.updateStats();
    }

    getChannelStatus(users) {
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
        const recStatus = rec ? this.getChannelStatus(rec.users) : { label: '쾌적', pct: 20 };

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
                                    <span class="chip-label">현재 접속:</span>
                                    <b id="currentChannelNameText" class="chip-val">${this.currentChannel.name}</b>
                                    <span class="chip-sub" id="currentChannelSubText">(${this.currentChannel.ping}ms • ${this.currentChannel.statusLabel})</span>
                                </div>
                            </div>
                        </div>
                        <button class="cyber-modal-close" id="btnServerModalClose" title="닫기 (ESC)">✕</button>
                    </div>

                    <!-- Auto-Scale Live Status Monitor Bar -->
                    <div class="town-autoscale-status-bar">
                        <div class="autoscale-stat-pill">
                            <span>📡 동시 접속자:</span>
                            <b id="txtTotalCCU">${this.totalCCU}명</b>
                        </div>
                        <div class="autoscale-stat-pill">
                            <span>🏙️ 활성 채널:</span>
                            <b id="txtActiveChannelsCount">${this.townChannels.length}개</b>
                        </div>
                        <div class="autoscale-stat-pill">
                            <span class="autoscale-mode-tag">
                                <i class="pulse-dot"></i> 오토스케일링 가동중
                            </span>
                        </div>
                    </div>

                    <!-- Town Channel Description & Action Controls -->
                    <div class="town-channel-intro">
                        <div class="intro-left">
                            <span class="intro-icon">🏙️</span>
                            <div class="intro-text">
                                <h3 class="intro-title">퍼블릭 타운 채널 (Auto-Scaled)</h3>
                                <p class="intro-desc">모든 채널이 보통(주황 45%+) 이상 도달 시 새 채널이 증설됩니다. (채널당 최대 50명)</p>
                            </div>
                        </div>
                        <div class="intro-actions-group">
                            <button class="btn-autoscale-action btn-surge" id="btnSimulateSurge" title="트래픽 인구 증가 시뮬레이션">
                                <span>⚡ 유저 유입 (+30명)</span>
                            </button>
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
                        <span class="ping-text">📶 ${ch.ping}ms</span>
                        <span class="density-text">${ch.users}/${this.maxCapacity}명 (${pct}%)</span>
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
        this.btnSimulateSurge = document.getElementById('btnSimulateSurge');
        this.btnQuickConnect = document.getElementById('btnQuickConnect');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        
        this.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.close();
            }
        });

        // Traffic Surge Simulation Button
        this.btnSimulateSurge?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.simulateTrafficSurge(30);
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
                const ping = parseInt(card.dataset.ping || '14', 10);
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

    simulateTrafficSurge(amount = 30) {
        let remaining = amount;

        // 1. Fill emptiest (green/lowest load) channels first up to orange (23+) or red
        const sortedChannels = [...this.townChannels].sort((a, b) => a.users - b.users);

        for (const ch of sortedChannels) {
            if (remaining <= 0) break;
            const spaceInChannel = this.maxCapacity - ch.users;
            if (spaceInChannel > 0) {
                const targetAdd = Math.min(remaining, Math.min(spaceInChannel, Math.floor(Math.random() * 5) + 12));
                ch.users += targetAdd;
                remaining -= targetAdd;
            }
        }

        // 2. Check if all channels are now in orange (>= 45%) or red (>= 85%) stage
        const didScale = this.checkAndScale();

        // 3. If a new channel was spawned and there is still remaining traffic, place it into the new channel
        if (didScale && remaining > 0) {
            const newChannel = this.townChannels[this.townChannels.length - 1];
            const add = Math.min(remaining, 8);
            newChannel.users = Math.min(this.maxCapacity, newChannel.users + add);
            remaining -= add;
        }

        this.totalCCU = this.townChannels.reduce((sum, ch) => sum + ch.users, 0);
        this.updateStats();
        toastManager.show(`⚡ [트래픽 증가] 동시 접속자 +${amount}명 유입 (총 ${this.totalCCU}명)`, true);
    }

    checkAndScale() {
        // Condition: ONLY spawn a new channel if ALL current channels are at least in the orange (>= 45% / 23명+) stage!
        const allChannelsAtLeastOrange = this.townChannels.every(ch => {
            const pct = Math.round((ch.users / this.maxCapacity) * 100);
            return pct >= 45; // '보통' (45~84%) or '혼잡' (85%+)
        });

        if (allChannelsAtLeastOrange) {
            const nextIdx = this.townChannels.length + 1;
            const newChannelId = `town-${nextIdx}`;
            const newChannelName = `타운 ${nextIdx}`;

            // The new channel starts with low initial traffic (Green / 쾌적 12%~20%)
            const initialUsers = Math.floor(Math.random() * 5) + 6; // 6~10 users
            
            this.townChannels.push({
                id: newChannelId,
                name: newChannelName,
                users: initialUsers,
                ping: 10 + Math.floor(Math.random() * 4),
                isNew: true
            });

            this.updateStats();
            toastManager.show(`⚡ [서버 오토스케일링] 모든 채널이 보통(주황 45%+) 이상에 도달하여 신규 채널 '${newChannelName}'이 자동 증설되었습니다!`, true);
            return true;
        }
        return false;
    }

    updateStats() {
        if (this.townChannelsGrid) {
            this.townChannelsGrid.innerHTML = this.renderTownCards();
        }
        if (this.txtTotalCCU) {
            this.txtTotalCCU.textContent = `${this.totalCCU}명`;
        }
        if (this.txtActiveChannelsCount) {
            this.txtActiveChannelsCount.textContent = `${this.townChannels.length}개`;
        }
        const rec = this.getRecommendedChannel();
        if (this.txtRecChannelBtn && rec) {
            this.txtRecChannelBtn.textContent = rec.name;
        }
    }

    selectAndConnectChannel(channel) {
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
            this.currentChannelSubText.textContent = `(${channel.ping}ms • ${channel.statusLabel})`;
        }

        setTimeout(() => {
            this.close();
            if (this.callbacks.onConnect) {
                this.callbacks.onConnect(channel);
            }
        }, 160);
    }

    startJitter() {
        this.stopJitter();
        this.jitterTimer = setInterval(() => {
            if (!this.isOpen()) return;

            // Subtle fluctuation within realistic limits
            for (const ch of this.townChannels) {
                const chDelta = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2);
                ch.users = Math.max(4, Math.min(this.maxCapacity, ch.users + chDelta));
                ch.ping = Math.max(9, Math.min(22, ch.ping + (Math.random() > 0.5 ? 1 : -1)));
            }

            this.totalCCU = this.townChannels.reduce((sum, ch) => sum + ch.users, 0);
            this.checkAndScale();
            this.updateStats();
        }, 3000);
    }

    stopJitter() {
        if (this.jitterTimer) {
            clearInterval(this.jitterTimer);
            this.jitterTimer = null;
        }
    }

    open() {
        if (!this.modalOverlay) return;
        this.modalOverlay.classList.remove('hidden');
        document.body.classList.add('modal-open');
        this.updateStats();
        this.startJitter();
    }

    close() {
        if (!this.modalOverlay) return;
        this.stopJitter();
        this.modalOverlay.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }

    isOpen() {
        return this.modalOverlay && !this.modalOverlay.classList.contains('hidden');
    }
}
