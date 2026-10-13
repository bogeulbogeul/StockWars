export const CIPHER_TOUR_KEY = 'stockwars.cipher.guided-tour.v1';
const agentKPortraitUrl = new URL('../../../assets/characters/agent-k/agent-k-dialogue-smile-v1.png?portrait=hd1', import.meta.url).href;
export const cipherTourSteps = [
    { room: 'lobby', title: '사이퍼 증권에 오신 것을 환영합니다', text: '저는 에이전트 K입니다. 로비를 소개한 뒤 트레이닝룸과 모의투자 경쟁룸에 직접 들어가 화면의 기능을 하나씩 알려드리겠습니다. 마지막에는 저와 무료 모의투자 대결을 해보겠습니다.', page: 0 },
    { room: 'lobby', title: '전광판과 휴식 공간', text: '뒤쪽 전광판은 사이퍼 지수의 현재 값과 흐름을 보여줍니다. 소파에서는 앉아서 잠시 쉴 수 있습니다. 로비 이동은 이동 키나 바닥 클릭, 가까운 시설 이용은 상호작용 키로 합니다.', page: 1 },
    { room: 'lobby', title: '회원 전용 공간과 출구', text: '위층은 회원 전용 공간이며 현재 가입 절차는 준비 중입니다. 마을로 돌아갈 때는 앞쪽 카펫으로 이동하세요. 안내는 로비의 [이용 안내]에서 다시 볼 수 있습니다.', page: 4 },
    { room: 'lobby', title: '왼쪽 트레이닝룸으로 들어가겠습니다', text: '트레이닝룸은 큰 화면으로 거래하는 증권사 HTS입니다. 이곳의 매매는 스마트폰과 같은 게임 계좌에 반영됩니다. 다음을 누르면 내부에서 기능을 살펴보겠습니다.', page: 2 },
    { room: 'training', title: '트레이닝룸 · 실제 게임 계좌', text: '이곳의 현금과 주식은 스마트폰 계좌와 같습니다. 모의투자용 돈이 아닙니다. 지금은 화면 설명만 진행하고, 매수·매도 연습은 뒤의 별도 가상 계좌에서 하겠습니다.', target: '.training-summary' },
    { room: 'training', title: '종목 검색과 업종 분류', text: '왼쪽에서 기업 이름이나 종목 코드로 검색할 수 있습니다. 업종 분류를 바꾸면 해당 업종만 표시됩니다. 기업을 선택하면 가운데 정보와 오른쪽 주문 대상도 바뀝니다.', target: '.training-workspace > aside' },
    { room: 'training', title: '관심 종목과 보유 종목', text: '[관심 등록]은 자주 확인할 종목을 저장합니다. 왼쪽 목록 필터로 전체·관심·보유 종목을 나눠 볼 수 있습니다. 관심 등록만으로 주식을 매수하지는 않습니다.', target: '[data-watch]' },
    { room: 'training', title: '기업 정보와 관련 뉴스', text: '기업 정보에는 사업 소개와 투자 판단 지표, 관련 종목·업종 뉴스가 있습니다. 지표 설명과 기사 내용을 함께 읽으세요. 여기에 표시되는 설정 지표가 모두 실시간으로 재계산되는 것은 아닙니다.', target: '.training-workspace main details' },
    { room: 'training', title: '가격 차트와 정밀 분석', text: '선택한 종목의 가격 흐름을 확인하는 영역입니다. 차트를 클릭하면 더 큰 정밀 분석 화면을 열 수 있습니다. 과거의 상승이 이후의 수익을 보장하지는 않습니다.', target: '.training-chart' },
    { room: 'training', title: '매수 호가와 매도 호가', text: '호가는 다른 주문이 사고팔려는 가격과 수량입니다. 시장가 매수는 매도 호가부터, 매도는 매수 호가부터 체결을 시도합니다. 현재가와 실제 체결 가격이 다르거나 일부 수량만 체결될 수 있습니다.', target: '.training-book' },
    { room: 'training', title: '주문 수량과 예상 금액', text: '오른쪽에서 수량을 입력하고 예상 체결 수량·평균가·수수료를 확인합니다. 25%·50%·최대 버튼은 살 수 있는 수량을 계산하는 도구입니다. 최대 수량을 선택하기 전에 생활비도 남겨두세요.', target: '.training-order' },
    { room: 'training', title: '매수·매도와 증권사 수수료', text: '매수는 현금을 주식으로, 매도는 보유 주식을 현금으로 바꿉니다. 증권사 거래에는 증권사 수수료가 적용되므로 주문 예상 금액을 확인하세요. 설명 중에는 주문을 실행하지 않습니다.', target: '.training-actions' },
    { room: 'training', title: '공매도와 레버리지', text: '거래 방식에서 공매도, 레버리지에서 배율을 선택할 수 있습니다. 공매도와 2·3·5배는 레벨 10에서 해금됩니다. 배율이 높아지면 손익 변동도 커지므로 잠긴 기능은 나중에 익혀도 됩니다.', target: '[aria-label="레버리지"]' },
    { room: 'training', title: '내 계좌와 보유 종목', text: '내 계좌를 열었습니다. 총자산은 현금과 보유 평가액을 함께 본 값이며, 평가손익은 아직 팔지 않은 주식의 현재 손익입니다. 오른쪽 보유 목록과 함께 거래 후 결과를 확인하세요.', target: '.training-account', account: true },
    { room: 'lobby', title: '이번에는 오른쪽 모의투자 경쟁룸입니다', text: '트레이닝룸의 게임 계좌와 달리, 여기서는 대결 전용 가상 계좌를 씁니다. 내부로 들어가 방을 찾는 방법과 대결 설정을 하나씩 살펴보겠습니다.', page: 3 },
    { room: 'competition', title: '모의투자 경쟁룸 · 대결 규칙', text: '참가자는 같은 시작 자금과 시장 조건으로 거래합니다. 제한 시간이 끝났을 때 총자산으로 순위를 정합니다. 모의투자 자금과 결과는 평소 게임 계좌에 반영되지 않습니다.', target: 'header' },
    { room: 'competition', title: '방 검색과 공개방', text: '방 이름·방장 이름·방 코드로 방을 찾거나 공개방 목록에서 선택할 수 있습니다. 비밀번호방은 비밀번호가 필요합니다. 서버에 연결되지 않았다면 온라인 목록 대신 연결 상태를 확인하세요.', target: '.arena-public-sidebar' },
    { room: 'competition', title: '내 방과 방 만들기', text: '직접 방을 만들려면 이름을 정하고 대결 방식을 선택합니다. AI 연습과 온라인 대결을 구분하세요. 지금 안내에서는 방을 만들지 않고, 마지막에 제가 준비한 무료 연습으로 이동합니다.', target: '[data-create]' },
    { room: 'competition', title: '대결 시간과 시작 자금', text: '방 설정에서 대결 시간은 3분·5분·10분 중에서, 시작 자금은 1만 G·10만 G·100만 G 중에서 고를 수 있습니다. 시작 자금은 참가자가 동일하게 받는 대결 전용 자금입니다.', target: '[name=cash]' },
    { room: 'competition', title: '무료 대결과 가상 배팅', text: '배팅 0G는 무료 대결입니다. 유료 설정은 시작 자금의 1~10% 범위에서 100G 단위로 입력합니다. 이는 대결 전용 가상 배팅이며, 지금 K와의 연습은 0G로 진행합니다.', target: '[name=stake]' },
    { room: 'competition', title: '공개 설정과 친구', text: '공개방 또는 비밀번호방을 선택할 수 있습니다. 친구 요청은 상대가 수락해야 연결되며, 온라인 방에서는 친구와 참가·준비 상태를 확인합니다. 실제 대결 시작 전 참가자와 조건을 확인하세요.', target: '.training-workspace > aside:last-child' },
    { room: 'competition', title: '이제 가상 계좌에서 연습하겠습니다', text: '다음에는 실제 모의투자 화면에서 종목·차트·주문·계좌·뉴스를 확인하고 직접 사고팔아 보겠습니다. 연습이 끝나면 [K와 무료 대결 시작]을 눌러 10만 G로 3분 대결을 시작하세요.', target: 'header', action: 'K와 매수·매도 연습하기' }
];

export class CipherTour {
    constructor(lobby) { this.lobby = lobby; this.index = 0; this.active = false; }
    start() { this.stop(); this.active = true; this.index = 0; this.show(); }
    move(delta) {
        if (!this.active) return;
        if (this.index + delta >= cipherTourSteps.length) {
            this.stop(false);
            try { localStorage.setItem(CIPHER_TOUR_KEY, '1'); } catch {}
            this.lobby.competitionRoom.startTutorial();
            return;
        }
        this.index = Math.max(0, this.index + delta); this.show();
    }
    clearPanel() {
        this.target?.classList.remove('cipher-tour-target');
        this.panel?.remove();
        if (this.host) {
            this.host.removeEventListener('click', this.block, true);
            this.host.removeEventListener('keydown', this.key, true);
            this.host.removeEventListener('cancel', this.cancel, true);
        }
    }
    show() {
        this.clearPanel();
        const step = cipherTourSteps[this.index], lobby = this.lobby;
        const training = lobby.trainingRoom, competition = lobby.competitionRoom;
        if (step.room !== 'training' && training.dialog.open) training.close();
        if (step.room !== 'competition' && competition.dialog.open) competition.close();
        if (step.room === 'training' && !training.dialog.open) training.open();
        if (step.room === 'competition' && !competition.dialog.open) competition.open({ skipTutorial: true });
        lobby.player.stop(); lobby.notice.hidden = true; lobby.dialoguePage = step.page ?? null;
        if (step.room !== 'lobby') cancelAnimationFrame(lobby.frame);
        if (step.account) { training.accountVisible = true; training.renderAccount(); }
        this.host = step.room === 'lobby' ? lobby.dialog : step.room === 'training' ? training.dialog : competition.dialog;
        if (!document.getElementById('cipher-tour-style')) {
            const style = document.createElement('style'); style.id = 'cipher-tour-style';
            style.textContent = '.cipher-tour{position:sticky;top:0;z-index:30;flex-shrink:0;padding:18px;background:#0c2033fa;border:2px solid #dcae39;border-radius:14px;color:#edf5fa;box-shadow:0 8px 28px #0007}.cipher-tour h3{margin:8px 0;color:#ffd575}.cipher-tour p{line-height:1.7;margin:10px 0}.cipher-tour nav{display:flex;gap:10px;flex-wrap:wrap}.cipher-tour button{padding:9px 14px;border:1px solid #987b3f;border-radius:7px;background:#253749;color:#fff;font:inherit;cursor:pointer}.cipher-tour button:disabled{opacity:.4}.cipher-tour-target{outline:3px solid #48decf!important;outline-offset:4px;scroll-margin-top:290px}.cipher-tour[data-room=lobby]{position:absolute;bottom:20px;top:auto;left:20px;right:20px;max-height:65%;overflow:auto}.cipher-tour small{color:#e4bc68;letter-spacing:0}';
            style.textContent += `
                .cipher-tour{display:flex;align-items:center;gap:20px}
                .cipher-tour-portrait{display:block;width:128px;height:156px;flex:0 0 128px;object-fit:cover;border:1px solid #a7894e;border-radius:12px;background:#102333;image-rendering:auto!important}
                .cipher-tour-content{flex:1;min-width:0}
                .cipher-tour-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid #365064}
                .cipher-tour-top nav{margin-left:auto}
                @media(max-width:640px){.cipher-tour{gap:12px;padding:12px;align-items:flex-start}.cipher-tour-portrait{width:80px;height:98px;flex-basis:80px}}
            `;
            document.head.append(style);
        }
        const panel = document.createElement('section'); this.panel = panel;
        panel.className = 'cipher-tour'; panel.dataset.room = step.room;
        panel.setAttribute('aria-label', '에이전트 K 증권사 안내');
        const speaker = document.createElement('small'); speaker.textContent = `에이전트 K · 증권사 이용 안내 ${this.index + 1}/${cipherTourSteps.length}`;
        const title = document.createElement('h3'); title.textContent = step.title;
        const text = document.createElement('p'); text.textContent = step.text;
        const nav = document.createElement('nav');
        for (const [label, action, disabled] of [['안내 그만 보기', () => this.stop(), false], ['◀ 이전', () => this.move(-1), this.index === 0], [step.action || '다음 ▶', () => this.move(1), false]]) {
            const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.disabled = disabled; button.onclick = action; nav.append(button);
        }
        const portrait = document.createElement('img');
        portrait.className = 'cipher-tour-portrait';
        portrait.src = agentKPortraitUrl;
        portrait.alt = '에이전트 K';
        portrait.decoding = 'sync';
        portrait.draggable = false;
        const content = document.createElement('div');
        content.className = 'cipher-tour-content';
        const top = document.createElement('div');
        top.className = 'cipher-tour-top';
        top.append(speaker, nav);
        content.append(top, title, text);
        panel.append(portrait, content);
        panel.addEventListener('click', event => {
            if (event.target.closest('button, a, input, select, textarea')) return;
            // Starting practice remains an explicit action; ordinary dialogue advances on click.
            if (!step.action) this.move(1);
        });
        this.host.prepend(panel);
        this.target = step.target ? this.host.querySelector(step.target) : null;
        this.target?.classList.add('cipher-tour-target');
        this.target?.scrollIntoView({ block: 'nearest' });
        nav.lastElementChild.focus({ preventScroll: true });
        this.block = event => { if (!panel.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); } };
        this.key = event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.stop(); }
            else if (event.key === 'Enter' && !event.repeat && !panel.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); this.move(1); }
            else if (!panel.contains(event.target) && event.key !== 'Tab') { event.preventDefault(); event.stopImmediatePropagation(); }
            else event.stopPropagation();
        };
        this.cancel = event => { event.preventDefault(); event.stopImmediatePropagation(); this.stop(); };
        this.host.addEventListener('click', this.block, true);
        this.host.addEventListener('keydown', this.key, true);
        this.host.addEventListener('cancel', this.cancel, true);
    }
    stop(closeRooms = true) {
        this.active = false; this.clearPanel();
        this.lobby.dialoguePage = null;
        if (closeRooms) {
            if (this.lobby.trainingRoom.dialog.open) this.lobby.trainingRoom.close();
            if (this.lobby.competitionRoom.dialog.open) this.lobby.competitionRoom.close();
        }
        this.lobby.canvas.focus();
    }
}
