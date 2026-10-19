# 먹기 손끝 둥글게 수정 v5 — 2026-10-19

먹기 v4의 좁아진 양손 끝을 인사 v3와 같은 둥근 캡 형태로 수정했다. 손끝 반경은 0.122이며 팔 길이·본·웨이트·몸통·얼굴과 입 동작·음식 위치·먹기 키프레임은 유지했다.

- `eat-front.gif`, `eat-side.gif`: 수정 후 실제 모델 재생.
- `somangi-eat.glb`, `somangi-eat.blend`: 단일 Eat 클립 모델과 편집본.
- `hand-repair.json`, `validation.json`: 손끝 보정값 및 전체 동작의 접속·팔 길이·몸통/발 고정·루프·본/모프 통합·GLB 재수입 검사.

이전 제작본과 게임 파일은 변경하지 않았다. 재생성은 `../somangi-wave-v3/round_hands.py -- eat`를 사용한다. 인사 v2의 배 수정은 이번 먹기 파일에 추가 적용하지 않았다.
