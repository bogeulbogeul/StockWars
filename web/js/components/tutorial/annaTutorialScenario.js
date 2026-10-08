/**
 * Anna Tutorial Scenario Builder
 * Contains the dialogue sequence and step definitions for the Railroad Onboarding sequence.
 * GDD Reference: CORE_GDD_10 (v2.0.0)
 */

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

    return [
        // STEP 1: Welcome to Office & Initial Funds
        {
            id: 'welcome_1',
            expression: 'Happy',
            speaker: "전담 매니저 안나",
            text: `환영해요, ${nickname} 님! 저는 첫 거래를 함께할 매니저 안나예요. 한 번에 하나씩 안내할게요. 대사를 다 읽었으면 오른쪽 [다음 ▶]이나 단축키 [Enter]를 눌러 주세요. 놓친 설명은 [◀ 이전]으로 다시 볼 수 있어요.`,
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
            speaker: "전담 매니저 안나",
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
            id: 'open_phone',
            expression: 'Smile',
            speaker: "전담 매니저 안나",
            text: `오른쪽 아래 📱 스마트폰 버튼을 눌러 주세요. 단축키 [P]로도 열고 닫을 수 있어요. 주식을 사고팔 때 사용할 화면이에요.`,
            tracker: "2/4 • 스마트폰 화면 켜기",
            requiresManualAction: true,
            interactionHint: "우측 하단의 [스마트폰] 버튼을 클릭해 화면을 켜주세요!",
            targetSelector: '#floatingPhoneBtn',
            onEnter: () => {
                highlightElement('#floatingPhoneBtn', true);
                highlightElement('#btnToggleFrame', true);
            }
        },

        // STEP 3: Launch 사이퍼M Stock App
        {
            id: 'launch_stock_app',
            expression: 'Smile',
            speaker: "전담 매니저 안나",
            text: `스마트폰 홈 화면에서 [사이퍼M] 아이콘을 눌러 주세요. 주식 가격과 내 계좌를 확인하는 앱이에요.`,
            tracker: "2/4 • [📈 사이퍼M] HTS 앱 실행",
            requiresManualAction: true,
            interactionHint: "홈 화면의 [📈 사이퍼M] 앱 아이콘을 클릭해주세요!",
            targetSelector: '#iconStockApp',
            onEnter: () => {
                highlightElement('#iconStockApp', true);
            }
        },

        // STEP 4: Navigate to Stock Market Tab
        {
            id: 'market_tab',
            expression: 'Standard',
            speaker: "전담 매니저 안나",
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
            id: 'stock_basics_ownership', expression: 'Smile', speaker: '전담 매니저 안나',
            text: '주식은 기업의 지분이에요. 1주를 사면 그 기업의 작은 일부를 갖게 되는 거죠. 종목은 거래할 주식의 종류를 뜻해요. 기업마다 사업과 상황이 다르니, 어떤 기업의 주식인지부터 살펴보세요.',
            tracker: '2/4 • 주식과 종목 알아보기', requiresManualAction: false
        },
        {
            id: 'select_stock',
            expression: 'Smile',
            speaker: "전담 매니저 안나",
            text: stockId ? `목록 맨 위에서 [안나 추천] 표시가 붙은 '${stockName}'을 눌러 주세요. 지금 현금으로 살 수 있는 종목이에요. 누르면 가격 그래프와 매수 버튼이 나옵니다.` : '현재 현금으로 살 수 있는 종목이 없어요. 시장을 계속 확인하고 구매 가능한 종목이 생기면 추천해 드릴게요.',
            tracker: `2/4 • '${stockName}' 선택`,
            requiresManualAction: true,
            interactionHint: `종목 목록에서 '${stockName}'을(를) 클릭해 매매 창을 열어주세요!`,
            targetSelector: `.stock-item-row[data-id="${stockId}"]`,
            onEnter: () => {
                highlightStock(stockId, true);
            }
        },

        {
            id: 'stock_basics_price', expression: 'Standard', speaker: '전담 매니저 안나',
            text: '주가는 주식 1주가 거래되는 가격이에요. 기업 실적과 앞으로의 기대, 시장 분위기에 따라 사고 싶은 사람과 팔고 싶은 사람이 달라지면서 가격도 움직여요. 가격 그래프는 그동안 주가가 어떻게 변했는지 보여줍니다.',
            tracker: '2/4 • 주가가 움직이는 이유', requiresManualAction: false
        },
        {
            id: 'chart_colors', expression: 'Standard', speaker: '전담 매니저 안나',
            text: '가격 그래프는 미국 시장 방식으로 표시해요. 상승은 청록색, 하락은 빨간색이에요. 한국 시장에서 익숙한 색과 반대라 헷갈릴 수 있어요. 색과 함께 가격 옆의 +·− 숫자도 확인해 주세요. 읽었으면 [다음 ▶]을 눌러 주세요.',
            tracker: '2/4 • 그래프 색상 읽기', requiresManualAction: false
        },
        {
            id: 'chart_detail', expression: 'Smile', speaker: '전담 매니저 안나',
            text: '매매 창의 가격 그래프를 누르면 정밀 차트를 열 수 있어요. 더 큰 화면에서 가격 흐름을 자세히 살펴볼 수 있답니다. 정밀 차트는 오른쪽 위 닫기 버튼으로 닫을 수 있어요. 설명을 다 읽었으면 [다음 ▶]이나 [Enter]를 눌러 주세요.',
            tracker: '2/4 • 정밀 차트 여는 방법', requiresManualAction: false,
            onEnter: () => highlightElement('#btnExpandChart', true)
        },
        {
            id: 'market_order_guide', expression: 'Standard', speaker: '전담 매니저 안나',
            text: '주문 방식에는 [시장가]와 [지정가]가 있어요. 시장가는 지금 거래할 수 있는 호가부터 순서대로 사고파는 방식이에요. 화면의 현재가와 실제 체결가는 다를 수 있고, 물량이 부족하면 일부만 체결될 수도 있어요. 사이퍼M에서는 가격 보호 범위 ±5%를 벗어나거나 현금·물량이 부족하면 남은 수량은 취소돼요.',
            tracker: '2/4 • 시장가 주문 알아보기', requiresManualAction: false,
            onEnter: () => highlightElement('#tradeOrderTypeControl', true)
        },
        {
            id: 'limit_order_guide', expression: 'Smile', speaker: '전담 매니저 안나',
            text: '지정가는 원하는 가격을 직접 입력하는 방식이에요. 400G로 매수하면 400G 이하에서, 매도하면 400G 이상에서만 체결돼요. 조건에 맞는 상대 주문이 없으면 기다리므로 바로 거래되지 않을 수 있어요. 사이퍼M의 대기 주문은 현금이나 주식을 미리 묶어두지 않아, 체결할 때 부족하면 취소됩니다. 첫 매수는 [시장가]로 진행해 볼게요.',
            tracker: '2/4 • 지정가 주문 알아보기', requiresManualAction: false,
            onEnter: () => {
                highlightElement('#tradeOrderTypeControl', true);
                highlightElement('#tradeLimitPrice', true);
            }
        },
        // STEP 6: Execute Buy Order
        {
            id: 'stock_basics_profit', expression: 'Smile', speaker: '전담 매니저 안나',
            text: '매수는 주식을 사는 것, 매도는 파는 것이에요. 예를 들어 1주를 400G에 사서 450G에 팔면 수수료를 빼기 전 이익은 50G예요. 350G에 팔면 50G 손해고요. 여러 주를 거래하면 주당 가격 차이에 주식 수를 곱하고, 매수·매도 수수료도 빼야 실제 손익을 알 수 있어요.',
            tracker: '2/4 • 매수·매도와 손익 계산', requiresManualAction: false
        },
        {
            id: 'buy_stock',
            expression: 'Standard',
            speaker: "전담 매니저 안나",
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
            speaker: "전담 매니저 안나",
            text: `'${stockName}'을 샀어요! 산 주식과 남은 현금을 함께 확인해 볼게요.`,
            tracker: "2/4 • 첫 매수 체결 성공",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
        },
        {
            id: 'close_trade_guide',
            expression: 'Smile',
            speaker: "전담 매니저 안나",
            text: '이제 종목창을 닫고 내 계좌를 확인해 볼까요? 종목창 오른쪽 위의 [✕] 버튼을 눌러 주세요.',
            tracker: "2/4 • 종목창 닫기",
            requiresManualAction: true,
            interactionHint: '종목창 오른쪽 위에서 반짝이는 [✕] 버튼을 눌러 주세요!',
            targetSelector: '#btnCloseTradeModal',
            onEnter: () => highlightElement('#btnCloseTradeModal', true)
        },
        {
            id: 'portfolio_guide',
            expression: 'Smile',
            speaker: "전담 매니저 안나",
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
            id: 'social_and_ranking_guide',
            expression: 'Happy',
            speaker: "전담 매니저 안나",
            text: `내 계좌의 평가 손익은 보유 주식을 현재 가격으로 계산한 이익이나 손해예요. 주가가 변하면 이 숫자도 달라지고, 실제로 팔리는 가격은 다를 수 있어요. 매도한 주식의 손익은 실현 손익으로 기록되며, 거래 내역에서는 수수료를 반영한 결과를 확인할 수 있어요.`,
            tracker: "2/4 • 평가 손익 확인",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
        },

        {
            id: 'portfolio_slots_guide',
            expression: 'Smile',
            speaker: '전담 매니저 안나',
            text: '종목 보유 슬롯은 서로 다른 종목을 담을 수 있는 자리예요. 같은 종목을 여러 주 보유해도 슬롯은 하나만 사용해요. 예를 들어 A기업 10주와 B기업 1주를 갖고 있다면 2칸을 쓰는 거죠. 주식 수와 종목 수를 구분해 주세요. 기본 슬롯은 5칸이고, 운용력을 한 단계 올릴 때마다 5칸씩 늘어나요.',
            tracker: '2/4 • 종목 보유 슬롯 알아보기',
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
                highlightElement('#portfolioSlotStatus', true);
                highlightElement('#portfolioListContainer', true);
            }
        },
        {
            id: 'portfolio_slots_capacity',
            expression: 'Standard',
            speaker: '전담 매니저 안나',
            text: '슬롯 자리가 모두 찼을 때 새로운 종목을 매수하려면 보유 종목 하나를 전량 매도하거나 슬롯을 늘려야 해요. 일부만 팔면 그 종목을 계속 보유하므로 자리가 비지 않아요. 같은 종목의 추가 매수는 새 슬롯을 쓰지 않지만 현금과 매수 한도는 확인해야 해요. 내 계좌에서 사용 중인 슬롯과 최대 슬롯, 종목별 투자 한도를 확인할 수 있어요.',
            tracker: '2/4 • 슬롯을 비우는 방법',
            requiresManualAction: false
        },
        {
            id: 'portfolio_slots_trait',
            expression: 'Smile',
            speaker: '전담 매니저 안나',
            text: '공격적 자산가 성향에는 종목 슬롯 +2칸 보너스가 적용돼요. 슬롯이 늘어나도 투자할 현금이 늘어나는 것은 아니니, 여러 종목을 살 때는 생활비와 남은 현금도 함께 살펴보세요.',
            tracker: '2/4 • 성향과 종목 슬롯',
            requiresManualAction: false,
            onEnter: () => cleanupHighlights()
        },
        {
            id: 'trade_history_guide',
            expression: 'Smile',
            speaker: "전담 매니저 안나",
            text: `내 계좌 아래쪽에 [거래 내역]이 있어요. 지금 열어 두었으니 방금 산 '${stockName}'의 기록을 확인해 보세요. 체결된 거래가 최신순으로 쌓이고, 언제 몇 주를 얼마에 샀거나 팔았는지 볼 수 있어요. 나중에도 메뉴를 눌러 열고 닫을 수 있답니다.`,
            tracker: "2/4 • 거래 내역 확인",
            requiresManualAction: false,
            onEnter: () => {
                const menu = document.querySelector('.trade-history-menu');
                if (menu) {
                    menu.open = true;
                    menu.querySelector('summary')?.scrollIntoView({ block: 'start', behavior: 'auto' });
                }
                highlightElement('.trade-history-menu > summary', true);
            }
        },
        {
            id: 'trade_history_fees',
            expression: 'Standard',
            speaker: "전담 매니저 안나",
            text: `거래마다 평균 체결가와 수수료, 실제로 줄거나 늘어난 현금이 표시돼요. 매도 기록에서는 수수료를 반영한 실현 손익도 확인할 수 있어요. [가격별 체결]을 누르면 각각의 가격에 몇 주씩 체결됐는지도 볼 수 있답니다. 확인했으면 [다음 ▶]을 눌러 주세요.`,
            tracker: "2/4 • 수수료와 체결 결과 읽기",
            requiresManualAction: false,
            onEnter: () => {
                highlightElement('#tradeHistoryList > .trade-history-row', true);
            }
        },

        {
            id: 'news_tab_guide',
            expression: 'Smile',
            speaker: '전담 매니저 안나',
            text: '첫 매수와 계좌 확인을 마쳤네요! 이번에는 기업에 어떤 소식이 있는지 살펴볼까요? 스마트폰 아래쪽의 [공시 뉴스] 탭을 눌러 주세요.',
            tracker: '2/4 • 공시와 뉴스 살펴보기',
            requiresManualAction: true,
            interactionHint: '스마트폰 하단의 [공시 뉴스] 탭을 눌러 주세요!',
            targetSelector: '.nav-tab[data-tab="News"]',
            onEnter: () => highlightElement('.nav-tab[data-tab="News"]', true)
        },
        {
            id: 'news_reading_guide',
            expression: 'Standard',
            speaker: '전담 매니저 안나',
            text: '여기에는 기업 공시와 뉴스가 모여 있어요. 카드를 누르면 기사 본문을 읽을 수 있고, 기사창 오른쪽 위 [✕]로 닫을 수 있어요. 제목뿐 아니라 본문에서 어떤 일이 생겼는지 확인해 보세요. 좋은 소식이라도 주가 상승을 보장하지는 않아요. 읽는 방법을 확인했으면 [다음 ▶]을 눌러 주세요.',
            tracker: '2/4 • 뉴스 본문 읽는 방법',
            requiresManualAction: false,
            onEnter: () => highlightElement('#newsListContainer', true)
        },

        // STEP 8: Town Exploration Proposal for Seed Money
        {
            id: 'stock_basics_news_expectations', expression: 'Standard', speaker: '전담 매니저 안나',
            text: '좋은 뉴스가 나와도 주가가 꼭 오르지는 않아요. 사람들이 이미 그 소식을 예상해서 먼저 샀다면 기대가 가격에 반영되어 있을 수 있어요. 제목만 보고 결정하기보다 실제 내용이 기존 기대보다 좋은지, 발표 이후에도 근거가 유지되는지 살펴보세요.',
            tracker: '2/4 • 뉴스와 시장의 기대', requiresManualAction: false
        },
        {
            id: 'go_town_proposal',
            expression: 'Standard',
            speaker: "전담 매니저 안나",
            text: `이번에는 생활비를 벌어볼게요. 7일 차에는 월세 5,000G가 필요해요. 이동은 [W·A·S·D], 문 앞에서 상호작용은 [F] 키예요. 먼저 오피스 문을 눌러 타운으로 나가 주세요.`,
            tracker: "3/4 • 타운 외출 (시드머니 확충)",
            requiresManualAction: true,
            interactionHint: "오피스 문을 클릭하거나 문 앞에서 [F] 키를 눌러 타운으로 나가주세요!",
            targetSelector: '#isoOfficeDoor',
            onEnter: () => {
                highlightElement('#isoOfficeDoor', true);
                highlightElement('#isoDoorPrompt', true);
            }
        },

        // STEP 9: Enter Bit Logistics Hub in Town
        {
            id: 'enter_logistics',
            expression: 'Standard',
            speaker: "전담 매니저 안나",
            text: `타운의 [비트 물류센터]로 들어가 주세요. 캐릭터 위의 노란 화살표를 따라 이동해 주세요. 입구에 도착하면 [F] 키를 눌러 들어가세요.`,
            tracker: "3/4 • 비트 물류센터 진입",
            requiresManualAction: true,
            interactionHint: "마을 남서쪽의 [📦 비트 물류센터]를 클릭하거나, 입구 앞에서 [F] 키를 눌러 들어가세요!",
            targetSelector: '.town-building-slot[data-id="bit_logistics"]',
            onEnter: () => {
                highlightElement('.town-building-slot[data-id="bit_logistics"]', true);
            }
        },

        // STEP 10: Rumor & Inventory Guide
        {
            id: 'rumor_inventory_guide',
            expression: 'Smile',
            speaker: "전담 매니저 안나",
            text: `물류 일을 마쳤어요! 보상으로 돈과 [비트 물류 현장 찌라시]를 받았어요. 화면 위쪽의 [소지품] 버튼을 눌러 주세요. 단축키 [I]로도 열고 닫을 수 있어요.`,
            tracker: "3/4 • 찌라시 및 인벤토리 확인",
            requiresManualAction: true,
            interactionHint: "상단 메뉴의 [🎒 소지품] 버튼을 클릭하거나 I 키를 눌러 인벤토리를 열어주세요!",
            targetSelector: '#btnHudInventory',
            onEnter: () => {
                overlay?.classList.remove('hidden');
                highlightElement('#btnHudInventory', true);
            }
        },

        // STEP 11: Rumor Intel & Analysis Guide
        {
            id: 'rumor_intel_explain',
            expression: 'Standard',
            speaker: "전담 매니저 안나",
            text: `소지품에서 찌라시를 선택하면 [찌라시 열람]으로 읽을 수 있어요. 분석력에 따라 같은 사건도 다르게 보입니다. 지금부터 실제 보상과 별개인 연습용 예시로 종목·사건·방향·시간 단서를 찾아볼게요.`,
            tracker: "3/4 • 찌라시 활용법 안내",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
        },

        {
            id: 'rumor_time_prediction', expression: 'Smile', speaker: '전담 매니저 안나',
            text: '연습용 소문이에요. “푸른 전기 저장고에 큰 수레꾼이 찾아왔대. 이틀 뒤 잔치에서 천막이 걷히면 간판도 들썩이겠지.” 이 소문은 언제 시장에 영향을 줄까요? 정답을 맞히지 못해도 불이익은 없어요.',
            tracker: '3/4 • 시간 단서 예상하기', requiresManualAction: true,
            choices: [
                { label: '지금 바로', feedback: '“찾아왔다”는 정황만으로 지금 바로 움직인다고 단정할 수는 없어요.' },
                { label: '이틀 뒤 발표 전후', feedback: '좋아요! “이틀 뒤 잔치에서 천막이 걷힌다”가 발표 시점의 단서예요.' },
                { label: '시점은 전혀 알 수 없음', feedback: '정확한 체결 시각은 몰라도 “이틀 뒤”라는 단서로 예상 범위를 잡을 수 있어요.' }
            ],
            interactionHint: '아래에서 예상 시점을 하나 선택해 주세요.'
        },
        {
            id: 'rumor_time_feedback', expression: 'Standard', speaker: '전담 매니저 안나',
            text: '“이틀 뒤 잔치”는 발표 일정의 단서예요. 사건이 발표될 시점과 주가가 반응할 시점은 다를 수 있어요. 기대가 먼저 반영되거나 발표가 늦어질 수도 있으니, 확정 시각으로 읽지 마세요.',
            tracker: '3/4 • 발표 시점과 시장 반응', requiresManualAction: false,
            actionBtnText: '분석력별 모습 비교하기', onAction: tutorial => tutorial.nextStep()
        },
        ...[
            ['1', '푸른 전기 저장고에 큰 수레꾼이 찾아왔대. 이틀 뒤 잔치에서 천막이 걷히면 간판도 들썩이겠지.', '이름과 사건은 비유지만 “이틀 뒤”라는 시간 단서는 남아 있어요.'],
            ['2', '친환경 에너지 업체가 자동차 큰손에게 새 배터리를 혼자 공급한다는 소문이야. 이틀 뒤 엑스포에서 이야기가 나오면 위로 움직일 듯해.', '업종과 상승 방향이 보이고, 엑스포가 발표 시점의 근거가 돼요.'],
            ['3', '에너지 섹터 호재야. 전고체 배터리 업체가 글로벌 완성차 1위와 독점 공급 계약을 맺었다는 얘기지. 이틀 뒤 모빌리티 엑스포 발표가 상승 계기가 될 전망이래.', '사건·방향·시점으로 후보 종목을 좁혀 보세요. 기업명과 계약 금액은 아직 알 수 없어요.'],
            ['4', '에코 배터리가 글로벌 완성차 1위와 전고체 배터리 독점 공급 계약을 체결했다는 첩보야. 이틀 뒤 모빌리티 엑스포에서 발표할 거래. 계약 금액은 더 확인해야 해.', '기업과 구체적인 사건이 드러나도, 발표 전후 상승이 확정되는 것은 아니에요.'],
            ['5', '에코 배터리가 글로벌 완성차 1위와 5조 원 규모의 전고체 배터리 독점 공급 계약을 체결했다는 첩보야. 이틀 뒤 모빌리티 엑스포에서 발표할 거래.', '원문의 금액·일정까지 읽어도 진위나 수익을 보장하지 않아요.']
        ].map(([level, example, explanation]) => ({
            id: `rumor_analysis_example_${level}`, expression: 'Standard', speaker: '전담 매니저 안나',
            text: `[연습용 · 분석력 ${level}단계] “${example}” ${explanation}`,
            tracker: `3/4 • 같은 찌라시 비교 (${level}/5)`, requiresManualAction: false
        })),
        {
            id: 'rumor_reading_summary', expression: 'Smile', speaker: '전담 매니저 안나',
            text: '찌라시에서는 어느 종목인지, 어떤 사건인지, 어느 방향인지, 언제 영향을 줄지를 함께 예상해 보세요. 분석력이 높아지면 단서가 구체적으로 보이지만 정답을 보장하지는 않아요. 실제 찌라시는 현재 분석력과 해당 정보의 유지 해석 단계 중 높은 단계로 보여요. 뉴스와 공시로 근거·일정을 확인해 주세요. 예시는 [◀ 이전]으로 다시 비교할 수 있어요.',
            tracker: '3/4 • 찌라시 해석 정리', requiresManualAction: false
        },

        // STEP 12: Stamina Recovery Guide
        {
            id: 'stamina_recovery_guide',
            expression: 'Pain',
            speaker: "전담 매니저 안나",
            text: `물류 일을 하면 체력이 줄어요. 체력이 부족하면 일을 시작할 수 없어요. 타운의 벤치에서 쉬면 체력을 회복할 수 있습니다.`,
            tracker: "3/4 • 기력 관리 안내",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
        },

        // STEP 13: Graduation after Logistics Labor
        {
            id: 'stock_basics_budget', expression: 'Standard', speaker: '전담 매니저 안나',
            text: '마지막으로 생활비로 쓸 돈은 남겨 두세요. 7일 차 월세 5,000G를 준비해야 하니 가진 현금을 전부 투자하면 곤란할 수 있어요. 한 종목에 돈을 모두 넣으면 그 종목이 떨어질 때 손해도 크게 몰려요. 여러 종목에 나눠 투자하면 한 기업에 대한 의존을 줄일 수 있지만, 함께 하락할 수도 있어요.',
            tracker: '4/4 • 생활비와 투자금 나누기', requiresManualAction: false
        },
        {
            id: 'logistics_completed',
            expression: 'Happy',
            speaker: "전담 매니저 안나",
            text: `기본 안내를 모두 마쳤어요! 아래 [자립 트레이딩 시작하기!]를 누르면 첫 거래 안내를 마치고 정착 지원금 2,000G를 받아요. 이제 주식 거래와 물류 일을 하며 7일 차 월세 5,000G를 준비해 주세요.`,
            tracker: "4/4 • 튜토리얼 완료 (자립 시작)",
            actionBtnText: "🚀 자립 트레이딩 시작하기!",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
                overlay?.classList.remove('hidden');
            },
            onAction: (tutorialInstance) => {
                tutorialInstance.complete();
            }
        }
    ];
}
