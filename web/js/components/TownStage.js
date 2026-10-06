/**
 * TownStage Component (RPG 탑다운 마을 무대 컨트롤러)
 * Modular architecture:
 * - TownBuildingRenderer: HTML markup for buildings, props, and modals
 * - TownPlayerController: 2D ground-plane movement, inputs, and camera tracking
 * - townWorldData: Canonical world layout definitions
 */

import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS, TOWN_BILLBOARD_NEWS } from '../data/townWorldData.js';
import { townEntrance, TOWN_VIEW_SCALE, TOWN_SCENERY_ENABLED } from '../data/townLayout.js';
import { TownBuildingRenderer } from './town/TownBuildingRenderer.js';
import { TownPlayerController } from './town/TownPlayerController.js';
import { TOWN_LANDSCAPE_INTERACTIVE } from '../data/townLandscape.js';
import { TownVendingModal } from './town/TownVendingModal.js';
import { TOWN_OCCLUDERS, getTownVisibility } from './town/TownOcclusion.js';
import { TownPresenceSync } from './town/TownPresenceSync.js';
import { SkyBackground } from './sky/SkyBackground.js';
import { getBillboardBroadcast, formatCipherIndex } from './town/TownBillboardBroadcast.js';

export class TownStage {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = { ...callbacks, isInputBlocked: () => this.vendingModal?.isOpen || callbacks.isInputBlocked?.() };
        this.vendingModal = new TownVendingModal(container, callbacks);
        this.nickname = '사이퍼 트레이더';
        this.remotePlayers = new Map();
        this.presenceSync = new TownPresenceSync(this, window.stockWarsPresence);
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
                return this.callbacks.onHeal?.();
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
            <div id="townStageContainer" class="town-stage-container hidden ${TOWN_SCENERY_ENABLED ? '' : 'town-scenery-paused'}">
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

                <!-- Town Movement Controls Hint -->
                <div class="town-controls-hint" id="townControlsHint">
                    <span class="hint-icon">🎮</span>
                    <span class="hint-text">마을 탐색: <b>W A S D / 방향키</b> 이동 | <b>Shift</b> 달리기 | <b>F 키 / 클릭</b> 상호작용</span>
                </div>

                <!-- Main Town Viewport & Camera Stage -->
                <div class="town-viewport" id="townViewport">
                    <!-- Parallax Background Layer -->
                    <div class="town-parallax-bg" id="townParallaxBg">
                        ${SkyBackground.getTemplateHtml('townSkyContainer')}
                        <div class="parallax-skyline"></div>
                    </div>

                    <!-- Town World Scroll Track -->
                    <div class="town-world-track" id="townWorldTrack" style="width: ${this.playerController.worldWidth}px; height: ${this.playerController.worldHeight}px;">
                        <div class="town-surroundings" aria-hidden="true"></div>
                        <svg class="town-outer-road" viewBox="-140 -140 3980 2880" aria-hidden="true" focusable="false">
                            <defs>
                                <pattern id="townOuterRoadTexture" width="512" height="128" patternUnits="userSpaceOnUse">
                                    <rect width="512" height="128" fill="#43576b" />
                                    <svg width="512" height="128" viewBox="0 232 2172 100" preserveAspectRatio="none">
                                        <image href="${new URL('../../assets/ground/topdown-v1/RoadStraight.png', import.meta.url).href}" width="2172" height="724" />
                                    </svg>
                                </pattern>
                            </defs>
                            <path fill="url(#townOuterRoadTexture)" fill-rule="evenodd" d="M-260 -140H3840V2740H-260Z M-120 0H3700V2600H-120Z" />
                            <rect x="-10000" y="-10000" width="10020" height="22600" fill="url(#townOuterRoadTexture)" />
                            <rect x="3560" y="-10000" width="10000" height="22600" fill="url(#townOuterRoadTexture)" />
                            <!-- Opposite sidewalks align with the central block, including side curbs. -->
                            <path class="town-road-curb" d="M20 -10000V-140H3560V-10000 M20 12600V2740H3560V12600" />
                            ${[ { x: 1221, y: -128 }, { x: 1781, y: 2612 } ].map(({ x, y }) => `
                                <svg x="${x}" y="${y}" width="118" height="116" viewBox="966 220 240 284" preserveAspectRatio="none" overflow="hidden">
                                    <rect x="966" y="220" width="240" height="284" fill="#43576b" />
                                    <image href="${new URL('../../assets/ground/topdown-v1/RoadCrosswalk.png', import.meta.url).href}" width="2172" height="724" />
                                </svg>
                            `).join('')}
                        </svg>
                        <!-- Roads are walkable ground; props remain independently paused. -->
                        <svg class="town-road-network" viewBox="0 0 3700 2600" aria-hidden="true" focusable="false">
                            <defs>
                                <pattern id="townAsphalt" width="512" height="128" patternUnits="userSpaceOnUse">
                                    <rect width="512" height="128" fill="#43576b" />
                                    <svg width="512" height="128" viewBox="0 232 2172 100" preserveAspectRatio="none">
                                        <image href="${new URL('../../assets/ground/topdown-v1/RoadStraight.png', import.meta.url).href}" width="2172" height="724" />
                                    </svg>
                                </pattern>
                            </defs>
                            <path fill="url(#townAsphalt)" fill-rule="evenodd" d="M-120 0H3700V2600H-120Z M20 140H3560V2460H20Z" />
                            <path class="town-road-curb" d="M20 140H3560V2460H20Z" />
                            <path class="town-road-centerline" d="M-120 0H3700V2600H-120Z" />
                            <!-- Crop the crossing section of the matching road asset.
                                 North: gap between office and securities; south: central walkway. -->
                            ${[ { x: 1221, y: 12 }, { x: 1781, y: 2472 } ].map(({ x, y }) => `
                                <svg x="${x}" y="${y}" width="118" height="116" viewBox="966 220 240 284" preserveAspectRatio="none" overflow="hidden">
                                    <rect x="966" y="220" width="240" height="284" fill="#43576b" />
                                    <image href="${new URL('../../assets/ground/topdown-v1/RoadCrosswalk.png', import.meta.url).href}" width="2172" height="724" />
                                </svg>
                            `).join('')}
                        </svg>
                        <!-- Buildings Row Layer -->
                        ${TownBuildingRenderer.renderLandscapeGroundHTML()}
                        ${TownBuildingRenderer.renderLandscapeHTML()}
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

                        <!-- RPG Player Character -->
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

                        <!-- Ground Plane (Sidewalk & Asphalt Road) -->
                        <div class="town-ground-platform" id="townGroundPlatform" aria-hidden="true"></div>

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
            if (this.callbacks.isInputBlocked?.()) return;
            if (e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
            const key = e.key.toLowerCase();
            if (!this.billboardModal.classList.contains('hidden') && key !== 'escape') return;
            if ((key === 'enter' || key === ' ') && e.target?.closest?.('.town-landscape-bench')) {
                e.preventDefault();
                if (!e.repeat) e.target.closest('.town-landscape-bench').click();
                return;
            }
            if (key === 'f') {
                if (e.repeat || e.defaultPrevented) return;
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
        window.addEventListener('blur', () => {
            this.playerController.keysHeld.clear();
        });

        this.btnReturnOffice?.addEventListener('click', () => {
            if (this.callbacks.isInputBlocked?.()) return;
            this.playerController.placeAt(TOWN_BUILDINGS.find(b => b.id === 'home_office_tower'));
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
            if (this.callbacks.isInputBlocked?.()) return;
            const targetBuilding = e.target.closest('.town-building-box');
            if (targetBuilding) {
                const bId = targetBuilding.dataset.buildingId;
                const building = TOWN_BUILDINGS.find(b => b.id === bId);
                if (building && building.available !== false) {
                    this.playerController.placeAt(building);
                    this.checkProximity();
                    this.triggerAction(building);
                }
                return;
            }

            const targetProp = e.target.closest('.town-bench-prop, .town-billboard-prop, .town-landscape-bench');
            if (targetProp) {
                const pId = targetProp.dataset.propId;
                const prop = [...TOWN_INTERACTIVE_PROPS, ...TOWN_LANDSCAPE_INTERACTIVE].find(p => p.id === pId);
                if (prop) {
                    this.playerController.placeAt(prop);
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
        this.refreshBillboard();
        this.billboardTimer = setInterval(() => this.refreshBillboard(), 1000);
    }

    refreshBillboard(date = new Date()) {
        const state = this.callbacks.getBillboardState?.() || {};
        const ads = TOWN_BILLBOARD_NEWS.filter(item => item.type === 'ad' || item.type === 'event');
        const broadcast = getBillboardBroadcast(date, state.news || [], ads);
        const screen = this.containerEl?.querySelector('.billboard-screen-frame');
        if (!screen) return;
        const badge = screen.querySelector('.news-badge');
        badge.className = `news-badge badge-${broadcast.type}`;
        badge.textContent = broadcast.badge;
        const body = screen.querySelector('.news-body-text');
        if (screen.classList.contains('town-information-screen')) {
            let copy = body.querySelector('.town-board-copy');
            if (!copy) {
                copy = document.createElement('span');
                copy.className = 'town-board-copy';
                body.replaceChildren(copy);
            }
            if (copy.textContent !== broadcast.text) {
                copy.textContent = broadcast.text;
                copy.classList.remove('is-scrolling');
            }
            // Keep header/ticker fixed; unusually long broadcasts reveal their full text.
            const overflow = Math.max(0, copy.scrollHeight - body.clientHeight);
            copy.style.setProperty('--board-scroll-distance', `-${overflow}px`);
            copy.style.setProperty('--board-scroll-duration', `${Math.max(10, overflow / 12 + 6)}s`);
            copy.classList.toggle('is-scrolling', overflow > 1);
        } else {
            body.textContent = broadcast.text;
        }
        screen.querySelector('.live-title').textContent = broadcast.title;
        if (state.cipherIndex) {
            const text = formatCipherIndex(state.cipherIndex);
            screen.querySelectorAll('.cipher-index-value').forEach(item => {
                if (item.textContent !== text) item.textContent = text;
            });
        }
    }

    update(dt) {
        if (this.callbacks.isInputBlocked?.() || !this.billboardModal.classList.contains('hidden')) {
            // Release movement held before entering the mini-game as well.
            this.playerController.keysHeld.clear();
            this.playerController.isMoving = false;
            this.playerController.walkPhase = 0;
        } else {
            this.playerController.update(dt, this.viewportEl.clientWidth / TOWN_VIEW_SCALE, this.viewportEl.clientHeight / TOWN_VIEW_SCALE);
        }

        // Apply World & Camera Transforms
        if (this.worldTrackEl) {
            this.worldTrackEl.style.transform = `translate(${-this.playerController.cameraX * TOWN_VIEW_SCALE}px, ${-this.playerController.cameraY * TOWN_VIEW_SCALE}px) scale(${TOWN_VIEW_SCALE})`;
        }
        if (this.parallaxBgEl) {
            this.parallaxBgEl.style.width = `calc(100% + ${this.playerController.worldWidth * 0.25}px)`;
            this.parallaxBgEl.style.transform = `translateX(${-this.playerController.cameraX * 0.25}px)`;
        }
        if (this.townChar) {
            const position = this.playerController.renderPosition;
            this.townChar.style.left = `${position.x}px`;
            this.townChar.style.top = `${position.y}px`;
            this.townChar.style.zIndex = `${position.z}`;
            this.townChar.dataset.facing = this.playerController.facing;
            const flip = this.playerController.charFacing < 0 ? 'scaleX(-1)' : 'scaleX(1)';
            const bounce = this.playerController.isMoving ? Math.sin(this.playerController.walkPhase) * 6 : 0;
            if (this.charBody) {
                this.charBody.style.transform = `${flip} translateY(${-bounce}px)`;
            }
        }

        this.updatePlayerOcclusion();
        this.worldTrackEl.querySelectorAll('.town-urban-tree').forEach(tree => {
            const behind = this.playerController.charPosY < 1240 && this.playerController.charPosY > 960 &&
                Math.abs(this.playerController.charPosX - parseFloat(tree.style.left) - 120) < 130;
            tree.classList.toggle('player-behind', behind);
        });
        this.checkProximity();
    }

    // Complete remote snapshot for the active channel; coordinates use the town ground plane.
    setRemotePlayers(players = []) {
        const seen = new Set();
        for (const player of players) {
            if (player.location && player.location !== 'town') continue;
            if (!player.id || player.isLocal || !Number.isFinite(player.x) || !Number.isFinite(player.y)) continue;
            seen.add(player.id);
            let entry = this.remotePlayers.get(player.id);
            if (!entry) {
                const element = this.townChar.cloneNode(true);
                element.removeAttribute('id');
                element.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
                element.classList.remove('resting-bench');
                element.classList.add('town-remote-player');
                element.style.pointerEvents = 'auto';
                element.style.cursor = 'pointer';
                element.setAttribute('role', 'button');
                element.tabIndex = 0;
                element.addEventListener('click', event => { event.stopPropagation(); void this.callbacks.onOpenPlayerProfile?.(entry.player); });
                element.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); element.click(); }
                });
                this.worldTrackEl.appendChild(element);
                entry = { element };
                this.remotePlayers.set(player.id, entry);
            }
            const now=performance.now();
            const duration=Math.min(1000,Math.max(200,now-(entry.receivedAt||now-300)));
            if(!entry.receivedAt||entry.poseAt!==player.poseAt||entry.targetX!==player.x||entry.targetY!==player.y){
                entry.fromX=entry.x??player.x;entry.fromY=entry.y??player.y;
                entry.targetX=player.x;entry.targetY=player.y;entry.receivedAt=now;entry.duration=duration;entry.poseAt=player.poseAt;
            }
            Object.assign(entry, { id: player.id });
            entry.x??=player.x;entry.y??=player.y;
            entry.player = { ...player };
            entry.element.setAttribute('aria-label', `${player.nickname || '플레이어'} 프로필 보기`);
            entry.element.querySelector('.town-char-nametag').textContent = player.nickname || '플레이어';
            const seat = player.resting && TOWN_LANDSCAPE_INTERACTIVE.find(p => p.type === 'bench' &&
                Math.hypot(townEntrance(p).x - player.x, townEntrance(p).y - player.y) < 20);
            entry.element.style.left = `${seat ? seat.x + seat.width / 2 : entry.x}px`;
            entry.element.style.top = `${seat ? seat.y - seat.height * .24 : entry.y}px`;
            entry.element.style.zIndex = `${seat ? Math.ceil(seat.y) + 1 : Math.round(player.y)}`;
            entry.element.dataset.facing = player.facing || 'down';
            entry.element.classList.toggle('resting-bench', !!player.resting);
            entry.element.querySelector('.town-char-body').style.transform = '';
        }
        for (const [id, entry] of this.remotePlayers) {
            if (!seen.has(id)) { entry.element.remove(); this.remotePlayers.delete(id); }
        }
        this.updatePlayerOcclusion();
        if(!this.remoteFrame&&this.remotePlayers.size)this.animateRemotePlayers();
    }

    animateRemotePlayers(){
        const now=performance.now();
        for(const entry of this.remotePlayers.values()){
            const t=Math.min(1,(now-entry.receivedAt)/(entry.duration||300));
            entry.x=entry.fromX+(entry.targetX-entry.fromX)*t;entry.y=entry.fromY+(entry.targetY-entry.fromY)*t;
            if(!entry.player.resting){entry.element.style.left=`${entry.x}px`;entry.element.style.top=`${entry.y}px`;entry.element.style.zIndex=String(Math.round(entry.y));}
            const walking=t<1&&Math.hypot(entry.targetX-entry.fromX,entry.targetY-entry.fromY)>1;
            entry.element.querySelector('.town-char-body').style.transform=`translateY(${walking?-Math.abs(Math.sin(now/100))*4:0}px)`;
        }
        this.updatePlayerOcclusion();
        this.remoteFrame=this.remotePlayers.size?requestAnimationFrame(()=>this.animateRemotePlayers()):null;
    }

    updatePlayerOcclusion() {
        const visibility = getTownVisibility(
            { x: this.playerController.charPosX, y: this.playerController.charPosY },
            [...this.remotePlayers.values()]);
        for (const object of TOWN_OCCLUDERS) {
            this.worldTrackEl.querySelector(`#${object.elementId}`)?.classList.toggle('player-behind', visibility.fadedObjects.has(object.elementId));
        }
        for (const [id, entry] of this.remotePlayers) {
            // Hide the whole remote avatar, including name and shadow; opacity on the
            // foreground artwork must never reveal it through a locally faded object.
            entry.element.style.display = visibility.hiddenPlayers.has(id) ? 'none' : '';
        }
    }

    checkProximity() {
        const { charPosX, charPosY } = this.playerController;
        const candidates = [
            ...TOWN_BUILDINGS.filter(b => b.available !== false).map(b => ({ ...b, kind: 'building' })),
            ...TOWN_INTERACTIVE_PROPS.map(p => ({ ...p, kind: 'prop' })),
            ...TOWN_LANDSCAPE_INTERACTIVE
        ];
        const nearby = candidates.map(object => {
            const entry = townEntrance(object);
            return { object, distance: Math.hypot(charPosX - entry.x, charPosY - entry.y) };
        }).filter(item => item.distance <= 90).sort((a, b) => a.distance - b.distance)[0]?.object;

        this.activeNearbyObject = nearby;
        if (nearby && this.promptEl) {
            this.promptEl.classList.remove('hidden');
            this.promptEl.style.left = `${townEntrance(nearby).x}px`;
            
            this.promptEl.style.top = `${nearby.y - 150}px`;
            this.promptEl.style.bottom = "auto";

            if (this.promptIcon) this.promptIcon.textContent = nearby.icon || '🏢';
            if (this.promptTitle) this.promptTitle.textContent = nearby.name || '';
            if (this.promptDesc) this.promptDesc.textContent = nearby.actionText || nearby.desc || '';
        } else if (this.promptEl) {
            this.promptEl.classList.add('hidden');
        }
    }

    triggerAction(obj) {
        if (this.callbacks.isInputBlocked?.()) return;
        if (!obj || obj.available === false) return;
        if (obj.kind === 'prop' || obj.type === 'bench' || obj.type === 'billboard') {
            if (obj.type === 'bench') {
                this.playerController.restOnBench(obj, this.townChar, this.worldTrackEl);
            } else if (obj.type === 'billboard') {
                this.billboardModal?.classList.remove('hidden');
            } else if (obj.type === 'vending') {
                this.playerController.keysHeld.clear();
                this.vendingModal.open();
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
        if (this.channelText) this.channelText.textContent = channel.ping == null
            ? `채널: ${channel.name}`
            : `채널: ${channel.name} (원활 • ${channel.ping}ms)`;

        const aliases = { logistics: 'bit_logistics', vivian: 'vivian_store' };
        const destination = TOWN_BUILDINGS.find(b => b.id === (aliases[spawnLocation] || spawnLocation));
        if (destination) this.playerController.placeAt(destination);
        else if (typeof spawnLocation === 'number') {
            this.playerController.placeAt({ x: Math.max(60, Math.min(this.playerController.worldWidth - 60, spawnLocation)), width: 0, y: 1000 });
        } else if (!this.hasVisited) {
            this.playerController.placeAt(TOWN_BUILDINGS.find(b => b.id === 'home_office_tower'));
        }
        this.hasVisited = true;
        this.playerController.stopResting();
        this.playerController.keysHeld.clear();
        this.playerController.updateCamera(this.viewportEl.clientWidth / TOWN_VIEW_SCALE, this.viewportEl.clientHeight / TOWN_VIEW_SCALE, 0, true);
        this.update(0);
        this.checkProximity();
        if(!this.callbacks.externalPresence)this.presenceSync?.start();
    }

    hide() {
        this.presenceSync?.stop();
        this.setRemotePlayers([]);
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
