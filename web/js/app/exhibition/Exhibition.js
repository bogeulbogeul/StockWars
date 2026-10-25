import { showTitleScreen } from '../TitleScreen.js';
import { loadScript } from './Script.js';
import { buildPlan, migrateClothingTour } from './Plan.js';
import { SAVE_KEY, freshState, loadState, persist, complete } from './State.js';
import { ExhibitionScenes } from './Scenes.js';
import { ExhibitionView, el } from './View.js';
import { ExhibitionActivities } from './Activities.js';
import { ExhibitionArrival } from './Arrival.js';
import { presentSomangi } from './SomangiPresentation.js';
import { routeSeatKey } from '../../components/town3d/SeatInteraction.js';
import { createSessionStorage } from './SessionStorage.js';
import { waitForInformationTalk } from './InformationTalk.js';
import { routeExhibitionJump } from './JumpInput.js';

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
        this.scenes = new ExhibitionScenes(container);
        this.view = new ExhibitionView(() => this.confirmRestart(), {
            canTrade: () => !this.busy && this.plan?.[this.state.cursor]?.id === 'trade',
            onTrade: data => {
                this.view.phoneHome.close(); this.next('trade', data);
                return !!this.state.flags.trade;
            }
        });
        this.activities = new ExhibitionActivities(this); this.rebuild();
        this.arrival = new ExhibitionArrival(this);
        // Arrival borrows the same live village as the exhibition, without legacy saves/presence.
        window.stockWarsApp = this.scenes;
        window.stockWarsExhibition = this;
        window.addEventListener('keydown', event => {
            if (!this.started || this.activities.game?.isOpen || event.ctrlKey || event.metaKey || event.altKey) return;
            if (this.arrival.active) return;
            if (this.scenes.informationAwaitingTalk) return;
            if (routeExhibitionJump(event, this)) return;
            if (this.scenes.tourActive) return;
            if (routeSeatKey(event)) return;
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
        this.started = true; this.view.root.hidden = false;
        // Always restore the world before handing input back from the title.
        // A resume prompt here left the borrowed village canvas in an unshown scene.
        await this.render({ showArrivalGuide });
    }
    async render({ showArrivalGuide = false } = {}) {
        if (this.state.flags.asleep) { this.ending(); return; }
        this.rebuild();
        const beat = this.plan[this.state.cursor];
        if (!beat) { this.view.clear('진행 위치를 확인할 수 없어요'); this.view.choices([['처음부터', () => this.restart()]]); return; }
        this.busy = true;
        this.view.sync(this.state); this.view.clear(null);
        this.view.location.textContent = PLACE_NAMES[beat.place] || '포포리 마을';
        this.scenes.setTime(!!this.state.flags.sunset);
        const tour = beat.chapter === 3 || beat.id === 'walk';
        this.view.panel.hidden = true;
        await this.scenes.show(beat.place, { preservePosition: showArrivalGuide && beat.place === 'arrival', tour });
        if (this.scenes.informationAwaitingTalk) await waitForInformationTalk(this.scenes);
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
        await presentSomangi(this.scenes, beat);
        this.busy = false;
        this.view.panel.hidden = false;
        if (beat.kind === 'line') this.view.line(beat, () => this.next());
        else this.activities.run(beat);
        this.view.sync(this.state);
    }
    next(id, data) {
        if (this.busy || this.arrival.active) return;
        const previous = structuredClone(this.state);
        if (id && !this.state.flags[id] && !complete(this.state, id, data)) {
            this.view.error('아직 준비가 끝나지 않았어요. 앞의 활동을 확인해 주세요.'); return;
        }
        this.state.cursor++;
        if (!this.save()) { this.state = previous; return; }
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
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.busy = false; this.ending();
    }
    ending() {
        document.body.classList.add('exhibition-night');
        this.view.clear('포포리에서 보낸 첫날', '잘 자요');
        this.view.text(`${this.state.nickname}, 오늘은 이름을 정하고, 처음으로 일을 하고 주식도 샀어요.\n가지고 온 씨앗도 지낼 곳이 생겼어요.\n내일은 무슨 일이 있을까요?`);
        this.view.text('전시 체험은 여기까지예요. 함께해 주셔서 고마워요.');
        this.view.choices([['다음 방문자 · 처음부터', () => this.restart()]]);
        this.view.root.dataset.ended = 'true';
    }
    confirmRestart() {
        if (this.busy || this.activities.game?.isOpen) return;
        this.arrival.stop();
        this.view.clear('체험을 처음부터 시작할까요?');
        this.view.text('현재 전시 체험의 이름과 진행만 초기화해요. 일반 게임 저장은 유지돼요.');
        this.view.choices([['처음부터 시작', () => this.restart()], ['계속하기', () => this.render()]]);
    }
    restart() {
        this.arrival.stop();
        this.scenes.informationEntered = false;
        this.scenes.informationAwaitingTalk = false;
        if (this.scenes.townModelScene.sleepingAnna) this.scenes.townModelScene.sleepingAnna.root.visible = true;
        try { this.storage.removeItem(SAVE_KEY); }
        catch { this.view.error('전시 저장을 초기화하지 못했어요.'); return; }
        this.state = freshState(); this.activities.game && (this.activities.game.session = null);
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
