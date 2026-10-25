# 포장 알바 드래그 응답 개선

드래그 이벤트마다 SVG 상품 그림을 재생성하던 처리를 시작 시 한 번으로 변경했다. 전체 상품 dragging 상태도 시작/종료에만 갱신한다. 이동 그림과 배치 미리보기에는 위치 보간 애니메이션을 적용하지 않는다. 기존 선택 임계값, 배치 판정, 상품/보수 규칙을 유지한다.

웹과 기존 실행본 resources/web의 PackingInput.js, PackingGame.js, packing.css를 동기화했다. 설치 프로그램 재빌드는 하지 않았다.

검증: node --test web/tests/packing.test.mjs (7개 통과). scratch/check-packing-response.cjs로 실제 Edge에서 첫 누르기, 캡처 해제 후 드래그/배치, 취소, 이동 중 동일 SVG 유지, transition 0초를 검증한다. 사용자 체감 확인은 별도다.
