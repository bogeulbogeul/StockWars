import { money } from './StockFormat.js';

// Adapted from the previous ownership/price/chart/order/account tutorial.
export function stockLessonPages(context, state = {}) {
    const budget = state.firstTrade?.budget ?? 0;
    const pages = {
        home: [
            ['홈', '먼저 화면의 기능을 하나씩 살펴볼게요. 바로 주문하지 않고 회사 정보부터 읽어 보겠습니다.', '.stock-summary'],
            ['총자산', '총자산은 보유 현금과 주식 평가금액을 합친 값이에요. 주가가 바뀌면 평가금액도 달라져요.', '.stock-summary'],
            ['현금과 손익', '보유 현금은 지금 쓸 수 있는 돈이에요. 평가 손익은 아직 팔지 않은 주식의 현재 가격을 기준으로 계산해요.', '.stock-summary dl'],
            ['최근 종목', '최근 조회한 종목을 누르면 그 회사의 상세 화면으로 돌아갈 수 있어요.', '.stock-row'],
            ['기능 이동', '주식 거래는 회사 찾기, 내 계좌는 보유 주식, 거래 내역은 실제 체결 기록을 확인하는 곳이에요.', '.stock-nav'],
            ['회사 찾기', '주식 거래로 이동해 예산 안의 회사를 골라 보세요. 먼저 기업 정보를 함께 읽을 거예요.', '[data-tab="market"]']
        ],
        market: [
            ['주식의 뜻', '주식 1주는 회사의 작은 지분이에요. 회사를 골랐다고 바로 사지는 않아요. 어떤 회사인지부터 알아볼게요.', '.stock-recommendations'],
            ['두 시장 지수', '리프 종합지수는 전체 시장, 새싹 성장지수는 정해진 성장 기업 묶음의 움직임을 보여 줘요. 개별 회사 가격과 구분해 보세요.', '.stock-indices'],
            ['검색', '회사 이름이나 영문 ID를 입력하면 원하는 종목을 찾을 수 있어요. 검색어를 지우면 목록을 다시 볼 수 있어요.', '.stock-search'],
            ['섹터 필터', 'IT·엔터·인프라처럼 같은 사업 분야만 모아 볼 수 있어요. 버튼과 회사 아이콘은 같은 섹터 색을 사용해요.', '.stock-filters'],
            ['관심 종목', '별을 누르면 관심 종목에 담겨요. 위의 관심 필터로 모아 볼 수 있고, 별을 눌러도 주식을 사는 것은 아니에요.', '.stock-star'],
            ['목록 정렬', '인기순·변동률순·높은 가격순·종목명순으로 목록을 정리할 수 있어요. 인기나 큰 변동률이 좋은 투자를 뜻하지는 않아요.', '.stock-sort'],
            ['가격과 등락', '회사 옆 숫자는 1주 가격이에요. 빨강과 +는 상승, 파랑과 −는 하락이에요. 색만 보지 말고 숫자도 함께 읽어 보세요.', '.stock-right'],
            ['첫 매수 예산', `이번 연습 예산은 ${money(budget)}이에요. 최대 1,500잎과 보유 현금 중 작은 금액을 쓰고, 현물 1주만 연습해요.`, '.stock-recommendations'],
            ['연습용 회사 추천', '추천 카드는 실제 주문이 가능한 예산 내 후보예요. 1주 가격과 매수 후 남을 현금을 비교하세요. 수익률이나 안전성을 보장하는 추천은 아니에요.', '.stock-recommendations'],
            ['기업 정보부터', '추천 카드에서 궁금한 회사를 하나 눌러 주세요. 기업 정보 화면에서 사업 내용과 지표를 차근차근 살펴볼게요.', '.stock-recommendations']
        ],
        info: [
            ['어떤 회사일까요?', '첫 번째는 기업 개요예요. 이 회사가 무엇을 만들거나 어떤 서비스를 제공하는지 읽어 보세요.', '.stock-detail-content > h3:first-of-type'],
            ['회사 이름과 가격', '위에는 회사 이름·ID·현재 1주 가격이 표시돼요. 비슷한 이름의 다른 회사와 혼동하지 않도록 확인하세요.', '.stock-detail-header'],
            ['PER', 'PER은 이익에 비해 주가가 어느 정도인지 보는 지표예요. 낮다는 이유만으로 좋은 회사라고 판단할 수는 없어요.', '.stock-info-grid > div:nth-child(1)'],
            ['PBR', 'PBR은 회사의 순자산에 비해 주가가 어느 정도인지 보는 지표예요. 회사가 속한 업종과 함께 살펴보세요.', '.stock-info-grid > div:nth-child(2)'],
            ['ROE', 'ROE는 자기자본으로 어느 정도 이익을 냈는지 보는 비율이에요. 한 가지 지표만 보지 말고 사업 내용과 함께 비교하세요.', '.stock-info-grid > div:nth-child(3)'],
            ['배당률', '주간 배당률은 게임 기업의 배당 설정을 보여 줘요. 표시된 비율이 주가 상승이나 총수익을 보장하지는 않아요.', '.stock-info-grid > div:nth-child(4)'],
            ['시가총액', '시가총액은 회사 전체의 시장 가치를 살펴보는 지표예요. 주식 1주 가격과 회사 전체 크기는 서로 달라요.', '.stock-info-grid > div:nth-child(5)'],
            ['52주 범위', '52주 최고·최저는 표시된 기간의 가격 범위예요. 낮은 가격이라고 앞으로 반드시 오르는 것은 아니에요.', '.stock-info-grid > div:nth-child(6)'],
            ['위험도와 변동성', '위험도 등급과 변동성 티어도 함께 확인하세요. 이 기업 지표는 게임 설정값이며 확정 수익을 알려 주는 숫자가 아니에요.', '.stock-info-grid > div:nth-child(7)'],
            ['관련 소식', '관련 공시·뉴스는 별도 소식 앱에서 기사 본문을 읽을 수 있어요. 좋은 소식도 이미 가격에 반영됐을 수 있으니 제목만 보고 판단하지 마세요.', '[data-related]'],
            ['차트로 이동', '회사 정보를 읽었으면 다음으로 가격의 움직임을 살펴볼게요. 아래 버튼을 누르면 차트 안내로 이어집니다.', '.stock-subtabs']
        ],
        chart: [
            ['차트 읽기', '차트는 가격이 시간에 따라 움직인 기록이에요. 위쪽이 높은 가격, 아래쪽이 낮은 가격이고 가로 방향은 시간이에요.', '.stock-chart'],
            ['조회 기간', '50개 기록·1일·1주·1달·1년 버튼으로 보는 기간을 바꿀 수 있어요. 기간이 달라지면 같은 회사도 다른 모습으로 보일 수 있어요.', '.stock-chart-controls'],
            ['시각과 가격', '그래프를 가리키거나 터치하면 해당 기록의 시각과 가격을 볼 수 있어요. 차트 확대는 더 넓게 살펴보는 기능이에요.', '.stock-chart'],
            ['최고·최저·평균', '차트 아래 숫자는 선택한 기간의 최고·최저·평균이에요. 과거 기록만으로 미래의 상승이나 하락을 확신할 수는 없어요.', '.stock-chart-panel'],
            ['호가', '일반 거래에서는 사고팔려는 가격과 잔량이 호가에 표시돼요. 이번 전시 첫 매수는 고정 가격 체험이라 실시간 호가 거래를 사용하지 않아요.', '.stock-book-panel'],
            ['주문 전 순서', '기업 정보를 먼저 읽고 차트를 확인한 뒤 주문 조건을 살펴봐요. 아래 버튼을 누르면 아직 읽지 않은 기업 정보 또는 주문 안내로 이어집니다.', '.stock-subtabs']
        ],
        order: [
            ['매수와 매도', '매수는 현금으로 주식을 사는 것, 매도는 가진 주식을 파는 것이에요. 이번에는 예산 안에서 현물 1주 매수만 연습해요.', '.stock-execute'],
            ['현물', '현물은 내 현금으로 주식을 사서 보유하는 방식이에요. 첫 수업에서는 현물을 사용해요.', '[data-mode="long"]'],
            ['공매도·레버리지', '공매도는 하락 방향의 거래, 레버리지는 손익의 폭을 키우는 방식이에요. 일반 거래에서 레벨 10 이후 열리며 첫 수업에서는 사용하지 않아요.', '[data-leverage="2"]'],
            ['시장가', '일반 시장가는 지금 거래 가능한 호가로 체결을 시도해요. 현재 표시 가격과 평균 체결가가 다를 수 있어요. 이번 연습은 고정 가격으로 진행해요.', '[data-type]'],
            ['지정가', '지정가는 원하는 가격을 정하는 주문이에요. 매수는 지정 가격 이하, 매도는 이상에서 체결될 수 있고 조건이 맞지 않으면 기다려요. 첫 수업은 시장가로 고정돼요.', '[data-price]'],
            ['수량', '일반 거래에서는 −·+와 직접 입력, 1주·5주·10주로 수량을 정해요. 첫 매수는 실수를 줄이도록 1주로 고정돼요.', '[data-qty]'],
            ['MAX와 잔액', '매수 MAX는 살 수 있는 최대 수량, 매도 MAX는 보유 수량을 넣는 기능이에요. 이번에는 잠겨 있어요. 주문 가능 현금과 보유 수량도 확인하세요.', '[data-account]'],
            ['결제액과 수수료', '예상 결제액과 수수료를 확인하고 계산 상세를 펼쳐 보세요. 이번 첫 매수는 수수료가 없고, 일반 거래에는 수수료가 적용돼요.', '.stock-estimate'],
            ['남겨 둘 현금', `첫 매수 예산은 ${money(budget)}이에요. 위에서 선택한 회사·1주 가격과 남길 현금을 다시 확인하세요. 다른 생활비까지 한 번에 투자하지 않아도 돼요.`, '.stock-estimate'],
            ['미체결 주문', '일반 지정가 주문은 조건이 맞지 않으면 미체결 목록에 남아요. 취소 버튼으로 취소할 수 있어요. 체결된 결과는 거래 내역 탭에서 확인해요.', '[data-pending]'],
            ['최종 확인', '기업 정보와 차트 안내를 마쳤다면 아래 확인 완료를 눌러 주세요. 그다음 매수를 누르면 별도 확인창 없이 바로 체결돼요.', '.stock-execute']
        ],
        account: [
            ['보유 주식', '내 계좌는 지금 보유한 주식을 보여 줘요. 카드의 현물·배율·수량을 함께 확인하세요.', '.stock-holding'],
            ['평균 매입가', '평균 매입가는 보유 주식을 사는 데 사용한 평균 가격이에요. 평가금액은 현재 가격으로 보유 주식의 가치를 나타내요.', '.stock-holding dl'],
            ['평가와 실현 손익', '아직 가진 주식의 손익은 평가 손익, 실제로 팔고 남은 결과는 실현 손익이에요. 두 숫자는 다를 수 있어요.', '.stock-holding dl'],
            ['섹터별 비중', '도넛 그래프와 범례는 보유 주식 평가금액의 섹터별 비중이에요. 종목 아이콘과 같은 섹터는 같은 색이에요.', '.stock-allocation'],
            ['보유 개수', '보유 종목 개수 제한은 없어요. 다만 여러 종목을 샀더라도 같은 업종에 몰렸는지와 남은 현금을 함께 살펴보세요.', '.stock-allocation'],
            ['기록 확인', '거래 내역은 별도 탭이에요. 회사별 체결 기록을 확인할 수 있고, 첫 매수는 주식 거래로 돌아가 이어갈 수 있어요.', '[data-tab="history"]']
        ],
        history: [
            ['체결 기록', '체결된 거래는 최신순으로 표시돼요. 아직 체결되지 않은 주문은 주문하기의 미체결 목록에서 확인해요.', '.stock-history'],
            ['거래 읽기', '매수·매도 구분과 회사 이름, 몇 주를 얼마에 거래했는지 확인하세요.', '.stock-history article'],
            ['실제 현금과 수수료', '수수료와 실제로 줄거나 늘어난 현금도 표시돼요. 매도 기록에는 실현 손익이 표시될 수 있어요.', '.stock-history article'],
            ['시각과 체결 가격', '거래 시각·장소와 가격별 체결을 읽어 보세요. 첫 매수 기록은 체험을 마친 뒤 이 탭에서 확인할 수 있어요.', '.stock-history']
        ]
    };
    return pages[context] || pages.market;
}

export class StockLessonDock {
    constructor(host, { navigate, ready } = {}) {
        Object.assign(this, { host, navigate, ready }); this.positions = new Map(); this.completed = new Set();
        this.node = document.createElement('aside'); this.node.className = 'stock-lesson-dock'; this.node.hidden = true;
        this.node.setAttribute('aria-label', '토리의 첫 주식 안내');
        this.node.innerHTML = '<div><strong>토리</strong><small>첫 주식 수업</small></div><div class="stock-lesson-copy"><small data-lesson-title></small><p aria-live="polite"></p></div><div class="stock-lesson-actions"><button type="button" data-lesson-prev>‹ 이전</button><button type="button" data-lesson-next>다음 ›</button></div>';
        host.append(this.node);
    }
    selectStock() {
        for (const key of ['info', 'chart', 'order']) { this.positions.delete(key); this.completed.delete(key); }
        this.ready?.(false);
    }
    update(active, context, state = this.state) {
        this.state = state; this.context = context;
        this.node.hidden = !active; this.host.classList.toggle('stock-app--lesson', !!active);
        this.host.querySelectorAll('.stock-lesson-target').forEach(el => el.classList.remove('stock-lesson-target'));
        if (!active) return;
        const lines = stockLessonPages(context, state), index = Math.min(this.positions.get(context) || 0, lines.length - 1);
        const [title, text, selector] = lines[index];
        this.node.querySelector('[data-lesson-title]').textContent = `${title} · ${index + 1} / ${lines.length}`;
        this.node.querySelector('p').textContent = context === 'order' && index === lines.length - 1 && this.completed.has('order') ? '회사와 가격을 확인했어요. 매수를 누르면 현물 1주가 바로 체결돼요.' : text;
        this.node.querySelector('[data-lesson-prev]').disabled = index === 0;
        const next = this.node.querySelector('[data-lesson-next]'), last = index === lines.length - 1;
        next.hidden = last && (!['info','chart','order'].includes(context) || this.completed.has(context));
        next.textContent = !last ? '다음 ›' : context === 'info' ? '차트 살펴보기 ›' : context === 'chart' ? '주문 알아보기 ›' : '확인 완료';
        if (selector) this.host.querySelectorAll(selector).forEach(el => el.classList.add('stock-lesson-target'));
    }
    next() {
        const lines = stockLessonPages(this.context, this.state), index = this.positions.get(this.context) || 0;
        if (index < lines.length - 1) this.positions.set(this.context, index + 1);
        else {
            if (this.context === 'order' && !this.completed.has('info')) return this.navigate?.('info');
            if (this.context === 'order' && !this.completed.has('chart')) return this.navigate?.('chart');
            this.completed.add(this.context);
            if (this.context === 'info') return this.navigate?.('chart');
            if (this.context === 'chart') return this.navigate?.(this.completed.has('info') ? 'order' : 'info');
            if (this.context === 'order') {
                this.ready?.(true);
            }
        }
        this.update(true, this.context);
    }
    previous() { this.positions.set(this.context, Math.max(0, (this.positions.get(this.context) || 0) - 1)); this.update(true, this.context); }
    destroy() { this.host.querySelectorAll('.stock-lesson-target').forEach(el => el.classList.remove('stock-lesson-target')); this.node.remove(); this.host.classList.remove('stock-app--lesson'); }
}
