# StockWars 문서 인덱스

> 정리: 2026-10-16. 현재 기획의 진입점이다. 문서의 기획 확정·에셋 채택·코드 구현·게임 검수 완료를 구분한다.

## 현재 기준과 읽는 순서

2026-10-18 최신 전당포 후속: **전당포를 초기 마을에서 제외**한다. 은행 대출·잡화점 및 인테리어 상점의 되팔기/매입은 **미정**이며 전당포의 기능을 자동 이전하지 않는다. [마을 구성](MOD_GDD_01_WorldFacilities.md)·[금융 범위](CORE_GDD_04_FinancialInstitutions.md)·[상점 정책](MOD_GDD_03_0_ShopIndex.md)을 따른다. 바터의 새 역할은 후보로만 남긴다. ✅ 기획 반영 / ⏳ 구현·검수 대기.

2026-10-18 최신 표현 후속: **마을 바닥·하늘은 2D, 건물은 3D 배치**를 채택했다. 바닥은 평평한 월드 지면에 2D 텍스처를 적용하는 검증 시작안이며 소망 요정의 3D 방향은 유지한다. [시점 전환 계획](VISUAL_TRANSITION_PLAN.md)·[아트 가이드](ART_STYLE_GUIDE.md)를 따른다. ✅ 기획 반영 / ⏳ 혼합 시험 장면·게임 구현·검수 대기.

2026-10-18 최신 오프닝 채택: 소망이가 **정착 안내문을 보고 버스로 마을에 도착 → 정류장에서 안나와 첫 만남 → 안내소 등록·닉네임·TPT·출입증 → 집·오피스 첫날 안내**로 진행한다. [오프닝·대사·진행 계약](CORE_GDD_10_TutorialSystem.md), [등록](CORE_GDD_08_CharacterCreation.md), [안나의 관계](MOD_GDD_06_NPCRegistry.md)를 따른다. 기존 첫 매수·가게 주문·정보 해석·회복·자립·월세 조건은 유지한다. ✅ 기획 반영 / ⏳ 구현·검수 대기.

2026-10-18 최신 성장 외형 후속: **소망이의 머리 위 외형이 Lv.1~2 기본 → Lv.3~6 잎 하나 → Lv.7~11 두 잎 → Lv.12~19 꽃봉오리 → Lv.20 개화**로 성장한다. [정령 외형·의미·제작 기준](SPIRIT_CHARACTER_BASELINE.md), [레벨 연동 범위](CORE_GDD_03_PlayerGrowth.md)를 따른다. 고정 캐릭터의 성장 표현으로, 커스텀·스킨 판매를 추가하지 않는다. ✅ 기획 반영 / ⏳ 시안·모델·구현·게임 검수 대기.

2026-10-18 최신 마을·NPC 후속: **집·정착 안내소·비비안 잡화점·모던 프레임·사이퍼 증권·노드 은행 + 광장 쉼터**, 핵심 NPC **안나·비비안·줄리안·K·샤일록의 요정 재디자인**을 채택했다. [건물 구성](MOD_GDD_01_WorldFacilities.md), [NPC 외형·성격](MOD_GDD_06_NPCRegistry.md), [아트 기준](ART_STYLE_GUIDE.md)을 따른다. 은행의 건물·역할은 채택하되 저축·이자·대출·월세 연동 등은 [금융 명세](CORE_GDD_04_FinancialInstitutions.md)에 미정으로 남긴다. ✅ 기획 반영 / ⏳ 시안·구현·게임 검수 대기. 첫날은 잡화점 주문 흐름을 유지하며 은행 방문을 필수로 추가하지 않는다.

2026-10-18 최신 후속: **캐릭터 커스텀 제거·집꾸미기 집중·모동숲 참고 3D 시점·가게 주문 노동**을 채택했다. [집꾸미기](ROOM_PACKAGE_GUIDE.md), [시점 전환](VISUAL_TRANSITION_PLAN.md), [주문 노동](MOD_GDD_02_LaborJobs.md), [첫날 튜토리얼](CORE_GDD_10_TutorialSystem.md)이 각 주제 기준이다. 아래 이전 선택·판매·물류·투영 설명보다 이 결정을 우선한다. ✅ 기획 반영 / ⏳ 게임 구현·이관·검수 대기.

2026-10-18 최신 서사 채택: 플레이어 컨셉을 **소망 요정**으로 정하고, 기존 튜토리얼 진행을 유지한 첫 일주일의 정착 이야기와 안나의 관계를 반영했다. [초반 스토리·대표 대사](CORE_GDD_10_TutorialSystem.md), [안나의 역할·개인 소망](MOD_GDD_06_NPCRegistry.md), [캐릭터 등록](CORE_GDD_08_CharacterCreation.md)을 따른다. 아래 동물 전용 플레이어 기획보다 이 결정이 우선한다. ✅ 기획 반영 / ⏳ 게임 구현·검수 대기이며 기존 에셋·저장·스킨 판매 정책을 자동 변경하지 않는다.

2026-10-18 최신 캐릭터 제작 후속: [정령 3D 기본형](SPIRIT_CHARACTER_BASELINE.md)의 흰색 무표정 T자 시안을 사용자가 채택했다. 새 정령 제작에는 이 후속 결정이 아래 동물 스프라이트 전용·리깅 미사용 설명보다 우선한다. 기존 동물 에셋·게임 적용·판매 정책의 자동 변경을 뜻하지 않는다.

1. 작업·코드 구조·검증 규칙은 [AGENTS.md](../AGENTS.md)를 따른다.
2. 채택 진행은 안내문·버스 도착·안나와 첫 만남 → 고정 요정 미리보기·등록 → 오피스·스마트폰 첫 매수 → 타운·비비안 잡화점 첫 주문 → 보상 찌라시 해석·회복 선물 → 자립 안내·NPC 의뢰 → 7일 차 현금 월세다. 첫 매도는 10% 상승 시 별도 선택 안내다. [튜토리얼](CORE_GDD_10_TutorialSystem.md)의 현재 코드 체크포인트와 새 기획을 구분한다.
3. 플레이어는 고정 외형의 소망 요정이며 커스텀·스킨 선택/판매를 제거한다. [기존 동물 판매 정책](MOD_GDD_03_3_ClaireApparel.md)과 [36개 테마 CSV](Data/ANIMAL_SKIN_THEME_PLAN_36.csv)는 이전 기록이다. 기존 보유 외형의 저장 이관은 미정이다.
4. 시점은 모동숲 화면을 참고한 3D 카메라로 전환한다. 집은 룸 테마·호환 벽/바닥·지정 위치 가구·장식으로 꾸민다. 자유 가구 이동·회전은 도입하지 않는다. 카메라 수치·렌더러·곡면 표현은 확정하지 않는다.
5. 새 요정의 모델·본 모션은 [정령 제작 기준](SPIRIT_CHARACTER_BASELINE.md)을 따른다. 강아지·고양이의 3그림·160ms는 기존 스프라이트 제작 기록이며 새 3D 모션에 강제하지 않는다.
6. 찌라시는 문자 가림 대신 읽을 수 있는 수수께끼와 해석 5단계를 사용한다. [현재 데이터](Data/Rumors.csv)는 고정 25종·본문 125개이며 JS 런타임의 CSV 직접 로딩 완료를 뜻하지 않는다.

전문 문서끼리 충돌하면 해당 주제의 최신 사용자 결정과 위 기준을 우선한다. 이전 숫자·대사·완료 표시는 신규 정책의 확정 또는 구현 증거로 승계하지 않는다. 구 GDD의 Unity/C#·ScriptableObject·Assets 경로는 설계 이력이므로 현재 `web/`·`Server/`·`electron-app/` 구현과 대조한다.

별도 SLIM 기획과 AI 시작 안내는 이 인덱스로 통합했다. 아트·캐릭터·룸·찌라시 규칙은 각 전문 문서에서 관리하고 요약본에 복제하지 않는다. 과거 데모 작업 절차의 새 세션 강제·세션당 마일스톤 1개 제한과 예전 SLIM·Unity 작업 지시는 폐기했다.

## 진행 상태를 확인할 때

- [알파 피드백](Data/ALPHA_FEEDBACK_STATUS.csv)은 피드백 처리 기록이다. [그래픽 전환 계획](VISUAL_TRANSITION_PLAN.md)과 [시트 기준](DOG_SPRITE_BASELINE.md)의 후속 검수를 함께 확인한다.
- 예전 6월 대회 일정·M2 완료/M3 예정·존재하지 않는 ROADMAP 문서로 현재 작업 범위를 자동 제한하지 않는다. 확장 기능 문서가 남아 있다는 이유만으로 이번 개발 범위에 포함하지 않는다.

## 핵심 게임 진행

- [StockWars GDD: CORE_GDD_01. 프로젝트 소개 및 디자인 철학 (Project Introduction)](CORE_GDD_01_Introduction.md)
- [StockWars GDD: CORE_GDD_08. 캐릭터 생성 시스템 (Character Creation)](CORE_GDD_08_CharacterCreation.md)
- [CORE_GDD_10 게임 시작과 튜토리얼](CORE_GDD_10_TutorialSystem.md)
- [CORE_GDD_03 유저 성장과 능력치](CORE_GDD_03_PlayerGrowth.md)
- [CORE_GDD_02 현재 시장과 거래 엔진](CORE_GDD_02_MarketEngine.md)
- [CORE_GDD_04 금융 시설과 증권사](CORE_GDD_04_FinancialInstitutions.md)
- [CORE_GDD_07 현재 경제와 정산](CORE_GDD_07_EconomySim.md)

## 월드·노동·상점

- [StockWars GDD: MOD_GDD_01. 타운 시설 및 월드 구성](MOD_GDD_01_WorldFacilities.md)
- [StockWars GDD: MOD_GDD_02. 노동(Job) 시스템 및 미니게임 상세](MOD_GDD_02_LaborJobs.md)
- [StockWars GDD: [MOD_GDD_03_0] 상점 및 아이템 시스템 인덱스](MOD_GDD_03_0_ShopIndex.md)
- [StockWars GDD: [MOD_GDD_03_1] 비비안 잡화점 (Vivian's Store)](MOD_GDD_03_1_VivianStore.md)
- [StockWars GDD: [MOD_GDD_03_2] Modern Frame 완성형 테마 룸 상점](MOD_GDD_03_2_JulianFurniture.md)
- [StockWars GDD: MOD_GDD_03_3 클레어 동물 캐릭터 스킨 상점](MOD_GDD_03_3_ClaireApparel.md)
- [StockWars GDD: [MOD_GDD_03_4] 데이터 잉크 서점 (Data Ink Bookstore)](MOD_GDD_03_4_Bookstore.md)
- [비비안 상품 기능 — 웹 데모 구현](ITEM_GAMEPLAY_IMPLEMENTATION.md)

## 정보·시장 확장

- [찌라시 작성·데이터 가이드](RUMOR_AUTHORING_GUIDE.md)
- [StockWars GDD: [MOD_GDD_04_0] 유니버설 찌라시 라이브러리 인덱스](MOD_GDD_04_0_RumorIndex.md)
- [StockWars GDD: [MOD_GDD_12_0] 기업 뉴스 이벤트 시스템 인덱스 (Corporate News Events Index)](MOD_GDD_12_0_CorporateNewsIndex.md)
- [StockWars GDD: [MOD_GDD_19_0] IPO 종목 찌라시 라이브러리 인덱스](MOD_GDD_19_0_IPORumorIndex.md)
- [MOD_GDD_10 예비 종목과 IPO 확장 검토](MOD_GDD_10_ReserveStockPool.md)
- [StockWars GDD: MOD_GDD_13. 고스트 트레이더 시스템 (Ghost Trader System)](MOD_GDD_13_GhostTrader.md)
- [StockWars GDD: MOD_GDD_14. 개인 회생 및 구제 시스템 (Debt Relief & Bailout)](MOD_GDD_14_DebtRelief.md)
- [StockWars GDD: MOD_GDD_15. 기관 시스템 (Institution: Public Investment Guild)](MOD_GDD_15_InstitutionSystem.md)

## NPC·소셜·이벤트

- [StockWars GDD: MOD_GDD_06. NPC 레지스트리 및 상호작용 (NPC Registry)](MOD_GDD_06_NPCRegistry.md)
- [MOD_GDD_07: 다이얼로그 통합 DB](MOD_GDD_07_DialogueDB.md)
- [MOD_GDD_05 생활과 사교 콘텐츠](MOD_GDD_05_LifestyleSocial.md)
- [StockWars GDD: MOD_GDD_08. 업적 및 엠블럼 시스템 (Achievement & Emblem System)](MOD_GDD_08_AchievementSystem.md)
- [StockWars GDD: MOD_GDD_09. 친구 시스템 및 소셜 루프 (Social Network)](MOD_GDD_09_FriendSystem.md)
- [StockWars GDD: MOD_GDD_11. 스마트폰 Bubble 메신저 시스템 (Bubble System)](MOD_GDD_11_BubbleSystem.md)
- [StockWars GDD: [MOD_GDD_18] 세미나 퀴즈 시스템 (Seminar Quiz)](MOD_GDD_18_QuizSystem.md)
- [StockWars GDD: [MOD_GDD_20] 연례 대휴장 및 신년 12지신 페스티벌 시스템 (New Year Festival)](MOD_GDD_20_NewYearFestival.md)

## 아트·공간 제작

- [StockWars 아트 스타일 가이드](ART_STYLE_GUIDE.md)
- [시고르자브종·검은 고양이 캐릭터 시트 기준](DOG_SPRITE_BASELINE.md)
- [StockWars 캐릭터 스프라이트 시트 제작 가이드](part_separation_guide_512.md)
- [완성형 룸 제작·상호작용·웹 합성 명세](ROOM_PACKAGE_GUIDE.md)
- [건물 내부 그리드 규격](INTERIOR_GRID_GUIDE.md)
- [StockWars 그래픽·시점 전환 계획](VISUAL_TRANSITION_PLAN.md)
- [StockWars GDD: CORE_GDD_05. 씬 기획 및 UI/UX 인터페이스 (Scenes & UI)](CORE_GDD_05_ScenesUI.md)

## 구현·운영·검증

- [AGENTS.md 코드 구조와 검증](../AGENTS.md#코드-구조와-검증)
- [CORE_GDD_06 현재 기술 구조와 저장](CORE_GDD_06_TechnicalSpec.md)
- [CORE_GDD_09 이벤트와 시스템 연결](CORE_GDD_09_EventBusSystem.md)
- [온라인 모의투자와 유저 기록 보존 설정](ONLINE_ARENA_STORAGE_SETUP.md)
- [찌라시 작성·데이터 가이드](RUMOR_AUTHORING_GUIDE.md)
- [2026-09-30 외부 데모 테스트 준비](EXTERNAL_TEST_2026-09-30.md)

섹터별 찌라시·기업 뉴스·IPO 원고는 각 인덱스에서 찾아간다. 기존 찌라시의 Tier 1~3·가림 본문은 소재 이력이며 현행 작성 규칙이 아니다.

## 현행 목록에서 폐기·통합한 문서

| 이전 문서 | 정리 결과 |
| :--- | :--- |
| 금융·찌라시·뉴스 SLIM 3개 + TASK_M3 | 옛 데모 명세·구현 지시 폐기 |
| 기획 제안서·PPT 본문·슬라이드 프롬프트 3개 | 현행 기준과 다른 옛 발표 자료 폐기 |
| 안나·타운 대사 분할 2개 | [다이얼로그 통합 DB](MOD_GDD_07_DialogueDB.md)에 합침 |
| 럭키 캡슐 폐기 정책 | [상점 공통 획득 정책](MOD_GDD_03_0_ShopIndex.md#acquisition-policy)에 합침 |
| 사람 의상·가구 단품·폐기 테마 카탈로그 | 자료 삭제. 신규 후보·가격·효과로 사용 금지 |
| 별도 데모 요약 폴더의 AI 시작 안내·작업 절차 | 필요한 안내를 이 인덱스로 통합하고 별도 폴더 삭제 |

현행 기준으로 대체된 옛 기획 보관본은 삭제했다. 기존 보유 데이터·버프·압류·매각의 이관 정책과 미정 가격·판매 일정은 이번 문서 정리로 확정하지 않는다.

## 2026년 10월 16일 게임 진행 대조 결과

| 주제 | 충돌·구 기획 | 정리한 현재 기준 |
| :--- | :--- | :--- |
| 튜토리얼 | 강제 매도·퀴즈·가구 배치 | 스마트폰 매수·물류·해석·회복 후 자립. 매도는 별도 선택 |
| 데모 종료 | Lv.3 즉시 암전·상호작용 잠금 | Lv.20까지 계산, 7일 차 현금 5,000G 월세. 미납은 자동 파산 아님 |
| 성장 | 종목별 1만~1,000만G 투자금 Cap | 현행 Cap 없음. 슬롯·현금·호가·주문 주수 제한은 별개 |
| 노동 | 일일 3~5회·운송 개수 등급·최고기록 패스 | 하트 비용·60초 누적 점수 등급·고정 560G/70EXP 패스 |
| 회복 | 자연 회복·비타민 소모량 감소 | 최대 하트 구간 조정·벤치·드링크·다음 날 회복 |
| 경제 | 월요일 정산·72시간 유예·예금·세금 | Day 7 일회 월세·다음 날 배당. 대출·세금은 확장안 |
| 대결 | 24~48시간·실제 잔고 상금·Lv.20 해금 | 3/5/10분 별도 가상 계좌·게임 잔고 지급 0 |
| 시설 | 전체 시설 운영·시각별 영업 | 은행·서점·룸 상점·펍·전당포 미개방, 살롱은 내부 진입 |
| 소셜 | 무료 찌라시 복제·FP와 온라인 정책 혼용 | 서버 친구·DM·보유 아이템 선물, 송신 KST 하루 3개 |
| 위기 | 100일 전역/7일 로컬 블랙 스완 | 엔진 시험 코드만 유지, 현재 게임 연결은 비활성 |
| 기술 | Unity/C++ IOCP·Steam·암호화 완료 | JS 웹·Electron·Node, 로컬 메인 저장과 서버 온라인 대결 분리 |
| 원고 | Tier 1~3·96종 뉴스의 적용 완료 주장 | 5단계/25사건 현재 데이터와 확장 소재를 분리 |

대조 근거는 각 전문 문서 하단의 코드 링크에서 확인한다. 문서 정리는 게임 코드·저장·밸런스를 변경하지 않는다. 미개방 확장안을 구현 요청으로 자동 승계하지 않는다.

### 결정과 구현이 더 필요한 항목

- 일반 레벨 10 도달과 공매도 해금 플래그의 자동 연결. 과거 운용력 2 동시 조건은 현행 검사에 없음.
- 첫 월세 이후 장기 진행·반복 정산, 룸 판매 온보딩, 살롱 월간 판매 구현.
- 기관 설립 자격(명성/순자산), 보수(15%/20%+0.5%), 정확히 15% 수배 경계와 자수·압류 순서.
- 은행·독서·세미나·펍 재도입, 신규 룸·동물 스킨에 구 담보·버프·절세·보상 규칙을 적용할지 여부.
- IPO 기업 ID·별칭·업종 매핑과 채택 목록 확정. 예비 종목의 중복·깨진 표와 금융 찌라시의 반복 블록은 제거했다.

위 항목은 최신 사용자 결정이나 실행 근거 없이 새로운 확정 정책을 만들지 않고 미정·미구현으로 남겼다.
