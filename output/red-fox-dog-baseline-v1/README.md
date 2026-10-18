# 붉은여우 — 디자인 시트 외형 / 강아지 v9 모션

사용자 요청으로 `../red-fox-design-2026-10-17-v1/design-sheet.png`의 붉은여우 외형을 완성 스프라이트로 제작했다. 동작은 `../dog-hidden-hand-v9/dog/run/`의 해당 행동별 프레임을 별도 참고했다.

- 10상태·19논리 항목·16고유 그림. 320×400셀, 1280×4000 투명 시트.
- 정면·앞오른쪽 사선·뒤 걷기 각3그림, A→중립→B→중립/160ms. 정지는 해당 중립과 동일 PNG.
- 운반4그림은 강아지 v9의 파일 순서0→1→2→3. 정면/사선 앉기와 얼굴·귀만 있는 초상화 포함.
- 주황 털·아이보리 가슴/얼굴/꼬리 끝·초코 갈색 손발·긴 귀와 긴 꼬리를 유지했다. 꼬리는 골반 뒤에 연결하고 방향·몸의 가림을 반영한다. 토끼의 짧은꼬리 규칙을 적용하지 않는다.
- 사선 B의 뒤쪽 팔/손 가림, 양쪽 접지 교대, 매끈한 뒤꿈치와 발바닥 패드 없음은 정적 자세 보드에서 확인했다.

## 결과

- `preview.html`: 왼쪽 강아지 v9 / 오른쪽 붉은여우 동시 재생. 방향·운반·앉기·초상화와 작은 크기/좌우 반전 확인 가능.
- `red-fox/run/sprite-sheet-alpha.png`, `manifest.json`, `frames/`: 전체 시트·좌표·재생·개별 PNG.
- `red-fox/review-final.png`, `face-icon.png`, `qa/*.gif`: 자세 보드·얼굴·160ms 재생 파일.
- `palette.json`, `palette.csv`: 공통371색. 주황/갈색 재질의 기본색 고정은 `material-verification.json`을 따른다.

## 제작·보정

내장 image_gen으로 행동별 완성 그림을 직접 생성·편집했다. 프롬프트·원본·재시도는 `generation.json`, `retakes.json`, `pose-refinements.json`에 기록한다. 초기에 반대로 나온 앞/뒤 접지 순서를 재생성했고, 뒤 팔의 과도한 옆 벌림과 앞 들린 발 높이를 네이티브 편집으로 보정했다. 리깅·본·팔다리 워프·머리 고정 조합을 사용하지 않았다.

sprite-gen 공식 배경 제거·컴포넌트 추출·리사이즈로 완성 프레임을 배치했다. 모든 방향에 같은 RGB 목록을 사용하고 회색 눈 명암이 뒤 갈색 귀/뒤꿈치의 얼룩으로 전용되지 않게 재질을 정리했다. 주황 털과 초코 갈색 재질의 기본색은 상태마다 변하지 않도록 공식 recolor로 고정했다. 이 기본색 정리는 주황/갈색 명암을 간결하게 만든 시안이며, 눈의 명암과 흰 눈빛은 별도 유지한다.

수동/결정적 조합 단계: 행동별 행 참고자료 조합, 프레임 원점 정렬, 명시적 시트/미리보기 조합, 눈 영역을 제외한 재질 마스크 등록. RGB 변환은 공식 recolor가 결정한다. 긴 전체 RGB 맵의 비효율을 피하기 위해 모든 고유 RGB를 한 번씩 담은 색상 스트립에 공식 nearest bake를 수행하고 그 결과만 원본 알파에 재전개했다(`pack-colors.py`, `expand-colors.py`). 전체 시트에 동일한 색상 함수를 적용하는 것과 같으며, 픽셀별 새 색을 임의 계산한 단계가 아니다.

## 검증과 범위

`export-verification.json`: 강아지 v9와 좌표·재생 구성 동일, 전체371색 목록 포함, 시트/개별 PNG 일치, 중립 공유,16고유 그림, 잘림 없음. `preview-verification.json`: VM에서10상태·364그리기 호출 검사. 팔레트 포함과 정적 자세 대조는 라이브 모션 연속성·시간적 명암 검수를 대신하지 않는다. 걷기는 experimental로 기록하며 실제 게임 이동·접촉 검수는 별도다.

현재 게임 붉은여우를 교체하지 않았다. 다른 동물도 변경하지 않았다.

재현: sprite-gen 전용 venv Python으로 `build.py` → `palette.py` → `pack-colors.py` → 공식 `recolor`로 `source-color-strip.png`/`recolor-nearest-spec.json`을 `baked-strip/`에 베이크 → `expand-colors.py` → `materials.py` → 공식 `recolor`로 chocolate/orange 패치와 spec을 각각 `baked-material/`·`baked-orange/`에 베이크 → `publish.py` → `verify.py`. Node로 `validate-preview.cjs`를 실행한다.
