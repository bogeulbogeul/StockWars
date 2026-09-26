# 토큰 최적화 및 모듈화 규칙 (Token Optimization & Modularization)

- **단일 파일 500줄 상한선**: 모든 파일(JS, CSS, C# 등)은 500줄 초과 금지. 400줄 이상 도달 시 기능 확장 전 서브 모듈 분할 필수 ([CODE_STANDARDS.md](file:///c:/Users/Administrator/Documents/GitHub/StockWars/Docs/CODE_STANDARDS.md)).
- **부분 수정 도구 사용**: 파일 수정 시 `replace_file_content`를 우선 사용하여 변경 대상 행만 핀포인트 수정한다.
- **최소 라인 조회**: `view_file` 호출 시 불필요한 전체 조회를 피하고 `StartLine`, `EndLine`을 설정해 필요한 부분만 조회한다.
- **간결한 응답**: 수정된 파일 내용을 답변에 장황하게 중복 출력하지 않고 2~3줄 요약과 파일 링크만 제공한다.

