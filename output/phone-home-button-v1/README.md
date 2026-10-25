# 알아보기 쉬운 스마트폰 홈 버튼

사용자 요청으로 하단 검은 막대를 집 아이콘·홈 글자가 있는 연두색 버튼으로 교체했다. 44px 이상의 터치 영역과 키보드 포커스 표시를 제공한다(낮은 화면은 36px). 넓은 주식 화면에서도 같은 버튼이 표시되도록 숨김 규칙을 제거했다. 기존 상단 홈 화면 링크·P 열기/닫기·launcher 숨김은 유지한다.

웹과 기존 실행본 resources/web의 PhoneHomeTemplate.js, phone-home.css, stock-desktop.css에 반영했다. 설치 프로그램 재빌드는 하지 않았다. 실제 브라우저 화면은 web-settings.png 및 web-mobile.png, 검사 결과는 checks.json을 따른다. 사용자 최종 시각 검수는 별도다.
