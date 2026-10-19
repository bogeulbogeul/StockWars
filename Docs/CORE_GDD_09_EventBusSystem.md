# CORE_GDD_09 이벤트와 시스템 연결

> 개정: 2026-10-16. 현재 웹의 콜백·리스너 구조를 기준으로 한다. 과거 C# 전역 EventBus는 확장 설계 이력이다.

## 1. 현재 연결

`main.js`가 시장·아이템·튜토리얼·월드·거래 UI의 콜백을 연결한다. `MarketEngine`은 listeners와 notify로 상태 변경을 전달하고, `ItemGameplay`는 상태 동기화·저장·수락한 의뢰의 진행 기록을 연결한다. 사용자 조작에는 DOM 이벤트를 사용한다.

| 사건 | 현재 경로 |
| :--- | :--- |
| 주가·체결·잔고 변경 | 시장 notify → 구독한 UI·아이템 연결 갱신 |
| 첫 매수·창 열기·타운 입장·물류 완료 | 컴포넌트 콜백 → AnnaTutorial 단계 알림 |
| 물류 보상 | 등급 정산 → ItemEngine의 골드·EXP·체력 반영 → 화면·저장 |
| 의뢰 진행 | 수락한 trade/labor/arena 이벤트를 SideQuestEngine에 기록 |
| 온라인 위치·대결·친구 | 각 데스크톱 브리지·서버 응답·폴링 경로 |

현재 `TUTORIAL_STEP_COMPLETE`, `PriceChangedEvent`, `StaminaEmptyEvent`, `AssetSeizedEvent` 등의 C# 이벤트 타입을 공용 런타임 API라고 가정하지 않는다. 특히 하트 0만으로 강제 귀가·상점 이용 차단을 추가하지 않는다. 노동 시작·아이템 사용 시 해당 비용만 검사한다.

## 2. 변경 시 유지할 계약

실제 체결 결과를 받은 뒤 수량·수수료·잔고를 화면과 저장에 반영한다. 의뢰는 수락 전 행동을 자동 누적하지 않으며 중복 보상을 막는다. 화면 종료·재진입 때 리스너·타이머의 수명을 확인한다. 현재 콜백을 유지할 수 있는 변경에 전역 버스 재구축을 필수 선행 작업으로 추가하지 않는다.

## 3. 확장 설계

우선순위 큐·Critical 인터럽트·부채/압류/수배 이벤트는 해당 기능을 구현할 때 설계한다. 블랙 스완으로 모든 금융 정산을 건너뛰는 예시는 현행 동작이 아니다. 중앙 이벤트 버스를 도입하려면 기존 구독 경로·저장 순서·중복 알림을 먼저 정의한다.

근거: [main](../web/js/main.js), [MarketEngine](../web/js/engine/marketEngine.js), [ItemGameplay](../web/js/app/ItemGameplay.js), [SideQuestEngine](../web/js/engine/SideQuestEngine.js).
