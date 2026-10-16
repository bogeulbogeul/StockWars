# 얼굴 전용 초상화·공통 RGB 팔레트 v3

현재 강아지 시트의 10상태·19논리 프레임 전체가 대상이다. 다른 동물 에셋과 게임 적용본은 변경하지 않았다.

초상화는 내장 image_gen으로 목·가슴 털을 제거하고 얼굴·양 귀만 남겼다. 투명 출력의 연결 성분을 sprite-gen으로 추출하고, 비율을 유지해 320px 칸에서 폭304px로 배치했다. `face-icon.png`는 얼굴 경계에 맞춘 별도 투명 아이콘이다. 원본과 프롬프트는 `generation.json`, `face-native.png`다.

색은 새 이미지를 생성하는 방식 대신 sprite-gen의 결정적 `recolor`로 실제 PNG에 베이크했다. 기준은 이전 강아지 정면 중립의 RGB다. 몸 전체256색과 눈48색 후보의 중복을 합쳐 공통279색을 추출했고, 모든 비투명 픽셀을 동일한 최근접 RGB 규칙으로 변환했다. 디더링은 하지 않고 알파는 보존했다. 낮은 색 수75색 검토본은 눈·명암의 거친 표현으로 최종 미채택이다.

`palette.json`, `palette.csv`에 정확한 RGB 값을 보관한다. `recolor-nearest-spec.json`은 원본 팔레트 색을 자기 자신에 대응시키고 tolerance255로 모든 입력을 공통 팔레트의 최근접 색으로 정규화하는 명세다. `recolor-spec.json`은 동일 결정을 원본 RGB별로 풀어 쓴 명세다. 최종 베이크 기록은 `baked-final/recolor.report.json`이다. 초기 exact 방식의 큰 명세 검토 출력은 `baked/`에 남을 수 있으나 최종 입력으로 사용하지 않는다.

모든19논리 항목에서 공통 RGB 목록 밖의 비투명 픽셀0개와 베이크 전후 알파 일치를 확인한다. 초상화 외 동작·팔다리·좌표·3자세·160ms는 유지한다. 공통 팔레트 사용은 동일 재질의 명암 면적·색 분포까지 매 순간 같다는 뜻은 아니며 재생 중 명암 변화 검수는 별도다. 게임에 미반영된 시안이다.

재조합: `prepare.py` → `palette.py` → sprite-gen recolor(`baked-final/`) → `publish.py`. `build.py`는 조합 함수 제공용이며 단독 실행하지 않는다. 이전 자세 원본과 수정 이력은 `../dog-motion-rebuild-v1/`, `../dog-neutral-fix-v2/`를 따른다.
