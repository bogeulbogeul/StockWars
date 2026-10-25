# 주황 노을 v2

P2 · ✅ 웹·기존 실행본 적용·자동 검증 / ⏳ 사용자 시각 검수

사용자 요청에 따라 `townSkyPalettes.js`의 노을만 따뜻한 적갈색 `#b96d59` → 주황 `#ed9a58` → 금빛 `#ffd28c`로 바꿨다. 새벽·낮·밤·구름 제거·12초 전환은 유지한다. 동일 모듈을 기존 실행본에 동기화했다.

`scratch/check-current-exteriors.cjs`를 양쪽 리소스에 실행해 네 시간대 구분·가로 색상 균일·전환 시작/중간/종료와 기존 로딩·동선·시계·작은 화면·JavaScript 오류 검사를 통과했다. `web-sky-sunset.png`와 `desktop-sky-sunset.png`는 실제 게임 장면의 검사 카메라 렌더다. 설치 프로그램은 재빌드하지 않았다.
