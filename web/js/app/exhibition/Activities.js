import { PackingGame } from '../../components/packing/PackingGame.js';
import { INITIAL_STOCKS } from '../../data/stocksData.js';
import { EXHIBITION } from './State.js';
import { ACCOUNT_QUIZ } from './Quiz.js';
import { el, button } from './View.js';

export class ExhibitionActivities {
    constructor(controller) { this.app = controller; }
    get state() { return this.app.state; }
    get view() { return this.app.view; }
    next(id, data) { this.app.next(id, data); }
    run(beat) {
        const { id } = beat;
        this.view.clear(beat.title);
        if (this[id]) { this[id](); return; }
        const text = {
            walk: '모아를 따라 마을을 둘러봐요. 다음 장소로 함께 이동합니다.',
            phone: '모아가 건넨 휴대폰을 두 손으로 받아요.',
            bank: '이름을 확인하고 생활에 쓰는 잎을 보관할 계좌를 만들어요.',
            wage: `봉봉이 새싹 문양 돈주머니를 건네요. 오늘 일한 보수 ${EXHIBITION.wage.toLocaleString()}잎을 받아요.`,
            envelope: '봉봉이 이름 모를 손님이 맡긴 봉투를 따로 건네요.',
            sunset: '두 가지 일을 모두 마쳤어요. 포포리에 노을이 내려앉아요.',
            cookie: '꿀 쿠키를 한 입 먹고 잠깐 쉬어요. 달콤한 첫날의 맛을 기억해요.',
            grant: '이 지원금은 마을에서 주는 2,000잎이에요. 은행에서 빌린 돈과 달리 돌려주지 않아도 돼요.',
            diary: '아무것도 적히지 않은 다이어리를 받았어요. 앞으로 나의 하루를 채워갈 거예요.',
            planted: '화분에 흙을 담고, 가지고 온 씨앗을 조심스럽게 심어요.',
            tradeHistory: this.state.trades.map(t => `${t.name} · 매수 ${t.quantity}주 · ${t.price.toLocaleString()}잎`).join('\n')
        }[id];
        this.view.text(text || '준비가 되면 다음으로 넘어가요.');
        this.view.choices([['확인', () => this.next(id)]]);
    }
    nickname() {
        this.view.text('신청인 서명 · 앞으로 불리고 싶은 이름을 적어주세요.');
        const form = el('form', 'exhibition-form');
        const input = document.createElement('input');
        input.required = true; input.maxLength = 12; input.value = this.state.nickname;
        input.setAttribute('aria-label', '신청인 이름'); input.autocomplete = 'off';
        const submit = el('button', '', '신청서 제출'); submit.type = 'submit';
        form.append(input, submit); this.view.panel.append(form); input.focus();
        form.onsubmit = e => {
            e.preventDefault(); const name = input.value.trim();
            if (!name) { input.setCustomValidity('이름을 적어주세요.'); input.reportValidity(); return; }
            input.setCustomValidity(''); this.state.nickname = name; this.next('nickname');
        };
        input.oninput = () => input.setCustomValidity('');
    }
    openPhone() {
        this.view.text('연락처에는 모아가 처음으로 들어 있어요.');
        this.view.choices([['휴대폰 열기', () => {
            this.view.openPhone();
            const dialog = document.querySelector('.exhibition-phone-dialog');
            dialog.addEventListener('close', () => this.next('openPhone'), { once: true });
        }]]);
    }
    loan() {
        this.view.text('전시 체험용 정착 자금: 5,000잎을 빌려 생활을 시작해요. 선물이 아닌 대출 원금으로 기록돼요.');
        this.view.text('이자와 상환 일정은 아직 설계 중이며 이번 첫날 체험에서는 청구하지 않아요.');
        this.view.choices([['원금 5,000잎 확인하고 시작', () => this.next('loan')],
            ['설명을 다시 볼래', () => this.view.text('빌린 잎 5,000잎과 나중에 받는 정착 지원금은 서로 달라요. 준비되면 첫 번째 버튼을 눌러주세요.')]]);
    }
    order() {
        this.view.text('먼저 해볼 활동을 골라요. 다른 활동도 오늘 이어서 체험할 수 있어요.');
        this.view.choices([['주민 부탁 들어주기', () => this.chooseOrder('packing')],
            ['주식 투자 배우기', () => this.chooseOrder('stock')]]);
    }
    chooseOrder(order) { this.state.order = order; this.app.rebuild(); this.next('order'); }
    notice() {
        this.view.text('봉봉 잡화점 · 포장을 도와줄 분을 찾아요! 처음이어도 괜찮아요. 준비된 상품을 상자에 빈틈없이 담는 일이에요.');
        this.view.choices([['공고를 읽고 잡화점으로', () => this.next('notice')]]);
    }
    packing() {
        this.view.text('준비된 상품을 빈틈없이 담아요. 시간제한 없이 다섯 상자를 포장해요. 도중에 닫아도 이어서 할 수 있어요.');
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
        this.view.text('봉투 속 소문 · 체험용 원고');
        this.view.text('“코지페이가 다음 달 새로운 결제 서비스를 선보인대. 거래가 늘 거라는 이야기가 있지만, 아직 회사의 공식 발표는 없대.”');
        this.view.text('회사: 코지페이 / 사건: 새 서비스 소문 / 시간: 다음 달 / 확인할 점: 공식 발표 여부');
        this.view.choices([['확인된 사실과 소문을 구분하기', () => this.next('rumor')]]);
    }
    certificate() {
        const index = this.state.answers.length;
        if (index >= ACCOUNT_QUIZ.length) {
            this.view.text('세 문항을 모두 읽었어요. 결과와 관계없이 계좌와 투자 자격증이 발급돼요.');
            this.view.choices([['자격증 받기', () => this.next('certificate')]]); return;
        }
        const q = ACCOUNT_QUIZ[index];
        this.view.text(`정보 읽기 ${index + 1}/3 · ${q.passage}`); this.view.text(q.question);
        this.view.choices(q.choices.map((text, choice) => [text, () => {
            this.state.answers.push(choice); this.app.save();
            this.view.clear(choice === q.answer ? '잘 읽었어요' : '함께 살펴봐요', '토리');
            this.view.text(q.explanation); this.view.choices([['다음', () => { this.view.clear('투자 자격증'); this.certificate(); }]]);
        }]));
    }
    trade() {
        this.view.text('회사 소개와 현재 가격을 읽고 현물 1주를 골라요. 전시 체험에서는 표시한 가격으로 거래하며 가격 상승을 약속하지 않아요.');
        const stocks = INITIAL_STOCKS.filter(s => s.price > 0 && s.price <= Math.min(1500, this.state.cash)).slice(0, 6);
        for (const s of stocks) {
            const card = el('article', 'exhibition-stock');
            card.append(el('h2', '', s.name), el('p', '', s.desc), el('p', '', `현재가 ${s.price.toLocaleString()}잎 · 현물 1주`));
            card.append(button('회사 확인 · 매수 검토', () => {
                this.view.clear(`${s.name} 1주 매수 확인`, '토리');
                this.view.text(`사용할 잎 ${s.price.toLocaleString()}잎 / 매수 후 잔액 ${(this.state.cash - s.price).toLocaleString()}잎`);
                this.view.text('이번 전시용 첫 거래에는 수수료가 없어요. 회사의 주가가 오르거나 수익이 난다는 보장은 없어요.');
                this.view.choices([['1주 매수', () => this.next('trade', { id: s.id, name: s.name, price: s.price })],
                    ['다른 회사 살펴보기', () => { this.view.clear('토리 주식앱'); this.trade(); }]]);
            })); this.view.panel.append(card);
        }
    }
    pot() {
        this.view.text(`씨앗용 화분 · ${EXHIBITION.pot}잎. 씨앗을 심을 화분을 한 번 구매해요.`);
        this.view.choices([[`${EXHIBITION.pot}잎으로 화분 구매`, () => this.next('pot')]]);
    }
    planted() {
        this.view.text('가져온 씨앗을 화분의 흙 속에 조심스럽게 내려놓아요.');
        this.view.choices([['씨앗 심기', async () => {
            if (this.planting) return;
            this.planting = true;
            this.view.clear('씨앗을 심고 있어요', this.state.nickname);
            const pot = el('div', 'exhibition-planting');
            pot.setAttribute('role', 'img'); pot.setAttribute('aria-label', '씨앗이 흙 속으로 내려가는 화분');
            pot.append(el('span', 'exhibition-seed'), el('span', 'exhibition-soil'), el('span', 'exhibition-pot'));
            this.view.panel.append(pot);
            await new Promise(resolve => setTimeout(resolve, 1600));
            this.planting = false; this.next('planted');
        }]]);
    }
    diaryWritten() {
        this.view.text('포포리에 왔다.\n내 이름을 정했다.\n처음으로 일을 하고, 주식도 샀다.\n가지고 온 씨앗을 화분에 심었다.\n그리고…… 꿀 쿠키가 맛있었다.');
        this.view.choices([['다이어리 덮기', () => this.next('diaryWritten')]]);
    }
    asleep() {
        this.view.text('내일은 무슨 일이 있을까?');
        this.view.choices([['오늘은 쉬기', () => this.app.sleep()], ['조금 더 있다가', () => {
            this.view.clear('나의 첫날', this.state.nickname); this.view.text('씨앗을 심은 화분과 첫 기록을 다시 바라봐요.');
            this.view.choices([['다이어리 다시 읽기', () => { this.view.text('포포리에 왔다. 처음으로 일을 하고, 주식도 샀다. 그리고 꿀 쿠키가 맛있었다.'); }],
                ['이제 쉬기', () => this.app.sleep()]]);
        }]]);
    }
}
