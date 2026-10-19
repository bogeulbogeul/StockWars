"""Validate and package the pub without altering earlier models."""
import pathlib,json,struct,io,hashlib,zipfile
import numpy as np
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent
SOURCE=pathlib.Path('C:/Users/bogeu/Downloads/PubBuilding.glb')
TARGET=ROOT/'PubBuilding-retouched.glb'
def read(path):
    raw=path.read_bytes()
    assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
    size=struct.unpack_from('<I',raw,12)[0]
    return json.loads(raw[20:20+size]),raw[28+size:]
def triangles(doc):
    return sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives'])
def image(doc,binary):
    index=doc['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']
    im=doc['images'][doc['textures'][index]['source']]
    view=doc['bufferViews'][im['bufferView']]; offset=view.get('byteOffset',0)
    return np.array(Image.open(io.BytesIO(binary[offset:offset+view['byteLength']])).convert('RGB'))
a,ab=read(SOURCE); b,bb=read(TARGET)
old=image(a,ab); new=image(b,bb)
intended=np.array(Image.open(ROOT/'PubBuilding-basecolor.png').convert('RGB'))
assert triangles(a)==triangles(b)
assert len(b['materials'])==2
assert np.array_equal(new,intended)
assert not np.array_equal(old,new)
assert new.shape==old.shape==(2048,2048,3)
for view in b['bufferViews']:
    assert view.get('byteOffset',0)+view['byteLength']<=len(bb)
report={'triangles_preserved':triangles(b),'texture_size':[2048,2048],'embedded_texture_matches_png':True,'basecolor_changed':True,'original_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'output_sha256':hashlib.sha256(TARGET.read_bytes()).hexdigest()}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2))
(ROOT/'comparison.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>펍 건물 리터칭</title>
<style>body{font:16px system-ui;background:#f3f1ec;color:#26343b;margin:32px}main{max-width:1400px;margin:auto}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%;border-radius:12px}p{line-height:1.8}a{color:#285675}details img{max-width:900px}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><main>
<h1>펍 건물 · 텍스처와 유리 리터칭</h1><p>버건디 지붕·크림색 석재·나무 격자창·달과 맥주잔 간판을 유지하고 탁한 색 번짐을 보정했습니다. 창유리는 앞선 건물들과 같은 청회색 재질입니다. 원본 UV와 형태 보존 / 게임 미적용.</p>
<div class="pair"><div><h2>원본</h2><img src="PubBuilding-before.png"></div><div><h2>수정본</h2><img src="PubBuilding-after.png"></div></div>
<p><a href="PubBuilding-retouched.glb">수정 GLB</a> · <a href="PubBuilding-basecolor.png">수정 텍스처</a></p>
<details><summary>후면·반대 측면 확인</summary><img src="PubBuilding-rear.png"></details>
<p>2048×2048 텍스처, 원본 삼각형 수, 내장 텍스처와 PNG 일치 검증 통과.</p></main></html>''',encoding='utf-8')
(ROOT/'작업내역.txt').write_text('''펍 건물 텍스처·유리 보정.
원본 Downloads/PubBuilding.glb 보존. 게임 미적용.
ImageGen 내장 도구로 색 번짐 보정 후보 생성 후 원본 UV에 정밀 정렬.
원래 재질 경계와 간판 세부 선을 보호하고 색 보정만 적용.
버건디 지붕·크림색 벽·나무 격자창·달과 맥주잔 간판 유지, 청회색 창유리 적용.
프롬프트: 기존 packed UV atlas의 모든 섬 위치·경계·크기·방향을 유지하고,
지붕·석재·목재의 탁한 색 번짐을 국소 수정한다. 원래 팔레트·명암·기와선·
줄눈·창틀·간판·손잡이를 보존한다. 새 균열·입자·건물 렌더·재배치 금지.
GLB 구조·삼각형 수·2048x2048 내장 텍스처 일치 검증 완료.
''',encoding='utf-8')
with zipfile.ZipFile(ROOT/'PubBuilding-retouched.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for filename in ['PubBuilding-retouched.glb','PubBuilding-basecolor.png','PubBuilding-before.png','PubBuilding-after.png','PubBuilding-rear.png','comparison.html','validation.json','작업내역.txt']:
        archive.write(ROOT/filename,filename)
print(json.dumps(report,indent=2))
