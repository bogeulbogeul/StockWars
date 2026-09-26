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
        : `${nickname} 님의 투자 프로필과 오늘 시장 수급 분석 결과, 가장 확실한 상승 유망주 '${stockName}'을(를) 추천해요.`;

    return [
        // STEP 1: Welcome to Office & Initial Funds
        {
            id: 'welcome_1',
            speaker: "전담 매니저 안나",
            text: `환영해요, ${nickname} 파트너님! 여기가 앞으로 우리가 함께할 전용 홈 오피스예요. 옥상에서 내려다보는 사이퍼 시티 전경이 정말 근사하죠?`,
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
            speaker: "전담 매니저 안나",
            text: `사이퍼 증권 트레이더 등록 축하금으로 초기 지원금 5,000 Gold가 계좌로 안전하게 입금되었습니다.`,
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
            speaker: "전담 매니저 안나",
            text: `본격적인 주식 매매를 위해 우측 하단의 [스마트폰] 버튼을 눌러 화면을 켜볼까요?`,
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
            speaker: "전담 매니저 안나",
            text: `스마트폰이 켜졌네요! 홈 화면에서 [📈 사이퍼M] 주식 앱 아이콘을 터치해 HTS를 실행해 보세요!`,
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
            speaker: "전담 매니저 안나",
            text: `사이버 시티 모바일 HTS에 접속했습니다! 하단 메뉴에서 [📈 주식 거래] 탭을 눌러 시장에서 거래 중인 종목들을 확인해 보세요.`,
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
            speaker: "전담 매니저 안나",
            text: `${recommendationLead} '${stockName}'을(를) 눌러 매매 창을 열어보세요!`,
            tracker: `2/4 • '${stockName}' 선택`,
            requiresManualAction: true,
            interactionHint: `종목 목록에서 '${stockName}'을(를) 클릭해 매매 창을 열어주세요!`,
            targetSelector: `.stock-item-row[data-id="${stockId}"]`,
            onEnter: () => {
                highlightStock(stockId, true);
            }
        },

        // STEP 6: Execute Buy Order
        {
            id: 'buy_stock',
            speaker: "전담 매니저 안나",
            text: `실시간 5단 호가창과 차트를 확인하셨나요? 하단의 [📈 매수 (BUY)] 버튼을 눌러 '${stockName}' 1주를 매수해 보세요!`,
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
            speaker: "전담 매니저 안나",
            text: `축하합니다! '${stockName}' 1주 매수 주문이 성공적으로 체결되었습니다! 🎉 벌써 주가가 오르며 실시간 수익이 발생하고 있어요.`,
            tracker: "2/4 • 첫 매수 체결 성공",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
        },
        {
            id: 'portfolio_guide',
            speaker: "전담 매니저 안나",
            text: `매수한 주식은 스마트폰의 [👤 내 계좌] 탭에서 방금 매수한 '${stockName}'의 실시간 플러스(+) 수익률과 평가 손익을 언제든 확인할 수 있답니다.`,
            tracker: "2/4 • 포트폴리오 관리 안내",
            requiresManualAction: true,
            interactionHint: "스마트폰 하단의 [👤 내 계좌] 탭을 눌러 포트폴리오를 확인해보세요!",
            targetSelector: '.nav-tab[data-tab="Profile"]',
            onEnter: () => {
                highlightElement('.nav-tab[data-tab="Profile"]', true);
            }
        },

        // STEP 8: Town Exploration Proposal for Seed Money
        {
            id: 'go_town_proposal',
            speaker: "전담 매니저 안나",
            text: `첫 매수는 성공적이었어요! 하지만 더 큰 우량주를 매수하고 7일 차 월세(5,000G)를 안정적으로 준비하려면 초기 시드머니가 더 필요해요. 타운의 [비트 물류센터]로 나가 일당을 벌어볼까요? 오피스 문을 열고 타운 거리로 나가보세요!`,
            tracker: "3/4 • 타운 외출 (시드머니 확충)",
            requiresManualAction: true,
            interactionHint: "오피스 문을 클릭하거나 문 앞에서 [F] 키를 눌러 타운으로 나가주세요!",
            targetSelector: '#isoOfficeDoor',
            onEnter: () => {
                highlightElement('#isoOfficeDoor', true);
                highlightElement('#isoDoorPrompt', true);
                highlightElement('#officeDoorFloatingBtn', true);
            }
        },

        // STEP 9: Enter Bit Logistics Hub in Town
        {
            id: 'enter_logistics',
            speaker: "전담 매니저 안나",
            text: `사이퍼 타운 거리에 도착했습니다! 우측으로 이동하여 노란 간판의 [📦 비트 물류센터]로 들어가 관리소장 박씨를 만나보세요!`,
            tracker: "3/4 • 비트 물류센터 진입",
            requiresManualAction: true,
            interactionHint: "타운 우측의 [📦 비트 물류센터]를 클릭하거나 문 앞에서 [F] 키를 눌러 진입하세요!",
            targetSelector: '.town-building-slot[data-id="bit_logistics"]',
            onEnter: () => {
                highlightElement('.town-building-slot[data-id="bit_logistics"]', true);
            }
        },

        // STEP 10: Rumor & Inventory Guide
        {
            id: 'rumor_inventory_guide',
            speaker: "전담 매니저 안나",
            text: `수고 많으셨어요, ${nickname} 파트너님! 시드머니와 함께 물류 현장 동료로부터 **[📜 비트 물류 현장 찌라시]**를 입수하셨네요! 상단 메뉴의 **[🎒 소지품]** 버튼(또는 TAB / I 키)을 눌러 입수한 찌라시를 확인해 보세요!`,
            tracker: "3/4 • 찌라시 및 인벤토리 확인",
            requiresManualAction: true,
            interactionHint: "상단 메뉴의 [🎒 소지품] 버튼을 클릭하거나 TAB / I 키를 눌러 인벤토리를 열어주세요!",
            targetSelector: '#btnHudInventory',
            onEnter: () => {
                overlay?.classList.remove('hidden');
                highlightElement('#btnHudInventory', true);
            }
        },

        // STEP 11: Rumor Intel & Analysis Guide
        {
            id: 'rumor_intel_explain',
            speaker: "전담 매니저 안나",
            text: `소지품 창의 [📜 정보/찌라시] 탭에 방금 얻은 찌라시가 보관되어 있죠? 찌라시에는 특정 종목의 주가 급등이나 하락을 예고하는 강력한 단서가 담겨 있답니다. 시장 뉴스와 결합해 다음 투자 전략을 세워보세요!`,
            tracker: "3/4 • 찌라시 활용법 안내",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
        },

        // STEP 12: Stamina Recovery Guide
        {
            id: 'stamina_recovery_guide',
            speaker: "전담 매니저 안나",
            text: `앗, 그런데 상하차 노동으로 체력(스테미너)이 1칸 소모(💔)되었어요! 체력이 부족하면 추가 노동을 할 수 없답니다. 타운의 [🏪 비비안 잡화점]에서 음료를 사 마시거나 [마을 벤치]에서 쉬면 완충할 수 있어요.`,
            tracker: "3/4 • 기력 관리 안내",
            requiresManualAction: false,
            onEnter: () => {
                cleanupHighlights();
            }
        },

        // STEP 13: Graduation after Logistics Labor
        {
            id: 'logistics_completed',
            speaker: "전담 매니저 안나",
            text: `모든 기본 준비가 끝났습니다, ${nickname} 파트너님! 🎉 정착 보너스 지원금(2,000G)을 추가로 입금해 드렸어요. 이제 7일 동안 다양한 종목 분석과 찌라시를 총동원해 **7일 차 월세(5,000G)**를 갚고 최고의 펀드 매니저로 도약해 보세요!`,
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
