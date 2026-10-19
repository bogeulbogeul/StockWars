import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS } from '../../data/townWorldData.js';
import { townEntrance, TOWN_VIEW_SCALE } from '../../data/townLayout.js';
import { TOWN_LANDSCAPE_INTERACTIVE } from '../../data/townLandscape.js';
import { TOWN_OCCLUDERS, getTownVisibility } from '../town/TownOcclusion.js';

export const TownStageMethods2 = {
    setRemotePlayers(players = []) {
        const seen = new Set();
        for (const player of players) {
            if (player.location && player.location !== 'town') continue;
            if (!player.id || player.isLocal || !Number.isFinite(player.x) || !Number.isFinite(player.y)) continue;
            seen.add(player.id);
            let entry = this.remotePlayers.get(player.id);
            if (!entry) {
                const element = this.townChar.cloneNode(true);
                element.removeAttribute('id');
                element.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
                element.classList.remove('resting-bench', 'hidden');
                element.hidden = false;
                element.style.visibility = 'visible';
                element.style.opacity = '1';
                element.classList.add('town-remote-player');
                element.style.pointerEvents = 'auto';
                element.style.cursor = 'pointer';
                element.setAttribute('role', 'button');
                element.tabIndex = 0;
                element.addEventListener('click', event => { event.stopPropagation(); void this.callbacks.onOpenPlayerProfile?.(entry.player); });
                element.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); element.click(); }
                });
                this.worldTrackEl.appendChild(element);
                entry = { element };
                this.remotePlayers.set(player.id, entry);
            }
            const now=performance.now();
            const duration=Math.min(1000,Math.max(200,now-(entry.receivedAt||now-300)));
            if(!entry.receivedAt||entry.poseAt!==player.poseAt||entry.targetX!==player.x||entry.targetY!==player.y){
                entry.fromX=entry.x??player.x;entry.fromY=entry.y??player.y;
                entry.targetX=player.x;entry.targetY=player.y;entry.receivedAt=now;entry.duration=duration;entry.poseAt=player.poseAt;
            }
            Object.assign(entry, { id: player.id });
            entry.x??=player.x;entry.y??=player.y;
            entry.player = { ...player };
            entry.element.setAttribute('aria-label', `${player.nickname || '플레이어'} 프로필 보기`);
            entry.element.querySelector('.town-char-nametag').textContent = player.nickname || '플레이어';
            const seat = player.resting && TOWN_LANDSCAPE_INTERACTIVE.find(p => p.type === 'bench' &&
                Math.hypot(townEntrance(p).x - player.x, townEntrance(p).y - player.y) < 20);
            entry.element.style.left = `${seat ? seat.x + seat.width / 2 : entry.x}px`;
            entry.element.style.top = `${seat ? seat.y - seat.height * .24 : entry.y}px`;
            entry.element.style.zIndex = `${seat ? Math.ceil(seat.y) + 1 : Math.round(player.y)}`;
            entry.element.dataset.facing = player.facing || 'down';
            entry.element.classList.toggle('resting-bench', !!player.resting);
            entry.element.querySelector('.town-char-body').style.transform = '';
        }
        for (const [id, entry] of this.remotePlayers) {
            if (!seen.has(id)) { entry.element.remove(); this.remotePlayers.delete(id); }
        }
        this.updatePlayerOcclusion();
        if(!this.remoteFrame&&this.remotePlayers.size)this.animateRemotePlayers();
    },

    animateRemotePlayers(){
        const now=performance.now();
        for(const entry of this.remotePlayers.values()){
            const t=Math.min(1,(now-entry.receivedAt)/(entry.duration||300));
            entry.x=entry.fromX+(entry.targetX-entry.fromX)*t;entry.y=entry.fromY+(entry.targetY-entry.fromY)*t;
            if(!entry.player.resting){entry.element.style.left=`${entry.x}px`;entry.element.style.top=`${entry.y}px`;entry.element.style.zIndex=String(Math.round(entry.y));}
            const walking=t<1&&Math.hypot(entry.targetX-entry.fromX,entry.targetY-entry.fromY)>1;
            entry.element.querySelector('.town-char-body').style.transform=`translateY(${walking?-Math.abs(Math.sin(now/100))*4:0}px)`;
        }
        this.updatePlayerOcclusion();
        this.remoteFrame=this.remotePlayers.size?requestAnimationFrame(()=>this.animateRemotePlayers()):null;
    },

    updatePlayerOcclusion() {
        const visibility = getTownVisibility(
            { x: this.playerController.charPosX, y: this.playerController.charPosY },
            [...this.remotePlayers.values()]);
        for (const object of TOWN_OCCLUDERS) {
            this.worldTrackEl.querySelector(`#${object.elementId}`)?.classList.toggle('player-behind', visibility.fadedObjects.has(object.elementId));
        }
        for (const [id, entry] of this.remotePlayers) {
            // Hide the whole remote avatar, including name and shadow; opacity on the
            // foreground artwork must never reveal it through a locally faded object.
            entry.element.style.display = visibility.hiddenPlayers.has(id) ? 'none' : '';
        }
    },

    checkProximity() {
        const { charPosX, charPosY } = this.playerController;
        const encounter = [...(this.remotePlayers?.values() || [])]
            .filter(entry => entry.element.style.display !== 'none' && Math.hypot(charPosX - entry.x, charPosY - entry.y) <= 180)
            .sort((a,b) => Math.hypot(charPosX-a.x,charPosY-a.y) - Math.hypot(charPosX-b.x,charPosY-b.y))[0];
        this.callbacks?.onPlayerEncounter?.(encounter?.player || null);
        const candidates = [
            ...TOWN_BUILDINGS.map(b => ({ ...b, kind: 'building' })),
            ...TOWN_INTERACTIVE_PROPS.map(p => ({ ...p, kind: 'prop' })),
            ...TOWN_LANDSCAPE_INTERACTIVE
        ];
        const nearby = candidates.map(object => {
            const entry = townEntrance(object);
            return { object, distance: Math.hypot(charPosX - entry.x, charPosY - entry.y) };
        }).filter(item => item.distance <= 90).sort((a, b) => a.distance - b.distance)[0]?.object;

        this.activeNearbyObject = nearby;
        const tutorialDestination = this.callbacks?.getTutorialDestination?.();
        const showPrompt = nearby && (!tutorialDestination || nearby.id === tutorialDestination);
        if (showPrompt && this.promptEl) {
            this.promptEl.classList.remove('hidden');
            this.promptEl.style.left = `${this.playerController.charPosX}px`;

            const nameTop = this.nameTag?.getBoundingClientRect().top;
            const worldTop = this.worldTrackEl.getBoundingClientRect().top;
            this.promptEl.style.top = `${Number.isFinite(nameTop) ? (nameTop - worldTop) / TOWN_VIEW_SCALE - 12 : this.playerController.charPosY - 160}px`;
            this.promptEl.style.bottom = "auto";

            if (this.promptIcon) this.promptIcon.textContent = nearby.icon || '🏢';
            if (this.promptTitle) this.promptTitle.textContent = nearby.name || '';
            if (this.promptDesc) this.promptDesc.textContent = nearby.available === false ? '건물 살펴보기' : nearby.actionText || nearby.desc || '';
        } else if (this.promptEl) {
            this.promptEl.classList.add('hidden');
        }
    },

    openBuildingInfo(building) {
        this.buildingInfoPreviousFocus = document.activeElement;
        this.buildingInfoOpen = true;
        this.playerController.keysHeld.clear();
        this.playerController.stopResting();
        const fields = { Title: building.name, Icon: building.icon || '🏢', Category: building.category, Desc: building.desc };
        for (const [field, value] of Object.entries(fields)) {
            this.buildingInfoModal.querySelector('#townBuildingInfo' + field).textContent = value || '';
        }
        this.buildingInfoModal.classList.remove('hidden');
        this.btnBuildingInfoClose.focus();
    },

    closeBuildingInfo() {
        this.buildingInfoOpen = false;
        this.buildingInfoModal?.classList.add('hidden');
        this.playerController.keysHeld.clear();
        this.buildingInfoPreviousFocus?.focus?.();
    },

    triggerAction(obj) {
        if (this.callbacks.isInputBlocked?.()) return;
        if (!obj) return;
        if (this.callbacks.onBeforeTownAction?.(obj) === false) return;
        if (obj.available === false) {
            this.openBuildingInfo(obj);
            return;
        }
        if (obj.kind === 'prop' || obj.type === 'bench' || obj.type === 'billboard') {
            if (obj.type === 'bench') {
                this.playerController.restOnBench(obj, this.townChar, this.worldTrackEl);
            } else if (obj.type === 'billboard') {
                this.billboardModal?.classList.remove('hidden');
            } else if (obj.type === 'vending') {
                this.playerController.keysHeld.clear();
                this.vendingModal.open();
            }
        } else {
            switch (obj.id) {
                case 'home_office_tower': if (this.callbacks.onReturnOffice) this.callbacks.onReturnOffice(); break;
                case 'vivian_store': if (this.callbacks.onOpenStore) this.callbacks.onOpenStore(); break;
                case 'julian_furniture': if (this.callbacks.onOpenFurniture) this.callbacks.onOpenFurniture(); break;
                case 'claire_apparel': if (this.callbacks.onOpenApparel) this.callbacks.onOpenApparel(); break;
                case 'data_ink_bookstore': if (this.callbacks.onOpenBookstore) this.callbacks.onOpenBookstore(); break;
                case 'cipher_securities': if (this.callbacks.onOpenSecurities) this.callbacks.onOpenSecurities(); break;
                case 'node_finance': if (this.callbacks.onOpenBank) this.callbacks.onOpenBank(); break;
                case 'midnight_pub': if (this.callbacks.onOpenPub) this.callbacks.onOpenPub(); break;
            }
        }
    },

    show(channel = { name: '타운 2', ping: 14 }, spawnLocation = null) {
        this.containerEl?.classList.remove('hidden');
        document.body.classList.add('town-mode-active');
        this.activeChannel = channel.name;
        if (this.channelText) this.channelText.textContent = channel.ping == null
            ? `채널: ${channel.name}`
            : `채널: ${channel.name} (원활 • ${channel.ping}ms)`;

        const aliases = { vivian: 'vivian_store' };
        const destination = TOWN_BUILDINGS.find(b => b.id === (aliases[spawnLocation] || spawnLocation));
        if (destination) this.playerController.placeAt(destination);
        else if (typeof spawnLocation === 'number') {
            this.playerController.placeAt({ x: Math.max(60, Math.min(this.playerController.worldWidth - 60, spawnLocation)), width: 0, y: 1000 });
        } else if (!this.hasVisited) {
            this.playerController.placeAt(TOWN_BUILDINGS.find(b => b.id === 'home_office_tower'));
        }
        this.hasVisited = true;
        this.playerController.stopResting();
        this.playerController.keysHeld.clear();
        this.playerController.updateCamera(this.viewportEl.clientWidth / TOWN_VIEW_SCALE, this.viewportEl.clientHeight / TOWN_VIEW_SCALE, 0, true);
        this.update(0);
        this.checkProximity();
        this.setRemotePlayers([]);
        if(!this.callbacks.externalPresence)this.presenceSync?.start();
    },

    hide() {
        this.closeBuildingInfo();
        this.presenceSync?.stop();
        this.setRemotePlayers([]);
        this.containerEl?.classList.add('hidden');
        document.body.classList.remove('town-mode-active');
        this.playerController.keysHeld.clear();
    },

    updateUserProfile(profile) {
        if (!profile) return;
        this.nickname = profile.nickname || '사이퍼 트레이더';
        if (this.nameTag) this.nameTag.textContent = this.nickname;
    },
};
