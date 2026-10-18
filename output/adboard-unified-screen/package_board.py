import pathlib,struct,json,zipfile
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parent
def read(path):
    raw=path.read_bytes(); size=struct.unpack_from('<I',raw,12)[0]
    assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
    return json.loads(raw[20:20+size]),raw[28+size:]
def accessor(doc,binary,index):
    entry=doc['accessors'][index]; view=doc['bufferViews'][entry['bufferView']]
    sizes={'VEC2':2,'VEC3':3,'SCALAR':1}; types={5126:'<f4',5123:'<u2',5125:'<u4'}
    offset=view.get('byteOffset',0)+entry.get('byteOffset',0)
    return np.frombuffer(binary,dtype=types[entry['componentType']],count=entry['count']*sizes[entry['type']],offset=offset).reshape(entry['count'],sizes[entry['type']])
original,_=read(pathlib.Path('C:/Users/bogeu/Downloads/AdBoard.glb'))
doc,binary=read(ROOT/'AdBoard-unified.glb')
node=next(n for n in doc['nodes'] if n.get('name')=='AdScreen')
primitive=doc['meshes'][node['mesh']]['primitives'][0]
assert doc['accessors'][primitive['indices']]['count']==6
positions=accessor(doc,binary,primitive['attributes']['POSITION'])
uv=accessor(doc,binary,primitive['attributes']['TEXCOORD_0'])
assert len(positions)==4
assert set(map(tuple,uv.tolist()))=={(0.,0.),(1.,0.),(1.,1.),(0.,1.)}
assert np.ptp(positions[:,2])<1e-6
material=doc['materials'][primitive['material']]
assert material['name']=='AdScreenMaterial' and 'KHR_materials_unlit' in material['extensions']
body=next(n for n in doc['nodes'] if n.get('name')=='AdBoardBody')
old_count=sum(original['accessors'][p['indices']]['count'] for m in original['meshes'] for p in m['primitives'])
new_count=sum(doc['accessors'][p['indices']]['count'] for p in doc['meshes'][body['mesh']]['primitives'])
assert old_count==new_count
report={'screen_mesh':'AdScreen','screen_material':'AdScreenMaterial','screen_vertices':4,'screen_triangles':2,'uv_full_rectangle':True,'screen_planar':True,'unlit_extension_exported':True,'body_triangle_count_preserved':old_count//3,'default_display':'blank','advertisement_playback_implemented':False}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2))
(ROOT/'광고화면_사용안내.txt').write_text('''광고판 단일 화면 수정본

파일: AdBoard-unified.glb
편집 원본: AdBoard-unified.blend
화면 메시: AdScreen
화면 재질: AdScreenMaterial

기존 목재 프레임·기둥·장식·버튼 본체를 보존하고,
프레임 안쪽의 기존 분할 화면 앞에 불투명 단일 화면을 배치했습니다.
기존 본체의 분할 표면은 새 화면 뒤에 가려져 있습니다.
화면은 평면 사각형 1개(내보낸 GLB에서는 삼각형 2개)이며 UV 전체 0~1을 사용합니다.
기존 프레임 비율 약 2.383:1 유지. 권장 광고 이미지 크기 1440x604.
16:9 광고를 사용할 때는 런타임에서 여백 맞춤/잘라내기 방식을 선택하면 됩니다.

기본 상태는 빈 검은 화면입니다. 화면 메시의 AdScreenMaterial에 있는
baseColorTexture만 광고 이미지로 바꾸면 화면 전체에 표시됩니다.
재질은 KHR_materials_unlit을 사용하므로 광고 자체의 색이 조명에 영향을 받지 않습니다.
원본 본체 재질을 바꾸지 말고 AdScreen을 이름으로 찾으세요.
동영상은 별도 런타임에서 video texture를 이 재질에 연결해야 합니다.
실제 광고 송출·네트워크·영상 재생·게임 연결은 아직 구현하지 않았습니다.

AdScreen-uv-test.png는 연결 검사용 격자 이미지입니다.
AdBoard-ad-test.png / AdBoard-test-front.png에서 중앙 이음선 없는 전체 매핑을 확인할 수 있습니다.
원본 Downloads/AdBoard.glb 보존. 게임 미적용.
''',encoding='utf-8')
(ROOT/'comparison.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>광고판 단일 화면</title><style>body{font:16px system-ui;background:#f3f1ec;color:#26343b;margin:32px}main{max-width:1400px;margin:auto}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{width:100%;border-radius:12px}p{line-height:1.8}a{color:#285675}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><main><h1>광고판 · 이음선 없는 단일 화면</h1><p>기존 프레임 안에 광고 전용 단일 평면을 넣었습니다. 화면 메시 <b>AdScreen</b> / 재질 <b>AdScreenMaterial</b>. 광고 이미지 하나를 화면 전체에 적용할 수 있습니다. 약 2.383:1 비율·권장 1440×604. 원본 보존 / 게임·광고 재생 연결 미적용.</p><div class="pair"><div><h2>원본</h2><img src="AdBoard-before.png"></div><div><h2>수정본 · 기본 빈 화면</h2><img src="AdBoard-after.png"></div></div><h2>이미지 연결 검증</h2><p>다음 격자는 테스트 이미지이며 기본 GLB에는 빈 화면이 들어 있습니다.</p><div class="pair"><img src="AdBoard-ad-test.png"><img src="AdBoard-test-front.png"></div><p><a href="AdBoard-unified.glb">수정 GLB</a> · <a href="AdBoard-unified.blend">Blender 편집 원본</a> · <a href="광고화면_사용안내.txt">화면 연결 안내</a></p></main></html>''',encoding='utf-8')
with zipfile.ZipFile(ROOT/'AdBoard-unified.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in ['AdBoard-unified.glb','AdBoard-unified.blend','AdBoard-before.png','AdBoard-after.png','AdBoard-ad-test.png','AdBoard-test-front.png','AdScreen-blank.png','AdScreen-uv-test.png','screen-info.json','validation.json','comparison.html','광고화면_사용안내.txt']:
        archive.write(ROOT/name,name)
print(json.dumps(report,indent=2))
