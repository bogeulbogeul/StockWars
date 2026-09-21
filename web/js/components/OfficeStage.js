/**
 * OfficeStage Component
 * Unity equivalent: HomeOfficeScene / OfficeGridManager.cs
 * Renders the 3D Isometric Rooftop Office Stage, background SVG skyscraper,
 * and the interactive Player Character (기본 하얀색 네모) with continuous free WASD & mouse movement.
 */

export class OfficeStage {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        
        // Continuous floating-point coordinates on 8x8 floor grid [0..7]
        this.posX = 3.5;
        this.posY = 3.5;
        this.facing = 1; // 1: right/front, -1: left
        this.walkPhase = 0;
        this.idlePhase = 0;
        this.isMoving = false;
        this.nickname = '사이퍼 트레이더';

        // Movement State
        this.keysHeld = new Set();
        this.targetTile = null;
        this.lastTimestamp = performance.now();
        this.animFrameId = null;

        // Office Door Interaction State
        this.doorGridX = 5.6;
        this.doorGridY = 0.5;
        this.isNearDoor = false;

        this.render();
        this.initDOM();
        this.initFloorTiles();
        this.initEventListeners();
        this.startLoop();
    }

    render() {
        const html = `
            <div id="isoOfficeStage" class="iso-office-stage">
                <!-- Floating Animated Clouds Background -->
                <div class="cloud-layer">
                    <div class="cloud cloud-1">☁️</div>
                    <div class="cloud cloud-2">☁️</div>
                    <div class="cloud cloud-3">☁️</div>
                </div>

                <!-- Office Movement Controls Hint HUD -->
                <div class="office-controls-hint" id="officeControlsHint">
                    <span class="hint-icon">🎮</span>
                    <span class="hint-text">오피스 자유 이동: <b>W, A, S, D / 방향키</b> 또는 <b>바닥 타일 클릭</b></span>
                </div>

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
                    <svg class="iso-svg" id="isoSvgStage" viewBox="160 45 680 600" preserveAspectRatio="xMidYMid meet">
                        <defs>
                            <linearGradient id="glassWallLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#90a4ae" />
                                <stop offset="40%" stop-color="#b2ebf2" />
                                <stop offset="100%" stop-color="#4fd1c5" />
                            </linearGradient>
                            <linearGradient id="glassWallRight" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#4a69bd" />
                                <stop offset="50%" stop-color="#1e3799" />
                                <stop offset="100%" stop-color="#0c2461" />
                            </linearGradient>
                            <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4" />
                                <stop offset="50%" stop-color="#ffffff" stop-opacity="0.05" />
                                <stop offset="100%" stop-color="#ffffff" stop-opacity="0.25" />
                            </linearGradient>
                        </defs>

                        <!-- 1. BUILDING BASE & SKYSCRAPER FACADE -->
                        <polygon points="216,466 500,608 500,1200 216,1058" fill="#a4b0be" stroke="#37474f" stroke-width="3" stroke-linejoin="round" />
                        <polygon points="216,466 500,608 500,1200 216,1058" fill="url(#glassWallLeft)" opacity="0.88" />
                        
                        <line x1="287" y1="501.5" x2="287" y2="1093.5" stroke="#37474f" stroke-width="2" />
                        <line x1="358" y1="537" x2="358" y2="1129" stroke="#37474f" stroke-width="2" />
                        <line x1="429" y1="572.5" x2="429" y2="1164.5" stroke="#37474f" stroke-width="2" />

                        <line x1="216" y1="511" x2="500" y2="653" stroke="#ffffff" stroke-width="1.8" opacity="0.65" />
                        <line x1="216" y1="556" x2="500" y2="698" stroke="#ffffff" stroke-width="1.8" opacity="0.65" />
                        <line x1="216" y1="601" x2="500" y2="743" stroke="#ffffff" stroke-width="1.8" opacity="0.65" />

                        <polygon points="500,608 784,466 784,1058 500,1200" fill="#747d8c" stroke="#1e272e" stroke-width="3" stroke-linejoin="round" />
                        <polygon points="500,608 784,466 784,1058 500,1200" fill="url(#glassWallRight)" opacity="0.88" />

                        <line x1="571" y1="572.5" x2="571" y2="1164.5" stroke="#1e272e" stroke-width="2" />
                        <line x1="642" y1="537" x2="642" y2="1129" stroke="#1e272e" stroke-width="2" />
                        <line x1="713" y1="501.5" x2="713" y2="1093.5" stroke="#1e272e" stroke-width="2" />

                        <line x1="500" y1="653" x2="784" y2="511" stroke="#ffffff" stroke-width="1.8" opacity="0.55" />
                        <line x1="500" y1="698" x2="784" y2="556" stroke="#ffffff" stroke-width="1.8" opacity="0.55" />
                        <line x1="500" y1="743" x2="784" y2="601" stroke="#ffffff" stroke-width="1.8" opacity="0.55" />

                        <polygon points="216,466 500,608 500,620 216,478" fill="#718093" stroke="#2f3640" stroke-width="1.5" stroke-linejoin="round" />
                        <polygon points="500,608 784,466 784,478 500,620" fill="#a6b5c5" stroke="#2f3640" stroke-width="1.5" stroke-linejoin="round" />

                        <!-- 2. ROOM FOUNDATION SLAB -->
                        <polygon points="216,448 500,590 500,608 216,466" fill="#c7a783" />
                        <polygon points="500,590 784,448 784,466 500,608" fill="#d9b996" />

                        <!-- ISOMETRIC CUBE ROOM FLOOR (8x8 Grid) -->
                        <polygon points="500,320 770,455 500,590 230,455" fill="#f5e6d3" stroke="#8c6d53" stroke-width="3" stroke-linejoin="round" />
                        
                        <!-- 3. BACK LEFT WALL -->
                        <polygon points="230,455 500,320 500,80 230,215" fill="#fff5ea" stroke="#8c6d53" stroke-width="2.5" stroke-linejoin="round" />

                        <!-- Door on Left Wall (Interactive Office Exit Gate) -->
                        <g id="isoOfficeDoor" class="iso-office-door" cursor="pointer">
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
                            <!-- Background Pill -->
                            <rect x="-78" y="-17" width="156" height="34" rx="17" fill="rgba(11,15,26,0.94)" stroke="#00e5ff" stroke-width="1.8" />
                            <!-- Glow Filter / Border Accent -->
                            <rect x="-74" y="-13" width="148" height="26" rx="13" fill="none" stroke="rgba(0,229,255,0.25)" stroke-width="1" />
                            <!-- Text Label -->
                            <text x="-12" y="4.5" text-anchor="middle" font-size="12" font-weight="800" fill="#ffffff" font-family="'Inter', sans-serif">🚪 마을로 나가기</text>
                            <!-- Hotkey Badge [F] -->
                            <rect x="42" y="-9" width="22" height="18" rx="5" fill="#00e5ff" />
                            <text x="53" y="4" text-anchor="middle" font-size="11" font-weight="900" fill="#0b0f1a" font-family="'JetBrains Mono', monospace">F</text>
                        </g>

                        <!-- 4. BACK RIGHT WALL -->
                        <polygon points="500,320 770,455 770,215 500,80" fill="#ffebd7" stroke="#8c6d53" stroke-width="2.5" stroke-linejoin="round" />

                        <!-- Window on Right Wall -->
                        <polygon points="623,305.5 721,354.5 721,265.5 623,216.5" fill="#78909c" stroke="#37474f" stroke-width="2.5" stroke-linejoin="round" />
                        <polygon points="628,303 668,323 668,237 628,217" fill="#e0f7fa" stroke="#4dd0e1" opacity="0.95" stroke-linejoin="round" />
                        <polygon points="676,327 716,347 716,261 676,241" fill="#e0f7fa" stroke="#4dd0e1" opacity="0.95" stroke-linejoin="round" />
                        <line x1="632" y1="225" x2="662" y2="315" stroke="#ffffff" stroke-width="2.5" opacity="0.8" stroke-linecap="round" />
                        <line x1="680" y1="249" x2="710" y2="339" stroke="#ffffff" stroke-width="2.5" opacity="0.8" stroke-linecap="round" />

                        <line x1="500" y1="320" x2="500" y2="80" stroke="#8c6d53" stroke-width="3" stroke-linecap="round" />

                        <!-- Interactive 8x8 Isometric Floor Grid Tiles -->
                        <g id="isoFloorTilesGroup" class="iso-floor-tiles"></g>

                        <!-- Click Target Indicator Ring -->
                        <g id="isoTargetGroup" class="iso-target-group hidden">
                            <polygon id="isoTargetTilePolygon" points="0,0 0,0 0,0 0,0" fill="rgba(0,229,255,0.35)" stroke="#00e5ff" stroke-width="2" />
                        </g>

                        <!-- 5. 3D ROOFTOP BEZEL SYSTEM -->
                        <polygon points="216,208 500,66 784,208 770,215 500,80 230,215" fill="#ded4c9" stroke="#8c6d53" stroke-width="2.5" stroke-linejoin="round" />
                        <polygon points="216,208 230,215 230,455 216,466" fill="#c7a783" />
                        <polygon points="770,215 784,208 784,466 770,455" fill="#d9b996" />

                        <line x1="216" y1="208" x2="216" y2="466" stroke="#8c6d53" stroke-width="2.5" stroke-linecap="round" />
                        <line x1="230" y1="215" x2="230" y2="455" stroke="#8c6d53" stroke-width="2.5" stroke-linecap="round" />
                        <line x1="784" y1="208" x2="784" y2="466" stroke="#8c6d53" stroke-width="2.5" stroke-linecap="round" />
                        <line x1="770" y1="215" x2="770" y2="455" stroke="#8c6d53" stroke-width="2.5" stroke-linecap="round" />

                        <!-- 6. PLAYER CHARACTER (기본 하얀색 네모 - 3D Isometric White Square Block) -->
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
                    </svg>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.stageContainer = document.getElementById('isoOfficeStage');
        this.svgStage = document.getElementById('isoSvgStage');
        this.floorTilesGroup = document.getElementById('isoFloorTilesGroup');
        this.playerChar = document.getElementById('isoPlayerCharacter');
        this.charBody = document.getElementById('isoCharBody');
        this.charShadow = document.getElementById('isoCharShadow');
        this.charNametag = document.getElementById('isoCharNametag');
        this.playerName = document.getElementById('isoPlayerName');
        this.targetGroup = document.getElementById('isoTargetGroup');
        this.targetTilePolygon = document.getElementById('isoTargetTilePolygon');
        this.controlsHint = document.getElementById('officeControlsHint');
        this.officeDoor = document.getElementById('isoOfficeDoor');
        this.doorPrompt = document.getElementById('isoDoorPrompt');
        this.doorFloatingBtn = document.getElementById('officeDoorFloatingBtn');
    }

    initFloorTiles() {
        if (!this.floorTilesGroup) return;

        let tilesHtml = '';
        for (let gx = 0; gx < 8; gx++) {
            for (let gy = 0; gy < 8; gy++) {
                const topX = 500 + (gy - gx) * 33.75;
                const topY = 320 + (gx + gy) * 16.875;

                const rightX = 500 + ((gy + 1) - gx) * 33.75;
                const rightY = 320 + (gx + gy + 1) * 16.875;

                const botX = 500 + ((gy + 1) - (gx + 1)) * 33.75;
                const botY = 320 + (gx + 1 + gy + 1) * 16.875;

                const leftX = 500 + (gy - (gx + 1)) * 33.75;
                const leftY = 320 + (gx + 1 + gy) * 16.875;

                tilesHtml += `
                    <polygon 
                        class="iso-floor-tile" 
                        data-gx="${gx}" 
                        data-gy="${gy}" 
                        points="${topX},${topY} ${rightX},${rightY} ${botX},${botY} ${leftX},${leftY}" 
                        fill="transparent" 
                        stroke="#dfceb7" 
                        stroke-width="1.2"
                    />
                `;
            }
        }
        this.floorTilesGroup.innerHTML = tilesHtml;
    }

    initEventListeners() {
        // 1. Mouse Click on Floor Tiles
        this.floorTilesGroup?.addEventListener('click', (e) => {
            const tile = e.target.closest('.iso-floor-tile');
            if (tile) {
                const gx = parseInt(tile.dataset.gx, 10);
                const gy = parseInt(tile.dataset.gy, 10);
                this.targetTile = { gx, gy };
                this.showTargetTile(gx, gy);
            }
        });

        // 2. Door Clicks (SVG Door & Prompts)
        const triggerDoorInteraction = () => {
            if (this.callbacks.onOpenServerSelect) {
                this.callbacks.onOpenServerSelect();
            }
        };

        this.officeDoor?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.isNearDoor) {
                triggerDoorInteraction();
            } else {
                // Walk closer to the door
                this.targetTile = { gx: 5.6, gy: 0.5 };
                this.showTargetTile(5, 0);
            }
        });

        this.doorPrompt?.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerDoorInteraction();
        });

        this.doorFloatingBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerDoorInteraction();
        });

        // 3. Continuous Keyboard Tracking (WASD / Arrow Keys & F Key for Door Interaction)
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

            const key = e.key.toLowerCase();
            const validMovementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

            if (validMovementKeys.includes(key)) {
                e.preventDefault();
                this.keysHeld.add(key);
                this.targetTile = null; // Keyboard immediately overrides mouse path
            } else if (key === 'f' || key === 'enter') {
                if (this.isNearDoor) {
                    e.preventDefault();
                    triggerDoorInteraction();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keysHeld.delete(key);
        });

        window.addEventListener('blur', () => {
            this.keysHeld.clear();
        });
    }

    updateUserProfile(profile) {
        if (!profile) return;
        this.nickname = profile.nickname || '사이퍼 트레이더';
        if (this.playerName) {
            this.playerName.textContent = this.nickname;
        }
    }

    startLoop() {
        const loop = (timestamp) => {
            this.update(timestamp);
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    update(now) {
        const dt = Math.min(0.06, (now - this.lastTimestamp) / 1000);
        this.lastTimestamp = now;

        let inputScreenX = 0;
        let inputScreenY = 0;

        if (this.keysHeld.has('w') || this.keysHeld.has('arrowup')) inputScreenY -= 1;
        if (this.keysHeld.has('s') || this.keysHeld.has('arrowdown')) inputScreenY += 1;
        if (this.keysHeld.has('a') || this.keysHeld.has('arrowleft')) inputScreenX -= 1;
        if (this.keysHeld.has('d') || this.keysHeld.has('arrowright')) inputScreenX += 1;

        let moveDirX = 0;
        let moveDirY = 0;

        if (inputScreenX !== 0 || inputScreenY !== 0) {
            // Isometric Transformation for Screen Direction:
            // Screen UP   -> gx - 1, gy - 1
            // Screen DOWN -> gx + 1, gy + 1
            // Screen LEFT -> gx + 1, gy - 1
            // Screen RIGHT-> gx - 1, gy + 1
            moveDirX = inputScreenY - inputScreenX;
            moveDirY = inputScreenY + inputScreenX;

            const len = Math.hypot(moveDirX, moveDirY);
            if (len > 0) {
                moveDirX /= len;
                moveDirY /= len;
            }

            if (inputScreenX < 0) this.facing = -1;
            else if (inputScreenX > 0) this.facing = 1;
        } else if (this.targetTile) {
            const diffX = this.targetTile.gx - this.posX;
            const diffY = this.targetTile.gy - this.posY;
            const dist = Math.hypot(diffX, diffY);

            if (dist < 0.08) {
                this.posX = this.targetTile.gx;
                this.posY = this.targetTile.gy;
                this.targetTile = null;
            } else {
                moveDirX = diffX / dist;
                moveDirY = diffY / dist;
                if (diffY - diffX < -0.1) this.facing = -1;
                else if (diffY - diffX > 0.1) this.facing = 1;
            }
        }

        const isActivelyMoving = moveDirX !== 0 || moveDirY !== 0;
        const speed = 4.8; // Grid units per second (snappy & smooth)

        if (isActivelyMoving) {
            this.posX += moveDirX * speed * dt;
            this.posY += moveDirY * speed * dt;

            // Clamp smoothly within floor room boundaries [0.1 .. 6.9]
            this.posX = Math.max(0.1, Math.min(6.9, this.posX));
            this.posY = Math.max(0.1, Math.min(6.9, this.posY));

            this.isMoving = true;
            this.walkPhase += dt * 16;
        } else {
            this.isMoving = false;
            this.idlePhase += dt * 3;
        }

        // Check Proximity to Office Door (doorGridX: 5.6, doorGridY: 0.5)
        const distToDoor = Math.hypot(this.posX - this.doorGridX, this.posY - this.doorGridY);
        const near = distToDoor <= 2.0;

        if (near !== this.isNearDoor) {
            this.isNearDoor = near;
            if (this.doorPrompt) {
                if (near) {
                    this.doorPrompt.classList.remove('hidden');
                } else {
                    this.doorPrompt.classList.add('hidden');
                }
            }
            if (this.doorFloatingBtn) {
                if (near) {
                    this.doorFloatingBtn.classList.remove('hidden');
                } else {
                    this.doorFloatingBtn.classList.add('hidden');
                }
            }
        }

        this.renderCharacterFrame();
    }

    renderCharacterFrame() {
        if (!this.playerChar) return;

        // Convert Isometric Grid coordinates (posX, posY) to Screen SVG space
        const screenX = 500 + (this.posY - this.posX) * 33.75;
        const screenY = 320 + (this.posX + this.posY + 1) * 16.875;

        let bobY = 0;
        let tiltDeg = 0;
        let shadowScale = 1;

        if (this.isMoving) {
            bobY = -Math.abs(Math.sin(this.walkPhase)) * 7;
            tiltDeg = Math.sin(this.walkPhase) * 3.5 * this.facing;
            shadowScale = 0.92 + Math.abs(Math.sin(this.walkPhase)) * 0.12;
        } else {
            bobY = Math.sin(this.idlePhase) * 1.5;
            tiltDeg = 0;
            shadowScale = 1;
        }

        this.playerChar.setAttribute('transform', `translate(${screenX.toFixed(2)}, ${(screenY + bobY).toFixed(2)})`);

        if (this.charBody) {
            this.charBody.setAttribute('transform', `scale(${this.facing}, 1) rotate(${tiltDeg.toFixed(2)})`);
        }

        if (this.charShadow) {
            this.charShadow.setAttribute('transform', `scale(${shadowScale.toFixed(2)})`);
        }
    }

    showTargetTile(gx, gy) {
        if (!this.targetGroup || !this.targetTilePolygon) return;

        const topX = 500 + (gy - gx) * 33.75;
        const topY = 320 + (gx + gy) * 16.875;

        const rightX = 500 + ((gy + 1) - gx) * 33.75;
        const rightY = 320 + (gx + gy + 1) * 16.875;

        const botX = 500 + ((gy + 1) - (gx + 1)) * 33.75;
        const botY = 320 + (gx + 1 + gy + 1) * 16.875;

        const leftX = 500 + (gy - (gx + 1)) * 33.75;
        const leftY = 320 + (gx + 1 + gy) * 16.875;

        this.targetTilePolygon.setAttribute('points', `${topX},${topY} ${rightX},${rightY} ${botX},${botY} ${leftX},${leftY}`);
        this.targetGroup.classList.remove('hidden');

        clearTimeout(this.targetTimer);
        this.targetTimer = setTimeout(() => {
            this.targetGroup?.classList.add('hidden');
        }, 500);
    }

    show() {
        if (this.stageContainer) {
            this.stageContainer.classList.remove('hidden');
        }
    }

    hide() {
        if (this.stageContainer) {
            this.stageContainer.classList.add('hidden');
        }
    }
}
