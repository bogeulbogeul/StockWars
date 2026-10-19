# 고양이 뒤 걷기 꼬리 방향 교대 v3

**사용자 요청에 따른 게임 반영 완료:** 동일 PNG·팔레트를 `web/assets/characters/black-cat-baseline-v3/`에 설치하고 공통 SVG/Canvas 캐릭터·얼굴 UI에 연결했다. 설치 원본 일치 기록은 `game-installation.json`이며 캐릭터/프로필/살롱 관련 테스트18개를 통과했다. 아래 게임 미반영 표기는 제작 당시 이력이다. 실제 플레이 접촉 시각 검수는 별도다.

강아지 v9와 같이 A는 화면 왼쪽, 중립은 왼쪽, B는 화면 오른쪽으로 꼬리가 휘도록 B 완성 프레임을 내장 image_gen으로 편집했다. 꼬리 뿌리는 골반 뒤 중앙에 유지하고 뒤꿈치에 발가락 선·발바닥 패드를 추가하지 않았다. 원본과 프롬프트는 `generation.json`, `raw/up_walk.png`다.

sprite-gen 연결 성분 추출·공통 배율 배치 후 B만 채택했고 기존273색으로 recolor 베이크했다. A·중립·뒤 정지를 포함한 다른18논리 프레임은 v2 PNG 바이트 그대로다. 걷기3그림·0→1→2→1·각160ms, 다른 동작과 운반 순서를 유지했다. RGB 목록 밖 색0개, 시트 픽셀·중립 공유·좌표 일치를 검사했다.

`preview.html`은 v2와 v3 뒤 걷기 비교, `rear-comparison.png`는 위 수정 전 / 아래 수정 후다. `cat/run/sprite-sheet-alpha.png`는 전체 시트, `qa/up_walk.gif`는 새 뒤 걷기 재생이다. 실시간 모션 연속성·발 미끄러짐 최종 통과를 뜻하지 않으며 게임 고양이는 아직 변경하지 않았다. 재조합은 prepare → recolor(baked) → publish → verify 순서다.
