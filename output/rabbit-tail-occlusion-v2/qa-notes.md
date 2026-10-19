# QA scope

- 정적 검사: 정면·앞사선 걷기·운반·사선 앉기의 허리 옆 꼬리 돌출 제거. 남은 팔·손·골반 윤곽을 확대 확인하고 꼬리 윤곽 잔여를 정리했다.
- 뒤 정지·뒤 걷기: 중앙 골반 솜꼬리 포함 원본 그대로.
- 색: 원본 RGB를 재생성·재색상화하지 않았다. 최종 프레임에서 RGB 변경 0, 살아 있는 RGBA 원본 동일을 검사한다.
- 모션 참조: 강아지 v9의 기존 자세와 재생 구성을 유지하며 새 팔다리 동작을 만들지 않았다.
- 수동 단계: 네이티브 편집 실루엣에 맞춘 로컬 알파 마스크 등록·윤곽 정리. 공식 추출기는 네이티브 컴포넌트 보관에 사용했다.
- down_walk / right_walk / up_walk: experimental, live motion continuity not observed. Static pose preservation and export integrity passed; these do not establish a new temporal QA pass.
- right_carry: 원본 순서·자세 보존. 라이브 연속성 판정은 미수행.
- 실제 게임 이동·접촉 검수와 게임 설치는 이번 수정 범위에 포함하지 않았다.
