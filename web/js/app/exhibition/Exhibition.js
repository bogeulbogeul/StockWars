import { installExhibitionInventory } from './Inventory.js';
import { installDiary } from '../InstallDiary.js';
import { gameKey } from '../GameKeys.js';
import { hasExhibitionSunset } from '../../data/exhibitionSkyTime.js';
import { exhibitionMapPosition } from '../../components/phone/map/MapData.js';
import { installVillageBoard } from '../InstallVillageBoard.js';
import { createTourPlayerControls } from './TourPlayerControls.js';
import { showTitleScreen } from '../TitleScreen.js';
import { loadScript } from './Script.js';
import { buildPlan, migrateClothingTour, migrateTourDialogue } from './Plan.js';
import { SAVE_KEY, freshState, loadState, persist, complete } from './State.js';
import { ExhibitionScenes } from './Scenes.js';
import { ExhibitionView, el } from './View.js';
import { ExhibitionActivities } from './Activities.js';
import { ExhibitionArrival } from './Arrival.js';
import { presentSomangi } from './SomangiPresentation.js';
import { routeSeatKey } from '../../components/town3d/SeatInteraction.js';
import { routeInformationGuideKey } from '../../components/information3d/InformationGuidebook.js';
import { createSessionStorage } from './SessionStorage.js';
import { waitForInformationTalk, waitForBankTalk } from './InformationTalk.js';
import { routeExhibitionJump } from './JumpInput.js';
import { waitForStoreTalk } from './StoreTalk.js';
import { startToriLesson } from './ToriTrainingLesson.js';
import { presentLessonBoard } from './ToriLessonBoard.js';
import { presentVillageMap } from './VillageMapIntro.js';
import { createStoreDestinationGuard, atStoreEntrance } from './StoreDestinationGuard.js';
import { showSleepEnding } from './SleepEnding.js';
import { stageStoreRewardConversation } from './StoreRewardStaging.js';
import { waitForPlazaMoaTalk } from './PlazaMoaTalk.js';
import { REVIEW_TRAVEL_CANCELLED } from './ReviewTravel.js';
import { playSomangiYawn } from './SomangiYawn.js';

const PLACE_NAMES = { arrival: '버스 정류장', tree: '포포리 나무', bench: '광장 벤치', notice: '주민 게시판',
    home: '소망이네 집', information: '모아 안내소', bank: '차곡 은행', store: '봉봉 잡화점', stock: '토리 증권사',
    homeOutside: '소망이네 집 앞', storeOutside: '봉봉 잡화점 앞', informationOutside: '모아 안내소 앞',
    bankOutside: '차곡 은행 앞', stockOutside: '토리 증권사 앞', furniture: '우디 가구점',
    pub: '도란 쉼터', bookstore: '소담 서점', post: '두리 우체국 안내' };

export class Exhibition {
    constructor(container, chapters, storage = createSessionStorage()) {
        this.storage = storage; this.chapters = chapters;
        this.state = loadState(storage) || freshState();
        migrateClothingTour(this.state, chapters);
        migrateTourDialogue(this.state, chapters);
        this.scenes = new ExhibitionScenes(container);
        this.scenes.setTime(hasExhibitionSunset(this.state.flags), { asleep: !!this.state.flags.asleep, immediate: true });
        this.view = new ExhibitionView(() => this.confirmRestart(), {
            mapPosition: () => exhibitionMapPosition(this.scenes),
            canTrade: () => !this.busy && this.plan?.[this.state.cursor]?.id === 'trade',
            onTrade: data => {
                this.view.phoneHome.close(); this.next('trade', data);
                return !!this.state.flags.trade;
            }
        });
        this.activities = new ExhibitionActivities(this); this.rebuild();
        installExhibitionInventory(this);
        installDiary(this, true);
        this.updateVillageBoard = installVillageBoard(this.scenes, {
            host: this.view.root,
            canInteract: () => !!this.started && !this.busy && !this.arrival?.active
                && this.plan?.[this.state.cursor]?.chapter !== 3
                && !this.scenes.informationAwaitingTalk && !this.scenes.tourActive,
            onRead: () => this.plan[this.state.cursor]?.id === 'notice' ? () => {
                this.view.line({ speaker: '소망이', text: '봉봉 잡화점에서 포장을 도와줄 사람을 찾는구나. 처음이어도 괜찮다니 가볼까?' },
                    () => this.next('notice'));
            } : null,
            onOpen: () => this.noticeControls?.clear()
        });
        this.scenes.updateVillageBoard = this.updateVillageBoard;
        this.arrival = new ExhibitionArrival(this);
        // Arrival borrows the same live village as the exhibition, without legacy saves/presence.
        window.stockWarsApp = this.scenes;
        window.stockWarsExhibition = this;
        window.addEventListener('keydown', event => {
            if (this.inventory.view.dialog.open) return;
            if (routeInformationGuideKey(event)) return;
            if (!this.started || this.activities.game?.isOpen || event.ctrlKey || event.metaKey || event.altKey) return;
            if (this.arrival.active) return;
            if (this.view.phoneHome.dialog.open) return;
            if (this.scenes.informationAwaitingTalk || this.scenes.bankAwaitingTalk || this.scenes.storeAwaitingTalk || this.scenes.stockAwaitingTalk || this.scenes.plazaAwaitingTalk || this.scenes.computerAwaitingUse
                || this.scenes.packingAwaitingWorktop) return;
            if (this.scenes.receivingApplication || this.scenes.receivingItem) return;
            if (routeExhibitionJump(event, this)) return;
            if (this.scenes.tourActive) return;
            if (routeSeatKey(event)) return;
            if (this.noticeControls && ['w', 'a', 's', 'd', 'f'].includes(gameKey(event))) return;
            const next = this.view.panel.querySelector('.dialogue-next-triangle');
            if (next && event.code === 'KeyF') {
                event.preventDefault(); event.stopImmediatePropagation();
                if (!event.repeat) next.click();
                return;
            }
            const input = event.target.closest?.('input, textarea, select, button');
            if (input || document.querySelector('dialog[open]')) return;
            if (event.code === 'KeyP' && !event.repeat) {
                event.preventDefault(); this.view.openPhone(); return;
            }
            event.stopImmediatePropagation();
            if (event.key === 'Enter' && !event.repeat) {
                event.preventDefault(); this.view.panel.querySelector('button')?.click();
            }
        }, true);
    }
    rebuild() { this.plan = buildPlan(this.chapters, this.state.order); }
    save() {
        try { persist(this.storage, this.state); return true; }
        catch { this.view.error('진행을 저장하지 못했어요. 브라우저 저장 공간을 확인하고 다시 눌러주세요.'); return false; }
    }
    async start({ showArrivalGuide = false } = {}) {
        // Each bus arrival starts a new three-call encounter; explicit resume keeps its count.
        if (showArrivalGuide && this.state.cursor === 0) {
            this.state.flags.moaAwake = false;
            this.state.moaCalls = 0;
        }
        this.started = true; this.inventory.sync(); this.view.root.hidden = false;
        // Always restore the world before handing input back from the title.
        // A resume prompt here left the borrowed village canvas in an unshown scene.
        await this.render({ showArrivalGuide });
    }
    render(options = {}) {
        this.renderTask = this.renderBeat(options).catch(error => {
            if (error !== REVIEW_TRAVEL_CANCELLED) throw error;
        });
        return this.renderTask;
    }
    async renderBeat({ showArrivalGuide = false } = {}) {
        if (this.state.flags.asleep) { this.ending(); return; }
        this.rebuild();
        const beat = this.plan[this.state.cursor];
        presentVillageMap(this, beat || {});
        if (!beat) { this.view.clear('진행 위치를 확인할 수 없어요'); this.view.choices([['처음부터', () => this.restart()]]); return; }
        this.noticeControls?.dispose(); this.noticeControls = null;
        this.storeDestinationGuard?.dispose(); this.storeDestinationGuard = null;
        this.busy = true;
        this.view.computerRequired = beat.id === 'trade';
        this.view.sync(this.state); this.view.clear(null);
        this.view.location.textContent = beat.place === 'homeOutside' && !this.state.flags.nickname
            ? '앞으로 지낼 집' : PLACE_NAMES[beat.place] || '포포리 마을';
        const sunset = hasExhibitionSunset(this.state.flags);
        // Prepare the outdoor sky while still indoors, before the second activity's exit.
        this.scenes.setTime(sunset, { immediate: sunset && !this.state.flags.sunset });
        const tour = beat.chapter === 3 || beat.id === 'walk';
        const previousStore = this.scenes.rooms.get('store');
        if (previousStore) previousStore.rewardConversationActive = !!beat.storeRewardConversation;
        this.view.panel.hidden = true;
        this.scenes.plazaReturnPending = !!beat.plazaTalk;
        await this.scenes.show(beat.place, { preservePosition: showArrivalGuide && beat.place === 'arrival', tour });
        if (beat.id === 'notice' && this.scenes.storeEntryRequested) {
            this.scenes.storeEntryRequested = false;
            // The player is already at the store door, rather than at the optional board.
            this.scenes.place = 'storeOutside'; this.busy = false;
            this.next('notice'); return;
        }
        if (this.scenes.informationAwaitingTalk) await waitForInformationTalk(this.scenes);
        if (this.scenes.bankAwaitingTalk) await waitForBankTalk(this.scenes);
        if (this.scenes.storeAwaitingTalk) await waitForStoreTalk(this.scenes);
        const moaWasCalled = this.state.flags.moaAwake && this.state.moaCalls >= 3;
        if (beat.place === 'arrival' && moaWasCalled) {
            await this.scenes.ready;
            await this.scenes.townModelScene.sleepingAnna?.setAwake(true, { immediate: true });
        }
        if (this.state.cursor === 0 && !moaWasCalled) {
            this.busy = false;
            this.arrival.start({ showGuide: showArrivalGuide }); this.view.sync(this.state); return;
        }
        this.arrival.stop();
        this.view.panel.hidden = true;
        const store = this.scenes.rooms.get('store');
        if (store) store.rewardConversationActive = !!beat.storeRewardConversation;
        if (beat.storeRewardConversation) await stageStoreRewardConversation(store);
        if (beat.plazaTalk) await waitForPlazaMoaTalk(this.scenes, { stand: !!(this.state.flags.packing && this.state.flags.trade) });
        if (beat.trainingLesson) await startToriLesson(this.scenes);
        if (beat.yawn) await playSomangiYawn(this.scenes);
        await presentSomangi(this.scenes, beat);
        presentLessonBoard(this.scenes, beat);
        this.busy = false;
        this.view.panel.hidden = false;
        if (beat.packingOffer) this.activities.packingOffer();
        else if (beat.kind === 'line') this.view.line(beat, () => this.next());
        else this.activities.run(beat);
        if (beat.id === 'notice') {
            this.storeDestinationGuard = createStoreDestinationGuard(this.scenes);
            this.noticeControls = createTourPlayerControls(this.scenes.townStage.playerController,
                { onInteract: () => {
                    if (this.storeDestinationGuard.interact()) return;
                    if (atStoreEntrance(this.scenes.townStage.playerController)) this.next('notice');
                    else this.updateVillageBoard.interact();
                }, onMoveAttempt: (dx, dy) => this.storeDestinationGuard.move(dx, dy) });
        }
        this.view.sync(this.state);
    }
    next(id, data) {
        if (this.busy || this.arrival.active || this.view.phoneHome.dialog.open) return;
        const previous = structuredClone(this.state);
        if (id && !this.state.flags[id] && !complete(this.state, id, data)) {
            this.view.error('아직 준비가 끝나지 않았어요. 앞의 활동을 확인해 주세요.'); return;
        }
        const received = id === 'envelope' && !previous.flags.envelope;
        const scene = this.scenes.rooms.get(this.scenes.place) || this.scenes.townModelScene;
        void scene.player?.setExpression('smile');
        this.inventory.sync();
        this.state.cursor++;
        if (!this.save()) { this.state = previous; this.inventory.sync(); return; }
        if (received) this.inventory.receive();
        void this.render();
    }
    async sleep() {
        if (this.busy) return;
        const previous = structuredClone(this.state);
        if (!complete(this.state, 'asleep')) return;
        if (!this.save()) { this.state = previous; return; }
        this.busy = true;
        this.activities.say('소망이', '오늘은 푹 자야겠다. 내일은 또 어떤 하루가 기다릴까…….');
        this.view.panel.append(el('p', 'exhibition-sleeping', '오늘의 작은 발걸음을 기억하며…'));
        await new Promise(resolve => setTimeout(resolve, 2200));
        document.body.classList.add('exhibition-night');
        this.scenes.setTime(false, { asleep: true });
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.busy = false; this.ending();
    }
    ending() {
        document.body.classList.add('exhibition-night');
        this.scenes.setTime(false, { asleep: true, immediate: true });
        if (this.view.root.dataset.ended === 'true') return;
        this.view.phoneHome.close();
        this.view.root.hidden = true;
        this.started = false;
        this.demoEnded = true;
        this.view.root.dataset.ended = 'true';
        showSleepEnding();
    }
    confirmRestart() {
        if (this.busy || this.activities.game?.isOpen) return;
        this.arrival.stop();
        this.view.clear('체험을 처음부터 시작할까요?');
        this.view.text('현재 전시 체험의 이름과 진행만 초기화해요. 일반 게임 저장은 유지돼요.');
        this.view.choices([['처음부터 시작', () => this.restart()], ['계속하기', () => this.render()]]);
    }
    restart() {
        this.cancelPhonePrompt?.();
        this.scenes.storeEntryRequested = false;
        this.arrival.stop();
        if (this.scenes.moaBenchJourneyToken) this.scenes.moaBenchJourneyToken.cancelled = true;
        this.scenes.moaPlazaRestore?.(); this.scenes.moaPlazaRestore = null;
        this.scenes.moaBenchJourney = null; this.scenes.moaRestingAtPlaza = false;
        if (this.scenes.moaReturnToken) this.scenes.moaReturnToken.cancelled = true;
        this.scenes.moaReturnJourney = null; this.scenes.moaReturnedToInformation = false;
        this.cancelFinaleWait?.(); this.demoEnded = false;
        this.scenes.informationEntered = false;
        this.scenes.informationAwaitingTalk = false;
        this.scenes.bankAwaitingTalk = false;
        this.scenes.storeAwaitingTalk = false;
        if (this.scenes.townModelScene.sleepingAnna) this.scenes.townModelScene.sleepingAnna.root.visible = true;
        try { this.storage.removeItem(SAVE_KEY); }
        catch { this.view.error('전시 저장을 초기화하지 못했어요.'); return; }
        this.inventory.view.close();
        this.state = freshState(); this.inventory.sync(); this.activities.game && (this.activities.game.session = null);
        this.scenes.setTime(false, { immediate: true });
        document.body.classList.remove('exhibition-night', 'exhibition-sunset');
        delete this.view.root.dataset.ended; void this.render();
    }
}

export async function startExhibition() {
    document.body.classList.add('exhibition-mode', 'town-model-mode');
    const chapters = await loadScript();
    const app = new Exhibition(document.getElementById('app'), chapters);
    // Normal play includes the full opening before the bus arrives.
    if (new URLSearchParams(location.search).get('skipOpening') === '1') await app.start();
    else showTitleScreen(() => app.start({ showArrivalGuide: true }));
    return app;
}
