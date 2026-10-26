# 버스 진입 전 미완성 마을 프레임 노출 수정 — 2026-10-26

사용자 스크린샷의 ‘마을로 향하는 중…’은 버스 연출 준비가 끝나기 전의 로딩 상태였다. ArrivalRenderer가 기존 마을 캔버스를 즉시 새 화면에 붙이므로, 이전에 그려진 길/하늘만 있는 프레임이 후속 자산 준비 중 노출될 수 있었다. 앞선 재현은 view.ready 이후만 확인했으므로 이 구간을 놓쳤다.

ArrivalRenderer는 캔버스를 옮길 때 잠시 숨기고, BusArrivalView가 완성된 첫 프레임을 그린 직후 원래 visibility로 표시한다. 정상 종료·로딩 중 건너뛰기 모두 원래 스타일·부모·크기로 복구한다. 준비 중 문구는 ‘마을을 불러오는 중…’으로 구분한다. 건물 모델·배치·버스 카메라·최적화·대사 클릭 규칙은 변경하지 않았다.

웹과 기존 win-unpacked/resources/web의 ArrivalRenderer.js/BusArrivalView.js/BusArrival.js를 동기화했다. 실제 Edge에서 원경 숲 GLB 응답을 2.5초 지연해 양쪽 리소스를 검증했다. 로딩 동안 캔버스 hidden, 첫 연출 프레임의 건물9개 표시, 버스 대사3단계 클릭, 로딩 중 건너뛰기 후 visibility 복구, pageerror0을 확인했다. web/desktop-checks.json과 loading/first-complete-frame.png를 참고한다. 구문 검사 통과. 설치 프로그램 재빌드는 하지 않았다.
