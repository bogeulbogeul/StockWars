# ROADMAP 02: 6월 (GIGDC 출품 준비) - 유니티 조립 공정식 빌드 로드맵

**개발 기조:** 유니티 빈 씬(Empty Scene)에 Canvas와 배경 뼈대를 먼저 올리고, 데이터를 뿌리는 전광판을 셋업한 뒤, 핵심 거래창과 통계를 얹어 조립하는 물리적 개발 순서로 전면 재정리합니다.

---

## 🎨 유니티 빈칸 시작 조립 로드맵 (6단계)

### 🧱 Phase 1: 메인 UI 프레임 및 Canvas 뼈대 셋업 (Base Canvas & Layout)
* 아무것도 없는 빈 유니티 씬에 전체 화면의 규격(해상도)을 맞추고 모든 UI의 부모가 될 마스터 캔버스와 배경 레이아웃을 가장 먼저 수립합니다.
- [ ] 067. **[CORE_GDD_05]** 🎨[Graphics] `MainHUD_Master`: 2D 아늑한 오피스 배경 일러스트를 화면 전체에 렌더링하고, 상단 정보 바 및 사이드 바를 포함하여 매칭 창들이 얹어질 부모 Canvas 레이아웃 앵커 셋업
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 079. **[CORE_GDD_05]** 🎨[Graphics] `Anna_StandingUI`: 3D 캐릭터 대신 아늑한 2D 안나 스탠딩 일러스트를 오피스 캔버스 한편에 고정 배치하고 가벼운 UI 바운싱 모션 구현 (화면 레이아웃 안정화)
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

---

### 🛍️ Phase 3: 핵심 주식 매매창 본체 구현 (OrderWindow & Transaction)
* 흐르는 현재가 데이터를 받아 실제 매수/매도를 체결하고 지갑 잔고를 차감하는 실시간 거래 본체를 마스터 HUD 위에 팝업형태로 얹어 조립합니다.
- [ ] 084. **[CORE_GDD_02]** `OrderWindow_UI`: 수량 입력 필드, 슬라이더, 퀵 비율 버튼(10%, 25%, 50%, 100%), 거래 수수료(0.15%) 연산 및 실시간 매수/매도 트랜잭션 바인딩 UI (5단계 호가 잔량 가로 Bar 그래프 및 개별 종목 VI 사이렌 경보 30초 대기 연출 탑재)
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

### 🌧️ Phase 6: 날씨 환경 오버레이 및 기타 편의 UI (Cozy Weather & Misc UI)
* 아늑하게 내리는 비 오버레이와 빗소리를 가미하여 Cozy 감성을 완성하고, 개발 테스트용 치트 콘솔 및 볼륨 조절 등 기타 보조 기능을 연동하여 최종 마무리합니다.
- [ ] 076. **[CORE_GDD_05]** 🎨[Graphics] `RainFX_Overlay`: 2D 스크린 Rain 오버레이 UI 및 잔물결 입자 연출 (배경 오버레이)
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 087. **[CORE_GDD_05]** 🎨[Graphics] `SceneNavigationUI`: 실제 장소 씬을 이동하는 대신, 맵 선택 시 해당 장소(증권사/은행/상점 등)의 2D 일러스트 배경 이미지로 즉시 전환되는 배경 스위칭 시스템 구축 (홈 오피스, 증권사, 물류 창고 외 타 장소 진입 시 "정식 출시 버전에서 이용 가능합니다." 토스트 팝업 경고를 띄우고 차단하는 데모 제한 필터 탑재)
- [ ] 095. **[CORE_GDD_06]** `CheatConsole_UI`: 개발 테스트를 위한 `~`키 입력 시 나타나는 명령어 입력창
- [ ] 099. **[CORE_GDD_05]** `UI_PanelSnap`: 윈도우 창을 드래그하여 벽면에 스냅(Snap)시키는 편의 기능
- [ ] 106. **[CORE_GDD_05]** 🎨[Graphics] `UI_BlurEffect`: 창이 뜰 때 배경을 은은하게 흐리게 만드는 가우시안 블러 셰이더
- [ ] 110. **[CORE_GDD_05]** `UI_MasterMixer`: 마스터 볼륨 및 각 장소별 앰비언트(빗소리 등) 볼륨 조절 슬라이더
- [ ] 080. **[CORE_GDD_08]** 🎨[Graphics] `CharacterSelectUI`: 초기 외형(머리, 안경, 의상) 선택을 위한 갤러리 뷰
- [ ] 089. **[CORE_GDD_03]** 🎨[Graphics] `LevelUpVisual`: 레벨 상승 시 화면 중앙에 나타나는 금빛 엠블럼과 보상 연출
- [ ] 104. **[CORE_GDD_03]** `StatPointUI`: 포인트 소모하여 직관적으로 능력치 블록을 채우는 업그레이드창
- [ ] 083. **[CORE_GDD_06]** 🎨[Graphics] `AssetDissolveFX`: 가구 압류 시 입자가 흩어지며 사라되는 디졸브(Dissolve) 효과
- [ ] 101. **[CORE_GDD_04]** `BankNPC_Interaction`: 지점장 샤일록과의 대화창 및 대출/상환 선택지 바인딩
- [ ] 102. **[CORE_GDD_04]** `SecuritiesNPC_Interaction`: 에이전트 K와의 대화창 및 아레나 신청 인터페이스
- [ ] 168. **[MOD_GDD_02]** `MiniGameShell`: 미니게임 공통 UI 프리팹
- [ ] 197. **[MOD_GDD_02]** `MiniGameAudio`: 미니게임 효과음 및 백사장 호통 소리
- [ ] 211. **[MOD_GDD_02]** `MiniGameEndSummary`: 알바 종료 후 획득 Gold와 경험치 정산 UI
- [ ] 177. **[MOD_GDD_03]** `InventoryUI_Grid`: 7개 카테고리별 슬롯 생성 및 아이콘 바인딩
- [ ] 178. **[MOD_GDD_03]** `ItemDetailPopup`: 아이템 상세 옵션 및 플레이버 텍스트 노출 윈도우
- [ ] 179. **[MOD_GDD_03]** `EquipController`: 아바타 파츠 실시간 스위칭
- [ ] 198. **[MOD_GDD_03]** 🎨[Graphics] `ItemRarityFX`: 레전더리 등급 아이템 획득 시 전체 아우라 연출
- [ ] 206. **[MOD_GDD_03]** `ItemPurchaseFlow`: 상점에서 가구 구매 시 자금 체크 및 배송 연출
- [ ] 210. **[MOD_GDD_03]** 🎨[Graphics] `InventoryExpansion`: 서랍장 칸 늘리기 아이템 사용 시 그리드 확장 연출
- [ ] 214. **[MOD_GDD_03]** `ItemStorageLock`: 프리미엄 아이템 슬롯 잠금 설정
- [ ] 184. **[MOD_GDD_04]** `RumorInventory`: 획득한 찌라시 전용 수집함 및 열람 인터페이스
- [ ] 187. **[MOD_GDD_04]** 🎨[Graphics] `RumorExpirationFX`: 만료 임박(5분 전) 찌라시 아이콘의 붉은 깜빡임 연출
- [ ] 188. **[MOD_GDD_04]** 🎨[Graphics] `DecoderItemAction`: '찌라시 판독기' 사용 시 마스킹 해제 실시간 연출
- [ ] 204. **[MOD_GDD_04]** 🎨[Graphics] `InformationPurge`: 만료 시 정보가 타 들어가며 사라지는 셰이더 효과
- [ ] 209. **[MOD_GDD_04]** 🎨[Graphics] `CriticalRumorAlert`: 시장 전체에 영향을 주는 빨간색 '치명적 찌라시' 연출
- [ ] 103. **[CORE_GDD_05]** `HUD_Notification`: 찌라시 획득이나 뉴스 발생 시 우측 상단에 뜨는 슬라이드 알림
- [ ] 108. **[CORE_GDD_05]** 🎨[Graphics] `Ticker_NewsSymbol`: 실시간으로 터지는 호재/악재 뉴스 아이콘을 티커에 삽입
- [ ] 078. **[CORE_GDD_05]** 🎨[Graphics] `GlitchCore`: 뉴스 발생 시 UI가 일시적으로 깨지는 도트 글리치 컴포넌트
- [ ] 092. **[CORE_GDD_05]** 🎨[Graphics] `ResolutionScaler`: UI 스프라이트 해상도 최적화 대응
