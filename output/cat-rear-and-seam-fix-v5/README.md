# 고양이 뒤 디자인·운반 합성 경계 보정 v5

2026-10-18 사용자 피드백 반영. 기반은 `../cat-chest-color-lock-v4/`다. 게임에는 설치하지 않았다.

- ✅ 완료: 운반의 네모는 v3 손 수정본을 붙인 영역에 남은 RGB 차이였다. 기존 손 모양과 alpha를 유지하면서 팔·손의 연속된 재질 영역을 RGB(65,59,62)로 정리했다. 사각 패치를 다시 그 위에 붙이지 않는다.
- ✅ 완료: 사용자 첨부 뒷모습을 외형 기준으로 built-in imagegen 편집. 둥근 뒤통수, 귀 뒷면, 작은 목덜미 털, 가슴털 같은 등 무늬 제거, 오른쪽 위로 휜 긴 꼬리를 반영했다. 세 프레임 모두 꼬리의 오른쪽 곡선과 골반 연결을 유지한다.
- ✅ 완료: 뒤 걷기는 강아지의 A/중립/B 자세 순서. 중립은 두 발 접지·양팔 내림, 뒤 정지는 새 중립과 동일하다. 걷기3그림 A→중립→B→중립과160ms 유지.
- ✅ 완료: canonical component 추출·머리 중심 정렬·RGB 팔레트 베이크.42색 밖0색, 운반 alpha·보정 영역 밖 RGBA 동일, 변경 대상 밖 상태 동일, 좌표·재생 계약 동일 검사.
- ⏳ 대기: 사용자 최종 외형·재생 확인, 게임 설치, 실제 접촉 검수.

`sprite-sheet-alpha.png`, `manifest.json`이 전달본이다. `preview.html`은 수정본·강아지 동시 재생, `up-walk.gif`와 `right-carry.gif`는160ms 루프다. `before-after.png`는 운반 이전/수정, 뒤 걷기 이전/수정 순으로4행이다.

`rear-generated.png`는 built-in image_gen 원본, `run/`은 canonical 추출·정렬 원본이다. `rear-edit-target.png`는 편집 대상, 사용자 첨부 뒷모습은 외형 참고, `../cat-dog-motion-2026-10-18-v1/references/dog-up_walk.png`는 동작만 참고했다. 요청 전문은 `rear-edit-prompt.txt`, 조합·색 수정과 검증은 `package_v5.py`, `baked/*report.json`, `validation.json`에 남긴다.
