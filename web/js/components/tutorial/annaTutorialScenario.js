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
            text: `시작 자금 5,000G를 드렸어요. G는 게임에서 사용하는 돈이에요. 주식을 사면 현금이 줄고, 산 주식이 내 계좌에 들어옵니다.`,
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
        // STEP 6: Execute Buy Order
        {
            id: 'buy_stock',
            expression: 'Standard',
            speaker: "전담 매니저 안나",
            text: `'${stockName}'을 살 준비가 됐어요. 매수는 내 현금으로 주식을 사는 거래예요. 수량이 1주인지 확인한 뒤 아래 [매수 (BUY)] 버튼을 눌러 주세요. 체결된 가격만큼 현금이 줄어들어요.`,
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
            text: `내 계좌의 평가 손익은 지금 팔았을 때 예상되는 이익이나 손해예요. 주가가 변하면 이 숫자도 달라져요. 실제로 매도해야 실현 손익으로 확정됩니다.`,
            tracker: "2/4 • 소셜 네트워크 & 랭킹 안내",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
        },

        // STEP 8: Town Exploration Proposal for Seed Money
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
            text: `찌라시는 앞으로 주가가 움직일 수 있다는 단서예요. 반드시 맞는 정보는 아니니, 종목의 뉴스와 함께 살펴보세요.`,
            tracker: "3/4 • 찌라시 활용법 안내",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
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
            id: 'logistics_completed',
            expression: 'Happy',
            speaker: "전담 매니저 안나",
            text: `기본 안내를 모두 마쳤어요! 아래 [자립 트레이딩 시작하기!]를 누르면 튜토리얼이 끝나고 정착 보너스 2,000G를 받아요. 이제 주식 거래와 물류 일을 하며 7일 차 월세 5,000G를 준비해 주세요.`,
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
