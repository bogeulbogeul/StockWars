from pathlib import Path
import shutil
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-cozy-mat-v8';out.mkdir(exist_ok=True)
shutil.copy2(root/'output/cipher-cozy-mat-v2/mat-texture.png',out/'mat-texture.png')
source=(root/'scratch/build-cipher-cozy-mat.py').read_text().replace('cipher-cozy-mat-v2','cipher-cozy-mat-v8')
surface='''
bm=bmesh.new();bm.from_mesh(obj.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.normal.z>.999],context='FACES')
bm.to_mesh(obj.data);bm.free()
def rr(x,y,w,d,r):
    qx=abs(x)-w/2+r;qy=abs(y)-d/2+r
    return math.hypot(max(qx,0),max(qy,0))+min(max(qx,qy),0)-r
path=[(-.13,.048),(-.045,.087),(.025,.075),(.13,.123)]
segments=list(zip(path,path[1:]))+[((.088,.122),(.13,.123)),((.13,.123),(.113,.085))]
segments=[((ax*3.15,-.18+ay*3.156),(bx*3.15,-.18+by*3.156)) for (ax,ay),(bx,by) in segments]
def distance(x,y):
    result=max(rr(x,y,1.698,.848,.063),-rr(x,y,1.659,.809,.0435))
    for cx,bh in [(-.11,.035),(-.035,.062),(.04,.092)]:
        result=min(result,rr(x-cx*3.15,y+.18-bh*3.156/2,.039*3.15,bh*3.156,.006))
    for (ax,ay),(bx,by) in segments:
        vx=bx-ax;vy=by-ay;t=max(0,min(1,((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy)))
        result=min(result,math.hypot(x-ax-t*vx,y-ay-t*vy)-.0135)
    return result
nx,ny=1200,632;vertices=[];colors=[]
for j in range(ny+1):
    y=-d/2+.003+(d-.006)*j/ny
    corner=max(0,abs(y)-(d/2-r))
    extent=w/2-r+math.sqrt(max(0,(r-.003)**2-corner**2)) if corner>0 else w/2-.003
    for i in range(nx+1):
        x=-extent+2*extent*i/nx
        t=max(0,min(1,(.003-distance(x,y))/.008));t=t*t*(3-2*t)
        vertices.append((x,y,h-.005*t))
        k=max(0,min(1,(t-.25)/.5));k=k*k*(3-2*k)
        colors.append(tuple(a+(b-a)*k for a,b in zip((.0307,.107,.216),(.896,.823,.694)))+(1,))
faces=[]
for j in range(ny):
    for i in range(nx):
        a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
mesh=bpy.data.meshes.new('Smooth_Curved_Recess');mesh.from_pydata(vertices,[],faces);mesh.update()
top=bpy.data.objects.new('Rounded_Groove_Surface',mesh);bpy.context.collection.objects.link(top)
mat=material('Uniform_Colors_Rounded_Profile',(1,1,1),1)
color=mat.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Mat_Colors'
mat.node_tree.links.new(color.outputs['Color'],mat.node_tree.nodes['Principled BSDF'].inputs['Base Color']);mesh.materials.append(mat)
attribute=mesh.color_attributes.new(name='Mat_Colors',type='FLOAT_COLOR',domain='POINT')
for i,c in enumerate(colors):attribute.data[i].color=c
for face in mesh.polygons:face.use_smooth=True
bpy.context.view_layer.objects.active=top
modifier=top.modifiers.new('Optimize_Flat_Areas','DECIMATE');modifier.ratio=.08;bpy.ops.object.modifier_apply(modifier=modifier.name)
'''
source=source.replace('bpy.ops.wm.save_as_mainfile',surface+'\nbpy.ops.wm.save_as_mainfile')
source += "\ncamera.location=(.65,-1.3,.9);camera.rotation_euler=(Vector((0,-.05,.01))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=.92\nscene.render.filepath=str(out/'logo-detail.png');bpy.ops.render.render(write_still=True)\n"
exec(compile(source,str(out/'build-source.py'),'exec'))
