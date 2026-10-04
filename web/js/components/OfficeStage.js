/**
 * OfficeStage Component
 * Web rooftop office with layered room and building artwork.
 * Renders the 3D Isometric Rooftop Office Stage, background SVG skyscraper,
 * and the interactive Player Character (기본 하얀색 네모) with continuous free WASD & mouse movement.
 */

import { getOfficeStageHtml, generateFloorTilesSvg } from './office/OfficeSvgTemplate.js';
import { SkyBackground } from './sky/SkyBackground.js';
import { OfficeAnna } from './office/OfficeAnna.js';

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
        this.anna = new OfficeAnna(this.actorLayer);
        this.anna.onTalkToAnna = () => {
            if (this.callbacks.onTalkToAnna) this.callbacks.onTalkToAnna();
        };
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
        this.actorLayer = document.getElementById('isoOfficeActors');
        this.charBody = document.getElementById('isoCharBody');
        this.charShadow = document.getElementById('isoCharShadow');
        this.charNametag = document.getElementById('isoCharNametag');
        this.playerName = document.getElementById('isoPlayerName');
        this.targetGroup = document.getElementById('isoTargetGroup');
        this.targetTilePolygon = document.getElementById('isoTargetTilePolygon');
        this.officeDoor = document.getElementById('isoOfficeDoor');
        this.doorPrompt = document.getElementById('isoDoorPrompt');
        this.doorFloatingBtn = document.getElementById('officeDoorFloatingBtn');
        this.annaPrompt = document.getElementById('isoAnnaPrompt');
        this.annaFloatingBtn = document.getElementById('officeAnnaFloatingBtn');
        this.isNearAnna = false;

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
        this.stageContainer?.querySelector('#btnOfficeFurnitureEdit')?.addEventListener('click', () => {
            this.keysHeld.clear();
            this.targetTile = null;
            this.callbacks.onFurnitureEdit?.();
        });
        // 1. Mouse Click on Floor Tiles
        this.floorTilesGroup?.addEventListener('click', (e) => {
            const tile = e.target.closest('.iso-floor-tile');
            if (tile) {
                const gx = parseInt(tile.dataset.gx, 10);
                const gy = parseInt(tile.dataset.gy, 10);
                if (this.furnitureEditMode) {
                    this.onFurnitureFloorClick?.(gx, gy);
                    return;
                }
                this.targetTile = { gx, gy };
                this.showTargetTile(gx, gy);
            }
        });

        // 2. Door Clicks (SVG Door & Prompts)
        const triggerDoorInteraction = () => {
            if (this.furnitureEditMode) return;
            if (this.stageContainer?.classList.contains('hidden')) return;
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

        const triggerAnnaInteraction = () => {
            if (this.furnitureEditMode) return;
            if (this.stageContainer?.classList.contains('hidden')) return;
            if (this.callbacks.onTalkToAnna) {
                this.callbacks.onTalkToAnna();
            }
        };

        this.annaPrompt?.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerAnnaInteraction();
        });

        this.annaFloatingBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerAnnaInteraction();
        });

        // 3. Continuous Keyboard Tracking (WASD / Arrow Keys & F Key for Door Interaction)
        window.addEventListener('keydown', (e) => {
            if (this.furnitureEditMode) return;
            if (this.stageContainer?.classList.contains('hidden')) return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

            const key = e.key.toLowerCase();
            const validMovementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

            if (validMovementKeys.includes(key)) {
                e.preventDefault();
                this.keysHeld.add(key);
                this.targetTile = null; // Keyboard immediately overrides mouse path
            } else if (key === 'f' || key === 'enter') {
                if (e.repeat) return;
                if (this.isNearDoor) {
                    e.preventDefault();
                    triggerDoorInteraction();
                } else if (this.isNearAnna) {
                    e.preventDefault();
                    triggerAnnaInteraction();
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
        if (this.furnitureEditMode) return;
        if (this.stageContainer?.classList.contains('hidden')) return;
        if (document.querySelector('.player-profile-dialog[open], .settings-dialog[open]')) {
            this.keysHeld.clear();
            return;
        }

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
        this.anna.updateAvailability(new Date().getHours(), this.callbacks.isAnnaMarriageCompleted?.());
        // Tutorial activity persists even while its dialogue is temporarily hidden.
        const tutorialActive = !!this.callbacks.isTutorialActive?.();
        if (tutorialActive) this.anna.direction = 'down';
        const annaPaused = tutorialActive || document.hidden || document.body.classList.contains('phone-view-active')
            || document.body.classList.contains('modal-active')
            || !!document.querySelector('#titleScreen:not(.hidden), #characterCreationModal:not(.hidden), .modal-overlay:not(.hidden), .vn-tutorial-overlay:not(.hidden)');
        this.anna.update(dt, { x: this.posX, y: this.posY }, annaPaused);

        // Check Proximity to Anna (this.anna.x, this.anna.y)
        const distToAnna = Math.hypot(this.posX - this.anna.x, this.posY - this.anna.y);
        const nearAnna = distToAnna <= 2.2 && this.anna.visible;

        if (nearAnna !== this.isNearAnna) {
            this.isNearAnna = nearAnna;
            if (this.annaPrompt) {
                if (nearAnna) {
                    this.annaPrompt.classList.remove('hidden');
                } else {
                    this.annaPrompt.classList.add('hidden');
                }
            }
            if (this.annaFloatingBtn) {
                if (nearAnna) {
                    this.annaFloatingBtn.classList.remove('hidden');
                } else {
                    this.annaFloatingBtn.classList.add('hidden');
                }
            }
        }

        if (this.isNearAnna && this.annaPrompt) {
            const annaScreenX = 500 + (this.anna.y - this.anna.x) * 33.75;
            const floatBob = Math.sin(now / 250) * 3;
            const annaScreenY = 320 + (this.anna.x + this.anna.y + 1) * 19.1 - 120 + floatBob;
            this.annaPrompt.setAttribute('transform', `translate(${annaScreenX.toFixed(2)}, ${annaScreenY.toFixed(2)})`);
        }
        // SVG paints later siblings in front; sort the two actors by floor depth.
        const frontActor = this.posX + this.posY >= this.anna.x + this.anna.y
            ? this.playerChar : this.anna.element;
        if (this.actorLayer.lastElementChild !== frontActor) this.actorLayer.appendChild(frontActor);
    }

    renderCharacterFrame() {
        if (!this.playerChar) return;

        // Convert Isometric Grid coordinates (posX, posY) to Screen SVG space
        const screenX = 500 + (this.posY - this.posX) * 33.75;
        const screenY = 320 + (this.posX + this.posY + 1) * 19.1;

        let bobY = 0;
        let tiltDeg = 0;
        let shadowScale = 1;

        if (this.isMoving) {
            bobY = -Math.abs(Math.sin(this.walkPhase)) * 7;
            tiltDeg = Math.sin(this.walkPhase) * 3.5 * (this.facing < 0 ? -1 : 1);
            shadowScale = 0.92 + Math.abs(Math.sin(this.walkPhase)) * 0.12;
        } else {
            bobY = Math.sin(this.idlePhase) * 1.5;
            tiltDeg = 0;
            shadowScale = 1;
        }

        this.playerChar.setAttribute('transform', `translate(${screenX.toFixed(2)}, ${(screenY + bobY).toFixed(2)})`);

        if (this.charBody) {
            this.charBody.setAttribute('transform', `rotate(${tiltDeg.toFixed(2)})`);
        }

        if (this.charShadow) {
            this.charShadow.setAttribute('transform', `scale(${shadowScale.toFixed(2)})`);
        }
    }

    showTargetTile(gx, gy) {
        if (!this.targetGroup || !this.targetTilePolygon) return;

        const topX = 500 + (gy - gx) * 33.75;
        const topY = 320 + (gx + gy) * 19.1;

        const rightX = 500 + ((gy + 1) - gx) * 33.75;
        const rightY = 320 + (gx + gy + 1) * 19.1;

        const botX = 500 + ((gy + 1) - (gx + 1)) * 33.75;
        const botY = 320 + (gx + 1 + gy + 1) * 19.1;

        const leftX = 500 + (gy - (gx + 1)) * 33.75;
        const leftY = 320 + (gx + 1 + gy) * 19.1;

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

    setFurnitureEditMode(active, onFloorClick) {
        this.furnitureEditMode = active;
        this.onFurnitureFloorClick = active ? onFloorClick : null;
        this.keysHeld.clear();
        this.targetTile = null;
        this.stageContainer.classList.toggle('editing-furniture', active);
        this.targetGroup?.classList.add('hidden');
    }

    renderFurniture(items, selectedId) {
        if (!this.furnitureLayer) {
            this.furnitureLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.furnitureLayer.id = 'isoFurnitureLayer';
            this.furnitureLayer.style.pointerEvents = 'none';
            this.floorTilesGroup.after(this.furnitureLayer);
        }
        const point = (x, y) => `${500 + (y - x) * 33.75},${320 + (x + y) * 19.1}`;
        this.furnitureLayer.innerHTML = items.filter(item => item.placed).sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY)).map(item => {
            const w = item.rotation % 180 ? item.sizeH : item.sizeW;
            const h = item.rotation % 180 ? item.sizeW : item.sizeH;
            const x = item.gridX, y = item.gridY;
            const cx = 500 + (y + h / 2 - x - w / 2) * 33.75;
            const cy = 320 + (x + w / 2 + y + h / 2) * 19.1;
            const selected = this.furnitureEditMode && item.id === selectedId;
            return `<g><polygon points="${point(x, y)} ${point(x, y + h)} ${point(x + w, y + h)} ${point(x + w, y)}" fill="${selected ? '#facc1544' : '#162b4199'}" stroke="${selected ? '#facc15' : '#72b9c7'}" stroke-width="${selected ? 2.5 : 1}"/><text x="${cx}" y="${cy}" text-anchor="middle" font-size="${Math.min(48, 25 + w * h * 3)}" dominant-baseline="central">${item.icon}</text><text x="${cx}" y="${cy + 26}" text-anchor="middle" font-size="9" fill="#e6f6ff">${item.rotation}°</text></g>`;
        }).join('');
    }

    hide() {
        this.keysHeld.clear();
        this.targetTile = null;
        this.isMoving = false;
        if (this.stageContainer) {
            this.stageContainer.classList.add('hidden');
        }
    }
}
