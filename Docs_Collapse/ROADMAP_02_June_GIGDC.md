# ROADMAP 02: 6월 (GIGDC 출품 준비) - 데모 특화 조립식 로드맵

**개발 기조:** 6월 데모에서는 **홈 오피스, 증권사, 물류 창고**의 3개 장소만 진입이 허용됩니다. 이에 따라 은행, 일반 가구/의류 상점 등 접근이 차단되는 장소와 관련된 태스크(대출 상환, 가구 구매 상점, 인벤토리 스킨 스위칭 등)를 로드맵에서 전면 제외(정식 버전으로 이월)하여 실질적인 개발 스코프를 핵심에만 집중시킵니다.

---

## 🎨 데모 빌드 전용 조립 로드맵 (6단계)

### 🧱 Phase 1: 메인 UI 프레임 및 Canvas 뼈대 셋업 (Base Canvas & Layout)
* 아무것도 없는 빈 유니티 씬에 전체 화면 해상도를 맞추고 모든 UI의 부모가 될 마스터 캔버스와 배경 레이아웃을 가장 먼저 수립합니다.
- [x] 067. **[CORE_GDD_05]** 🎨[Graphics] `MainHUD_Master`: 2D 아늑한 오피스 배경 일러스트를 화면 전체에 렌더링하고, 상단 정보 바 및 사이드 바를 포함하여 매칭 창들이 얹어질 부모 Canvas 레이아웃 앵커 셋업
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [x] 079. **[CORE_GDD_05]** 🎨[Graphics] `Anna_StandingUI`: 3D 캐릭터 대신 아늑한 2D 안나 스탠딩 일러스트를 오피스 캔버스 한편에 고정 배치하고 가벼운 UI 바운싱 모션 구현 (화면 레이아웃 안정화)
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 📊 Phase 2: 실시간 마켓 피드 및 HUD 데이터 연동 (Market Feed & Display)
* 뼈대가 잡힌 화면 위에 24시간 실시간 가격 데이터와 시간이 흐르는 전광판을 연결하여 데이터가 정상적으로 수신되는지 먼저 검증합니다.
- [ ] 097. **[CORE_GDD_05]** `MainHUD_TimeDisplay`: 상단 중앙에 현재 요일과 디지털 시각을 실시간 표기 (24시간 무중단 시간 흐름 동기화)
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 069. **[CORE_GDD_05]** `BottomTicker_Loop`: 24개 종목명이 하단에 무한 루프로 스크롤되며 실시간 시세를 노출하는 티커 UI 제작 (이후 클릭 시 해당 종목 매매창이 팝업되는 연결 통로 확보)
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 071. **[CORE_GDD_05]** 🎨[Graphics] `TickerColorFX`: 실시간 가격 변동에 따른 상승(Cyan)/하락(Peach) 텍스트 색상 및 글로우 셰이더 피드백 효과 적용
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 128. **[CORE_GDD_06]** `WebClient_Socket`: 실제 마스터 서버에 접속하여 24시간 실시간 주가 데이터, 채팅 릴레이, 거래 체결 요청을 처리하는 Unity 클라이언트 네트워크 소켓 매니저 (배칭 패킷 수신 및 UI 스로틀링 렌더링 최적화 탑재)
  - 📖 읽을 문서: `[CORE_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 244. **[CORE_GDD_06]** `StockWars_Server` (Node.js / WebSocket): 단일 채널 최대 50명 동시 접속(Connection Pooling) 및 패킷 라우팅 수용, 실시간 주가 연산 및 브로드캐스트, 거래 패킷 정합성 검증, 서버 시각(NTP) 공급 및 50인 동시 세션 내 실시간 채팅 릴레이를 처리하는 독립형 백엔드 서버 코어 구축 (1초 단위 주가 패킷 배칭 및 100ms 채팅 큐 최적화 필수 적용)
  - 📖 읽을 문서: `[CORE_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 🛍️ Phase 3: 핵심 주식 매매창 본체 구현 (OrderWindow & Transaction)
* 흐르는 현재가 데이터를 받아 실제 매수/매도를 체결하고 지갑 잔고를 차감하는 실시간 거래 본체를 마스터 HUD 위에 팝업형태로 얹어 조립합니다.
- [ ] 084. **[CORE_GDD_02]** `OrderWindow_UI`: 수량 입력 필드, 슬라이더, 퀵 비율 버튼(10%, 25%, 50%, 100%), 거래 수수료(0.15%) 연산 및 실시간 매수/매도 트랜잭션 바인딩 UI (대기 없는 100% 즉시 시장가 체결 방식 적용, 5단계 호가 잔량 가로 Bar 그래프 및 개별 종목 VI 사이렌 경보 30초 대기 연출 탑재)
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 068. **[CORE_GDD_05]** `StatTextLerp`: 골드(Gold) 및 자산 변동 시 수치 텍스트가 부드럽게 드르륵 굴러가며 상승/하락하는 시각적 숫자 연출 (매매 성공 시 쾌감 극대화)
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 🔔 Phase 4: 개인 계좌 포트폴리오 및 주간 성과 레포트 (Portfolio & Weekly Report)
* 매매를 마친 뒤 내 보유 주식 현황과 자산 비중을 언제든 자가 모니터링하고, 주말이 끝날 때 주간 정산 보고서를 받아볼 수 있도록 정보 팝업창을 통합 조립합니다.
- [ ] 085. **[CORE_GDD_02]** `Portfolio_UI`: 총자산/평가손익 요약, 보유 종목별 평단가 및 수익률 그리드, 섹터별 보유 비중 가로 Bar, 그리고 누적 실현손익/수수료 등 거래 내역 통계를 노출하는 개인 계좌 포트폴리오 팝업창 (HUD 상의 단추나 스마트폰 앱을 통해 토글)
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 090. **[CORE_GDD_04]** `WeeklyFinancialReportUI`: 매주 월요일 정산 시점의 내역(이자/유지비/배당금) 영수증과 함께 이번 주 투자 스타일 분석(예: 스캘퍼, 가치 투자 등), 최고/최악 수익 종목 통계를 세련되게 담아내는 주간 투자 성과 보고서 팝업
  - 📖 읽을 문서: `[CORE_GDD_04]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 093. **[CORE_GDD_02]** 🎨[Graphics] `FinancialStatusLED`: 주간 정산 안전 등급 상태(Green/Yellow/Red)를 화면 속 조명 아이콘의 단순 색상 전환으로 연출 (책상 위 UI 요소로 렌더링)
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 052. **[CORE_GDD_02]** 🎨[Graphics] `WeeklySettlementAlertFX`: 주간 금융 정산 완료 시 증권사 UI가 반짝이며 정산 결과를 알리는 연출
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 053. **[CORE_GDD_02]** 🎨[Graphics] `SidecarAlertFX`: 특정 섹터 급등락 시 전광판 티커가 황색으로 점멸하며 "사이드카 발동 (30초 거래 중지)" 메시지 알림 및 경보 앰비언트 사운드 재생 연출
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 📈 Phase 5: 주가 실시간 선/봉 차트 렌더러 (Visual Price Charts)
* 거래창 내부에 결합하여 실시간 가격 변화 추이를 시각화해 주는 정밀한 주가 차트 구성 요소들을 구현합니다.
- [ ] 072. **[CORE_GDD_05]** 🧠[Pro] `AreaChart_Core`: Mesh API 기반의 실시간 주가 선 및 면 선형 렌더러
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 098. **[CORE_GDD_05]** `ChartGridRenderer`: 가격대 구분을 위한 차트 배경 눈금 및 실시간 수평선
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 073. **[CORE_GDD_05]** `ChartTooltip`: 차트 위에 마우스 포인터 위치 시 해당 시점 주가/시간 팝업
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 074. **[CORE_GDD_05]** `ChartTimeline`: 시간축(1H, 1D, 7D) 전환 시 데이터 리인덱싱 및 리렌더링
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 105. **[CORE_GDD_02]** 🧠[Pro] `CandleStick_Renderer`: 봉 차트 보기 모드 전환을 위한 시가/고가/저가/종가 계산부
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 🌧️ Phase 6: 데모 전용 편의 UI 및 장소 상호작용 (Demo Scope Integration)
* 6월 데모에서 실제로 진입이 열려 있는 증권사, 물류 창고의 상호작용과 맵 전환 기능 및 주식 보조 도구(찌라시 수집함 등)들을 조립하여 빌드를 완결합니다.
- [ ] 087. **[CORE_GDD_05]** 🎨[Graphics] `SceneNavigationUI`: 실제 장소 씬을 이동하는 대신, 맵 선택 시 해당 장소(증권사/은행/상점 등)의 2D 일러스트 배경 이미지로 즉시 전환되는 배경 스위칭 시스템 구축 (홈 오피스, 증권사, 물류 창고 외 타 장소 진입 시 "정식 출시 버전에서 이용 가능합니다." 토스트 팝업 경고를 띄우고 차단하는 데모 제한 필터 탑재)
- [ ] 076. **[CORE_GDD_05]** 🎨[Graphics] `RainFX_Overlay`: 2D 스크린 Rain 오버레이 UI 및 잔물결 입자 연출 (배경 오버레이)
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 102. **[CORE_GDD_04]** `SecuritiesNPC_Interaction`: 증권사에서 에이전트 K와의 대화창 연동 및 모바일 아레나 매칭 신청 인터페이스 구현
  - 📖 읽을 문서: `[CORE_GDD_04]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 124. **[MOD_GDD_01]** 🎨[Graphics] `CipherSecuritiesFloor`: 증권사 내부의 대형 호가 전광판과 트레이딩 데스크 레이아웃 및 에이전트 K의 2D 스탠딩 일러스트를 배치하여 증권사 전용 2D 룸 비주얼 완성 (8월에서 6월 데모를 위해 풀업 수용)
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 168. **[MOD_GDD_02]** `MiniGameShell`: 물류 창고에서 수행할 물류 미니게임의 공통 UI 프레임 프리팹
- [ ] 197. **[MOD_GDD_02]** `MiniGameAudio`: 물류 알바 효과음 및 백사장 호통 앰비언트 오디오 연동
- [ ] 211. **[MOD_GDD_02]** `MiniGameEndSummary`: 알바 종료 후 일급(Gold)과 경험치 정산을 표시하는 정산 팝업 UI
- [ ] 184. **[MOD_GDD_04]** `RumorInventory`: 획득한 주식 찌라시들을 홈 오피스/스마트폰에서 모아보는 전용 수집함 UI
- [ ] 187. **[MOD_GDD_04]** 🎨[Graphics] `RumorExpirationFX`: 만료 임박(5분 전) 찌라시 아이콘의 붉은 깜빡임 연출
- [ ] 188. **[MOD_GDD_04]** 🎨[Graphics] `DecoderItemAction`: 홈 오피스에서 '찌라시 판독기' 사용 시 마스킹 텍스트가 지워지며 원래 찌라시가 해독되는 연출
- [ ] 204. **[MOD_GDD_04]** 🎨[Graphics] `InformationPurge`: 만료된 찌라시가 타 들어가는 파티클 효과와 함께 사라지는 연출
- [ ] 209. **[MOD_GDD_04]** 🎨[Graphics] `CriticalRumorAlert`: 시장 전체에 영향을 미치는 붉은색 '치명적 찌라시'의 HUD 전체 긴급 점멸 알림 연출
- [ ] 103. **[CORE_GDD_05]** `HUD_Notification`: 주가 급등락, 뉴스 발생 시 우측 상단 슬라이드 팝업 알림 (클릭 시 스마트폰 연동)
- [ ] 108. **[CORE_GDD_05]** 🎨[Graphics] `Ticker_NewsSymbol`: 실시간으로 터지는 호재/악재 뉴스 아이콘을 티커에 삽입
- [ ] 078. **[CORE_GDD_05]** 🎨[Graphics] `GlitchCore`: 치명적 악재 발생 시 HUD가 찌그러지며 깨지는 도트 글리치 컴포넌트
- [ ] 095. **[CORE_GDD_06]** `CheatConsole_UI`: 개발 디버그용 치트키 입력창 (`~` 키 오픈)
- [ ] 110. **[CORE_GDD_05]** `UI_MasterMixer`: 게임 및 빗소리 볼륨 조절 오디오 믹서 슬라이더
- [ ] 099. **[CORE_GDD_05]** `UI_PanelSnap`: 팝업 윈도우를 화면 경계로 끌어다 붙이는 스냅 편의성
- [ ] 106. **[CORE_GDD_05]** 🎨[Graphics] `UI_BlurEffect`: 팝업 윈도우 활성화 시 배경 2D 이미지를 뿌옇게 처리하는 가우시안 블러 효과
