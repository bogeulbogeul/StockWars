import pathlib, json, struct, hashlib, zipfile
ROOT=pathlib.Path(__file__).parent
names=['FinanceBuilding','FunitueStoreBuilding','StoreBuilding','InformationBuilding','HomeBuilding']
def read(path):
    data=path.read_bytes()
    assert data[:4]==b'glTF' and struct.unpack_from('<I',data,8)[0]==len(data)
    return json.loads(data[20:20+struct.unpack_from('<I',data,12)[0]])
results=[]
for name in names:
    source=pathlib.Path('C:/Users/bogeu/Downloads')/(name+'.glb')
    target=ROOT/(name+'-retouched.glb')
    a,b=read(source),read(target)
    def triangles(doc):
        return sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives'])
    assert triangles(a)==triangles(b),(name,'triangle count changed')
    assert len(b['materials'])==2
    results.append({'model':name,'triangles':triangles(b),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'output_sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(ROOT/'validation.json').write_text(json.dumps(results,indent=2))
html='''<!doctype html><meta charset="utf-8"><title>건물 재질 리터칭 비교</title>
<style>body{font:16px system-ui;background:#f3f1ec;color:#26343b;margin:32px}section{max-width:1400px;margin:32px auto}h1,p{max-width:1400px;margin:16px auto}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%;border-radius:12px}a{color:#285675}span{display:block;margin-bottom:8px}</style>
<h1>건물 재질 리터칭 · 비교</h1><p>왼쪽 원본 / 오른쪽 수정본. 기존 색상 텍스처·형상·UV 유지, 비금속 재질·완화한 노멀·청회색 창유리 적용. 텍스처에 구워진 오염과 경계 번짐의 수작업 페인팅 수정은 포함하지 않음. 게임 미적용.</p>'''
for name in names:
    html+=f'<section><h2>{name}</h2><div class="pair"><div><span>원본</span><img src="{name}-before.png"></div><div><span>수정본</span><img src="{name}-after.png"></div></div><a href="{name}-retouched.glb">수정 GLB</a></section>'
(ROOT/'comparison.html').write_text(html,encoding='utf-8')
with zipfile.ZipFile(ROOT/'building-retouched-v1.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in names:
        for suffix in ['-retouched.glb','-before.png','-after.png']:
            archive.write(ROOT/(name+suffix),name+suffix)
    for filename in ['comparison.html','validation.json','report.json']:
        archive.write(ROOT/filename,filename)
print(json.dumps(results,indent=2))
