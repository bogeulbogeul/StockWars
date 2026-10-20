"""Actual recessed top surface, with the previous mat preserved."""
from pathlib import Path
import shutil
root=Path('C:/GitHub/StockWars')
out=root/'output/cipher-cozy-mat-v4'
out.mkdir(exist_ok=True)
shutil.copy2(root/'output/cipher-cozy-mat-v2/mat-texture.png',out/'mat-texture.png')
source=(root/'scratch/build-cipher-cozy-mat.py').read_text().replace('cipher-cozy-mat-v2','cipher-cozy-mat-v4')
surface='''
# Remove the flat lid; the new surface has real depth, not a normal-map illusion.
bm=bmesh.new();bm.from_mesh(obj.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.normal.z>.999],context='FACES')
bm.to_mesh(obj.data);bm.free()
pixels=list(image.pixels);iw,ih=image.size
nx,ny=600,316
surface_vertices=[]
for j in range(ny+1):
    y=(-d/2+.003)+(d-.006)*j/ny
    corner=max(0,abs(y)-(d/2-r))
    extent=w/2-r+math.sqrt(max(0,(r-.003)**2-corner**2)) if corner>0 else w/2-.003
    for i in range(nx+1):
        x=-extent+2*extent*i/nx
        u=x/w+.5;v=y/d+.5
        fx=min(iw-1,max(0,u*(iw-1)));fy=min(ih-1,max(0,v*(ih-1)))
        px=int(fx);py=int(fy);tx=fx-px;ty=fy-py
        # The ivory shapes are pressed 6mm into a 15mm mat.
        value=sum(pixels[(min(ih-1,py+oy)*iw+min(iw-1,px+ox))*4]*weight for ox,oy,weight in [(0,0,(1-tx)*(1-ty)),(1,0,tx*(1-ty)),(0,1,(1-tx)*ty),(1,1,tx*ty)])
        recess=max(0,min(1,(value-.3)/.5))
        surface_vertices.append((x,y,h-.006*recess))
surface_faces=[]
for j in range(ny):
    for i in range(nx):
        a=j*(nx+1)+i
        surface_faces.append((a,a+1,a+nx+2,a+nx+1))
topmesh=bpy.data.meshes.new('Debossed_Logo_Surface')
topmesh.from_pydata(surface_vertices,[],surface_faces);topmesh.update()
top=bpy.data.objects.new('Actual_Recessed_Logo_And_Border',topmesh);bpy.context.collection.objects.link(top)
topmesh.materials.append(paint)
uvtop=topmesh.uv_layers.new()
for face in topmesh.polygons:
    face.use_smooth=True
    for loop in face.loop_indices:
        p=topmesh.vertices[topmesh.loops[loop].vertex_index].co
        uvtop.data[loop].uv=(p.x/w+.5,p.y/d+.5)
print('DEBOSS_DEPTH', max(v.co.z for v in topmesh.vertices)-min(v.co.z for v in topmesh.vertices))
bpy.context.view_layer.objects.active=top
simplify=top.modifiers.new('Reduce_Surface_Grid','DECIMATE');simplify.ratio=.12
bpy.ops.object.modifier_apply(modifier=simplify.name)
'''
source=source.replace('bpy.ops.wm.save_as_mainfile',surface+'\nbpy.ops.wm.save_as_mainfile')
source=source.replace("data.size=4","data.size=1.5")
source += "\ncamera.location=(.65,-1.3,.9)\ncamera.rotation_euler=(Vector((0,-.05,.01))-camera.location).to_track_quat('-Z','Y').to_euler()\ncamera.data.ortho_scale=.92\nscene.render.filepath=str(out/'logo-detail.png');bpy.ops.render.render(write_still=True)\n"
exec(compile(source,str(out/'build-source.py'),'exec'))
