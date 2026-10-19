# 고양이 옆 걷기 각도 통일 — 2026-10-16

사용자 요청으로 고양이 right_walk만 강아지의 앞오른쪽 사선 측면에 맞췄다. 양 눈·앞가슴이 보이는 각도, 3자세 A/중립/B, 0→1→2→1과160ms를 유지한다. 왼쪽은 기존 공통 렌더러에서 반전한다. 정지·운반·앉기·앞/뒤 걷기는 변경하지 않았다.

참고 역할: 현재 cat right_idle은 외형·차콜 색·체형 기준; 현재 dog right_walk의 0/1/2는 카메라와 자세 기준이다. 내장 image_gen으로 단일 3자세 행 생성 → sprite-gen canonical extract → compose-atlas/preview/inspect. 원래 프레임 및 추출 기록을 가져와 바뀐 행만 재추출했다. 다른 상태 PNG는 바이트 동일 검증했다. 이전 시트·게임 에셋·옆걷기 프레임은 before/에 보존했다.

motions-v2 최신 시트·프레임·manifest·기존 비교 화면 및 게임 black-cat-npc-v2 atlas/manifest를 갱신했다. [각도 비교](preview.html). 자동 추출·조합·정적 시각 확인은 완료했으며 실제 게임 이동·가구 접촉의 최종 시각 검수는 별도다.
