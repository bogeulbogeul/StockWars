# 안내소 외관 창문 실내 통일

사용자 요청으로 현행 웹 `assets/buildings/3d/Information-clean.glb`의 실제 창문을 확인하고, 같은 아치틀·십자 창살·청색 유리·크림색 창턱 메시와 재질을 실내에 재사용했다. 외관은 정면 2개·오른쪽 1개이며 뒤와 왼쪽에는 창문을 추가하지 않았다.

실내는 별도 확장 공간이므로 기존 창 개구부 기준의 벽 방향/높이 배율(정면 8/2.98, 측면 6/1.84, 높이 2.8/1.35)로 정규화했다. 같은 월드 크기는 아니다. 측면 창은 기존 개구부 안쪽으로 0.05 배치해 석고 가장자리가 유리 앞에 드러나는 틈을 없앴다. 실내 정면 두 창은 모델에 포함하되 기존 앞벽 생략 카메라에서 숨긴다. InformationModelRoom.js가 interiorFrontCutaway 메타데이터를 처리한다.

기존 측면 창 8개 부품 노드를 활성 장면에서 제외하고 현행 외관의 4개 부품으로 교체했다. 기존 방 노드·바이너리 데이터는 유지하고 외관 창문 데이터를 추가 참조한다. 원본 GLB는 Information-before-window-update.glb로 보존했다. 최신 지도·데스크 새싹·가구 배치·NPC·기존 충돌 데이터·저장은 변경하지 않았다.

웹과 기존 실행본 resources/web의 GLB 및 로더에 적용했다. `scratch/update-information-interior-windows.py`로 재현할 수 있다. validation.json에 양쪽 GLB 일치 해시를 기록했다.

`scratch/check-information-interior-windows.cjs`를 양쪽 리소스에 실행해 실제 안내소 입장·측면 4개 부품·정면 창 숨김·데스크/벽 새싹 geometry 공유·최신 지도 텍스처·JavaScript 오류 0건을 확인했다. web-room.png·desktop-room.png는 실제 전체 화면이며 web-window.png는 창틀 틈 보정 후 확대 렌더다. 전체/확대 이미지를 열어 확인했다. 설치 프로그램은 재빌드하지 않았으며 사용자 최종 시각·플레이 검수는 별도다.
