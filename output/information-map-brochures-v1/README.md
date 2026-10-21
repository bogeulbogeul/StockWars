# 빈 마을 지도와 안내책자 거치대 v1

P1 (Major) · ✅ 모델 제작·배치 / ⏳ 사용자 검수·지도 내용·게임 적용

사용자 참고처럼 세로 기둥과 둥근 목재틀의 마을 지도 패널, 하단 2단 안내책자 거치대를 제작했다. 지도는 **완전히 비어 있는 크림색 면**이며 지형·건물·길·이름·임시 지도 문구를 넣지 않았다. 안내책자는 연초록/크림색 표지와 빈 라벨로 구분한 8권이다.

- `Blank-map-brochure-stand.glb`, `Blank-map-brochure-stand.blend`: 독립 모델/원본
- `map-stand.png`: 단독 확대
- `room-preview.png`, `Office-map-brochures-preview.blend`: 게시판 옆 왼쪽 벽 배치
- `build_map_stand.py`, `manifest.json`: 재현·상태

위치는 (-3.90,-.95,.022)이며 게시판과 떨어진 왼쪽 앞쪽에 놓았다. 지도 면은 `Blank_Map_Insert` 메시로 분리되어 추후 확정된 지도만 교체할 수 있다. 지도 확정·책자 열기·게임 상호작용은 미구현이다. 기존 원본과 게임은 변경하지 않았다.
