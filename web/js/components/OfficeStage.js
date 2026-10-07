import { gameKey } from '../app/GameKeys.js';
/**
 * OfficeStage Component
 * Web rooftop office with layered room and building artwork.
 * Renders the 3D Isometric Rooftop Office Stage, background SVG skyscraper,
 * and the interactive Player Character (기본 하얀색 네모) with continuous free WASD & mouse movement.
 */

import { getOfficeStageHtml, generateFloorTilesSvg } from './office/OfficeSvgTemplate.js?v=wall-fill-v2';
import { OFFICE_OPENINGS, officeWallHeight } from './office/OfficeOpeningSizing.js?v=window-grid-v1';
import { SkyBackground } from './sky/SkyBackground.js';
import { OfficeAnna } from './office/OfficeAnna.js';
import { FURNITURE_THEMES } from '../data/furnitureData.js';
import { officeGridToScreen, officeFootprintPoints, officeAssetPlacement } from './office/OfficeGrid.js';
import { officeMove, officePositionBlocked } from './office/OfficeCollision.js?v=bed-collision-v2';

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
                this.targetTile = { gx: this.doorGridX, gy: this.doorGridY };
                this.showTargetTile(Math.floor(this.doorGridX), 0);
            }
        });

        this.doorPrompt?.addEventListener('click', (e) => {
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

        // 3. Continuous Keyboard Tracking (WASD & F Key for Door Interaction)
        window.addEventListener('keydown', (e) => {
            if (this.furnitureEditMode) return;
            if (this.stageContainer?.classList.contains('hidden')) return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

            const key = gameKey(e);
            const validMovementKeys = ['w', 'a', 's', 'd'];

            if (validMovementKeys.includes(key)) {
                e.preventDefault();
                this.keysHeld.add(key);
                this.targetTile = null; // Keyboard immediately overrides mouse path
            } else if (key === 'f') {
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
            const key = gameKey(e);
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

        if (this.keysHeld.has('w')) inputScreenY -= 1;
        if (this.keysHeld.has('s')) inputScreenY += 1;
        if (this.keysHeld.has('a')) inputScreenX -= 1;
        if (this.keysHeld.has('d')) inputScreenX += 1;

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
                if (!officePositionBlocked(this.collisionFurniture || [], this.targetTile.gx, this.targetTile.gy)) {
                    this.posX = this.targetTile.gx;
                    this.posY = this.targetTile.gy;
                }
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
            const next = officeMove(this.collisionFurniture || [], this.posX, this.posY, moveDirX * speed * dt, moveDirY * speed * dt);
            this.isMoving = Math.hypot(next.x - this.posX, next.y - this.posY) > 0.0001;
            this.posX = next.x;
            this.posY = next.y;
            if (!this.isMoving) this.targetTile = null;
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

        this.targetTilePolygon.setAttribute('points', officeFootprintPoints(gx, gy));
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
        if (!this.wallGridLayer) {
            this.wallGridLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.wallGridLayer.setAttribute('pointer-events', 'none');
            this.wallGridLayer.setAttribute('stroke', '#6bbbc977');
            let lines = '';
            for (let i = 0; i <= 8; i++) {
                for (const sign of [-1, 1]) {
                    const x = 500 + sign * i * 33.75, y = 320 + i * 19.1;
                    lines += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 270}"/>`;
                }
            }
            for (let height = 38.2; height < 270; height += 38.2) {
                for (const sign of [-1, 1]) {
                    lines += `<line x1="500" y1="${320 - height}" x2="${500 + sign * 8 * 33.75}" y2="${320 + 8 * 19.1 - height}"/>`;
                }
            }
            this.wallGridLayer.innerHTML = lines;
            this.officeDoor.before(this.wallGridLayer);
        }
        this.wallGridLayer.style.display = active ? '' : 'none';
        this.targetGroup?.classList.add('hidden');
    }

    renderFurniture(items, selectedId) {
        this.collisionFurniture = items.filter(item => item.placed && !item.wallFixture);
        if (!this.furnitureEditMode && officePositionBlocked(this.collisionFurniture, this.posX, this.posY)) {
            let nearest = null;
            for (let x = 0.5; x < 8; x++) for (let y = 0.5; y < 8; y++) {
                if (officePositionBlocked(this.collisionFurniture, x, y)) continue;
                const distance = Math.hypot(x - this.posX, y - this.posY);
                if (!nearest || distance < nearest.distance) nearest = { x, y, distance };
            }
            if (nearest) { this.posX = nearest.x; this.posY = nearest.y; this.targetTile = null; }
        }
        // Interaction labels stay above room furniture and actors.
        for (const prompt of [this.doorPrompt, this.annaPrompt]) if (prompt) this.svgStage.append(prompt);
        items.filter(item => item.wallFixture).forEach(item => {
            const element = document.getElementById(item.wallFixture);
            if (element) {
                element.style.display = item.placed ? '' : 'none';
                element.style.outline = '';
                let selection = element.querySelector('.wall-fixture-selection');
                if (!selection) {
                    selection = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    selection.classList.add('wall-fixture-selection');
                    selection.setAttribute('fill', 'transparent');
                    selection.setAttribute('stroke-width', '1.5');
                    element.append(selection);
                }
                const isDoor = item.wallFixture === 'isoOfficeDoor';
                selection.setAttribute('points', (isDoor ? OFFICE_OPENINGS.door : OFFICE_OPENINGS.window).selectionPoints);
                selection.setAttribute('stroke', this.furnitureEditMode && item.id === selectedId ? '#facc15' : 'none');
                selection.style.pointerEvents = this.furnitureEditMode || isDoor ? 'all' : 'none';
                element.querySelectorAll('image').forEach(image => image.style.pointerEvents = 'none');
                element.dataset.furnitureId = item.id;
                if (item.wallFixture) {
                    const door = item.wallFixture === 'isoOfficeDoor', right = item.gridY === 1 || (item.gridX < 3 && !door);
                    const index = item.gridX >= 3 ? item.gridX : 6;
                    const anchor = officeGridToScreen(right ? 0 : index, right ? index : 0);
                    // Keep the door threshold just above the brown wall/floor seam.
                    element.setAttribute('transform', `translate(${anchor.x} ${anchor.y - officeWallHeight(item) - (door ? 1.5 : 0)}) scale(${right ? -1 : 1} 1)`);
                    element.style.pointerEvents = '';
                    if (door) {
                        this.doorGridX = right ? 0.5 : index - 1;
                        this.doorGridY = right ? index - 1 : 0.5;
                        this.doorPrompt?.setAttribute('transform', `translate(${anchor.x + (right ? -1 : 1) * OFFICE_OPENINGS.door.width / 2}, ${anchor.y - OFFICE_OPENINGS.door.height - 30})`);
                    }
                }
            }
        });
        if (!this.furnitureLayer) {
            this.furnitureLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.furnitureLayer.id = 'isoFurnitureLayer';
            this.furnitureLayer.style.pointerEvents = 'none';
            this.floorTilesGroup.after(this.furnitureLayer);
        }
        const point = (x, y) => { const p = officeGridToScreen(x, y); return `${p.x},${p.y}`; };
        this.furnitureLayer.style.pointerEvents = this.furnitureEditMode ? 'auto' : 'none';
        this.furnitureLayer.innerHTML = items.filter(item => item.placed && !item.wallFixture).sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY)).map(item => {
            const w = item.rotation % 180 ? item.sizeH : item.sizeW;
            const h = item.rotation % 180 ? item.sizeW : item.sizeH;
            const x = item.gridX, y = item.gridY;
            const cx = 500 + (y + h / 2 - x - w / 2) * 33.75;
            const cy = 320 + (x + w / 2 + y + h / 2) * 19.1;
            const selected = this.furnitureEditMode && item.id === selectedId;
            if (item.asset) {
                const a = item.asset;
                const placement = officeAssetPlacement(item);
                const footprint = this.furnitureEditMode ? `<polygon points="${point(x, y)} ${point(x, y + h)} ${point(x + w, y + h)} ${point(x + w, y)}" fill="${selected ? '#facc1522' : 'none'}" stroke="${selected ? '#facc15' : '#72b9c7'}" stroke-width="1.5"/>` : '';
                const filter = FURNITURE_THEMES[item.theme]?.displayFilter || 'none';
                const transform = placement.mirror ? `translate(${2 * placement.x + placement.width} 0) scale(-1 1)` : '';
                return `<g data-furniture-id="${item.id}"><image href="${a.url}" x="${placement.x}" y="${placement.y}" width="${placement.width}" height="${placement.height}" transform="${transform}" style="filter:${filter}" preserveAspectRatio="xMidYMid meet"/>${footprint}</g>`;
            }
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
