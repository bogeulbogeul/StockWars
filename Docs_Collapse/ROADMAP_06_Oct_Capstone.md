# ROADMAP 06: 10월 (캡스톤 최종 빌드 마감)

**우선순위:** 3. 10월 말 캡스톤까지 해야 하는 것
**목표:** [Capstone: Lv.10 달성] 레벨 10 달성 시 겪는 후반부 위기(수배) 및 멀티 엔딩 연출

> **[AI 주의사항]** 캡스톤 데모의 엔딩을 장식하는 구간입니다.

## Phase 6: 적색 수배 및 최종 빌드 안정화 (291 ~ 340)

- [ ] 291. **[CORE_GDD_07]** 🧠[Pro] `LottoManagerCore`: 로또 1~45 고유 번호 선정 및 당첨금 풀 연산
  - 📖 읽을 문서: `[CORE_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 292. **[CORE_GDD_07]** `LottoPurchaseUI`: 수동/자동 번호 선택 및 구매 티켓 인벤토리 저장
  - 📖 읽을 문서: `[CORE_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 293. **[CORE_GDD_07]** `SalesLockLogic`: 토요일 19:00 판매 금지 플래그 및 안내 팝업
  - 📖 읽을 문서: `[CORE_GDD_07]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 294. **[CORE_GDD_05]** 🎨[Graphics] `DrawingCeremonyUI`: 21:00 광원 차단 후 나타나는 화려한 추첨 머신 윈도우
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 295. **[CORE_GDD_05]** 🎨[Graphics] `JackpotAnimation`: 1등 당첨 시 화면 전체에 쏟아지는 골드 및 축하 연출
  - 📖 읽을 문서: `[CORE_GDD_05]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 296. ➡️ 11월 이후 이관 (상장/IPO 일정 연기)
- [ ] 297. ➡️ 11월 이후 이관 (상장/IPO 일정 연기)
- [ ] 305. **[CORE_GDD_06]** 🧠[Pro] `EncryptionUpgrade`: 정식 빌드를 위한 세이브 데이터 비대칭 암호화(RSA 권장) 레이어
  - 📖 읽을 문서: `[CORE_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 306. **[CORE_GDD_06]** 🧠[Pro] `AntiCheatSystem`: 런타임 자산 수치 변조 발생 시 즉시 서버(또는 로컬)에 비정상 로그 생성
  - 📖 읽을 문서: `[CORE_GDD_06]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 307. **[CORE_GDD_03]** 🤖[Claude] `CareerPathSummary`: 현재까지의 거래 성향을 분석한 '트레이더 자격증' 발급 연출
  - 📖 읽을 문서: `[CORE_GDD_03]` (Docs_Collapse에서 SLIM 버전 확인)
- [ ] 308. **[데모 이후] [MOD_GDD_01~16]** 🤖[Claude] `GeneralEnding`: 자산 10M Gold 미만 일반 엔딩 판정 및 연출
- [ ] 309. **[데모 이후] [MOD_GDD_01~16]** 🤖[Claude] `WealthyEnding`: 자산 100M Gold 이상 '자본의 신' 엔딩 연출
- [ ] 310. **[데모 이후] [MOD_GDD_01~16]** 🤖[Claude] `CiphersVowEnding`: 안나와의 결혼 및 비밀 서약(Cipher's Vow) 전용 컷신
- [ ] 311. **[MOD_GDD_01~16]** `EndingCredits`: 후원자와 개발진 명단이 올라가는 코지 스타일의 크레딧 스크롤
- [ ] 312. **[Audio]** `AudioMixerSetup`: BGM, SFX, Ambient 소리 크기 및 입체감(Reverb) 최종 믹싱
- [ ] 313. **[Tutorial]** `FlowManager`: 최초 접속 시 튜토리얼 단계 강제 트리거 및 보상 시스템 연동
- [ ] 314. **[UI/UX]** 🎨[Graphics] `AnimationPolish`: 모든 윈도우 열기/닫기 시 부드러운 스케일(Elastic) 효과 적용
- [ ] 315. **[Balance]** 🧠[Pro] 1,000회 이상의 오토 플레이 시뮬레이션을 통한 후반부 경제 정체 구간 해소
- [ ] 316. **[Optim]** 🎨[Graphics] 텍스처 아틀라스 압축 최적화 및 비사용 모델링 에셋 스트리밍 시스템 점검
- [ ] 317. **[Optim]** 🧠[Pro] CPU 프로필링을 통한 실시간 주가 연산 시 메모리 할당(Alloc) 0MB 지향 최적화
- [ ] 318. **[Optim]** PC 환경에서의 프레임 레이트 안정화 및 수직 동기화(V-Sync) 옵션 지원
- [ ] 318-1. **[Optim]** 찌라시 UI 및 파티클 이펙트 생성/파괴 방지를 위한 오브젝트 풀링(Object Pooling) 구현
- [ ] 318-2. **[Optim]** 매일 새벽 04:00(서버 시간) 주기로 가비지 컬렉션(GC) 및 미사용 에셋 강제 해제 루틴 구현
- [ ] 318-3. **[Optim]** 채팅 및 뉴스 로그 메모리 누적 방지를 위한 최대 보관 개수 제한(Data Capping) 시스템 적용
- [ ] 319. **[Test]** 장기 실행(72시간) 테스트를 통한 메모리 누수(Memory Leak) 및 타이머 오차 검증
- [ ] 320. **[Test]** 비정상 종료(Crash) 후 재시작 시 세이브 데이터 자동 복구 및 무결성 전수 테스트
- [ ] 321. **[Test]** 다국어(KR/EN) 텍스트 오버플로우 전수 점검 및 폰트 유니코드 누락 확인
- [ ] 322. **[Test]** 다양한 사양의 PC 환경에서의 UI 렌더링 지연 시간 및 최적화 점검
- [ ] 323. **[Final]** 모든 태스크 `- [x]` 완료 여부 및 각 GDD 문서와의 상호 정합성 전수 대조
- [ ] 324. **[Final]** 스팀웍스(Steamworks) SDK 연동 및 Windows/Mac 빌드 수행
- [ ] 325. **[Final]** 🤖[Claude] 개발 기획서와 최종 빌드 간의 사양 차이점(Spec Diff) 문서 최종 정리
- [ ] 326. **[Final]** 소스코드 주석 정돈 및 클래스 다이어그램 업데이트를 통한 유지보수 준비
- [ ] 327. **[Final]** **StockWars Gold Master v1.0.0** 런처 제작 및 실행 안정성 최종 승인
- [ ] 328. **[Final]** 프로젝트 회고록 작성 및 개발 후기(Post-mortem) 아티클 발행
- [ ] 329. **[Bonus]** 만우절/할로윈 등 예비 시즌 이벤트 에셋 폴더 구축 및 스위칭 로직
- [ ] 330. **[Bonus]** 유저 피드백 수집 및 자동 리포팅(Bug Report) 시스템 백엔드 연동
- [ ] 331. **[Final]** "The Trading Life Begins." - 배포 버튼 클릭 및 런칭 성공 확인
- [ ] 332. **[Post]** 런칭 직후 긴급 패치를 위한 핫픽스 패치 노트 템플릿 제작
- [ ] 333. **[Post]** 실시간 서버 부하 모니터링 및 동시 접속자 수 트래킹 대시보드 셋업
- [ ] 334. **[Social]** 🎨[Graphics] 커뮤니티 배포용 홍보용 고화질 스크린샷 10종 및 트레일러 캡처
- [ ] 335. **[Story]** 히든 스토리: 안나의 과거 회상 씬 해금 조건 최종 밸런스 체크
- [ ] 336. **[Interface]** 게임 패드 및 외부 컨트롤러 지원을 위한 입력 매핑 수동 점검
- [ ] 337. **[Engine]** 유니티 엔진 버전 마이그레이션 도중 발생한 셰이더 오류 최종 클린업
- [ ] 338. **[Resource]** 모든 사운드 에셋의 샘플링 레이트 통일을 통한 오디오 가비지 감소
- [ ] 339. **[Final]** 프로젝트 깃허브 리드미(README) 및 라이선스 고지 문서 정돈
- [ ] 340. **[Final]** 로드맵의 모든 수동 체크 완료 및 사용자 최종 보고 (350/350)
