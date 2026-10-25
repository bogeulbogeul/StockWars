import { mountInvestmentExam } from './InvestmentExam.js';
import { mountInvestmentCertificate } from './InvestmentCertificate.js';
import { mountBankApplication } from './BankApplication.js';
import { mountResidenceApplication } from './ResidenceApplication.js';
import { PackingGame } from '../../components/packing/PackingGame.js';
import { EXHIBITION } from './State.js';
import { ACCOUNT_QUIZ } from './Quiz.js';
import { el } from './View.js';
import { activitySpeech, passiveActivity } from './ActivityDialogue.js';
import { receiveResidencePaper } from './ResidencePaperHandoff.js';

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
        mountBankApplication(this.view.panel, { name: this.state.nickname, onSubmit: () => this.next('bank') });
    }
    openPhone() {
        this.view.line({ speaker: '소망이', text: '어디 보자…….' }, () => {
            if (this.openingPhone) return;
            if (this.view.openPhone()) {
                this.openingPhone = true;
                this.view.phoneHome.dialog.addEventListener('close', () => {
                    this.openingPhone = false; this.next('openPhone');
                }, { once: true });
            }
        });
    }
    loan() {
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
    notice() {
        this.say('소망이', '게시판에 공고가 붙어 있네. 가까이 가서 읽어볼까?');
        this.view.text('게시판 가까이에서 F키 또는 게시판 살펴보기 버튼을 눌러 공고를 읽어보세요.');
    }
    packing() {
        this.say('봉봉', '상품을 상자에 빈틈없이 담아주세요. 다섯 상자예요. 서두르지 않아도 괜찮아요.');
        this.view.choices([['포장하기', () => {
            this.game ||= new PackingGame({ onClose: () => {
                this.state.packingSession = this.game.session; this.app.save();
                if (this.game.session.completed === this.game.session.orders.length) this.next('packing');
            } });
            if (this.state.packingSession) this.game.session = this.state.packingSession;
            this.game.open();
            if (!this.observer) {
                this.observer = new MutationObserver(() => {
                    this.state.packingSession = this.game.session; this.app.save();
                });
                this.observer.observe(this.game.dialog, { childList: true, subtree: true });
            }
        }]]);
    }
    rumor() {
        this.say('소망이', '봉투에는 무슨 이야기가 적혀 있을까?');
        this.view.text('“코지페이가 다음 달 새로운 결제 서비스를 선보인대. 거래가 늘 거라는 이야기가 있지만, 아직 회사의 공식 발표는 없대.”');
        this.view.choices([['확인된 사실과 소문을 구분하기', () => this.next('rumor')]]);
    }
    certificate() {
        const index = this.state.answers.length;
        if (index >= ACCOUNT_QUIZ.length) {
            mountInvestmentCertificate(this.view.panel, {
                name: this.state.nickname, onReceive: () => this.next('certificate')
            });
            return;
        }
        mountInvestmentExam(this.view.panel, {
            name: this.state.nickname, question: ACCOUNT_QUIZ[index], index, total: ACCOUNT_QUIZ.length,
            onAnswer: choice => {
                this.state.answers.push(choice);
                if (!this.app.save()) { this.state.answers.pop(); return false; }
                return true;
            },
            onNext: () => { this.view.clear('투자 자격시험'); this.certificate(); }
        });
    }
    trade() {
        this.say('토리', '주식 앱에서 회사 소개와 현재 가격을 살펴보세요. 한 주를 고른 뒤 예상 결제액도 꼭 확인하세요. 가격이 오를 거라고 약속할 수는 없어요.');
        this.view.choices([['토리 주식앱 열기', () => {
            if (!this.view.openPhone()) return;
            this.view.phoneHome.openApp('stock');
            this.view.phoneHome.stockApp.tab = 'market';
            this.view.phoneHome.stockApp.renderTab();
        }]]);
    }
    pot() {
        this.say('봉봉', `씨앗을 심을 화분을 찾나요? 이 화분은 ${EXHIBITION.pot}잎이에요.`);
        this.view.choices([[`${EXHIBITION.pot}잎으로 화분 구매`, () => this.next('pot')]]);
    }
    planted() {
        this.say('소망이', '가져온 씨앗을 여기에 심어볼까? 조심조심…….');
        this.view.choices([['씨앗 심기', async () => {
            if (this.planting) return;
            this.planting = true;
            this.say('소망이', '흙을 살짝 덮어주면…… 됐다.');
            const pot = el('div', 'exhibition-planting');
            pot.setAttribute('role', 'img'); pot.setAttribute('aria-label', '씨앗이 흙 속으로 내려가는 화분');
            pot.append(el('span', 'exhibition-seed'), el('span', 'exhibition-soil'), el('span', 'exhibition-pot'));
            this.view.panel.append(pot);
            await new Promise(resolve => setTimeout(resolve, 1600));
            this.planting = false; this.next('planted');
        }]]);
    }
    diaryWritten() {
        this.say('소망이', '포포리에 왔다.\n내 이름을 정했다.\n처음으로 일을 하고, 주식도 샀다.\n가지고 온 씨앗을 화분에 심었다.\n그리고…… 꿀 쿠키가 맛있었다.');
        this.view.choices([['다이어리 덮기', () => this.next('diaryWritten')]]);
    }
    asleep() {
        this.say('소망이', '내일은 무슨 일이 있을까?');
        this.view.choices([['오늘은 쉬기', () => this.app.sleep()], ['조금 더 있다가', () => {
            this.say('소망이', '씨앗도 심었고, 오늘 이야기도 적었네. 조금만 더 바라보다 잘까?');
            this.view.choices([['다이어리 다시 읽기', () => { this.view.text('포포리에 왔다. 처음으로 일을 하고, 주식도 샀다. 그리고 꿀 쿠키가 맛있었다.'); }],
                ['이제 쉬기', () => this.app.sleep()]]);
        }]]);
    }
}


