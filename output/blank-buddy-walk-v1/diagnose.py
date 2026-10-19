import bpy, json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-inspect-v2/source.blend'))
m=next(o for o in bpy.context.scene.objects if o.type=='MESH')
s=bpy.context.scene; cam=s.camera
cam.location=(0,6,0);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
s.cycles.samples=12
mat=m.data.materials[0]; tree=mat.node_tree
report={'bounds':[[min(v.co[a] for v in m.data.vertices),max(v.co[a] for v in m.data.vertices)] for a in range(3)],'nodes':[]}
for n in tree.nodes:
    report['nodes'].append({'name':n.name,'type':n.type,'image':n.image.name if n.type=='TEX_IMAGE' else None})
shader=next(n for n in tree.nodes if n.type=='BSDF_PRINCIPLED')
links=[l for l in tree.links if l.to_node==shader and l.to_socket.name=='Normal']
for l in links:tree.links.remove(l)
s.render.filepath=str(P/'back-no-normal.png');bpy.ops.render.render(write_still=True)
for sock in shader.inputs:
    for l in list(sock.links):tree.links.remove(l)
shader.inputs['Base Color'].default_value=(.85,.85,.85,1)
shader.inputs['Roughness'].default_value=.8;shader.inputs['Metallic'].default_value=0
s.render.filepath=str(P/'back-plain.png');bpy.ops.render.render(write_still=True)
report['vertices']=len(m.data.vertices);report['faces']=len(m.data.polygons)
(P/'diagnosis.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
