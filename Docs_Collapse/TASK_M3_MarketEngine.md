# TASK_M3_MarketEngine (GIGDC 데모 스펙)

> **[AI 주의사항]** 이 체크리스트는 `CORE_GDD_02_MarketEngine.md`의 복잡한 수학 연산(PRNG, 유동성 가중치 미분, 168시간 트렌드 사이클 등)을 **GIGDC 데모(Lv.1~3) 수준에 맞춰 완벽히 가짜(Mock/Fake)로 쳐낸 버전**입니다. 
> 절대 원본 기획서의 복잡한 로직을 구현하지 마시고, 아래의 체크리스트만 기계적으로 구현하세요.

## 📌 목표: "24개 종목의 주가가 살아있는 것처럼 알아서 움직이게 만들기"

### 1. `MarketManager.cs` (시장 인스턴스화)
- [ ] `StockDataSO` 배열(24종목)을 로드하는 기능 구현.
- [ ] 런타임 주식 데이터를 담을 `class ActiveStock` 정의. (필요 속성: `StockId`, `CurrentPrice`, `PreviousPrice`, `VolatilityTier`).
- [ ] 게임 시작 시 24개 `ActiveStock` 인스턴스 생성 및 초기 가격 설정 (`BasePrice`).

### 2. `FakePriceEngine.cs` (가짜 가격 변동기)
- **복잡한 매수 압력(`BuyPressure`), 전고점(`PeakTracker`) 절대 구현 금지.**
- [ ] `IEnumerator MarketTick()` 구현: 매 `N`초(예: 3초)마다 실행되는 루프 생성.
- [ ] 루프 내부: 24개 종목을 순회하며 `Random.Range(-5f, 5f)` 수준의 단순 퍼센트 변동 적용.
- [ ] `VolatilityTier` (S~C)에 따라 Random의 최대/최소폭만 다르게 설정 (S등급은 더 크게, C등급은 작게).
- [ ] 주가 변동 직후 `EventBus.Trigger(new OnPriceChangedEvent(stock))` 호출하여 UI에 신호 전달.

### 3. `FakeTrend.cs` (가짜 시장 분위기)
- **168시간 사이클(`CircularBuffer`) 절대 구현 금지.**
- [ ] 전역 상태 `enum MarketTrend { Bull, Bear }` 생성.
- [ ] 일정 시간(예: 현실 시간 10분)마다 랜덤하게 Bull / Bear 상태 전환.
- [ ] Bull 상태일 때는 `FakePriceEngine`의 랜덤 값에 양수 가중치(+2%) 추가, Bear일 때는 음수 가중치(-2%) 추가.

### 4. 고스트 트레이더 및 상폐/배당 (스킵)
- [ ] `GhostTrader`: 별도의 AI나 지갑 로직을 만들지 마세요. `FakePriceEngine`이 혼자 움직이는 것 자체가 고스트 트레이더의 역할을 대신합니다.
- [ ] `DividendController` (배당금): 구현 스킵 (데모 외 기능으로 연기).
- [ ] `SplitChecker` (액면분할): 구현 스킵.
- [ ] `DelistingMonitor` & `IPO_Service` (상폐 및 신규 상장): 데모 시연 중 24개 종목이 안정적으로 유지되어야 하므로 완전히 스킵.

---
**✅ AI 개발 가이드**
새로운 채팅(New Session)을 열고, "TASK_M3 체크리스트 구현해줘"라고 지시하면, AI는 위 4가지 항목에 대한 C# 코드만 깔끔하게 출력할 것입니다.
