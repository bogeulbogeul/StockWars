# 침대 홈오피스 격자 수정

2026-10-05 · 내장 image_gen 사용. 기존 목재·침구 색감 유지, 홈오피스 축 ±29.50664658°를 제작 목표로 재제작. 최종 화풍 확정 아님.

참고: desk.png는 재질·색상, BasicRoom.png는 시점 참고. 기존 침대 수정 1차는 긴 프레임이 여전히 가팔라 채택하지 않고 새 제작본을 게임에 적용했다.

## 채택한 생성 프롬프트

Create a NEW single-bed game asset, transparent background. Image 1 only MATERIAL/COLOR reference light oak, cream and teal outlines. Image 2 only ORTHOGRAPHIC CAMERA reference. Do not copy desk or room. A simple oak single bed with cream mattress and pillow, teal blanket and simple low wooden headboard. Strict classic 30-degree isometric view (precise target 29.5066466 degrees). Crucial both front footboard AND long side rails must have the SAME slope magnitude tan(29.5066466)=0.5659259, with one down-right and one down-left. NO steep 40-degree side. Layout sketch geometry for mattress top: A(460,220), B(1060,560), C(660,786.37), D(60,446.37). A-B-C-D is an exact orthographic 3:2 rectangular bed, length A-B down-right, width B-C down-left. All frame rails follow those edges with parallel top/bottom. Vertical legs and headboard supports extend straight downward/upward respectively. Pillow at A-D head end. Use this flat wide diamond mattress shape. Keep all wood same neutral light oak #C69A68 highlights #DDB888 shadows #A5784D. No perspective, no surrounding glow/shadows, no grid/floor, no text, no extras, no characters. Target occupancy 3 cells along length down-right and 2 along width down-left, front foot bottom contact anchor, interaction along long side outside footprint. Clean illustrated game sprite matching reference material, entire object with margins. Do not use the perspective of earlier bed illustrations.
