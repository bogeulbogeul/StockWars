# 착석 해제 후 실제 방향 반전 수정

사용자가 이전 영상 1:46의 S 입력/뒷모습을 지적하여 실제 서류·휴대폰 수령 뒤 착석 해제 경로를 재현했다. 원인은 PlayerSeatDismount의 quaternion 복원 후 XYZ Euler가 X/Z=-PI인 동치 표현이 되는데, SomangiPlayer가 Y만 덮어써 실제 앞 방향이 뒤집히는 문제였다. Y 값만 확인한 이전 검증과 옆걸음 추정은 이 원인을 놓쳤다.

SomangiFacing.js는 quaternion으로부터 실제 앞 방향을 읽고, 서서 이동/대화하는 회전은 전체 Euler (0,yaw,0)로 지정한다. 앉은 자세는 기존 busSeated 조기 반환으로 유지한다. 모델/애니메이션/이동 좌표/충돌 변경 없음. SomangiPlayer.js와 새 모듈을 웹/기존 실행본 리소스에 반영했다.

- 회귀 테스트 somangiFacing.test.mjs: PI 회전 quaternion 복원→S/W/A/D 회전 후 실제 forward 벡터와 X/Z 정규화 확인. 관련 Node 테스트 총20개 통과.
- scratch/record-fixed-phone-facing.cjs --packaged: 정류장 출발부터 실제 입력으로 서류 작성·휴대폰 수령/열기·닫기·대사·착석 해제 진행. 이후 A로 열린 공간에 나온 뒤 S/W 실제 입력을 QA 오버레이로 표시해 재촬영했다. 진행 상태/좌표 주입 없음. S-held.png는 앞모습, W-held.png는 뒷모습이며 X/Z=0 확인. 오류0.
- phone-direction-fixed.mp4는 준비 구간만 자른 비교 영상이다. 기존 phone-direction-keys.mp4와 packaged/before-fix.webm은 수정 전 자료이며 검증 완료본으로 사용하지 않는다. packaged/raw.webm은 수정 후 원본. 실제 Windows EXE 실행/설치 프로그램 재빌드는 하지 않았다.
