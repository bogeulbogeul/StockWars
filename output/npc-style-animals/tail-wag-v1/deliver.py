import json
import shutil
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
run = HERE / 'dog/run'
target = ROOT / 'web/assets/characters/dog-npc-v2'
backup = HERE / 'before-game'
if not backup.exists():
    shutil.copytree(target, backup)
manifest = json.loads((run / 'manifest.json').read_text(encoding='utf-8-sig'))
shutil.copy2(run / 'sprite-sheet-alpha.png', target / 'atlas.png')
shutil.copy2(run / 'manifest.json', target / 'manifest.json')
(ROOT / 'web/js/components/DogSpriteData.js').write_text('export const DOG_FRAMES = ' + json.dumps(manifest['frame_layout'], separators=(',', ':')) + ';\n', encoding='utf-8')
notes = '''2026-10-16: Dog held-body tail animation. Native GPT image edits for 6 held poses, canonical sprite-gen extraction, deterministic fixed mask assembly locking original head/body/limb pixels outside tail region. No bones, rigging, deformation or runtime tail layers. Original 19 complete frames byte-identical. Animated tail states use neutral/outward/neutral/inward at160ms; neutral uses original approved artwork. Existing 3 walking poses and4 carry poses unchanged. Runtime holds body while wagging for front/right/back/mirrored-left idle, front/right seated and right held cargo. Cat unchanged. Native outputs and extraction originals retained. Face portrait remains last atlas row.\n'''
(run / 'qa-notes.md').write_text(notes, encoding='utf-8')
(HERE / 'README.md').write_text('# 강아지 꼬리 대기 애니메이션\n\n' + notes + '\n미리보기: ../unified-v2/preview.html. 게임 시트에 반영. 기존 unified-v2는 원본 기준으로 보존. 강아지 추가6상태×3그림, 전체10행28고유그림,1280×4000 RGBA. 정적 기본형과 걷기3프레임은 유지한다.\n', encoding='utf-8')
for name in ('ART_STYLE_GUIDE.md', 'part_separation_guide_512.md', 'DOG_SPRITE_BASELINE.md'):
    p = ROOT / 'Docs' / name
    text = p.read_text(encoding='utf-8-sig')
    marker = '### 강아지 꼬리 상시 움직임 (2026-10-16)'
    if marker not in text:
        text += '\n' + marker + '\n\n사용자 요청으로 강아지는 정지·앉기·화물을 들고 멈춘 상태에도 꼬리를 반복해서 흔든다. 추가6상태는 완성 프레임으로 제작하며 리깅·본·런타임 꼬리 파츠 합성을 사용하지 않는다. 머리·몸·팔다리는 기존 승인본으로 고정하고 꼬리 영역만 생성 프레임에서 조합한다. 중립은 기존 원본을 사용한다. 최신 게임 강아지 전달본은 `output/npc-style-animals/tail-wag-v1/dog/run/`이며10행28고유그림(1280×4000), 얼굴 초상화는 마지막 행이다. 걷기3프레임·160ms·0→1→2→1과 기존 운반4프레임은 변경하지 않는다. 고양이는 unified-v2를 유지한다. 꼬리 대기는 중립→안쪽→중립→바깥쪽을160ms 간격으로 재생한다. 중복 중립9그림을 제거하고 대기6상태를 기존 빈 칸에 배치하여 물리적10행을 유지한다. 상태별 좌표는 manifest.frame_layout을 사용하며 한 상태가 한 행을 독점한다고 가정하지 않는다.\n'
    p.write_text(text, encoding='utf-8')
print('Dog tail atlas delivered; cat unchanged.')
