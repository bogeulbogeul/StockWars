# 스마트폰 P키 토글 v1

사용자 요청으로 프레임의 X 버튼을 제거했다. 공통 PhoneHome의 P키 입력으로 열기/닫기를 처리하며 스마트폰 표시 중 launcher를 숨기고 닫으면 복원한다. 설정 키 지정 중 P는 기존 충돌 검사로 전달하고 Esc 취소를 유지한다. 수령·대화 등 기존 열기 자격과 타이틀·입력창 단축키 제한은 유지한다. 열린 스마트폰의 검색/슬라이더에 포커스가 있어도 P로 닫을 수 있다.

웹 및 기존 실행본 resources/web의 PhoneHome.js, PhoneHomeTemplate.js, phone-launcher.css를 SHA256 일치로 반영했다. 설치 프로그램은 재빌드하지 않았다.

검증: scratch/check-phone-toggle.cjs로 일반 모드 P 열기/닫기/다시 열기, X DOM 없음, launcher 숨김/복원, 전시 모드 P 닫기/다시 열기 및 음악·이동키 설정 회귀 검사를 수행한다. 실제 렌더 및 결과는 같은 폴더 PNG/checks.json을 따른다. 사용자 최종 플레이 검수는 별도다.
