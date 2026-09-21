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

## 📋 2. 문서 및 체크리스트 관리 규칙

- 체크리스트 업데이트 시 [DEMO_CHECKLIST.md](file:///c:/Users/Administrator/Documents/GitHub/StockWars/Docs/DEMO_CHECKLIST.md)와 [`Docs/DEMO_CHECKLIST.csv`](file:///c:/Users/Administrator/Documents/GitHub/StockWars/Docs/DEMO_CHECKLIST.csv)의 해당 ID 행만 부분 수정한다.
- 중요도: 🔴 `P0 (Core)` > 🟡 `P1 (Major)` > 🟢 `P2 (Polish/Post)`
- 진행 상태: `✅ 완료`, `🔄 진행중`, `⏳ 대기`
