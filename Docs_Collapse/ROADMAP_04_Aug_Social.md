# ROADMAP 04: 8월 (캡스톤 중반부: 서사/금융 기초 & 에셋 파이프라인)

**우선순위:** 3. 10월 말 캡스톤까지 해야 하는 것
**목표:** [Capstone: Lv.4 ~ 10 확장] 플레이타임 누적에 따른 서사 진행, 핵심 금융 구역(은행/증권사) 에셋 및 스마트폰 기초 해금

> **[AI 주의사항]** 에셋 생성 및 UI 배치 시간을 충분히 고려하여, 8월은 **안나 관련 연출/초상화 에셋과 은행(Node Finance Room) 및 증권사(Cipher Securities Floor) 핵심 2대 구역의 UI 및 비주얼**을 구축하는 것에 중점을 둡니다.

---

## 🎨 기능군(Feature Groups)별 스프린트 계획

### 🏢 Track 1: 금융 구역 그래픽 에셋 및 UI 레이아웃 (Financial District Assets & UI)
- [ ] 123. **[MOD_GDD_01]** 🎨[Graphics] `NodeFinanceRoom`: 은행 내부의 무겁고 빈티지한 금색 조명의 룸 연출 및 프리팹
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 124. **[MOD_GDD_01]** 🎨[Graphics] `CipherSecuritiesFloor`: 증권사 내부의 대형 전광판과 트레이딩 데스크 레이아웃 및 UI 배치
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)

### 👩 Track 2: 안나(Anna) 비주얼 에셋 및 상호작용 애니메이션 (Anna Visuals & Interactions)
- [ ] 231. **[MOD_GDD_06]** 🎨[Graphics] `AnnaAnimator`: 안나의 감정별(Happy, Sad, Angry, Blush) 자연스러운 표정 전이
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 145. **[MOD_GDD_06]** `Anna_OfficeRoutine`: 안나가 책상에 앉아 키보드를 두드리거나 자료를 검토하는 대기 동작 연출
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 155. **[MOD_GDD_06]** `Anna_InteractivePoint`: 안나 옆에 섰을 때 '대화하기(F)' 상호작용 툴팁이 뜨는 위치 매핑
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 234. **[MOD_GDD_06]** `Anna_OfficePos`: 오피스 내 안나의 위치 매핑 및 시간대별 대기 동작(애니메이션) 분기
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)

### 🗣️ Track 3: 대화 시스템 코어 및 다이얼로그 연출 (Dialogue System Core & Delivery)
- [ ] 232. **[MOD_GDD_07]** 🤖[Claude] `DialogueSystemCore`: 텍스트 타이핑 효과 및 유저 선택지에 따른 결과 분기 엔진 (대화 UI)
  - 📖 읽을 문서: `[MOD_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 231-1. **[MOD_GDD_06]** 🤖[Claude] `RichPoorSpeechEngine`: 유저 자산 규모를 체크하여 NPC의 대사 톤앤매너 필터링
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 290. **[MOD_GDD_07]** `DialogueHistoryViewer`: 현재 대화 세션의 이전 텍스트들을 위로 스크롤하여 다시 읽는 역사보기 UI
  - 📖 읽을 문서: `[MOD_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)

### 👥 Track 4: NPC 및 외부 초상화 데이터 (NPC Registry & Visual Profiles)
- [ ] 235. **[MOD_GDD_06]** 🎨[Graphics] `BarterNpcProfile`: 전당포 주인 바터의 고해상도 초상화 및 대기 상태 구축
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)

### 📱 Track 5: 스마트폰 UI 프레임워크 및 메일/뉴스 앱 (Smartphone UI & Core Apps)
- [ ] 233. **[MOD_GDD_11]** `SmartphoneUI`: 화면 우하단 스마트폰 아이콘 및 앱 서랍 슬라이드 애니메이션 UI
  - 📖 읽을 문서: `[MOD_GDD_11]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 234-1. **[MOD_GDD_11]** `MailApp_List`: 시스템 및 NPC 메일 수신 목록, 중요도 필터 및 읽음 처리 기능 UI
  - 📖 읽을 문서: `[MOD_GDD_11]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 237. **[MOD_GDD_12]** `NewsAgencyApp`: 가상 언론사의 속보 알림 및 과거 기사 아카이빙 조회 앱 UI
  - 📖 읽을 문서: `[MOD_GDD_12]` (Docs_Collapse에서 SLIM 버전 확인)

### 💞 Track 6: 안나 서사 및 친밀도 알고리즘 (Anna Narrative & Affection Logic)
- [ ] 232-1. **[MOD_GDD_06]** 🧠[Pro] `AffectionLogic`: 안나와의 누적 친밀도(0~100) 데이터 및 가중치 연산 엔진
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 233-1. **[MOD_GDD_06]** 🤖[Claude] `AnnaDailyBriefing`: 매일 아침 안나가 시장 상황과 유저 자산을 요약해주는 브리핑 로직
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 235-1. **[MOD_GDD_11]** `AnnaWelcomeGift`: 안나의 웰컴 선물(10,000G) 및 친밀도 기반 특별 메일 보상 시스템
  - 📖 읽을 문서: `[MOD_GDD_11]` (Docs_Collapse에서 SLIM 버전 확인)

### 🏦 Track 7: 부채 회생 및 고스트 트레이더 고도화 (Debt Relief & Ghost Trader Core)
- [ ] 238. **[MOD_GDD_13]** 🧠[Pro] `GhostTraderAI`: 시장 유동성을 공급하는 고스트 트레이더들의 구역별 매매 알고리즘
  - 📖 읽을 문서: `[MOD_GDD_13]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 239. **[MOD_GDD_14]** `DebtReliefWizard`: 파산 시나리오 진입 시 회생 신청 가능 여부 판정 및 절차 위저드 UI
  - 📖 읽을 문서: `[MOD_GDD_14]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 240. **[MOD_GDD_14]** `DebtForgivenessLogic`: 회생 승인 시 이자 즉시 탕감 및 원금 50% 유예 트랙 전환 논리
  - 📖 읽을 문서: `[MOD_GDD_14]` (Docs_Collapse에서 SLIM 버전 확인)
