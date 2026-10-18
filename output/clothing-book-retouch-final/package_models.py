import pathlib,json,struct,io,hashlib,zipfile
import numpy as np
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent
NAMES=['ClothingStore','BookStoreBuilding']
def read(path):
    raw=path.read_bytes(); assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
    size=struct.unpack_from('<I',raw,12)[0]; return json.loads(raw[20:20+size]),raw[28+size:]
def triangles(doc):
    return sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives'])
def pixels(doc,binary):
    index=doc['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']
    im=doc['images'][doc['textures'][index]['source']]; view=doc['bufferViews'][im['bufferView']]; offset=view.get('byteOffset',0)
    return np.array(Image.open(io.BytesIO(binary[offset:offset+view['byteLength']])).convert('RGB'))
reports=[]
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>옷가게·서점 리터칭</title><style>body{font:16px system-ui;background:#f3f1ec;color:#26343b;margin:32px}main{max-width:1400px;margin:auto}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%;border-radius:12px}p{line-height:1.8}a{color:#285675}details img{max-width:900px}section{margin:40px 0}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><main><h1>옷가게·서점 리터칭</h1><p>원래 지붕·차양·간판·책 장식·화단을 보존하고 색 번짐을 보정했습니다. 창유리는 기존 창틀 경계를 유지하며 부드러운 광택으로 정돈했습니다. 원본 보존 / 게임 미적용.</p>'''
for name,label in zip(NAMES,['옷가게','서점']):
    source=pathlib.Path('C:/Users/bogeu/Downloads')/(name+'.glb'); a,ab=read(source); b,bb=read(ROOT/(name+'-retouched.glb'))
    old=pixels(a,ab); new=pixels(b,bb); intended=np.array(Image.open(ROOT/(name+'-basecolor.png')).convert('RGB'))
    assert triangles(a)==triangles(b) and len(b['materials'])==2
    assert np.array_equal(new,intended) and not np.array_equal(old,new)
    assert new.shape==old.shape==(2048,2048,3)
    for view in b['bufferViews']: assert view.get('byteOffset',0)+view['byteLength']<=len(bb)
    reports.append({'model':name,'triangles_preserved':triangles(b),'embedded_texture_matches_png':True,'texture_resolution':[2048,2048],'basecolor_changed':True,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
    html+=f'<section><h2>{label} · {name}</h2><div class="pair"><div><h3>원본</h3><img src="{name}-before.png"></div><div><h3>수정본</h3><img src="{name}-after.png"></div></div><p><a href="{name}-retouched.glb">수정 GLB</a> · <a href="{name}-basecolor.png">수정 텍스처</a></p><details><summary>후면·반대 측면 확인</summary><img src="{name}-rear.png"></details></section>'
(ROOT/'comparison.html').write_text(html+'</main></html>',encoding='utf-8')
(ROOT/'validation.json').write_text(json.dumps(reports,indent=2))
(ROOT/'작업내역.txt').write_text('''옷가게·서점 색 번짐·유리 재질 보정.
ImageGen 내장 도구로 UV 텍스처 보정 후보를 만든 뒤 원래 UV에 정렬하고,
기존 경계·간판·화단의 꽃·책 장식을 보호해 국소 색 보정만 적용했습니다.
프롬프트: 섬 위치·경계·크기·방향·원래 팔레트·명암 유지, 탁한 색 번짐만 정리.
옷가게 청록 지붕/분홍 차양/옷걸이 간판, 서점 자주색 지붕/책 간판/금띠 책등 보존.
흰 꽃은 의도된 장식으로 유지. 새 균열·디테일·노이즈·재배치 금지.
원본 GLB와 게임 파일은 수정하지 않았습니다.
삼각형 수·2048x2048 내장 텍스처 픽셀 일치·GLB 버퍼 범위 검증 완료.
''',encoding='utf-8')
with zipfile.ZipFile(ROOT/'ClothingStore-BookStore-retouched.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in NAMES:
        for suffix in ['-retouched.glb','-basecolor.png','-before.png','-after.png','-rear.png']:
            archive.write(ROOT/(name+suffix),name+suffix)
    for filename in ['comparison.html','validation.json','작업내역.txt']: archive.write(ROOT/filename,filename)
print(json.dumps(reports,indent=2))
