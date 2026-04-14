# StockWars: 초정밀 마스터 개발 로드맵 (The Atomic Roadmap)

**버전:** v1.2.1  
**상태:** 구현 준비 완료 (체크리스트 활성화)  
**지시 방법:** "로드맵 [번호]번 개발해줘"라고 요청하세요.

---

### Phase 1: 아키텍처 및 핵심 프레임워크 (Foundation)
- [ ] 1. **Unity 프로젝트 초기화**: URP(Universal Render Pipeline) 기반 프로젝트 생성 및 환경 설정
- [ ] 2. **프로젝트 폴더 구조화**: Scripts, Prefabs, Art, Audio, Resources, Data 등 트리 구축
- [ ] 3. **VCS(Git) 설정**: 자산 충돌 방지를 위한 .gitignore 및 기초 버전 환경 구축
- [ ] 4. **GlobalSettings.cs 구현**: 게임 전역 레이어, 태그, 공통 상수(Color, Speed) 정의
- [ ] 5. **GameEnums.cs 통합 정의**: StockTier, ThemeType, GameState, ItemSlot 등 열거형 정의
- [ ] 6. **Singleton<T> 베이스 클래스**: 모든 매니저의 기반이 될 제네릭 싱글톤 템플릿 구현
- [ ] 7. **GameManager.cs 구현**: 게임 주 상태(메뉴, 캐릭터 생성, 오피스, 타운 등) 제어 로직
- [ ] 7.1. **CharacterCreationUI.cs 구현**: 외형 커스텀, 성향 선택 및 초기 데이터 생성 UI
- [ ] 8. **DataManager.cs(Persistence)**: JSON 기반 로컬 저장/불러오기(Save/Load) 핵심 로직
- [ ] 9. **TimeManager.cs(Tick)**: 게임 내부 틱(Tick) 시스템 및 분/시 단위 변환 엔진
- [ ] 10. **TimeManager.cs(Day/Week)**: 거래일 및 주간 사이클 갱신 이벤트 트리거 구축
- [ ] 11. **UIManager.cs 구현**: 캔버스 스택 방식의 윈도우 오픈/클로즈 및 포커스 관리 로직
- [ ] 12. **StockData(ScriptableObject)**: 주식 종목 기본 속성(티어, 변동성 등) 데이터 설계
- [ ] 13. **ItemData(ScriptableObject)**: 가구 및 의상 아이템 속성(가격, 슬롯, 버프) 설계
- [ ] 14. **NPCData(ScriptableObject)**: NPC 기본 페르소나 및 관계 데이터 구조 설계
- [ ] 15. **DataRegistry.cs 구현**: 모든 SO 데이터를 한눈에 관리하는 마스터 레지스트리
- [ ] 16. **DataInitializer.cs 구현**: 기획서 테이블을 시스템 데이터로 자동 변환하는 유틸리티

### Phase 2: 시장 시뮬레이션 및 트레이딩 엔진 (Market Engine)
- [ ] 17. **StockMarket.cs 구현**: 전체 종목 인스턴스화 및 실시간 가격 관리 매니저
- [ ] 18. **PriceGenerator.cs 구현**: RNG 기반 등급별(T1~T3) 가격 변동 알고리즘 구현
- [ ] 19. **TrendManager.cs 구현**: 상승장/하락장 사이클 및 뉴스 가중치 연동 로직
- [ ] 20. **PriceBuffer.cs 구현**: 최근 7일간의 가격 데이터를 저장하는 큐(Queue) 시스템
- [ ] 21. **MarketTimer.cs 구현**: 09:00 개장 및 15:30 폐장 자동화 이벤트 시스템
- [ ] 22. **NewsService.cs 구현**: 매일 아침 생성되는 경제 뉴스 및 종목 영향도 계산 로직
- [ ] 23. **RumorService.cs 구현**: 찌라시 획득 및 60분 증발 타이머, 해독 알고리즘 구현
- [ ] 24. **TradeController.cs 구현**: 매수/매도 수량 계산 및 수수료(0.1%~0.15%) 차감 로직
- [ ] 25. **PlayerWallet.cs 구현**: 가용 현금(Cash) 및 누적 수익금 실시간 트래킹 모듈
- [ ] 26. **PortfolioManager.cs 구현**: 보유 종목별 평단가, 보유 비중, 실시간 손익 계산
- [ ] 27. **DividendCalculator.cs 구현**: 72시간 보유(HODL) 판정 및 배당금 입금 시스템
- [ ] 27.1. **DelistingEngine.cs 구현**: 정리 매매 및 강제 청산 로직 구현
- [ ] 27.2. **IPOSystem.cs 구현**: 공석 발생 시 신규 상장 및 상장 예고 공시 엔진 구현

### Phase 3: 금융 압박 및 사회적 신용 (Finance & Social Credit)
- [ ] 28. **DebtAccount.cs 정의**: 대출 원금 및 누적 이자 데이터 관리 클래스
- [ ] 29. **InterestTimer.cs 구현**: 매주 월요일 00:00에 발동되는 주간 이자(3%) 정산 루틴
- [ ] 30. **DebtRepayment.cs 로직**: 원금 상환 메뉴 및 자동 이자 상환(배당금 연동) 기능
- [ ] 31. **AnnaGiftLogic.cs 구현**: 생애 첫 대출 감지 및 1주일 무이자 기간 카운트다운
- [ ] 32. **BankruptcyMonitor.cs 구현**: 자산 대비 부채 비율 감시 및 압류/게임오버 경고
- [ ] 33. **ReputationService.cs 구현**: 현재 장착 아이템 가치 합산을 통한 사회적 신용 등급 산출
- [ ] 34. **InterestModifier.cs 연동**: 지위 등급(3개 세트 등)에 따른 이자율 -0.5% 차감 반영

### Phase 4: 아이소메트릭 홈 오피스 구축 (Isometric Base)
- [ ] 35. **Isometric Rendering 설정**: 투명도 정렬 및 Z-Order(축 기반 정렬) 환경 설정
- [ ] 36. **IsoGridManager.cs 엔진**: 월드 좌표를 그리드 좌표로 변환하는 타일 매핑 엔진
- [ ] 37. **OfficeExpansion.cs 구현**: 그리드 크기(4x4~10x10) 동적 확장 및 시각적 연출
- [ ] 38. **FurnitureObject.cs 정의**: 배치 가능한 모든 가구의 베이스 클래스 및 프리팹
- [ ] 39. **PlacementSystem.cs 구축**: 가구 미리보기(Ghost), 유무 판정, 타일 점유 체크
- [ ] 40. **GridSelection.cs 구현**: 설치된 가구를 클릭하여 재배치하거나 정보를 보는 시스템
- [ ] 41. **ObjectRotation.cs 구현**: 아이소메트릭 가구의 대칭(Flip) 및 회전 처리 로직
- [ ] 42. **ThemeScanner.cs 구현**: 배치된 모든 물건의 테마를 스캔하여 세트 완성 판별
- [ ] 43. **BuffApplier.cs 연동**: 완성된 테마 세트 능력치를 실제 시장 엔진과 연동 처리

### Phase 5: 아바타 워드롭 및 캐릭터 시각화 (Avatars)
- [ ] 44. **CharacterSkin.cs 렌더러**: 7개 파츠(헤어~신발) 스프라이트를 실시간 교체
- [ ] 45. **AvatarWardrobe.cs 매니저**: 유저의 현재 착용 아이템 ID 저장 및 로드 관리
- [ ] 46. **NPCController.cs(Anna)**: 홈 오피스 내 안나 배치 및 클릭 상호작용 지점 설정
- [ ] 47. **AnnaOutfitSwitcher.cs**: 오피스 테마 변화를 감지해 안나 의상을 자동 변경
- [ ] 48. **NPCExpressionSet.cs**: 대화 상황(수익/손실 등)에 따른 NPC 표정 스프라이트 관리

### Phase 6: 프론트엔드 UI 구축 (UI/UX)
- [ ] 49. **MainDashboard.cs 구현**: 상단 HUD (현금, 시간, 총자산, 부채) 실시간 갱신 UI
- [ ] 50. **TickerUI.cs 연출**: 화면 하단의 흐르는 실시간 종목 시세 선 그래프(Area View) 전광판 연출
- [ ] 51. **StockListUI.cs 보드**: 종목 리스트, 필터링, 검색 기능이 포함된 주식 보드 UI
- [ ] 52. **DetailChartUI.cs 시각화**: LineRenderer를 이용한 7일 주가 선 그래프 (Area Chart) 레이아웃
- [ ] 53. **OrderWindow.cs 팝업**: 매수/매도 수량 조절 슬라이더 및 금융 거래 실행창
- [ ] 54. **PortfolioUI.cs 요약**: 소유 종목 리스트와 전체 수익률 상세 요약 페이지
- [ ] 55. **InventoryUI.cs 구축**: 7개 카테고리 탭 방식의 아이템 선택 및 장착 UI
- [ ] 56. **ShopUI.cs 구축**: 데일리 랜덤 매대와 상설 매대, VIP 전용 슬롯 UI
- [ ] 57. **PhoneOverlay.cs 스마트폰**: 전체화면 스마트폰 UI (친구, 랭킹, 알림, 설정)
- [ ] 57.1. **MailSystemUI.cs 구축**: 스마트폰 내 메일 리스트, 상세 보기 및 아이템 수령 로직

### Phase 7: 도시 생활 및 미니게임 (Lifestyle)
- [ ] 58. **TownMapController.cs**: 라이프스타일 거점(은행, 증권, 펍 등) 이동 로직
- [ ] 59. **BarberSalonUI.cs 구축**: 옷가게 내에서 헤어 스타일과 염색을 선택하는 기능
- [ ] 60. **DialogueSystem.cs 로직**: 텍스트 타이핑 효과, 스킵, 로그 저장 시스템
- [ ] 61. **DialogueChoice.cs 구축**: 유저 선택지에 따른 분기 및 결과 반영 트리거
- [ ] 62. **LaborManager.cs 매니저**: 3개 알바처의 난이도와 보상, 에너지 소모 관리
- [ ] 63. **Neon24MiniGame(편의점)**: 상품 분류 미니게임 핵심 엔진 구현
- [ ] 64. **StockRoosterMiniGame(치킨)**: 게이지 타이밍 기반의 조리 미니게임 엔진
- [ ] 65. **SortingHubMiniGame(택배)**: 고속 상하차 및 물류 분류 미니게임 엔진

### Phase 8: 소셜 연동 및 엔드게임 (Social & Ending)
- [ ] 66. **FriendManager.cs 로직**: 친구 목록 및 가상의 소셜 트레이딩 데이터 처리
- [ ] 67. **EnvyNotification.cs 엔진**: 친구의 잭팟 소식을 전달하는 '배 아픈 알림' 팝업
- [ ] 68. **LeaderboardService.cs**: 친구 간 자산/수익률/스타일 랭킹 계산 시스템
- [ ] 69. **ArenaChallenge.cs 로직**: 1:1 수익률 대결 초청 및 대결 모드 진입 연출
- [ ] 70. **VIPVaultEntrance.cs 연출**: 자산 등급 성장에 따른 비밀 상점 이동 및 연출
- [ ] 71. **GoldenBullQuest.cs 구축**: 황금 세트 수집도를 체크하고 최종 트로피 수여
- [ ] 72. **EndingController.cs**: 최종 자산과 안나의 신뢰도에 따른 멀티 엔딩 시스템

### Phase 9: 폴리싱 및 피니싱 (Final Polish)
- [ ] 73. **AudioManager.cs 구축**: 마스터/배경음/효과음 조절 및 씬별 사운드 믹서
- [ ] 74. **ThemeAudioSwitcher.cs**: 홈 오피스 테마에 따라 BGM을 부드럽게 전환
- [ ] 75. **EffectManager.cs 제어**: 특수 아이템 주변 파티클 및 글로우 이펙트 제어
- [ ] 76. **TutorialSystem.cs 구축**: 신규 유저를 위한 가이드 팝업 및 튜토리얼 플로우
- [ ] 77. **SaveSystem 무결성 테스트**: 저장 데이터의 무결성 및 로컬 보존 테스트
- [ ] 78. **FinalBalance 시뮬레이션**: 3,000G에서 1,000,000G까지의 경제 흐름 최종 테스팅
- [ ] 79. **Optimization 및 빌드**: 2D 스프라이트 시트 성능 최적화 및 드로우콜 관리
- [ ] 80. **Final Package Build**: StockWars 최종 실행 파일 생성 및 배포 준비

---
**알림**: 개발이 완료된 항목은 `- [x]`로 표시하십시오.
