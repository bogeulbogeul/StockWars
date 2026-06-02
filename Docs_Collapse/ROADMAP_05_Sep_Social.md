# ROADMAP 05: 9월 (캡스톤 중반부: 생활/소셜 구역 해금 & 수집 심화) - 유니티 최적화 개발 순서 개편

**우선순위:** 3. 10월 말 캡스톤까지 해야 하는 것
**목표:** [Capstone: Lv.4 ~ 10 확장] 타운 내 생활 상점(전당포/치킨집/상하차/편의점) 비주얼 해금, 투자 신디케이트 아지트 및 수집/도감 UI 배치

> **[AI 주의사항]** 에셋 생성 및 UI 배치 소요를 감안하여, 9월은 **4대 생활/상업 구역의 실내외 그래픽을 구현하고, 신디케이트 비밀 아지트/리더보드 UI 및 의상/헤어/도감 등 각종 꾸미기 및 아카이브 UI 배치**에 완전히 집중합니다.

---

## 🎨 유니티 개발 친화적 6단계 빌드 로드맵

### 🏪 Phase 1: 타운 생활/상점 구역 에셋 및 실내 씬 셋업 (Town Commercial Setup)
* 전당포, 치킨 주방, 물류 허브, 편의점 내부의 오브젝트 정렬 및 충돌체, 상호작용 인터페이스를 얹는 씬 빌딩 단계입니다.
- [ ] 125. **[MOD_GDD_01]** 🎨[Graphics] `DustyRoomInterior`: 전당포 내부의 어두운 필터와 먼지 날리는 먼지 입자 FX 연출 및 에셋 배치
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 126. **[MOD_GDD_01]** 🎨[Graphics] `RoosterKitchen`: 치킨집 주방 미니게임 진입을 위한 주방 조리대와 집기 에셋 및 UI 배치
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 127. **[MOD_GDD_01]** 🎨[Graphics] `LogisticsHub`: 상하차 센터의 컨베이어 벨트 구동 애니메이션 및 물류 상자 적재함 에셋 배치
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 128. **[MOD_GDD_01]** 🎨[Graphics] `Neon24Store`: 편의점 내부의 밝은 형광등과 빼곡한 진열대 상호작용 지점 에셋 및 UI 구축
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 🌃 Phase 2: 타운 환경 연출 고도화 및 날씨 연동 (Advanced Town FX)
* 외부 타운 건물의 마우스 오버 아웃라인, 환경 사운드, 가로등 후광, 신호등, 날씨 변화에 따른 조명 연동 등 월드 디테일을 채우는 단계입니다.
- [ ] 148. **[MOD_GDD_01]** 🎨[Graphics] `BuildingOutlineFX`: 마우스 오버한 타운 건물의 외곽선이 얇게 빛나는 아웃라인 연출
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 154. **[MOD_GDD_01]** 🎨[Graphics] `NeonSignGlitch`: 야간에 타운 네온사인이 미세하게 지지직거리며 글리치가 나는 연출
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 159. **[MOD_GDD_01]** 🎨[Graphics] `ReflectionShader`: 전당포나 은색 건물 유리창에 비치는 노란색 가로등 빛 반사 연출
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 165. **[MOD_GDD_01]** 🎨[Graphics] `StreetLightGlow`: 밤에 가로등 주변으로 은은하게 퍼지는 라이트 후광 효과(Halo) 제작
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 163. **[MOD_GDD_01]** `TrafficLightAnim`: 타운 도로의 신호등이 빨강/초록으로 주기적으로 변하는 애니메이션
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 162. **[MOD_GDD_01]** `WeatherSyncLogic`: 맑음/비/안개발생에 따른 타운 전체 라이트 강도 및 색온도 조절
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 153. **[MOD_GDD_01]** `AmbientCrowdSound`: 타운 중앙 광장 진입 시 웅성웅성거리는 환경 소음 자동 재생
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 160. **[MOD_GDD_01]** `VendingMachine`: 타운 곳곳에 배치된 자판기 클릭 시 짧은 캔 따는 소리와 효과음 재생
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 📚 Phase 3: 수집/도감 라이브러리 및 의상 커스터마이징 (Collection & Wardrobe)
* 획득한 가구/의상 수집 실루엣 도감 UI, 옷장 세트 버프, 이발소 커스텀, 아이템 분해/강화 등 꾸미기 및 수집 시스템 완성 단계입니다.
- [ ] 227. **[MOD_GDD_17]** `ArchiveUI_Layout`: 실루엣 프리뷰, 등급별 필터링, 로어 텍스트를 포함한 도감 UI 배치
  - 📖 읽을 문서: `[MOD_GDD_17]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 230. **[MOD_GDD_17]** `ArchiveSilhouette`: 미획득 아이템의 실루엣 연출 및 획득처 가이드 UI 배치
  - 📖 읽을 문서: `[MOD_GDD_17]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 226. **[MOD_GDD_17]** `CollectionMaster.cs`: 아이템 ID 기반 수집 여부 및 CP(Collection Point) 합산 엔진
  - 📖 읽을 문서: `[MOD_GDD_17]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 228. **[MOD_GDD_17]** `CP_TierManager`: 누적 CP에 따른 5단계 티어 자동 판정 및 보상 지급 시스템
  - 📖 읽을 문서: `[MOD_GDD_17]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 229. **[MOD_GDD_17]** `ThemeSynergyLogic`: 특정 테마(코지, 사이버 등) 완판 시 특수 패시브 활성화 트리거
  - 📖 읽을 문서: `[MOD_GDD_17]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 189. **[MOD_GDD_05]** `WardrobeUI`: 현재 착용 중인 의상 세트 효과 및 총 버프 계산창 UI
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 194. **[MOD_GDD_05]** 🎨[Graphics] `BarberShopUI`: 헤어 스타일 및 컬러 변경 프리뷰 및 자본 차감 로직 UI
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 201. **[MOD_GDD_05]** `StylingScore`: 현재 코디네이션의 '힙함'을 점수로 환산하는 엔진
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 202. **[MOD_GDD_03]** `ItemRecycle`: 필요 없는 가구를 분해하여 제작 재료로 바꾸는 기능
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 217. **[MOD_GDD_03]** `FurnitureUpgrade`: 특정 재료를 사용해 기존 가구의 스탯 버프를 강화하는 시스템
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 212. **[MOD_GDD_03]** `CosmeticVendor`: 타운 광장에 비주기적으로 나타나는 희귀 의상 노점상 NPC 에셋
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 180. **[MOD_GDD_03]** `InventorySort`: 획득순, 가격순, 등급순 아이템 정렬 필터 구현
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 181. **[MOD_GDD_03]** `ItemSearch`: 인벤토리 내 이름 검색 기능을 위한 텍스트 필터
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 📱 Phase 4: 스마트폰 유틸리티 앱 확장 (Extended Smartphone Apps)
* 햅틱 진동, 앱 아이콘 금빛 업그레이드, 화면 먼지 셰이더, 라이트 기능, 뉴스 동영상 기능 등 스마트폰의 Cozy한 상호작용성 추가 단계입니다.
- [ ] 257. **[MOD_GDD_11]** `SmartphoneVibrate`: 긴급 속보나 마진콜 경고 시 장치 엔진을 통한 햅틱 피드백 연동
  - 📖 읽을 문서: `[MOD_GDD_11]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 262. **[MOD_GDD_11]** 🎨[Graphics] `AppUpdateVisual`: 스토리 마일스톤 달성 시 스마트폰 앱 아이콘이 골드로 업그레이드되는 연출
  - 📖 읽을 문서: `[MOD_GDD_11]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 267. **[MOD_GDD_11]** 🎨[Graphics] `SmartphoneDustFX`: 장시간 미사용 시 스마트폰 화면에 미세한 먼지가 쌓이는 디테일 연출
  - 📖 읽을 문서: `[MOD_GDD_11]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 271. **[MOD_GDD_12]** 🎨[Graphics] `NewsVideoPlayer`: 중요 경제 지표 발표 시 UI 내에서 재생되는 짧은 코지 뉴스 영상
  - 📖 읽을 문서: `[MOD_GDD_12]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 275. **[MOD_GDD_11]** `PhoneCaseCustom`: 포인트 소모하여 스마트폰의 외형과 폰트 스타일을 바꾸는 커스터마이징 UI
  - 📖 읽을 문서: `[MOD_GDD_11]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 283. **[MOD_GDD_11]** `SpamMailFilter`: 특정 평판 이하 시 쏟아지는 스팸/사기 메일을 걸러주는 필터 기능
  - 📖 읽을 문서: `[MOD_GDD_11]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 288. **[MOD_GDD_11]** `FlashLightApp`: 어두운 타운 구역 탐험 시 스마트폰 손전등 기능을 켜는 조명 효과
  - 📖 읽을 문서: `[MOD_GDD_11]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 💞 Phase 5: 안나 호감도 연출 및 서사 고도화 (Anna Mood & Camera Zoom)
* 안나의 호감도별 실내 분위기 BGM/조명 동기화, 중요 대화 시 카메라 줌인, 눈동자 추적, 심야 감성 대사 해금 단계입니다.
- [ ] 256. **[MOD_GDD_06]** `Anna_MoodBoard`: 안나의 호감도에 따라 오피스 내부 BGM과 조명 색온도가 미세하게 변화
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 260. **[MOD_GDD_07]** `DialogueCameraZoom`: 중요 대사 전달 시 NPC의 얼굴로 카메라가 부드럽게 줌인(Lerp) 연출
  - 📖 읽을 문서: `[MOD_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 270. **[MOD_GDD_07]** 🎨[Graphics] `NpcEyeTracking`: 마우스 포인터의 위치를 NPC의 눈동자가 자연스럽게 쫓아가는 연출
  - 📖 읽을 문서: `[MOD_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 265. **[MOD_GDD_06]** 🎨[Graphics] `AnnaSecretGifts`: 호감도 Max 상태에서만 발생하는 안나의 비밀 선물 컷신 이벤트
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 274. **[MOD_GDD_06]** 🤖[Claude] `Anna_LateNightConvo`: 현실 시간 심야(00~04시)에만 들을 수 있는 안나의 감성 대사 세트
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 285. **[MOD_GDD_06]** `Anna_WorkFocus`: 대화가 불가능할 정도로 안나가 업무에 집중하는 특정 시간대 플래그
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 261. **[MOD_GDD_07]** `SelectiveSkip`: 이미 열람한 대사 그룹만 빠르게 스킵할 수 있는 고급 다이얼로그 모듈
  - 📖 읽을 문서: `[MOD_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 266. **[MOD_GDD_07]** `StorySummaryWindow`: 현재 진행 중인 메인 퀘스트와 서사적 위치를 요약해주는 기록장 UI
  - 📖 읽을 문서: `[MOD_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 280. **[MOD_GDD_07]** `DialogueSelectionSFX`: 선택지 위에 마우스 오버 시 출력되는 부드러운 화이트 노이즈 사운드
  - 📖 읽을 문서: `[MOD_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 🤝 Phase 6: [데모 이후] 투자 신디케이트 비밀 아지트 및 공동 작전 (Syndicate Content)
* 9월 마무리 단계로써, 데모 출시 이후에 활성화될 유저 간 연대금융 및 작전 공동 참여 아지트/전광판/백엔드 로직 설계 단계입니다.
- [ ] 250. **[데모 이후] [MOD_GDD_16]** `Syndicate_Formation`: 유저 간 '투자 신디케이트' 결성 및 엠블럼 에디터 UI 배치
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 251. **[데모 이후] [MOD_GDD_16]** 🎨[Graphics] `Syndicate_EmblemMapping`: 생성된 엠블럼을 멤버의 어깨 및 프로필 UI에 고화질 렌더링
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 252. **[데모 이후] [MOD_GDD_16]** 🎨[Graphics] `SecretHideoutUI`: 미드나잇 펍 지하 '비밀 아지트' 입장 및 인테리어 커스텀 UI/에셋
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 268. **[데모 이후] [MOD_GDD_16]** `SyndicateWallboard`: 아지트 내 멤버들의 실시간 보유 종목을 보여주는 대형 전광판 UI 배치
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 264. **[데모 이후] [MOD_GDD_16]** `SyndicateRankings`: 신디케이트 간의 주간 수익률 대결 및 전용 리더보드 UI 배치
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 282. **[데모 이후] [MOD_GDD_16]** `SyndicateHideoutUpgrade`: 아지트 내에 고효율 트레이딩 룸을 증축하는 건설 UI 배치
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 253. **[데모 이후] [MOD_GDD_16]** `JointBuyOperation`: 리더의 작전주 지정 시 멤버 동시 매수 시너지(x1.5 가중치) 엔진
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 254. **[데모 이후] [MOD_GDD_16]** 🧠[Pro] `JointLiabilityCalc`: 신디케이트 파산 시 멤버 기여도에 따른 채무 배분 및 연대 책임 로직
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 255. **[데모 이후] [MOD_GDD_16]** `BlackBrokerJack`: 전설급 작전주 소스를 판매하는 블랙 브로커 잭과의 특수 거래창 UI
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 273. **[데모 이후] [MOD_GDD_16]** 🧠[Pro] `GhostSyndicateAI`: 라이벌 NPC 신디케이트 생성 엔진
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 277. **[데모 이후] [MOD_GDD_16]** `SyndicateEmergencyLoop`: 연맹 위기 시 멤버 모두의 화면에 경고 알람이 동시에 뜨는 연출
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 287. **[데모 이후] [MOD_GDD_16]** `SyndicateAssetSharing`: 멤버 간의 일시적인 자산 대여 및 증거금 합산 공동 대응 기능
  - 📖 읽을 문서: `[MOD_GDD_16]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 📢 시스템 전역 부가 기능 (Global Utility)
- [ ] 218. **[MOD_GDD_02]** `GlobalJobEvent`: 전역적으로 특정 알바 수익이 2배가 되는 '황금 시간대' 공시
  - 📖 읽을 문서: `[MOD_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 222. **[MOD_GDD_02]** `PartTimeRanking`: 한 주간 알바 수익이 가장 높은 유저에게 주는 '성실 트레이더' 칭호
  - 📖 읽을 문서: `[MOD_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 219. **[MOD_GDD_04]** `DarkWebMarket`: 스마트폰 앱을 통해 익명으로 찌라시를 사고파는 비대면 시장 UI
  - 📖 읽을 문서: `[MOD_GDD_04]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 223. **[MOD_GDD_04]** 🧠[Pro] `RumorFeedbackLoop`: 내가 퍼뜨린 찌라시가 실제 주가에 미미하게 영향을 주는 피드백 엔진
  - 📖 읽을 문서: `[MOD_GDD_04]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 224. **[MOD_GDD_05]** `OfficeBackgroundAudio`: 오피스 내 라디오 가구 배치 시 플레이리스트 재생 기능
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 236. **[MOD_GDD_09]** 🤖[Claude] `VirtualFriendNet`: 가상의 친구 유저 10명의 프로필 및 가짜 투자 일지 자동 생성기
  - 📖 읽을 문서: `[MOD_GDD_09]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 279. **[MOD_GDD_09]** `TradingBadgeCore`: 특정 수익률이나 매매 횟수 달성 시 프로필에 장착하는 마스터 휘장 UI
  - 📖 읽을 문서: `[MOD_GDD_09]` (Docs_Collapse에서 SLIM 버전 확인)
