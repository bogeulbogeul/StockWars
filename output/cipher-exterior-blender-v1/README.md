# 사이퍼 증권 외관 · Blender 디자인 v1

파란 곡면 지붕, 아이보리 벽과 몰딩, 아치 양문과 두 개의 정면 창문,
원형 시계와 주가 상승 문양으로 구성한 실제 3D 외관 시안입니다.

- `CipherSecurities-exterior.blend`: 수정 가능한 원본. 스튜디오 조명·배경 제외.
- `CipherSecurities-exterior.glb`: 재질 포함 모델. 양문 힌지 보존.
- `front.png`, `front-right.png`, `rear.png`: 정면·앞 오른쪽·후면 렌더.
- `manifest.json`, `validation.json`: 구성 및 GLB 재불러오기 검증 기록.
- `build-cipher-exterior.py`, `exterior_geometry.py`: Blender 제작 스크립트.

외관 전용이며 내부 공간은 포함하지 않습니다. 측면과 후면에는 창문이 없습니다.
시곗바늘은 별도 오브젝트이지만 시간 갱신 코드는 연결하지 않았습니다.
게임에는 적용하지 않았으며 기존 건물 파일은 보존했습니다.
게임 크기·충돌·출입 연동 및 최종 아트 채택은 후속 작업입니다.

Blender 원본은 Z-up, 정면 -Y입니다. GLB는 glTF 표준 Y-up으로 내보냅니다.
제작 스크립트는 StockWars 프로젝트의 채택 양문 GLB를 참조합니다.
