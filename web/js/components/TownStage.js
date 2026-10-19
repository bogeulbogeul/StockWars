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
        this.callbacks = { ...callbacks, isInputBlocked: () => this.buildingInfoOpen || this.vendingModal?.isOpen || callbacks.isInputBlocked?.() };
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
                            <span class="prompt-hotkey-btn" data-game-key="f">${bindingLabel('f')}</span>
                        </div>
                    </div>
                </div>

                <!-- Electronic Billboard News & Ad Interactive Modal -->
                ${TownBuildingRenderer.renderBillboardModalHTML()}
                <div class="town-billboard-modal-overlay hidden" id="townBuildingInfoModal">
                    <section class="town-billboard-modal-dialog town-building-info-dialog" role="dialog" aria-modal="true" aria-labelledby="townBuildingInfoTitle" aria-describedby="townBuildingInfoDesc townBuildingInfoStatus">
                        <div class="billboard-modal-header">
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
        this.billboardModal = document.getElementById('townBillboardModal');
        this.btnBillboardClose = document.getElementById('btnBillboardClose');

        this.buildingInfoModal = document.getElementById('townBuildingInfoModal');
        this.btnBuildingInfoClose = document.getElementById('btnBuildingInfoClose');

        // Dynamic Atmospheric Sky System
        if (this.parallaxBgEl) {
            this.skyBackground = new SkyBackground(this.parallaxBgEl);
        }
    }


}
Object.assign(TownStage.prototype, TownStageMethods1, TownStageMethods2);
