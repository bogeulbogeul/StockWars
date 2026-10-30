# 휴대폰 수령 후 이동 실제 경로 재검증

2026-10-30 사용자 제보에 따라 실제 정류장 이동/모아 깨우기/안내소 입장/착석/서류 수령·작성·제출/휴대폰 수령을 입력으로 통과했다. scratch/check-phone-before-exit.cjs는 휴대폰 수령 직후 openPhone 활동에서 WASD로 일어나 S/W를 입력해 확인한다. 좌표 감소/증가와 yaw PI/0 및 앞뒤 모습이 일치했고 Head 회전은 identity였다. scratch/check-phone-walk.cjs는 첫 휴대폰 열기/닫기·지도·은행 상담 후 수동 퇴장 대기에서 확인했으며 출입구의 자동 옆걸음(S)과 일반 걷기(W)를 관찰했다. 브라우저 오류 0건.

이번에는 새 코드 수정은 하지 않았다. 사용자 당시 문제는 현재 소스에서 재현하지 못했다. 이전 직접 상태 준비 검증과 구분한다. after-phone-s/w.png는 마지막으로 실행한 수령 직후 검증 화면이다. 전체 은행 이후 플레이 및 실제 EXE 검증은 하지 않았다. 현재 실행 중인 StockWars 프로세스는 없었다. 설치 프로그램은 과거 빌드이며 현재 동기화한 실행 경로는 electron-app/dist/win-unpacked/StockWars Demo.exe다.
