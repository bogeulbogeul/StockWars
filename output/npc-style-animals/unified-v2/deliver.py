import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
for animal, asset, module, symbol in (
    ('dog', 'dog-npc-v2', 'DogSpriteData', 'DOG_FRAMES'),
    ('cat', 'black-cat-npc-v2', 'CatSpriteData', 'CAT_FRAMES'),
):
    run = HERE / animal / 'run'
    manifest = json.loads((run / 'manifest.json').read_text(encoding='utf-8-sig'))
    target = ROOT / 'web/assets/characters' / asset
    backup = HERE / 'before-game' / asset
    if not backup.exists():
        shutil.copytree(target, backup)
    shutil.copy2(run / 'sprite-sheet-alpha.png', target / 'atlas.png')
    shutil.copy2(run / 'manifest.json', target / 'manifest.json')
    (ROOT / 'web/js/components' / (module + '.js')).write_text(
        f'export const {symbol} = ' + json.dumps(manifest['frame_layout'], separators=(',', ':')) + ';\n', encoding='utf-8')
    (run / 'qa-notes.md').write_text('''2026-10-16: Native GPT image edits, same approved front idle identity/palette and unified front walk reference for every row. No API or Grok route. Sprite-gen canonical extraction and assembly. Existing 3 walk poses and 4 carry poses preserved; runtime walk order 0,1,2,1 at160ms. Exact idle PNG copies of corresponding walk neutral frame1, renderer also resolves idle directly to walk neutral rectangle. All 6 stop transitions byte-identical; mirrored left uses same source. Face portrait retained as row10. Native row/contact review: unified fur, outline and cel shading, no props or extra limbs. Dog front tail-side and opposite arm swing corrected after QA. Walking remains the adopted three-pose motion; detailed foot sliding and furniture/cargo contact checks remain separate. Inspect has no errors; low-motion warnings only concern intentionally static one-frame idle/sit/portrait. Full-scale previews use original runtime timing and neutral return.\n''', encoding='utf-8')

for name in ('ART_STYLE_GUIDE.md', 'part_separation_guide_512.md', 'DOG_SPRITE_BASELINE.md'):
    path = ROOT / 'Docs' / name
    text = path.read_text(encoding='utf-8-sig').replace('portraits-v1', 'unified-v2')
    if name == 'DOG_SPRITE_BASELINE.md':
        text = text.replace('unified-v2은 motions-v2의 기존 모션과 고양이 사선 측면 보정을 유지한 초상화 추가본이다.', 'unified-v2은 얼굴 포함 기본형을 유지하면서 모든 모션·초상화의 선·털색·명암을 같은 정면 기준으로 보정한 최신본이다. 이전 portraits-v1은 비교 이력으로 보존한다.')
        text = text.replace('게임 모션은 기존 motions-v2 기반이며 초상화의 게임 UI 연결은 별도다.', '게임 모션은 unified-v2 시트에 연결하며 초상화의 게임 UI 연결은 별도다.')
        text = text.replace('[기존 모션 재생 비교 화면]', '[이전 모션 재생 비교 화면]').replace('[최신 구성 기록]', '[이전 구성 기록]').replace('[전체 색·그림체 보정 기록]', '[이전 색·그림체 보정 기록]')
        text = text.replace('고양이 최종 차콜 보정은', '이전 motions-v2 고양이 차콜 보정은')
    text += '\n### 모션 간 외형·색 통일 (2026-10-16)\n\n강아지·고양이 최신본은 `output/npc-style-animals/unified-v2/`다. 정면·사선·뒤 걷기, 운반, 두 앉기와 얼굴 초상화를 같은 종별 기준 색·선·명암으로 보정했다. 방향별 정지는 해당 걷기의 중립 `frame-1`과 동일 PNG를 사용하며 게임 렌더러도 같은 걷기 중립 좌표를 표시한다. 별도로 그린 정지 그림으로 전환하지 않는다. 신규 스타일도 정지↔걷기 전환에서 얼굴·털색·선·배율·원점이 바뀌지 않는지 검사한다. 기존3프레임·0→1→2→1·160ms, 운반4프레임, 사선 시점과 얼굴 포함10행 기본형은 유지한다. 이전 portraits-v1/motions-v2는 비교·제작 이력이다.\n'
    path.write_text(text, encoding='utf-8')

(HERE / 'README.md').write_text('''# 강아지·고양이 모션 외형 통일\n\n2026-10-16 최신 게임/캐릭터 시트 기준. 정면 기준으로 모든 방향·행동과 얼굴 초상화를 GPT로 행별 보정하고 sprite-gen으로 추출·조합했다. 방향별 정지는 걷기의 중립 프레임과 바이트 동일하며 렌더러도 해당 좌표를 직접 사용한다.\n\n걷기3자세, 재생0→1→2→1·160ms, 운반4자세, 오른쪽 사선 및 왼쪽 반전 유지. 셀320×400,4열10행,1280×4000 RGBA. 이전 시트는 portraits-v1, 이전 게임 원본은 before-game에 보존.\n\npreview.html에서 정지/이동, 방향, 행동 및 이전 시트 비교 가능. generation.json은 프롬프트·원본 경로 기록이며 raw에 작업 원본을 복사했다. 각 run의 transition-verification.json에서 정지/중립 일치 검증 결과를 확인한다. inspect 오류 없음; 정적1프레임 상태의 낮은 모션 경고는 예상 결과다. 실제 가구·화물 접촉과 발 미끄러짐의 세부 검수는 별도다.\n''', encoding='utf-8')
print('Delivered both atlases, frame data and three character guides.')
