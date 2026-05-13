# StockWars GDD: CORE_GDD_09. 이벤트 버스 시스템 (Event Bus System)

**버전:** v1.0.0 (최초 제정)  
**기능:** 시스템 간 결합도 완화 및 메시지 기반 동적 상호작용 아키텍처 명세

---

## 1. 아키텍처 개요 (Architecture Overview)

### 1.1. 디자인 패턴: Pub/Sub (Observer)
본 프로젝트는 시스템 간의 직접적인 참조(Direct Reference)를 차단하고, 중앙화된 **EventBus**를 통해 메시지를 주고받는 구조를 채택합니다.
- **Publisher**: 이벤트를 발생시키는 주체 (예: MarketEngine, PlayerPortfolio).
- **Subscriber**: 이벤트를 수신하여 리액션을 수행하는 주체 (예: DialogueManager, UIManager, SeizureEngine).
- **Event Bus**: 메시지를 중계하고 우선순위에 따라 배포하는 중앙 허브.

---

## 2. 데이터 구조 및 인터페이스 (Data Structures)

### 2.1. IGameEvent 인터페이스
모든 이벤트 객체는 본 인터페이스를 상속받아 정의됩니다.
```csharp
public interface IGameEvent {
    EventPriority Priority { get; }
    DateTime TimeStamp { get; }
    object Sender { get; }
}

public enum EventPriority {
    Low,      // 단순 UI 갱신 등
    Normal,   // 일반적인 데이터 변동
    High,     // 게임 플레이에 즉각적 영향을 주는 변화
    Critical  // 압류, 파산, 블랙 스완 등 시스템 전체 중단/전환
}
```

### 2.2. 이벤트 버스 관리 로직 (Pseudo-code)
```csharp
public static class EventBus {
    private static Dictionary<Type, List<IEnumerator>> subscribers;

    public static void Subscribe<T>(Action<T> callback) where T : IGameEvent;
    public static void Unsubscribe<T>(Action<T> callback) where T : IGameEvent;
    public static void Publish<T>(T eventArgs) where T : IGameEvent;
}
```

---

## 3. 이벤트 카테고리 정의 (Event Categories)

| 카테고리 | 이벤트 예시 (Event Types) | 상세 설명 |
| :--- | :--- | :--- |
| **Market** | `PriceChangedEvent` | 특정 종목의 가격 변동 시 발행. 차트 및 UI 갱신 트리거. |
| | `GlobalCrisisEvent` | **블랙 스완** 발생 및 종료 시 발행. 전 시스템 모드 전환. |
| **Finance** | `AssetSeizedEvent` | 자산 압류 실행 시 발행. NPC 대사 및 아이템 박탈 연동. |
| | `TransactionExecutedEvent` | 매수/매도 성공 시 발행. 포트폴리오 및 수수료 정산 유도. |
| **Player** | `StaminaEmptyEvent` | 유저 기력 소진 시 발행. 강제 귀가 및 상점 이용 제한. |
| | `ReliabilityChangedEvent` | NPC와의 신뢰도 등급 변화 시 발행. 특수 대사 해금. |
| **World** | `TimeTickEvent` | 게임 내 시간(H) 경과 시 발행. 영업 시간 체크 및 이자 계산. |
| | `ShopStockUpdatedEvent` | 상점 매대 갱신 시 발행. 알림 UI 및 NPC 호객 대사 트리거. |

---

## 4. 특수 메커니즘: 이벤트 우선순위 및 차단 (Priority & Blocking)

### 4.1. 크리티컬 이벤트 가로채기 (Critical Interruption)
`Critical` 우선순위를 가진 이벤트가 발행될 경우, 현재 진행 중인 하위 우선순위의 연출(일반 대사, UI 애니메이션)을 즉시 중단시키고 크리티컬 연출을 최상단에 배치합니다.
- **Case**: 일반 대사 도중 **압류(Seizure)** 발생 시 → 즉시 대사창이 붉게 점멸하며 압류 연출로 전환.

### 4.2. 지연 실행 (Deferred Execution)
네트워크 통신이나 대규모 연산이 필요한 경우, `EventBus`는 이벤트를 큐(Queue)에 쌓아두고 프레임 드랍이 없는 시점에 순차적으로 배포합니다.

---

## 5. 실전 사례: 블랙 스완 시퀀스 (Scenario Example)

이벤트 버스를 통한 시스템 간 유기적 연동 흐름:
1. **[발행]** `MarketManager`가 `GlobalCrisisEvent(Type.Start)` 발행.
2. **[구역 1]** `PostProcessManager`가 화면을 붉은색 글리치 효과로 전환 (구독).
3. **[구역 2]** `DialogueManager`가 안나의 긴급 경고 대사(`ANN_BS_FREEZE_01`) 출력 (구독).
4. **[구역 3]** `TheVaultManager`가 **디지털 방독면** 등 Class E 아이템을 판매 목록에 노출 (구독).
5. **[구역 4]** `FinanceEngine`이 주간 정산 및 이자 징수 플래그를 `Bypass`로 전환 (구독).

---

## 6. 설계상의 주의사항
- **순환 참조 금지**: 이벤트 A가 이벤트 B를 부르고, 다시 B가 A를 부르는 구조를 지양할 것.
- **구독 해제**: `OnDestroy` 시점에 반드시 `Unsubscribe`를 호출하여 메모리 누수를 방지할 것.
 Linda Linda
