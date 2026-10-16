# StockWars 문서 인덱스

> 정리: 2026-10-16. 현재 기획의 진입점이다. 문서의 기획 확정·에셋 채택·코드 구현·게임 검수 완료를 구분한다.

## 현재 기준과 읽는 순서

1. 작업·코드 구조·검증 규칙은 [AGENTS.md](../AGENTS.md)를 따른다.
2. 현재 진행은 캐릭터 등록 → 오피스·스마트폰 첫 매수 → 타운·물류 → 보상 찌라시 해석·회복 선물 → 자립 안내·NPC 의뢰 → 7일 차 현금 월세다. 첫 매도는 10% 상승 시 별도 선택 안내다. 정확한 흐름은 [CORE_GDD_10 게임 시작과 튜토리얼](CORE_GDD_10_TutorialSystem.md)을 따른다.
3. 캐릭터는 동물 자체의 완성형 스킨이다. 테마는 서로 어울리는 동물 6종이며 한 달 동안 직접 판매한다. [판매 정책](MOD_GDD_03_3_ClaireApparel.md)과 [36개 테마 구성 제안 CSV](Data/ANIMAL_SKIN_THEME_PLAN_36.csv)를 따른다. 36개 구성·출시 순서·가격은 전부 확정된 출시표가 아니다.
4. 마을은 RPG식 탑다운, 홈·일반 실내는 아이소메트릭이다. 실내는 고정 배치 완성형 룸이며 홈 룸을 직접 구매·선택한다. 자유 가구 배치·사람 의상 파츠 판매·리깅을 신규 필수 기능으로 재사용하지 않는다.
5. 걷기는 3그림 A → 중립 → B → 중립을 유지한다. 강아지·고양이의 현행 기준은 프레임당 160ms이며 UI 정면 초상화는 별도 상태다. 정확한 채택본은 시트 기준 문서에서 확인한다.
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
