# 가슴털 단색·사선 앉기 눈썹 정리 v17

v16의 가슴털 내부에는 여러 명암뿐 아니라 잘못 분류된 눈썹 밝기의 색 조각이 남아 있었다. 사용자 지적에 따라 해당 밝은 조각까지 포함해 기존 털깃 내부를 하나의 색으로 정리했다.

- 가슴털은 기존 털 경계 픽셀 사이의 내부를 채워 RGB(73,66,70) 한 색으로 베이크. 직사각형 전체를 칠하지 않는다. 정면·옆·운반·앉기의 보이는 가슴털에 적용한다. 뒤와 초상화는 변경하지 않는다.
- 사선 앉기 눈썹은 작은 끊김을 연결하고1px 확장, 다른 모션의 RGB(92,81,85)와 동일하게 베이크했다.
- canonical sprite-gen recolor의 exact RGB 베이크 사용. alpha·좌표·재생·몸 자세 유지, 수정 재질 마스크 밖 RGBA 동일 검사 통과. 가슴털 내부1색 확인.
- v16의 자연스러운 얼굴·전체 프레임의 작은 걷기 움직임·수정된 정면 앉기 유지. 게임에는 설치하지 않았다.

sprite-sheet-alpha.png, manifest.json과 frames/가 전달본이다. preview.html은 비교 재생, detail-before-after.png는 위 가슴털/아래 눈썹, 왼쪽 이전/오른쪽 수정 확대 비교다. clean_materials.py, *.spec.json, baked/*report.json, validation.json에 처리와 검증을 기록한다.
