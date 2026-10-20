# 증권사 창문 스타일 v2

2026-10-20 사용자 참고의 아치 창틀·끝까지 연결된 십자살·하단 창틀·창턱 형태를 양쪽 정면 창에 적용했습니다.
기존 `Trim_Cream` 아이보리 재질과 `Window_Muted_Blue` 파란 유리 재질을 재사용해 색을 유지했습니다.
창살은 외곽 창틀보다 안쪽이며 교차 부위에 미세한 깊이 차를 두었습니다.

- `CipherSecurities-clock.blend`: 수정 가능한 원본, 시계 애니메이션 포함.
- `CipherSecurities-clock.glb`: 게임 모델.
- `window-detail.png`, `front-right.png`: 창문 확대·전체 외관 렌더.
- `build-cipher-window-style-v2.py`, `exterior_geometry.py`: 제작 스크립트.

게임과 실행본은 기존 GLB 경로에 이 모델을 설치합니다.
현재 시계의 한국 표준시 연결 및 로비 출입은 런타임에서 유지합니다.
