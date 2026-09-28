# 손발 위치 참고 시안 v3

내장 image_gen 사용. 사용자 첨부 ae00ee63 이미지는 손발 위치만 참고하며 화풍·얼굴·색상·비율을 따라가지 않는다. 기존 회색 마네킹 외형 유지.

결과: mannequin-walk-pose-reference-v3.png

검수: 미채택 시안. 왼쪽 행의 3번째 자세에서 머리 방향이 바뀌고, 오른쪽 행의 팔 교대가 충분히 구현되지 않음. 최종 게임 에셋 및 웹 교체 대상으로 사용하지 않음.

## 생성 프롬프트

```text
Use case: precise-object-edit. Create revised gray mannequin movement study v3.
INPUT ROLES STRICT:
Image1 peach human sheet = JOINT POSITIONS / WALK POSES ONLY. Do NOT copy its art style, colors, head proportions, face, anatomy shading, interface or background.
Image2 gray mannequin sheet = CHARACTER IDENTITY and pixel proportions. Keep gray blank head, no hair/face/clothing. Its limb choreography is faulty, replace poses rather than copying them.
Image3 = supporting StockWars cozy SD pixel rendering reference, not costume.
Output 3 columns x4 rows, 12 full mannequin sprites, transparent background, no labels/borders. Layout/pose order matches Image1: front, left-facing, right-facing, back rows; columns step A / neutral / opposite step B. Reinterpret Image1 limb joint positions onto Image2 gray mannequin. Neutral middle is both feet under hips, arms relaxed. Left/right contact poses in columns1 and3 must have DIFFERENT anatomical legs in front. Use the clear opposing arm swings in reference1.
CRITICAL anatomically natural counter-swing: camera-near arm and leg both pale gray and camera-far arm and leg darker gray. In right-facing row column1, pale foot toward RIGHT but pale hand toward LEFT. Column3 pale foot toward LEFT but pale hand toward RIGHT. Dark limbs are opposite pale limbs. In left-facing row column1 pale foot LEFT, pale hand RIGHT; column3 pale foot RIGHT, pale hand LEFT. Arms attach at shoulders, not chest. Two arms/two legs only. Do not use same-side arm and leg forward together. Do not duplicate contact poses. Treat shoulder/elbow/wrist/hip/knee/ankle positions from reference1 as the movement guide. Keep mannequin head same per direction and foot baseline/cell center stable.
Style retained: cozy SD crisp pixel art, slightly elevated three-quarter top-down RPG character view, readable torso, original mannequin proportions, dark muted charcoal-purple one-source-pixel outline, three flat gray tones, hard pixel clusters, upper-left stepped highlights. No gradients, blur, haze, antialias halo, airbrush, glossy 3D, dithering, text or watermark. Full sprites centered in identical cells with transparent margins. This is pose study, not final resolution specification.
```

