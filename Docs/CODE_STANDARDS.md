# 📐 StockWars 코드 모듈화 및 파일 크기 표준 규정 (CODE_STANDARDS.md)

본 문서는 StockWars 프로젝트의 **코드 비대화(Monolithic Code Bloat)를 원천 차단**하고, 개발자 및 AI 에이전트의 작업 시 **토큰 효율성과 가독성, 유지보수성을 극대화**하기 위한 공식 코드 구조화 기준입니다.

---

## ⚡ 1. 핵심 원칙: 단일 파일 라인 수 상한선 (File Size Hard Limit)

모든 소스 코드(JavaScript, CSS, C#, Python 등)는 아래 라인 수 기준을 엄격히 준수합니다.

| 상태 | 파일 라인 수 | 조치 기준 (Action) |
|---|---|---|
| 🟢 **적정 (Optimal)** | **100 ~ 300 줄** | 이상적인 단일 책임 모듈. 높은 가독성 및 최소 토큰 소모. |
| 🟡 **주의 (Warning)** | **300 ~ 500 줄** | 추가 기능 개발 전 하위 모듈 분할 검토 시작. |
| 🔴 **초과 (Hard Limit)** | **500 줄 초과** | **신규 코드 추가 절대 금지.** 즉시 기능별/도메인별 하위 모듈로 분할 필수. |

> [!CAUTION]
> **500줄 초과 파일에 기능을 덧붙이는 행위는 금지됩니다.**
> 기능 확장 시 기존 파일이 400~500줄에 근접하면, 반드시 **서브 모듈/컴포넌트를 신설하여 분리**한 뒤 조립(Composition)합니다.

---

## 📱 2. JavaScript / Web 컴포넌트 아키텍처 규칙

### 2.1. 쉘-서브모듈 (Coordinator-Submodule) 패턴
하나의 UI나 씬(Scene)이 여러 탭, 모달, 미니게임을 포함할 경우 단일 파일에 모두 작성하지 않고 **디렉터리 기반 계층 구조**로 분할합니다.

`
web/js/components/
├── TownStage.js                 # [Coordinator / Shell] 무대 총괄, 카메라, 씬 전환 (~200줄)
└── town/
    ├── TownParallaxBackground.js# [Sub-module] 패럴랙스 스카이라인 렌더링 (~100줄)
    ├── TownBuildingManager.js   # [Sub-module] 건물 생성 및 진입 인터랙션 (~200줄)
    ├── TownStreetProps.js       # [Sub-module] 가로등, NPC, 길거리 프랍 (~150줄)
    └── TownPlayerCharacter.js   # [Sub-module] 2D 플레이어 이동 및 스프라이트 애니메이션 (~200줄)
`

### 2.2. 역할 분리 원칙 (Separation of Concerns)
1. **View / Template**: HTML 구조 렌더링 및 DOM 이벤트 바인딩
2. **Logic / Controller**: 비즈니스 로직, 상태 변환, 수학적 연산
3. **Data / State**: 순수 데이터 테이블 및 전역 상태(marketEngine.js, stocksData.js 등)

---

## 🎨 3. CSS 스타일시트 모듈화 규칙

### 3.1. Master Router & Domain Modules
모든 스타일은 web/css/modules/에 기능별 전용 파일로 작성하고, web/css/style.css는 @import 라우터로만 유지합니다.

`
web/css/
├── style.css                    # Master Router (@import 목록만 유지, 50줄 이내)
└── modules/
    ├── base.css                 # 디자인 토큰, Reset, Scrollbar (~100줄)
    ├── smartphone.css           # 스마트폰 프레임, 홈스크린 (~250줄)
    ├── stock-market.css         # 종목 리스트, 티커, 차트 (~300줄)
    ├── town-stage.css           # 마을 무대 베이스 스타일 (~300줄)
    ├── logistics-game.css       # [독립 모듈] 물류 상하차 미니게임 (~300줄)
    └── ...
`

### 3.2. 신규 기능 추가 시 CSS 규칙
- 새로운 미니게임, 건물 인테리어, 모달이 추가될 때 기존 CSS 파일 끝에 이어 붙이지 않고 **새로운 modules/[feature-name].css 파일을 생성**하여 분리합니다.
- 파일 생성 후 style.css에 @import './modules/[feature-name].css';를 등록합니다.

---

## 🎮 4. Unity C# 스크립트 모듈화 규칙

1. **Partial Class 패턴 활용**
   - 600줄 이상의 UI/매니저 클래스는 partial class를 활용해 역할별 파일로 분할합니다.
   - 예: UITradePage.cs -> UITradePage.OrderBook.cs, UITradePage.Chart.cs, UITradePage.Trading.cs
2. **Sub-Manager 컴포넌트 분리**
   - 단일 대형 매니저 대신 하위 시스템 매니저를 생성하여 주입(DI)합니다.
   - 예: OfficeGridManager.cs -> OfficePlacementSystem.cs, OfficePathfinder.cs

---

## 🤖 5. AI 에이전트 행동 수칙 (Mandatory Agent Workflow)

1. **사전 파일 크기 점검**
   - 작업을 시작하기 전, 수정 대상 파일의 줄 수를 확인한다.
   - 대상 파일이 400줄을 초과하는 경우, **기능 구현 전 분할 계획을 먼저 수립**한다.
2. **신규 컴포넌트 분할 생성**
   - 새로운 UI나 기능을 작성할 때 처음부터 독립 파일(sub-module)로 쪼개어 작성한다.
3. **안전한 모듈 분할 절차**
   - 분할 시 인터페이스(파라미터, 이벤트 콜백) 무결성을 100% 유지한다.
   - 분할 완료 후 브라우저/빌드 검증을 통해 기능 누락이 없음을 입증한다.