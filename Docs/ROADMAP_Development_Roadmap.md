# StockWars: GIGDC 집중 개발 로드맵 (The Ultra-Atomic Roadmap v5.2.0)

**개발 기간:** 2026.05 ~ 2026.06 (GIGDC 출품 집중 기간)
**핵심 목표:** 6월 말까지 **[튜토리얼 ~ 캐릭터 레벨 3]** 구간의 버그 없는 **데모 버전(Demo Build)** 완성
**지시 방법:** "로드맵 [번호]번 개발해줘"라고 요청하세요.

> [!IMPORTANT]
> 본 로드맵은 GIGDC 출품(6월 말)을 최우선 순위로 하며, 핵심 재미 검증에 불필요한 시스템(건설, 기관 등)은 출품 이후로 연기합니다.

---

## 🏆 GIGDC 출품 집중 마일스톤 (5월 ~ 6월 말)

### 🗓️ Sprint 1: 5월 3~4주차 - 코어 인프라 및 엔진 기초 (001 ~ 055)

- [x] 001. **[CORE_GDD_01]** Unity 프로젝트 URP 템플릿 초기화 및 전역 렌더링 파이프라인 설정
- [x] 002. **[CORE_GDD_01]** 20종의 표준 폴더 아키텍처 생성 (Managers, Modules, Data, Art 등)
- [x] 003. **[CORE_GDD_01]** Git LFS 설정 및 대규모 텍스처/사운드 파일 관리 자동화 스크립트
- [x] 004. **[CORE_GDD_01]** `GameEnums.cs`: 주식 섹터, 아이템 등급, NPC 감정, 수배 상태 등 전역 열거형 정의
- [x] 005. **[CORE_GDD_01]** `GlobalConstants.cs`: 2.0% 이자율, 500G 유지비 등 모든 밸런스 상수 통합 관리
- [x] 006. **[CORE_GDD_01]** `Singleton<T>` 제네릭 추상 클래스 구현 (Thread-safe 고려)
- [x] 007. **[CORE_GDD_01]** `EventBus.cs`: `Action<T>` 기반 관찰자 패턴 핵심 엔진 구축
- [x] 008. **[CORE_GDD_01]** `PoolManager.cs`: 차트 캔들, UI 파티클용 고성능 오브젝트 풀링 시스템
- [x] 009. **[CORE_GDD_01]** `SceneSwitcher.cs`: 씬 전환 시 비동기 로딩 및 페이드인/아웃 연출 엔진
- [x] 010. **[CORE_GDD_06]** `TickEngine.cs`: 유저 PC 로컬 시간(Real-Time) 1:1 동기화 및 틱 이벤트 엔진
- [x] 011. **[CORE_GDD_06]** 🧠[Pro] `CalendarSystem.cs`: 요일/시간 연동 및 매주 월요일 00:00 기점 정산 트리거
- [x] 012. **[CORE_GDD_06]** 🧠[Pro] `DataSerializer.cs`: JSON.NET 기반 인코딩/복호화 및 압축 유틸리티
- [x] 013. **[CORE_GDD_06]** `SaveDataDTO.cs`: 계좌, 포트폴리오, 수배 상태를 포함한 마스터 저장 스키마
- [x] 014. **[CORE_GDD_06]** 🧠[Pro] `IOManager.cs`: 암호화된 세이브 파일 읽기/쓰기 및 파일 무결성 검증 로직
- [x] 015. **[CORE_GDD_06]** `SaveMetadata.cs`: 플레이 타임, 타임스탬프, 최종 접속 위치 자동 트래킹
- [x] 016. **[CORE_GDD_02]** 🤖[Claude] `StockDataSO`: IT 섹터(3종) 종목명, 상장가, 배당률(0.5~0.8%) 프로필화
- [x] 017. **[CORE_GDD_02]** 🤖[Claude] `StockDataSO`: 엔터/인프라 섹터(6종) 종목별 변동성 티어 매핑
- [ ] 018. **[CORE_GDD_02]** 🤖[Claude] `StockDataSO`: 바이오/항공우주 섹터(6종) 호재/악재 감도 가중치 설정
- [ ] 019. **[CORE_GDD_02]** 🤖[Claude] `StockDataSO`: 유통/에너지/금융 섹터(9종) 종목 마스터 데이터 구축
- [x] 020. **[CORE_GDD_02]** 🧠[Pro] `MarketManager.cs`: 96개 종목 인스턴스화 및 런타임 데이터 동기화
- [x] 021. **[CORE_GDD_02]** 🧠[Pro] `BasePriceInit.cs`: 섹터별 상장가 동적 생성 및 초기 유동 물량 할당
- [ ] 022. **[CORE_GDD_02]** 🤖[Claude] `RNG_System.cs`: 시드 기반 의사 난수 생성기를 이용한 주가 변동 정밀 제어
- [ ] 023. **[CORE_GDD_02]** 🤖[Claude] `PriceEngine.cs`: 매수 압력 및 변동성 가중치를 합산한 실시간 가격 결정부
- [ ] 024. **[CORE_GDD_02]** 🤖[Claude] `BuyPressure.cs`: 물량 고갈 시 가격 폭등을 유도하는 제곱근 함수 연산
- [ ] 025. **[CORE_GDD_02]** 🤖[Claude] `VolatilityTier.cs`: S~C 등급별 주당 최소/최대 변동폭 제한 로직
- [ ] 026. **[CORE_GDD_02]** 🤖[Claude] `TrendEngine.cs`: 168시간(7일) 주기의 상승/하락 사이클 전환 시스템
- [ ] 027. **[CORE_GDD_02]** 🧠[Pro] `CircularBuffer.cs`: 최근 168틱 가격 히스토리 저장을 위한 효율적 메모리 구조
- [ ] 028. **[CORE_GDD_02]** 🧠[Pro] `PeakTracker.cs`: 전고점(ATH) 및 당일 변동폭 실시간 트래킹 레이어
- [ ] 029. **[CORE_GDD_02]** 🧠[Pro] `MarketTimer.cs`: 게임 내 시간(날짜/요일) 흐름 제어 및 정산 주기 연동
- [ ] 030. **[CORE_GDD_02]** 🧠[Pro] `GhostTrader.cs`: 주말 휴장 없이 365일 초 단위로 주가를 움직이는 마이크로 변동 봇
- [ ] 031. **[CORE_GDD_02]** 🧠[Pro] `DividendController.cs`: 72시간 보유 조건 판정 및 배당금 누적 연산부
- [ ] 032. **[CORE_GDD_02]** 🧠[Pro] `SplitChecker.cs`: 1,000,000G 도달 시 액면분할 트리거 및 수량 보정 로직
- [ ] 033. **[CORE_GDD_02]** 🧠[Pro] `DelistingMonitor.cs`: 상장가 1% 미만 장기 체납 시 상폐 프로세스 감시
- [ ] 034. **[CORE_GDD_02]** 🧠[Pro] `IPO_Service.cs`: 상폐 공석 발생 시 대기 종목 풀에서 신규 상장 트리거
- [ ] 035. **[CORE_GDD_03]** 🧠[Pro] `WalletManager.cs`: 가용 현금, 누적 이자, 미지급 배당금의 실시간 정산부
- [ ] 036. **[CORE_GDD_03]** 🧠[Pro] `NetWorthCore.cs`: 포트폴리오 평가액 + 부동산 + 현물 자산 합산 연산 엔진
- [x] 037. **[CORE_GDD_03]** `LevelEngine.cs`: 누적 거래액 기반 레벨업 및 스탯 포인트 지급 루틴
- [ ] 038. **[CORE_GDD_03]** `StatCore.cs`: 협상력, 분석력, 운용력, 회복력 등 4대 능력치 갱신 및 데이터 보존부
- [ ] 039. **[CORE_GDD_03]** `ReputationSystem.cs`: 사회적 명성 등급(F~S) 산출 및 지위 버프 연동
- [ ] 040. **[CORE_GDD_03]** `ResilienceStat.cs`: **[회복력]** 레벨에 따른 일일 알바 횟수 확장(3~5회) 로직
- [ ] 041. **[CORE_GDD_01]** `AssetBundleLoader`: 배경 스프라이트 및 NPC 일러스트 비동기 로드 관리
- [ ] 042. **[CORE_GDD_01]** 🎨[Graphics] `GlobalPostPro`: 씬별 포스트 프로세싱(Vignette, Bloom, CRT) 프로필 설정
- [ ] 043. **[CORE_GDD_01]** 🎨[Graphics] `CursorManager`: 상황별 커서 아이템(돋보기, 손바닥) 변경 및 애니메이션
- [ ] 044. **[CORE_GDD_01]** `BGMController`: 씬 진입 시 크로스페이드 기반 배경음 전환 스크립트
- [ ] 045. **[CORE_GDD_06]** `TimeScaleController`: 개발용 배속 기능 및 연출용 타임 스톱 플러그인
- [ ] 046. **[CORE_GDD_06]** `ErrorLogger.cs`: 런타임 예외 발생 시 전용 팝업 및 로그 파일 추출 기능
- [ ] 047. **[CORE_GDD_05]** `UI_SafeArea`: 다양한 PC 해상도 및 윈도우 창 모드 대응 캔버스 조절 스크립트
- [ ] 048. **[CORE_GDD_05]** `UI_Navigation`: 백버튼 및 메인 메뉴 진입을 위한 전역 네비게이션 제어
- [ ] 049. **[CORE_GDD_05]** `UI_CanvasOrder`: 레이어 순서(Order in Layer) 최적화 및 드로우콜 관리
- [ ] 050. **[CORE_GDD_03]** `CareerPathInit`: 최초 시작 시 유저 성향에 따른 기본 스탯 분배 로직
- [ ] 051. **[CORE_GDD_02]** 🧠[Pro] `PriceNoise.cs`: 주간 평탄화 사이사이의 미세한 '노이즈' 가격 변동 연산부
- [ ] 052. **[CORE_GDD_02]** 🎨[Graphics] `MarketOpeningFX`: 개장 시 증권사 UI가 반짝이며 켜지는 시계 연출
- [ ] 053. **[CORE_GDD_06]** 🧠[Pro] `DataIntegrity.cs`: 매 프레임 세이브 데이터 변조를 감시하는 무결성 엔진
- [ ] 054. **[CORE_GDD_06]** `AutoSaveRouter`: 특정 주기 및 주요 상호작용 후 자동 저장 실행 가이드
- [ ] 055. **[CORE_GDD_01]** `DebugConsole`: 개발용 자금 주입 및 아이템 획득 치트 명령 프레임워크

---

### 🗓️ Sprint 2: 6월 1~2주차 - 금융 고도화 및 UI 시스템 (056 ~ 110)

- [ ] 056. **[CORE_GDD_04]** `DebtKernel`: 원금, 복리 이자, 정산일자 정보를 담은 부채 데이터 구조체
- [ ] 057. **[CORE_GDD_04]** 🧠[Pro] `InterestCycle`: 매주 월요일 00:00 2.0% 기본 이자 합산 및 트랜잭션 보장
- [ ] 058. **[CORE_GDD_04]** `AnnaWelcomeGift`: 최초 대출 시 168시간 무이자 플래그 및 타이머 작동
- [ ] 059. **[CORE_GDD_04]** 🧠[Pro] `LoanEvaluator`: 총자산/평판 대비 대출 가능 한도(최대 10,000G 초기값) 연산
- [ ] 060. **[CORE_GDD_04]** 🧠[Pro] `AutoRepayment.cs`: 배당금 발생 시 부채 원금을 우선 차감하는 자동 이체부
- [ ] 061. **[CORE_GDD_04]** 🧠[Pro] `ManualRepayment.cs`: 유저 입력 기반의 부분 상환 및 상환 후 이윤 재계산
- [ ] 062. **[CORE_GDD_04]** 🧠[Pro] `MarginShortLogic`: 공매도 시 주문가 150% 현금 동결 및 담보물 설정 로직
- [ ] 063. **[CORE_GDD_04]** 🧠[Pro] `MarginCallEngine`: 유지비율 90% 도달 시 경고, 100% 도달 시 강제 청산 루틴
- [ ] 064. **[CORE_GDD_04]** 🧠[Pro] `SeizureManager`: 자산 0 이하 시 주식->가구 순의 순차적 압류 실행 엔진
- [ ] 065. **[CORE_GDD_07]** `OfficeMaintenance`: 오피스 레벨(1~4)에 따른 주간 감가상각비(500~5000G) 차감
- [ ] 066. **[CORE_GDD_07]** `GhostSinkEngine`: 고스트 트레이더의 모든 수익을 시스템으로 회수하는 소각부
- [ ] 067. **[CORE_GDD_05]** 🎨[Graphics] `MainHUD_Master`: 상단 바, 사이드 메뉴를 포함한 핵심 HUD 레이아웃 셋업
- [ ] 068. **[CORE_GDD_05]** `StatTextLerp`: 골드와 수치 변동 시 드르륵 올라가는 시각적 숫자 연출
- [ ] 069. **[CORE_GDD_05]** `BottomTicker_Loop`: 24개 종목명이 하단에 무한 스크롤되는 티커 UI 제작
- [ ] 070. **[CORE_GDD_05]** `TickerDataBinder`: 실시간 주가/변동률 정보를 티커 텍스트에 동적 할당
- [ ] 071. **[CORE_GDD_05]** 🎨[Graphics] `TickerColorFX`: 상승(Cyan)/하락(Peach) 텍스트 색상 및 글로우 셰이더 적용
- [ ] 072. **[CORE_GDD_05]** 🧠[Pro] `AreaChart_Core`: Mesh API 기반의 실시간 주가 선 및 면 선형 렌더러
- [ ] 073. **[CORE_GDD_05]** `ChartTooltip`: 차트 위에 마우스 포인터 위치 시 해당 시점 주가/시간 팝업
- [ ] 074. **[CORE_GDD_05]** `ChartTimeline`: 시간축(1H, 1D, 7D) 전환 시 데이터 리인덱싱 및 리렌더링
- [ ] 075. **[CORE_GDD_05]** 🎨[Graphics] `GlobalLighting_Cycle`: 게임 시간대에 따른 실시간 환경 광원(Day/Night) 변화
- [ ] 076. **[CORE_GDD_05]** 🎨[Graphics] `RainFX_Controller`: 날씨 시스템과 연동된 창밖 빗줄기 입자 및 바닥 물튀김
- [ ] 077. **[CORE_GDD_05]** 🎨[Graphics] `WindowRainShader`: 유리창에 흘러내리는 물방울의 굴절 셰이더 디테일 작업
- [ ] 078. **[CORE_GDD_05]** 🎨[Graphics] `GlitchCore`: 뉴스 발생 시 UI가 일시적으로 깨지는 도트 글리치 컴포넌트
- [ ] 079. **[CORE_GDD_05]** 🎨[Graphics] `Anna_IdleState`: 홈 오피스 내 안나의 대기 위치 설정 및 기본적인 숨쉬기 애니
- [ ] 080. **[CORE_GDD_08]** 🎨[Graphics] `CharacterSelectUI`: 초기 외형(머리, 안경, 의상) 선택을 위한 갤러리 뷰
- [ ] 081. **[CORE_GDD_08]** `AvatarDataMapping`: 선택된 파츠를 실제 3D/2D 캐릭터 프리팹에 실시간 적용
- [ ] 082. **[CORE_GDD_08]** `StarterPackDistributor`: 초기 시드 5,000G 및 기본 가구 세트 인벤토리 지급
- [ ] 083. **[CORE_GDD_06]** 🎨[Graphics] `AssetDissolveFX`: 가구 압류 시 입자가 흩어지며 사라지는 디졸브(Dissolve) 효과
- [ ] 084. **[CORE_GDD_02]** `OrderWindow_UI`: 수량 입력 필드, 슬라이더, 총액 계산이 포함된 매매창
- [ ] 085. **[CORE_GDD_02]** `QuickBuyToggle`: 클릭 한 번으로 가용 자산 100% 매수하는 단축 기능 로직
- [ ] 086. **[CORE_GDD_02]** `TransactionLogger`: 매수/매도 시 시간, 단가, 수량을 전역 거래 일지에 기록
- [ ] 087. **[CORE_GDD_05]** 🎨[Graphics] `SceneNavigationUI`: 지하철 노선도 테마의 맵 선택 창 및 장소별 썸네일 노출
- [ ] 088. **[CORE_GDD_05]** `TooltipManager`: 모든 아이콘 마우스 오버 시 정보를 뿌려주는 전역 툴팁 시스템
- [ ] 089. **[CORE_GDD_03]** 🎨[Graphics] `LevelUpVisual`: 레벨 상승 시 화면 중앙에 나타나는 금빛 엠블럼과 보상 연출
- [ ] 090. **[CORE_GDD_04]** `InterestReportUI`: 매주 월요일 정산 내역(이자/유지비)을 보여주는 팝업창
- [ ] 091. **[CORE_GDD_06]** `AsyncPatcher`: 저장 실패 시 임시 메모리에 데이터를 보관하고 재시도하는 로직
- [ ] 092. **[CORE_GDD_05]** 🎨[Graphics] `ResolutionScaler`: 720p ~ 4K까지의 UI 스프라이트 해상도 최적화 대응
- [ ] 093. **[CORE_GDD_02]** 🎨[Graphics] `StatusLED.cs`: 장 열림(Green)/닫힘(Red)을 표시하는 책상 위 기계 장치 연출
- [ ] 094. **[CORE_GDD_05]** `UI_SfxAtlas`: 버튼 클릭, 창 열기 등 모든 UI 소리와 연동되는 전역 오디오 믹서
- [ ] 095. **[CORE_GDD_06]** `CheatConsole_UI`: 개발 테스트를 위한 `~`키 입력 시 나타나는 명령어 입력창
- [ ] 096. **[CORE_GDD_04]** `CollateralValuation`: 전당포 담보물 가치 산정을 위한 아이템 원가 추적 필드
- [ ] 097. **[CORE_GDD_05]** `MainHUD_TimeDisplay`: 상단 중앙에 현재 요일과 디지털 시각 실시간 표기
- [ ] 098. **[CORE_GDD_05]** `ChartGridRenderer`: 가격대 구분을 위한 차트 배경 눈금 및 실시간 수평선
- [ ] 099. **[CORE_GDD_05]** `UI_PanelSnap`: 윈도우 창을 드래그하여 벽면에 스냅(Snap)시키는 편의 기능
- [ ] 100. **[CORE_GDD_01]** `PrefabLibrary`: 모든 NPC, 가구, UI 조각들의 인스턴스화를 위한 리소드 로드부
- [ ] 101. **[CORE_GDD_04]** `BankNPC_Interaction`: 지점장 샤일록과의 대화창 및 대출/상환 선택지 바인딩
- [ ] 102. **[CORE_GDD_04]** `SecuritiesNPC_Interaction`: 에이전트 K와의 대화창 및 아레나 신청 인터페이스
- [ ] 103. **[CORE_GDD_05]** `HUD_Notification`: 찌라시 획득이나 뉴스 발생 시 우측 상단에 뜨는 슬라이드 알림
- [ ] 104. **[CORE_GDD_03]** `StatPointUI`: 포인트 소모하여 직관적으로 능력치 블록을 채우는 업그레이드창
- [ ] 105. **[CORE_GDD_02]** 🧠[Pro] `CandleStick_Renderer`: 봉 차트 보기 모드 전환을 위한 시가/고가/저가/종가 계산부
- [ ] 106. **[CORE_GDD_05]** 🎨[Graphics] `UI_BlurEffect`: 창이 뜰 때 배경을 은은하게 흐리게 만드는 가우시안 블러 셰이더
- [ ] 107. **[CORE_GDD_04]** `AutomaticSeizureMail`: 압류 6시간 전 자동으로 발송되는 최후의 결제 독촉 알림 로직
- [ ] 108. **[CORE_GDD_05]** 🎨[Graphics] `Ticker_NewsSymbol`: 실시간으로 터지는 호재/악재 뉴스 아이콘을 티커에 삽입
- [ ] 109. **[CORE_GDD_06]** 🧠[Pro] `SaveSafetyCheck`: 저장 도중 전원 차단 시 직전 세이브 데이터를 보호하는 백업본 생성
- [ ] 110. **[CORE_GDD_05]** `UI_MasterMixer`: 마스터 볼륨 및 각 장소별 앰비언트(빗소리 등) 볼륨 조절 슬라이더

---

### 🗓️ Sprint 3: 6월 3~4주차 - 노동 미니게임 및 찌라시 (166 ~ 225)

- [ ] 166. **[MOD_GDD_02]** 🤖[Claude] `JobSystemController`: 전체 노동 리스트 및 보상 데이터 매크로 관리
- [ ] 167. **[MOD_GDD_02]** `JobLimitSystem.cs`: 일일 알바 횟수 제한(기본 3회, 회복력 비례 최대 5회)
- [ ] 168. **[MOD_GDD_02]** `MiniGameShell`: 미니게임 공통 UI (시작/제한시간/결과화면) 프리팹

- [ ] 173. **[MOD_GDD_02]** 🧠[Pro] `SortingHub_Balance`: 좌우 키로 상자 탑의 균형을 잡는 물리 엔진 연동
- [ ] 174. **[MOD_GDD_02]** `SortingHub_Wind`: 강풍 환경 변수 추가로 인한 상하차 난이도 증가 로직
- [ ] 175. **[MOD_GDD_02]** `JobResultCalculator`: 최종 스코어 기반 Gold 및 평판 점수 정산 엔진
- [ ] 176. **[MOD_GDD_03]** 🤖[Claude] `ItemMasterTable`: CSV 기반 가구/의상 200종 스탯 대량 로드 시스템
- [ ] 177. **[MOD_GDD_03]** `InventoryUI_Grid`: 7개 카테고리별 슬롯 생성 및 아이콘 바인딩
- [ ] 178. **[MOD_GDD_03]** `ItemDetailPopup`: 아이템 상세 옵션 및 플레이버 텍스트 노출 윈도우
- [ ] 179. **[MOD_GDD_03]** `EquipController`: 아바타 파츠(Hair, Top, Bottom 등) 실시간 스위칭
- [ ] 180. **[MOD_GDD_03]** `InventorySort`: 획득순, 가격순, 등급순 아이템 정렬 필터 구현
- [ ] 181. **[MOD_GDD_03]** `ItemSearch`: 인벤토리 내 이름 검색 기능을 위한 텍스트 필터
- [ ] 182. **[MOD_GDD_03]** `ConsumableItem`: 사용 시 즉시 효과(분석력 증가 등)를 주는 소모품 엔진
- [ ] 183. **[MOD_GDD_04]** 🤖[Claude] `RumorGenerator`: 알바 성공 시 48종 시나리오 중 확률적 찌라시 획득
- [ ] 184. **[MOD_GDD_04]** `RumorInventory`: 획득한 찌라시 전용 수집함 및 열람 인터페이스
- [ ] 185. **[MOD_GDD_04]** `BurnTimerLogic`: 열람 후 60분 뒤 인벤토리에서 자동 삭제되는 타이머
- [ ] 186. **[MOD_GDD_04]** 🧠[Pro] `InsightMaskingEngine`: 분석 레벨 1~3단계별 단어 은폐 및 치환 알고리즘
- [ ] 187. **[MOD_GDD_04]** 🎨[Graphics] `RumorExpirationFX`: 만료 임박(5분 전) 찌라시 아이콘의 붉은 깜빡임 연출
- [ ] 188. **[MOD_GDD_04]** 🎨[Graphics] `DecoderItemAction`: '찌라시 판독기' 사용 시 마스킹 해제 실시간 연출
- [ ] 189. **[MOD_GDD_05]** `WardrobeUI`: 현재 착용 중인 의상 세트 효과 및 총 버프 계산창
- [ ] 190. **[MOD_GDD_05]** `PawnLoanProcess`: 바터에게 물건 맡기고 구입가 60% 대출받는 프로세스
- [ ] 191. **[MOD_GDD_05]** 🧠[Pro] `DefaultPawnInterest`: 담보 대출 전용 매주 5% 복리 이자 합산 정산 루틴
- [ ] 192. **[MOD_GDD_05]** `PawnItemStorage`: 담보로 맡긴 물건들을 따로 보관하는 가상 저장소
- [ ] 193. **[MOD_GDD_05]** `RedemptionProcess`: 원금+이자 상환 후 담보물 인벤토리 재지급 로직
- [ ] 194. **[MOD_GDD_05]** 🎨[Graphics] `BarberShopUI`: 헤어 스타일 및 컬러 변경 프리뷰 및 자본 차감 로직
- [ ] 195. **[MOD_GDD_02]** `EnergyDrinkItem`: 에너지 드링크(500G) 사용 시 일일 알바 횟수 2회 복구 로직
- [ ] 196. **[MOD_GDD_02]** `JobPromotion`: 노동 횟수 누적 시 시급이 1.1~1.5배 상승하는 승급 시스템
- [ ] 197. **[MOD_GDD_02]** `MiniGameAudio`: 미니게임 성공/실패 시 비프음 및 백사장 호통 소리
- [ ] 198. **[MOD_GDD_03]** 🎨[Graphics] `ItemRarityFX`: 레전더리 등급 아이템 획득 시 화면 전체 아우라 연출
- [ ] 199. **[MOD_GDD_04]** `RumorSourceTag`: 찌라시 출처(다크넷, 브로커, 우연) 표기 로직
- [ ] 200. **[MOD_GDD_04]** 🧠[Pro] `ReliabilitySystem`: 찌라시 텍스트 중 '거짓'이 섞일 확률 관리 엔진
- [ ] 201. **[MOD_GDD_05]** `StylingScore`: 현재 코디네이션의 '힙함'을 점수로 환산하는 엔진
- [ ] 202. **[MOD_GDD_03]** `ItemRecycle`: 필요 없는 가구를 분해하여 제작 재료로 바꾸는 기능
- [ ] 203. **[MOD_GDD_02]** `NightShiftJob`: 야간(22:00-02:00) 노동 시 찌라시 획득 확률 2배 적용
- [ ] 204. **[MOD_GDD_04]** 🎨[Graphics] `InformationPurge`: 만료 시 정보가 타 들어가며 사라지는 셰이더 효과
- [ ] 205. **[MOD_GDD_05]** `PawnShopUsedMarket`: 유저가 포기한 담보물이 전당포 매대에 올라오는 로직
- [ ] 206. **[MOD_GDD_03]** `ItemPurchaseFlow`: 상점에서 가구 구매 시 자금 체크 및 배송 연출
- [ ] 207. **[MOD_GDD_02]** `MiniGamePause`: 게임 도중 일시 정지 및 포기 시 패널티(급여 0) 로직
- [ ] 208. **[MOD_GDD_02]** `ComboSystem`: 편의점/상하차 시 연속 성공 시 콤보 가산금 지급
- [ ] 209. **[MOD_GDD_04]** 🎨[Graphics] `CriticalRumorAlert`: 시장 전체에 영향을 주는 빨간색 '치명적 찌라시' 연출
- [ ] 210. **[MOD_GDD_03]** 🎨[Graphics] `InventoryExpansion`: 서랍장 칸 늘리기 아이템 사용 시 그리드 확장 연출
- [ ] 211. **[MOD_GDD_02]** `MiniGameEndSummary`: 알바 종료 후 획득 Gold와 경험치를 보여주는 전광판 UI
- [ ] 212. **[MOD_GDD_03]** `CosmeticVendor`: 타운 광장에 비주기적으로 나타나는 희귀 의상 노점상 NPC
- [ ] 213. **[MOD_GDD_04]** `RumorMarketPrice`: 찌라시의 희귀도에 따라 암시장에서의 거래 가격 변동 로직
- [ ] 214. **[MOD_GDD_03]** `ItemStorageLock`: 특정 레벨 도달 전까지 잠겨있는 프리미엄 아이템 슬롯
- [ ] 215. **[MOD_GDD_02]** `FatigueSystem`: 연속 노동 시 성공 판정 범위가 좁아지는 피로도 연산 로직
- [ ] 216. **[MOD_GDD_04]** `CipherRumorDecryption`: 안나의 신뢰도에 따라 마스킹된 찌라시 글자를 복원해주는 이벤트
- [ ] 217. **[MOD_GDD_03]** `FurnitureUpgrade`: 특정 재료를 사용해 기존 가구의 스탯 버프를 강화하는 시스템
- [ ] 218. **[MOD_GDD_02]** `GlobalJobEvent`: 전역적으로 특정 알바 수익이 2배가 되는 '황금 시간대' 공시
- [ ] 219. **[MOD_GDD_04]** `DarkWebMarket`: 스마트폰 앱을 통해 익명으로 찌라시를 사고파는 비대면 시장
- [ ] 220. **[MOD_GDD_05]** 🤖[Claude] `PawnShopBargain`: 바터와의 [협상력] 대결을 통해 담보 대출 이율을 깎는 미니 토크
- [ ] 221. **[MOD_GDD_03]** `LuckyBoxLogic`: 일정 확률로 희귀 가구가 나오는 '박스' 아이템 오픈 엔진
- [ ] 222. **[MOD_GDD_02]** `PartTimeRanking`: 한 주간 알바 수익이 가장 높은 유저에게 주는 '성실 트레이더' 칭호
- [ ] 223. **[MOD_GDD_04]** 🧠[Pro] `RumorFeedbackLoop`: 내가 퍼뜨린 찌라시가 실제 주가에 미미하게 영향을 주는 피드백 엔진
- [ ] 224. **[MOD_GDD_05]** `OfficeBackgroundAudio`: 오피스 내 라디오 가구 배치 시 플레이리스트 재생 기능
- [ ] 225. **[MOD_GDD_03]** `InventoryFullWarning`: 인벤토리가 가득 찼을 때 알바 보상 수취 거부 및 안내 메시지
- [ ] 226. **[MOD_GDD_17]** `CollectionMaster.cs`: 아이템 ID 기반 수집 여부 및 CP(Collection Point) 합산 엔진
- [ ] 227. **[MOD_GDD_17]** `ArchiveUI_Layout`: 실루엣 프리뷰, 등급별 필터링, 로어 텍스트를 포함한 도감 UI
- [ ] 228. **[MOD_GDD_17]** `CP_TierManager`: 누적 CP에 따른 5단계 티어 자동 판정 및 보상 지급 시스템
- [ ] 229. **[MOD_GDD_17]** `ThemeSynergyLogic`: 특정 테마(코지, 사이버 등) 완판 시 특수 패시브 활성화 트리거
- [ ] 230. **[MOD_GDD_17]** `ArchiveSilhouette`: 미획득 아이템의 실루엣 연출 및 획득처 가이드 시스템

---

---


---

## 🚀 Post-GIGDC 마일스톤 (7월 ~ 10월 출시)

### 🗓️ Phase 4: 7월 - 월드 환경 및 그리드 시스템 (111 ~ 165)

- [ ] 111. **[MOD_GDD_05]** 🧠[Pro] `IsoGrid_Base`: 2:1 비율의 아이소메트릭 그리드 논리 좌표계 및 타운 셋업
- [ ] 112. **[MOD_GDD_05]** 🎨[Graphics] `TileSelection`: 마우스 오버 시 해당 타일에 노란색 하이라이트 박스 연출
- [ ] 113. **[MOD_GDD_05]** `OfficeFloorPlan`: 10x10에서 30x30까지의 오피스 평수 확장 트리거 및 맵 데이터
- [ ] 114. **[MOD_GDD_05]** 🧠[Pro] `SortingLayerManager`: 가구의 Y축 위치에 따라 전후 관계를 자동 정렬하는 렌더링 레이어
- [ ] 115. **[MOD_GDD_05]** 🎨[Graphics] `GhostPreview_FX`: 설치 전 반투명 가구 이미지와 설치 가능/불가능 영역 시각화
- [ ] 116. **[MOD_GDD_05]** 🧠[Pro] `CollisionValidator`: 가구 간 배치 겹침 및 문 앞을 막는 동선 방해 실시간 체크
- [ ] 117. **[MOD_GDD_05]** `RotationLogic`: 90도 회전 시 1/2/4방향 스프라이트 정밀 전환 및 좌표 보정
- [ ] 118. **[MOD_GDD_05]** `FurnitureBuffProcessor`: 가구 배치 즉시 명성치와 스탯 보너스를 전역 스탯에 가산
- [ ] 119. **[MOD_GDD_05]** `EditModeUI`: 가구 이동, 회전, 판매 버튼이 있는 하단 건설 모드 툴바 셋업
- [ ] 120. **[MOD_GDD_05]** 🎨[Graphics] `WallpaperManager`: 벽면과 바닥재의 텍스처를 클릭 한 번으로 교체하는 팔레트 시스템
- [ ] 121. **[MOD_GDD_01]** 🎨[Graphics] `TownMapSetup`: 7개 구역(은행, 전당포, 치킨집 등)으로 구성된 타운 거점 배치
- [ ] 122. **[MOD_GDD_01]** `NpcSpawnPoint`: 장소별 NPC(안나, 바터, 백사장) 상주 위치 및 시야각 설정
- [ ] 123. **[MOD_GDD_01]** 🎨[Graphics] `NodeFinanceRoom`: 은행 내부의 무겁고 빈티지한 금색 조명의 룸 연출 및 프리팹
- [ ] 124. **[MOD_GDD_01]** 🎨[Graphics] `CipherSecuritiesFloor`: 증권사 내부의 대형 전광판과 트레이딩 데스크 레이아웃
- [ ] 125. **[MOD_GDD_01]** 🎨[Graphics] `DustyRoomInterior`: 전당포 내부의 어두운 필터와 먼지 날리는 먼지 입자 FX 연출
- [ ] 126. **[MOD_GDD_01]** 🎨[Graphics] `RoosterKitchen`: 치킨집 주방 미니게임 진입을 위한 주방 조리대와 집기 배치
- [ ] 127. **[MOD_GDD_01]** 🎨[Graphics] `LogisticsHub`: 상하차 센터의 컨베이어 벨트 구동 애니메이션 및 물류 상자 적재함
- [ ] 128. **[MOD_GDD_01]** 🎨[Graphics] `Neon24Store`: 편의점 내부의 밝은 형광등과 빼곡한 진열대 상호작용 지점 구축
- [ ] 129. **[MOD_GDD_01]** 🎨[Graphics] `HomeOfficeBranding`: 유저가 지은 이름이 출입문 간판에 네온사인으로 빛나는 연출
- [ ] 130. **[MOD_GDD_01]** 🎨[Graphics] `AmbientLightSync`: 타운 외부 하늘 색상이 실제 게임 시간(Day/Night)에 맞춰 그라데이션 변화
- [ ] 131. **[MOD_GDD_01]** `ExtraNpcRoutine`: 타운 배경에서 가볍게 움직이는 보행자 NPC들의 AI 순회 경로
- [ ] 132. **[MOD_GDD_01]** `CameraFollowController`: 오피스 내 드래그 이동, 줌 인/아웃 및 경계선 제한 스크립트
- [ ] 133. **[MOD_GDD_05]** 🧠[Pro] `GridUndoSystem`: 가구 배치 실수를 되돌리기 위한 Stack 기반의 Undo/Redo 엔진
- [ ] 134. **[MOD_GDD_05]** `InteriorValueReport`: 현재 가구 배치의 조화로움과 스탯 기여도를 정리한 리포트 UI
- [ ] 135. **[MOD_GDD_06]** `Anna_MovementSet`: 시간대에 따라 오피스 창가, 책상, 침대 등으로 이동하는 안나
- [ ] 136. **[MOD_GDD_01]** 🎨[Graphics] `CozyFogEffect`: 맵 구석구석에 아늑한 감성을 더하는 미세한 노이즈와 안개 파티클
- [ ] 137. **[MOD_GDD_01]** `InteractiveProps`: 클릭 시 짧은 소리를 내거나 흔들리는 오피스 내 인테리어 소품화
- [ ] 138. **[MOD_GDD_01]** `SceneFastTravel`: 맵 UI 특정 위치 클릭 시 페이드아웃 후 해당 장소로 즉시 이동
- [ ] 139. **[MOD_GDD_05]** `FurnitureDepreciation`: 중고 가구 판매 시 구입 시점 대비 가격이 깎이는 감가상각 연산
- [ ] 140. **[MOD_GDD_05]** 🧠[Pro] `InteriorDataSync`: 가구별 ID, 좌표, 회전값을 한 줄의 문자열로 압축하여 저장하는 스키마
- [ ] 141. **[MOD_GDD_05]** 🧠[Pro] `ExpansionCostCurve`: 오피스 평수 확장 시 요구되는 골드 및 평판 등급의 상승 곡선 설정
- [ ] 142. **[MOD_GDD_05]** 🎨[Graphics] `GridVisualGuide`: 가구 배치 모드 활성화 시 바닥에 은은한 쿼터뷰 격자 가루가 깔리는 FX
- [ ] 143. **[MOD_GDD_01]** `BGMZoneDetector`: 소속 구역(은행, 펍 등)에 따라 해당 오디오 트랙으로 자연스럽게 전환
- [ ] 144. **[MOD_GDD_01]** 🎨[Graphics] `CityGlowFX`: 야간 시간대 창문 밖으로 보이는 도시 마천루들의 깜빡이는 불빛 셰이더
- [ ] 145. **[MOD_GDD_06]** `Anna_OfficeRoutine`: 안나가 책상에 앉아 키보드를 두드리거나 자료를 검토하는 대기 동작
- [ ] 146. **[MOD_GDD_05]** `SinglePlacementLimit`: 특정 고가 대형 가구(예: 서버 랙)의 중복 설치를 제한하는 감시 로직
- [ ] 147. **[MOD_GDD_01]** 🎨[Graphics] `StreetClickFX`: 땅을 클릭했을 때 나타나는 사이버펑크 스타일의 파란색 육각형 파티클
- [ ] 148. **[MOD_GDD_01]** 🎨[Graphics] `BuildingOutlineFX`: 마우스 오버한 타운 건물의 외곽선이 얇게 빛나는 아웃라인 연출
- [ ] 149. **[MOD_GDD_01]** 🎨[Graphics] `MetroTransitAnim`: 장소 이동 시 지하철이 웅장하게 화면을 가로질러 지나가는 컷신 연출
- [ ] 150. **[MOD_GDD_01]** 🎨[Graphics] `TownVignetteFX`: 타운 화면 가장자리에 필름 그레인과 갈색 비네팅을 더해 빈티지 무드 완성
- [ ] 151. **[MOD_GDD_05]** `CarpetLayer`: 바닥재 바로 위에 겹쳐서 설치되는 카펫 전용 레이어 및 마킹 로직
- [ ] 152. **[MOD_GDD_05]** `WallAccessory`: 벽면에 거는 포스터나 시계를 위한 수직 그리드 배치 엔진
- [ ] 153. **[MOD_GDD_01]** `AmbientCrowdSound`: 타운 중앙 광장 진입 시 웅성웅성거리는 환경 소음 자동 재생
- [ ] 154. **[MOD_GDD_01]** 🎨[Graphics] `NeonSignGlitch`: 야간에 타운 네온사인이 미세하게 지지직거리며 글리치가 나는 연출
- [ ] 155. **[MOD_GDD_06]** `Anna_InteractivePoint`: 안나 옆에 섰을 때 '대화하기(F)' 상호작용 툴팁이 뜨는 위치 매핑
- [ ] 156. **[MOD_GDD_01]** `SubwayEntrance`: 지하철 역 입구 프리팹 구축 및 월드맵 이동 트리거 바인딩
- [ ] 157. **[MOD_GDD_05]** `GridConstraint`: 설치 불가능한 가구가 있는 타일에 설치 시 붉은색 경고 박스 노출
- [ ] 158. **[MOD_GDD_05]** `SaveThumbnail`: 인테리어 저장 시 현재 오피스 모습을 작은 썸네일로 캡처하여 저장
- [ ] 159. **[MOD_GDD_01]** 🎨[Graphics] `ReflectionShader`: 전당포나 은색 건물 유리창에 비치는 노란색 가로등 빛 반사 연출
- [ ] 160. **[MOD_GDD_01]** `VendingMachine`: 타운 곳곳에 배치된 자판기 클릭 시 짧은 캔 따는 소리와 효과음 재생
- [ ] 161. **[MOD_GDD_05]** `FurnitureSellConfirm`: 가구 판매 시 판매가와 삭제 여부를 묻는 2차 확인 모달창
- [ ] 162. **[MOD_GDD_01]** `WeatherSyncLogic`: 맑음/비/안개발생에 따른 타운 전체 라이트 강도 및 색온도 조절
- [ ] 163. **[MOD_GDD_01]** `TrafficLightAnim`: 타운 도로의 신호등이 빨강/초록으로 주기적으로 변하는 애니메이션
- [ ] 164. **[MOD_GDD_05]** `AutoSortingLogic`: 버튼 클릭 시 현재 배치된 가구들을 종류별로 나란히 정렬해주는 편의 기능
- [ ] 165. **[MOD_GDD_01]** 🎨[Graphics] `StreetLightGlow`: 밤에 가로등 주변으로 은은하게 퍼지는 라이트 후광 효과(Halo) 제작

---

### 🗓️ Phase 5: 8월~9월 - 서사 및 소셜 시스템 (231 ~ 295)

- [ ] 231. **[MOD_GDD_06]** 🎨[Graphics] `AnnaAnimator`: 안나의 감정별(Happy, Sad, Angry, Blush) 자연스러운 표정 전이
- [ ] 232. **[MOD_GDD_06]** 🧠[Pro] `AffectionLogic`: 안나와의 누적 친밀도(0~100) 데이터 및 가중치 연산 엔진
- [ ] 233. **[MOD_GDD_06]** 🤖[Claude] `AnnaDailyBriefing`: 매일 아침 안나가 시장 상황과 유저 자산을 요약해주는 브리핑 로직
- [ ] 234. **[MOD_GDD_06]** `Anna_OfficePos`: 오피스 내 안나의 위치 매핑 및 시간대별 대기 동작(애니메이션) 분기
- [ ] 235. **[MOD_GDD_06]** 🎨[Graphics] `BarterNpcProfile`: 전당포 주인 바터의 고해상도 초상화 및 대기 상태 구축
- [ ] 231. **[MOD_GDD_06]** 🤖[Claude] `RichPoorSpeechEngine`: 유저 자산 규모를 체크하여 NPC의 대사 톤앤매너 필터링
- [ ] 232. **[MOD_GDD_07]** 🤖[Claude] `DialogueSystemCore`: 텍스트 타이핑 효과 및 유저 선택지에 따른 결과 분기 엔진
- [ ] 233. **[MOD_GDD_11]** `SmartphoneUI`: 화면 우하단 스마트폰 아이콘 및 앱 서랍 슬라이드 애니메이션
- [ ] 234. **[MOD_GDD_11]** `MailApp_List`: 시스템 및 NPC 메일 수신 목록, 중요도 필터 및 읽음 처리 기능
- [ ] 235. **[MOD_GDD_11]** `AnnaWelcomeGift`: 안나의 웰컴 선물(10,000G) 및 친밀도 기반 특별 메일 보상 시스템
- [ ] 236. **[MOD_GDD_09]** 🤖[Claude] `VirtualFriendNet`: 가상의 친구 유저 10명의 프로필 및 가짜 투자 일지 자동 생성기
- [ ] 237. **[MOD_GDD_12]** `NewsAgencyApp`: 가상 언론사의 속보 알림 및 과거 기사 아카이빙 조회 앱
- [ ] 238. **[MOD_GDD_13]** 🧠[Pro] `GhostTraderAI`: 시장 유동성을 공급하는 고스트 트레이더들의 구역별 매매 알고리즘
- [ ] 239. **[MOD_GDD_14]** `DebtReliefWizard`: 파산 시나리오 진입 시 회생 신청 가능 여부 판정 및 절차 위저드
- [ ] 240. **[MOD_GDD_14]** `DebtForgivenessLogic`: 회생 승인 시 이자 즉시 탕감 및 원금 50% 유예 트랙 전환
- [ ] 241. **[데모 이후] [MOD_GDD_15]** `InstitutionSetup`: 자산 1M 돌파 시 '기관 설립' 권한 해금 및 초기 인프라 구축
- [ ] 242. **[데모 이후] [MOD_GDD_15]** `InvestorWaitlist`: 기관 등급에 따른 외부 투자자(Ghost)들의 자금 예치 대기열 로직
- [ ] 243. **[데모 이후] [MOD_GDD_15]** `OperatingFeeCalc`: 위탁 자산 변동에 따른 15% 운용 수수료의 주간 정산부
- [ ] 244. **[데모 이후] [MOD_GDD_15]** `EmbezzlementEngine`: 위탁금 인출 시 '횡령' 판정 (5% 임계값) 및 도덕 점수 차감
- [ ] 245. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `InsiderTradingTracker`: 기관 내부 고발자 시스템에 의한 비정상 매매 탐지 트리거
- [ ] 246. **[데모 이후] [MOD_GDD_15]** `ShortSellingLogic`: 공매도 주문 시 150% 증거금 강제 홀딩 및 종목 대차 로직
- [ ] 247. **[데모 이후] [MOD_GDD_15]** 🎨[Graphics] `MarginCallVisual`: 유지비율 90% 도달 시 화면 테두리가 붉게 깜빡이는 사이렌 FX
- [ ] 248. **[데모 이후] [MOD_GDD_15]** `SeizureEngine_AutoCover`: 마진콜 100% 도달 시 시스템에 의한 시장가 강제 대차상환(Cover)
- [ ] 249. **[데모 이후] [MOD_GDD_15]** `FiveFoldPenalty`: 강제 청산 발생 시 기본 수수료의 5배를 즉시 차감하는 패널티 루틴
- [ ] 250. **[데모 이후] [MOD_GDD_16]** `Syndicate_Formation`: 유저 간 '투자 신디케이트' 결성 및 엠블럼 에디터 UI
- [ ] 251. **[데모 이후] [MOD_GDD_16]** 🎨[Graphics] `Syndicate_EmblemMapping`: 생성된 엠블럼을 멤버의 어깨 및 프로필 UI에 고화질 렌더링
- [ ] 252. **[데모 이후] [MOD_GDD_16]** 🎨[Graphics] `SecretHideoutUI`: 미드나잇 펍 지하 '비밀 아지트' 입장 및 인테리어 커스텀
- [ ] 253. **[데모 이후] [MOD_GDD_16]** `JointBuyOperation`: 리더의 작전주 지정 시 멤버 동시 매수 시너지(x1.5 가중치) 엔진
- [ ] 254. **[데모 이후] [MOD_GDD_16]** 🧠[Pro] `JointLiabilityCalc`: 신디케이트 파산 시 멤버 기여도에 따른 채무 배분 및 연대 책임 로직
- [ ] 255. **[데모 이후] [MOD_GDD_16]** `BlackBrokerJack`: 전설급 작전주 소스를 판매하는 블랙 브로커 잭과의 특수 거래창
- [ ] 256. **[MOD_GDD_06]** `Anna_MoodBoard`: 안나의 호감도에 따라 오피스 내부 BGM과 조명 색온도가 미세하게 변화
- [ ] 257. **[MOD_GDD_11]** `SmartphoneVibrate`: 긴급 속보나 마진콜 경고 시 장치 엔진을 통한 햅틱 피드백 연동
- [ ] 258. **[데모 이후] [MOD_GDD_15]** `InstitutionalReport`: 기관 운영 수익/손실 및 배당 현황을 정리한 전용 대시보드
- [ ] 259. **[데모 이후] [MOD_GDD_15]** `RedNoticePreheat`: 횡령 누적 시 안나의 말투가 점차 차갑고 사무적으로 변하는 상태 전이
- [ ] 260. **[MOD_GDD_07]** `DialogueCameraZoom`: 중요 대사 전달 시 NPC의 얼굴로 카메라가 부드럽게 줌인(Lerp) 연출
- [ ] 261. **[MOD_GDD_07]** `SelectiveSkip`: 이미 열람한 대사 그룹만 빠르게 스킵할 수 있는 고급 다이얼로그 모듈
- [ ] 262. **[MOD_GDD_11]** 🎨[Graphics] `AppUpdateVisual`: 스토리 마일스톤 달성 시 스마트폰 앱 아이콘이 골드로 업그레이드되는 연출
- [ ] 263. **[데모 이후] [MOD_GDD_15]** 🤖[Claude] `ClientAngryMail`: 수익 배분 지연 시 위탁 투자자들의 항의성 익명 메일 발송 로직
- [ ] 264. **[데모 이후] [MOD_GDD_16]** `SyndicateRankings`: 신디케이트 간의 주간 수익률 대결 및 전용 리더보드 시스템
- [ ] 265. **[MOD_GDD_06]** 🎨[Graphics] `AnnaSecretGifts`: 호감도 Max 상태에서만 발생하는 안나의 비밀 선물 컷신 이벤트
- [ ] 266. **[MOD_GDD_07]** `StorySummaryWindow`: 현재 진행 중인 메인 퀘스트와 서사적 위치를 요약해주는 기록장
- [ ] 267. **[MOD_GDD_11]** 🎨[Graphics] `SmartphoneDustFX`: 장시간 미사용 시 스마트폰 화면에 미세한 먼지가 쌓이는 디테일 연출
- [ ] 268. **[데모 이후] [MOD_GDD_16]** `SyndicateWallboard`: 아지트 내 멤버들의 실시간 보유 종목을 보여주는 대형 전광판
- [ ] 269. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `TaxEvaderTracker`: 세금 포탈이나 횡령 시도 시 시스템이 실시간으로 추적하는 투기 감시 모니터
- [ ] 270. **[MOD_GDD_07]** 🎨[Graphics] `NpcEyeTracking`: 마우스 포인터의 위치를 NPC의 눈동자가 자연스럽게 쫓아가는 연출
- [ ] 271. **[MOD_GDD_12]** 🎨[Graphics] `NewsVideoPlayer`: 중요 경제 지표 발표 시 UI 내에서 재생되는 짧은 코지 뉴스 영상
- [ ] 272. **[데모 이후] [MOD_GDD_15]** `BrokerFeeDiscount`: 평판 등급 S 이상 시 기관 거래 수수료를 0.5% 감면받는 특혜 로직
- [ ] 273. **[데모 이후] [MOD_GDD_16]** 🧠[Pro] `GhostSyndicateAI`: 유저 신디케이트의 독점적 지위를 위협하는 라이벌 NPC 신디케이트 생성
- [ ] 274. **[MOD_GDD_06]** 🤖[Claude] `Anna_LateNightConvo`: 현실 시간 심야(00~04시)에만 들을 수 있는 안나의 감성 대사 세트
- [ ] 275. **[MOD_GDD_11]** `PhoneCaseCustom`: 포인트 소모하여 스마트폰의 외형과 폰트 스타일을 바꾸는 커스터마이징
- [ ] 276. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `InstitutionAudit`: 정기적인 기관 감사 이벤트 발생 시 장부 조작 미니게임 연동
- [ ] 277. **[데모 이후] [MOD_GDD_16]** `SyndicateEmergencyLoop`: 연맹 위기 시 멤버 모두의 화면에 경고 알람이 동시에 뜨는 연출
- [ ] 278. **[데모 이후] [MOD_GDD_15]** `StockNakedShorting`: 리스크는 크지만 하락장에서 유용한 무차입 공매도 해금 조건 설정
- [ ] 279. **[MOD_GDD_09]** `TradingBadgeCore`: 특정 수익률이나 매매 횟수 달성 시 프로필에 장착하는 마스터 휘장
- [ ] 280. **[MOD_GDD_07]** `DialogueSelectionSFX`: 선택지 위에 마우스 오버 시 출력되는 부드러운 화이트 노이즈 사운드
- [ ] 281. **[데모 이후] [MOD_GDD_15]** `MarginLiquidationReport`: 강제 청산 후 손실액과 남은 담보금을 요약해주는 '절망의 보고서'
- [ ] 282. **[데모 이후] [MOD_GDD_16]** `SyndicateHideoutUpgrade`: 아지트 내에 고효율 트레이딩 룸을 증축하는 건설 시스템
- [ ] 283. **[MOD_GDD_11]** `SpamMailFilter`: 특정 평판 이하 시 쏟아지는 스팸/사기 메일을 걸러주는 필터 기능
- [ ] 284. **[데모 이후] [MOD_GDD_15]** `EmbezzlementFeedback`: 횡령 성공 시 단기적으로 자산은 늘지만 전당포 바터의 신뢰도가 하락
- [ ] 285. **[MOD_GDD_06]** `Anna_WorkFocus`: 대화가 불가능할 정도로 안나가 업무에 집중하는 특정 시간대 플래그
- [ ] 286. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `ShortSqueezeEvent`: 유저 공매도 비중이 높은 종목에 시스템 고래가 매수 대전(Short Squeeze)을 거는 이벤트
- [ ] 287. **[데모 이후] [MOD_GDD_16]** `SyndicateAssetSharing`: 멤버 간의 일시적인 자산 대여 및 증거금 합산 공동 대응 기능
- [ ] 288. **[MOD_GDD_11]** `FlashLightApp`: 어두운 타운 구역 탐험 시 스마트폰 손전등 기능을 켜는 조명 효과
- [ ] 289. **[MOD_GDD_15]** `InstitutionLeveling`: 기관 누적 운용액에 따라 '엔젤'에서 '헤지펀드'로 진화하는 레벨 시스템
- [ ] 290. **[MOD_GDD_07]** `DialogueHistoryViewer`: 현재 대화 세션의 이전 텍스트들을 위로 스크롤하여 다시 읽는 기능

---

### 🗓️ Phase 6: 10월 - 적색 수배 및 최종 빌드 안정화 (291 ~ 350)

- [ ] 291. **[CORE_GDD_07]** 🧠[Pro] `LottoManagerCore`: 로또 1~45 고유 번호 선정 및 당첨금 풀 연산
- [ ] 292. **[CORE_GDD_07]** `LottoPurchaseUI`: 수동/자동 번호 선택 및 구매 티켓 인벤토리 저장
- [ ] 293. **[CORE_GDD_07]** `SalesLockLogic`: 토요일 19:00 판매 금지 플래그 및 안내 팝업
- [ ] 294. **[CORE_GDD_05]** 🎨[Graphics] `DrawingCeremonyUI`: 21:00 광원 차단 후 나타나는 화려한 추첨 머신 윈도우
- [ ] 295. **[CORE_GDD_05]** 🎨[Graphics] `JackpotAnimation`: 1등 당첨 시 화면 전체에 쏟아지는 골드 및 축하 연출
- [ ] 296. **[CORE_GDD_02]** 🧠[Pro] `IPO_reserveLogic`: 폐지된 종목 섹터에 맞춰 신규 상장주 자동 선정 엔진
- [ ] 297. **[CORE_GDD_02]** 🎨[Graphics] `ListingCeremony`: 상장 12시간 전 카운트다운 공시 및 상장 축하 불꽃 FX
- [ ] 298. **[데모 이후] [MOD_GDD_15]** 🎨[Graphics] `RedNotice_UI_Glitch`: 수배 발동 시 전 종목 차트가 붉게 변하며 지지직거리는 글리치 셰이더
- [ ] 299. **[데모 이후] [MOD_GDD_15]** `AssetFreezeLogic`: 개인 자산(Wallet) 동결 및 모든 부동산 가구의 상호작용 불가능화
- [ ] 300. **[데모 이후] [MOD_GDD_15]** `NpcHostilitySet`: 안나 신뢰도 LV 0 고정 및 타운 내 모든 NPC의 적대적 대사/거래 거부
- [ ] 301. **[데모 이후] [MOD_GDD_15]** `RedNoticeBGM`: 수배 기간 동안 흐르는 긴박한 추격전 테마 BGM 크로스페이드
- [ ] 302. **[데모 이후] [MOD_GDD_15]** `BountyBoardUI`: 타 유저(또는 AI)들이 수배자의 포지션을 무너뜨리고 보상을 받는 현상금 판넬
- [ ] 303. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `SurvivalTimer`: 자본 세탁 전까지 버텨야 하는 생존 타이머 및 검거 확률 연산부
- [ ] 304. **[데모 이후] [MOD_GDD_15]** `PardonQuest`: 안나의 신뢰도를 복구하기 위해 제시되는 거액의 자수금(Bail) 상환 퀘스트
- [ ] 305. **[CORE_GDD_06]** 🧠[Pro] `EncryptionUpgrade`: 정식 빌드를 위한 세이브 데이터 비대칭 암호화(RSA 권장) 레이어
- [ ] 306. **[CORE_GDD_06]** 🧠[Pro] `AntiCheatSystem`: 런타임 자산 수치 변조 발생 시 즉시 서버(또는 로컬)에 비정상 로그 생성
- [ ] 307. **[CORE_GDD_03]** 🤖[Claude] `CareerPathSummary`: 현재까지의 거래 성향을 분석한 '트레이더 자격증' 발급 연출
- [ ] 308. **[데모 이후] [MOD_GDD_01~16]** 🤖[Claude] `GeneralEnding`: 자산 10M Gold 미만 일반 엔딩 판정 및 연출
- [ ] 309. **[데모 이후] [MOD_GDD_01~16]** 🤖[Claude] `WealthyEnding`: 자산 100M Gold 이상 '자본의 신' 엔딩 연출
- [ ] 310. **[데모 이후] [MOD_GDD_01~16]** 🤖[Claude] `CiphersVowEnding`: 안나와의 결혼 및 비밀 서약(Cipher's Vow) 전용 컷신
- [ ] 311. **[MOD_GDD_01~16]** `EndingCredits`: 후원자와 개발진 명단이 올라가는 코지 스타일의 크레딧 스크롤
- [ ] 312. **[Audio]** `AudioMixerSetup`: BGM, SFX, Ambient 소리 크기 및 입체감(Reverb) 최종 믹싱
- [ ] 313. **[Tutorial]** `FlowManager`: 최초 접속 시 튜토리얼 단계 강제 트리거 및 보상 시스템 연동
- [ ] 314. **[UI/UX]** 🎨[Graphics] `AnimationPolish`: 모든 윈도우 열기/닫기 시 부드러운 스케일(Elastic) 효과 적용
- [ ] 315. **[Balance]** 🧠[Pro] 1,000회 이상의 오토 플레이 시뮬레이션을 통한 후반부 경제 정체 구간 해소
- [ ] 316. **[Optim]** 🎨[Graphics] 텍스처 아틀라스 압축 최적화 및 비사용 모델링 에셋 스트리밍 시스템 점검
- [ ] 317. **[Optim]** 🧠[Pro] CPU 프로필링을 통한 실시간 주가 연산 시 메모리 할당(Alloc) 0MB 지향 최적화
- [ ] 318. **[Optim]** PC 환경에서의 프레임 레이트 안정화 및 수직 동기화(V-Sync) 옵션 지원
- [ ] 318-1. **[Optim]** 찌라시 UI 및 파티클 이펙트 생성/파괴 방지를 위한 오브젝트 풀링(Object Pooling) 구현
- [ ] 318-2. **[Optim]** 매일 새벽 04:00(서버 시간) 주기로 가비지 컬렉션(GC) 및 미사용 에셋 강제 해제 루틴 구현
- [ ] 318-3. **[Optim]** 채팅 및 뉴스 로그 메모리 누적 방지를 위한 최대 보관 개수 제한(Data Capping) 시스템 적용
- [ ] 319. **[Test]** 장기 실행(72시간) 테스트를 통한 메모리 누수(Memory Leak) 및 타이머 오차 검증
- [ ] 320. **[Test]** 비정상 종료(Crash) 후 재시작 시 세이브 데이터 자동 복구 및 무결성 전수 테스트
- [ ] 321. **[Test]** 다국어(KR/EN) 텍스트 오버플로우 전수 점검 및 폰트 유니코드 누락 확인
- [ ] 322. **[Test]** 다양한 사양의 PC 환경에서의 UI 렌더링 지연 시간 및 최적화 점검
- [ ] 323. **[Final]** 모든 태스크 `- [x]` 완료 여부 및 각 GDD 문서와의 상호 정합성 전수 대조
- [ ] 324. **[Final]** 스팀웍스(Steamworks) SDK 연동 및 Windows/Mac 빌드 수행
- [ ] 325. **[Final]** 🤖[Claude] 개발 기획서와 최종 빌드 간의 사양 차이점(Spec Diff) 문서 최종 정리
- [ ] 326. **[Final]** 소스코드 주석 정돈 및 클래스 다이어그램 업데이트를 통한 유지보수 준비
- [ ] 327. **[Final]** **StockWars Gold Master v1.0.0** 런처 제작 및 실행 안정성 최종 승인
- [ ] 328. **[Final]** 프로젝트 회고록 작성 및 개발 후기(Post-mortem) 아티클 발행
- [ ] 329. **[Bonus]** 만우절/할로윈 등 예비 시즌 이벤트 에셋 폴더 구축 및 스위칭 로직
- [ ] 330. **[Bonus]** 유저 피드백 수집 및 자동 리포팅(Bug Report) 시스템 백엔드 연동
- [ ] 331. **[Final]** "The Trading Life Begins." - 배포 버튼 클릭 및 런칭 성공 확인
- [ ] 332. **[Post]** 런칭 직후 긴급 패치를 위한 핫픽스 패치 노트 템플릿 제작
- [ ] 333. **[Post]** 실시간 서버 부하 모니터링 및 동시 접속자 수 트래킹 대시보드 셋업
- [ ] 334. **[Social]** 🎨[Graphics] 커뮤니티 배포용 홍보용 고화질 스크린샷 10종 및 트레일러 캡처
- [ ] 335. **[Story]** 히든 스토리: 안나의 과거 회상 씬 해금 조건 최종 밸런스 체크
- [ ] 336. **[Interface]** 게임 패드 및 외부 컨트롤러 지원을 위한 입력 매핑 수동 점검
- [ ] 337. **[Engine]** 유니티 엔진 버전 마이그레이션 도중 발생한 셰이더 오류 최종 클린업
- [ ] 338. **[Resource]** 모든 사운드 에셋의 샘플링 레이트 통일을 통한 오디오 가비지 감소
- [ ] 339. **[Final]** 프로젝트 깃허브 리드미(README) 및 라이선스 고지 문서 정돈
- [ ] 340. **[Final]** 로드맵의 모든 수동 체크 완료 및 사용자 최종 보고 (350/350)
- [ ] 341. **[Phase7]** 릴리즈 이후 첫 번째 메이저 업데이트(부동산 경매) 기획 초안 마련
- [ ] 342. **[Phase7]** 두 번째 플레이어블 캐릭터 '바터' 외전 서사 데이터 구조 설계
- [ ] 343. **[Phase7]** 인게임 경제 데이터를 시각화하여 유저에게 제공하는 웹 대시보드 구축
- [ ] 344. **[Phase7]** 특정 기간 수익률 경쟁을 위한 글로벌 래더(Season) 시스템 예비 설계
- [ ] 345. **[Phase7]** 유저가 직접 가구를 설계하고 업로드하는 모드(Mod) 툴 기초 개발
- [ ] 346. **[Phase7]** VR/AR 플랫폼 이식을 위한 입력 인터페이스 호환성 선행 연구
- [ ] 347. **[Phase7]** 🧠[Pro] 코인(Crypto) 테마의 신규 섹터 및 변동성 미분 로직 추가 설계
- [ ] 348. **[Phase7]** NPC들과의 전화 상호작용 및 실시간 음성 지원 모듈 프로토타이핑
- [ ] 349. **[Phase7]** 유저 간 채무 관계를 증명하는 '전자 차용증' NFT 기반(선택 사항) 설계
- [ ] 350. **[Phase7]** **"The Legend of Traders"** 전체 로드맵 완수 및 사후 지원 트랙 진입

---
**알림**: 개발이 완료된 항목은 `- [x]`로 표시하십시오. 모든 사항은 v5.0.0 초미세 원자적 세분화 체계를 따릅니다.
