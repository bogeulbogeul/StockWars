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
