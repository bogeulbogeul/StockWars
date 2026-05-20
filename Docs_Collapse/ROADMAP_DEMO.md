# StockWars 데모 로드맵 (v6.0-DEMO)

**기간**: 2026-05-20 ~ 2026-06-30 (GIGDC 제출)
**범위**: 튜토리얼 → 캐릭터 레벨 3 데모 빌드
**작업 단위**: 마일스톤(M) 1개 = AI 세션 1개

> [!IMPORTANT]
> 이 로드맵은 **데모 범위 전용**입니다.
> 원본 350개 항목 중 약 110개를 36개 마일스톤으로 묶었습니다.
> `[데모 이후]` 항목과 단순 그래픽 폴리싱 작업은 데모 이후로 미뤘습니다.

---

## ✅ Milestone 1~2: 코어 인프라 (완료)

- [x] **M1.** URP 셋업, 폴더 구조, Singleton, EventBus, PoolManager, SceneSwitcher, TickEngine
       - 참조: `CORE_GDD_01`
- [x] **M2.** SaveDataDTO + SaveMetadata + LevelEngine + GlobalConstants
       - 참조: `CORE_GDD_03`, `CORE_GDD_06`

---

## 🛠️ Sprint 1 잔여 (5월 4주차)

- [ ] **M3.** 시간/저장 시스템 통합
       - `CalendarSystem.cs`: 요일/시간 연동, 월요일 00:00 정산 트리거
       - `DataSerializer.cs`: JSON.NET 기반 인코딩
       - `IOManager.cs`: 암호화 저장/로드 + 무결성 검증
       - `AutoSaveRouter.cs`: 자동 저장 주기
       - 참조: `CORE_GDD_06`

- [ ] **M4.** 주식 마스터 데이터 (StockDataSO)
       - 24개 종목 × 8섹터 일괄 정의 (IT/엔터/인프라/바이오/항공우주/유통/에너지/금융)
       - 컬럼: 종목명, 상장가, 배당률, 변동성 Tier (S~C), 호재/악재 감도
       - CSV로 임포트 (`Assets/Data/Resources/Stocks.csv`)
       - 참조: `CORE_GDD_02`

- [ ] **M5.** 가격 엔진 코어
       - `RNG_System.cs`: 시드 기반 PRNG
       - `PriceEngine.cs`: 매수 압력 + 변동성 가중치 합산
       - `BuyPressure.cs`: 물량 고갈 시 제곱근 가격 폭등
       - `VolatilityTier.cs`: S~C 등급별 변동폭 제한
       - 참조: `CORE_GDD_02`

- [ ] **M6.** 시장 사이클 & 히스토리
       - `TrendEngine.cs`: 168시간 주기 상승/하락 전환
       - `CircularBuffer.cs`: 최근 168틱 가격 보존
       - `MarketTimer.cs`: 게임 내 날짜/요일 흐름
       - `MarketManager.cs`: 24종목 인스턴스화
       - 참조: `CORE_GDD_02`

- [ ] **M7.** 시장 보조 시스템
       - `GhostTrader.cs`: 365일 마이크로 변동 봇
       - `PeakTracker.cs`: ATH 트래킹
       - `BasePriceInit.cs`: 섹터별 상장가 동적 생성
       - 참조: `CORE_GDD_02`, `MOD_GDD_13_GhostTrader`

---

## 🛠️ Sprint 2 (6월 1주차)

- [ ] **M8.** 시장 이벤트
       - `DividendController.cs`: 72시간 보유 시 배당
       - `SplitChecker.cs`: 100만G 도달 시 액면분할
       - `DelistingMonitor.cs`: 상장가 1% 미만 시 상폐
       - `IPO_Service.cs`: 상폐 공석 시 신규 상장
       - 참조: `CORE_GDD_02`

- [ ] **M9.** 플레이어 지갑 & 자산
       - `WalletManager.cs`: 현금/이자/배당 정산
       - `NetWorthCore.cs`: 포트폴리오 + 가구 합산
       - 참조: `CORE_GDD_03`

- [ ] **M10.** 스탯 & 평판 시스템
       - `StatCore.cs`: 협상력/분석력/운용력/회복력
       - `ReputationSystem.cs`: F~S 명성 등급
       - `ResilienceStat.cs`: 회복력 → 일일 알바 횟수 확장
       - `StatPointUI`: 포인트 분배 UI
       - 참조: `CORE_GDD_03`

- [ ] **M11.** 부채 & 대출 시스템
       - `DebtKernel.cs`: 원금/이자/정산일 데이터 구조
       - `InterestCycle.cs`: 매주 월요일 2.0% 이자
       - `AnnaWelcomeGift.cs`: 최초 대출 시 168시간 무이자
       - `LoanEvaluator.cs`: 대출 한도 연산
       - 참조: `CORE_GDD_04`

- [ ] **M12.** 상환 & 압류
       - `AutoRepayment.cs`: 배당금 자동 차감
       - `ManualRepayment.cs`: 유저 입력 부분 상환
       - `SeizureManager.cs`: 자산 0 이하 시 압류 순차 실행
       - `InterestReportUI`: 월요일 정산 팝업
       - 참조: `CORE_GDD_04`
       - **참고**: 공매도/MarginCall은 데모 외로 연기 권장

---

## 🛠️ Sprint 2 (6월 2주차)

- [ ] **M13.** 메인 HUD
       - `MainHUD_Master`: 상단 바 + 사이드 메뉴
       - `MainHUD_TimeDisplay`: 요일/시각 표기
       - `StatTextLerp`: 골드 변동 시 카운트업 연출
       - 참조: `CORE_GDD_05`

- [ ] **M14.** 하단 티커
       - `BottomTicker_Loop`: 24종목 무한 스크롤
       - `TickerDataBinder`: 실시간 주가 바인딩
       - `TickerColorFX`: 상승/하락 색상 + 글로우
       - 참조: `CORE_GDD_05`

- [ ] **M15.** 차트 시스템
       - `AreaChart_Core`: Mesh API 기반 면 차트
       - `ChartTooltip`: 마우스 호버 시 정보 팝업
       - `ChartTimeline`: 1H/1D/7D 전환
       - `ChartGridRenderer`: 배경 눈금
       - 참조: `CORE_GDD_05`

- [ ] **M16.** 매매 윈도우
       - `OrderWindow_UI`: 수량/슬라이더/총액
       - `QuickBuyToggle`: 100% 매수 단축
       - `TransactionLogger`: 거래 일지 기록
       - 참조: `CORE_GDD_02`

- [ ] **M17.** UI 공통 인프라
       - `UI_SafeArea`, `UI_Navigation`
       - `TooltipManager`: 전역 툴팁
       - `HUD_Notification`: 우측 상단 슬라이드 알림
       - `UI_SfxAtlas`: UI 사운드 연동
       - 참조: `CORE_GDD_05`

---

## 🛠️ Sprint 3 (6월 3주차)

- [ ] **M18.** 캐릭터 생성 & 시작
       - `CharacterSelectUI`: 머리/안경/의상 선택
       - `AvatarDataMapping`: 파츠 → 캐릭터 적용
       - `StarterPackDistributor`: 초기 5,000G + 기본 가구
       - `CareerPathInit`: 초기 스탯 분배
       - 참조: `CORE_GDD_08`

- [ ] **M19.** 대화 시스템 코어
       - `DialogueSystemCore`: 타이핑 효과 + 선택지 분기
       - `DialogueCameraZoom`: NPC 줌인
       - 참조: `MOD_GDD_07_DialogueDB`

- [ ] **M20.** 안나 NPC (핵심)
       - `Anna_IdleState`: 오피스 내 대기 위치
       - `Anna_MovementSet`: 시간대별 위치 이동
       - `Anna_InteractivePoint`: 상호작용 툴팁
       - 안나 튜토리얼 대사 세트
       - 참조: `MOD_GDD_06`, `MOD_GDD_07_1_Dialogue_Anna`

- [ ] **M21.** 기관 NPC 상호작용
       - `BankNPC_Interaction`: 샤일록 (은행)
       - `SecuritiesNPC_Interaction`: 에이전트 K (증권)
       - 바터 (전당포): 기본 대화만
       - 참조: `MOD_GDD_06`

---

## 🛠️ Sprint 3 (6월 4주차)

- [ ] **M22.** 알바 시스템 골조
       - `JobSystemController`: 알바 리스트 + 보상
       - `JobLimitSystem`: 일일 3회 (회복력 비례 최대 5회)
       - `MiniGameShell`: 미니게임 공통 UI
       - `JobResultCalculator`: 스코어 → Gold/평판
       - 참조: `MOD_GDD_02`

- [ ] **M23.** 미니게임 3종 (간이 구현)
       - 편의점: 클릭/타이밍
       - 상하차: 좌우 균형 (간단 물리)
       - 치킨집: 시퀀스 입력
       - **참고**: 전체 기능은 데모 후로. 데모는 플레이 가능 여부만 검증.

- [ ] **M24.** 알바 보조
       - `EnergyDrinkItem`: 500G 사용 시 횟수 +2
       - `JobPromotion`: 누적 시 시급 1.1~1.5배
       - `MiniGameEndSummary`: 결과 UI
       - 참조: `MOD_GDD_02`

- [ ] **M25.** 아이템 & 인벤토리 골조
       - `ItemMasterTable`: CSV 로드 (가구/의상 50종 정도로 시작)
       - `InventoryUI_Grid`: 카테고리별 슬롯
       - `ItemDetailPopup`: 상세 옵션
       - `EquipController`: 아바타 파츠 스위칭
       - 참조: `MOD_GDD_03`

- [ ] **M26.** 아이템 보조
       - `ItemPurchaseFlow`: 구매 자금 체크
       - `InventorySort`: 정렬 필터
       - 데모에는 비비안 스토어 NPC 1명만 등장
       - 참조: `MOD_GDD_03_1_VivianStore`

- [ ] **M27.** 찌라시 시스템 메커니즘
       - `RumorGenerator`: 알바 성공 시 30% 확률
       - `RumorInventory`: 수집함 UI
       - `BurnTimerLogic`: 60분 자동 삭제
       - `InsightMaskingEngine`: 분석 LV 1~5 마스킹
       - 참조: `MOD_GDD_04_RumorLibrary_SLIM` (이 폴더)

- [ ] **M28.** 찌라시 데이터 (샘플)
       - 종목 3~5개 × 호재/악재 × Tier 1~3 텍스트
       - CSV: `Assets/Data/Resources/Rumors.csv`
       - 참조: `MOD_GDD_04_RumorLibrary_SLIM`
       - **참고**: 24종목 전체는 데모 후

---

## 🛠️ 데모 마무리 (6월 4주차 후반)

- [ ] **M29.** 튜토리얼 플로우
       - `Tutorial.FlowManager`: 최초 접속 시 단계 트리거
       - 안나의 환영 → 첫 매매 → 첫 알바 → 레벨 1 달성 흐름
       - 참조: `CORE_GDD_10_TutorialSystem`

- [ ] **M30.** 저장 안정성
       - `SaveSafetyCheck`: 전원 차단 대비 백업
       - `ErrorLogger`: 런타임 예외 팝업
       - 참조: `CORE_GDD_06`

- [ ] **M31.** 오디오 시스템
       - `AudioMixerSetup`: BGM/SFX/Ambient 믹싱
       - `BGMController`: 씬 전환 크로스페이드
       - `UI_MasterMixer`: 볼륨 슬라이더
       - 참조: `CORE_GDD_05`

- [ ] **M32.** 개발 도구
       - `DebugConsole` + `CheatConsole_UI`: `~`키로 치트
       - `TimeScaleController`: 개발용 배속
       - 참조: `CORE_GDD_01`, `CORE_GDD_06`

---

## 🎯 빌드 게이트 (제출 전)

- [ ] **M33.** 12시간 연속 실행 안정성 테스트
       - 메모리 누수, 타이머 오차 검증
       - 비정상 종료 후 세이브 복구 테스트

- [ ] **M34.** 밸런스 패스
       - 데모 구간(튜토리얼 ~ Lv.3) 플레이타임 약 2~3시간 목표로 조정
       - 알바 보상 / 주가 변동성 / 대출 이자 균형 점검

- [ ] **M35.** UI 폴리시
       - 모든 윈도우 열기/닫기 애니메이션
       - 폰트 오버플로우 점검
       - 1080p / 1440p 해상도 대응

- [ ] **M36.** GIGDC 제출 빌드
       - Windows 64bit 빌드
       - 실행 파일 안정성 최종 확인
       - 제출

---

## ⛔ 데모 외 (BACKLOG)

데모 빌드에는 들어가지 않습니다. 7월 이후에 작업합니다.

- 건설/그리드 시스템 (월드 인테리어) → `Docs/` Phase 4
- 기관 시스템 (`MOD_GDD_15`) → 자산 1M 도달 후 해금
- 신디케이트 (`MOD_GDD_16`)
- 적색 수배 시스템 → Phase 6
- 퀴즈 시스템 (`MOD_GDD_18`)
- IPO 찌라시 (`MOD_GDD_19`)
- 부동산 경매, 모드 툴, VR/AR → Phase 7
- 공매도 / MarginCall 풀 구현
- 엔딩 시스템 3종 (General/Wealthy/Cipher's Vow)

---

**규칙 재확인:**
- 마일스톤 1개 = 새 AI 세션 1개
- 🤖[Claude] 태그 사용 금지 (이 로드맵에 없음)
- `Docs_Collapse/` 외 다른 GDD 참조 안 함 (`Docs/` 원본은 데모 후)
