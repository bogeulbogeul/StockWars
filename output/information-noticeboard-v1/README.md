# 안내소 벽 게시판 v1

P1 (Major) · ✅ 3D 모델 제작 / ⏳ 사용자 검수·게임 적용

사용자 참고처럼 둥근 목재 프레임·코르크 바탕·크림 종이 공고 4장·초록/코랄 압정으로 제작했다. 종이와 압정은 별도 메시다. 글씨 대신 읽기 쉬운 간단한 선만 사용하며 실제 주민 부탁이나 안내 데이터는 연결하지 않았다.

- `Information-noticeboard.glb`, `Information-noticeboard.blend`: 독립 모델/원본
- `noticeboard.png`: 게시판 확대
- `room-preview.png`, `Office-noticeboard-preview.blend`: 최신 실내 왼쪽 벽 배치
- `build_noticeboard.py`, `manifest.json`: 재현/배치

임시 크기 폭 1.04·높이 1.30, 중심 (-3.96,.70,1.60)이다. 낮춘 몰딩과 창 위치 정합을 유지하며 게임과 기존 원본은 변경하지 않았다. 게시물 교체·클릭·실제 텍스트 표시 기능은 후속 작업이다.
