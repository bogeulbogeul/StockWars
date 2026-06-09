# ROADMAP 07: 출시 이후 (업데이트 트랙) - 유니티 최적화 개발 순서 개편

**우선순위:** 4. 그 이후에 진행 해도 되는 것
**기간:** 정식 런칭 이후 (Phase 7)
**목표:** 캡스톤 심사 이후 추가될 콘텐츠 (현재 미정)

---

## 🎨 유니티 개발 친화적 6단계 빌드 로드맵

### 🏚️ Phase 1: 전당포 금융 대출 및 중고 담보 시장 (Pawnshop System)
* 바터 전당포에 아이템을 맡기고 담보 대출을 수행하는 기능과 주간 5% 복리 이자 정산, 상환 실패 시 전당포 매대에 중고로 물품이 헐값에 올라가는 루틴입니다.
- [ ] 096. **[CORE_GDD_04]** `CollateralValuation`: 전당포 담보물 가치 산정을 위한 아이템 원가 추적 필드
  - 📖 읽을 문서: `[CORE_GDD_04]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 190. **[MOD_GDD_05]** `PawnLoanProcess`: 바터에게 물건 맡기고 구입가 60% 대출받는 프로세스
  - 📖 읽을 문서: `[MOD_GDD_05]` (Pawnshop SLIM 버전 확인)
- [ ] 191. **[MOD_GDD_05]** 🧠[Pro] `DefaultPawnInterest`: 담보 대출 전용 매주 5% 복리 이자 합산 정산 루틴
  - 📖 읽을 문서: `[MOD_GDD_05]` (Pawnshop SLIM 버전 확인)
- [ ] 192. **[MOD_GDD_05]** `PawnItemStorage`: 담보로 맡긴 물건들을 따로 보관하는 가상 저장소
  - 📖 읽을 문서: `[MOD_GDD_05]` (Pawnshop SLIM 버전 확인)
- [ ] 193. **[MOD_GDD_05]** `RedemptionProcess`: 원금+이자 상환 후 담보물 인벤토리 재지급 로직
  - 📖 읽을 문서: `[MOD_GDD_05]` (Pawnshop SLIM 버전 확인)
- [ ] 205. **[MOD_GDD_05]** `PawnShopUsedMarket`: 유저가 포기한 담보물이 전당포 매대에 올라오는 로직
  - 📖 읽을 문서: `[MOD_GDD_05]` (Pawnshop SLIM 버전 확인)
- [ ] 220. **[MOD_GDD_05]** 🤖[Claude] `PawnShopBargain`: 바터와의 [협상력] 대결을 통해 담보 대출 이율을 깎는 미니 토크
  - 📖 읽을 문서: `[MOD_GDD_05]` (Pawnshop SLIM 버전 확인)

---

### 🏢 Phase 2: 서밋 기관 투자자 시스템 핵심 인프라 (Institutional Core)
* 자산 1M 돌파 시 열리는 '투자 대행 기관' 설립 기능 및 위탁 자산 변동에 따른 15% 운용 수수료의 정산 기능 단계입니다. 스마트폰 홈 화면에 전용 '서밋 앱(Summit App)'이 추가됩니다.
- [ ] 241. **[데모 이후] [MOD_GDD_15]** `InstitutionSetup`: 자산 1M 돌파 시 '기관 설립' 권한 해금 및 스마트폰 '서밋 전용 앱' UI 인프라 구축
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 242. **[데모 이후] [MOD_GDD_15]** `InvestorWaitlist`: 기관 등급에 따른 외부 투자자(Ghost)들의 자금 예치 대기열 로직
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 243. **[데모 이후] [MOD_GDD_15]** `OperatingFeeCalc`: 위탁 자산 변동에 따른 15% 운용 수수료의 주간 정산부
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 289. **[MOD_GDD_15]** `InstitutionLeveling`: 기관 누적 운용액에 따라 '엔젤'에서 '헤지펀드'로 진화하는 레벨 시스템
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 📉 Phase 3: 기관 공매도 및 마진콜/대차 자동상환 (Institutional Shorting)
* 기관 자금으로 대주 거래 및 공매도를 진행하고 마진콜 위험 시 붉은 경고 사이렌 및 5배 벌금의 강제 반대매매 상환 루틴을 구현하는 단계입니다.
- [ ] 246. **[데모 이후] [MOD_GDD_15]** `ShortSellingLogic`: 공매도 주문 시 150% 증거금 강제 홀딩 및 종목 대차 로직
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 247. **[데모 이후] [MOD_GDD_15]** 🎨[Graphics] `MarginCallVisual`: 유지비율 90% 도달 시 화면 테두리가 붉게 깜빡이는 사이렌 FX
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 248. **[데모 이후] [MOD_GDD_15]** `SeizureEngine_AutoCover`: 마진콜 100% 도달 시 시스템에 의한 시장가 강제 대차상환(Cover)
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 249. **[데모 이후] [MOD_GDD_15]** `FiveFoldPenalty`: 강제 청산 발생 시 기본 수수료의 5배를 즉시 차감하는 패널티 루틴
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 281. **[데모 이후] [MOD_GDD_15]** `MarginLiquidationReport`: 강제 청산 후 손실액과 남은 담보금을 요약해주는 '절망의 보고서'
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 286. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `ShortSqueezeEvent`: 유저 공매도 비중이 높은 종목에 시스템 고래가 매수 대전(Short Squeeze)을 거는 이벤트
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 💰 Phase 4: 자금 횡령, 탈세 및 비정상 내부 고발 감지 (Embezzlement & Audit)
* 위탁금의 횡령 판정, 내부 고발자에 의한 매매 탐지, 안나의 차가운 태도 변화, 장부 조작 미니게임 등 다크 경제 리스크 시스템 구축 단계입니다.
- [ ] 244. **[데모 이후] [MOD_GDD_15]** `EmbezzlementEngine`: 위탁금 인출 시 '횡령' 판정 (5% 임계값) 및 도덕 점수 차감
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 245. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `InsiderTradingTracker`: 기관 내부 고발자 시스템에 의한 비정상 매매 탐지 트리거
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 259. **[데모 이후] [MOD_GDD_15]** `RedNoticePreheat`: 횡령 누적 시 안나의 말투가 점차 차갑고 사무적으로 변하는 상태 전이
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 276. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `InstitutionAudit`: 정기적인 기관 감사 이벤트 발생 시 장부 조작 미니게임 연동
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 284. **[데모 이후] [MOD_GDD_15]** `EmbezzlementFeedback`: 횡령 성공 시 단기적으로 자산은 늘지만 전당포 바터의 신뢰도가 하락
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 269. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `TaxEvaderTracker`: 세금 포탈이나 횡령 시도 시 시스템이 실시간으로 추적하는 투기 감시 모니터
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 258. **[데모 이후] [MOD_GDD_15]** `InstitutionalReport`: 기관 운영 수익/손실 및 배당 현황을 정리한 전용 대시보드
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 263. **[데모 이후] [MOD_GDD_15]** 🤖[Claude] `ClientAngryMail`: 수익 배분 지연 시 위탁 투자자들의 항의성 익명 메일 발송 로직
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 272. **[데모 이후] [MOD_GDD_15]** `BrokerFeeDiscount`: 평판 등급 S 이상 시 기관 거래 수수료를 0.5% 감면받는 특혜 로직
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 278. **[데모 이후] [MOD_GDD_15]** `StockNakedShorting`: 리스크는 크지만 하락장에서 유용한 무차입 공매도 해금 조건 설정
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 🚨 Phase 5: 적색 수배 패널티 및 탈출/자수 퀘스트 (Red Notice Arrest)
* 수배 발동 시의 UI 글리치 연출, 자산 동결, 모든 NPC의 거래 거부, 긴박한 추격전 테마 음악 및 현상금 판넬 구현 단계입니다.
- [ ] 298. **[데모 이후] [MOD_GDD_15]** 🎨[Graphics] `RedNotice_UI_Glitch`: 수배 발동 시 전 종목 차트가 붉게 변하며 지지직거리는 글리치 셰이더
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 299. **[데모 이후] [MOD_GDD_15]** `AssetFreezeLogic`: 개인 자산(Wallet) 동결 및 모든 부동산 가구의 상호작용 불가능화
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 300. **[데모 이후] [MOD_GDD_15]** `NpcHostilitySet`: 안나 신뢰도 LV 0 고정 및 타운 내 모든 NPC의 적대적 대사/거래 거부
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 301. **[데모 이후] [MOD_GDD_15]** `RedNoticeBGM`: 수배 기간 동안 흐르는 긴박한 추격전 테마 BGM 크로스페이드
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 302. **[데모 이후] [MOD_GDD_15]** `BountyBoardUI`: 타 유저(또는 AI)들이 수배자의 포지션을 무너뜨리고 보상을 받는 현상금 판넬
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 303. **[데모 이후] [MOD_GDD_15]** 🧠[Pro] `SurvivalTimer`: 자본 세탁 전까지 버텨야 하는 생존 타이머 및 검거 확률 연산부
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 304. **[데모 이후] [MOD_GDD_15]** `PardonQuest`: 안나의 신뢰도를 복구하기 위해 제시되는 거액의 자수금(Bail) 상환 퀘스트
  - 📖 읽을 문서: `[MOD_GDD_15]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 📈 Phase 6: 신규 공석 상장주 선정 및 축하 세레머니 (Dynamic IPO)
* 상장 폐지 등으로 공석이 된 섹터에 맞춰 신규 IPO 상장 종목이 주기적으로 자동 선정되고, 축하 불꽃 FX와 카운트다운을 표시하는 마감 단계입니다.
- [ ] 296. **[CORE_GDD_02]** 🧠[Pro] `IPO_reserveLogic`: 폐지된 종목 섹터에 맞춰 신규 상장주 자동 선정 엔진
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 297. **[CORE_GDD_02]** 🎨[Graphics] `ListingCeremony`: 상장 12시간 전 카운트다운 공시 및 상장 축하 불꽃 FX
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)
