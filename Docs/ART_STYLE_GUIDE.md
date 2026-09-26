# 🎨 StockWars 에셋 제작 마스터 아트 스타일 가이드 (ART_STYLE_GUIDE.md)
> **최종 개정:** 2026-09-26  
> **적용 대상:** StockWars 프로젝트 내 모든 생성형 AI 에셋 (DALL-E 3 / GPT-4o / Midjourney 등)

본 문서는 StockWars의 모든 시각적 에셋(배경, 날씨, 오브젝트, UI, NPC, 아이템 등)이 **단일한 통일감과 감성을 유지**하도록 규정한 **아트 스타일 표준서**입니다. AI 프롬프트 작성 시 본 가이드의 키워드 및 네거티브 규칙을 필수 준수합니다.

---

## 🌟 1. 핵심 비주얼 아이덴티티 (Core Visual Identity)

* **테마/장르:** **깔끔하고 따뜻한 2D 캐주얼/인디 게임 그래픽 (Clean 2D Casual Game Art)**
* **질감(Texture):** **깨끗한 디지털 2D 벡터 & 부드러운 셀 셰이딩 (Clean Digital Vector / Soft Cel-shaded, No blotchy canvas/paper noise)**
* **형태(Shape):** 깔끔하고 선명한 2D 게임 에셋 실루엣 (Crisp outlines, smooth clean gradients)
* **색채(Palette):** 화사하고 따뜻한 2D 게임 컬러 (Clean Sky Blue, Warm Pastel Peach/Cream, Honey Yellow)

---

## 🚫 2. 절대 금지 요소 (Banned & Negative Attributes)

| ❌ 절대 금지 (Banned) | 💡 대체 지향점 (Recommended) |
| :--- | :--- |
| **지저분한 수채화 종이/스펀지 노이즈 (Blotchy watercolor paper noise)** | **매끈하고 깔끔한 디지털 2D 그라디언트 (Smooth clean 2D digital gradient)** |
| **플라스틱/유리구슬 반사광 (Glossy 3D reflections)** | **깔끔한 2D 평면 셀 셰이딩 (Clean flat/cel 2D sprite)** |
| **3D 구체/입체 CGI 셰이딩 (3D sphere/CGI shading)** | **선명하고 직관적인 2D 게임 스프라이트 (Crisp 2D vector game sprite)** |
| **날카로운 기하학적 메탈 광선 (Sharp metallic spikes)** | **귀엽고 둥근 2D 게임 실루엣 (Cute rounded 2D game silhouettes)** |

---

## 🧩 3. 마스터 프롬프트 뼈대 (Master Prompt Blueprint)

모든 프롬프트는 아래 5단 구조를 기본으로 조립합니다.

```text
[1. 대상 및 용도] 2D game sprite asset of [Subject], isolated on a pure solid white background.
[2. 마스터 화풍] Warm cozy 2D indie game art, soft hand-drawn storybook gouache style, matte painterly finish.
[3. 색감 및 형태] [Color palette: honey-yellow, peach, cream, soft pastel], rounded friendly organic shapes.
[4. 분위기] Wholesome, peaceful, and healing game aesthetic, soft warm ambient lighting.
[5. 필수 네거티브] NO glossy reflections, NO plastic shine, NO 3D CGI sphere effects, NO harsh metallic spikes, NO text, NO watermark.
```

---

## 📂 4. 카테고리별 제작 규격 & 예시

### 1) 하늘 및 날씨 에셋 (Sky & Weather)
* **공통 규칙:** 부드러운 대기감, 자극적이지 않은 자연스러운 톤
* **하늘 배경:** 16:9 파노라마, 아무 오브젝트 없는 부드러운 세룰리안 블루 → 피치 크림 그라디언트
* **태양:** 둥근 꽃잎/과슈 붓터치 형태의 웜 허니 옐로우 태양
* **구름:** 솜사탕/마시멜로 질감의 몽글몽글한 구름 팩 (먹구름은 차분한 슬레이트 그레이 톤)

### 2) 마을/오피스 환경 및 가구 소품 (Props & Furniture)
* **공통 규칙:** 정면(Front) 또는 약한 쿼터뷰(Slight isometric/front), 따뜻한 원목/패브릭 질감
* **키워드:** `cozy wooden furniture, warm fabric texture, gentle hand-painted gouache, soft shadows, cute stylized props`

### 3) NPC & 캐릭터 포트레이트 (Characters & NPCs)
* **공통 규칙:** 2.5등신 치비(SD) 또는 부드러운 동화책 삽화 스타일, 따스한 표정
* **키워드:** `charming chibi character, cozy indie game portrait, soft warm pastel clothing, friendly gentle expression, storybook illustration`

### 4) 아이템 & UI 아이콘 (Items & Icons)
* **공통 규칙:** 외곽선이 깔끔하여 64x64~128x128 리사이징 시에도 시인성이 확보되는 디자인
* **키워드:** `cute stylized 2D item icon, clean readable silhouette, matte gouache coloring, charming cozy game asset`

---

## 📋 5. 프롬프트 작성 전 점검 체크리스트
- [ ] `isolated on a pure solid white background`가 포함되어 누끼 작업이 용이한가?
- [ ] `storybook gouache style, matte texture`가 명시되어 3D 플라스틱 광택이 차단되었는가?
- [ ] 색감이 `Warm pastel / earthy tones`로 지정되어 있는가?
- [ ] 네거티브 키워드(`NO plastic shine, NO 3D sphere reflections, NO text`)가 누락되지 않았는가?
