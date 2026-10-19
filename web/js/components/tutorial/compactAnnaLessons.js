import { describeTutorialStep, createTutorialExample, createTutorialAction } from './tutorialPresentation.js';
// Keep the original explanations available on demand; guide one idea at a time.
export function compactAnnaLessons(steps, { nickname, stockName }) {
    const lessons = {
        welcome_1: [`${nickname} 님, 반가워요! 첫 거래를 함께할 안나예요.`, [['다음 ▶ / Enter', '설명 계속'], ['◀ 이전', '다시 보기']]],
        welcome_2: ['시작 자금이 들어왔어요. 이제 첫 주식을 사볼까요?', [['+5,000G', '시작 자금'], ['G = Gold', '게임 화폐']]],
        open_phone: ['오른쪽 아래 📱 버튼을 눌러 스마트폰을 열어 주세요.'],
        launch_stock_app: ['홈 화면에서 [사이퍼M]을 눌러 주세요.'],
        market_tab: ['아래쪽 [주식 거래] 탭을 눌러 주세요.'],
        stock_basics_ownership: ['주식 1주는 기업의 작은 지분이에요.', [['기업', '사업을 운영'], ['1주', '지분의 작은 단위']]],
        select_stock: [`[안나 추천]이 붙은 '${stockName}'을 눌러 주세요.`],
        stock_basics_price: ['주가는 주식 1주를 사고파는 가격이에요.'],
        chart_colors: ['그래프 색과 +·− 숫자를 함께 확인하세요.', [['↗ + 상승', '청록색', 'positive'], ['↘ − 하락', '빨간색', 'negative']]],
        chart_detail: ['빛나는 그래프를 눌러 정밀 차트를 열어 주세요.', [['그래프 클릭', '크게 보기'], ['✕', '차트 닫기']]],
        market_order_guide: ['[주문하기] 화면이에요. 시장가는 지금 거래 가능한 가격으로 주문해요.', [['시장가', '즉시 체결 시도'], ['체결 가격', '현재가와 다를 수 있음']]],
        limit_order_guide: ['지정가는 원하는 가격을 정하는 주문이에요.', [['매수 400G', '400G 이하'], ['매도 400G', '400G 이상']]],
        stock_basics_profit: ['매수는 사는 것, 매도는 파는 것이에요.', [['매수', '현금 → 주식'], ['매도', '주식 → 현금']]],
        buy_stock: [`'${stockName}' 1주를 사볼게요. [매수 (BUY)]를 눌러 주세요.`, [['주문 방식', '시장가'], ['수량', '1주']]],
        celebrate: [`'${stockName}'을 샀어요! 오른쪽 위 [✕]를 눌러 주세요.`],
        portfolio_guide: ['아래쪽 [내 계좌]를 눌러 보유 주식을 확인하세요.'],
        social_and_ranking_guide: ['아직 보유 중이면 평가 손익, 팔면 실현 손익이에요.', [['평가 손익', '현재 가격 기준'], ['실현 손익', '매도한 결과']]],
        portfolio_slots_guide: ['같은 종목은 여러 주를 사도 슬롯 1칸만 써요.', [['A기업 10주', '1칸'], ['B기업 1주', '1칸'], ['합계', '2칸']]],
        portfolio_slots_capacity: ['새 종목을 담으려면 빈 슬롯이 필요해요.', [['일부 매도', '슬롯 유지'], ['전량 매도', '슬롯 1칸 확보']]],
        portfolio_slots_trait: ['공격적 자산가는 슬롯 2칸을 추가로 받아요.', [['성향 보너스', '+2칸'], ['현금', '별도로 필요']]],
        trade_history_guide: ['[거래 내역]에서 방금 산 기록을 확인하세요.', [['거래 기록', '언제 · 몇 주 · 얼마에']]],
        trade_history_fees: ['수수료를 뺀 실제 거래 결과를 확인하세요.', [['체결 금액', '실제로 거래한 금액'], ['수수료', '거래 비용']]],
        news_tab_guide: ['이번에는 아래쪽 [공시 뉴스]를 눌러 주세요.'],
        news_reading_guide: ['뉴스 카드를 누르면 본문을 읽을 수 있어요.', [['카드 클릭', '기사 읽기'], ['✕', '기사 닫기']]],
        stock_basics_news_expectations: ['좋은 뉴스도 이미 가격에 반영됐다면 주가가 안 오를 수 있어요.', [['기대', '먼저 가격에 반영'], ['발표', '기대와 실제를 비교']]],
        go_town_proposal: ['생활비를 벌러 나가볼까요? 오피스 문을 눌러 주세요.', [['W·A·S·D', '이동'], ['문 앞 F', '상호작용']]],
        enter_logistics: ['노란 화살표를 따라 [비트 물류센터]로 들어가세요. 안에 있는 박씨 아저씨에게 말을 걸어 [일 시작하기]를 누르세요.'],
        rumor_inventory_guide: ['물류 보상으로 찌라시를 받았어요. 상단 [소지품]을 눌러 주세요.'],
        rumor_intel_explain: ['찌라시를 선택하고 [확인하기]를 눌러 직접 읽어 보세요. 내용을 읽은 뒤 찌라시 창을 닫으면 안내를 이어갈게요.'],
        rumor_time_prediction: ['연습용: “이틀 뒤 잔치에서 천막이 걷히면 간판도 들썩이겠지.” 언제 영향을 줄까요?'],
        rumor_time_feedback: ['“이틀 뒤”가 시간 단서예요. 주가 반응은 발표보다 빠르거나 늦을 수 있어요.', [['시간 단서', '이틀 뒤'], ['시장 반응', '발표 시점과 다를 수 있음']]],
        rumor_reading_summary: ['찌라시의 단서를 뉴스와 공시로 확인하세요.', [['무엇?', '종목 · 사건'], ['어떻게?', '상승 · 하락'], ['언제?', '발표 · 영향 시점']]],
        stamina_recovery_guide: ['물류 일 하느라 수고했어요! 에너지 드링크 한 캔을 선물할게요. 지금 마시고 하트 1개를 회복해 보세요.', [['안나의 선물', '에너지 드링크 1개'], ['바로 사용', '하트 1개 회복']]],
        stock_basics_budget: ['투자하기 전에 월세로 쓸 현금을 남겨 두세요.', [['7일 차', '월세 5,000G'], ['생활비', '투자금과 나눠 두기']]],
        logistics_completed: ['첫 거래 안내를 마쳤어요! 준비됐다면 자립을 시작하세요.', [['+2,000G', '정착 지원금'], ['7일 차', '월세 준비']]]
    };
    const extra = (id, text, cards, tracker, detailText) => ({ id, text, cards, tracker, detailText, speaker: '전담 매니저 안나', expression: 'Smile', requiresManualAction: false });
    return steps.flatMap(step => {
        const lesson = lessons[step.id];
        const compact = lesson ? { ...step, text: lesson[0], cards: lesson[1], detailText: step.text } : { ...step };
        compact.lessonTitle = step.tracker?.split('•').at(-1)?.trim();
        if (step.id === 'stock_basics_price') {
            compact.lessonTitle = '주가란 무엇일까요?';
            compact.tracker = '2/4 • 주가의 뜻';
            compact.example = { label: '예시 · A기업', rows: ['주식 1주 = 400G'] };
            compact.detailText = '400G는 예시 가격이에요. 실제 거래 가격은 계속 바뀔 수 있어요.';
        }
        if (step.id === 'stock_basics_ownership') {
            compact.lessonTitle = '주식을 사면 무엇을 갖게 될까요?';
            compact.cards = undefined;
            compact.example = { label: '예시 · A기업', flow: true, rows: ['A기업 주식 1주를 산다', 'A기업의 작은 지분을 갖는다'] };
        }
        if (step.id === 'stock_basics_news_expectations') {
            compact.cards = undefined;
            compact.example = { label: '이미 기대가 반영된 경우', flow: true, rows: ['좋은 소식을 예상하고 먼저 산다', '발표 전에 주가가 오른다', '좋은 뉴스가 나와도 더 안 오를 수 있다'] };
        }
        if (step.id === 'portfolio_slots_guide') {
            compact.cards = undefined;
            compact.example = { label: '예시 · 두 기업의 주식을 가진 경우', rows: ['A기업 10주 → 슬롯 1칸', 'B기업 1주 → 슬롯 1칸', '합계: 주식 11주, 종목 슬롯 2칸'] };
            compact.takeaway = '슬롯은 주식 수가 아니라 서로 다른 종목 수를 세요.';
        }
        if (step.id === 'market_order_guide') {
            compact.cards = undefined;
            compact.example = { label: '시장가로 1주를 사는 경우', flow: true, rows: ['시장가 매수 주문을 낸다', '지금 팔려는 가격으로 거래를 시도한다'] };
            compact.takeaway = '화면의 현재가와 실제로 산 가격은 다를 수 있어요.';
        }
        if (step.id === 'rumor_reading_summary') {
            compact.cards = undefined;
            compact.example = { label: '찌라시를 읽을 때 확인할 것', rows: ['① 어느 기업에 어떤 일이 생기나요?', '② 주가가 오를 소식인가요, 내릴 소식인가요?', '③ 언제 발표되거나 영향을 줄까요?'] };
        }
        if (step.id === 'select_stock' && !stockName) compact.text = '구매 가능한 종목이 생기면 다시 안내할게요.';
        if (step.id.startsWith('rumor_analysis_example_')) {
            const level = Number(step.id.slice(-1));
            const examples = [
                '연습용: 푸른 전기 저장고와 큰 수레꾼. 이틀 뒤 잔치가 단서예요.',
                '연습용: 친환경 에너지 업체가 배터리를 독점 공급한대요. 이틀 뒤 엑스포가 상승 단서예요.',
                '연습용: 전고체 배터리 독점 계약 호재예요. 이틀 뒤 엑스포 발표가 상승 계기가 될 전망이에요.',
                '연습용: 에코 배터리의 전고체 독점 계약. 이틀 뒤 엑스포에서 발표한대요.',
                '연습용: 에코 배터리의 5조 원 전고체 독점 계약. 이틀 뒤 엑스포에서 발표한대요.'
            ];
            compact.lessonTitle = `분석력 ${level}단계에서는 찌라시가 어떻게 보일까요?`;
            compact.text = `분석력 ${level}단계에서 읽으면 이렇게 보여요.\n${examples[level - 1]}`;
            compact.detailText = step.text;
            compact.takeaway = '분석력이 높아질수록 같은 찌라시에서 기업명·사건·금액 등 더 구체적인 정보를 읽을 수 있어요. 지금은 실제 능력치를 바꾸지 않고 1~5단계의 차이를 비교하는 연습이에요.';
            compact.cards = [[`분석력 ${level}단계`, ['비유 속 단서', '업종 · 방향', '사건 · 시점', '기업 · 근거', '금액 · 상세'][level - 1]], ['주의', '해석 ≠ 진위 보증']];
        }
        const additions = [];
        if (step.id === 'stock_basics_price') {
            additions.push({ ...extra('stock_price_earnings', 'A기업의 이익이 늘어난 상황을 볼까요?', undefined, '2/4 • 실적과 주가'),
                lessonTitle: '실적이 좋아지면 왜 주가가 오를까요?',
                example: { label: '실적에서 주가까지', flow: true, rows: ['A기업이 전보다 돈을 더 잘 번다', 'A기업 주식을 사려는 사람이 늘어난다', '주가가 오를 수 있다'] },
                takeaway: '실적이 좋아져도 주가가 반드시 오르는 것은 아니에요.' });
            additions.push({ ...extra('stock_price_expectations', '아직 실적이 좋아지지 않아도, 앞으로 좋아질 거라 예상해 먼저 살 수 있어요.', undefined, '2/4 • 기대와 주가'),
                lessonTitle: '실적 발표 전에도 주가가 움직일까요?',
                example: { label: '예시 · 신제품이 잘 팔릴 것 같은 경우', flow: true, rows: ['신제품이 잘 팔릴 거라고 예상한다', '실적 발표 전에 주식을 산다', '기대만으로도 주가가 오를 수 있다'] },
                takeaway: '예상이 빗나가면 가격이 다시 내려갈 수 있어요.' });
        }
        if (step.id === 'stock_basics_profit') {
            additions.push(extra('stock_profit_example', '400G에 산 1주, 수수료를 빼기 전 손익이에요.', [['450G에 매도', '+50G', 'positive'], ['350G에 매도', '−50G', 'negative']], '2/4 • 1주 손익 예시'));
            additions.push({ ...extra('stock_profit_fees', '2주로 100G를 벌었어도 수수료가 4G라면 실제 이익은 96G예요.', [['수수료를 뺀 예시', '100G − 수수료 4G = 96G']], '2/4 • 수수료를 뺀 실제 이익'),
                example: { label: '예시 · 400G에 산 주식 2주를 450G에 판 경우', rows: ['1주당 50G 이익 × 2주 = 100G'] },
                detailText: '수수료 4G는 계산을 설명하기 위한 예시예요. 실제 수수료는 거래 금액·거래 장소·협상력에 따라 달라져요.' });
        }
        if (step.id === 'portfolio_slots_guide') additions.push(extra('portfolio_slots_growth', '운용력을 올리면 더 많은 종목을 보유할 수 있어요.', [['기본', '5칸'], ['운용력 +1', '슬롯 +5칸']], '2/4 • 슬롯 늘리기'));
        if (step.id === 'stock_basics_budget') additions.push(extra('stock_basics_diversification', '한 종목에 전부 투자하면 손해도 한곳에 몰려요.', [['여러 종목', '한 기업에 대한 의존 감소'], ['주의', '함께 하락할 수 있음']], '4/4 • 나눠 투자하기'));
        return [compact, ...additions];
    });
}

export function renderAnnaLesson(body, originalStep, shortcut, { focused = false } = {}) {
    const step = describeTutorialStep(originalStep);
    if (!body) return step.text;
    body.querySelector?.('.vn-lesson-heading')?.remove();
    body.querySelector?.('.vn-lesson-visual')?.remove();
    const title = step.lessonTitle || step.tracker?.split('•').at(-1)?.trim();
    if (title && !focused) {
        const heading = document.createElement('h3'); heading.className = 'vn-lesson-heading'; heading.textContent = title;
        const text = body.querySelector?.('.vn-dialogue-text');
        if (text && body.insertBefore) body.insertBefore(heading, text); else body.append(heading);
    }
    if (!step.cards?.length && !step.detailText && !step.example && !step.takeaway && !step.nextAction) return step.text;
    const section = document.createElement('section'); section.className = 'vn-lesson-visual';
    if (step.example && !(focused && (step.id?.startsWith('welcome_') || step.requiresManualAction))) section.append(createTutorialExample(step.example));
    if (step.takeaway) { const note = document.createElement('p'); note.className = 'vn-lesson-takeaway'; note.textContent = step.takeaway; section.append(note); }
    if (!focused && step.detailText && step.detailText !== step.text) {
        const details = document.createElement('details'); details.className = 'vn-lesson-details';
        const summary = document.createElement('summary'); summary.textContent = '자세히 보기';
        const text = document.createElement('p'); text.textContent = step.detailText;
        details.append(summary, text);
        details.addEventListener('keydown', event => event.stopPropagation());
        details.addEventListener('click', event => event.stopPropagation());
        section.append(details);
    }
    if (!focused || shortcut) {
        const action = createTutorialAction(step.nextAction, shortcut);
        if (focused) action.classList.add('vn-shortcut-only');
        section.append(action);
    }
    const footer = body.querySelector?.('.vn-indicator-row');
    if (footer && body.insertBefore) body.insertBefore(section, footer);
    else body.append(section);
    return step.text;
}
