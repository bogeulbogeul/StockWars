# 안내데스크 새싹 간판 통일

사용자 요청으로 안내데스크 앞 새싹을 뒤쪽 벽 간판과 동일한 형상으로 변경했다. 벽의 Left_Oval_Leaf·Right_Oval_Leaf·Sprout_Rounded_Stem 메시와 재질을 그대로 재사용해 50% 크기로 데스크 배지 중심에 배치했다. 기존 데스크 원형 배지·가구·벽 간판·새 마을 지도·충돌·NPC는 유지한다.

`scratch/update-information-desk-sprout.py`로 데스크 새싹 노드 3개만 교체했다. 나머지 노드·메시·재질 정의·바이너리 데이터는 원본과 동일함을 확인했다. 교체 전 GLB는 이 폴더에 보존했다.

웹과 기존 실행본 resources/web에 같은 GLB를 적용했고 SHA-256 일치는 validation.json에 기록했다. `scratch/check-information-desk-sprout.cjs`를 양쪽에 실행해 실제 안내소 입장·벽과 데스크 잎의 동일 geometry 재사용·최신 지도 텍스처·JavaScript 오류 0건을 확인했다. web-room.png를 열어 실제 표시를 확인했다. 설치 프로그램은 재빌드하지 않았으며 사용자 최종 시각·플레이 검수는 별도다.
