# ROADMAP 03: 7월 (캡스톤 전반부: 오피스 하우징 & 그리드 시스템) - 유니티 최적화 개발 순서 개편

**우선순위:** 3. 10월 말 캡스톤까지 해야 하는 것
**목표:** [Capstone: Lv.4 ~ 10 확장] 레벨 4 이상 진입 시 본격적으로 해금되는 오피스 하우징 그리드 시스템 및 기본 오피스 에셋 구축

> **[AI 주의사항]** 에셋 생성 및 UI 배치 소요를 감안하여, 7월은 **오피스 내부 그리드와 하우징 핵심 메카닉**에만 집중합니다. 타운 구역(금융/생활) 에셋은 8월과 9월에 분산하여 개발합니다.

---

## 🎨 유니티 개발 친화적 6단계 빌드 로드맵

### 📐 Phase 1: 아이소메트릭 그리드 및 룸 확장 코어 (Grid Logic Core)
* 타운/방의 2.5D 아이소메트릭 논리 좌표계를 세우고, 충돌과 가구 배치 정렬의 논리적 뼈대를 구축하는 최우선 단계입니다.
- [ ] 111. **[MOD_GDD_05]** 🧠[Pro] `IsoGrid_Base`: 2:1 비율의 아이소메트릭 그리드 논리 좌표계 및 타운 셋업
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 113. **[MOD_GDD_05]** `OfficeFloorPlan`: 10x10에서 30x30까지의 오피스 평수 확장 트리거 및 맵 데이터
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 114. **[MOD_GDD_05]** 🧠[Pro] `SortingLayerManager`: 가구의 Y축 위치에 따라 전후 관계를 자동 정렬하는 렌더링 레이어
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 116. **[MOD_GDD_05]** 🧠[Pro] `CollisionValidator`: 가구 간 배치 겹침 및 문 앞을 막는 동선 방해 실시간 체크
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 117. **[MOD_GDD_05]** `RotationLogic`: 90도 회전 시 1/2/4방향 스프라이트 정밀 전환 및 좌표 보정
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 🎨 Phase 2: 건설 에디터 비주얼 피드백 (Construction Editor FX)
* 가구를 배치하기 전 반투명 이미지를 띄워주고 배치 가이드 타일을 깔아주는 유니티 그래픽 피드백 연출 단계입니다.
- [ ] 112. **[MOD_GDD_05]** 🎨[Graphics] `TileSelection`: 마우스 오버 시 해당 타일에 노란색 하이라이트 박스 연출
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 115. **[MOD_GDD_05]** 🎨[Graphics] `GhostPreview_FX`: 설치 전 반투명 가구 이미지와 설치 가능/불가능 영역 시각화
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 142. **[MOD_GDD_05]** 🎨[Graphics] `GridVisualGuide`: 가구 배치 모드 활성화 시 바닥에 은은한 쿼터뷰 격자 가루가 깔리는 FX
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 157. **[MOD_GDD_05]** `GridConstraint`: 설치 불가능한 가구가 있는 타일에 설치 시 붉은색 경고 박스 노출
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 💾 Phase 3: 가구 정보 직렬화 및 하우징 저장 (Interior Data Sync & Buffs)
* 배치된 가구의 좌표 정보를 문자열로 압축 저장하고, 가구 배치에 따라 능력치 버프를 반영하는 하우징 백엔드 연동 단계입니다.
- [ ] 140. **[MOD_GDD_05]** 🧠[Pro] `InteriorDataSync`: 가구별 ID, 좌표, 회전값을 한 줄의 문자열로 압축하여 저장하는 스키마
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 118. **[MOD_GDD_05]** `FurnitureBuffProcessor`: 가구 배치 즉시 명성치와 스탯 보너스를 전역 스탯에 가산
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 120. **[MOD_GDD_05]** 🎨[Graphics] `WallpaperManager`: 벽면과 바닥재의 텍스처를 클릭 한 번으로 교체하는 팔레트 시스템
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 151. **[MOD_GDD_05]** `CarpetLayer`: 바닥재 바로 위에 겹쳐서 설치되는 카펫 전용 레이어 및 마킹 로직
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 152. **[MOD_GDD_05]** `WallAccessory`: 벽면에 거는 포스터나 시계를 위한 수직 그리드 배치 엔진
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 146. **[MOD_GDD_05]** `SinglePlacementLimit`: 특정 고가 대형 가구(예: 서버 랙)의 중복 설치를 제한하는 감시 로직
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 141. **[MOD_GDD_05]** 🧠[Pro] `ExpansionCostCurve`: 오피스 평수 확장 시 요구되는 골드 및 평판 등급의 상승 곡선 설정
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 177. **[MOD_GDD_03]** `InventoryUI_Grid`: 7개 카테고리별 슬롯 생성 및 아이콘 바인딩 (6월 데모에서 이월)
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 178. **[MOD_GDD_03]** `ItemDetailPopup`: 아이템 상세 옵션 및 플레이버 텍스트 노출 윈도우 (6월 데모에서 이월)
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 179. **[MOD_GDD_03]** `EquipController`: 아바타 파츠 및 실시간 가구 스위칭 연동 (6월 데모에서 이월)
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 206. **[MOD_GDD_03]** `ItemPurchaseFlow`: 상점에서 가구/아이템 구매 시 자금 체크 및 배송 연출 (6월 데모에서 이월)
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 210. **[MOD_GDD_03]** 🎨[Graphics] `InventoryExpansion`: 서랍장 칸 늘리기 아이템 사용 시 그리드 확장 연출 (6월 데모에서 이월)
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 214. **[MOD_GDD_03]** `ItemStorageLock`: 프리미엄 아이템 슬롯 잠금 설정 (6월 데모에서 이월)
  - 📖 읽을 문서: `[MOD_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 🚶 Phase 4: 타운 월드 인프라 및 카메라 (Town Navigation & Camera)
* 타운 맵을 셋업하고 카메라 드래그 이동과 장소 간 빠른 이동(지하철)을 구현하는 월드 편의성 단계입니다.
- [ ] 121. **[MOD_GDD_01]** 🎨[Graphics] `TownMapSetup`: 7개 구역(은행, 전당포, 치킨집 등)으로 구성된 타운 거점 배치 (기초 구조)
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 132. **[MOD_GDD_01]** `CameraFollowController`: 오피스 내 드래그 이동, 줌 인/아웃 및 경계선 제한 스크립트
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 138. **[MOD_GDD_01]** `SceneFastTravel`: 맵 UI 특정 위치 클릭 시 페이드아웃 후 해당 장소로 즉시 이동
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 156. **[MOD_GDD_01]** `SubwayEntrance`: 지하철 역 입구 프리팹 구축 및 월드맵 이동 트리거 바인딩
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 143. **[MOD_GDD_01]** `BGMZoneDetector`: 소속 구역(은행, 펍 등)에 따라 해당 오디오 트랙으로 자연스럽게 전환
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 👥 Phase 5: NPC 월드 스폰 및 그래픽 연출 (NPC Spawn & World Shaders)
* 월드 구석구석에 NPC를 상주시키고, 도시 간판 및 하늘 라이팅을 연동하여 타운 비주얼을 포장하는 단계입니다.
- [ ] 122. **[MOD_GDD_01]** `NpcSpawnPoint`: 장소별 NPC(안나, 바터, 백사장) 상주 위치 및 시야각 설정
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 131. **[MOD_GDD_01]** `ExtraNpcRoutine`: 타운 배경에서 가볍게 움직이는 보행자 NPC들의 AI 순회 경로
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 135. **[MOD_GDD_06]** `Anna_MovementSet`: 시간대에 따라 오피스 창가, 책상, 침대 등으로 이동하는 안나
  - 📖 읽을 문서: `[MOD_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 129. **[MOD_GDD_01]** 🎨[Graphics] `HomeOfficeBranding`: 유저가 지은 이름이 출입문 간판에 네온사인으로 빛나는 연출
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 130. **[MOD_GDD_01]** 🎨[Graphics] `AmbientLightSync`: 타운 외부 하늘 색상이 실제 게임 시간(Day/Night)에 맞춰 그라데이션 변화
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 144. **[MOD_GDD_01]** 🎨[Graphics] `CityGlowFX`: 야간 시간대 창문 밖으로 보이는 도시 마천루들의 깜빡이는 불빛 셰이더
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 136. **[MOD_GDD_01]** 🎨[Graphics] `CozyFogEffect`: 맵 구석구석에 아늑한 감성을 더하는 미세한 노이즈와 안개 파티클
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 147. **[MOD_GDD_01]** 🎨[Graphics] `StreetClickFX`: 땅을 클릭했을 때 나타나는 사이버펑크 스타일의 파란색 육각형 파티클
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 149. **[MOD_GDD_01]** 🎨[Graphics] `MetroTransitAnim`: 장소 이동 시 지하철이 웅장하게 화면을 가로질러 지나가는 컷신 연출
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 150. **[MOD_GDD_01]** 🎨[Graphics] `TownVignetteFX`: 타운 화면 가장자리에 필름 그레인과 갈색 비네팅을 더해 빈티지 무드 완성
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 137. **[MOD_GDD_01]** `InteractiveProps`: 클릭 시 짧은 소리를 내거나 흔들리는 오피스 내 인테리어 소품화
  - 📖 읽을 문서: `[MOD_GDD_01]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 📉 Phase 6: 공매도 및 강제 청산/압류 엔진 (Short Selling & Seizure)
* 7월 마무리 단계로써, 후반부 고난도 경제 플레이를 위한 공매도 금융 거래 백엔드 로직을 하드코딩 검증하는 단계입니다.
- [ ] 062. **[CORE_GDD_04]** 🧠[Pro] `MarginShortLogic`: 공매도 시 주문가 150% 현금 동결 및 담보물 설정 로직
  - 📖 읽을 문서: `[CORE_GDD_04]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 063. **[CORE_GDD_04]** 🧠[Pro] `MarginCallEngine`: 유지비율 90% 도달 시 경고, 100% 도달 시 강제 청산 루틴
  - 📖 읽을 문서: `[CORE_GDD_04]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 064. **[CORE_GDD_04]** 🧠[Pro] `SeizureManager`: 자산 0 이하 시 주식->가구 순의 순차적 압류 실행 엔진
  - 📖 읽을 문서: `[CORE_GDD_04]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 101. **[CORE_GDD_04]** `BankNPC_Interaction`: 지점장 샤일록과의 대화창 및 대출/상환 선택지 바인딩 (6월 데모에서 이월)
  - 📖 읽을 문서: `[CORE_GDD_04]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 083. **[CORE_GDD_06]** 🎨[Graphics] `AssetDissolveFX`: 가구 압류 시 입자가 흩어지며 사라되는 디졸브(Dissolve) 효과 (6월 데모에서 이월)
  - 📖 읽을 문서: `[CORE_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 245. **[CORE_GDD_02]** 🧠[Pro] `StockSplit_Engine`: 서버 주가가 임계치(10만 Gold) 초과 시 총 발행수 10배 증가 및 주가 1/10 조정 처리를 수행하는 액면분할 연산 코어 (6월 기획 논의 반영 추가)
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 246. **[CORE_GDD_02]** `DynamicWelcomeSeed`: 신규 계정 생성 시 서버 평균 주가 상승비율에 맞춰 초기 지원금을 스케일업해 배정하는 인플레이션 완충 시스템 (6월 기획 논의 반영 추가)
  - 📖 읽을 문서: `[CORE_GDD_02]` (Docs_Collapse에서 SLIM 버전 확인)

---

### 🛠️ 하우징 모드 편의성 보강 (Housing Tool Utility)
- [ ] 119. **[MOD_GDD_05]** `EditModeUI`: 가구 이동, 회전, 판매 버튼이 있는 하단 건설 모드 툴바 셋업
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 133. **[MOD_GDD_05]** 🧠[Pro] `GridUndoSystem`: 가구 배치 실수를 되돌리기 위한 Stack 기반의 Undo/Redo 엔진
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 134. **[MOD_GDD_05]** `InteriorValueReport`: 현재 가구 배치의 조화로움과 스탯 기여도를 정리한 리포트 UI
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 139. **[MOD_GDD_05]** `FurnitureDepreciation`: 중고 가구 판매 시 구입 시점 대비 가격이 깎이는 감가상각 연산
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 161. **[MOD_GDD_05]** `FurnitureSellConfirm`: 가구 판매 시 판매가와 삭제 여부를 묻는 2차 확인 모달창
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 164. **[MOD_GDD_05]** `AutoSortingLogic`: 버튼 클릭 시 현재 배치된 가구들을 종류별로 나란히 정렬해주는 편의 기능
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 158. **[MOD_GDD_05]** `SaveThumbnail`: 인테리어 저장 시 현재 오피스 모습을 작은 썸네일로 캡처하여 저장
  - 📖 읽을 문서: `[MOD_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
