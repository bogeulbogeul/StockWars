# v3 수정 검수

측면 걷기/운반을3프레임으로 재생성하고 중립자세를 추가했다. 루프는 A→중립→B→중립이다. 먼 다리는 회색 명암으로 구분한다. 머리/귀는 원본 유지 요청을 했으나 픽셀 단위 고정을 보장하지 않는다. 측면 그림 윤곽의 발 교대는 색상에 의존하는 부분이 남아 자연스러운 걷기 최종 통과로 판단하지 않는다. 런타임 고양이 에셋을 v3로 연결했고 정지 운반은 중립 프레임1을 사용한다. H90 배율/앞뒤/앉기/얼굴은 v2 유지. 추출 및 inspect 오류 없음; 정지상태5개 low motion 경고는 예상 결과다. GPT built-in edit 프롬프트: edit-prompts/*v3*.txt. 아래는 v2 실험 이력이다.

# 검은 고양이 v2 — 강아지 자세 편집 실험

- Built-in GPT image generation/editing used. Actual prompts: `edit-prompts/`.
- Pose edit targets: `output/dog-sprite-test/directions-v2/run/raw/<state>.png`; cat identity support: v2 front neutral. Dog poses take priority over cat body proportions.
- This is an explicit user-requested raster experiment, not a change to final rigging/style policy. No parts/rig source produced. Not integrated into active game player.
- Nine canonical rows, nineteen unique frames. Left walk/carry/sit are right-row mirrors; no independent left generation.
- Rear idle first attempt incorrectly included front/rear pair; rear walk first attempt incorrectly showed face. Both regenerated from dog rear target alone, then visually checked: no face, back ears and smooth heels.
- Front walk retains dog step A / neutral / step B, preview order 0,1,2,1. Back walk same order.
- Right walk and carry preserve approved dog poses. Front/rear frame limbs alternate visibly; right-row anatomical foot identity remains ambiguous (similar poses 1/3), inherited from dog. Locomotion remains EXPERIMENTAL and is not a clean continuity pass. No manual limb drawing or timing repair was applied.
- Carry paws now open upward and separated as dog target. Cargo remains separate; provisional cargo attachment is not production verified.
- Front and isometric right seated poses retain compact dog posture, bent knees and hands on thighs. Seat anchor/occlusion not verified in actual room.
- Canonical component extractor, compose-atlas, GIF and contact-sheet tools used. Extraction errors/warnings none; inspect errors none, five expected low-motion warnings for one-frame idle/seated states.
- Front-neutral alpha height 272 -> H90 via common scale 90/272, groundY296. Same scale across all states; no per-state H90 fitting.
- Preview compares cat and dog synchronously at user-controllable zoom. Default zoom2 for viewing only.
