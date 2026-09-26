/**
 * OfficeStage Component
 * Unity equivalent: HomeOfficeScene / OfficeGridManager.cs
 * Renders the 3D Isometric Rooftop Office Stage, background SVG skyscraper,
 * and the interactive Player Character (기본 하얀색 네모) with continuous free WASD & mouse movement.
 */

import { getOfficeStageHtml, generateFloorTilesSvg } from './office/OfficeSvgTemplate.js';
import { SkyBackground } from './sky/SkyBackground.js';

export class OfficeStage {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.skyBackground = null;
        
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
        this.container.insertAdjacentHTML('beforeend', getOfficeStageHtml());
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
        this.officeDoor = document.getElementById('isoOfficeDoor');
        this.doorPrompt = document.getElementById('isoDoorPrompt');
        this.doorFloatingBtn = document.getElementById('officeDoorFloatingBtn');

        // Dynamic Atmospheric Sky System
        if (this.stageContainer) {
            this.skyBackground = new SkyBackground(this.stageContainer);
        }
    }

    initFloorTiles() {
        if (!this.floorTilesGroup) return;
        this.floorTilesGroup.innerHTML = generateFloorTilesSvg(8);
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
