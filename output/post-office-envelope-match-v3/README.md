# 우체통 봉투 문양 통일 v3

P2 · ✅ 네이티브 봉투 통일 / ⏳ 사용자 시각 검수·게임 적용

집 앞 우체통 최신 `home-envelope-correct-v7/Home-correct-envelope.blend`의 봉투 몸체·삼각 덮개·연속 V 접힘·연결된 아래 접힘선 메시/곡선과 재질을 우체국 수집함에 그대로 재사용했다. 기존 우체국 봉투 폭에 맞춰 전체를 2.625배 균일 확대해 비율/접힘/선 두께 관계가 집 앞 우체통과 같다.

원본은 `post-office-roof-v2/PostOffice-pitched-roof.blend`이며 봉투 이외 205개 메시 정점 해시를 유지했다. 건물 봉투 간판·우편함 몸체/위치·집 에셋은 변경하지 않았다. `verify.py`는 두 blend의 봉투 5부품 원본 좌표 해시 일치와 GLB 재로딩·기존 간판/지붕 유지·유한 좌표를 검사한다.

수정본: `PostOffice.glb`, `PostOffice-shared-envelope.blend`. 전체/우체통/봉투 확대는 실제 모델 렌더다. 웹/기존 실행본은 교체하지 않았다.
