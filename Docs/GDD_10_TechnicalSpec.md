# StockWars GDD: 10. 기술 명세 및 데이터 구조 (Technical Spec)

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
