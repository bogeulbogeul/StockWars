# StockWars GDD: CORE_GDD_06. 기술 명세 및 데이터 구조 (Technical Spec)

**버전:** v2.25.0 (최종 완결본)  
**기능:** 시스템 구현을 위한 데이터 아키텍처 및 핵심 엔진 의사 코드 명세

---

## 1. 데이터 모델링 (Data Structures)

교수님, 본 프로젝트는 데이터의 일관성과 확장성을 위해 유니티의 **ScriptableObject** 시스템을 적극 활용합니다.

### 1.1. StockData (주식 기초 데이터)
```csharp
[CreateAssetMenu]
public class StockData : ScriptableObject {
    public string stockName;      // 종목명
    public SectorType sector;     // IT, 바이오, 엔터 등
    public float basePrice;       // 초기 상장가 (v2.25.0 매트릭스 기준)
    public VolatilityTier tier;   // S, A, B, C 등급
    public float currentPrice;    // 실시간 변동 가격
    public List<float> priceHistory; // 최근 7일(168시간) 가격 이력 (선 그래프용)
}
```

### 1.2. RumorData (찌라시 데이터)
```csharp
[CreateAssetMenu]
public class RumorData : ScriptableObject {
    public string targetStockID;  // 대상 종목
    public RumorType type;        // 호재, 악재, 가짜뉴스
    public string[] tierDialogs;  // Tier 1~3 텍스트 배열
    public float impactValue;     // 주가에 미칠 영향력 가중치
    public DateTime expiryTime;   // 소멸 시간 (24h TTL)
}
```

### 1.3. InstitutionData (기관 및 위탁 정보) [v3.5.0]
```csharp
[CreateAssetMenu]
public class InstitutionData : ScriptableObject {
    public string ownerID;            // 기관장(유저) ID
    public long trustFund;            // 위탁 운용 총액 (Trust Fund)
    public float commissionRate;      // 수익 공유 수수료율 (10~20%)
    public long accumulatedEmbezzled; // 누적 횡령액 (적색 수배 트리거용)
    public bool isWanted;             // 적색 수배 여부
}
```

### 1.4. ShortPosition (공매도 포지션) [v3.5.0]
```csharp
[Serializable]
public struct ShortPosition {
    public string stockID;      // 공매도 종목
    public int quantity;        // 수량
    public float entryPrice;    // 진입 가격
    public long collateral;     // 동결된 증거금 (150%)
}
```

---

## 2. 핵심 엔진 로직 (Core Engine Logic)

### 2.1. 희소성 기반 가격 엔진 (Scarcity Engine)
유저의 매수 총량이 유동 주식수(Floating Supply)의 일정 비율을 넘어서면 주가 가중치를 제곱근 함수로 적용하여 폭등을 유도합니다.
- **Formula**: `PriceChange = sqrt(TotalBuyVolume / FloatingSupply) * VolatilityFactor`

### 2.2. 자산 압류 엔진 (Seizure Engine)
정산 시 자산 가치가 0 이하 혹은 이자 체납 시 실행됩니다.
- **Priority**:
    1. `Portfolio.SellAll(MarketPrice * 0.7f); // 급매 패널티 30%`
    2. `FurnitureManager.RemoveLatest(); // 스탯 버프 즉시 삭제`
    3. **[v3.5.0] Margin Call**: 마진콜 임계값(100%) 도달 시 시장가 강제 매수(Cover) 및 5배 수수료 부과.

### 2.3. 상장 폐지 및 IPO 서비스 (Delisting & IPO Logic)
- **Delisting Process**:
    ```csharp
    public void FinalizeDelisting(string stockID) {
        var stock = DataRegistry.GetStock(stockID);
        stock.isDelisted = true;
        // 정리 매매 종료 후 강제 청산
        PlayerPortfolio.RemoveAll(stockID); 
        MarketManager.TriggerIPO(); // 공석 발생 시 즉시 IPO 시퀀스 진입
    }
    ```
- **IPO Sequence**:
    1. 후보군 리스트(`pendingIPOList`)에서 대상 섹터 매칭.
    2. `NewsService.Announce("New Listing", stockName);`
    3. 지정된 쿨타임 후 `ActiveStocks.Add(newStock);`

---

## 3. 씬 관리 전략 (Scene Management)

| 씬 이름 | 주요 역할 | UI/UX 특징 |
| :--- | :--- | :--- |
| **Scene_HomeOffice** | 가구 배치, 트레이딩, 안나와 대화 | Lo-Fi 감성 조명, 서랍장 인벤토리 |
| **Scene_Town** | 노동 시설(편의점/치킨/상하차) 이동 | 3인칭 쿼터뷰 혹은 횡스크롤 픽셀 아트 |
| **Scene_Labor_MiniGame** | 3종 미니게임 실행 | 조작 집중을 위한 UI 오버레이 |
| **Scene_Market** | 전체 주식 차트 및 대형 시황판 | 하이테크-빈티지 감성의 전광판 연출 |

---

## 4. 기획 의도와 기술적 결합 (Design Intent)
본 기술 명세는 **'데이터의 휘발성(찌라시)'**과 **'물리적 박탈(압류)'**이라는 기획 의도를 기술적으로 뒷받침하기 위해 설계되었습니다. 모든 거래는 **Atomic Transaction**으로 처리되어 강제 종료 시에도 이자와 압류 데이터가 무결하게 보존됩니다.

---

## 5. 데이터 최적화 및 캐시 관리 (Data Optimization) [v2.60.0]
실시간으로 발생하는 대량의 데이터를 효율적으로 관리하여 메모리 비대화와 가비지(Garbage) 누적을 방지합니다.

### 5.1. 주가 데이터 슬라이딩 윈도우 (Sliding Window)
- **대상**: `StockData.priceHistory`
- **정책**: 최대 길이를 **168개(7일 x 24시간)**로 고정.
- **메커니즘**: 
    - `Enqueue`: 매시간 정각에 새로운 가격 데이터 추가.
    - `Trim`: `Count > 168`인 경우 가장 오래된 데이터(`Index 0`)를 즉시 제거하여 메모리 할당량을 상수로 유지.

### 5.2. 마일스톤 아카이빙 (Milestone Archiving)
초장기 데이터(1개월~1년)는 전 종목의 가격 대신 유저의 **성치 요약본**만 보존합니다.
- **저장 시점**: 매 정산 시점(Weekly).
- **데이터 구조**:
    ```csharp
    [Serializable]
    public struct MilestoneData {
        public DateTime timeStamp;   // 정산 일자
        public float totalAsset;     // 당시 총 자산
        public float totalDebt;      // 당시 총 부채
        public string topStockName;  // 수익 기여도 1위 종목
    }
    ```
- **의도**: 최소한의 메모리 점유로 유저에게 장기적인 성장 서사를 시각화할 수 있는 기반 마련.

### 5.4. 액면분할 데이터 보정 (Stock Split Normalization) [v2.65.0]
액면분할 시 데이터 무결성과 차트의 연속성을 위해 다음 로직을 **Atomic Transaction**으로 수행합니다.

1. **포트폴리오 보정 (Portfolio Sync)**: 
    - 보유 수량: `SharesOwned = SharesOwned * SplitRatio`
    - 평균 단가: `AvgPrice = floor(AvgPrice / SplitRatio)`
2. **차트 데이터 소급 보정 (Chart Normalization)**:
    - 대상: `StockData.priceHistory` 내의 모든 인덱스.
    - 로직: `price = floor(price / SplitRatio)`
    - 목적: 차트에서 비정상적인 가격 급락(Gap)이 보이지 않도록 시각적 연속성 확보.

### 5.3. 휘발성 오브젝트 풀링 (Object Pooling & TTL)
- **찌라시 관리**: 만료된 `RumorData`는 즉시 리스트에서 제거하고 `DestroyImmediate` 혹은 풀링(Pooling)을 통해 메모리 파편화를 방지함.
- **UI 글리치 효과**: 셰이더 기반의 연출을 우선하여 CPU의 가비지 생성을 최소화함.

---

## 6. 금융 및 이벤트 데이터 무결성 [v2.60.0]

### 6.1. 주간 금융 틱 (Finance Tick) 우선순위 설계 [v3.5.0]
매주 월요일 00:00에 실행되는 **Atomic Transaction** 내에서 논리적 모순이 발생하지 않도록 다음 순서로 연산을 처리합니다.

1.  **배당금 입금 (Credit First)**: 72시간 보유 조건을 충족한 종목에 대해 배당금 지급.
2.  **유지비 차감 (Maintenance)**: 오피스 레벨(LV 1~4)에 따른 고정 비용(500G~5,000G) 선차감.
3.  **이자 및 부채 상환 (Debt Settlement)**: '이자 우선 상환' 원칙에 따라 미납/당월 이자를 먼저 0으로 만든 후 원금 상환.
4.  **기관 운영비 정산**: 기관 유지비(5,000G) 및 위탁 운용 수익(15%) 정산.
5.  **적색 수배 및 압류 판정**: 최종 가용 자산 확인 후 Seizure Engine 혹은 Red Notice 발동 여부 결정.

### 6.2. 원자적 트랜잭션 (Atomic Transaction)
이자 차감, 배당금 입금, 유지비 정산 프로세스는 하나의 트랜잭션으로 묶여 실행됨. 또한 **고스트 트레이더의 모든 수익**은 정산 시점에 시스템에 의해 전액 소각(Nullify) 처리되어야 함.

---

## 7. 로또 및 전당포 시스템 기술 명세 [v3.00.0]

### 7.1. 로또 판매 상태 엔진 (Lotto Sales State Engine)
- **상태 판정 로직 (IsSalesLocked)**:
    - **조건**: `(CurrentDay == Saturday)` && `(19:00 <= CurrentTime < 21:05)`
    - **처리**: 위 조건 충족 시 `LottoManager.Purchase()` API 호출 시 `ErrorCode.SALES_LOCKED` 반환.
- **당첨금 풀 프리징 (Pool Freezing)**:
    - 매주 토요일 19:00 정각에 현재까지의 총 판매액을 데이터베이스에 고정(Snapshot).

### 7.2. 전당포 담보 및 실시간 몰수 엔진 (Pawn & Forfeiture Engine)
- **Real-time Tick Check**: 담보 아이템의 `LoanTimestamp`를 서버 시간과 매 프레임 대조하여 168시간 초과 여부를 감시함.
- **Ownership Transfer**: 기한 만료 즉시 아이템의 `OwnerID`를 `Barter_Shop`으로 강제 이전하고, 유저 인벤토리에서 삭제 처리함.
- **Interest Logic**: `Current_Pawn_Debt = Current_Pawn_Debt * 1.05` (매주 월요일 00:00 복리 적용).

### 7.3. 서사적 역제안 엔진 (Counter-Proposal Engine)
- **트리거**: 유저가 특정 종목의 '상장 폐지' 정보를 보유한 상태로 바터 방문 시 발생.
- **효과**: 정보 소모와 교환으로 부채 이자 탕감 혹은 상환 기한 72시간 연장 처리.

## 8. 엔드게임 보조 엔진 (Short & Embezzlement) [v3.5.0]
- **Embezzlement Tracker**: 위탁 계좌 인출 시 `ManagedAssets.TotalWithdrawal` 누적 연산.
- **누진적 적색 수배 트리거 (Progressive Trigger)**:
    - **1단계 (의심: 5~10%)**: 안나의 경고 메일 발송 및 'Standard' 표정에서 날카로운 지적 추가.
    - **2단계 (조사: 10~15%)**: 모든 상점 이용 수수료 **2.0배** 적용. 안나의 'Angry' 표정 고정.
    - **3단계 (수배: 15% 초과)**: **[적색 수배]** 발동. 안나 상호작용 완전 차단 및 **뒷모습 초상화** 강제 고정.
- **상환 태만 페널티 (Reliability Drop)**:
    - **조건**: `(Cash >= DebtInterest)` && `(InterestPaid == false)` 상태로 주간 정산 종료 시.
    - **결과**: `Anna.Reliability -= 1;` 및 'Pain' 표정 애니메이션 1회 실행.
- **횡령 복구 및 소각 (Recovery & Burn)**:
    - **복구 조건**: 횡령액이 임계치(10%) 이하로 낮아지는 즉시 수수료 배율 정상화(1.0).
    - **소각 로직**: 위탁 원금 복구 트랜잭션 시, 입금액의 **1%**를 `System_Burn_Account`로 강제 전송하고 소각 처리.
- **Bounty Loop**: 수배자의 공매도 포지션 붕괴를 유도한 유저에게 횡령액의 일부를 보상으로 분배.

---

---

## 9. 실시간 마진콜 감시 엔진 (Margin Watcher) [v3.5.0]
공매도 포지션의 리스크를 실시간으로 체크하는 백그라운드 로직입니다.

- **Update Loop**: 매 프레임 주가 변동 시마다 포지션의 손실률 계산.
- **Trigger Levels**:
    - **Lvl 1 (Warning)**: `Loss >= Collateral * 0.9` 
        - 스마트폰 메일 앱 긴급 푸시 발송 및 UI 경고.
    - **Lvl 2 (Force Close)**: `Loss >= Collateral * 1.0`
        - 포지션 강제 청산 및 증거금 전액 몰수. (유예 기간 72시간 종료 후 실행)
        - **유저 보호**: 추가 패널티 없이 **표준 수수료(0.1%)**만 부과 후, 자산이 마이너스일 경우 **[MOD_GDD_14] 개인 회생** 엔진으로 강제 이진.
- **Anna's Bailout Quest (구원 퀘스트)**:
    - **보상**: 파산 전 자산과 무관하게 **재기를 위한 최소 시드(Fixed Amount)** 지급 및 **이자 초기화**.
    - **실패 패널티 (Critical)**: 퀘스트 실패 시 `Rehab_Penalty_Duration`을 기본값의 2배인 **336시간(2주)**으로 강제 고정하고 `Trading_Fee_Multiplier` 2.0배 즉시 적용.
    - **데이터 영속성 (Persistence)**: 모든 패널티 상태는 세이브 데이터에 직렬화되어 세션 종료 후에도 엄격히 유지됨.

---

## 10. 글리치 해독 및 블랙 스완 매니저 (Glitch & Crisis Manager) [v4.0.0]

### 10.1. 분석력 기반 정보 오염 알고리즘
찌라시 텍스트 생성 시 유저의 `Analysis_Stat`에 따라 `Decryption_Rate`를 적용하여 원문을 글리치 텍스트로 변환합니다.
- **가림 확률 산식**: `HideChance = 1.0f - Decryption_Rate`
- **우선순위 큐 (Masking Priority)**:
    1.  `[STOCK_NAME]` (최우선 가림)
    2.  `[DIRECTION_UP_DOWN]`
    3.  `[CAUSE_REASON]`
- **전략적 노이즈**: `Analysis_Stat == 5` 일지라도 `Strategic_Noise_Chance(0.05f)`를 체크하여 5% 확률로 오보 찌라시 생성.

### 10.2. 블랙 스완 사이클 매니저 (Black Swan Cycle)
- **주기 상수**: `BLACK_SWAN_CYCLE = 100 Days (Real-time)`
- **시나리오 트리거**: `CycleDay % 100 == 0` 일 때 랜덤 시나리오 인스턴스 생성.
- **예외 처리 플래그 (Relief Logic)**:
    - `Weekly_Tick_Bypass = true`: 블랙 스완 진행 중 월요일 정산 무시. (이자/유지비 0원 처리)
    - `Seizure_Engine_Lock = true`: 이벤트 중 압류 로직 가동 완전 중단.
    - `Relief_Week_Active = true`: 정상화 후 차기 정산일까지 `Interest_Rate = 0.0f` 강제 고정.
- **환경 변수 제어**:
    - `Emergency_Red_Lighting = true` (시작 시)
    - `Buy_Order_Disabled = true` (Scenario 01 한정)
    - `Ghost_Price_Override = true` (Scenario 03 한정)

---

## 11. 은행 및 저축 시스템 연산 엔진 (Banking Logic) [v4.0.0]

### 11.1. 수익률 및 수수료 상수 (Constants)
- `DEPOSIT_INTEREST_RATE = 0.002f;` (주당 0.2%)
- `SAVINGS_INTEREST_RATE = 0.010f;` (주당 1.0%)
- `SAVINGS_EARLY_TERM_PENALTY = 0.050f;` (원금 5%)
- `SAVINGS_LOCK_DURATION = 168 Hours (Real-time)`

### 11.2. 저축 해지 로직 (Savings Termination Logic)
```csharp
public void TerminateSavings(string userID, long principal) {
    var savings = Database.GetSavings(userID);
    if (DateTime.Now < savings.expiryDate) {
        // 중도 해지 패널티 적용
        long penalty = (long)(principal * SAVINGS_EARLY_TERM_PENALTY);
        PlayerWallet.AddCash(principal - penalty);
        // 누적 이자 소각
        savings.accumulatedInterest = 0;
        Notification.Send("Early termination fee: 5% applied. Interest nullified.");
    } else {
        // 정상 만기 수령
        PlayerWallet.AddCash(principal + savings.accumulatedInterest);
    }
}
```



