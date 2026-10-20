// One presentation for lessons, practice instructions and social onboarding.
export function describeTutorialStep(step) {
    const examples = {
        open_order_screen: ['위쪽 [주문하기] 탭을 누르세요.'],
        welcome_1: ['[다음 ▶]으로 계속 읽어요.', '[◀ 이전]으로 지난 설명을 다시 봐요.'],
        welcome_2: ['현금 5,000G가 지급됐어요. G는 게임 화폐예요.'],
        open_phone: ['화면 오른쪽 아래의 📱 버튼을 찾으세요.'],
        launch_stock_app: ['스마트폰 홈에서 주식 앱 [사이퍼M]을 찾으세요.'],
        market_tab: ['스마트폰 아래쪽에서 [주식 거래]를 찾으세요.'],
        select_stock: ['종목 목록 맨 위의 [모아 추천] 표시를 확인하세요.'],
        chart_colors: ['400G → 450G: 가격이 올라 청록색 +로 표시돼요.', '400G → 350G: 가격이 내려 빨간색 −로 표시돼요.'],
        chart_detail: ['빛나는 그래프를 누르면 안내가 이어져요.'],
        limit_order_guide: ['400G에 매수 주문 → 400G 이하에서만 사요.', '400G에 매도 주문 → 400G 이상에서만 팔아요.'],
        stock_basics_profit: ['매수: 현금을 내고 주식을 받아요.', '매도: 주식을 팔고 현금을 받아요.'],
        stock_profit_example: ['400G에 산 1주를 450G에 팔면 50G 이익이에요.', '400G에 산 1주를 350G에 팔면 50G 손해예요.'],
        stock_profit_fees: ['1주당 50G 이익 × 2주 = 100G', '100G − 수수료 4G = 실제 이익 96G'],
        buy_stock: ['첫 주문은 [시장가], 수량은 [1주]로 연습해요.'],
        celebrate: ['방금 산 주식은 [내 계좌]에 보관돼요.', '체결 금액과 수수료만큼 현금이 줄어요.'],
        first_profit_choice: ['지금 팔면 체결된 가격으로 손익이 확정돼요.', '계속 보유하면 가격이 더 오르거나 떨어질 수 있어요.'],
        first_sell_guide: ['팔 수량과 예상 수령 금액을 먼저 확인하세요.', '[매도 (SELL)]를 직접 누르면 주문을 내요.'],
        portfolio_guide: ['[내 계좌]에 방금 산 주식과 남은 현금이 표시돼요.'],
        social_and_ranking_guide: ['400G에 산 주식이 지금 450G라면 평가 이익은 50G예요.', '450G에 실제로 팔면 거래 비용을 뺀 실현 손익이 기록돼요.'],
        portfolio_slots_growth: ['운용력 0: 서로 다른 종목 5개를 보유할 수 있어요.', '운용력 1: 서로 다른 종목 10개를 보유할 수 있어요.'],
        portfolio_slots_capacity: ['A기업 10주 중 5주만 팔면 슬롯은 계속 써요.', '남은 5주까지 모두 팔면 슬롯 1칸이 비어요.'],
        portfolio_slots_trait: ['운용력 1의 기본 10칸 + 자산가 보너스 2칸 = 12칸', '빈 슬롯이 있어도 주식을 살 현금은 필요해요.'],
        trade_history_guide: ['[거래 내역]에 방금 산 종목·수량·체결 가격이 남아요.'],
        trade_history_fees: ['주식 가격뿐 아니라 수수료도 현금에서 나가요.', '[가격별 체결]에서 각각 얼마에 샀는지 확인할 수 있어요.'],
        news_tab_guide: ['스마트폰 아래쪽에서 [공시 뉴스]를 찾으세요.'],
        news_reading_guide: ['뉴스 카드를 누르면 본문이 열려요.', '본문 오른쪽 위 [✕]를 누르면 목록으로 돌아와요.'],
        go_town_proposal: ['문 앞까지 W·A·S·D로 이동해요.', '문을 클릭하거나 문 앞에서 F를 눌러 밖으로 나가요.'],
        rumor_inventory_guide: ['상단 [소지품]에서 받은 찌라시를 찾을 수 있어요.'],
        rumor_intel_explain: ['찌라시 선택 → [확인하기] → 내용 읽기 → 찌라시 창 닫기'],
        rumor_time_prediction: ['“이틀 뒤”가 언제 발표될지 알려주는 단서예요.', '아래에서 예상 시점을 하나 골라보세요.'],
        rumor_time_feedback: ['“이틀 뒤” → 발표 일정의 단서', '주가는 발표 전이나 후에 반응할 수도 있어요.'],
        stamina_recovery_guide: ['아래 버튼으로 모아의 에너지 드링크 1개를 받아 바로 마셔요.', '체력이 가득 차도 마실 수 있어요. 최대 체력은 넘지 않아요.'],
        stock_basics_budget: ['7일 차에 월세 5,000G를 내야 해요.', '주식에 쓸 돈과 월세로 남겨둘 돈을 나누세요.'],
        stock_basics_diversification: ['A기업에 전부 투자하면 A기업 하락의 영향을 크게 받아요.', 'A·B기업에 나눠 투자해도 둘 다 떨어지면 손해예요.'],
        tutorial_completed: ['완료 버튼을 누르면 정착 지원금 2,000G를 받아요.', '이제 거래를 배우며 월세를 준비하세요.']
    };
    const action = {
        rumor_intel_explain: '찌라시를 직접 읽고 창을 닫아 주세요.',
        open_order_screen: '[주문하기] 탭을 누르세요.',
        open_phone: '📱 스마트폰 버튼을 누르세요.', launch_stock_app: '[사이퍼M]을 누르세요.',
        market_tab: '[주식 거래]를 누르세요.', select_stock: '[모아 추천] 종목을 누르세요.',
        buy_stock: '[시장가 · 1주]를 확인하고 [매수 (BUY)]를 누르세요.',
        portfolio_guide: '[내 계좌]를 누르세요.',
        news_tab_guide: '[공시 뉴스]를 누르세요.', go_town_proposal: '오피스 문을 클릭하거나 문 앞에서 F를 누르세요.',
        rumor_time_prediction: '아래에서 예상 시점을 선택하세요.',
        first_profit_choice: '[매도해 보기] 또는 [계속 보유]를 선택하세요.',
        first_sell_guide: '직접 [매도 (SELL)]를 누르거나 계속 보유를 선택하세요.'
    };
    const result = { ...step, lessonTitle: step.lessonTitle || step.tracker?.split('•').at(-1)?.trim(),
        nextAction: step.nextAction || action[step.id] || (step.actionBtnText ? `[${step.actionBtnText}]를 누르세요.` : '[다음 ▶]으로 다음 내용을 확인하세요.') };
    const explanations = {
        open_phone: '오른쪽 아래 빛나는 스마트폰을 눌러 주세요.', launch_stock_app: '빛나는 사이퍼M 앱을 눌러 주세요. 종목과 가격을 확인할 수 있어요.',
        market_tab: '이제 아래쪽의 빛나는 [주식 거래] 탭을 눌러 주세요.', buy_stock: '현금으로 주식 1주를 사볼게요.',
        portfolio_guide: '아래쪽 [내 계좌]를 눌러 보유 주식을 확인하세요.',
        news_tab_guide: '아래쪽 [공시 뉴스]를 눌러 기업 소식을 확인해 보세요.', rumor_inventory_guide: '받은 찌라시는 소지품에 보관돼요.',
    };
    if (explanations[step.id]) result.text = explanations[step.id];
    if (examples[step.id]) result.example = { label: step.requiresManualAction ? '화면에서 확인하기' : '예시로 이해하기', rows: examples[step.id] };
    if (step.id?.startsWith('rumor_analysis_example_')) {
        const level = Number(step.id.slice(-1));
        result.nextAction = level < 5
            ? `[다음 ▶]으로 분석력 ${level + 1}단계에서 어떤 정보가 더 보이는지 확인하세요.`
            : '[◀ 이전]으로 낮은 분석력 단계와 비교하거나, [다음 ▶]으로 해석 요령을 정리하세요.';
        result.example = { label: `분석력 ${level}단계에서 알아낼 수 있는 정보`, rows: [
            ['비유에서 기업과 사건을 추측해요.', '어느 업종인지와 상승 방향을 읽을 수 있어요.', '독점 계약 사건과 이틀 뒤 발표를 읽을 수 있어요.', '기업이 에코 배터리임을 읽을 수 있어요.', '계약 금액 5조 원까지 읽을 수 있어요.'][level - 1],
            '자세히 읽힌다고 소문이 사실로 확정되는 것은 아니에요.'
        ] };
    }
    if (step.practice === 'pickup') {
        result.example = { label: '직접 연습하기', rows: ['[D]로 오른쪽 상자까지 가 봐.', `W를 ${step.count}번 눌러 상자 ${step.count}개를 실어 봐.`] };
        result.nextAction = `상자 ${step.count}개를 실으면 다음으로 넘어간다.`;
    } else if (step.practice === 'deliver') {
        result.example = { label: '직접 연습하기', rows: step.count >= 3 ? ['[A]로 왼쪽 트럭까지 걸어. Shift는 누르지 마.', '파손 게이지가 70%쯤 되면 이동 키를 놓아.', '30% 아래로 내려가면 다시 출발해.'] : ['Shift는 누르지 말고, [A]로 왼쪽 트럭까지 걸어 봐.', '트럭에 닿으면 상자는 알아서 내려진다.'] };
        result.nextAction = '트럭에 상자를 내려놓으면 다음으로 넘어간다.';
    } else if (step.id === 'park_intro') result.example = { label: '연습 규칙', rows: ['연습이니 시간 걱정은 말고, 천천히 해 봐.', '여기서 옮긴 상자는 실전 점수에 안 들어간다.'] };
    else if (step.id === 'park_ready') result.example = { label: '실전 규칙', rows: ['실전은 60초다. 상자를 안전하게 옮겨 봐.', '많이 실으면 점수는 높아져. 흔들리면 잠깐 멈춰.'] };
    if (!result.example && step.cards?.length) result.example = { label: '지금 확인할 내용', rows: step.cards.map(([label, value]) => `${label}: ${value}`) };
    if (step.id === 'celebrate' && step.cards?.length) result.example = { label: '방금 체결된 결과', rows: step.cards.map(([label, value]) => `${label}: ${value}`) };
    return result;
}

export function createTutorialGuide({ lessonTitle, text, example, nextAction }) {
    const guide = document.createElement('section'); guide.className = 'tutorial-guide';
    const heading = document.createElement('h3'); heading.className = 'vn-lesson-heading'; heading.textContent = lessonTitle;
    const explanation = document.createElement('p'); explanation.className = 'tutorial-explanation'; explanation.textContent = text;
    guide.append(heading, explanation);
    if (example) guide.append(createTutorialExample(example));
    if (nextAction) guide.append(createTutorialAction(nextAction));
    return guide;
}
export function createTutorialExample(example) {
    const block = document.createElement('div'); block.className = 'vn-lesson-example';
    const label = document.createElement('small'); label.className = 'vn-example-label'; label.textContent = example.label; block.append(label);
    for (const [index, row] of example.rows.entries()) {
        if (example.flow && index) { const arrow = document.createElement('span'); arrow.className = 'vn-example-arrow'; arrow.textContent = '↓'; block.append(arrow); }
        const line = document.createElement('div'); line.className = 'vn-example-line'; line.textContent = row; block.append(line);
    }
    return block;
}
export function createTutorialAction(text, shortcut) {
    const action = document.createElement('div'); action.className = 'tutorial-next-action';
    const label = document.createElement('small'); label.textContent = '다음 행동';
    const instruction = document.createElement('strong'); instruction.textContent = text; action.append(label, instruction);
    if (shortcut) {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'tutorial-shortcut-btn'; button.textContent = shortcut.label;
        button.addEventListener('click', event => { event.stopPropagation(); shortcut.run(); });
        button.addEventListener('keydown', event => event.stopPropagation());
        action.append(button);
    }
    return action;
}

export function tutorialShortcutDestination(id) {
    if (['social_and_ranking_guide', 'portfolio_slots_guide', 'portfolio_slots_growth', 'portfolio_slots_capacity', 'portfolio_slots_trait'].includes(id)) return { label: '내 계좌 보기 →', tab: 'Profile' };
    if (id === 'market_tab') return { label: '주식 거래 열기 →', tab: 'Market' };
    if (id === 'open_phone') return { label: '스마트폰 열기 →', selector: '#floatingPhoneBtn' };
    if (id === 'launch_stock_app') return { label: '사이퍼M 열기 →', selector: '#iconStockApp' };
    return null;
}
