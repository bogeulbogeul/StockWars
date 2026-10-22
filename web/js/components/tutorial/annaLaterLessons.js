export function annaLaterLessons({ nickname, stockName, stockId, recommendationLead, callbacks, highlightElement, highlightStock, cleanupHighlights, overlay }) {
    return [
        {
            id: 'portfolio_slots_guide',
            expression: 'Smile',
            speaker: '전담 매니저 모아',
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
            speaker: '전담 매니저 모아',
            text: '슬롯 자리가 모두 찼을 때 새로운 종목을 매수하려면 보유 종목 하나를 전량 매도하거나 슬롯을 늘려야 해요. 일부만 팔면 그 종목을 계속 보유하므로 자리가 비지 않아요. 같은 종목의 추가 매수는 새 슬롯을 쓰지 않지만 현금은 확인해야 해요. 내 계좌에서 사용 중인 슬롯과 최대 슬롯을 확인할 수 있어요.',
            tracker: '2/4 • 슬롯을 비우는 방법',
            requiresManualAction: false
        },
        {
            id: 'portfolio_slots_trait',
            expression: 'Smile',
            speaker: '전담 매니저 모아',
            text: '공격적 자산가 성향에는 종목 슬롯 +2칸 보너스가 적용돼요. 슬롯이 늘어나도 투자할 현금이 늘어나는 것은 아니니, 여러 종목을 살 때는 생활비와 남은 현금도 함께 살펴보세요.',
            tracker: '2/4 • 성향과 종목 슬롯',
            requiresManualAction: false,
            onEnter: () => cleanupHighlights()
        },
        {
            id: 'trade_history_guide',
            expression: 'Smile',
            speaker: "전담 매니저 모아",
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
            speaker: "전담 매니저 모아",
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
            speaker: '전담 매니저 모아',
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
            speaker: '전담 매니저 모아',
            text: '여기에는 기업 공시와 뉴스가 모여 있어요. 카드를 누르면 기사 본문을 읽을 수 있고, 기사창 오른쪽 위 [✕]로 닫을 수 있어요. 제목뿐 아니라 본문에서 어떤 일이 생겼는지 확인해 보세요. 좋은 소식이라도 주가 상승을 보장하지는 않아요. 읽는 방법을 확인했으면 [다음 ▶]을 눌러 주세요.',
            tracker: '2/4 • 뉴스 본문 읽는 방법',
            requiresManualAction: false,
            onEnter: () => highlightElement('#newsListContainer', true)
        },

        // STEP 8: Town Exploration Proposal for Seed Money
        {
            id: 'stock_basics_news_expectations', expression: 'Standard', speaker: '전담 매니저 모아',
            text: '좋은 뉴스가 나와도 주가가 꼭 오르지는 않아요. 사람들이 이미 그 소식을 예상해서 먼저 샀다면 기대가 가격에 반영되어 있을 수 있어요. 제목만 보고 결정하기보다 실제 내용이 기존 기대보다 좋은지, 발표 이후에도 근거가 유지되는지 살펴보세요.',
            tracker: '2/4 • 뉴스와 시장의 기대', requiresManualAction: false
        },
        {
            id: 'put_phone_away',
            expression: 'Smile', speaker: '모아',
            text: '밖으로 나가기 전에 스마트폰을 넣어볼게요. 스마트폰 밖의 빈 공간을 눌러 스마트폰을 집어넣어 주세요.',
            tracker: '3/4 • 스마트폰 집어넣기', requiresManualAction: true,
            example: { label: '직접 해보기', rows: ['스마트폰 바깥 빈 공간을 누르세요.'] },
            nextAction: '스마트폰 밖의 빈 공간을 누르세요.'
        },
        {
            id: 'movement_keys_guide',
            expression: 'Smile', speaker: '모아',
            text: '캐릭터는 키보드의 W·A·S·D로 움직일 수 있어요. 직접 움직여 보고, 준비되면 [다음 ▶]을 눌러 주세요.',
            tracker: '3/4 • 이동 방법 알아보기', requiresManualAction: false,
            example: { label: '이동 키', rows: ['W: 위 · S: 아래', 'A: 왼쪽 · D: 오른쪽'] }
        },
        {
            id: 'go_town_proposal',
            expression: 'Standard',
            speaker: "전담 매니저 모아",
            text: `이번에는 마을을 둘러볼게요. 7일 차에는 월세 5,000G가 필요해요. 이동은 [W·A·S·D], 문 앞에서 상호작용은 [F] 키예요. 먼저 오피스 문을 눌러 타운으로 나가 주세요.`,
            tracker: "3/4 • 타운 외출",
            requiresManualAction: true,
            interactionHint: "오피스 문을 클릭하거나 문 앞에서 [F] 키를 눌러 타운으로 나가주세요!",
            targetSelector: '#isoOfficeDoor',
            onEnter: () => {
                highlightElement('#isoOfficeDoor', true);
                highlightElement('#isoDoorPrompt', true);
            }
        },

        // STEP 9: Enter town
        {
            id: 'server_overview', speaker: '모아', expression: 'Smile',
            text: '여기는 타운 채널 선택 화면이에요. 같은 채널에 접속한 플레이어끼리 마을에서 만날 수 있어요. 접속 현황부터 살펴볼게요.',
            tracker: '3/4 • 타운 채널 선택 화면', requiresManualAction: false, screenOverview: true
        },
        {
            id: 'server_population', speaker: '모아', expression: 'Smile',
            text: '동시 접속자는 서버에 연결된 인원, 활성 채널은 현재 열린 마을 수예요. 위쪽 선택 채널 표시로 지금 어느 채널에 있는지 확인할 수 있어요.',
            tracker: '3/4 • 접속 현황 확인', requiresManualAction: false,
            example: { label: '접속 현황', rows: ['오피스/대기 표시는 아직 마을에 입장하지 않은 상태예요.'] }
        },
        {
            id: 'server_channels', speaker: '모아', expression: 'Smile',
            text: '각 타운 카드에는 접속 인원과 정원, 혼잡도가 보여요. ms는 서버 응답 시간이며 낮을수록 응답이 빨라요.',
            tracker: '3/4 • 채널 정보 읽기', requiresManualAction: false,
            example: { label: '혼잡도', rows: ['쾌적: 0~44% · 보통: 45~84% · 혼잡: 85% 이상'] }
        },
        {
            id: 'server_enter', speaker: '모아', expression: 'Smile',
            text: '타운 카드를 누르면 그 마을로 들어가요. [빠른 접속]으로 추천 채널에 들어갈 수도 있어요. 이제 입장해 보세요.',
            tracker: '3/4 • 타운 입장하기', requiresManualAction: true,
            targetSelector: '#townChannelsGrid, #btnQuickConnect',
            example: { label: '직접 입장하기', rows: ['원하는 타운 카드 또는 [빠른 접속]을 누르세요.'] }
        },
        // STEP 13: Independent trading
        {
            id: 'stock_basics_budget', expression: 'Standard', speaker: '전담 매니저 모아',
            text: '마지막으로 생활비로 쓸 돈은 남겨 두세요. 7일 차 월세 5,000G를 준비해야 하니 가진 현금을 전부 투자하면 곤란할 수 있어요. 한 종목에 돈을 모두 넣으면 그 종목이 떨어질 때 손해도 크게 몰려요. 여러 종목에 나눠 투자하면 한 기업에 대한 의존을 줄일 수 있지만, 함께 하락할 수도 있어요.',
            tracker: '4/4 • 생활비와 투자금 나누기', requiresManualAction: false
        },
        {
            id: 'tutorial_completed',
            expression: 'Happy',
            speaker: "전담 매니저 모아",
            text: `기본 안내를 모두 마쳤어요! 아래 [자립 트레이딩 시작하기!]를 누르면 첫 거래 안내를 마치고 정착 지원금 2,000G를 받아요. 이제 주식 거래를 배우며 7일 차 월세 5,000G를 준비해 주세요.`,
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
