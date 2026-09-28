# 좌우 걷기 재생성 v2

- 내장 image_gen 사용.
- 결과: mannequin-walk-sides-v2.png
- 위: 왼쪽 / 아래: 오른쪽, 각 4프레임. 검증 후보이며 최종 게임 에셋 아님.
- 검수: 1·3프레임 다리 앞뒤 교대는 구분됨. 오른쪽 행은 가까운 팔과 다리가 같은 방향으로 나가는 문제가 남아 반대 위상 보정 필요. 머리 방향 표현과 픽셀 가장자리도 추가 검수 필요. 기존 웹 시트는 교체하지 않음.
- 첫 4방향 재생성은 반복 자세가 남아 미채택.

## 최종 생성 프롬프트

```text
Create a NEW animation sprite sheet, not a repetition of an old sprite sheet. Reference 1 defines the gray faceless mannequin identity. Reference 2 defines crisp cozy SD pixel-art style only. Gray bald mannequin without face, hair or clothes, same proportions as reference1. Transparent background. Exactly 8 full body sprites in TWO ROWS and FOUR COLUMNS, equal square cells, 2:1 sheet. TOP ROW faces LEFT in every cell; BOTTOM ROW faces RIGHT in every cell. Three-quarter top-down RPG slight view from above, stable head and torso centered per cell.
This is an anatomy-tested alternating WALK CYCLE. Assign near limbs pale gray and far limbs charcoal gray. These shades are fixed limb identities, NOT lighting that changes frame to frame.
For RIGHT facing bottom row:
column1: PALE LEG extends to screen RIGHT, DARK LEG extends to screen LEFT. PALE ARM extends LEFT, DARK ARM extends RIGHT.
column2: pale leg supports body vertically; dark knee bends and passes forward. Pale hand under shoulder.
column3: PALE LEG extends to screen LEFT, DARK LEG extends to screen RIGHT. PALE ARM extends RIGHT, DARK ARM extends LEFT. The pale leg must visibly slope down LEFT from hip! Pale hand must be on RIGHT of torso! This is opposite to column1.
column4: dark leg supports vertically, pale knee bends and passes forward. Pale arm swinging back.
For LEFT facing top row, reverse screen left and screen right in the above directions. In top row column3 PALE LEG extends screen RIGHT and PALE ARM extends screen LEFT.
Do not duplicate columns1 and3 or columns2 and4. Show both feet and hands in the contact poses; near pale limbs in front of darker limbs when overlapping. Shoulder counter-swing opposite same-side hip. Walk not run, no airborne pose.
Use restrained three-tone flat pixel shading and one source pixel dark charcoal-purple outlines, consistent pixel grid, stepped upper-left highlights, no gradient, no blurry glow, no antialias fringe, no glossy 3D, no dithering. Keep face blank per mannequin request. No labels, no borders, no grid, no objects. Uniform size and baseline, no auto crop per frame. Prioritize alternating pale/dark limb positions above everything else.
```

