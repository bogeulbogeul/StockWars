import { homeRoomMarkup } from './OfficeRoomPackage.js';
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

            <!-- Dynamic Time-of-Day Sky Layer Background -->
            ${SkyBackground.getTemplateHtml('officeSkyContainer')}

            <!-- Isometric Building & Room Vector Stage (Centered Framing) -->
            <div class="iso-stage-wrapper">
                <svg class="iso-svg" id="isoSvgStage" viewBox="160 -10 680 760" preserveAspectRatio="xMidYMin meet">
                    <!-- Fit each facade plane to the room slab's measured underside.
                         The room and its interaction coordinates remain uniformly scaled. -->
                    <defs>
                        <clipPath id="officeFacadeLeft"><polygon points="192,340 531,521 531,1400 175,1215"/></clipPath>
                        <clipPath id="officeFacadeRight"><polygon points="531,521 871,340 886,1215 531,1400"/></clipPath>
                    </defs>
                    <g class="office-building-art" pointer-events="none">
                        <g transform="matrix(.79941003 .11594985 0 .8 70.513274 170.737629)">
                            <image href="${new URL('../../../assets/office/IsomatricBuilding.png', import.meta.url).href}" width="1060" height="1484" clip-path="url(#officeFacadeLeft)"/>
                        </g>
                        <g transform="matrix(.82647059 -.07088235 0 .8 56.135294 269.337647)">
                            <image href="${new URL('../../../assets/office/IsomatricBuilding.png', import.meta.url).href}" width="1060" height="1484" clip-path="url(#officeFacadeRight)"/>
                        </g>
                    </g>
                    ${homeRoomMarkup()}
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
