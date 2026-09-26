/**
 * TownStage Component (2D 횡스크롤 마을 무대 컨트롤러)
 * Unity equivalent: TownScene / TownGroundController.cs / TownCameraController.cs
 * Modular architecture:
 * - TownBuildingRenderer: HTML markup for buildings, props, and modals
 * - TownPlayerController: 2D side-view physics, inputs, and camera tracking
 * - townWorldData: Canonical world layout definitions
 */

import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS, TOWN_BILLBOARD_NEWS } from '../data/townWorldData.js';
import { TownBuildingRenderer } from './town/TownBuildingRenderer.js';
import { TownPlayerController } from './town/TownPlayerController.js';
import { SkyBackground } from './sky/SkyBackground.js';

export class TownStage {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.nickname = '사이퍼 트레이더';
        this.activeChannel = '타운 2';
        this.activeNearbyObject = null;
        this.animFrameId = null;
        this.billboardTimer = null;
        this.billboardSlideIdx = 0;
        this.lastTimestamp = performance.now();
        this.skyBackground = null;

        this.playerController = new TownPlayerController({
            onRestStateChange: (resting) => {
                this.townChar?.classList.toggle('resting-bench', resting);
            },
            onHeal: () => {
                if (this.callbacks.onHeal) this.callbacks.onHeal();
            }
        });

        this.render();
        this.initDOM();
        this.initEventListeners();
        this.startLoop();
        this.startBillboardCarousel();
    }

    render() {
        const html = `
            <div id="townStageContainer" class="town-stage-container hidden">
                <!-- Town Top Info Header -->
                <div class="town-channel-header-hud">
                    <div class="town-hud-left">
                        <span class="town-hud-badge">🏙️ PUBLIC TOWN</span>
                        <span class="town-channel-name" id="townActiveChannelText">채널: 타운 2 (원활 • 14ms)</span>
                    </div>
                    <div class="town-hud-right">
                        <button class="town-return-btn" id="btnTownReturnOffice" title="내 오피스로 이동">
                            <span>🏠 내 오피스로 복귀</span>
                        </button>
                    </div>
                </div>

                <!-- Town Side-Scrolling Controls Hint -->
                <div class="town-controls-hint" id="townControlsHint">
                    <span class="hint-icon">🎮</span>
                    <span class="hint-text">마을 탐색: <b>A, D / 방향키</b> 이동 | <b>F 키 / 클릭</b> 상호작용</span>
                </div>

                <!-- Main Town Viewport & Camera Stage -->
                <div class="town-viewport" id="townViewport">
                    <!-- Parallax Background Layer -->
                    <div class="town-parallax-bg" id="townParallaxBg">
                        ${SkyBackground.getTemplateHtml('townSkyContainer')}
                        <div class="parallax-skyline"></div>
                    </div>

                    <!-- Town World Scroll Track -->
                    <div class="town-world-track" id="townWorldTrack" style="width: ${this.playerController.worldWidth}px;">
                        <!-- Buildings Row Layer -->
                        <div class="town-buildings-layer" id="townBuildingsLayer">
                            ${TownBuildingRenderer.renderBuildingsHTML()}
                        </div>

                        <!-- Interactive Props Layer (Benches & Electronic Billboard) -->
                        <div class="town-interactive-props-layer" id="townInteractivePropsLayer">
                            ${TownBuildingRenderer.renderInteractivePropsHTML()}
                        </div>

                        <!-- Decorative Street Props & Lamps Layer -->
                        <div class="town-street-props" id="townStreetProps">
                            ${TownBuildingRenderer.renderStreetPropsHTML()}
                        </div>

                        <!-- 2D Side-View Player Character -->
                        <div class="town-player-character" id="townPlayerChar" style="left: ${this.playerController.charPosX}px;">
                            <div class="town-char-nametag" id="townPlayerNametag">${this.nickname}</div>
                            <!-- 3D/2D Character Body -->
                            <div class="town-char-body" id="townCharBody">
                                <div class="char-face-front">
                                    <span class="char-eye left"></span>
                                    <span class="char-eye right"></span>
                                    <span class="char-smile"></span>
                                    <span class="char-badge-pip"></span>
                                </div>
                            </div>
                            <div class="town-char-shadow"></div>
                        </div>

                        <!-- Ground Platform (Sidewalk & Asphalt Road) -->
                        <div class="town-ground-platform" id="townGroundPlatform">
                            <div class="ground-sidewalk-top"></div>
                            <div class="ground-pavement-body">
                                <div class="road-dashed-line"></div>
                            </div>
                        </div>

                        <!-- Proximity Action Prompt Overlay (Positioned above Building Roof) -->
                        <div class="town-building-prompt hidden" id="townBuildingPrompt">
                            <span class="prompt-icon" id="promptIcon">🏢</span>
                            <div class="prompt-info">
                                <span class="prompt-building-title" id="promptBuildingTitle">사이퍼 증권 본점</span>
                                <span class="prompt-building-desc" id="promptBuildingDesc">증권사 객장 입장</span>
                            </div>
                            <span class="prompt-hotkey-btn">F</span>
                        </div>
                    </div>
                </div>

                <!-- Electronic Billboard News & Ad Interactive Modal -->
                ${TownBuildingRenderer.renderBillboardModalHTML()}
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.containerEl = document.getElementById('townStageContainer');
        this.viewportEl = document.getElementById('townViewport');
        this.worldTrackEl = document.getElementById('townWorldTrack');
        this.parallaxBgEl = document.getElementById('townParallaxBg');
        this.townChar = document.getElementById('townPlayerChar');
        this.charBody = document.getElementById('townCharBody');
        this.nameTag = document.getElementById('townPlayerNametag');
        this.promptEl = document.getElementById('townBuildingPrompt');
        this.promptIcon = document.getElementById('promptIcon');
        this.promptTitle = document.getElementById('promptBuildingTitle');
        this.promptDesc = document.getElementById('promptBuildingDesc');
        this.btnReturnOffice = document.getElementById('btnTownReturnOffice');
        this.channelText = document.getElementById('townActiveChannelText');
        this.billboardModal = document.getElementById('townBillboardModal');
        this.btnBillboardClose = document.getElementById('btnBillboardClose');

        // Dynamic Atmospheric Sky System
        if (this.parallaxBgEl) {
            this.skyBackground = new SkyBackground(this.parallaxBgEl);
        }
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.containerEl?.classList.contains('hidden')) return;
            const key = e.key.toLowerCase();
            if (key === 'f') {
                if (this.activeNearbyObject) this.triggerAction(this.activeNearbyObject);
            } else if (key === 'escape') {
                if (this.billboardModal && !this.billboardModal.classList.contains('hidden')) {
                    this.billboardModal.classList.add('hidden');
                }
            }
            this.playerController.handleKeyDown(e);
        });

        window.addEventListener('keyup', (e) => {
            this.playerController.handleKeyUp(e);
        });

        this.btnReturnOffice?.addEventListener('click', () => {
            if (this.callbacks.onReturnOffice) this.callbacks.onReturnOffice();
        });

        this.promptEl?.addEventListener('click', () => {
            if (this.activeNearbyObject) this.triggerAction(this.activeNearbyObject);
        });

        this.btnBillboardClose?.addEventListener('click', () => {
            this.billboardModal?.classList.add('hidden');
        });

        this.billboardModal?.addEventListener('click', (e) => {
            if (e.target === this.billboardModal) {
                this.billboardModal.classList.add('hidden');
            }
        });

        // Click on buildings or interactive props
        this.viewportEl?.addEventListener('click', (e) => {
            const targetBuilding = e.target.closest('.town-building-box');
            if (targetBuilding) {
                const bId = targetBuilding.dataset.buildingId;
                const building = TOWN_BUILDINGS.find(b => b.id === bId);
                if (building) {
                    this.playerController.charPosX = building.x + building.width / 2;
                    this.checkProximity();
                    this.triggerAction(building);
                }
                return;
            }

            const targetProp = e.target.closest('.town-bench-prop, .town-billboard-prop');
            if (targetProp) {
                const pId = targetProp.dataset.propId;
                const prop = TOWN_INTERACTIVE_PROPS.find(p => p.id === pId);
                if (prop) {
                    this.playerController.charPosX = prop.x + prop.width / 2;
                    this.checkProximity();
                    this.triggerAction(prop);
                }
                return;
            }
        });
    }

    startLoop() {
        const loop = (now) => {
            const dt = Math.min(0.1, (now - this.lastTimestamp) / 1000);
            this.lastTimestamp = now;

            if (!this.containerEl?.classList.contains('hidden')) {
                this.update(dt);
            }
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    startBillboardCarousel() {
        if (this.billboardTimer) clearInterval(this.billboardTimer);
        this.billboardTimer = setInterval(() => {
            const slides = document.querySelectorAll('.billboard-news-slide');
            if (!slides || slides.length === 0) return;
            slides[this.billboardSlideIdx]?.classList.remove('active');
            this.billboardSlideIdx = (this.billboardSlideIdx + 1) % slides.length;
            slides[this.billboardSlideIdx]?.classList.add('active');
        }, 4000);
    }

    update(dt) {
        this.playerController.update(dt);

        // Apply World & Camera Transforms
        if (this.worldTrackEl) {
            this.worldTrackEl.style.transform = `translateX(${-this.playerController.cameraX}px)`;
        }
        if (this.parallaxBgEl) {
            this.parallaxBgEl.style.transform = `translateX(${-this.playerController.cameraX * 0.25}px)`;
        }
        if (this.townChar) {
            this.townChar.style.left = `${this.playerController.charPosX}px`;
            const flip = this.playerController.charFacing < 0 ? 'scaleX(-1)' : 'scaleX(1)';
            const bounce = this.playerController.isMoving ? Math.sin(this.playerController.walkPhase) * 6 : 0;
            if (this.charBody) {
                this.charBody.style.transform = `${flip} translateY(${-bounce}px)`;
            }
        }

        this.checkProximity();
    }

    checkProximity() {
        const charX = this.playerController.charPosX;
        let nearby = null;

        for (const b of TOWN_BUILDINGS) {
            const center = b.x + b.width / 2;
            if (Math.abs(charX - center) <= b.width / 2 + 30) {
                nearby = { ...b, kind: 'building' };
                break;
            }
        }

        if (!nearby) {
            for (const p of TOWN_INTERACTIVE_PROPS) {
                const center = p.x + p.width / 2;
                if (Math.abs(charX - center) <= p.width / 2 + 25) {
                    nearby = { ...p, kind: 'prop' };
                    break;
                }
            }
        }

        this.activeNearbyObject = nearby;
        if (nearby && this.promptEl) {
            this.promptEl.classList.remove('hidden');
            this.promptEl.style.left = `${nearby.x + nearby.width / 2}px`;
            
            // 건물 상단(지붕 위) 또는 프랍 상단에 위치하도록 높이 동적 계산
            let promptBottom = 130 + (nearby.height || 230) + 16;
            if (nearby.kind === 'prop' && nearby.type === 'bench') {
                promptBottom = 130 + (nearby.height || 52) + 75;
            }
            this.promptEl.style.bottom = `${promptBottom}px`;

            if (this.promptIcon) this.promptIcon.textContent = nearby.icon || '🏢';
            if (this.promptTitle) this.promptTitle.textContent = nearby.name || '';
            if (this.promptDesc) this.promptDesc.textContent = nearby.actionText || nearby.desc || '';
        } else if (this.promptEl) {
            this.promptEl.classList.add('hidden');
        }
    }

    triggerAction(obj) {
        if (!obj) return;
        if (obj.kind === 'prop' || obj.type === 'bench' || obj.type === 'billboard') {
            if (obj.type === 'bench') {
                this.playerController.restOnBench(obj, this.townChar, this.worldTrackEl);
            } else if (obj.type === 'billboard') {
                this.billboardModal?.classList.remove('hidden');
            }
        } else {
            switch (obj.id) {
                case 'home_office_tower': if (this.callbacks.onReturnOffice) this.callbacks.onReturnOffice(); break;
                case 'bit_logistics': if (this.callbacks.onOpenLogistics) this.callbacks.onOpenLogistics(); break;
                case 'vivian_store': if (this.callbacks.onOpenStore) this.callbacks.onOpenStore(); break;
                case 'julian_furniture': if (this.callbacks.onOpenFurniture) this.callbacks.onOpenFurniture(); break;
                case 'claire_apparel': if (this.callbacks.onOpenApparel) this.callbacks.onOpenApparel(); break;
                case 'data_ink_bookstore': if (this.callbacks.onOpenBookstore) this.callbacks.onOpenBookstore(); break;
                case 'cipher_securities': if (this.callbacks.onOpenSecurities) this.callbacks.onOpenSecurities(); break;
                case 'node_finance': if (this.callbacks.onOpenBank) this.callbacks.onOpenBank(); break;
                case 'midnight_pub': if (this.callbacks.onOpenPub) this.callbacks.onOpenPub(); break;
            }
        }
    }

    show(channel = { name: '타운 2', ping: 14 }, spawnLocation = null) {
        this.containerEl?.classList.remove('hidden');
        document.body.classList.add('town-mode-active');
        this.activeChannel = channel.name;
        if (this.channelText) this.channelText.textContent = `채널: ${channel.name} (원활 • ${channel.ping}ms)`;

        if (spawnLocation === 'bit_logistics' || spawnLocation === 'logistics') {
            // Spawn in front of Bit Logistics building (x: 720, width: 280 -> center 860)
            this.playerController.charPosX = 860;
            this.playerController.charFacing = 1;
            const vpWidth = window.innerWidth;
            this.playerController.cameraX = Math.max(0, Math.min(this.playerController.worldWidth - vpWidth, 860 - vpWidth / 2));
            this.playerController.targetCameraX = this.playerController.cameraX;
        } else if (spawnLocation === 'vivian_store' || spawnLocation === 'vivian') {
            // Spawn in front of Vivian Store building (x: 1280, width: 240 -> center 1400)
            this.playerController.charPosX = 1400;
            this.playerController.charFacing = 1;
            const vpWidth = window.innerWidth;
            this.playerController.cameraX = Math.max(0, Math.min(this.playerController.worldWidth - vpWidth, 1400 - vpWidth / 2));
            this.playerController.targetCameraX = this.playerController.cameraX;
        } else if (typeof spawnLocation === 'number') {
            this.playerController.charPosX = spawnLocation;
            const vpWidth = window.innerWidth;
            this.playerController.cameraX = Math.max(0, Math.min(this.playerController.worldWidth - vpWidth, spawnLocation - vpWidth / 2));
            this.playerController.targetCameraX = this.playerController.cameraX;
        } else {
            this.playerController.charPosX = 260;
            this.playerController.cameraX = 0;
            this.playerController.targetCameraX = 0;
        }

        if (this.worldTrackEl) {
            this.worldTrackEl.style.transform = `translateX(${-this.playerController.cameraX}px)`;
        }
        if (this.townChar) {
            this.townChar.style.left = `${this.playerController.charPosX}px`;
        }

        this.playerController.isResting = false;
        this.playerController.keysHeld.clear();
        this.checkProximity();
    }

    hide() {
        this.containerEl?.classList.add('hidden');
        document.body.classList.remove('town-mode-active');
        this.playerController.keysHeld.clear();
    }

    updateUserProfile(profile) {
        if (!profile) return;
        this.nickname = profile.nickname || '사이퍼 트레이더';
        if (this.nameTag) this.nameTag.textContent = this.nickname;
    }
}