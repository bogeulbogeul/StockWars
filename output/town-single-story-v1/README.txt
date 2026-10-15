StockWars 단층 외관 재디자인 | 2026-10-16

분석: townBuildingAssets.js에서 현재 연결된 10종 원본 직접 확인.
유지: 증권사, 홈 오피스텔, 이미 단층인 물류센터와 잡화점.
제작: 가구점, 서점, 은행, 펍, 전당포, 살롱 6종. 살롱 기존 단층 시안도 검토 후 현재 연결된 v2에서 새 시안 생성.
방식: 내장 image_gen, 각 원본을 편집 대상 및 그림체/카메라 참고로 전달. 개별 프롬프트는 .prompt.txt 참조.
검수: 단층 벽 1개 층, 상층 창문 제거, 기존 색상/선/업종 상징, 지상 출입구, 계단 없음 확인. PNG 모서리 alpha=0 확인.
상태: 후속 사용자 요청에 따라 마을 외관 6종을 게임에 적용함. 일부 반투명 외곽 광택은 원본에 남지만 실루엣 기준 crop으로 외부 여백을 제외함.
게임용 파일: web/assets/buildings/topdown-v1/의 single-story 버전 6종. 원본 PNG는 보존.
townBuildingAssets.js의 파일/실루엣 crop/입구 비율과 townScale.js의 높이를 새 외관에 맞춤. 증권사/홈오피스텔/물류/잡화점 유지.
실내와 경제 데이터 미변경. preview.html은 기존/신규 디자인 비교용.
검증: townTopdown/townScale/townOcclusion 테스트 15개 통과. Chrome 실제 게임 렌더러 6종 로드 및 타워 유지, 브라우저 오류 없음 확인.
game-overview.png 및 game-시설ID.png로 마을 전체와 캐릭터 대비 크기 확인. game-check.json에 렌더 검사 결과 기록.

