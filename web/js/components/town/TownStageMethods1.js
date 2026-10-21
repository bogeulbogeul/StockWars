import { updateCharacterSprite as updateDogSprite } from '../CharacterSprite.js';
import { gameKey } from '../../app/GameKeys.js';
import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS } from '../../data/townWorldData.js';
import { townEntrance, TOWN_VIEW_SCALE } from '../../data/townLayout.js';
import { TOWN_LANDSCAPE_INTERACTIVE } from '../../data/townLandscape.js';

export const TownStageMethods1 = {
    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.containerEl?.classList.contains('hidden')) return;
            if (this.buildingInfoOpen) {
                if (gameKey(e) === 'escape') { e.preventDefault(); this.closeBuildingInfo(); }
                if (e.key === 'Tab') {
                    e.preventDefault();
                    this.btnBuildingInfoClose.focus();
                }
                return;
            }
            if (this.callbacks.isInputBlocked?.()) return;
            if (e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
            const key = gameKey(e);
            if ((key === 'enter' || key === ' ') && e.target?.closest?.('.town-landscape-bench')) {
                e.preventDefault();
                if (!e.repeat) e.target.closest('.town-landscape-bench').click();
                return;
            }
            if (key === 'f') {
                if (e.repeat || e.defaultPrevented) return;
                if (this.activeNearbyObject) this.triggerAction(this.activeNearbyObject);
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

        this.btnBuildingInfoClose?.addEventListener('click', () => this.closeBuildingInfo());
        this.buildingInfoModal?.addEventListener('click', (e) => {
            if (e.target === this.buildingInfoModal) this.closeBuildingInfo();
        });

        // Click on buildings or interactive props
        this.viewportEl?.addEventListener('click', (e) => {
            if (this.callbacks.isInputBlocked?.()) return;
            const targetBuilding = e.target.closest('.town-building-box');
            if (targetBuilding) {
                const bId = targetBuilding.dataset.buildingId;
                const building = TOWN_BUILDINGS.find(b => b.id === bId);
                if (building) {
                    this.playerController.placeAt(building);
                    this.checkProximity();
                    this.triggerAction(building);
                }
                return;
            }

            const targetProp = e.target.closest('.town-bench-prop, .town-landscape-bench');
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
    },

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
    },

    update(dt) {
        if (this.callbacks.isInputBlocked?.()) {
            // Release movement held before entering the mini-game as well.
            this.playerController.keysHeld.clear();
            this.playerController.isMoving = false;
            this.playerController.walkPhase = 0;
        } else {
            this.playerController.update(dt, this.viewportEl.clientWidth / TOWN_VIEW_SCALE, this.viewportEl.clientHeight / TOWN_VIEW_SCALE);
        }

        // Snap only presentation coordinates; keep movement/collision precision.
        const pixelRatio = globalThis.devicePixelRatio || 1;
        const snapScreen = value => Math.round(value * pixelRatio) / pixelRatio;
        // Apply World & Camera Transforms
        if (this.worldTrackEl) {
            this.worldTrackEl.style.transform = `translate(${snapScreen(-this.playerController.cameraX * TOWN_VIEW_SCALE)}px, ${snapScreen(-this.playerController.cameraY * TOWN_VIEW_SCALE)}px) scale(${TOWN_VIEW_SCALE})`;
        }
        if (this.parallaxBgEl) {
            this.parallaxBgEl.style.width = `calc(100% + ${this.playerController.worldWidth * 0.25}px)`;
            this.parallaxBgEl.style.transform = `translateX(${-this.playerController.cameraX * 0.25}px)`;
        }
        if (this.townChar) {
            const position = this.playerController.renderPosition;
            this.townChar.style.left = `${snapScreen(position.x * TOWN_VIEW_SCALE) / TOWN_VIEW_SCALE}px`;
            this.townChar.style.top = `${snapScreen(position.y * TOWN_VIEW_SCALE) / TOWN_VIEW_SCALE}px`;
            this.townChar.style.zIndex = `${position.z}`;
            this.townChar.dataset.facing = this.playerController.facing;
            const flip = this.playerController.charFacing < 0 ? 'scaleX(-1)' : 'scaleX(1)';
            const bounce = this.playerController.isMoving ? Math.sin(this.playerController.walkPhase) * 6 : 0;
            if (this.charBody) {
                updateDogSprite(this.charBody, { direction: this.playerController.facing, moving: this.playerController.isMoving, seated: this.playerController.isResting });
            }
        }

        this.updatePlayerOcclusion();
        this.worldTrackEl.querySelectorAll('.town-urban-tree').forEach(tree => {
            const behind = this.playerController.charPosY < 1240 && this.playerController.charPosY > 960 &&
                Math.abs(this.playerController.charPosX - parseFloat(tree.style.left) - 120) < 130;
            tree.classList.toggle('player-behind', behind);
        });
        this.checkProximity();
        this.updateTutorialDirection();
    },

    updateTutorialDirection() {
        if (this.tutorialDestination) this.tutorialDestination.hidden = true;
        const building = TOWN_BUILDINGS.find(b => b.id === this.callbacks.getTutorialDestination?.());
        if (!building) {
            if (this.tutorialDirection) this.tutorialDirection.hidden = true;
            if (this.tutorialDestination) this.tutorialDestination.hidden = true;
            return;
        }
        if (!this.tutorialDirection) {
            this.tutorialDirection = document.createElement('div');
            this.tutorialDirection.className = 'town-tutorial-direction';
            this.tutorialDirection.innerHTML = '<span class="town-tutorial-arrow" aria-hidden="true">➤</span><span class="town-tutorial-direction-text"></span>';
            this.worldTrackEl.append(this.tutorialDirection);
        }
        const target = townEntrance(building), player = this.playerController;
        const dx = target.x - player.charPosX, dy = target.y - player.charPosY;
        const nearby = this.activeNearbyObject?.id === building.id || Math.hypot(dx, dy) <= 90;
        this.tutorialDirection.hidden = nearby;
        if (nearby) return;
        this.tutorialDirection.style.left = player.charPosX + 'px';
        const nameTop = this.nameTag?.getBoundingClientRect().top;
        const worldTop = this.worldTrackEl.getBoundingClientRect().top;
        const guideBottom = Number.isFinite(nameTop)
            ? (nameTop - worldTop) / TOWN_VIEW_SCALE - 12
            : player.charPosY - 160;
        this.tutorialDirection.style.top = guideBottom + 'px';
        this.tutorialDirection.querySelector('.town-tutorial-arrow').style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)';
        this.tutorialDirection.querySelector('.town-tutorial-arrow').hidden = false;
        this.tutorialDirection.querySelector('.town-tutorial-direction-text').textContent = '목적지는 이 방향이에요';
    },

    // Complete remote snapshot for the active channel; coordinates use the town ground plane.

};
