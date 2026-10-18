# 붉은여우 QA

- 외형 참고: 붉은여우 디자인 시트. 동작 참고: 강아지 v9 행동별 행. 두 참조의 용도를 생성 도구에 구분해 전달했다.
- 앞/뒤 최초 접지 순서 오류 행은 미채택으로 보관하고 네이티브 재생성했다. 뒤 팔 옆 벌림과 앞 무릎 들림도 네이티브 편집으로 보정했다.
- 정적 자세 검사: 앞·뒤 A/B의 반대쪽 발 접지, 사선 팔 가림, 운반4자세, 뒤꿈치/발바닥 금지, 긴 꼬리 연결과 방향별 가림, 얼굴 전용 초상화.
- 색: 공통371색, 주황·초코 갈색 기본 재질 고정. 팔레트 포함 검사를 시간적 색 일관성 통과로 간주하지 않는다.
- down_walk / right_walk / up_walk: experimental; live motion continuity not observed. Native limb phases were compared statically; seamless looping/foot contact require live review.
- right_carry: 기존4그림 구성과 순서 대조, 실재생 연결 검수는 별도.
- 시트·좌표·중립·잘림·VM preview 검사는 실행했다. 게임 설치·실제 플레이 접촉 시각 검수는 하지 않았다.
