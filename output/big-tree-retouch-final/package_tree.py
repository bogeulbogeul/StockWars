import pathlib,struct,json,io,hashlib,zipfile
import numpy as np
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent
def read(path):
    raw=path.read_bytes(); length=struct.unpack_from('<I',raw,12)[0]
    assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
    return json.loads(raw[20:20+length]),raw[28+length:]
def image(doc,binary):
    index=doc['textures'][doc['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
    view=doc['bufferViews'][doc['images'][index]['bufferView']]; offset=view.get('byteOffset',0)
    return np.array(Image.open(io.BytesIO(binary[offset:offset+view['byteLength']])).convert('RGB'))
source=pathlib.Path('C:/Users/bogeu/Downloads/BigTree.glb')
a,ab=read(source); b,bb=read(ROOT/'BigTree-retouched.glb')
assert bb[:len(ab)]==ab
for key in ['meshes','accessors','nodes','scenes','materials','textures','samplers']:
    assert a.get(key)==b.get(key),key
old=image(a,ab); new=image(b,bb)
intended=np.array(Image.open(ROOT/'BigTree-basecolor.png').convert('RGB'))
assert np.array_equal(new,intended) and not np.array_equal(old,new)
maximum=old.max(axis=2).astype(float); minimum=old.min(axis=2).astype(float)
blank=(np.rint((maximum-minimum)/np.maximum(maximum,1)*255)<75)&(maximum>180)&(old[:,:,2]>125)
after_max=new.max(axis=2).astype(float); after_min=new.min(axis=2).astype(float)
remaining=blank&(np.rint((after_max-after_min)/np.maximum(after_max,1)*255)<75)&(after_max>180)
assert not remaining.any(),'Missing-paint white pixels remain'
triangles=sum(a['accessors'][p['indices']]['count']//3 for m in a['meshes'] for p in m['primitives'])
report={'geometry_uv_materials_preserved':True,'original_binary_preserved':True,'triangles':triangles,'texture_resolution':list(new.shape[:2]),'embedded_texture_matches_png':True,'missing_paint_pixels_repaired':int(blank.sum()),'remaining_missing_paint_pixels':int(remaining.sum()),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2))
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>큰 나무 리터칭</title><style>body{font:16px system-ui;background:#f3f1ec;color:#26343b;margin:32px}main{max-width:1400px;margin:auto}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%;border-radius:12px}p{line-height:1.8}a{color:#285675}details img{max-width:900px}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><main><h1>큰 나무 · 미도색·색 번짐 보정</h1><p>줄기·뿌리의 흰색 미도색 부분을 주변 나무껍질 색으로 채우고 색 얼룩을 정돈했습니다. 잎과 줄기의 기존 색감·모델 형태·UV·재질 설정을 보존하고 색상 텍스처만 교체했습니다. 원본 보존 / 게임 미적용.</p><div class="pair"><div><h2>원본</h2><img src="BigTree-before.png"></div><div><h2>수정본</h2><img src="BigTree-after.png"></div></div><h2>뿌리 밑면</h2><div class="pair"><div><h3>원본</h3><img src="BigTree-underside-before.png"></div><div><h3>수정본</h3><img src="BigTree-underside-after.png"></div></div><details><summary>후면 확인</summary><img src="BigTree-rear.png"></details><p><a href="BigTree-retouched.glb">수정 GLB</a> · <a href="BigTree-basecolor.png">수정 텍스처</a></p></main></html>'''
(ROOT/'comparison.html').write_text(html,encoding='utf-8')
(ROOT/'작업내역.txt').write_text('''큰 나무 색상 텍스처 보정.
ImageGen 내장 이미지 편집 도구로 UV 텍스처의 흰색 미도색 줄기·뿌리 부분을 주변 갈색 나무껍질로 채웠습니다.
원본 UV에 정렬하고 정상 잎·줄기 경계를 보호해 적용했습니다.
모델·UV·재질·노멀·금속도/거칠기 데이터는 원본 그대로이며, 원래 GLB 바이너리를 보존하고 새 색상 PNG만 추가했습니다.
사용 프롬프트 요지: UV 위치·크기·방향·모든 잎과 나무껍질 디테일 유지. 왼쪽 아래와 가지의 흰색 미도색은 주변 따뜻한 갈색 수피로 채움. 기존 초록 잎·갈색 줄기 색감 유지, 새 가지·형태·노이즈·재배치 금지.
원본 Downloads/BigTree.glb 보존, 게임 미적용.
''',encoding='utf-8')
with zipfile.ZipFile(ROOT/'BigTree-retouched.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for filename in ['BigTree-retouched.glb','BigTree-basecolor.png','BigTree-before.png','BigTree-after.png','BigTree-rear.png','BigTree-underside-before.png','BigTree-underside-after.png','comparison.html','validation.json','작업내역.txt']:
        archive.write(ROOT/filename,filename)
print(json.dumps(report,indent=2))
