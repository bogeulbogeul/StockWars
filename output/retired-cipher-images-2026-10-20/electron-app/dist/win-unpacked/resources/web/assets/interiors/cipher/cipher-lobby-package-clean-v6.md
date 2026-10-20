# 사이퍼 로비 clean v6

clean-v5가 안내데스크와 입구 카펫에 너무 가까워졌다는 사용자 피드백을 반영했다. 내장 image_gen으로 라운지 세트를 오른쪽으로 되돌리고, 배경·충돌·좌석·접근점을 함께 수정했다. 원본과 이전 버전은 보존했다.

요청 이동량은 v5 기준 (+90, 0)이지만 생성 결과의 실측 이동은 약 (+152, 0)이다. 최초 v4 대비 최종 이동은 (-49, +36)이다. 데스크와 입구 카펫 앞 여백, 대결장 문 접근 통로, 모든 시설과 좌석 간 양방향 이동을 검증했다. 기존 임시 화풍과 룸 시점은 유지한다.

## 생성 프롬프트

Edit target: attached complete isometric room. Correct ONLY lounge placement. The two sofas, table, plant and white/navy/gold lounge rug are too far left, crowding reception counter and blue entrance doormat. Translate that complete group as ONE rigid unit exactly 90 pixels RIGHT, zero vertical displacement (original canvas 1759x894). Left sofa bounding box approx (712,478)-(910,642) should become (802,478)-(1000,642); right sofa approx (994,514)-(1167,670) should become (1084,514)-(1257,670); table center shifts from x916 to x1006. Preserve size, orientation and spacing within group. Leave clear visible cream floor between left sofa and counter, and between lounge rug and entrance doormat. Keep right door approach clear and whole rug inside floor edge. Preserve all other room pixels: exact framing, walls, floor boundary, doors, elevator, desk, fixed plants, signage, entrance mat, colors, furniture design. Refill vacated area with continuous matching cream floor tiles. Same clean readable isometric perspective and diagonal axes; no distortion, characters, UI, text or other changes. Return full opaque room at same framing and dimensions. This is a provisional existing game room layout correction, not a new art style.
