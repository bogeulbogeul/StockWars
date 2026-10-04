/**
 * OfficeSvgTemplate
 * Contains SVG isometric rendering markup and floor tile generators for OfficeStage.
 */

import { SkyBackground } from '../sky/SkyBackground.js';

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

            <!-- Office Door Exit Proximity Floating Action Button -->
            <div class="office-door-floating-btn hidden" id="officeDoorFloatingBtn" title="클릭하거나 [F]키를 눌러 타운으로 이동">
                <span class="door-btn-icon">🚪</span>
                <div class="door-btn-content">
                    <span class="door-btn-title">마을로 나가기</span>
                    <span class="door-btn-sub">서버 & 채널 선택</span>
                </div>
                <span class="door-btn-hotkey">F</span>
            </div>

            <!-- Isometric Building & Room Vector Stage (Centered Framing) -->
            <div class="iso-stage-wrapper">
                <svg class="iso-svg" id="isoSvgStage" viewBox="160 -10 680 760" preserveAspectRatio="xMidYMin meet">
                    <!-- Original artwork: the room floor sits on the building roof. -->
                    <image class="office-building-art" href="${new URL('../../../assets/office/IsomatricBuilding.png', import.meta.url).href}"
                           x="60.1" y="229.7" width="879.8" height="1231.72" pointer-events="none" />
                    <image class="office-room-art" href="${new URL('../../../assets/office/BasicRoom.png', import.meta.url).href}"
                           x="140.96" y="-27.55" width="720.38" height="720.38" pointer-events="none" />
                    <!-- Door on Left Wall (Interactive Office Exit Gate) -->
                    <g id="isoOfficeDoor" class="iso-office-door" transform="translate(0, 12)" cursor="pointer">
                        <polygon points="275,432.5 356,392 356,245 275,285.5" fill="#5d4037" stroke="#3e2723" stroke-width="2.5" stroke-linejoin="round" class="door-frame" />
                        <polygon points="280,430 351,394.5 351,249.5 280,285" fill="#8d6e63" stroke="#4e342e" stroke-width="2" stroke-linejoin="round" class="door-panel" />
                        <polygon points="286,421.5 345,392 345,258 286,287.5" fill="#6d4c41" stroke="#3e2d20" stroke-width="1.2" stroke-linejoin="round" />
                        <circle cx="338" cy="336" r="4.5" fill="#ffd54f" stroke="#ffb300" stroke-width="1.5" />
                        <line x1="338" y1="336" x2="327" y2="341.5" stroke="#ffd54f" stroke-width="3" stroke-linecap="round" />
                        <!-- Subtle Door Exit Light Indicator -->
                        <ellipse cx="315.5" cy="254" rx="14" ry="4" fill="rgba(0,229,255,0.6)" filter="drop-shadow(0 0 6px rgba(0,229,255,0.9))" />
                    </g>

                    <!-- Door Proximity Floating Interaction Prompt in SVG -->
                    <g id="isoDoorPrompt" class="iso-door-prompt hidden" transform="translate(315.5, 218)" cursor="pointer">
                        <rect x="-78" y="-17" width="156" height="34" rx="17" fill="rgba(11,15,26,0.94)" stroke="#00e5ff" stroke-width="1.8" />
                        <rect x="-74" y="-13" width="148" height="26" rx="13" fill="none" stroke="rgba(0,229,255,0.25)" stroke-width="1" />
                        <text x="-12" y="4.5" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff" font-family="'Inter', sans-serif">🚪 마을로 나가기</text>
                        <rect x="42" y="-9" width="22" height="18" rx="5" fill="#00e5ff" />
                        <text x="53" y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#0b0f1a" font-family="'JetBrains Mono', monospace">F</text>
                    </g>

                    <!-- Anna Proximity Floating Interaction Prompt in SVG -->
                    <g id="isoAnnaPrompt" class="iso-anna-prompt hidden" transform="translate(500, 360)" cursor="pointer">
                        <rect x="-78" y="-17" width="156" height="34" rx="17" fill="rgba(11,15,26,0.94)" stroke="#6366f1" stroke-width="1.8" />
                        <rect x="-74" y="-13" width="148" height="26" rx="13" fill="none" stroke="rgba(99,102,241,0.25)" stroke-width="1" />
                        <text x="-12" y="4.5" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff" font-family="'Inter', sans-serif">💼 안나와 대화하기</text>
                        <rect x="42" y="-9" width="22" height="18" rx="5" fill="#6366f1" />
                        <text x="53" y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#ffffff" font-family="'JetBrains Mono', monospace">F</text>
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
                    points="${topX},${topY} ${rightX},${rightY} ${botX},${botY} ${leftX},${leftY}"
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
