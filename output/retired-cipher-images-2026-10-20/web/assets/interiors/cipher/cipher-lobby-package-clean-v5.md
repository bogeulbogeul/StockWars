# 사이퍼 로비 clean v5

사용자 요청으로 소파 두 개·테이블·탁상 화분·러그를 왼쪽 아래로 이동하여 모의투자 대결장 문 앞 통로를 넓혔다. 내장 image_gen 편집 도구를 사용했으며 clean-v4 원본은 보존했다. 최종 화풍 변경이 아닌 기존 룸 배치 수정이다.

생성 요청은 원본 기준 (-125, +60) 이동이었으나 결과를 확인한 실제 그룹 이동은 약 (-201, +36)이다. 이 결과에 맞춰 CipherRoomPackageGeometry.js의 충돌·실루엣·좌석·접근점 및 CipherRoomSprites.js의 보조 배치 좌표를 조정했다. 방 외곽과 문·카운터는 유지했다. 전체 시설과 좌석 사이 양방향 이동, 충돌, 대결장 문 접근 통로, 좌석 점유 회귀 테스트로 확인했다.

## 생성 프롬프트

Precise layout edit of attached complete isometric room, which is the EDIT TARGET and appearance reference. Preserve room framing, dimensions 1759x894, camera, walls, doors, elevator, desk, signage, rear plant and left entrance mat exactly. Move ONLY the complete lounge group (both blue sofas, cyan glass coffee table, tabletop plant AND their large white/navy/gold rug) as one rigid group exactly 125 pixels LEFT and 60 pixels DOWN in this 1759x894 image. No rescaling, no rotation, no redesign. This moves the group along the floor diagonal toward the foreground left and creates a wide clear walking corridor between the right sofa and right wall competition door. Left sofa bounding box should move approximately from (914,440)-(1112,600) to (789,500)-(987,660). Right sofa from (1190,472)-(1374,633) to (1065,532)-(1249,693). Table from (1017,530)-(1219,668) to (892,590)-(1094,728). Restore vacated floor to matching clean cream tiles. Keep group entirely inside floor border; retain all relative furniture spacing, single white armrest accents, white sofa base plinths, clean readable isometric furniture edges aligned with existing diagonal floor axes. No characters, UI or added text. Existing artwork is provisional game room style, do not impose pixel art or change style. Return entire opaque room at same framing.
