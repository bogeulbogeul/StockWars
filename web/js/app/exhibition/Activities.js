import { mountInvestmentExam } from './InvestmentExam.js';
import { waitForSeedPot, waitForFirstDiary } from './HomeFinale.js';
import { showFirstPhonePrompt } from './FirstPhonePrompt.js';
import { startMoaReturn } from './MoaReturn.js';
import { mountInvestmentCertificate } from './InvestmentCertificate.js';
import { mountBankApplication } from './BankApplication.js';
import { mountResidenceApplication } from './ResidenceApplication.js';
import { PackingGame } from '../../components/packing/PackingGame.js';
import { EXHIBITION, complete } from './State.js';
import { examQuestions } from './Quiz.js';
import { el } from './View.js';
import { activitySpeech, passiveActivity } from './ActivityDialogue.js';
import { receivePhone } from './PhoneHandoff.js';
import { receiveResidencePaper } from './ResidencePaperHandoff.js';
import { showStorePackingOffer } from './StorePackingOffer.js';
import { waitForPackingWorkstation } from '../../components/store3d/PackingWorkstation.js';
import { receiveProfileDocument } from '../../components/phone/profile/ProfileData.js';
import { sendMoaToPlazaBench } from './MoaPlazaRest.js';
import { receiveStoreReward } from './StoreRewardHandoff.js';
import { waitForLessonComputer } from './LessonComputer.js';
import { waitForToriCounter } from './ToriCounter.js';
import { receiveHoneyCookie } from './CookieHandoff.js';
import { receiveMoaGift } from './MoaGiftHandoff.js';
import { openSeedPotShop } from './PotShop.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';

export class ExhibitionActivities {
    constructor(controller) { this.app = controller; }
    get state() { return this.app.state; }
    get view() { return this.app.view; }
    next(id, data) { this.app.next(id, data); }
    say(speaker, text) { activitySpeech(this.view, speaker, text); }
    run(beat) {
        const { id } = beat;
        this.view.clear(null);
        if (this[id]) { this[id](); return; }
        if (!passiveActivity(this.app, id)) throw new Error(`Unknown story activity: ${id}`);
    }
    async nickname() {
        this.app.busy = true; this.view.panel.hidden = true;
        try {
            const paper = await receiveResidencePaper(this.app);
            this.app.busy = false; this.view.panel.hidden = false;
            if (!receiveProfileDocument(this.app, 'residence')) { paper.returnToDesk(); this.view.choices([['서류 수령 다시 시도', () => this.nickname()]]); return; }
            mountResidenceApplication(this.view.panel, {
                name: this.state.nickname,
                onSubmit: name => { paper.returnToDesk(); this.state.nickname = name; this.next('nickname'); }
            });
        } catch (error) {
            this.app.busy = false; this.view.panel.hidden = false;
            this.view.error('신청서를 준비하지 못했어요. 다시 시작해 주세요.'); console.error(error);
        }
    }
    bank() {
        if (!receiveProfileDocument(this.app, 'bank')) { this.view.choices([['서류 수령 다시 시도', () => this.bank()]]); return; }
        mountBankApplication(this.view.panel, { name: this.state.nickname, onSubmit: () => this.next('bank') });
    }
    async phone() {
        this.app.busy = true; this.view.panel.hidden = true;
        try {
            await receivePhone(this.app);
            complete(this.state, 'phone'); this.app.save(); this.view.sync(this.state);
            this.app.busy = false; this.next('phone');
        } catch (error) {
            this.app.busy = false; this.view.panel.hidden = false;
            this.view.error('휴대폰을 준비하지 못했어요.'); console.error(error);
        }
    }
    openPhone() {
        showFirstPhonePrompt(this.app);
    }
    moaFarewell() {
        this.app.scenes.moaBenchJourney ||= sendMoaToPlazaBench(this.app.scenes)
            .catch(error => { console.error('Moa plaza departure:', error); });
        this.next('phoneReady');
    }
    moaReturn() {
        void startMoaReturn(this.app.scenes).catch(error => console.error('Moa information return:', error));
        this.next('moaReturn');
    }
    loan() {
        if (!receiveProfileDocument(this.app, 'loan', EXHIBITION.loan)) { this.view.choices([['서류 수령 다시 시도', () => this.loan()]]); return; }
        mountBankApplication(this.view.panel, {
            name: this.state.nickname, loanAmount: EXHIBITION.loan,
            onSubmit: () => this.next('loan')
        });
    }
    order() {
        this.say('소망이', '오늘은 어떤 일부터 해볼까? 다른 일도 천천히 해볼 수 있겠지.');
        this.view.choices([['주민 부탁 들어주기', () => this.chooseOrder('packing')],
            ['주식 투자 배우기', () => this.chooseOrder('stock')]]);
    }
    chooseOrder(order) { this.state.order = order; this.app.rebuild(); this.next('order'); }
    packingOffer() { showStorePackingOffer(this.app); }
    async storeReward(id) {
        this.app.busy = true; this.view.panel.hidden = true;
        try {
            await receiveStoreReward(this.app, id);
            this.app.busy = false; this.next(id);
        } catch (error) {
            this.app.busy = false; this.view.panel.hidden = false;
            this.view.line({ speaker: '봉봉', text: '잠시만요. 건네드릴 물건을 다시 챙길게요.' }, () => this.storeReward(id));
            console.error('Store reward handoff:', error);
        }
    }
    wage() { return this.storeReward('wage'); }
    envelope() { return this.storeReward('envelope'); }
    grant() { return this.moaGift('grant'); }
    diary() { return this.moaGift('diary'); }
    async moaGift(id) {
        this.app.busy = true; this.view.panel.hidden = true;
        try {
            await receiveMoaGift(this.app, id);
            this.app.busy = false; this.next(id);
        } catch (error) {
            this.app.busy = false; this.view.panel.hidden = false;
            this.view.line({ speaker: '모아', text: '잠시만요. 건네드릴 물건을 다시 챙길게요.' }, () => this.moaGift(id));
            console.error('Moa gift handoff:', error);
        }
    }
    async cookie() {
        this.app.busy = true; this.view.panel.hidden = true;
        try {
            await receiveHoneyCookie(this.app);
            this.app.busy = false; this.next('cookie');
        } catch (error) {
            this.app.busy = false; this.view.panel.hidden = false;
            this.view.line({ speaker: '모아', text: '잠깐만요. 꿀쿠키를 꺼내 줄게요.' }, () => this.cookie());
            console.error('Honey cookie handoff:', error);
        }
    }
    notice() {
        this.say('소망이', '게시판에 공고가 붙어 있네. 가까이 가서 읽어볼까?');
        this.view.text('게시판 가까이에서 F키 또는 게시판 살펴보기 버튼을 눌러 공고를 읽어보세요.');
    }
    async packing() {
        this.app.busy = true; this.view.panel.hidden = true; this.app.scenes.packingAwaitingWorktop = true;
        const room = this.app.scenes.rooms.get('store');
        let ready;
        try { ready = await waitForPackingWorkstation(room); }
        finally { this.app.scenes.packingAwaitingWorktop = false; this.app.busy = false; }
        if (!ready) return;
        this.game ||= new PackingGame({ showTutorial: true, onClose: () => {
            this.state.packingSession = this.game.session; this.app.save();
            if (this.game.session.completed === this.game.session.orders.length) this.next('packing');
            else void this.packing();
        } });
        if (this.state.packingSession) this.game.session = this.state.packingSession;
        this.game.open();
        if (!this.observer) {
            this.observer = new MutationObserver(() => {
                this.state.packingSession = this.game.session; this.app.save();
            });
            this.observer.observe(this.game.dialog, { childList: true, subtree: true });
        }
    }
    async rumor() {
        this.view.panel.hidden = true;
        const guide = createMoaMovementGuide(this.view.root, { inventoryRumor: true });
        guide.update({ visible: true });
        this.app.inventory.onRumorOpened = () => guide.update({ visible: false });
        this.app.inventory.onRumorClosedEarly = () => guide.update({ visible: true });
        let read;
        try { read = await this.app.inventory.waitForRumorRead(); }
        finally { guide.dispose(); this.app.inventory.onRumorOpened = null; this.app.inventory.onRumorClosedEarly = null; }
        if (read) this.next('rumor');
    }
    certificate() {
        const questions = examQuestions(this.state);
        const index = this.state.answers.length;
        if (index >= questions.length) {
            mountInvestmentCertificate(this.view.panel, {
                name: this.state.nickname, onReceive: () => this.next('certificate')
            });
            return;
        }
        mountInvestmentExam(this.view.panel, {
            name: this.state.nickname, question: questions[index], index, total: questions.length,
            onAnswer: choice => {
                this.state.answers.push(choice);
                if (!this.app.save()) { this.state.answers.pop(); return false; }
                return true;
            },
            onNext: () => { this.view.clear('투자 자격시험'); this.certificate(); }
        });
    }
    async trade() {
        await waitForLessonComputer(this.app);
        this.view.phoneHome.dialog.addEventListener('close', () => {
            if (!this.state.flags.trade && this.app.plan[this.state.cursor]?.id === 'trade') void this.trade();
        }, { once: true });
    }
    async stockCounter() {
        this.app.busy = true; this.view.panel.hidden = true;
        try { await waitForToriCounter(this.app.scenes); }
        finally { this.app.busy = false; }
        this.next('stockCounter');
    }
    pot() {
        openSeedPotShop(this.app);
    }
    planted() { return waitForSeedPot(this.app); }
    diaryWritten() { return waitForFirstDiary(this.app); }
    asleep() {
        this.say('소망이', '하아암…… 너무 졸려. 이제 자야겠다.');
        this.view.choices([['잠자기', () => this.app.sleep()]]);
    }
}


