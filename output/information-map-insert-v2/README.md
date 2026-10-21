# 안내책자 거치대 지도 삽입 — 2026-10-21

P1 (Major) · ✅ 독립 가구·안내소 조합 장면·웹/실행본 실내 연결·브라우저 검증 / ⏳ 사용자 최종 플레이 검수.

`popori-map-colored-pencil-no-text-v1/map.png`를 기존 빈 지도 패널에 원본 비율 그대로 삽입했다. 목재 프레임·하단 책자 8권·기존 가구 형태와 위치는 유지한다. 글씨·표찰은 추가하지 않았다. 이미지는 BLEND와 GLB에 내장되어 외부 파일 없이 표시된다.

- `Popori-map-brochure-stand.glb`: 지도를 내장한 독립 가구.
- `Popori-map-brochure-stand.blend`: 편집 원본.
- `Information-room-with-map.blend`: 해당 거치대가 설치된 `information-wall-layout-v2` 조합 장면에 반영한 원본.
- `map-stand.png`, `room-preview.png`: 독립 확대·실내 미리보기.
- `install_map.py`, `manifest.json`: 재현·검증 기록.

독립 가구와 조합 장면 렌더를 열어 지도 방향·비율·목재틀 간섭을 확인했다. GLB 지도 면·PNG 이미지 내장·책자 표지 8개를 확인했다. 기존 빈 패널 원본과 다른 안내소 배치 원본은 보존한다.

## 후속 게임 연결

`Information-furnished-room.glb`를 `web/assets/office/3d/`에 설치했다. 안내소 앞 F 입장 → WASD 이동 → 아래 출입구 자동 퇴장 또는 Esc → 안내소 앞 복귀로 연결한다. 지도는 가구에 내장되며 지도를 읽는 추가 UI나 NPC 대화·보상 기능은 이번 범위에 포함하지 않는다.

제작 장면에서 렌더 비표시한 앞벽·앞창과 미리보기용 방문자는 내보내지 않았다. NPC 자세는 평가된 메시로 고정해 유지한다. 가구 실측 충돌 211개와 방 경계를 적용했다. 해당 거치대가 포함된 채택 벽 배치 장면을 사용하며 별도 제작 폴더의 미통합 소파나 실내 소품을 자동 합치지 않았다.

`scratch/check-information-room.cjs`로 실제 F 입장·지도 텍스처·지도 앞 접근·이동·가구/벽 충돌·Esc 복귀·재입장·아래 출입구 복귀·세로 리사이즈·브라우저 오류 없음을 검증했다. 결과는 `game-validation.json`, 실제 게임 화면은 `game-interior.png`와 `game-interior-portrait.png`다. 관련 출입 회귀 테스트 3개 통과. 설치 프로그램 재빌드는 별도다.
