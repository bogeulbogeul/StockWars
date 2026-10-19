# QA 범위

- 외형: 첨부 디자인 시트의 짧고 위쪽 털끝이 있는 아이보리 솜꼬리. 뒤 중앙 연결, 정면·앞사선 가림 유지.
- 짧은 꼬리: 뒤 A/중립/B에서 같은 RGBA. 좌우 휘두르기는 하지 않고 골반 상하 리듬을 따른다. 꼬리 내부 색 변화를 만들지 않는다.
- 뒤쪽: 꼬리 아래 겹친 곡선과 짙은 초승달 그림자를 제거하고 기존 몸 기본색을 사용. 다리 사이 투명부와 그 경계 보호.
- 얼굴: 코 내부 재질 RGB 고정. 초상화 눈의 복잡한 얼룩과 팔레트 경계를 단순한 홍채·검은 동공·흰 하이라이트로 정리.
- 수동 처리: 국소 패치 좌표/마스크·꼬리 연결점 등록. 네이티브 편집 그림은 공식 컴포넌트 추출, 색 고정은 공식 recolor를 사용.
- down_walk / right_walk / up_walk: experimental, live motion continuity not observed. Existing limb poses and 160ms playback preserved; no new temporal pass claimed.
- right_carry: 원래 자세·순서를 보존. 실재생 연속성은 별도.
- 게임 설치·실시간 플레이 접촉 시각 검수는 미수행.
