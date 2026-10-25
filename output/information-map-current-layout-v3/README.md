# 안내소 새 마을 지도 적용 v3

P1 · ✅ 웹·기존 실행본 적용·실제 표시 검증 / ⏳ 사용자 최종 플레이 검수

사용자 요청으로 새 색연필 지도 `output/popori-map-current-layout-v2/map.png`를 현행 `Information-furnished-room.glb`의 `Popori_Map_Printed_Paper` 이미지로 내장했다. 지도 이미지만 전용 bufferView로 추가 연결해 기존 메시·노드·UV·재질 속성·가구·기존 바이너리 데이터를 그대로 유지했다. 지도 원본과 대상 파일의 SHA-256은 `validation.json`에 기록했다. 교체 전 모델은 `Information-before-map-update.glb`에 보존했다.

웹과 기존 실행본 `assets/office/3d/Information-furnished-room.glb`에 같은 파일을 반영했다. `scratch/update-information-map.py`가 재현 스크립트다. `scratch/check-information-map-update.cjs`를 양쪽에 실행해 실제 안내소 입장·모델 로딩·새 지도 텍스처 이름/1402×1122 크기·JavaScript 오류 없음을 확인했다. `web-map-display.png`·`desktop-map-display.png`는 실제 안내소 거치대 확대 렌더다. 가구/실내 배치·충돌·모아·저장·추가 지도 UI는 변경하지 않았다. 설치 프로그램은 재빌드하지 않았다.
