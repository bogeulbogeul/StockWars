import pathlib, json, struct, hashlib, zipfile, shutil, io
import numpy as np
from PIL import Image
WORK=pathlib.Path(__file__).resolve().parent
PREVIOUS=WORK.parent/'building-retouch-v1'
FINAL=WORK.parent/'building-retouch-final'; FINAL.mkdir(exist_ok=True)
NAMES=['FinanceBuilding','FunitueStoreBuilding','StoreBuilding','InformationBuilding','HomeBuilding']
LABELS=['사이퍼 증권','가구점','잡화점','정착 안내소','집']
def read(path):
    data=path.read_bytes()
    assert data[:4]==b'glTF' and struct.unpack_from('<I',data,8)[0]==len(data)
    length=struct.unpack_from('<I',data,12)[0]
    return json.loads(data[20:20+length]),data[28+length:]
def triangle_count(doc):
    return sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives'])
def base_image(doc,binary):
    index=doc['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']
    image=doc['images'][doc['textures'][index]['source']]
    view=doc['bufferViews'][image['bufferView']]; offset=view.get('byteOffset',0)
    return np.array(Image.open(io.BytesIO(binary[offset:offset+view['byteLength']])).convert('RGB'))
results=[]
for name in NAMES:
    source=pathlib.Path('C:/Users/bogeu/Downloads')/(name+'.glb')
    a,original_bin=read(source); b,updated_bin=read(WORK/(name+'-retouched.glb'))
    original=base_image(a,original_bin); updated=base_image(b,updated_bin)
    intended=np.array(Image.open(WORK/(name+'-basecolor.png')).convert('RGB'))
    assert triangle_count(a)==triangle_count(b)
    assert len(b['materials'])==2
    assert np.array_equal(updated,intended),'Exported texture differs from final PNG'
    assert not np.array_equal(original,updated),'Original texture was not changed'
    assert updated.shape==original.shape==(2048,2048,3)
    for view in b['bufferViews']:
        assert view.get('byteOffset',0)+view['byteLength']<=len(updated_bin)
    results.append({'model':name,'triangles_preserved':triangle_count(b),'texture_resolution':[2048,2048],'embedded_texture_matches_png':True,'basecolor_changed':True,'sha256':hashlib.sha256((WORK/(name+'-retouched.glb')).read_bytes()).hexdigest()})
    for suffix in ['-retouched.glb','-after.png','-rear.png','-basecolor.png']:
        shutil.copy2(WORK/(name+suffix),FINAL/(name+suffix))
    shutil.copy2(PREVIOUS/(name+'-before.png'),FINAL/(name+'-before.png'))
    shutil.copy2(PREVIOUS/(name+'-after.png'),FINAL/(name+'-material-v1.png'))
(FINAL/'validation.json').write_text(json.dumps(results,indent=2))
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>건물 텍스처 리터칭 최종 비교</title>
<style>body{font:16px system-ui;background:#f3f1ec;color:#26343b;margin:32px}main{max-width:1400px;margin:auto}section{margin:40px 0}h1{margin-bottom:8px}p{line-height:1.7}select{font:inherit;padding:6px 12px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%;border-radius:12px}a{color:#285675}span{display:block;margin-bottom:8px}details{margin-top:12px}details img{max-width:700px}@media(max-width:700px){body{margin:16px}.pair{grid-template-columns:1fr}}</style><main>
<h1>건물 텍스처 리터칭 · 최종 5종</h1><p>건물별 원래 색과 형태를 유지하면서 표면의 탁한 색 번짐을 보정했습니다. 청회색 유리는 1차 수정본 기준을 유지했습니다. 텍스처는 2048×2048이며 UV 경계·간판·시계의 세부 선을 보호했습니다. 원본 보존 / 게임 미적용.</p>
<label>왼쪽 비교 대상 <select id="baseline"><option value="before">원본</option><option value="material-v1">1차 재질 수정본</option></select></label>'''
for name,label in zip(NAMES,LABELS):
    html+=f'<section><h2>{label} · {name}</h2><div class="pair"><div><span class="baseline-label">원본</span><img class="baseline" data-name="{name}" src="{name}-before.png"></div><div><span>최종 텍스처·유리 수정본</span><img src="{name}-after.png"></div></div><p><a href="{name}-retouched.glb">GLB</a> · <a href="{name}-basecolor.png">수정 텍스처</a></p><details><summary>후면·반대 측면 확인</summary><img src="{name}-rear.png"></details></section>'
html+='''<p>GLB 구조·삼각형 수·내장 텍스처 일치 검사 통과. 세부 검증은 validation.json에 기록했습니다.</p></main><script>document.getElementById('baseline').onchange=e=>{document.querySelectorAll('.baseline').forEach(img=>img.src=img.dataset.name+'-'+e.target.value+'.png');document.querySelectorAll('.baseline-label').forEach(s=>s.textContent=e.target.value==='before'?'원본':'1차 재질 수정본')};</script></html>'''
(FINAL/'comparison.html').write_text(html,encoding='utf-8')
(FINAL/'작업내역.txt').write_text('''5개 건물 텍스처·유리 리터칭

원본 GLB는 수정하지 않았습니다. 게임 파일에도 적용하지 않았습니다.
ImageGen 내장 도구로 건물별 색 번짐 보정 후보를 생성한 뒤,
원본 UV에 정렬하고 원래 경계와 디테일을 보호해 색 보정만 반영했습니다.
과도한 새 균열·입자·디테일은 반영하지 않고 원래 명암을 유지했습니다.
유리는 1차 수정본의 차분한 청회색 재질을 유지했습니다.

사용 프롬프트 요지(5종 각각):
기존 packed UV base-color atlas의 섬 위치·크기·방향·재질 경계를 유지하고,
지붕·석재·목재의 얼룩진 색 번짐과 탁한 줄무늬를 국소 보정한다.
원래 팔레트·완만한 명암·기와선·석재 줄눈·창틀·간판을 보존한다.
건물 렌더, 새 디테일, UV 재배치, 재디자인을 만들지 않는다.

검증: 2048x2048 텍스처, 원본과 같은 삼각형 수,
GLB 내부 텍스처와 전달 PNG의 픽셀 일치, 버퍼 범위 검사.
정면·측면·후면 비교 렌더 포함.
''',encoding='utf-8')
archive_path=FINAL.parent/'building-retouch-final.zip'
with zipfile.ZipFile(archive_path,'w',zipfile.ZIP_DEFLATED) as archive:
    for path in FINAL.iterdir(): archive.write(path,path.name)
print(json.dumps({'validation':results,'zip':str(archive_path),'zip_bytes':archive_path.stat().st_size},indent=2))
