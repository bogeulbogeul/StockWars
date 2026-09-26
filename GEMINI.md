# 🚀 StockWars AI Agent Guidelines & Rules (GEMINI.md)

이 문서는 본 프로젝트(StockWars)에서 작업할 때 AI 어시스턴트가 항상 최우선으로 준수해야 하는 **토큰 최적화 및 작업 규칙**입니다.

---

## ⚡ 1. 토큰 최적화 행동 수칙 (Token Optimization Rules)

1. **부분 수정 최우선 원칙 (`replace_file_content`)**
   - 기존 파일이나 문서를 수정할 때 `write_to_file`로 전체를 덮어쓰지 않는다.
   - 반드시 `replace_file_content` 또는 `multi_replace_file_content`를 사용하여 **수정이 필요한 특정 라인/블록만 핀포인트로 수정**한다.
   - 이를 통해 입/출력 토큰을 80~90% 이상 절감한다.

2. **파일 조회 범위 최소화 (`view_file`)**
   - 파일 조회 시 전체 조회(1~800줄)를 지양하고, 작업에 필요한 특정 라인 범위(`StartLine`, `EndLine`)를 지정하여 조회한다.

3. **응답 다이어트 및 간결성 (Concise Response)**
   - 수정한 파일의 전체 내용을 답변 메시지에 다시 복사/출력하지 않는다.
   - **수정된 핵심 요점(2~3줄 요약) + 파일 링크([파일명](file:///...))** 형태로 간결하게 답변한다.

---

## 🧱 2. 코드 모듈화 및 파일 크기 상한선 규칙 (File Size Hard Limit)

- **단일 파일 500줄 상한선 (Hard Limit)**: 단일 파일(JS, CSS, C# 등)은 **최대 500줄을 초과할 수 없다** (권장 적정 크기: 100~300줄).
- **비대화 방지 및 선행 분할**: 파일이 400~500줄에 도달하면 기능을 추가로 덧붙이지 않고, **기능별 서브 모듈(`components/[domain]/...`, `modules/[feature].css`)로 먼저 분할**한 후 작업한다.
- **아키텍처 표준서**: 세부 설계 및 분할 패턴은 [CODE_STANDARDS.md](file:///c:/Users/Administrator/Documents/GitHub/StockWars/Docs/CODE_STANDARDS.md)를 상시 준수한다.

---

## 📋 3. 문서 및 체크리스트 관리 규칙

- 체크리스트 업데이트 시 [DEMO_CHECKLIST.md](file:///c:/Users/Administrator/Documents/GitHub/StockWars/Docs/DEMO_CHECKLIST.md)와 [`Docs/DEMO_CHECKLIST.csv`](file:///c:/Users/Administrator/Documents/GitHub/StockWars/Docs/DEMO_CHECKLIST.csv)의 해당 ID 행만 부분 수정한다.
- 중요도: 🔴 `P0 (Core)` > 🟡 `P1 (Major)` > 🟢 `P2 (Polish/Post)`
- 진행 상태: `✅ 완료`, `🔄 진행중`, `⏳ 대기`

---

## 🎨 4. 에셋 생성 및 아트 스타일 규칙 (Art Style Consistency)

- 모든 생성형 AI 에셋 프롬프트 작성 시 [ART_STYLE_GUIDE.md](file:///c:/Users/Administrator/Documents/GitHub/StockWars/Docs/ART_STYLE_GUIDE.md)의 **마스터 스타일 공식(따뜻한 코지/힐링 인디 게임, 부드러운 손그림 과슈/매트 질감, 웜 파스텔)**을 100% 필수 적용한다.
- **금지 요소**: 플라스틱 반사광, 3D 구체 입체 셰이딩, 날카로운 기하학적 스파이크, 자극적인 네온 컬러 배제.


