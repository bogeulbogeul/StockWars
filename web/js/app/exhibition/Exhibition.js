import { showTitleScreen } from '../TitleScreen.js';
import { loadScript } from './Script.js';
import { buildPlan, migrateClothingTour } from './Plan.js';
import { SAVE_KEY, freshState, loadState, persist, complete } from './State.js';
import { ExhibitionScenes } from './Scenes.js';
import { ExhibitionView, el } from './View.js';
import { ExhibitionActivities } from './Activities.js';
import { ExhibitionArrival } from './Arrival.js';
import { presentSomangi } from './SomangiPresentation.js';

const PLACE_NAMES = { arrival: '버스 정류장', tree: '포포리 나무', bench: '광장 벤치', notice: '주민 게시판',
    home: '나의 집', information: '포포리 안내소', bank: '은행', store: '봉봉 잡화점', stock: '잎새 증권',
    homeOutside: '집 앞', storeOutside: '잡화점 앞', informationOutside: '포포리 안내소 앞',
    bankOutside: '은행 앞', stockOutside: '잎새 증권 앞', furniture: '우디의 가구점',
    pub: '새벽달 펍', bookstore: '소담의 서점', post: '우체국 안내' };

export class Exhibition {
    constructor(container, chapters, storage = localStorage) {
        this.storage = storage; this.chapters = chapters;
        this.state = loadState(storage) || freshState();
        migrateClothingTour(this.state, chapters);
        this.scenes = new ExhibitionScenes(container);
        this.view = new ExhibitionView(() => this.confirmRestart());
        this.activities = new ExhibitionActivities(this); this.rebuild();
        this.arrival = new ExhibitionArrival(this);
        // Arrival borrows the same live village as the exhibition, without legacy saves/presence.
        window.stockWarsApp = this.scenes;
        window.stockWarsExhibition = this;
        window.addEventListener('keydown', event => {
            if (!this.started || this.activities.game?.isOpen || event.ctrlKey || event.metaKey || event.altKey) return;
            if (this.arrival.active) return;
            const input = event.target.closest?.('input, textarea, select, button');
            if (input || document.querySelector('dialog[open]')) return;
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
    async start() {
        this.started = true; this.view.root.hidden = false;
        if (this.state.cursor || this.state.nickname) {
            this.view.clear('포포리의 첫날'); this.view.text('이전에 하던 전시 체험이 있어요.');
            this.view.choices([['이어서 하기', () => this.render()], ['새로 시작하기', () => this.restart()]]);
        } else await this.render();
    }
    async render() {
        if (this.state.flags.asleep) { this.ending(); return; }
        this.rebuild();
        const beat = this.plan[this.state.cursor];
        if (!beat) { this.view.clear('진행 위치를 확인할 수 없어요'); this.view.choices([['처음부터', () => this.restart()]]); return; }
        this.busy = true;
        this.view.sync(this.state); this.view.clear('다음 장면으로 이동하고 있어요…');
        this.view.location.textContent = PLACE_NAMES[beat.place] || '포포리 마을';
        this.scenes.setTime(!!this.state.flags.sunset);
        await this.scenes.show(beat.place);
        if (this.state.cursor === 0 && !this.state.flags.moaAwake) {
            this.busy = false;
            this.arrival.start(); this.view.sync(this.state); return;
        }
        this.arrival.stop();
        await presentSomangi(this.scenes, beat);
        this.busy = false;
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
        this.view.clear(null, this.state.nickname); this.view.text('소망이는 바닥에 몸을 누이고 조용히 눈을 감았어요.');
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
    // Exhibition starts at arrival; retain the title/bus and omit the long prologue.
    if (new URLSearchParams(location.search).get('skipOpening') === '1') await app.start();
    else showTitleScreen(() => app.start(), { opening: false });
    return app;
}
