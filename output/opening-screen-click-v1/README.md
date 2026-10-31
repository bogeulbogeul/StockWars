# 오프닝 전체 화면 클릭 진행

OpeningSequence는 bindCinematicDialogue에 advanceOnScreen을 켜서 iframe 문서의 빈 곳/그림/대사를 클릭해 한 단계 진행한다. 대사 클릭 리스너를 중복 등록하지 않아 한 클릭에 두 단계 넘어가지 않는다. 버튼·링크·입력 요소는 제외한다. 기본 자동 재생·키보드 대사 진행과 건너뛰기는 유지한다.

마지막 버스 도착도 stage/빈 화면/문구 클릭으로 진행한다. 로딩 전 클릭은 무시하며 건너뛰기는 별도 동작이다. 종료 시 클릭/키보드 리스너·타이머와 커서를 정리한다. 첫날 밤 등 다른 bindCinematicDialogue 사용처는 기존 대사 클릭 방식이다.

검증: scratch/check-opening-screen-click.cjs에서 웹/기존 실행본 리소스 각각 빈 그림 클릭 장면 전환·대사 클릭 단일 진행·기본 자동 진행·버스 stage 클릭/문구 클릭·실제 게임 시작 연결과 브라우저 오류0 확인. scratch/check-cinematic-timers.cjs의 수동 기본값/클릭 타이머 재시작/종료 타이머 취소도 통과. 기존 실행본 3개 JS 동기화. 설치 프로그램 재빌드하지 않음.
