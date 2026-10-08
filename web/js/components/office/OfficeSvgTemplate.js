import { bindingLabel } from '../../app/GameKeys.js';
/**
 * OfficeSvgTemplate
 * Contains SVG isometric rendering markup and floor tile generators for OfficeStage.
 */

import { SkyBackground } from '../sky/SkyBackground.js';
import { officeFootprintPoints } from './OfficeGrid.js';
import { OFFICE_OPENINGS } from './OfficeOpeningSizing.js?v=window-grid-v1';
import { FURNITURE_THEMES } from '../../data/furnitureData.js';

export function getOfficeStageHtml() {
    return `
        <div id="isoOfficeStage" class="iso-office-stage">
            <button type="button" class="office-furniture-edit-btn" id="btnOfficeFurnitureEdit" aria-haspopup="dialog" aria-controls="furnitureEditModal" title="홈오피스 가구 편집 모드 열기">
                <span class="office-furniture-edit-icon" aria-hidden="true">🛋️</span>
                <span><strong>가구 편집</strong><small>나만의 홈오피스 꾸미기</small></span>
                <span aria-hidden="true">↗</span>
            </button>
            <!-- Dynamic Time-of-Day Sky Layer Background -->
            ${SkyBackground.getTemplateHtml('officeSkyContainer')}

            <!-- Isometric Building & Room Vector Stage (Centered Framing) -->
            <div class="iso-stage-wrapper">
                <svg class="iso-svg" id="isoSvgStage" viewBox="160 -10 680 760" preserveAspectRatio="xMidYMin meet">
                    <!-- Original artwork: the room floor sits on the building roof. -->
                    <image class="office-building-art" href="${new URL('../../../assets/office/IsomatricBuilding.png', import.meta.url).href}"
                           x="60.1" y="229.7" width="879.8" height="1231.72" pointer-events="none" />
                    <image class="office-room-art" href="${new URL('../../../assets/office/BasicRoom.png', import.meta.url).href}"
                           x="140.96" y="-27.55" width="720.38" height="720.38" pointer-events="none" />
                    <!-- Material tiles use the same axes as movement and editing. -->
                    <defs>
                        <pattern id="officeOakFloor" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="matrix(-33.75 19.1 33.75 19.1 500 320)">
                            <image href="${new URL('../../../assets/office/surfaces-v1/flooring-light-oak-v1.png', import.meta.url).href}" width="2" height="2" preserveAspectRatio="none"/>
                        </pattern>
                        <pattern id="officeIvoryLeft" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="matrix(-33.75 19.1 0 -38.2 500 320)">
                            <image href="${new URL('../../../assets/office/surfaces-v1/wallpaper-ivory-v1.png', import.meta.url).href}" width="2" height="2" preserveAspectRatio="none"/>
                        </pattern>
                        <pattern id="officeIvoryRight" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="matrix(33.75 19.1 0 -38.2 500 320)">
                            <image href="${new URL('../../../assets/office/surfaces-v1/wallpaper-ivory-v1.png', import.meta.url).href}" width="2" height="2" preserveAspectRatio="none"/>
                        </pattern>
                    </defs>
                    <g id="officeSurfaceMaterials" pointer-events="none">
                        <polygon points="500.58,34.49 230.58,193.04 230.58,471.66 500.58,320.58" fill="url(#officeIvoryLeft)"/>
                        <polygon points="500.58,34.49 772.30,193.04 772.30,471.66 500.58,320.58" fill="url(#officeIvoryRight)"/>
                        <polygon points="500.58,34.49 772.30,193.04 772.30,471.66 500.58,320.58" fill="#6f604d" opacity="0.06"/>
                        <polygon points="500.58,320.58 230.58,471.66 500.58,626.19 772.30,471.66" fill="url(#officeOakFloor)"/>
                        <!-- Restore only the brown boundary, not a strip of the old cream fill. -->
                        <path d="M230.58 193.04 L500.58 34.49 L772.30 193.04 L772.30 471.66 L500.58 320.58 L230.58 471.66 Z M500.58 34.49 L500.58 320.58 M230.58 471.66 L500.58 626.19 L772.30 471.66" fill="none" stroke="#79634b" stroke-width="1.7" stroke-linejoin="round"/>
                    </g>
                    <!-- Door on Left Wall (Interactive Office Exit Gate) -->
                    <defs><clipPath id="officeDoorArtworkClip"><polygon points="288,248 702,22 738,42 738,1224 696,1244 356,1398 320,1426 288,1410"/></clipPath></defs>
                    <g id="isoOfficeDoor" class="iso-office-door" cursor="pointer" role="button" aria-label="마을로 나가기">
                        <g transform="${OFFICE_OPENINGS.door.artworkTransform}">
                            <image href="${new URL('../../../assets/office/basic-openings-v1/door-oak-v2.png', import.meta.url).href}" width="1024" height="1536" clip-path="url(#officeDoorArtworkClip)" style="filter:${FURNITURE_THEMES.NaturalWood.displayFilter}" />
                        </g>
                        <polygon class="office-door-tutorial-highlight" points="${OFFICE_OPENINGS.door.selectionPoints}" pointer-events="none" />
                        <!-- Subtle Door Exit Light Indicator -->
                    </g>

                    <!-- Door Proximity Floating Interaction Prompt in SVG -->
                    <g id="isoDoorPrompt" class="iso-door-prompt hidden" transform="translate(315.5, 218)" cursor="pointer">
                        <rect x="-78" y="-17" width="156" height="34" rx="17" fill="rgba(11,15,26,0.94)" stroke="#00e5ff" stroke-width="1.8" />
                        <rect x="-74" y="-13" width="148" height="26" rx="13" fill="none" stroke="rgba(0,229,255,0.25)" stroke-width="1" />
                        <text x="-12" y="4.5" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff" font-family="'Inter', sans-serif">🚪 마을로 나가기</text>
                        <rect x="42" y="-9" width="22" height="18" rx="5" fill="#00e5ff" />
                        <text x="53" y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#0b0f1a" font-family="'JetBrains Mono', monospace" data-game-key="f">${bindingLabel('f')}</text>
                    </g>

                    <g id="isoOfficeWindow" pointer-events="none"><g transform="${OFFICE_OPENINGS.window.artworkTransform}">
                        <image href="${new URL('../../../assets/office/basic-openings-v1/window-oak-v3.png', import.meta.url).href}" width="1448" height="1086" style="filter:${FURNITURE_THEMES.NaturalWood.displayFilter}" />
                    </g>

                    </g>
                    <!-- Anna Proximity Floating Interaction Prompt in SVG -->
                    <g id="isoAnnaPrompt" class="iso-anna-prompt hidden" transform="translate(500, 360)" cursor="pointer">
                        <rect x="-78" y="-17" width="156" height="34" rx="17" fill="rgba(11,15,26,0.94)" stroke="#6366f1" stroke-width="1.8" />
                        <rect x="-74" y="-13" width="148" height="26" rx="13" fill="none" stroke="rgba(99,102,241,0.25)" stroke-width="1" />
                        <text x="-12" y="4.5" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff" font-family="'Inter', sans-serif">💼 안나와 대화하기</text>
                        <rect x="42" y="-9" width="22" height="18" rx="5" fill="#6366f1" />
                        <text x="53" y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#ffffff" font-family="'JetBrains Mono', monospace" data-game-key="f">${bindingLabel('f')}</text>
                    </g>

                    <!-- Interactive 8x8 Isometric Floor Grid Tiles -->
                    <g id="isoFloorTilesGroup" class="iso-floor-tiles"></g>

                    <!-- Click Target Indicator Ring -->
                    <g id="isoTargetGroup" class="iso-target-group hidden">
                        <polygon id="isoTargetTilePolygon" points="0,0 0,0 0,0 0,0" fill="rgba(0,229,255,0.35)" stroke="#00e5ff" stroke-width="2" />
                    </g>

                    <!-- 6. PLAYER CHARACTER (기본 하얀색 네모 - 3D Isometric White Square Block) -->
                    <g id="isoOfficeActors">
                    <g id="isoPlayerCharacter" class="iso-player-character" transform="translate(500, 438)">
                        <!-- Ground Shadow -->
                        <ellipse id="isoCharShadow" cx="0" cy="0" rx="22" ry="11" fill="rgba(0,0,0,0.35)" />

                        <!-- 3D White Square Character Body -->
                        <g id="isoCharBody" class="iso-char-body">
                            <!-- Top Face (White) -->
                            <polygon points="0,-50 24,-38 0,-26 -24,-38" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
                            
                            <!-- Left Face (Light Gray) -->
                            <polygon points="-24,-38 0,-26 0,2 -24,-10" fill="#f1f5f9" stroke="#1e293b" stroke-width="2.5" />
                            
                            <!-- Right Face (Medium Gray) -->
                            <polygon points="0,-26 24,-38 24,-10 0,2" fill="#e2e8f0" stroke="#1e293b" stroke-width="2.5" />

                            <!-- Minimalist Eyes on Left and Right Faces -->
                            <ellipse cx="-11" cy="-14" rx="2.5" ry="3.5" fill="#0f172a" />
                            <circle cx="-12" cy="-15" r="0.9" fill="#ffffff" />
                            
                            <ellipse cx="11" cy="-14" rx="2.5" ry="3.5" fill="#0f172a" />
                            <circle cx="10" cy="-15" r="0.9" fill="#ffffff" />

                            <!-- Smile Across Center Edge -->
                            <path d="M -4 -8 Q 0 -4 4 -8" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" />

                            <!-- Cheeks -->
                            <ellipse cx="-17" cy="-11" rx="3.5" ry="2" fill="#ff7675" opacity="0.65" />
                            <ellipse cx="17" cy="-11" rx="3.5" ry="2" fill="#ff7675" opacity="0.65" />

                            <!-- Cyan Trader Badge on Corner -->
                            <polygon points="-19,-30 -11,-26 -11,-18 -19,-22" fill="#00e5ff" stroke="#1e293b" stroke-width="1.2" />
                        </g>

                        <!-- Floating Player Nameplate Tag -->
                        <g id="isoCharNametag" transform="translate(0, -68)" class="iso-char-nametag">
                            <rect x="-42" y="-13" width="84" height="20" rx="10" fill="rgba(11,15,26,0.92)" stroke="#00e5ff" stroke-width="1.4" />
                            <text x="0" y="1.5" text-anchor="middle" font-size="10.5" font-weight="800" fill="#ffffff" font-family="'Inter', sans-serif" id="isoPlayerName">사이퍼 트레이더</text>
                        </g>
                    </g>
                    </g>
                </svg>
            </div>
        </div>
    `;
}

export function generateFloorTilesSvg(gridSize = 8) {
    let tilesHtml = '';
    for (let gx = 0; gx < gridSize; gx++) {
        for (let gy = 0; gy < gridSize; gy++) {
            const topX = 500 + (gy - gx) * 33.75;
            const topY = 320 + (gx + gy) * 19.1;

            const rightX = 500 + ((gy + 1) - gx) * 33.75;
            const rightY = 320 + (gx + gy + 1) * 19.1;

            const botX = 500 + ((gy + 1) - (gx + 1)) * 33.75;
            const botY = 320 + (gx + 1 + gy + 1) * 19.1;

            const leftX = 500 + (gy - (gx + 1)) * 33.75;
            const leftY = 320 + (gx + 1 + gy) * 19.1;

            tilesHtml += `
                <polygon 
                    class="iso-floor-tile" 
                    id="isoTile_${gx}_${gy}"
                    data-gx="${gx}" 
                    data-gy="${gy}" 
                    points="${officeFootprintPoints(gx, gy)}"
                    fill="rgba(255,255,255,0.001)"
                    stroke="transparent"
                    stroke-width="1"
                    cursor="pointer"
                />
            `;
        }
    }
    return tilesHtml;
}
