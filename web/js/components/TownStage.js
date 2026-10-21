import { TownStageMethods1 } from './town/TownStageMethods1.js';
import { TownStageMethods2 } from './town/TownStageMethods2.js';
import { updateCharacterSprite as updateDogSprite } from './CharacterSprite.js';
import { gameKey, bindingLabel } from '../app/GameKeys.js';
/**
 * TownStage Component (RPG 탑다운 마을 무대 컨트롤러)
 * Modular architecture:
 * - TownBuildingRenderer: HTML markup for buildings, props, and modals
 * - TownPlayerController: 2D ground-plane movement, inputs, and camera tracking
 * - townWorldData: Canonical world layout definitions
 */

import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS } from '../data/townWorldData.js';
import { townEntrance, TOWN_VIEW_SCALE, TOWN_SCENERY_ENABLED } from '../data/townLayout.js';
import { TownBuildingRenderer } from './town/TownBuildingRenderer.js';
import { TownPlayerController } from './town/TownPlayerController.js';
import { TOWN_LANDSCAPE_INTERACTIVE } from '../data/townLandscape.js';
import { TownVendingModal } from './town/TownVendingModal.js';
import { TOWN_OCCLUDERS, getTownVisibility } from './town/TownOcclusion.js';
import { TownPresenceSync } from './town/TownPresenceSync.js';
import { SkyBackground } from './sky/SkyBackground.js';

export class TownStage {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = { ...callbacks, isInputBlocked: () => this.buildingInfoOpen || this.vendingModal?.isOpen || callbacks.isInputBlocked?.() };
        this.vendingModal = new TownVendingModal(container, callbacks);
        this.nickname = '사이퍼 트레이더';
        this.remotePlayers = new Map();
        this.presenceSync = new TownPresenceSync(this, window.stockWarsPresence);
        this.activeChannel = '타운 2';
        this.activeNearbyObject = null;
        this.animFrameId = null;
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
                    <span class="hint-text">마을 탐색: <b>${['w', 'a', 's', 'd'].map(action => `<span data-game-key="${action}">${bindingLabel(action)}</span>`).join(' ')} / 방향키</b> 이동 | <b data-game-key="shift">${bindingLabel('shift')}</b> 달리기 | <b><span data-game-key="f">${bindingLabel('f')}</span> 키 / 클릭</b> 상호작용</span>
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
                        <!-- Invisible interaction markers; village artwork is rendered in 3D. -->
                        <div class="town-buildings-layer" id="townBuildingsLayer">
                            ${TownBuildingRenderer.renderBuildingsHTML()}
                        </div>

                        <!-- Interactive Props Layer (Benches) -->
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
                            <span class="prompt-hotkey-btn" data-game-key="f">${bindingLabel('f')}</span>
                        </div>
                    </div>
                </div>

                <div class="town-building-modal-overlay hidden" id="townBuildingInfoModal">
                    <section class="town-building-modal-dialog town-building-info-dialog" role="dialog" aria-modal="true" aria-labelledby="townBuildingInfoTitle" aria-describedby="townBuildingInfoDesc townBuildingInfoStatus">
                        <div class="town-building-modal-header">
                            <div class="modal-title-group">
                                <span class="modal-title-icon" id="townBuildingInfoIcon" aria-hidden="true"></span>
                                <div><h3 class="modal-title-text" id="townBuildingInfoTitle"></h3><p class="modal-subtitle-text" id="townBuildingInfoCategory"></p></div>
                            </div>
                            <button class="modal-close-btn" id="btnBuildingInfoClose" aria-label="건물 설명 닫기">✕</button>
                        </div>
                        <div class="town-building-info-body">
                            <p id="townBuildingInfoDesc"></p>
                            <span class="town-building-info-status" id="townBuildingInfoStatus">오픈 준비중</span>
                            <p class="town-building-info-hint">[ESC] 닫기</p>
                        </div>
                    </section>
                </div>
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

        this.buildingInfoModal = document.getElementById('townBuildingInfoModal');
        this.btnBuildingInfoClose = document.getElementById('btnBuildingInfoClose');

        // Dynamic Atmospheric Sky System
        if (this.parallaxBgEl) {
            this.skyBackground = new SkyBackground(this.parallaxBgEl);
        }
    }


}
Object.assign(TownStage.prototype, TownStageMethods1, TownStageMethods2);
