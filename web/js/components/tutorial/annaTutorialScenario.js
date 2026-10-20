import { annaLaterLessons } from './annaLaterLessons.js';
/**
 * Anna Tutorial Scenario Builder
 * Contains the dialogue sequence and step definitions for the Railroad Onboarding sequence.
 * GDD Reference: CORE_GDD_10 (v2.0.0)
 */

import { compactAnnaLessons } from './compactAnnaLessons.js';

export function buildAnnaScenario({
    nickname = '파트너',
    targetStock = { id: 'CLOUDBERRY', name: '클라우드 베리' },
    reason = null,
    callbacks = {},
    highlightElement = () => {},
    highlightStock = () => {},
    cleanupHighlights = () => {},
    overlay = null
}) {
    const stockName = targetStock.name;
    const stockId = targetStock.id;
    const recommendationLead = reason
        ? `${nickname} 님의 투자 성향과 시장 분석 결과, ${reason}인 '${stockName}'을(를) 추천해요.`
        : `${nickname} 님의 투자 프로필과 오늘 시장 수급 분석 결과, 현재 시세로 구매 가능한 '${stockName}'을(를) 추천해요.`;

    const steps = [
        // STEP 1: Welcome to Office & Initial Funds
        {
            id: 'welcome_1',
            expression: 'Happy',
            speaker: "전담 매니저 모아",
            text: `환영해요, ${nickname} 님! 저는 첫 거래를 함께할 매니저 모아예요. 한 번에 하나씩 안내할게요. 대사를 다 읽었으면 오른쪽 [다음 ▶]이나 단축키 [Enter]를 눌러 주세요. 놓친 설명은 [◀ 이전]으로 다시 볼 수 있어요.`,
            tracker: "1/4 • 오피스 환영 인사",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
                document.body.classList.remove('phone-view-active');
                document.body.classList.add('phone-minimized');
            }
        },
        {
            id: 'welcome_2',
            expression: 'Smile',
            speaker: "전담 매니저 모아",
            text: `시작 자금 5,000G를 드렸어요. G는 Gold를 줄여 쓰는 화폐 단위예요. 주식을 사면 현금이 줄고, 산 주식이 내 계좌에 들어옵니다.`,
            tracker: "1/4 • 초기 지원금 입금",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
                callbacks.onGrantInitialFunds?.(5000);
            }
        },

        // STEP 2: Open Smartphone to Home Screen
        {
            id: 'hud_overview', speaker: '모아', expression: 'Smile',
            text: '화면 위쪽은 현재 상태를 확인하는 곳이에요. 왼쪽에는 날짜와 체력, 가운데에는 자산, 오른쪽에는 메뉴가 있어요.',
            tracker: '1/4 • 상단 화면 둘러보기', requiresManualAction: false, screenOverview: true
        },
        {
            id: 'hud_day_guide', speaker: '모아', expression: 'Smile', text: 'DAY는 게임을 시작한 뒤 며칠째인지 보여줘요. 월세 납부일까지 남은 날을 확인할 때 살펴보세요.', tracker: '1/4 • 날짜', requiresManualAction: false, screenOverview: true
        },
        {
            id: 'hud_time_guide', speaker: '모아', expression: 'Smile', text: '시계는 현재 시각을 보여줘요.', tracker: '1/4 • 시각', requiresManualAction: false, screenOverview: true
        },
        {
            id: 'hud_weather_guide', speaker: '모아', expression: 'Smile', text: '지금 계신 지역의 날씨와 기온을 알려주는 곳이에요.', tracker: '1/4 • 날씨', requiresManualAction: false, screenOverview: true
        },
        {
            id: 'hud_stamina_guide', speaker: '모아', expression: 'Smile', text: '하트는 현재 체력이에요. 활동을 하면 줄어들고, 드링크를 마시거나 벤치에서 쉬면 회복할 수 있어요.', tracker: '1/4 • 체력', requiresManualAction: false, screenOverview: true
        },
        {
            id: 'hud_cash_guide', speaker: '모아', expression: 'Smile',
            text: '보유 현금은 지금 바로 쓸 수 있는 돈이에요. 잠시 후 받을 시작 자금도 여기에 표시돼요.',
            tracker: '1/4 • 보유 현금', requiresManualAction: false,
            example: { label: '현금을 쓰는 곳', rows: ['주식 매수 · 물건 구매 · 월세 납부'] }
        },
        {
            id: 'hud_assets_guide', speaker: '모아', expression: 'Smile',
            text: '총 평가 자산은 현금과 보유 주식의 현재 가치를 합친 금액이에요. 주가가 바뀌면 함께 달라져요.',
            tracker: '1/4 • 총 평가 자산', requiresManualAction: false,
            example: { label: '예시', rows: ['현금 4,000G + 주식 평가금 1,000G = 총 평가 자산 5,000G'] }
        },
        {
            id: 'hud_profit_guide', speaker: '모아', expression: 'Smile',
            text: '손익은 이익이나 손해를 보여줘요. 청록색은 이익, 빨간색은 손실이에요. 색과 함께 +·− 숫자도 확인해 주세요.',
            tracker: '1/4 • 손익 읽기', requiresManualAction: false,
            example: { label: '색과 부호', rows: ['청록색 +: 이익 · 빨간색 −: 손실 · 0: 중립'] }
        },
        {
            id: 'open_phone',
            expression: 'Smile',
            speaker: "전담 매니저 모아",
            text: `오른쪽 아래 📱 스마트폰 버튼을 눌러 주세요. 단축키 [P]로도 열고 닫을 수 있어요. 주식을 사고팔 때 사용할 화면이에요.`,
            tracker: "2/4 • 스마트폰 화면 켜기",
            requiresManualAction: true,
            interactionHint: "우측 하단의 [스마트폰] 버튼을 클릭해 화면을 켜주세요!",
            targetSelector: '#floatingPhoneBtn',
            onEnter: () => {
                highlightElement('#floatingPhoneBtn', true);
            }
        },

        // STEP 3: Launch 사이퍼M Stock App
        ...[
            ['stock', '#iconStockApp', '사이퍼M', '사이퍼M은 주식을 사고파는 앱이에요.\n종목 가격과 내 계좌를 확인할 수 있어요.'],
            ['bubble', '#iconBubbleApp', 'Bubble', 'Bubble에서는 친구를 추가하고\n다른 플레이어와 채팅할 수 있어요.'],
            ['memo', '#iconMemoApp', '메모', '메모는 투자 생각과 매매 일지를 적을 공간이에요.\n아직 준비 중이에요.'],
            ['achievements', '#iconAchieveApp', '업적', '도전 목표의 진행 상황과 획득한 칭호를 확인해 보세요.\n목표를 달성하면 칭호 컬렉션에 추가돼요.'],
            ['settings', '#iconSettingsApp', '설정', '이 설정 앱은 아직 버전 안내만 보여줘요.\n게임 설정은 화면 위 톱니바퀴에서 바꿀 수 있어요.']
        ].map(([id, appIntroTarget, name, text]) => ({
            id: `phone_app_intro_${id}`, expression: 'Smile', speaker: '모아',
            text, tracker: `2/4 • ${name}`, requiresManualAction: false, appIntroTarget
        })),

        {
            id: 'launch_stock_app',
            expression: 'Smile',
            speaker: "전담 매니저 모아",
            text: `스마트폰 홈 화면에서 [사이퍼M] 아이콘을 눌러 주세요. 주식 가격과 내 계좌를 확인하는 앱이에요.`,
            tracker: "2/4 • [📈 사이퍼M] HTS 앱 실행",
            requiresManualAction: true,
            interactionHint: "홈 화면의 [📈 사이퍼M] 앱 아이콘을 클릭해주세요!",
            targetSelector: '#iconStockApp',
            onEnter: () => {
                highlightElement('#iconStockApp', true);
            }
        },

        {
            id: 'hts_home_overview', speaker: '모아', expression: 'Smile',
            text: '여기가 주식앱의 홈이에요.\n내 자산과 시장 흐름, 최근 본 종목을 한눈에 볼 수 있어요.',
            tracker: '2/4 • 홈 둘러보기', requiresManualAction: false,
            screenOverview: true
        },

        // STEP 4: Navigate to Stock Market Tab
        ...[
            ['ticker', '#stockApp .ticker-marquee-wrapper', '지수 전광판', '사이퍼 지수는 시장 전체의 흐름을 보여줘요.\n내가 가진 종목의 수익률과는 달라요.'],
            ['assets', '#summaryCard', '내 자산', '내 자산은 현금과 주식 평가금을 합친 금액이에요.\n아래에서 현금·평가금·평가 손익을 나눠 볼 수 있어요.'],
            ['recent', '#recentStocksGrid', '최근 종목', '최근 본 종목의 가격과 등락을 확인하는 곳이에요.\n조회 기록이 적으면 다른 종목도 함께 보여줘요.'],
            ['home', '#stockApp .nav-tab[data-tab="Home"]', '홈', '홈 탭을 누르면 이 요약 화면으로 돌아와요.'],
            ['market', '#stockApp .nav-tab[data-tab="Market"]', '주식 거래', '주식 거래에서는 종목을 찾고\n가격을 확인해 매수·매도할 수 있어요.'],
            ['news', '#stockApp .nav-tab[data-tab="News"]', '공식 뉴스', '공식 뉴스에서는 기업의 공시와\n시장에 영향을 줄 소식을 읽을 수 있어요.'],
            ['account', '#stockApp .nav-tab[data-tab="Profile"]', '내 계좌', '내 계좌에서는 보유 주식과 손익,\n거래 내역을 확인할 수 있어요.']
        ].map(([id, htsIntroTarget, name, text]) => ({
            id: `hts_home_intro_${id}`, expression: 'Smile', speaker: '모아',
            text, tracker: `2/4 • ${name}`, requiresManualAction: false, htsIntroTarget
        })),

        {
            id: 'market_tab',
            expression: 'Standard',
            speaker: "전담 매니저 모아",
            text: `스마트폰 아래쪽의 [주식 거래] 탭을 눌러 주세요. 여기서 살 수 있는 종목을 찾아볼 거예요.`,
            tracker: "2/4 • 주식 시장 탐색",
            requiresManualAction: true,
            interactionHint: "스마트폰 하단의 [📈 주식 거래] 탭을 터치해주세요!",
            targetSelector: '.nav-tab[data-tab="Market"]',
            onEnter: () => {
                highlightElement('.nav-tab[data-tab="Market"]', true);
            }
        },

        // STEP 5: Select Recommended Stock & Open Trade Modal
        {
            id: 'stock_basics_ownership', expression: 'Smile', speaker: '전담 매니저 모아',
            text: '주식은 기업의 지분이에요. 1주를 사면 그 기업의 작은 일부를 갖게 되는 거죠. 종목은 거래할 주식의 종류를 뜻해요. 기업마다 사업과 상황이 다르니, 어떤 기업의 주식인지부터 살펴보세요.',
            tracker: '2/4 • 주식과 종목 알아보기', requiresManualAction: false
        },
        {
            id: 'select_stock',
            expression: 'Smile',
            speaker: "전담 매니저 모아",
            text: stockId ? `목록 맨 위에서 [모아 추천] 표시가 붙은 '${stockName}'을 눌러 주세요. 지금 현금으로 살 수 있는 종목이에요. 누르면 가격 그래프와 매수 버튼이 나옵니다.` : '현재 현금으로 살 수 있는 종목이 없어요. 시장을 계속 확인하고 구매 가능한 종목이 생기면 추천해 드릴게요.',
            tracker: `2/4 • '${stockName}' 선택`,
            requiresManualAction: true,
            interactionHint: `종목 목록에서 '${stockName}'을(를) 클릭해 매매 창을 열어주세요!`,
            targetSelector: `.stock-item-row[data-id="${stockId}"]`,
            onEnter: () => {
                highlightStock(stockId, true);
            }
        },

        {
            id: 'trade_screen_overview', expression: 'Smile', speaker: '모아',
            text: '여기는 차트·호가 화면이에요. 위에는 현재 가격, 가운데는 가격 흐름, 아래에는 호가가 보여요. [주문하기]에서 매수·매도를 할 수 있어요. 하나씩 살펴볼게요.',
            tracker: '2/4 • 차트·호가 화면 둘러보기', requiresManualAction: false,
            screenOverview: true
        },
        {
            id: 'stock_basics_price', expression: 'Standard', speaker: '전담 매니저 모아',
            text: '주가는 주식 1주가 거래되는 가격이에요. 기업 실적과 앞으로의 기대, 시장 분위기에 따라 사고 싶은 사람과 팔고 싶은 사람이 달라지면서 가격도 움직여요. 가격 그래프는 그동안 주가가 어떻게 변했는지 보여줍니다.',
            tracker: '2/4 • 주가가 움직이는 이유', requiresManualAction: false
        },
        {
            id: 'chart_colors', expression: 'Standard', speaker: '전담 매니저 모아',
            text: '가격 그래프는 미국 시장 방식으로 표시해요. 상승은 청록색, 하락은 빨간색이에요. 한국 시장에서 익숙한 색과 반대라 헷갈릴 수 있어요. 색과 함께 가격 옆의 +·− 숫자도 확인해 주세요. 읽었으면 [다음 ▶]을 눌러 주세요.',
            tracker: '2/4 • 그래프 색상 읽기', requiresManualAction: false
        },
        {
            id: 'chart_detail', expression: 'Smile', speaker: '모아',
            text: '빛나는 그래프를 눌러 정밀 차트를 열어 주세요.',
            tracker: '2/4 • 정밀 차트 열기', requiresManualAction: true,
            targetSelector: '#btnExpandChart',
            onEnter: () => highlightElement('#btnExpandChart', true)
        },
        ...[
            ['price', '현재 가격', '현재 주가와 전일 대비 등락을 볼 수 있어요.', '.detail-price-box'],
            ['metrics', '가격 요약', '최고·최저·평균가는 선택한 기간의 가격을 요약해요.', '.detail-metrics-grid'],
            ['graph', '가격 흐름', '그래프를 좌우로 움직여 과거 흐름을 보세요.\n점 위에 커서를 올리면 시각과 가격이 나타나요.', '#detailedChartScrollWrapper'],
            ['period', '조회 기간', '실시간·1일·1주·1달·1년을 눌러\n확인할 기간을 바꿀 수 있어요.', '#timeframeSelector']
        ].map(([id, name, text, chartIntroTarget]) => ({
            id: `chart_tour_${id}`, speaker: '모아', expression: 'Smile', text,
            tracker: `2/4 • ${name}`, requiresManualAction: false, chartIntroTarget,
            allowedSelector: ['graph', 'period'].includes(id) ? chartIntroTarget : null
        })),
        {
            id: 'chart_tour_close', speaker: '모아', expression: 'Smile',
            text: '오른쪽 위 닫기를 눌러 매매 화면으로 돌아가요.',
            tracker: '2/4 • 차트 닫기', requiresManualAction: true,
            chartIntroTarget: '#btnCloseDetailedChartModal',
            targetSelector: '#btnCloseDetailedChartModal'
        },

        {
            id: 'open_company_info', expression: 'Smile', speaker: '모아',
            text: '주문하기 전에 어떤 기업인지 알아볼까요? 위쪽 [기업 정보] 탭을 눌러 주세요.',
            tracker: '2/4 • 기업 정보 열기', requiresManualAction: true,
            targetSelector: '#btnSubtabInfo', example: { label: '직접 확인하기', rows: ['위쪽 [기업 정보] 탭을 눌러 주세요.'] }
        },
        {
            id: 'company_info_overview', expression: 'Smile', speaker: '모아',
            text: '기업 정보 화면이에요. 기업이 하는 일, 투자 지표와 재무 정보, 관련 뉴스를 확인할 수 있어요.',
            tracker: '2/4 • 기업 정보 둘러보기', requiresManualAction: false, screenOverview: true
        },
        ...[
            ['business', '기업 개요', '이 기업이 어떤 사업을 하는지 설명하는 곳이에요. 어떤 물건이나 서비스를 파는지 살펴보세요.'],
            ['per', 'PER · 주가수익비율', 'PER는 회사가 버는 이익에 비해 주식 가격이 얼마나 높은지 보여줘요. 회사 이익을 전체 주식 수로 나눈 값이 ‘주당 이익’, 즉 주식 한 주 몫의 이익이에요.', '한 주 가격이 1,000G이고 한 주 몫의 이익이 100G라면 PER는 10배예요. 비슷한 사업을 하는 회사끼리 비교해 보세요.'],
            ['pbr', 'PBR · 주가순자산비율', '회사가 가진 재산에서 갚아야 할 빚을 빼면 ‘순자산’이에요. 이것을 전체 주식 수로 나눈 값이 ‘주당 순자산’, 즉 주식 한 주 몫의 순자산이에요.', '한 주 몫의 순자산이 1,000G일 때 주가도 1,000G면 PBR 1배, 주가가 2,000G면 2배예요. 순자산에 비해 주식이 얼마에 거래되는지 보는 거예요.'],
            ['roe', 'ROE · 자기자본이익률', 'ROE는 회사가 자기 돈으로 얼마나 이익을 냈는지 보여줘요. 여기서 ‘자기자본’은 가진 재산에서 빚을 뺀 돈을 뜻해요.', '자기자본 1,000G로 한 해 이익 100G를 냈다면 ROE는 10%예요. 같은 돈으로 이익을 얼마나 냈는지 비교할 수 있어요.'],
            ['dividend', '주간 배당률', '배당은 회사가 이익의 일부를 주주에게 나눠 주는 돈이에요. 주간 배당률은 주식 가격에 비해 한 주 동안 나눠 주는 배당이 얼마나 되는지 보여줘요.', '주가가 1,000G이고 주간 배당률이 2%라면 한 주당 배당은 20G예요. 실제로 받으려면 지급 조건과 보유 시점도 확인하세요.'],
            ['market_cap', '시가총액', '시가총액은 주식 한 주의 가격에 회사가 발행한 전체 주식 수를 곱한 값이에요. 지금 주식시장에서 회사 전체에 얼마의 값을 매기는지 보여줘요.', '한 주가 1,000G이고 전체 주식이 10만 주라면 시가총액은 1억G예요. 주가만 보는 것보다 회사 규모를 비교하기 좋아요.'],
            ['high_low', '52주 최고 · 최저', '52주는 약 1년이에요. 그동안 주식이 가장 비싸게 거래된 가격과 가장 싸게 거래된 가격을 보여줘요.', '최고 1,500G, 최저 800G라면 현재 가격을 이 범위와 비교해 볼 수 있어요. 앞으로도 이 범위 안에서만 움직인다는 뜻은 아니에요.'],
            ['risk', '위험도 등급', '투자한 돈을 잃을 위험이 어느 정도인지 나타내는 표시예요. Low는 낮음, Mid는 보통, High는 높음이에요. 위험도가 낮아도 주가가 내려가 손실을 볼 수 있어요.'],
            ['tier', '변동성 티어', '‘변동성’은 주가가 오르내리는 폭을 뜻하고, ‘티어’는 등급이라는 말이에요. 이 표시는 주가가 얼마나 크게 움직이는 성향인지 구분해요.', '1,000G 부근에서 조금씩 움직이는 주식보다 800G와 1,200G 사이를 크게 오가는 주식의 변동성이 더 커요.'],
            ['news', '관련 뉴스', '‘공시’는 회사가 투자자에게 공식적으로 알리는 발표예요. 사업 실적이나 중요한 계약 같은 소식을 확인할 수 있어요. 관련 뉴스와 함께 읽으며 찌라시의 단서가 맞는지 비교해 보세요.']
        ].map(([id, title, text, example]) => ({ id: `company_info_${id}`, expression: 'Smile', speaker: '모아', text, ...(example ? { example: { label: '숫자로 살펴보기', rows: [example] } } : {}), tracker: `2/4 • ${title}`, requiresManualAction: false, screenOverview: true })),
        {
            id: 'open_order_screen', expression: 'Smile', speaker: '모아',
            text: '기업 정보를 확인했으니 주문해 볼까요? 위쪽 [주문하기] 탭을 눌러 주세요.',
            tracker: '2/4 • 주문 화면 열기', requiresManualAction: true,
            targetSelector: '#btnSubtabOrder'
        },
        {
            id: 'order_screen_overview', expression: 'Smile', speaker: '모아',
            text: '여기는 주문 화면이에요. 주문 방식과 수량을 정하고, 예상 금액을 확인한 뒤 아래 매수·매도 버튼으로 주문해요. 하나씩 살펴볼게요.',
            tracker: '2/4 • 주문 화면 둘러보기', requiresManualAction: false,
            screenOverview: true
        },
        {
            id: 'market_order_guide', expression: 'Standard', speaker: '전담 매니저 모아',
            text: '주문 방식에는 [시장가]와 [지정가]가 있어요. 시장가는 지금 거래할 수 있는 호가부터 순서대로 사고파는 방식이에요. 화면의 현재가와 실제 체결가는 다를 수 있고, 물량이 부족하면 일부만 체결될 수도 있어요. 사이퍼M에서는 가격 보호 범위 ±5%를 벗어나거나 현금·물량이 부족하면 남은 수량은 취소돼요.',
            tracker: '2/4 • 시장가 주문 알아보기', requiresManualAction: false,
            onEnter: () => highlightElement('#tradeOrderTypeControl', true)
        },
        {
            id: 'limit_order_guide', expression: 'Smile', speaker: '전담 매니저 모아',
            text: '지정가는 원하는 가격을 직접 입력하는 방식이에요. 400G로 매수하면 400G 이하에서, 매도하면 400G 이상에서만 체결돼요. 조건에 맞는 상대 주문이 없으면 기다리므로 바로 거래되지 않을 수 있어요. 사이퍼M의 대기 주문은 현금이나 주식을 미리 묶어두지 않아, 체결할 때 부족하면 취소됩니다. 첫 매수는 [시장가]로 진행해 볼게요.',
            tracker: '2/4 • 지정가 주문 알아보기', requiresManualAction: false,
            onEnter: () => {
                highlightElement('#tradeOrderTypeControl', true);
                highlightElement('#tradeLimitPrice', true);
            }
        },
        // STEP 6: Execute Buy Order
        {
            id: 'stock_basics_profit', expression: 'Smile', speaker: '전담 매니저 모아',
            text: '매수는 주식을 사는 것, 매도는 파는 것이에요. 예를 들어 1주를 400G에 사서 450G에 팔면 수수료를 빼기 전 이익은 50G예요. 350G에 팔면 50G 손해고요. 여러 주를 거래하면 주당 가격 차이에 주식 수를 곱하고, 매수·매도 수수료도 빼야 실제 손익을 알 수 있어요.',
            tracker: '2/4 • 매수·매도와 손익 계산', requiresManualAction: false
        },
        {
            id: 'buy_stock',
            expression: 'Standard',
            speaker: "전담 매니저 모아",
            text: `'${stockName}'을 살 준비가 됐어요. 매수는 내 현금으로 주식을 사는 거래예요. 주문 방식이 [시장가], 수량이 1주인지 확인한 뒤 아래 [매수 (BUY)] 버튼을 눌러 주세요. 체결 금액과 수수료만큼 현금이 줄어들어요.`,
            tracker: `2/4 • '${stockName}' 1주 매수`,
            requiresManualAction: true,
            interactionHint: `매매 창의 [📈 매수 (BUY)] 버튼을 눌러 '${stockName}' 1주 매수 주문을 완료하세요!`,
            targetSelector: '#btnBuyExecute',
            onEnter: () => {
                highlightElement('#btnBuyExecute', true);

            }
        },

        // STEP 7: Celebration & Portfolio Guide
        {
            id: 'celebrate',
            expression: 'Happy',
            speaker: "전담 매니저 모아",
            text: `'${stockName}'을 샀어요! 산 주식과 남은 현금을 함께 확인해 볼게요.`,
            tracker: "2/4 • 첫 매수 체결 성공",
            requiresManualAction: true,
            targetSelector: '#btnCloseTradeModal',
            onEnter: () => {
                highlightElement('#btnCloseTradeModal', true);
            }
        },
        {
            id: 'portfolio_guide',
            expression: 'Smile',
            speaker: "전담 매니저 모아",
            text: `스마트폰 아래쪽의 [내 계좌] 탭을 눌러 주세요. 방금 산 '${stockName}'과 남은 현금을 확인할 수 있어요.`,
            tracker: "2/4 • 포트폴리오 관리 안내",
            requiresManualAction: true,
            interactionHint: "스마트폰 하단의 [👤 내 계좌] 탭을 눌러 포트폴리오를 확인해보세요!",
            targetSelector: '.nav-tab[data-tab="Profile"]',
            onEnter: () => {
                highlightElement('.nav-tab[data-tab="Profile"]', true);
            }
        },
        {
            id: 'portfolio_overview', speaker: '모아', expression: 'Smile',
            text: '여기가 내 계좌예요.\n투자 비중과 보유 종목, 거래 내역을 한눈에 볼 수 있어요.',
            tracker: '2/4 • 내 계좌 둘러보기', requiresManualAction: false,
            screenOverview: true
        },
        {
            id: 'sector_allocation_guide',
            expression: 'Smile', speaker: '모아',
            text: '섹터는 기업의 업종이에요. 이 그래프는 보유 주식의 현재 평가금이 업종별로 얼마나 나뉘어 있는지 보여줘요. 현금은 포함하지 않아요.',
            tracker: '2/4 • 섹터별 투자 비중', requiresManualAction: false,
            example: { label: '비율 읽는 방법', rows: ['한 업종만 보유하면 그 업종이 100%예요.', '가운데 숫자는 보유한 업종 수예요. 종목 수나 수익률이 아니에요.'] }
        },
        {
            id: 'social_and_ranking_guide',
            expression: 'Happy',
            speaker: "전담 매니저 모아",
            text: `내 계좌의 평가 손익은 보유 주식을 현재 가격으로 계산한 이익이나 손해예요. 주가가 변하면 이 숫자도 달라지고, 실제로 팔리는 가격은 다를 수 있어요. 매도한 주식의 손익은 실현 손익으로 기록되며, 거래 내역에서는 수수료를 반영한 결과를 확인할 수 있어요.`,
            tracker: "2/4 • 평가 손익 확인",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
        },

        ...annaLaterLessons({ nickname, stockName, stockId, recommendationLead, callbacks, highlightElement, highlightStock, cleanupHighlights, overlay })
    ];
    const menuLessons = [
        ['profile', '프로필', '프로필에서는 내 캐릭터와 능력치를 확인해요.'],
        ['inventory', '소지품', '소지품에서는 보유 아이템을 확인하고 사용할 수 있어요.'],
        ['ranking', '랭킹', '랭킹에서는 다른 트레이더들의 기록을 확인해요.'],
        ['help', '도움말', '조작이나 게임 규칙이 헷갈리면 도움말을 확인하세요.'],
        ['settings', '설정', '설정에서는 소리와 게임 설정을 조절할 수 있어요.']
    ].map(([id, name, text]) => ({ id: `hud_${id}_guide`, speaker: '모아', expression: 'Smile', text, tracker: `1/4 • ${name}`, requiresManualAction: false, screenOverview: true }));
    steps.splice(steps.findIndex(step => step.id === 'open_phone'), 0, ...menuLessons);
    const fundingIndex = steps.findIndex(step => step.id === 'welcome_2');
    const [fundingStep] = steps.splice(fundingIndex, 1);
    steps.splice(steps.findIndex(step => step.id === 'open_phone'), 0, fundingStep);
    return compactAnnaLessons(steps, { nickname, stockName: stockId ? stockName : null });
}
