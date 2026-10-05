# 오크 문·창문 색감 시안

2026-10-05, 기본 제공 image_gen 도구로 생성 후 색감 편집.

- door-oak-v1.png: 오크 문틀, 크림 패널, 청록 손잡이.
- window-oak-v1.png: 오크 프레임, 옅은 청록 유리.
- 참고: ../basic-furniture-v2/wardrobe.png. 외형이 아닌 재질·색감 참고로 사용.
- 노란 기를 낮추고 베이지 오크·아이보리·청록 톤으로 조정. 현재 가구의 게임 표시 보정은 원본과 별도이므로 실제 표시 비교는 후속 검증 대상.
- 홈오피스 왼쪽 출입문과 오른쪽 벽 창문에 임시 적용했다. 문은 균일 배율 0.15와 외곽 클리핑으로 주변 광택을 제외한다. 창문은 균일 배율 0.14와 좌우 반전으로 오른쪽 벽 방향을 맞춘다. 기존 가구와 동일한 테마 표시 필터를 사용한다. 게임 화면에서 배치·크기를 확인했으며 생성 선의 정확한 각도는 최종 제작 검증 대상이다.

## 색감 편집 프롬프트 (문·창문 공통)

## 2026-10-05 크기·격자 보정

### 캐릭터 기준 현재 표시 크기

안나 기준 키 H=90(룸 SVG 단위)을 사용한다. 문 프레임의 수직 높이는 1.30H=117, 창문 프레임의 수직 높이는 0.70H=63으로 조정했다. 투명 여백과 기울어진 가로 모서리가 만드는 화면 바운딩 높이는 기준에서 제외한다. 문 하단 접지점과 창문 하단 설치 높이 76.4(벽 격자 2단)는 유지한다. 종횡비를 유지하는 균일 배율과 선택 박스·문 상호작용 안내 위치를 OfficeOpeningSizing.js에서 함께 계산한다. 이는 현재 홈오피스의 검증용 비율이며 모든 건물의 최종 규격은 아니다. 아래 80% 수치는 이전 변경 기록이다.

- 문: 기존 표시 크기의 80%, 균일 배율 0.1436170213. 하단 접지점을 유지하고 선택 외곽도 함께 축소.
- 창문: window-oak-v3.png(1448×1086). image_gen 편집으로 격자 방향의 프레임을 재제작. scratch/window-grid-guide.png는 정확한 19.1/33.75 기울기의 형상 참고, v2는 재질 참고로 전달했다. 런타임은 균일 배율 0.1298076923과 벽 방향에 따른 좌우 반전을 사용한다.
- 목표 각도: 29.50664658°. 세로틀은 수직, 상단·중앙·하단 프레임은 같은 벽 격자 방향. 생성 PNG에는 미세한 선 오차가 남을 수 있으며 수학적 일치를 확정하지 않는다. 게임 편집 화면에서 평행 방향과 표시 크기를 비교했다.
- 편집 프롬프트: Edit Image 1 geometry guide; preserve exact silhouette, pixel positions, proportions and angles. Image 2 is material reference only. Add beige oak highlights and muted teal glass reflections without moving frame edges. Keep verticals vertical and horizontal frame edges at slope 0.565925926. Transparent background, shallow bevel, no halo, no text.

Edit Image 1 only, Image 2 is palette/material reference ONLY (existing wardrobe furniture). Match its quieter muted beige light oak exactly: remove strong yellow/orange honey cast from wood, use desaturated sandy beige oak highlights and warm taupe brown shadows. Match cream panels to wardrobe ivory; muted dark teal hardware, window glass softly muted teal blue. Preserve Image 1 entire silhouette, dimensions, wall orientation, parallel frame lines, details and geometry. Clean readable game illustration. Actual transparent background outside object, remove all halo/glow/ambient haze, no wall or floor, no text. Orthographic interior grid target +/-29.50664658 degrees, preserve current geometry for this color-only edit.
